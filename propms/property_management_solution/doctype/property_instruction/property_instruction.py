# Copyright (c) 2026, contributors

from __future__ import annotations

import json
import mimetypes
import os
import re
import socket
from datetime import timedelta
from ipaddress import ip_address
from urllib.error import HTTPError
from urllib.parse import quote, urlencode, urljoin, urlparse, urlunparse
from urllib.request import HTTPRedirectHandler, Request, build_opener

import frappe
from frappe import _
from frappe.model.naming import make_autoname
from frappe.utils import cint, formatdate, get_bench_path, sanitize_html, validate_url
from frappe.website.website_generator import WebsiteGenerator
from markupsafe import Markup
from werkzeug.datastructures import Headers


SECTION_OPTIONS = [
	"Finding the Property",
	"Check-In",
	"Parking",
	"WiFi",
	"During Your Stay",
	"Rubbish",
	"House Rules",
	"Check-Out",
	"Emergency",
]

MAP_TYPES = {"roadmap", "satellite"}
DEFAULT_MAP_ZOOM = 16
MIN_MAP_ZOOM = 0
MAX_MAP_ZOOM = 21
GOOGLE_TRANSLATE_SCRIPT_BASE_URL = "https://translate.google.com/translate_a/element.js"
TRUSTED_GOOGLE_MAP_HOSTS = {"www.google.com", "google.com", "maps.google.com"}
TRUSTED_EXTERNAL_PDF_IMAGE_HOSTS = {"maps.googleapis.com", "tile.openstreetmap.org"}
LANGUAGE_CODE_PATTERN = re.compile(r"^[a-z]{2,3}(?:-[a-z]{2,8})*$")
PHONE_PATTERN = re.compile(r"(?:\+?\d[\d\s().-]{6,}\d)")
EMAIL_PATTERN = re.compile(r"\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b")
ROAD_NAME_PATTERN = re.compile(
	r"\b(?:Road|Street|Lane|Avenue|Close|Drive|Way|Court|Crescent|Place|Gardens|Terrace|Park|Square)\b",
	re.IGNORECASE,
)
GOOGLE_MAP_AT_PATTERN = re.compile(r"@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)")
COORDINATE_TEXT_PATTERN = re.compile(r"(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)")
NOINDEX_ROBOTS_CONTENT = "noindex, nofollow, noarchive, nosnippet, noimageindex"
GUEST_GUIDE_EXCLUDED_WEB_ASSET_PREFIXES = (
	"/assets/propms/day/assets/",
)
PUBLIC_SITE_IMAGE_PREFIXES = ("/files/", "/private/files/")
LOCAL_DEVELOPMENT_IMAGE_HOSTS = {"localhost", "127.0.0.1", "development.localhost"}
PUBLIC_PDF_IMAGE_MAX_REDIRECTS = 3
PUBLIC_PDF_IMAGE_MAX_BYTES = 8 * 1024 * 1024
PUBLIC_PDF_IMAGE_TIMEOUT_SECONDS = 15
PUBLIC_PDF_IMAGE_ALLOWED_CONTENT_TYPES = {
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/gif",
	"image/avif",
}


