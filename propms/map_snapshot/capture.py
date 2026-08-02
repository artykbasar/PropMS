from __future__ import annotations

import base64
import io
import math
import os
import shlex
import time
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urljoin, urlparse

from PIL import Image, ImageChops, ImageStat

import frappe
from frappe import _
try:
	import frappe.utils.pdf_generator.chrome_pdf_generator as chromium_process_module
	from frappe.utils.pdf_generator.cdp_connection import CDPSocketClient
	from frappe.utils.pdf_generator.chrome_pdf_generator import ChromePDFGenerator
	from frappe.utils.pdf_generator.page import Page
except ModuleNotFoundError:
	import frappe.utils.chromium.process as chromium_process_module
	from frappe.utils.chromium import CDPSocketClient
	from frappe.utils.chromium import ChromiumManager as ChromePDFGenerator
	from frappe.utils.chromium import Page

from .lifecycle import (
	BrowserLifecycleState,
	cleanup_browser_lifecycle,
	enable_child_subreaper,
	isolate_owned_process_group,
	record_owned_process_metadata,
)
from .presentation import (
	CAPTURE_CLIP_SCALE,
	CAPTURE_DEVICE_SCALE_FACTOR,
	CAPTURE_VIEWPORT_HEIGHT_CSS_PX,
	CAPTURE_VIEWPORT_WIDTH_CSS_PX,
	CAPTURE_VISIBLE_HEIGHT_CSS_PX,
	CAPTURE_VISIBLE_WIDTH_CSS_PX,
	get_map_presentation,
)
from .resolver import CaptureMapReference, resolve_capture_map
from .security import (
	CAPTURE_TOKEN_COOKIE_NAME,
	CAPTURE_TOKEN_COOKIE_PATH,
	build_capture_claim,
)


CAPTURE_ROUTE_PATH = "/internal_map_capture"
CAPTURE_SELECTOR = "#map-capture"
INITIAL_SETTLE_SECONDS = 8.0
STABILITY_INTERVAL_SECONDS = 1.5
MAX_STABILITY_SECONDS = 20.0
STABILITY_DIFF_THRESHOLD = 3.0


@dataclass(frozen=True)
class MapCaptureResult:
	png_bytes: bytes
	pixel_width: int
	pixel_height: int
	map_kind: str
	source_hash: str
	capture_duration_seconds: float
	settling_duration_seconds: float
	stability_score: float
	chromium_version: str
	cleanup_diagnostics: dict[str, object]


def _timed_send(socket, method, params=None, session_id=None, timeout=20):
	future = socket.send(method, params or {}, session_id=session_id, return_future=True)
	socket.wait_for_event(future, timeout)
	inner = future.result()
	socket.wait_for_event(inner, timeout)
	return socket._destructure_response(inner.result())


def _eval_value(page: Page, expression: str):
	result, error = _timed_send(
		page.session,
		"Runtime.evaluate",
		{"expression": expression, "returnByValue": True},
		session_id=page.session_id,
	)
	if error:
		raise RuntimeError(error)
	return result["result"].get("value")


def _viewport(page: Page):
	return _eval_value(
		page,
		"""(() => ({
  innerWidth: window.innerWidth,
  innerHeight: window.innerHeight,
  devicePixelRatio: window.devicePixelRatio,
  scrollX: window.scrollX,
  scrollY: window.scrollY,
  documentHeight: document.documentElement.scrollHeight
}))()""",
	)


def _geometry(page: Page, selector: str):
	return _eval_value(
		page,
		f"""(() => {{
  const element = document.querySelector({selector!r});
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return {{
    rectLeft: rect.left,
    rectTop: rect.top,
    rectWidth: rect.width,
    rectHeight: rect.height
  }};
}})()""",
	)


def _layout_metrics(page: Page):
	result, error = _timed_send(page.session, "Page.getLayoutMetrics", session_id=page.session_id)
	if error:
		raise RuntimeError(error)
	return result


