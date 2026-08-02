from __future__ import annotations

from html import unescape as html_unescape
from html.parser import HTMLParser
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

import frappe
from frappe import _
from frappe.utils import validate_url


TRUSTED_GOOGLE_MAP_HOSTS = {"www.google.com", "google.com"}
TRUSTED_GOOGLE_MAP_EMBED_PATHS = {
	"/maps",
	"/maps/embed",
	"/maps/d/embed",
}


class GoogleMapsEmbedParser(HTMLParser):
	def __init__(self):
		super().__init__()
		self.iframe_attrs = None
		self.iframe_count = 0
		self.invalid_reason = ""

	def handle_starttag(self, tag, attrs):
		tag_name = (tag or "").lower()
		if tag_name != "iframe":
			self.invalid_reason = "only-iframe-embed-allowed"
			return
		self.iframe_count += 1
		if self.iframe_count > 1:
			self.invalid_reason = "multiple-iframes-not-allowed"
			return
		normalized_attrs = {}
		for key, value in attrs:
			attribute_name = (key or "").strip().lower()
			if not attribute_name:
				continue
			if attribute_name.startswith("on"):
				self.invalid_reason = "event-handler-attributes-not-allowed"
				return
			normalized_attrs[attribute_name] = value or ""
		self.iframe_attrs = normalized_attrs

	def handle_startendtag(self, tag, attrs):
		self.handle_starttag(tag, attrs)

	def handle_data(self, data):
		if data and data.strip():
			self.invalid_reason = "embed-html-must-contain-only-an-iframe"


def validate_google_maps_embed_url(url: str | None) -> str:
	text = (url or "").strip()
	validate_url(text, throw=True, valid_schemes={"http", "https"})
	parsed = urlparse(text)
	if parsed.scheme.lower() != "https":
		frappe.throw(_("Google Maps embed URL must use HTTPS."))
	if parsed.username or parsed.password:
		frappe.throw(_("Google Maps embed URL cannot include credentials."))
	hostname = (parsed.hostname or "").lower()
	if hostname not in TRUSTED_GOOGLE_MAP_HOSTS:
		frappe.throw(_("Google Maps embed URL must use a trusted Google Maps hostname."))
	if parsed.path not in TRUSTED_GOOGLE_MAP_EMBED_PATHS:
		frappe.throw(_("Google Maps embed URL must use a supported Google Maps embed path."))
	query_values = parse_qs(parsed.query or "", keep_blank_values=True)
	is_standard_embed = parsed.path == "/maps/embed"
	is_mymaps_embed = parsed.path == "/maps/d/embed"
	if parsed.fragment:
		parsed = parsed._replace(fragment="")
	if is_standard_embed or is_mymaps_embed:
		return parsed.geturl()
	if not (query_values.get("output") == ["embed"] or "pb" in query_values):
		frappe.throw(_("Google Maps embed URL must use a supported embed format."))
	return parsed.geturl()


def extract_google_maps_embed_url(embed_input: str | None) -> str | None:
	text = html_unescape((embed_input or "").strip())
	if not text:
		return None
	if "<" not in text and ">" not in text:
		return validate_google_maps_embed_url(text)
	parser = GoogleMapsEmbedParser()
	parser.feed(text)
	parser.close()
	if parser.invalid_reason:
		frappe.throw(_("Google Maps embed is invalid: {0}").format(parser.invalid_reason))
	if parser.iframe_count != 1 or not parser.iframe_attrs:
		frappe.throw(_("Google Maps embed must contain exactly one iframe."))
	iframe_attrs = parser.iframe_attrs
	if iframe_attrs.get("srcdoc"):
		frappe.throw(_("Google Maps embed cannot use srcdoc."))
	src = html_unescape((iframe_attrs.get("src") or "").strip())
	if not src:
		frappe.throw(_("Google Maps embed iframe is missing src."))
	return validate_google_maps_embed_url(src)


def normalize_google_maps_embed_input(value: str | None) -> str:
	text = (value or "").strip()
	if not text:
		return ""
	return extract_google_maps_embed_url(text) or ""


def get_google_maps_embed_kind(url: str | None) -> str:
	parsed = urlparse((url or "").strip())
	if not parsed.path:
		return ""
	if parsed.path == "/maps/d/embed":
		return "google-my-maps"
	if parsed.path in {"/maps", "/maps/embed"}:
		return "google-maps"
	return ""


def derive_google_maps_view_url(embed_url: str | None) -> str | None:
	text = (embed_url or "").strip()
	if not text:
		return None
	parsed = urlparse(text)
	if (parsed.hostname or "").lower() not in TRUSTED_GOOGLE_MAP_HOSTS:
		return None
	if parsed.path == "/maps/d/embed":
		query_values = parse_qs(parsed.query or "", keep_blank_values=True)
		mid = (query_values.get("mid") or [None])[0]
		if not mid:
			return text
		view_query = {"mid": mid}
		if query_values.get("ehbc"):
			view_query["ehbc"] = query_values["ehbc"][0]
		return urlunparse((parsed.scheme, parsed.netloc, "/maps/d/viewer", "", urlencode(view_query), ""))
	return text
