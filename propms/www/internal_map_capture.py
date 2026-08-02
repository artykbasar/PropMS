from __future__ import annotations

import frappe
from frappe import _
from werkzeug.datastructures import Headers

from propms.map_snapshot.presentation import get_map_presentation_context
from propms.map_snapshot.resolver import CaptureMapReference, resolve_capture_map
from propms.map_snapshot.security import (
	CAPTURE_TOKEN_COOKIE_NAME,
	MapCaptureSecurityError,
	parse_and_verify_capture_claim,
)


sitemap = 0


def _ensure_capture_headers():
	if not hasattr(frappe.local, "response_headers") or frappe.local.response_headers is None:
		frappe.local.response_headers = Headers()
	response_headers = frappe.local.response_headers
	response_headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
	response_headers["Pragma"] = "no-cache"
	response_headers["X-Robots-Tag"] = "noindex, nofollow, noarchive"
	response_headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
	response_headers["Content-Security-Policy"] = "frame-ancestors 'none'"
	return response_headers


def _not_found():
	raise frappe.DoesNotExistError(_("Not found"))


def _get_capture_claim():
	request = getattr(frappe.local, "request", None)
	if request is None:
		_not_found()
	token = (getattr(request, "cookies", None) or {}).get(CAPTURE_TOKEN_COOKIE_NAME)
	if not token:
		_not_found()
	try:
		return parse_and_verify_capture_claim(token)
	except MapCaptureSecurityError:
		_not_found()


def get_context(context):
	_ensure_capture_headers()
	claim = _get_capture_claim()
	try:
		resolved = resolve_capture_map(
			CaptureMapReference(
				property_instruction=claim.property_instruction,
				map_key=claim.map_key,
				row_name=claim.row_name,
			)
		)
	except (frappe.DoesNotExistError, frappe.ValidationError, frappe.PermissionError):
		_not_found()
	if resolved.source_hash != claim.expected_source_hash:
		_not_found()
	presentation = get_map_presentation_context(resolved.map_kind)

	context.no_cache = 1
	context.no_breadcrumbs = 1
	context.sitemap = 0
	context.doc = None
	context.map_embed_url = resolved.embed_url
	context.map_kind = resolved.map_kind
	context.map_kind_class = presentation["map_kind_class"]
	context.map_title = resolved.title
	context.map_external_url = resolved.external_url
	context.map_key = resolved.map_key
	context.map_row_name = resolved.row_name
	context.map_source_hash = resolved.source_hash
	context.my_maps_header_crop_px = presentation["my_maps_header_crop_px"]
	context.my_maps_presentation_version = presentation["my_maps_presentation_version"]
	context.capture_visible_width_css_px = presentation["capture_visible_width_css_px"]
	context.capture_visible_height_css_px = presentation["capture_visible_height_css_px"]
	context.capture_viewport_width_css_px = presentation["capture_viewport_width_css_px"]
	context.capture_viewport_height_css_px = presentation["capture_viewport_height_css_px"]
	context.capture_device_scale_factor = presentation["capture_device_scale_factor"]
	context.capture_clip_scale = presentation["capture_clip_scale"]
	context.capture_implementation_version = presentation["capture_implementation_version"]
	context.capture_template_version = presentation["capture_template_version"]
	context.capture_presentation_descriptor = presentation["presentation_descriptor"]
	return context