def _corrected_clip(geometry: dict[str, float], layout: dict[str, object]) -> dict[str, float]:
	css_viewport = layout.get("cssVisualViewport") or {}
	page_x = float(css_viewport.get("pageX", 0))
	page_y = float(css_viewport.get("pageY", 0))
	document_x = float(geometry["rectLeft"]) + page_x
	document_y = float(geometry["rectTop"]) + page_y
	left = math.floor(document_x)
	top = math.floor(document_y)
	right = math.ceil(document_x + float(geometry["rectWidth"]))
	bottom = math.ceil(document_y + float(geometry["rectHeight"]))
	return {
		"x": float(left),
		"y": float(top),
		"width": float(right - left),
		"height": float(bottom - top),
		"scale": CAPTURE_CLIP_SCALE,
	}


def _capture_png_bytes(page: Page, clip: dict[str, float]):
	result, error = _timed_send(
		page.session,
		"Page.captureScreenshot",
		{
			"format": "png",
			"fromSurface": True,
			"captureBeyondViewport": False,
			"clip": clip,
		},
		session_id=page.session_id,
	)
	if error:
		raise RuntimeError(error)
	return base64.b64decode(result["data"])


def _image_metrics(image_bytes: bytes) -> dict[str, float | int]:
	with Image.open(io.BytesIO(image_bytes)) as image:
		gray = image.convert("L")
		stat = ImageStat.Stat(gray)
		thumb = image.convert("RGB").resize((64, 64))
		colors = thumb.getcolors(4096) or []
		dominant = max(colors, key=lambda item: item[0])[0] / 4096 if colors else 0.0
		return {
			"width": image.size[0],
			"height": image.size[1],
			"mean": round(stat.mean[0], 4),
			"stddev": round(stat.stddev[0], 4),
			"dominant_ratio": round(dominant, 4),
			"size": len(image_bytes),
		}


def _compare_png_bytes(left_bytes: bytes, right_bytes: bytes) -> float:
	with Image.open(io.BytesIO(left_bytes)).convert("RGB") as left, Image.open(io.BytesIO(right_bytes)).convert("RGB") as right:
		if left.size != right.size:
			raise RuntimeError("Capture stability images changed size.")
		diff = ImageChops.difference(left, right)
		stat = ImageStat.Stat(diff)
		return round(sum(stat.mean) / 3, 4)


def _validate_png_bytes(image_bytes: bytes, map_kind: str):
	metrics = _image_metrics(image_bytes)
	if image_bytes[:8] != b"\x89PNG\r\n\x1a\n":
		raise RuntimeError("Capture did not return a PNG.")
	if metrics["width"] != CAPTURE_VISIBLE_WIDTH_CSS_PX * CAPTURE_DEVICE_SCALE_FACTOR:
		raise RuntimeError("Capture width did not match expected DPR 2 output.")
	if metrics["height"] != CAPTURE_VISIBLE_HEIGHT_CSS_PX * CAPTURE_DEVICE_SCALE_FACTOR:
		raise RuntimeError("Capture height did not match expected DPR 2 output.")
	if metrics["size"] < 25000:
		raise RuntimeError("Capture output was unexpectedly small.")
	if metrics["stddev"] < 2:
		raise RuntimeError("Capture output appears visually blank.")
	if float(metrics["dominant_ratio"]) > 0.98:
		raise RuntimeError("Capture output appears uniformly filled.")
	return metrics


def _resolve_real_chromium_executable(configured_path: str) -> str:
	path = Path(configured_path or "")
	if not configured_path or not path.exists() or not path.is_file():
		return configured_path

	try:
		if path.stat().st_size > 4096:
			return configured_path
		content = path.read_text(encoding="utf-8", errors="ignore")
	except OSError:
		return configured_path

	lines = [
		line.strip()
		for line in content.splitlines()
		if line.strip() and not line.strip().startswith("#")
	]
	if len(lines) != 1:
		return configured_path

	command_line = lines[0].replace('"$@"', "").replace("'$@'", "").strip()
	if not command_line:
		return configured_path

	try:
		parts = shlex.split(command_line)
	except ValueError:
		return configured_path
	if not parts:
		return configured_path

	candidate = parts[0]
	if not os.path.isabs(candidate) or not os.path.exists(candidate) or not os.access(candidate, os.X_OK):
		return configured_path
	return candidate