class PropertyInstruction(WebsiteGenerator):
	website = frappe._dict(
		template="templates/generators/property_instruction.html",
		condition_field="published",
		page_title_field="title",
	)

	def autoname(self):
		if not self.name:
			self.name = make_autoname("PI-.#####")

	def validate(self):
		self.ensure_single_instruction_per_property()
		self.set_slug()
		self.set_route_from_slug()
		self.validate_unique_slug_and_route()
		self.normalize_map_fields()
		self.normalize_blocks()
		self.validate_links()
		super().validate()

	def make_route(self):
		return f"instructions/{self.slug}"

	def set_slug(self):
		source = self.slug or self.title
		self.slug = self.scrub(source)
		if not self.slug:
			frappe.throw(_("A valid slug could not be generated. Please update the title or slug."))

	def set_route_from_slug(self):
		self.route = f"instructions/{self.slug}"

	def ensure_single_instruction_per_property(self):
		existing = frappe.db.exists(
			self.doctype,
			{
				"property": self.property,
				"name": ["!=", self.name],
			},
		)
		if existing:
			frappe.throw(
				_("Property {0} already has a Property Instruction: {1}").format(
					frappe.bold(self.property), frappe.bold(existing)
				)
			)

	def validate_unique_slug_and_route(self):
		for fieldname in ("slug", "route"):
			value = self.get(fieldname)
			if not value:
				continue
			existing = frappe.db.exists(
				self.doctype,
				{
					fieldname: value,
					"name": ["!=", self.name],
				},
			)
			if existing:
				frappe.throw(
					_("Another Property Instruction already uses {0}: {1}").format(
						frappe.bold(fieldname), frappe.bold(value)
					)
				)

	def normalize_blocks(self):
		for block in self.instruction_blocks or []:
			if not block.sort_order:
				block.sort_order = block.idx

	def validate_links(self):
		if self.google_maps_url:
			self.validate_google_maps_url()

		for row in self.instruction_blocks or []:
			if row.link_url:
				self.validate_external_link(row.link_url, _("Instruction Block #{0} link").format(row.idx))
			if row.block_type == "Link" and not row.link_url:
				frappe.throw(_("Instruction Block #{0} is missing a link URL.").format(row.idx))

	def validate_external_link(self, url, label):
		parsed = urlparse((url or "").strip())
		if parsed.scheme.lower() == "javascript":
			frappe.throw(_("{0} cannot use a javascript: URL.").format(label))
		validate_url(url, throw=True, valid_schemes={"http", "https"})

	def validate_google_maps_url(self):
		self.validate_external_link(self.google_maps_url, _("Google Maps URL"))
		hostname = (urlparse((self.google_maps_url or "").strip()).hostname or "").lower()
		if hostname not in TRUSTED_GOOGLE_MAP_HOSTS:
			frappe.throw(_("Google Maps URL must use a trusted Google Maps hostname."))

	def get_page_info(self):
		page_info = super().get_page_info()
		page_info.full_width = 1
		page_info.title = self.title
		return page_info

	def get_context(self, context):
		page_context = self.get_public_render_context()

		context.no_cache = 1
		context.no_breadcrumbs = 1
		context.sitemap = 0
		context.body_class = "guest-guide-page"
		context.web_include_css = self.get_guest_guide_web_assets(getattr(context, "web_include_css", None), "css")
		context.web_include_js = self.get_guest_guide_web_assets(getattr(context, "web_include_js", None), "js")
		context.update(page_context)
		context.metatags = frappe._dict(context.get("metatags") or {})
		context.metatags["robots"] = NOINDEX_ROBOTS_CONTENT
		if not getattr(context, "boot", None):
			context.boot = frappe._dict()
		elif isinstance(context.boot, dict) and not isinstance(context.boot, frappe._dict):
			context.boot = frappe._dict(context.boot)
		context.boot.lang = page_context.selected_language_code
		self.set_noindex_response_header()
		return context

	def get_public_render_context(self):
		property_map = self.get_property_map()
		map_static_image_url = self.get_public_pdf_image_src(property_map.static_image_url)
		google_translate = self.get_google_translate_settings()
		wifi_password_public = self.get_public_wifi_password()
		return frappe._dict(
			title=self.title,
			page_title=self.title,
			noindex_robots_content=NOINDEX_ROBOTS_CONTENT,
			sections=self.get_grouped_blocks(),
			has_sections=bool(self.get_grouped_blocks()),
			address=self.address,
			cover_image=self.get_public_pdf_image_src(self.cover_image),
			google_maps_url=property_map.external_url,
			map_embed_url=property_map.embed_url,
			map_embed_enabled=bool(property_map.embed_url),
			map_display_query=self.get_map_display_query(),
			map_zoom=self.map_zoom,
			map_type=self.map_type,
			show_embedded_map=bool(cint(self.show_embedded_map or 0)),
			google_maps_place_id=self.google_maps_place_id,
			map_search_query=self.map_search_query,
			property_map=property_map,
			map_static_image_url=map_static_image_url,
			check_in_time=self.format_display_time(self.check_in_time),
			check_out_time=self.format_display_time(self.check_out_time),
			wifi_name=self.wifi_name,
			wifi_password_public=wifi_password_public,
			emergency_contact=self.emergency_contact,
			emergency_contact_translation_protected=self.should_protect_identifier_value(self.emergency_contact),
			last_reviewed_on=self.last_reviewed_on,
			last_reviewed_on_display=formatdate(self.last_reviewed_on) if self.last_reviewed_on else None,
			selected_language_code=google_translate.source_language or "en",
			selected_language_name="English",
			google_translate=google_translate,
			pdf_download_filename=self.get_pdf_filename(),
		)

	def get_grouped_blocks(self):
		grouped = []
		sorted_rows = sorted(
			self.instruction_blocks or [],
			key=lambda row: ((row.sort_order or row.idx or 0), row.idx or 0),
		)

		for section in SECTION_OPTIONS:
			section_blocks = []
			step_counter = 0
			for row in sorted_rows:
				if row.section != section or not self.block_has_content(row):
					continue
				if row.block_type == "Step":
					step_counter += 1
				section_blocks.append(
					frappe._dict(
						row.as_dict(),
						title_translation_protected=self.should_protect_identifier_value(row.title),
						body_translation_protected=self.should_protect_body_value(row.body),
						caption_translation_protected=self.should_protect_identifier_value(row.caption),
						display_section=section,
						safe_body=self.get_safe_body(row.body),
						anchor=self.scrub(section),
						display_step_number=row.step_number or step_counter or None,
						display_link_label=row.link_label or row.link_url,
						image=self.get_public_pdf_image_src(row.image),
						display_link_label_translation_protected=self.should_protect_identifier_value(
							row.link_label or row.link_url
						),
						image_alt=row.caption or row.title or f"{self.title} - {section}",
						hide_in_print=self.should_hide_block_in_print(row, self.get_map_external_url()),
					)
				)

			if section_blocks:
				grouped.append(
					frappe._dict(
						section=section,
						anchor=self.scrub(section),
						blocks=section_blocks,
					)
				)

		return grouped

	def normalize_map_fields(self):
		self.show_embedded_map = cint(self.show_embedded_map or 0)
		self.google_maps_place_id = (self.google_maps_place_id or "").strip()
		self.map_search_query = (self.map_search_query or "").strip()
		self.map_zoom = self.normalize_map_zoom(self.map_zoom)
		if (self.map_type or "").strip().lower() not in MAP_TYPES:
			self.map_type = "roadmap"
		else:
			self.map_type = self.map_type.strip().lower()

	def normalize_map_zoom(self, value):
		zoom = cint(value or DEFAULT_MAP_ZOOM)
		if zoom < MIN_MAP_ZOOM or zoom > MAX_MAP_ZOOM:
			return DEFAULT_MAP_ZOOM
		return zoom

	def get_map_embed_api_key(self):
		return frappe.conf.get("google_maps_embed_api_key") or os.environ.get("GOOGLE_MAPS_EMBED_API_KEY")

	def get_map_display_query(self):
		if self.google_maps_place_id:
			return f"place_id:{self.google_maps_place_id}"
		return (self.map_search_query or self.address or "").strip()

	def get_property_map(self):
		embed_url = self.get_map_embed_url()
		coordinates = self.get_map_coordinates()
		return frappe._dict(
			embed_url=embed_url,
			external_url=self.get_map_external_url(),
			static_image_url=self.get_static_map_image_url(),
			latitude=coordinates.latitude if coordinates else None,
			longitude=coordinates.longitude if coordinates else None,
			coordinate_source=coordinates.source if coordinates else None,
			map_zoom=self.normalize_map_zoom(self.map_zoom),
			parking_zoom=max(14, min(15, self.normalize_map_zoom(self.map_zoom))),
			uses_api_key=bool(embed_url and "embed/v1/place" in embed_url),
		)

	def get_map_coordinates(self):
		property_coordinates = self.get_property_coordinates()
		if property_coordinates:
			return property_coordinates

		return self.parse_map_coordinates_from_url(self.google_maps_url)

	def get_property_coordinates(self):
		if not self.property:
			return None

		try:
			property_doc = frappe.get_cached_doc("Property", self.property)
		except Exception:
			return None

		for latitude_field, longitude_field in (
			("latitude", "longitude"),
			("lat", "lng"),
			("location_latitude", "location_longitude"),
			("property_latitude", "property_longitude"),
		):
			latitude = self.parse_coordinate_value(property_doc.get(latitude_field))
			longitude = self.parse_coordinate_value(property_doc.get(longitude_field))
			if latitude is not None and longitude is not None:
				return frappe._dict(latitude=latitude, longitude=longitude, source=f"property.{latitude_field}/{longitude_field}")

		location_value = property_doc.get("location")
		parsed_location = self.parse_map_coordinates_from_text(location_value)
		if parsed_location:
			parsed_location.source = "property.location"
			return parsed_location

		return None

	def parse_coordinate_value(self, value):
		if value in (None, ""):
			return None
		try:
			return float(str(value).strip())
		except (TypeError, ValueError):
			return None

	def parse_map_coordinates_from_text(self, value):
		text = (value or "").strip()
		if not text:
			return None
		match = COORDINATE_TEXT_PATTERN.search(text)
		if not match:
			return None
		latitude = self.parse_coordinate_value(match.group(1))
		longitude = self.parse_coordinate_value(match.group(2))
		if latitude is None or longitude is None:
			return None
		return frappe._dict(latitude=latitude, longitude=longitude, source="text")

	def parse_map_coordinates_from_url(self, url):
		text = (url or "").strip()
		if not text:
			return None

		match = GOOGLE_MAP_AT_PATTERN.search(text)
		if match:
			latitude = self.parse_coordinate_value(match.group(1))
			longitude = self.parse_coordinate_value(match.group(2))
			if latitude is not None and longitude is not None:
				return frappe._dict(latitude=latitude, longitude=longitude, source="google_maps_url")

		parsed = urlparse(text)
		query_coordinates = self.parse_map_coordinates_from_text(parsed.query or "")
		if query_coordinates:
			query_coordinates.source = "google_maps_url_query"
			return query_coordinates

		return None

	def get_guest_guide_web_assets(self, existing_assets=None, asset_type="css"):
		assets = list(existing_assets or frappe.get_hooks(f"web_include_{asset_type}") or [])
		return [
			asset
			for asset in assets
			if asset and not asset.startswith(GUEST_GUIDE_EXCLUDED_WEB_ASSET_PREFIXES)
		]

	def get_map_external_url(self):
		if self.google_maps_url:
			return self.google_maps_url

		query = (self.map_search_query or self.address or "").strip()
		if not query:
			return None

		params = {"api": 1, "query": query}
		if self.google_maps_place_id:
			params["query_place_id"] = self.google_maps_place_id
		return f"https://www.google.com/maps/search/?{urlencode(params)}"

	def get_map_embed_url(self):
		if not cint(self.show_embedded_map):
			return None

		query = self.get_map_display_query()
		if not query:
			return None

		api_key = self.get_map_embed_api_key()
		if api_key:
			params = {
				"key": api_key,
				"q": query,
				"zoom": self.normalize_map_zoom(self.map_zoom),
				"maptype": self.map_type if self.map_type in MAP_TYPES else "roadmap",
			}
			return f"https://www.google.com/maps/embed/v1/place?{urlencode(params)}"

		params = {
			"q": query,
			"z": self.normalize_map_zoom(self.map_zoom),
			"output": "embed",
		}
		if self.map_type == "satellite":
			params["t"] = "k"
		return urlunparse(("https", "www.google.com", "/maps", "", urlencode(params), ""))

	def get_static_map_image_url(self):
		query = self.get_map_display_query()
		if not query:
			return None
		api_key = self.get_map_embed_api_key()
		if not api_key:
			return None
		params = {
			"center": query,
			"zoom": self.normalize_map_zoom(self.map_zoom),
			"size": "1200x720",
			"scale": 2,
			"maptype": self.map_type if self.map_type in MAP_TYPES else "roadmap",
			"markers": query,
			"key": api_key,
		}
		return f"https://maps.googleapis.com/maps/api/staticmap?{urlencode(params)}"

	def get_google_translate_settings(self):
		enabled = cint(self.get_property_management_setting("enable_guest_guide_google_translate") or 0)
		source_language = self.normalize_language_code(
			self.get_property_management_setting("guest_guide_source_language") or "en"
		) or "en"
		language_codes = self.parse_google_translate_languages(
			self.get_property_management_setting("guest_guide_translate_languages")
		)
		callback_name = f"propmsGuestGuideTranslateInit_{self.scrub(self.name or self.slug or 'guide')}"
		config = {"pageLanguage": source_language}
		if language_codes:
			config["includedLanguages"] = ",".join(language_codes)
		return frappe._dict(
			enabled=bool(enabled),
			container_id="google_translate_element" if enabled else None,
			script_id=f"{callback_name}_script" if enabled else None,
			callback_name=callback_name if enabled else None,
			script_url=f"{GOOGLE_TRANSLATE_SCRIPT_BASE_URL}?cb={callback_name}" if enabled else None,
			source_language=source_language,
			included_languages=language_codes,
			included_languages_csv=",".join(language_codes) if language_codes else "",
			config_json=json.dumps(config),
		)

	def get_property_management_setting(self, fieldname):
		try:
			return frappe.db.get_single_value("Property Management Settings", fieldname)
		except Exception:
			return None

	def parse_google_translate_languages(self, raw_value):
		languages = []
		for value in (raw_value or "").split(","):
			code = self.normalize_language_code(value)
			if code and code not in languages:
				languages.append(code)
		return languages

	def normalize_language_code(self, value):
		code = (value or "").strip().lower()
		if not code or not LANGUAGE_CODE_PATTERN.match(code):
			return None
		return code

	def format_display_time(self, value):
		if not value:
			return None

		if isinstance(value, timedelta):
			total_seconds = int(value.total_seconds())
			hours, remainder = divmod(total_seconds, 3600)
			minutes, seconds = divmod(remainder, 60)
		else:
			text = str(value).strip()
			parts = text.split(":")
			if len(parts) < 2:
				return text
			hours = cint(parts[0])
			minutes = cint(parts[1])
			seconds = cint(parts[2].split(".")[0]) if len(parts) > 2 else 0

		if seconds:
			return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
		return f"{hours:02d}:{minutes:02d}"

	def should_hide_block_in_print(self, row, print_map_url=None):
		if row.block_type != "Link" or row.section != "Finding the Property" or not row.link_url or not print_map_url:
			return False
		hostname = (urlparse((row.link_url or "").strip()).hostname or "").lower()
		if hostname in TRUSTED_GOOGLE_MAP_HOSTS:
			return True
		return self.urls_match_for_print(row.link_url, print_map_url)

	def urls_match_for_print(self, left, right):
		left_url = urlparse((left or "").strip())
		right_url = urlparse((right or "").strip())
		if not left_url.scheme or not right_url.scheme:
			return False
		return (
			left_url.scheme.lower(),
			(left_url.netloc or "").lower(),
			left_url.path.rstrip("/"),
			left_url.query,
		) == (
			right_url.scheme.lower(),
			(right_url.netloc or "").lower(),
			right_url.path.rstrip("/"),
			right_url.query,
		)

	def get_public_wifi_password(self):
		if not self.wifi_password:
			return None
		return self.get_password("wifi_password")

	def should_protect_identifier_value(self, value):
		text = (value or "").strip()
		if not text:
			return False
		if "://" in text or text.startswith("www."):
			return True
		if EMAIL_PATTERN.search(text):
			return True
		if PHONE_PATTERN.search(text):
			return True
		return False

	def should_protect_body_value(self, value):
		text = re.sub(r"<[^>]+>", "\n", value or "")
		lines = [re.sub(r"^[\s•*.-]+", "", line).strip() for line in text.splitlines() if line.strip()]
		if not lines:
			return False
		if all(self.should_protect_identifier_value(line) for line in lines):
			return True
		return all(ROAD_NAME_PATTERN.search(line) and len(line.split()) <= 4 for line in lines)

	def get_pdf_filename(self):
		filename_stem = (
			self.slug
			if self.slug.endswith("-guide") or "guest-guide" in self.slug
			else f"{self.slug}-guest-guide"
		)
		return f"{filename_stem}.pdf"

	def get_safe_body(self, body):
		if not body:
			return ""
		return Markup(sanitize_html(body, always_sanitize=True, disallowed_tags={"script", "style"}))

	def get_public_pdf_image_src(self, value):
		text = (value or "").strip()
		if not text:
			return None

		parsed = urlparse(text)
		if not parsed.scheme:
			return text

		if not should_proxy_public_pdf_image(text):
			return text

		return (
			"/api/method/propms.property_management_solution.doctype.property_instruction.property_instruction.public_pdf_image"
			f"?url={quote(text, safe='')}"
		)

	def block_has_content(self, row):
		return any(
			[
				row.title,
				row.body,
				row.image,
				row.caption,
				row.link_url,
			]
		)

	def set_noindex_response_header(self):
		if not hasattr(frappe.local, "response_headers") or frappe.local.response_headers is None:
			frappe.local.response_headers = Headers()
		frappe.local.response_headers.set("X-Robots-Tag", NOINDEX_ROBOTS_CONTENT)


