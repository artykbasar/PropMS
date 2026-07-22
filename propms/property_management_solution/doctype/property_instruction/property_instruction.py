# Copyright (c) 2026, contributors

from __future__ import annotations

import os
from urllib.parse import urlencode, urlparse, urlunparse

import frappe
from frappe import _
from frappe.model.naming import make_autoname
from frappe.utils import cint, sanitize_html, validate_url
from frappe.website.website_generator import WebsiteGenerator
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
		language_code = self.get_requested_language()
		translation = self.get_ready_translation(language_code)
		display_content = self.get_display_content(translation)
		property_map = self.get_property_map()
		google_translate = self.get_google_translate_settings()

		context.no_cache = 1
		context.no_breadcrumbs = 1
		context.title = display_content.title
		context.page_title = display_content.title
		context.sections = display_content.sections
		context.has_sections = bool(context.sections)
		context.address = display_content.address
		context.cover_image = self.cover_image
		context.google_maps_url = property_map.external_url
		context.map_embed_url = property_map.embed_url
		context.map_embed_enabled = bool(property_map.embed_url)
		context.map_display_query = self.get_map_display_query()
		context.property_map = property_map
		context.check_in_time = self.check_in_time
		context.check_out_time = self.check_out_time
		context.wifi_name = self.wifi_name
		context.emergency_contact = display_content.emergency_contact
		context.last_reviewed_on = self.last_reviewed_on
		context.available_languages = self.get_available_languages()
		context.selected_language_code = display_content.language_code
		context.selected_language_name = display_content.language_name
		context.translation_enabled = len(context.available_languages) > 1
		if not getattr(context, "boot", None):
			context.boot = frappe._dict()
		elif isinstance(context.boot, dict) and not isinstance(context.boot, frappe._dict):
			context.boot = frappe._dict(context.boot)
		context.boot.lang = display_content.language_code
		context.google_translate = google_translate
		return context

	def get_grouped_blocks(self):
		return self.build_grouped_blocks(self.instruction_blocks or [])

	def build_grouped_blocks(self, ordered_blocks, translation_map=None):
		grouped = []
		translation_map = translation_map or {}
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
						body=body,
						caption=caption,
						display_section=section_label,
						safe_body=self.get_safe_body(body),
						anchor=self.scrub(section_label),
						display_step_number=row.step_number or step_counter or None,
						display_link_label=link_label or row.link_url,
						image_alt=caption or title or f"{self.title} - {section_label}",
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
		source_language = (
			self.get_property_management_setting("guest_guide_source_language") or "en"
		).strip().lower() or "en"
		language_codes = self.parse_google_translate_languages(
			self.get_property_management_setting("guest_guide_translate_languages")
		)
		return frappe._dict(
			enabled=bool(enabled),
			container_id="google_translate_element" if enabled else None,
			script_url=GOOGLE_TRANSLATE_SCRIPT_URL if enabled else None,
			source_language=source_language,
			included_languages=language_codes,
			included_languages_csv=",".join(language_codes) if language_codes else "",
		)

	def get_property_management_setting(self, fieldname):
		try:
			return frappe.db.get_single_value("Property Management Settings", fieldname)
		except Exception:
			return None

	def parse_google_translate_languages(self, raw_value):
		languages = []
		for value in (raw_value or "").split(","):
			code = (value or "").strip().lower()
			if code and code not in languages:
				languages.append(code)
		return languages

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
			address=translation.address or self.address,
			emergency_contact=translation.emergency_contact or self.emergency_contact,
			sections=self.build_grouped_blocks(self.instruction_blocks or [], translation_map=translation_map),
		)

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
		doc.address = translated.get("address") or self.address
		doc.emergency_contact = translated.get("emergency_contact") or self.emergency_contact
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


@frappe.whitelist()
def generate_translation(property_instruction, language_code, language_name=None):
	doc = frappe.get_doc("Property Instruction", property_instruction)
	doc.check_permission("write")
	return doc.generate_translation(language_code=language_code, language_name=language_name)