def get_internal_capture_base_url() -> str:
	value = (frappe.conf.get("propms_map_capture_internal_base_url") or "").strip()
	if not value:
		raise frappe.ValidationError(_("Site config must define propms_map_capture_internal_base_url."))
	parsed = urlparse(value)
	if parsed.scheme not in {"http", "https"}:
		raise frappe.ValidationError(_("Internal capture base URL must use http or https."))
	if parsed.username or parsed.password:
		raise frappe.ValidationError(_("Internal capture base URL cannot include credentials."))
	if not parsed.hostname:
		raise frappe.ValidationError(_("Internal capture base URL must include a hostname."))
	if parsed.fragment:
		raise frappe.ValidationError(_("Internal capture base URL cannot include a fragment."))
	if (parsed.path or "").rstrip("/") not in {"", "/"}:
		raise frappe.ValidationError(_("Internal capture base URL cannot include a path."))
	allowed_hosts = {
		"127.0.0.1",
		"localhost",
		"development.localhost",
		(getattr(frappe.local, "site", "") or "").strip().lower(),
	}
	extra_hosts = str(frappe.conf.get("propms_map_capture_internal_allowed_hosts") or "")
	for configured_host in extra_hosts.replace("\n", ",").split(","):
		host = (configured_host or "").strip().lower()
		if host:
			allowed_hosts.add(host)
	if parsed.hostname.lower() not in {host for host in allowed_hosts if host}:
		raise frappe.ValidationError(_("Internal capture base URL must use an internal allowed hostname."))
	return value.rstrip("/")


def build_internal_capture_route_url(base_url: str, site_name: str) -> str:
	parsed = urlparse(base_url)
	target_site = (site_name or "").strip()
	if not target_site:
		raise frappe.ValidationError(_("Internal capture route requires a target site name."))
	netloc = target_site
	if parsed.port:
		netloc = f"{netloc}:{parsed.port}"
	return parsed._replace(netloc=netloc, path=CAPTURE_ROUTE_PATH, params="", query="", fragment="").geturl()


def build_internal_capture_host_resolver_rule(base_url: str, site_name: str) -> str | None:
	parsed = urlparse(base_url)
	target_site = (site_name or "").strip().lower()
	if not target_site or not parsed.hostname:
		return None
	internal_host = parsed.hostname.strip().lower()
	if target_site == internal_host:
		return None
	return f"MAP {target_site} {internal_host}"


def _set_capture_cookie(page: Page, route_url: str, token: str):
	parsed = urlparse(route_url)
	secure = parsed.scheme == "https"
	expires = int(time.time()) + 300
	result, error = _timed_send(
		page.session,
		"Network.setCookie",
		{
			"name": CAPTURE_TOKEN_COOKIE_NAME,
			"value": token,
			"url": route_url,
			"path": CAPTURE_TOKEN_COOKIE_PATH,
			"httpOnly": True,
			"sameSite": "Strict",
			"secure": secure,
			"expires": expires,
		},
		session_id=page.session_id,
	)
	if error or not result.get("success", False):
		raise RuntimeError("Failed to set capture cookie.")


def _ensure_google_child_frame(page: Page):
	result, error = _timed_send(page.session, "Page.getFrameTree", session_id=page.session_id)
	if error:
		raise RuntimeError(error)
	frame_tree = result.get("frameTree") or {}
	child_frames = frame_tree.get("childFrames") or []
	if not child_frames:
		raise RuntimeError("Google map iframe did not attach.")
	return frame_tree