def apply_guest_guide_noindex_headers(response=None, request=None):
	request = request or getattr(frappe.local, "request", None)
	if not response or not request:
		return

	path = (getattr(request, "path", "") or "").strip()
	if path.startswith("/instructions/"):
		response.headers["X-Robots-Tag"] = NOINDEX_ROBOTS_CONTENT


def get_allowed_guest_image_hosts():
	hosts = set(TRUSTED_EXTERNAL_PDF_IMAGE_HOSTS)
	current_site = (getattr(frappe.local, "site", "") or "").strip().lower()
	if current_site:
		hosts.add(current_site)

	request = getattr(frappe.local, "request", None)
	request_host = (getattr(request, "host", "") or "").split(":", 1)[0].strip().lower()
	if request_host:
		hosts.add(request_host)

	sites_dir = os.path.join(get_bench_path(), "sites")
	if os.path.isdir(sites_dir):
		for site_name in os.listdir(sites_dir):
			if site_name.startswith(".") or site_name in {"assets"}:
				continue
			site_path = os.path.join(sites_dir, site_name)
			if not os.path.isdir(site_path):
				continue
			hosts.add(site_name.lower())
			site_config_path = os.path.join(site_path, "site_config.json")
			if not os.path.exists(site_config_path):
				continue
			try:
				with open(site_config_path) as site_config_file:
					site_config = json.load(site_config_file)
			except Exception:
				continue
			for host_name in str(site_config.get("host_name") or "").split(","):
				normalized = normalize_host_name(host_name)
				if normalized:
					hosts.add(normalized)

	hosts.update(get_property_instruction_public_image_hosts())
	return {host for host in hosts if host}


