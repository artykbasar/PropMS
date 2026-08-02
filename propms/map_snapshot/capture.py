from __future__ import annotations

import base64
import html
import io
import math
import os
import re
import shlex
import time
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse

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
	CAPTURE_IMPLEMENTATION_VERSION,
	CAPTURE_VIEWPORT_HEIGHT_CSS_PX,
	CAPTURE_VIEWPORT_WIDTH_CSS_PX,
	CAPTURE_VISIBLE_HEIGHT_CSS_PX,
	CAPTURE_VISIBLE_WIDTH_CSS_PX,
	get_map_presentation_context,
)
from .resolver import CaptureMapReference, ResolvedMap, resolve_capture_map

CAPTURE_SELECTOR = "#map-capture"
INITIAL_SETTLE_SECONDS = 8.0
STABILITY_INTERVAL_SECONDS = 1.5
MAX_STABILITY_SECONDS = 20.0
STABILITY_DIFF_THRESHOLD = 3.0
# The rendered wrapper is intentionally tiny: one iframe plus fixed presentation CSS.
# A conservative cap blocks unexpected document growth before Chromium launches.
MAX_CAPTURE_DOCUMENT_BYTES = 16384
DATA_URL_REPLACEMENT = "<redacted-data-url>"
URL_REPLACEMENT = "<redacted-url>"


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


def _sanitize_trace_url(url: str | None) -> dict[str, str]:
	parsed = urlparse((url or "").strip())
	if parsed.scheme == "data":
		return {"scheme": "data", "host": "", "path": ""}
	return {
		"scheme": parsed.scheme or "",
		"host": parsed.hostname or "",
		"path": parsed.path or "",
	}


def _sanitize_sensitive_text(value: str | None) -> str:
	text = str(value or "")
	if not text:
		return ""
	text = re.sub(r"data:text/html[^)\]>\s'\"\\]+", DATA_URL_REPLACEMENT, text, flags=re.IGNORECASE)
	text = re.sub(r"https?://[^\s'\"<>]+", URL_REPLACEMENT, text, flags=re.IGNORECASE)
	return text


def _start_network_trace(page: Page, enabled: bool, max_events: int = 200) -> list[dict[str, object]]:
	trace: list[dict[str, object]] = []
	if not enabled:
		return trace

	def _append(event_type: str, response):
		if len(trace) >= max_events:
			return
		params = response.get("params") or {}
		request = params.get("request") or {}
		headers = request.get("headers") or {}
		trace.append(
			{
				"event": event_type,
				"frameId": params.get("frameId"),
				"resourceType": params.get("type") or params.get("resourceType") or "",
				"url": _sanitize_trace_url(request.get("url") or params.get("documentURL") or ""),
				"has_cookie_header": bool(headers.get("Cookie")),
				"has_frappe_site_header": "X-Frappe-Site-Name" in headers,
				"status": (params.get("response") or {}).get("status"),
			}
		)

	def _on_request(future, response):
		_append("request", response)

	def _on_response(future, response):
		_append("response", response)

	def _on_extra_info(future, response):
		if len(trace) >= max_events:
			return
		params = response.get("params") or {}
		headers = params.get("headers") or {}
		trace.append(
			{
				"event": "request-extra-info",
				"frameId": params.get("frameId"),
				"resourceType": "",
				"url": {"scheme": "", "host": "", "path": ""},
				"has_cookie_header": bool(headers.get("Cookie")),
				"has_frappe_site_header": "X-Frappe-Site-Name" in headers,
				"status": None,
			}
		)

	page.session.start_listener("Network.requestWillBeSent", _on_request, page.session_id)
	page.session.start_listener("Network.responseReceived", _on_response, page.session_id)
	page.session.start_listener("Network.requestWillBeSentExtraInfo", _on_extra_info, page.session_id)
	return trace


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


def render_capture_document_html(resolved: ResolvedMap) -> str:
	presentation = get_map_presentation_context(resolved.map_kind)
	title = html.escape(resolved.title or "Map capture", quote=True)
	embed_url = html.escape(resolved.embed_url, quote=True)
	map_key = html.escape(resolved.map_key, quote=True)
	map_kind = html.escape(presentation["map_kind"], quote=True)
	map_kind_class = html.escape(presentation["map_kind_class"], quote=True)
	map_source_hash = html.escape(resolved.source_hash, quote=True)
	row_name_attr = ""
	if resolved.row_name:
		row_name_attr = f' data-map-row-name="{html.escape(resolved.row_name, quote=True)}"'

	return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex, nofollow, noarchive">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    html,
    body {{
      width: 100%;
      height: 100%;
      margin: 0;
      overflow: hidden;
      background: #fff;
    }}

    body {{
      font-family: sans-serif;
    }}

    #map-capture {{
      position: relative;
      width: {presentation["capture_visible_width_css_px"]}px;
      height: {presentation["capture_visible_height_css_px"]}px;
      overflow: hidden;
      background: #fff;
    }}

    #map-capture iframe {{
      position: absolute;
      top: 0;
      left: 0;
      display: block;
      width: 100%;
      height: 100%;
      border: 0;
    }}

    #map-capture.custom-map-frame--google-my-maps {{
      position: relative;
      overflow: hidden;
    }}

    #map-capture.custom-map-frame--google-my-maps iframe {{
      top: calc(-1 * var(--pi-my-maps-header-crop));
      height: calc(
        100% +
        var(--pi-my-maps-header-crop) +
        var(--pi-my-maps-bottom-overscan)
      );
    }}
  </style>