def _wait_for_stable_capture(page: Page, selector: str) -> tuple[bytes, float]:
	start = time.monotonic()
	last_diff = None
	while time.monotonic() - start <= MAX_STABILITY_SECONDS:
		geometry = _geometry(page, selector)
		if not geometry:
			raise RuntimeError("Map capture wrapper was not found.")
		layout = _layout_metrics(page)
		clip = _corrected_clip(geometry, layout)
		first_bytes = _capture_png_bytes(page, clip)
		time.sleep(STABILITY_INTERVAL_SECONDS)
		second_bytes = _capture_png_bytes(page, clip)
		last_diff = _compare_png_bytes(first_bytes, second_bytes)
		if last_diff <= STABILITY_DIFF_THRESHOLD:
			return second_bytes, last_diff
	raise RuntimeError(f"Map capture did not stabilise within {MAX_STABILITY_SECONDS} seconds (last diff {last_diff}).")


def _navigate_capture_page(session: CDPSocketClient, page: Page, route_url: str):
	waiter = page.wait_for_load(["load", "DOMContentLoaded"], timeout=60)
	_timed_send(session, "Page.navigate", {"url": route_url}, session_id=page.session_id)
	waiter()
	_timed_send(session, "Page.bringToFront", session_id=page.session_id)


def capture_map_png(
	property_instruction: str,
	map_key: str,
	row_name: str | None = None,
	expected_source_hash: str | None = None,
) -> MapCaptureResult:
	started_at = time.monotonic()
	resolved = resolve_capture_map(CaptureMapReference(property_instruction=property_instruction, map_key=map_key, row_name=row_name))
	if expected_source_hash and expected_source_hash != resolved.source_hash:
		raise frappe.ValidationError(_("Map capture source hash changed before capture."))
	base_url = get_internal_capture_base_url()
	route_url = build_internal_capture_route_url(base_url, frappe.local.site)
	host_resolver_rule = build_internal_capture_host_resolver_rule(base_url, frappe.local.site)
	token = build_capture_claim(
		property_instruction=resolved.property_instruction,
		map_key=resolved.map_key,
		row_name=resolved.row_name,
		expected_source_hash=resolved.source_hash,
	)

	lifecycle_state = BrowserLifecycleState()
	lifecycle_state.diagnostics["child_subreaper_enabled"] = enable_child_subreaper()
	settling_started_at = None
	stability_score = 0.0
	chromium_version = ""
	original_chromium_finder = chromium_process_module.find_or_download_chromium_executable
	original_start_chromium_process = ChromePDFGenerator._start_chromium_process
	try:
		had_instance = ChromePDFGenerator._instance is not None
		had_process = bool(
			had_instance
			and ChromePDFGenerator._instance
			and ChromePDFGenerator._instance._chromium_process
			and ChromePDFGenerator._instance._chromium_process.poll() is None
		)
		def _patched_find_or_download_chromium_executable():
			configured_path = original_chromium_finder()
			resolved_path = _resolve_real_chromium_executable(configured_path)
			lifecycle_state.diagnostics["configured_chromium_path"] = configured_path
			lifecycle_state.diagnostics["resolved_chromium_path"] = resolved_path
			return resolved_path

		chromium_process_module.find_or_download_chromium_executable = (
			_patched_find_or_download_chromium_executable
		)
		def _patched_start_chromium_process(self, command_args):
			augmented_args = list(command_args)
			if host_resolver_rule:
				augmented_args.append(f"--host-resolver-rules={host_resolver_rule}")
			return original_start_chromium_process(self, augmented_args)

		ChromePDFGenerator._start_chromium_process = _patched_start_chromium_process
		generator = ChromePDFGenerator()
		lifecycle_state.generator = generator
		lifecycle_state.owned_generator = not had_process
		lifecycle_state.owned_process = generator._chromium_process
		lifecycle_state.diagnostics["capture_route_url"] = route_url
		lifecycle_state.diagnostics["capture_target_site"] = frappe.local.site
		lifecycle_state.diagnostics["capture_host_resolver_rule"] = host_resolver_rule
		isolate_owned_process_group(lifecycle_state)
		if not generator._devtools_url:
			generator._set_devtools_url()
		record_owned_process_metadata(lifecycle_state)
		session = CDPSocketClient(generator._devtools_url)
		session.connect()
		lifecycle_state.session = session
		result, error = _timed_send(session, "Target.createBrowserContext", {"disposeOnDetach": True})
		if error:
			raise RuntimeError(error)
		lifecycle_state.browser_context_id = result["browserContextId"]
		page = Page(session, lifecycle_state.browser_context_id, "propms-map-capture")
		lifecycle_state.page = page
		page.set_media_emulation("screen")
		_timed_send(
			session,
			"Target.setAutoAttach",
			{"autoAttach": True, "waitForDebuggerOnStart": False, "flatten": True},
			session_id=page.session_id,
		)
		_timed_send(
			session,
			"Emulation.setDeviceMetricsOverride",
			{
				"width": CAPTURE_VIEWPORT_WIDTH_CSS_PX,
				"height": CAPTURE_VIEWPORT_HEIGHT_CSS_PX,
				"deviceScaleFactor": CAPTURE_DEVICE_SCALE_FACTOR,
				"mobile": False,
				"screenWidth": CAPTURE_VIEWPORT_WIDTH_CSS_PX,
				"screenHeight": CAPTURE_VIEWPORT_HEIGHT_CSS_PX,
			},
			session_id=page.session_id,
		)
		_timed_send(
			session,
			"Emulation.setVisibleSize",
			{"width": CAPTURE_VIEWPORT_WIDTH_CSS_PX, "height": CAPTURE_VIEWPORT_HEIGHT_CSS_PX},
			session_id=page.session_id,
		)
		result, error = _timed_send(session, "Browser.getVersion")
		if not error:
			chromium_version = str(result.get("product") or "")
		_timed_send(session, "Network.enable", session_id=page.session_id)
		_timed_send(session, "Runtime.enable", session_id=page.session_id)
		_timed_send(session, "Page.enable", session_id=page.session_id)
		_set_capture_cookie(page, route_url, token)
		_navigate_capture_page(session, page, route_url)
		viewport = _viewport(page)
		if viewport["innerWidth"] != CAPTURE_VIEWPORT_WIDTH_CSS_PX or viewport["innerHeight"] != CAPTURE_VIEWPORT_HEIGHT_CSS_PX:
			raise RuntimeError("Unexpected capture viewport dimensions.")
		if int(round(viewport["devicePixelRatio"])) != CAPTURE_DEVICE_SCALE_FACTOR:
			raise RuntimeError("Unexpected capture device pixel ratio.")
		geometry = _geometry(page, CAPTURE_SELECTOR)
		if not geometry:
			raise RuntimeError("Map capture wrapper was not found.")
		_ensure_google_child_frame(page)
		settling_started_at = time.monotonic()
		time.sleep(INITIAL_SETTLE_SECONDS)
		png_bytes, stability_score = _wait_for_stable_capture(page, CAPTURE_SELECTOR)
		metrics = _validate_png_bytes(png_bytes, resolved.map_kind)
		cleanup_diagnostics = cleanup_browser_lifecycle(lifecycle_state)
		cleanup_diagnostics.update(lifecycle_state.diagnostics)
		lifecycle_state.page = None
		lifecycle_state.session = None
		lifecycle_state.browser_context_id = None
		lifecycle_state.generator = None
		return MapCaptureResult(
			png_bytes=png_bytes,
			pixel_width=int(metrics["width"]),
			pixel_height=int(metrics["height"]),
			map_kind=resolved.map_kind,
			source_hash=resolved.source_hash,
			capture_duration_seconds=round(time.monotonic() - started_at, 3),
			settling_duration_seconds=round(time.monotonic() - (settling_started_at or started_at), 3),
			stability_score=float(stability_score),
			chromium_version=chromium_version,
			cleanup_diagnostics=cleanup_diagnostics,
		)
	finally:
		chromium_process_module.find_or_download_chromium_executable = original_chromium_finder
		ChromePDFGenerator._start_chromium_process = original_start_chromium_process
		if lifecycle_state.page or lifecycle_state.session or lifecycle_state.browser_context_id or lifecycle_state.generator:
			lifecycle_state.diagnostics = cleanup_browser_lifecycle(lifecycle_state)