def normalize_host_name(value):
	text = (value or "").strip()
	if not text:
		return None
	parsed = urlparse(text if "://" in text else f"https://{text}")
	host = (parsed.hostname or text).strip().lower()
	return host or None


def get_property_instruction_public_image_hosts():
	hosts = set()
	for doctype, fieldname in (
		("Property Instruction", "cover_image"),
		("Property Instruction Block", "image"),
	):
		for row in frappe.get_all(
			doctype,
			filters={fieldname: ["is", "set"]},
			fields=[fieldname],
			limit_page_length=0,
		):
			value = (row.get(fieldname) or "").strip()
			if not value or "://" not in value:
				continue
			parsed = urlparse(value)
			if (parsed.scheme or "").lower() not in {"http", "https"}:
				continue
			if not (parsed.path or "").startswith(PUBLIC_SITE_IMAGE_PREFIXES):
				continue
			normalized = normalize_host_name(parsed.hostname or "")
			if normalized:
				hosts.add(normalized)
	return hosts


def normalize_registered_public_file_url(url):
	parsed = urlparse((url or "").strip())
	if not parsed.scheme or not parsed.hostname:
		return ""
	return urlunparse((parsed.scheme.lower(), parsed.netloc.lower(), parsed.path or "", "", "", ""))


def has_registered_public_file_url(url):
	normalized = normalize_registered_public_file_url(url)
	if not normalized:
		return False
	return bool(frappe.db.exists("File", {"file_url": normalized}))


