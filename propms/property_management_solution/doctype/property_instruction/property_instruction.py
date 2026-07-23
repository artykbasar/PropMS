# Copyright (c) 2026, contributors

from __future__ import annotations

import base64
import hashlib
import hmac
import io
import json
import mimetypes
import os
import re
from datetime import timedelta
from urllib.parse import urlencode, urlparse, urlunparse

import frappe
from frappe import _
from frappe.model.naming import make_autoname
from frappe.rate_limiter import rate_limit
from frappe.utils import cint, formatdate, now_datetime, nowdate, sanitize_html, validate_url
from frappe.utils.pdf import get_pdf
from frappe.utils.verified_command import get_secret
from frappe.website.website_generator import WebsiteGenerator
from pypdf import PdfReader, PdfWriter
from markupsafe import Markup

from propms.property_management_solution.doctype.property_instruction import translation_service


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
TRANSLATION_READY = "Ready"
TRANSLATION_STALE = "Stale"
GOOGLE_TRANSLATE_SCRIPT_URL = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
TRUSTED_GOOGLE_MAP_HOSTS = {"www.google.com", "google.com", "maps.google.com"}
LANGUAGE_CODE_PATTERN = re.compile(r"^[a-z]{2,3}(?:-[a-z]{2,8})*$")
PHONE_PATTERN = re.compile(r"(?:\+?\d[\d\s().-]{6,}\d)")
EMAIL_PATTERN = re.compile(r"\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b")
CONTROL_CHAR_PATTERN = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
PDF_TOKEN_TTL_SECONDS = 30 * 60
PDF_SNAPSHOT_MAX_PAYLOAD_BYTES = 250 * 1024
PDF_SNAPSHOT_MAX_TEXT_LENGTH = 500
PDF_SNAPSHOT_MAX_BODY_LENGTH = 20 * 1024
PDF_SNAPSHOT_ALLOWED_FIELDS = {"title", "emergency_contact"}
PDF_SNAPSHOT_ALLOWED_BLOCK_FIELDS = {"title", "body", "caption", "link_label"}
PDF_SNAPSHOT_ALLOWED_KEYS = {
	"slug",
	"token",
	"display_language",
	"reviewed_language",
	"widget_language",
	"fields",
	"sections",
	"blocks",
}
PDF_SNAPSHOT_ALLOWED_BODY_TAGS = {
	"p",
	"br",
	"ul",
	"ol",
	"li",
	"strong",
	"em",
	"b",
	"i",
	"u",
	"span",
}
PDF_WIDGET_TRANSLATION_NOTE = "Machine translated using the language selected on the guest guide."
PDF_FOOTER_LINE_PATTERN = re.compile(r"^Page\s+\d+\s+of\s+\d+$")


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
		self.flags.translation_source_changed = self.translation_source_changed()
		super().validate()

	def on_update(self):
		self.mark_translations_stale_if_needed()

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
		page_context = self.get_public_render_context(self.get_requested_language())

		context.no_cache = 1
		context.no_breadcrumbs = 1
		context.update(page_context)
		if not getattr(context, "boot", None):
			context.boot = frappe._dict()
		elif isinstance(context.boot, dict) and not isinstance(context.boot, frappe._dict):
			context.boot = frappe._dict(context.boot)
		context.boot.lang = page_context.selected_language_code
		return context

	def get_public_render_context(self, language_code=None):
		language_code = self.normalize_language_code(language_code or "en") or "en"
		translation = self.get_ready_translation(language_code)
		display_content = self.get_display_content(translation)
		property_map = self.get_property_map()
		google_translate = self.get_google_translate_settings()
		available_languages = self.get_available_languages()
		wifi_password_public = self.get_public_wifi_password()
		return frappe._dict(
			title=display_content.title,
			page_title=display_content.title,
			sections=display_content.sections,
			has_sections=bool(display_content.sections),
			address=display_content.address,
			cover_image=self.cover_image,
			google_maps_url=property_map.external_url,
			map_embed_url=property_map.embed_url,
			map_embed_enabled=bool(property_map.embed_url),
			map_display_query=self.get_map_display_query(),
			property_map=property_map,
			check_in_time=self.format_display_time(self.check_in_time),
			check_out_time=self.format_display_time(self.check_out_time),
			wifi_name=self.wifi_name,
			wifi_password_public=wifi_password_public,
			show_wifi_password_publicly=bool(cint(self.show_wifi_password_publicly or 0)),
			emergency_contact=display_content.emergency_contact,
			emergency_contact_translation_protected=self.should_protect_identifier_value(
				display_content.emergency_contact
			),
			last_reviewed_on=self.last_reviewed_on,
			last_reviewed_on_display=formatdate(self.last_reviewed_on) if self.last_reviewed_on else None,
			available_languages=available_languages,
			selected_language_code=display_content.language_code,
			selected_language_name=display_content.language_name,
			translation_enabled=len(available_languages) > 1,
			reviewed_language_selector_enabled=len(available_languages) > 1 and not google_translate.enabled,
			google_translate=google_translate,
			pdf_download_url=self.get_pdf_download_url(display_content.language_code),
			pdf_snapshot_token=self.get_pdf_snapshot_token(),
			pdf_download_method="propms.property_management_solution.doctype.property_instruction.property_instruction.download_pdf",
		)

	def get_grouped_blocks(self):
		return self.build_grouped_blocks(self.instruction_blocks or [])

	def build_grouped_blocks(self, ordered_blocks, translation_map=None):
		grouped = []
		translation_map = translation_map or {}
		property_map = self.get_property_map()
		sorted_rows = sorted(
			ordered_blocks or [],
			key=lambda row: ((row.sort_order or row.idx or 0), row.idx or 0),
		)

		for section in SECTION_OPTIONS:
			section_blocks = []
			step_counter = 0
			section_label = section
			for row in sorted_rows:
				if row.section != section:
					continue
				if not self.block_has_content(row):
					continue
				translated_row = translation_map.get(row.name)
				title = translated_row.title if translated_row and translated_row.title is not None else row.title
				body = translated_row.body if translated_row and translated_row.body is not None else row.body
				caption = (
					translated_row.caption if translated_row and translated_row.caption is not None else row.caption
				)
				link_label = (
					translated_row.link_label
					if translated_row and translated_row.link_label is not None
					else row.link_label
				)
				section_label = (
					translated_row.section if translated_row and translated_row.section else section_label
				)
				if row.block_type == "Step":
					step_counter += 1
				section_blocks.append(
					frappe._dict(
						row.as_dict(),
						title=title,
						title_translation_protected=self.should_protect_identifier_value(title),
						body=body,
						caption=caption,
						caption_translation_protected=self.should_protect_identifier_value(caption),
						display_section=section_label,
						safe_body=self.get_safe_body(body),
						anchor=self.scrub(section_label),
						display_step_number=row.step_number or step_counter or None,
						display_link_label=link_label or row.link_url,
						display_link_label_translation_protected=self.should_protect_identifier_value(
							link_label or row.link_url
						),
						image_alt=caption or title or f"{self.title} - {section_label}",
						hide_in_print=self.should_hide_block_in_print(row, property_map.external_url),
					)
				)

			if section_blocks:
				grouped.append(
					frappe._dict(
						section=section_label,
						anchor=self.scrub(section_label),
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
		return frappe._dict(
			embed_url=embed_url,
			external_url=self.get_map_external_url(),
			uses_api_key=bool(embed_url and "embed/v1/place" in embed_url),
		)

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

	def get_google_translate_settings(self):
		enabled = cint(self.get_property_management_setting("enable_guest_guide_google_translate") or 0)
		source_language = self.normalize_language_code(
			self.get_property_management_setting("guest_guide_source_language") or "en"
		) or "en"
		language_codes = self.parse_google_translate_languages(
			self.get_property_management_setting("guest_guide_translate_languages")
		)
		config = {"pageLanguage": source_language}
		if language_codes:
			config["includedLanguages"] = ",".join(language_codes)
		return frappe._dict(
			enabled=bool(enabled),
			container_id="google_translate_element" if enabled else None,
			script_url=GOOGLE_TRANSLATE_SCRIPT_URL if enabled else None,
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

	def get_requested_language(self):
		language_code = None
		request = getattr(frappe.local, "request", None)
		if request and getattr(request, "args", None):
			language_code = request.args.get("lang")
		if not language_code:
			language_code = (frappe.form_dict or {}).get("lang")
		return (language_code or "en").strip().lower() or "en"

	def get_ready_translation(self, language_code):
		if not language_code or language_code == "en":
			return None

		name = frappe.db.get_value(
			"Property Instruction Translation",
			{
				"property_instruction": self.name,
				"language_code": language_code,
				"status": TRANSLATION_READY,
			},
			"name",
		)
		return frappe.get_doc("Property Instruction Translation", name) if name else None

	def get_available_languages(self):
		options = [
			frappe._dict(
				language_code="en",
				language_name="English",
				url=f"/{self.route}",
			)
		]

		for row in frappe.get_all(
			"Property Instruction Translation",
			filters={
				"property_instruction": self.name,
				"status": TRANSLATION_READY,
			},
			fields=["language_code", "language_name"],
			order_by="language_name asc, language_code asc",
		):
			options.append(
				frappe._dict(
					language_code=row.language_code,
					language_name=row.language_name or row.language_code.upper(),
					url=f"/{self.route}?lang={row.language_code}",
				)
			)

		return options

	def get_public_wifi_password(self):
		if not cint(self.show_wifi_password_publicly or 0):
			return None
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

	def get_pdf_download_url(self, language_code=None):
		params = {"slug": self.slug}
		language_code = self.normalize_language_code(language_code)
		if language_code and language_code != "en":
			params["lang"] = language_code
		return (
			"/api/method/propms.property_management_solution.doctype.property_instruction.property_instruction.download_pdf?"
			f"{urlencode(params)}"
		)

	def get_pdf_snapshot_token(self, expires_at=None):
		expires_at = expires_at or int((now_datetime() + timedelta(seconds=PDF_TOKEN_TTL_SECONDS)).timestamp())
		payload = {
			"name": self.name,
			"slug": self.slug,
			"published": 1,
			"expires_at": expires_at,
		}
		return sign_pdf_snapshot_token(payload)

	def get_display_content(self, translation=None):
		if not translation:
			return frappe._dict(
				language_code="en",
				language_name="English",
				title=self.title,
				address=self.address,
				emergency_contact=self.emergency_contact,
				sections=self.get_grouped_blocks(),
			)

		translation_map = {
			row.source_block_name: row for row in (translation.blocks or []) if row.source_block_name
		}
		return frappe._dict(
			language_code=translation.language_code,
			language_name=translation.language_name or translation.language_code.upper(),
			title=translation.title or self.title,
			address=self.address,
			emergency_contact=self.resolve_translated_emergency_contact(translation.emergency_contact),
			sections=self.build_grouped_blocks(self.instruction_blocks or [], translation_map=translation_map),
		)

	def resolve_translated_emergency_contact(self, translated_value):
		if self.should_protect_identifier_value(self.emergency_contact):
			return self.emergency_contact
		return translated_value or self.emergency_contact

	def get_translation_source_payload(self):
		return {
			"title": self.title,
			"address": self.address,
			"emergency_contact": self.emergency_contact,
			"blocks": [
				{
					"source_block_name": row.name,
					"section": row.section,
					"title": row.title,
					"body": row.body,
					"caption": row.caption,
					"link_label": row.link_label,
					"sort_order": row.sort_order or row.idx,
				}
				for row in sorted(
					self.instruction_blocks or [],
					key=lambda block: ((block.sort_order or block.idx or 0), block.idx or 0),
				)
				if self.block_has_content(row)
			],
		}

	def generate_translation(self, language_code, language_name=None):
		if self.is_new():
			frappe.throw(_("Please save the Property Instruction before generating a translation."))

		language_code = (language_code or "").strip().lower()
		if not language_code or language_code == "en":
			frappe.throw(_("Please choose a non-English target language."))

		translated = translation_service.translate_property_instruction(
			self.get_translation_source_payload(),
			target_language=language_code,
			source_language="en",
		)

		existing_name = frappe.db.get_value(
			"Property Instruction Translation",
			{
				"property_instruction": self.name,
				"language_code": language_code,
			},
			"name",
		)
		doc = (
			frappe.get_doc("Property Instruction Translation", existing_name)
			if existing_name
			else frappe.new_doc("Property Instruction Translation")
		)
		doc.property_instruction = self.name
		doc.language_code = language_code
		doc.language_name = (language_name or doc.language_name or language_code.upper()).strip()
		doc.status = "Draft"
		doc.source_modified = self.modified
		doc.title = translated.get("title") or self.title
		doc.address = self.address
		doc.emergency_contact = self.resolve_translated_emergency_contact(
			translated.get("emergency_contact")
		)
		doc.blocks = []
		for block in translated.get("blocks") or []:
			doc.append("blocks", block)
		doc.save(ignore_permissions=True)
		return {
			"name": doc.name,
			"status": doc.status,
			"language_code": doc.language_code,
		}

	def translation_source_changed(self):
		previous = self.get_doc_before_save()
		if not previous:
			return False
		return self.get_source_signature(previous) != self.get_source_signature(self)

	def get_source_signature(self, doc):
		return {
			"title": doc.title,
			"address": doc.address,
			"google_maps_url": doc.google_maps_url,
			"show_embedded_map": cint(doc.show_embedded_map or 0),
			"google_maps_place_id": doc.google_maps_place_id,
			"map_search_query": doc.map_search_query,
			"map_zoom": cint(doc.map_zoom or 0),
			"map_type": doc.map_type,
			"check_in_time": str(doc.check_in_time or ""),
			"check_out_time": str(doc.check_out_time or ""),
			"wifi_name": doc.wifi_name,
			"emergency_contact": doc.emergency_contact,
			"published": cint(doc.published or 0),
			"blocks": [
				{
					"name": row.name,
					"section": row.section,
					"block_type": row.block_type,
					"step_number": row.step_number,
					"title": row.title,
					"body": row.body,
					"image": row.image,
					"caption": row.caption,
					"link_url": row.link_url,
					"link_label": row.link_label,
					"sort_order": row.sort_order,
					"idx": row.idx,
				}
				for row in doc.instruction_blocks or []
			],
		}

	def mark_translations_stale_if_needed(self):
		if not self.flags.translation_source_changed:
			return

		for name in frappe.get_all(
			"Property Instruction Translation",
			filters={
				"property_instruction": self.name,
				"status": ["!=", TRANSLATION_STALE],
			},
			pluck="name",
		):
			frappe.db.set_value(
				"Property Instruction Translation",
				name,
				"status",
				TRANSLATION_STALE,
				update_modified=False,
			)

	def get_safe_body(self, body):
		if not body:
			return ""
		return Markup(sanitize_html(body, always_sanitize=True, disallowed_tags={"script", "style"}))

	def get_pdf_render_context(self, language_code=None):
		context = self.get_public_render_context(language_code)
		context.machine_translation_note = None
		context.pdf_display_language = language_code or "en"
		context.pdf_cover_image = self.get_pdf_asset_url(self.cover_image)
		context.pdf_machine_translated = False
		context.pdf_sections = self.get_pdf_sections(context.sections)
		context.generated_on_display = self.get_local_generated_date_display()
		context.pdf_filename = self.get_public_pdf_filename()
		return context

	def render_pdf_html(self, language_code=None, translated_snapshot=None):
		context = frappe._dict(doc=self)
		context.update(self.get_pdf_render_context(language_code))
		if translated_snapshot:
			self.apply_translated_snapshot_to_context(context, translated_snapshot)
		return frappe.render_template("templates/pdf/property_instruction.html", context)

	def apply_translated_snapshot_to_context(self, context, translated_snapshot):
		fields = translated_snapshot.get("fields") or {}
		sections = translated_snapshot.get("sections") or {}
		blocks = translated_snapshot.get("blocks") or {}

		if fields.get("title"):
			context.title = fields["title"]
			context.page_title = fields["title"]

		if fields.get("emergency_contact") and not self.should_protect_identifier_value(context.emergency_contact):
			context.emergency_contact = fields["emergency_contact"]

		for section in context.sections or []:
			if sections.get(section.anchor):
				section.section = sections[section.anchor]
			for block in section.blocks or []:
				override = blocks.get(block.name) or {}
				if override.get("title") and not block.title_translation_protected:
					block.title = override["title"]
				if override.get("body"):
					block.body = override["body"]
					block.safe_body = self.get_safe_body(override["body"])
				if override.get("caption") and not block.caption_translation_protected:
					block.caption = override["caption"]
				if override.get("link_label") and not block.display_link_label_translation_protected:
					block.display_link_label = override["link_label"]
				block.image_alt = block.caption or block.title or block.image_alt

		context.pdf_machine_translated = True
		context.pdf_display_language = translated_snapshot.get("display_language") or context.pdf_display_language
		context.machine_translation_note = PDF_WIDGET_TRANSLATION_NOTE
		context.pdf_sections = self.get_pdf_sections(context.sections)

	def get_public_pdf_filename(self):
		filename_stem = (
			self.slug
			if self.slug.endswith("-guide") or "guest-guide" in self.slug
			else f"{self.slug}-guest-guide"
		)
		return f"{filename_stem}.pdf"

	def get_pdf_options(self):
		return {
			"page-size": "A4",
			"margin-top": "10mm",
			"margin-right": "12mm",
			"margin-bottom": "12mm",
			"margin-left": "12mm",
			"load-error-handling": "ignore",
			"load-media-error-handling": "ignore",
		}

	def get_local_generated_date_display(self):
		return formatdate(nowdate())

	def get_pdf_sections(self, sections):
		pdf_sections = []
		for section in sections or []:
			pdf_blocks = []
			for block in section.blocks or []:
				pdf_block = frappe._dict(block)
				pdf_block.pdf_image = self.get_pdf_asset_url(block.image)
				pdf_blocks.append(pdf_block)
			pdf_sections.append(frappe._dict(section=section.section, anchor=section.anchor, blocks=pdf_blocks))
		return pdf_sections

	def get_pdf_asset_url(self, asset_url):
		if not asset_url:
			return None
		if asset_url.startswith(("http://", "https://", "data:")):
			return asset_url
		if asset_url.startswith(("/files/", "/private/files/")):
			inline_asset = self.get_inline_asset_data_uri(asset_url)
			if inline_asset:
				return inline_asset
		return asset_url

	def get_inline_asset_data_uri(self, asset_url):
		if not asset_url or not asset_url.startswith("/"):
			return None
		if asset_url.startswith("/private/files/"):
			file_path = frappe.get_site_path("private", "files", asset_url.split("/private/files/", 1)[1])
		elif asset_url.startswith("/files/"):
			file_path = frappe.get_site_path("public", "files", asset_url.split("/files/", 1)[1])
		else:
			return None
		if not os.path.exists(file_path):
			return None
		mime_type = mimetypes.guess_type(file_path)[0] or "application/octet-stream"
		with open(file_path, "rb") as asset_file:
			encoded = base64.b64encode(asset_file.read()).decode("ascii")
		return f"data:{mime_type};base64,{encoded}"

	def get_snapshot_section_map(self):
		return {self.scrub(section): section for section in SECTION_OPTIONS}

	def get_snapshot_block_name_set(self):
		return {row.name for row in self.instruction_blocks or [] if row.name}

	def parse_translated_pdf_snapshot(self, payload):
		if not isinstance(payload, dict):
			frappe.throw(_("Invalid PDF snapshot payload."))

		unknown_keys = set(payload) - PDF_SNAPSHOT_ALLOWED_KEYS
		if unknown_keys:
			frappe.throw(_("Invalid PDF snapshot payload."))

		if payload.get("slug") and payload.get("slug") != self.slug:
			frappe.throw(_("Invalid PDF snapshot payload."))

		fields = payload.get("fields")
		sections = payload.get("sections")
		blocks = payload.get("blocks")

		if fields is None:
			fields = {}
		if sections is None:
			sections = {}
		if blocks is None:
			blocks = {}

		if not isinstance(fields, dict) or not isinstance(sections, dict) or not isinstance(blocks, dict):
			frappe.throw(_("Invalid PDF snapshot payload."))

		if len(blocks) > len(self.instruction_blocks or []):
			frappe.throw(_("Invalid PDF snapshot payload."))

		sanitized = {
			"display_language": self.normalize_language_code(payload.get("display_language")) or "en",
			"reviewed_language": self.normalize_language_code(payload.get("reviewed_language")) or "en",
			"widget_language": self.normalize_language_code(payload.get("widget_language")),
			"fields": {},
			"sections": {},
			"blocks": {},
		}

		for fieldname, value in fields.items():
			if fieldname not in PDF_SNAPSHOT_ALLOWED_FIELDS:
				frappe.throw(_("Invalid PDF snapshot payload."))
			sanitized_value = self.sanitize_snapshot_text(value, max_length=PDF_SNAPSHOT_MAX_TEXT_LENGTH)
			if sanitized_value:
				if fieldname == "emergency_contact" and self.should_protect_identifier_value(self.emergency_contact):
					continue
				sanitized["fields"][fieldname] = sanitized_value

		valid_sections = self.get_snapshot_section_map()
		for section_key, value in sections.items():
			if section_key not in valid_sections:
				continue
			sanitized_value = self.sanitize_snapshot_text(value, max_length=PDF_SNAPSHOT_MAX_TEXT_LENGTH)
			if sanitized_value:
				sanitized["sections"][section_key] = sanitized_value

		valid_block_names = self.get_snapshot_block_name_set()
		for block_name, block_payload in blocks.items():
			if block_name not in valid_block_names:
				continue
			if not isinstance(block_payload, dict):
				frappe.throw(_("Invalid PDF snapshot payload."))
			unknown_block_fields = set(block_payload) - PDF_SNAPSHOT_ALLOWED_BLOCK_FIELDS
			if unknown_block_fields:
				frappe.throw(_("Invalid PDF snapshot payload."))

			sanitized_block = {}
			for fieldname, value in block_payload.items():
				if fieldname == "body":
					sanitized_value = self.sanitize_snapshot_body(value)
				else:
					sanitized_value = self.sanitize_snapshot_text(value, max_length=PDF_SNAPSHOT_MAX_TEXT_LENGTH)
				if sanitized_value:
					sanitized_block[fieldname] = sanitized_value

			if sanitized_block:
				sanitized["blocks"][block_name] = sanitized_block

		return sanitized

	def sanitize_snapshot_text(self, value, max_length=PDF_SNAPSHOT_MAX_TEXT_LENGTH):
		text = frappe.safe_decode(value or "").strip()
		text = CONTROL_CHAR_PATTERN.sub("", text)
		text = re.sub(r"\s+", " ", text).strip()
		if len(text) > max_length:
			frappe.throw(_("Invalid PDF snapshot payload."))
		return text or None

	def sanitize_snapshot_body(self, value):
		text = frappe.safe_decode(value or "")
		text = CONTROL_CHAR_PATTERN.sub("", text)
		if len(text) > PDF_SNAPSHOT_MAX_BODY_LENGTH:
			frappe.throw(_("Invalid PDF snapshot payload."))
		sanitized = sanitize_html(
			text,
			always_sanitize=True,
			disallowed_tags={"script", "style", "iframe", "form", "object", "embed", "button", "img", "svg"},
		)
		sanitized = self.strip_disallowed_snapshot_tags(sanitized)
		return sanitized.strip() or None

	def get_snapshot_request_payload(self, translated_snapshot):
		payload = {
			"slug": self.slug,
			"token": self.get_pdf_snapshot_token(),
			"display_language": translated_snapshot.get("display_language") or "en",
			"reviewed_language": translated_snapshot.get("reviewed_language") or "en",
			"widget_language": translated_snapshot.get("widget_language"),
			"fields": translated_snapshot.get("fields") or {},
			"sections": translated_snapshot.get("sections") or {},
			"blocks": translated_snapshot.get("blocks") or {},
		}
		return payload

	def strip_disallowed_snapshot_tags(self, html):
		tag_pattern = re.compile(r"</?([a-zA-Z0-9]+)(?:\s[^>]*)?>")

		def replace_tag(match):
			tag_name = match.group(1).lower()
			return match.group(0) if tag_name in PDF_SNAPSHOT_ALLOWED_BODY_TAGS else ""

		return tag_pattern.sub(replace_tag, html or "")

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

	def cleanup_trailing_footer_only_page(self, pdf_bytes):
		try:
			reader = PdfReader(io.BytesIO(pdf_bytes))
		except Exception:
			return pdf_bytes, False
		if len(reader.pages) < 2:
			return pdf_bytes, False

		last_page_text = self.extract_pdf_page_text(reader.pages[-1])
		if not self.is_footer_only_page_text(last_page_text):
			return pdf_bytes, False

		writer = PdfWriter()
		for page in reader.pages[:-1]:
			writer.add_page(page)

		cleaned = self.get_pdf_bytes_from_writer(writer)
		frappe.logger("propms").info("Removed footer-only trailing guest guide PDF page")
		return cleaned, True

	def extract_pdf_page_text(self, page):
		try:
			return (page.extract_text() or "").strip()
		except Exception:
			return ""

	def is_footer_only_page_text(self, text):
		lines = [line.strip() for line in (text or "").splitlines() if line.strip()]
		if not lines:
			return False

		for line in lines:
			if line == "Estaex Guest Guide":
				continue
			if PDF_FOOTER_LINE_PATTERN.match(line):
				continue
			if re.match(r"^\d{2}-\d{2}-\d{4}$", line):
				continue
			return False

		return True

	def get_pdf_bytes_from_writer(self, writer):
		stream = io.BytesIO()
		writer.write(stream)
		return stream.getvalue()


@frappe.whitelist()
def generate_translation(property_instruction, language_code, language_name=None):
	doc = frappe.get_doc("Property Instruction", property_instruction)
	doc.check_permission("write")
	return doc.generate_translation(language_code=language_code, language_name=language_name)


def get_published_instruction(slug=None, name=None):
	filters = {"published": 1}
	if slug:
		filters["slug"] = slug
	elif name:
		filters["name"] = name
	else:
		frappe.throw(_("A published Property Instruction could not be found."), frappe.DoesNotExistError)

	instruction_name = frappe.db.get_value("Property Instruction", filters, "name")
	if not instruction_name:
		frappe.throw(_("A published Property Instruction could not be found."), frappe.DoesNotExistError)
	return frappe.get_doc("Property Instruction", instruction_name)


def sign_pdf_snapshot_token(payload):
	serialized = json.dumps(payload, sort_keys=True, separators=(",", ":"))
	encoded = base64.urlsafe_b64encode(serialized.encode()).decode().rstrip("=")
	signature = hmac.new(get_secret().encode(), serialized.encode(), hashlib.sha256).hexdigest()
	return f"{encoded}.{signature}"


def verify_pdf_snapshot_token(token):
	if not token or "." not in token:
		frappe.throw(_("Invalid PDF token."))

	encoded_payload, provided_signature = token.rsplit(".", 1)
	padding = "=" * (-len(encoded_payload) % 4)
	try:
		serialized = base64.urlsafe_b64decode(encoded_payload + padding).decode()
		payload = json.loads(serialized)
	except Exception:
		frappe.throw(_("Invalid PDF token."))

	expected_signature = hmac.new(get_secret().encode(), serialized.encode(), hashlib.sha256).hexdigest()
	if not hmac.compare_digest(provided_signature, expected_signature):
		frappe.throw(_("Invalid PDF token."))

	if int(payload.get("expires_at") or 0) < int(now_datetime().timestamp()):
		frappe.throw(_("This PDF link has expired."))

	return payload


def get_pdf_request_payload():
	if not frappe.request or frappe.request.method != "POST":
		return None

	raw_body = frappe.request.get_data(as_text=True) or ""
	if len(raw_body.encode()) > PDF_SNAPSHOT_MAX_PAYLOAD_BYTES:
		frappe.throw(_("PDF request is too large."))

	try:
		payload = json.loads(raw_body)
	except Exception:
		frappe.throw(_("Invalid PDF snapshot payload."))

	if not isinstance(payload, dict):
		frappe.throw(_("Invalid PDF snapshot payload."))

	return payload


@frappe.whitelist(allow_guest=True)
@rate_limit(limit=30, seconds=60 * 60, methods="POST")
def download_pdf(slug=None, name=None, lang=None):
	if frappe.request and frappe.request.method == "POST":
		payload = get_pdf_request_payload()
		token_payload = verify_pdf_snapshot_token(payload.get("token"))
		doc = get_published_instruction(name=token_payload.get("name"))
		if token_payload.get("slug") != doc.slug or not cint(token_payload.get("published")):
			frappe.throw(_("Invalid PDF token."))

		reviewed_language = doc.normalize_language_code(payload.get("reviewed_language") or lang) or "en"
		snapshot = doc.parse_translated_pdf_snapshot(payload)
		pdf_html = doc.render_pdf_html(language_code=reviewed_language, translated_snapshot=snapshot)
	else:
		doc = get_published_instruction(slug=slug, name=name)
		pdf_html = doc.render_pdf_html(language_code=lang)

	pdf_bytes = get_pdf(pdf_html, options=doc.get_pdf_options())
	pdf_bytes, _removed_footer_only_page = doc.cleanup_trailing_footer_only_page(pdf_bytes)
	filename = doc.get_public_pdf_filename()
	frappe.local.response.filename = filename
	frappe.local.response.filecontent = pdf_bytes
	frappe.local.response.type = "download"
	frappe.local.response.display_content_as = "attachment"
	frappe.local.response.content_type = "application/pdf"