</head>
<body
  style="--pi-my-maps-header-crop: {presentation["my_maps_header_crop_px"]}px; --pi-my-maps-bottom-overscan: {presentation["my_maps_bottom_overscan_px"]}px;"
  data-my-maps-presentation-version="{presentation["my_maps_presentation_version"]}"
  data-capture-implementation-version="{presentation["capture_implementation_version"]}"
  data-capture-template-version="{presentation["capture_template_version"]}"
  data-capture-map-kind="{map_kind}"
  data-capture-map-source-hash="{map_source_hash}">
  <div
    id="map-capture"
    class="custom-map-frame custom-map-frame--{map_kind_class}"
    data-map-capture-key="{map_key}"{row_name_attr}>
    <iframe
      src="{embed_url}"
      title="{title}"
      loading="eager"
      allowfullscreen
      referrerpolicy="strict-origin-when-cross-origin"></iframe>
  </div>
</body>
</html>
"""


def build_capture_document_data_url(html_document: str) -> str:
	document_bytes = html_document.encode("utf-8")
	if len(document_bytes) > MAX_CAPTURE_DOCUMENT_BYTES:
		raise frappe.ValidationError(_("Map capture document exceeded the maximum safe size."))
	return "data:text/html;charset=utf-8;base64," + base64.b64encode(document_bytes).decode("ascii")


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


def _set_capture_document(page: Page, html_document: str):
	data_url = build_capture_document_data_url(html_document)
	waiter = page.wait_for_load(["DOMContentLoaded"], timeout=60)
	_timed_send(page.session, "Page.navigate", {"url": data_url}, session_id=page.session_id)
	waiter()
	_timed_send(page.session, "Page.bringToFront", session_id=page.session_id)


def _document_identity(page: Page) -> dict[str, object]:
	value = _eval_value(
		page,
		"""(() => ({
  href: window.location.href,
  origin: window.origin,
  frameCount: window.frames.length,
  iframeSrc: (document.querySelector('#map-capture iframe') || {}).src || '',
}))()""",
	)
	return {
		"href": _sanitize_trace_url(value.get("href") or ""),
		"origin": value.get("origin") or "",
		"frameCount": value.get("frameCount") or 0,
		"iframeSrc": _sanitize_trace_url(value.get("iframeSrc") or ""),
	}


def capture_map_png(
	property_instruction: str,
	map_key: str,
	row_name: str | None = None,
	expected_source_hash: str | None = None,
	collect_network_trace: bool = False,
) -> MapCaptureResult:
	started_at = time.monotonic()
	resolved = resolve_capture_map(CaptureMapReference(property_instruction=property_instruction, map_key=map_key, row_name=row_name))
	if expected_source_hash and expected_source_hash != resolved.source_hash:
		raise frappe.ValidationError(_("Map capture source hash changed before capture."))
	document_html = render_capture_document_html(resolved)
	build_capture_document_data_url(document_html)

	lifecycle_state = BrowserLifecycleState()
	lifecycle_state.diagnostics["child_subreaper_enabled"] = enable_child_subreaper()
	settling_started_at = None
	stability_score = 0.0
	chromium_version = ""
	original_chromium_finder = chromium_process_module.find_or_download_chromium_executable
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
		generator = ChromePDFGenerator()
		lifecycle_state.generator = generator
		lifecycle_state.owned_generator = not had_process
		lifecycle_state.owned_process = generator._chromium_process
		lifecycle_state.diagnostics["capture_target_site"] = frappe.local.site
		lifecycle_state.diagnostics["capture_document_bytes"] = len(document_html.encode("utf-8"))
		lifecycle_state.diagnostics["capture_document_limit"] = MAX_CAPTURE_DOCUMENT_BYTES
		lifecycle_state.diagnostics["capture_implementation_version"] = CAPTURE_IMPLEMENTATION_VERSION
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
		network_trace = _start_network_trace(page, collect_network_trace)
		_set_capture_document(page, document_html)
		lifecycle_state.diagnostics["document_identity"] = _document_identity(page)
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
		if collect_network_trace:
			cleanup_diagnostics["network_trace"] = network_trace
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
		if lifecycle_state.page or lifecycle_state.session or lifecycle_state.browser_context_id or lifecycle_state.generator:
			lifecycle_state.diagnostics = cleanup_browser_lifecycle(lifecycle_state)