def should_proxy_public_pdf_image(url):
	try:
		validate_public_pdf_image_url(url)
		return True
	except Exception:
		return has_registered_public_file_url(url)


def is_local_development_image_host(hostname):
	return hostname in LOCAL_DEVELOPMENT_IMAGE_HOSTS


def is_disallowed_public_image_ip(address, allow_local_development=False):
	ip = ip_address(address)
	if allow_local_development and ip.is_loopback:
		return False
	if ip.is_loopback or ip.is_private or ip.is_link_local or ip.is_multicast or ip.is_reserved:
		return True
	if ip.is_unspecified:
		return True
	return False


def validate_remote_public_image_host(parsed):
	hostname = (parsed.hostname or "").lower()
	allow_local_development = parsed.scheme.lower() == "http" and is_local_development_image_host(hostname)

	for family, _, _, _, sockaddr in socket.getaddrinfo(hostname, None):
		address = sockaddr[0]
		if family not in {socket.AF_INET, socket.AF_INET6}:
			continue
		if is_disallowed_public_image_ip(address, allow_local_development):
			frappe.throw(_("Image host resolved to a disallowed address."))

	return allow_local_development


def validate_public_pdf_image_url(url):
	parsed = urlparse((url or "").strip())
	hostname = (parsed.hostname or "").lower()
	allowed_hosts = get_allowed_guest_image_hosts()
	normalized_url = normalize_registered_public_file_url(url)

	if parsed.scheme.lower() not in {"https", "http"}:
		frappe.throw(_("Only HTTP and HTTPS image URLs are supported."))
	if parsed.username or parsed.password:
		frappe.throw(_("Image URLs cannot contain embedded credentials."))
	if not hostname:
		frappe.throw(_("Image host is not allowed."))
	if parsed.scheme.lower() == "http" and not is_local_development_image_host(hostname):
		frappe.throw(_("HTTP image URLs are allowed only for local development hosts."))

	path = parsed.path or ""
	is_site_file_path = path.startswith(PUBLIC_SITE_IMAGE_PREFIXES)
	is_registered_public_file = is_site_file_path and has_registered_public_file_url(normalized_url)
	if hostname not in allowed_hosts and not is_registered_public_file:
		frappe.throw(_("Image host is not allowed."))
	if hostname not in TRUSTED_EXTERNAL_PDF_IMAGE_HOSTS and not is_site_file_path:
		frappe.throw(_("Only Frappe file paths are allowed for site-hosted images."))
	if hostname in TRUSTED_EXTERNAL_PDF_IMAGE_HOSTS and hostname == "maps.googleapis.com":
		if not path.startswith("/maps/api/staticmap"):
			frappe.throw(_("Map image path is not allowed."))

	return parsed


def resolve_local_public_image(path):
	for prefix, base_parts in (
		("/files/", ("public", "files")),
		("/private/files/", ("private", "files")),
	):
		if not path.startswith(prefix):
			continue
		relative_path = os.path.normpath(path[len(prefix) :]).lstrip(os.sep)
		base_path = os.path.abspath(frappe.get_site_path(*base_parts))
		file_path = os.path.abspath(os.path.join(base_path, relative_path))
		if not file_path.startswith(base_path + os.sep) and file_path != base_path:
			frappe.throw(_("Image path is not allowed."))
		if not os.path.exists(file_path):
			return None
		if os.path.getsize(file_path) > PUBLIC_PDF_IMAGE_MAX_BYTES:
			frappe.throw(_("Image file is too large to proxy."))
		content_type = mimetypes.guess_type(file_path)[0] or "application/octet-stream"
		if content_type not in PUBLIC_PDF_IMAGE_ALLOWED_CONTENT_TYPES:
			frappe.throw(_("Only raster image files are supported for guest PDF export."))
		with open(file_path, "rb") as image_file:
			return {
				"filename": os.path.basename(file_path) or "guest-guide-image",
				"content_type": content_type,
				"content": image_file.read(),
			}
	return None


class NoRedirectPublicImageHandler(HTTPRedirectHandler):
	def redirect_request(self, req, fp, code, msg, headers, newurl):  # noqa: ARG002
		return None

	http_error_301 = HTTPRedirectHandler.http_error_302
	http_error_302 = HTTPRedirectHandler.http_error_302
	http_error_303 = HTTPRedirectHandler.http_error_302
	http_error_307 = HTTPRedirectHandler.http_error_302
	http_error_308 = HTTPRedirectHandler.http_error_302


def read_public_image_response(response):
	content_type = (response.headers.get("Content-Type", "") or "").split(";", 1)[0].strip().lower()
	if content_type not in PUBLIC_PDF_IMAGE_ALLOWED_CONTENT_TYPES:
		frappe.throw(_("Remote file is not a supported raster image."))

	content = bytearray()
	while True:
		chunk = response.read(64 * 1024)
		if not chunk:
			break
		content.extend(chunk)
		if len(content) > PUBLIC_PDF_IMAGE_MAX_BYTES:
			frappe.throw(_("Remote image is too large to proxy."))

	return {
		"content_type": content_type,
		"content": bytes(content),
	}


def fetch_remote_public_image(url):
	opener = build_opener(NoRedirectPublicImageHandler())
	current_url = url

	for _ in range(PUBLIC_PDF_IMAGE_MAX_REDIRECTS + 1):
		parsed = validate_public_pdf_image_url(current_url)
		validate_remote_public_image_host(parsed)
		request = Request(
			current_url,
			headers={
				"User-Agent": "PropMS Guest Guide PDF",
				"Accept": ",".join(sorted(PUBLIC_PDF_IMAGE_ALLOWED_CONTENT_TYPES)) + ",image/*;q=0.8",
			},
		)

		try:
			response = opener.open(request, timeout=PUBLIC_PDF_IMAGE_TIMEOUT_SECONDS)
		except HTTPError as exc:
			response = exc

		status = getattr(response, "status", None) or response.getcode()
		if status in {301, 302, 303, 307, 308}:
			location = response.headers.get("Location")
			if not location:
				frappe.throw(_("Image redirect response is missing a destination."))
			current_url = urljoin(current_url, location)
			continue

		if status >= 400:
			frappe.throw(_("Unable to fetch the requested guest guide image."))

		image_response = read_public_image_response(response)
		image_response["filename"] = os.path.basename(parsed.path) or "guest-guide-image"
		return image_response

	frappe.throw(_("Image redirected too many times."))


def resolve_public_pdf_image_target(url):
	parsed = validate_public_pdf_image_url(url)
	local_image = None
	if parsed.path.startswith(PUBLIC_SITE_IMAGE_PREFIXES):
		local_image = resolve_local_public_image(parsed.path)
	if local_image:
		return local_image
	return fetch_remote_public_image(url)


@frappe.whitelist(allow_guest=True)
def public_pdf_image(url):
	image_response = resolve_public_pdf_image_target(url)
	frappe.response["type"] = "binary"
	frappe.response["filename"] = image_response["filename"]
	frappe.response["filecontent"] = image_response["content"]
	if not hasattr(frappe.local, "response_headers") or frappe.local.response_headers is None:
		frappe.local.response_headers = Headers()
	frappe.local.response_headers.set("X-Robots-Tag", NOINDEX_ROBOTS_CONTENT)
	frappe.local.response_headers.set("Content-Type", image_response["content_type"])
	return
