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
from urllib.parse import quote, unquote, urljoin, urlparse, urlunparse
from urllib.request import HTTPRedirectHandler, Request, build_opener

import frappe
from frappe import _
from frappe.model.naming import make_autoname
from frappe.utils import cint, formatdate, get_bench_path, get_build_version, sanitize_html, validate_url
from frappe.website.website_generator import WebsiteGenerator
from markupsafe import Markup
from werkzeug.datastructures import Headers

from propms.map_snapshot.presentation import (
	build_map_source_hash,
	get_map_kind_class,
	get_map_presentation_context,
)
from propms.map_snapshot.pdf_assets import (
	build_pdf_map_representation,
)
from propms.map_snapshot.jobs import queue_document_snapshot_job, queue_snapshot_generation
from propms.map_snapshot.manifest import (
	SNAPSHOT_STATUS_FAILED,
	SNAPSHOT_STATUS_NOT_REQUIRED,
	SNAPSHOT_STATUS_PENDING,
	SNAPSHOT_STATUS_PROCESSING,
	SNAPSHOT_STATUS_READY,
	is_snapshot_current,
)
from propms.map_snapshot.storage import schedule_delete_generated_snapshot_file
from propms.map_snapshot.validation import (
	TRUSTED_GOOGLE_MAP_HOSTS,
	derive_google_maps_view_url as derive_google_maps_view_url_value,
	extract_google_maps_embed_url as extract_google_maps_embed_url_value,
	get_google_maps_embed_kind as get_google_maps_embed_kind_value,
	normalize_google_maps_embed_input as normalize_google_maps_embed_input_value,
	validate_google_maps_embed_url as validate_google_maps_embed_url_value,
)


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

WIFI_SECURITY_TYPES = {
	"WPA": "WPA",
	"WEP": "WEP",
	"OPEN": "Open",
}
GOOGLE_TRANSLATE_SCRIPT_BASE_URL = "https://translate.google.com/translate_a/element.js"
TRUSTED_EXTERNAL_PDF_IMAGE_HOSTS = set()
LANGUAGE_CODE_PATTERN = re.compile(r"^[a-z]{2,3}(?:-[a-z]{2,8})*$")
PHONE_PATTERN = re.compile(r"(?:\+?\d[\d\s().-]{6,}\d)")
EMAIL_PATTERN = re.compile(r"\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b")
ROAD_NAME_PATTERN = re.compile(
	r"\b(?:Road|Street|Lane|Avenue|Close|Drive|Way|Court|Crescent|Place|Gardens|Terrace|Park|Square)\b",
	re.IGNORECASE,
)
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
		self.normalize_wifi_qr_fields()
		self.normalize_blocks()
		self.validate_links()
		self.prepare_map_snapshot_lifecycle()
		super().validate()

	def on_update(self):
		self.schedule_removed_map_snapshot_cleanup()
		self.enqueue_pending_map_snapshot_jobs()

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
			embed_input = self.get_block_map_canonical_embed_input(block)
			canonical_embed_url = (
				self.normalize_google_maps_embed_input(embed_input)
				if embed_input
				else ""
			)
			block.set("custom_map_embed_url", canonical_embed_url)

	def validate_links(self):
		if self.google_maps_url:
			self.validate_google_maps_url()

		for row in self.instruction_blocks or []:
			if row.link_url:
				self.validate_external_link(row.link_url, _("Instruction Block #{0} link").format(row.idx))
			if row.block_type == "Link" and not row.link_url:
				frappe.throw(_("Instruction Block #{0} is missing a link URL.").format(row.idx))
			if self.get_block_map_embed_input(row) or row.block_type == "Map":
				self.validate_map_block(row)

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

	def validate_map_block(self, row):
		canonical_input = self.get_block_map_canonical_embed_input(row)
		legacy_input = self.get_block_map_legacy_embed_input(row)
		if row.block_type == "Map" and not (canonical_input or legacy_input):
			frappe.throw(
				_("Instruction Block #{0} is missing a Google Maps embed iframe or URL.").format(row.idx)
			)
		if not canonical_input:
			return
		try:
			canonical_embed_url = self.extract_google_maps_embed_url(canonical_input)
			row.set("custom_map_embed_url", canonical_embed_url)
		except frappe.ValidationError:
			raise
		except Exception as error:
			frappe.throw(
				_("Instruction Block #{0} has an invalid Google Maps embed iframe or URL: {1}").format(
					row.idx,
					frappe.safe_decode(str(error)),
				)
			)

	def _set_snapshot_fields(
		self,
		target,
		*,
		snapshot=None,
		status=None,
		source_hash=None,
		generated_at=None,
		error_log=None,
	):
		if snapshot is not None:
			target.set("custom_map_snapshot", snapshot)
		if status is not None:
			target.set("custom_map_snapshot_status", status)
		if source_hash is not None:
			target.set("custom_map_snapshot_source_hash", source_hash)
		if generated_at is not None:
			target.set("custom_map_snapshot_generated_at", generated_at)
		if error_log is not None:
			target.set("custom_map_snapshot_error_log", error_log)

	def _clear_snapshot_fields(self, target, *, status=SNAPSHOT_STATUS_NOT_REQUIRED):
		target.set("custom_map_snapshot", "")
		target.set("custom_map_snapshot_status", status)
		target.set("custom_map_snapshot_source_hash", "")
		target.set("custom_map_snapshot_generated_at", None)
		target.set("custom_map_snapshot_error_log", "")

	def _get_snapshot_field_values(self, target):
		return frappe._dict(
			snapshot=(target.get("custom_map_snapshot") or "").strip(),
			status=(target.get("custom_map_snapshot_status") or "").strip(),
			source_hash=(target.get("custom_map_snapshot_source_hash") or "").strip(),
			error_log=(target.get("custom_map_snapshot_error_log") or "").strip(),
		)

	def _compute_previous_main_snapshot_hash(self, previous_doc):
		if not previous_doc:
			return ""
		embed_url = (previous_doc.get_custom_property_map_embed_url() or "").strip()
		if not embed_url:
			return ""
		map_kind = (previous_doc.get_property_map().embed_kind or "").strip()
		if not map_kind:
			return ""
		return build_map_source_hash(embed_url, map_kind)

	def _compute_previous_block_snapshot_hash(self, previous_doc, previous_row):
		if not previous_doc or not previous_row:
			return ""
		embed_input = (previous_doc.get_block_map_embed_input(previous_row) or "").strip()
		if not embed_input:
			return ""
		block_map = previous_doc.get_block_map_data(previous_row)
		if not ((block_map.embed_url or "").strip() and (block_map.embed_kind or "").strip()):
			return ""
		return build_map_source_hash(block_map.embed_url, block_map.embed_kind)

	def _restore_server_owned_snapshot_state(self, target, db_target, desired_hash):
		if not db_target or not desired_hash:
			return False

		db_fields = self._get_snapshot_field_values(db_target)
		db_status = db_fields.status
		if (
			db_status == SNAPSHOT_STATUS_READY
			and db_fields.source_hash == desired_hash
			and not is_snapshot_current(
				db_fields.snapshot,
				db_fields.status,
				db_fields.source_hash,
				desired_hash,
				self.name,
			)
		):
			return False

		if db_fields.source_hash == desired_hash and db_status in {
			SNAPSHOT_STATUS_READY,
			SNAPSHOT_STATUS_PROCESSING,
			SNAPSHOT_STATUS_FAILED,
		}:
			self._set_snapshot_fields(
				target,
				snapshot=db_fields.snapshot,
				status=db_fields.status,
				source_hash=db_fields.source_hash,
				generated_at=db_target.get("custom_map_snapshot_generated_at"),
				error_log=db_fields.error_log,
			)
			return True

		return False

	def _prepare_target_snapshot_state(self, *, target, db_target, has_map, desired_hash, previous_hash, removed_files):
		fields = self._get_snapshot_field_values(target)
		if not has_map:
			if fields.snapshot:
				removed_files.append(fields.snapshot)
			self._clear_snapshot_fields(target, status=SNAPSHOT_STATUS_NOT_REQUIRED)
			return

		if is_snapshot_current(fields.snapshot, fields.status, fields.source_hash, desired_hash, self.name):
			return

		source_changed = previous_hash != desired_hash
		if not source_changed and self._restore_server_owned_snapshot_state(target, db_target, desired_hash):
			return

		ready_but_missing_file = (
			fields.status == SNAPSHOT_STATUS_READY
			and fields.source_hash == desired_hash
			and fields.snapshot
			and not is_snapshot_current(fields.snapshot, fields.status, fields.source_hash, desired_hash, self.name)
		)

		if fields.status == SNAPSHOT_STATUS_FAILED and not source_changed:
			return
		if fields.status in {SNAPSHOT_STATUS_PENDING, SNAPSHOT_STATUS_PROCESSING} and not source_changed:
			return
		if ready_but_missing_file or source_changed or fields.status in {"", SNAPSHOT_STATUS_NOT_REQUIRED, SNAPSHOT_STATUS_READY}:
			self._set_snapshot_fields(
				target,
				status=SNAPSHOT_STATUS_PENDING,
				error_log="",
			)

	def prepare_map_snapshot_lifecycle(self):
		previous_doc = None if self.is_new() else self.get_doc_before_save()
		removed_files = []
		previous_rows = {
			row.name: row
			for row in ((previous_doc.instruction_blocks or []) if previous_doc else [])
			if row.name
		}
		current_row_names = {row.name for row in (self.instruction_blocks or []) if row.name}

		main_embed_url = (self.get_custom_property_map_embed_url() or "").strip()
		main_map = self.get_property_map()
		main_map_kind = (main_map.embed_kind or "").strip()
		main_hash = build_map_source_hash(main_embed_url, main_map_kind) if (main_embed_url and main_map_kind) else ""
		self._prepare_target_snapshot_state(
			target=self,
			db_target=previous_doc,
			has_map=bool(main_hash),
			desired_hash=main_hash,
			previous_hash=self._compute_previous_main_snapshot_hash(previous_doc),
			removed_files=removed_files,
		)

		for row in self.instruction_blocks or []:
			block_embed_input = (self.get_block_map_embed_input(row) or "").strip()
			block_map = self.get_block_map_data(row) if block_embed_input else frappe._dict(embed_url="", embed_kind="")
			block_hash = (
				build_map_source_hash(block_map.embed_url, block_map.embed_kind)
				if ((block_map.embed_url or "").strip() and (block_map.embed_kind or "").strip())
				else ""
			)
			self._prepare_target_snapshot_state(
				target=row,
				db_target=previous_rows.get(row.name),
				has_map=bool(block_hash),
				desired_hash=block_hash,
				previous_hash=self._compute_previous_block_snapshot_hash(previous_doc, previous_rows.get(row.name)),
				removed_files=removed_files,
			)

		for row_name, previous_row in previous_rows.items():
			if row_name in current_row_names:
				continue
			previous_snapshot = (previous_row.get("custom_map_snapshot") or "").strip()
			if previous_snapshot:
				removed_files.append(previous_snapshot)

		self.flags.map_snapshot_removed_files = [
			value for value in removed_files if value
		]

	def _get_current_snapshot_urls(self):
		urls = set()
		main_snapshot = (self.get("custom_map_snapshot") or "").strip()
		if main_snapshot:
			urls.add(main_snapshot)
		for row in self.instruction_blocks or []:
			snapshot = (row.get("custom_map_snapshot") or "").strip()
			if snapshot:
				urls.add(snapshot)
		return urls

	def schedule_removed_map_snapshot_cleanup(self):
		current_snapshot_urls = self._get_current_snapshot_urls()
		for snapshot_url in self.flags.get("map_snapshot_removed_files") or []:
			if snapshot_url in current_snapshot_urls:
				continue
			schedule_delete_generated_snapshot_file(snapshot_url, self.name)

	def enqueue_pending_map_snapshot_jobs(self):
		if frappe.flags.in_test and not getattr(self.flags, "allow_map_snapshot_enqueue_in_test", False):
			return None
		return queue_document_snapshot_job(self)

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
		context.asset_version = (
			getattr(context, "asset_version", None)
			or getattr(context, "build_version", None)
			or get_build_version()
		)
		context.build_version = context.asset_version
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
		property_map_pdf = self.get_pdf_map_representation("property-location")
		property_map.pdf_representation = property_map_pdf.representation
		property_map.pdf_snapshot_image_url = property_map_pdf.snapshot_image_url
		property_map.pdf_open_url = property_map_pdf.open_url
		property_map.pdf_desired_source_hash = property_map_pdf.desired_source_hash
		property_map.pdf_reason_code = property_map_pdf.reason_code
		property_map.is_custom_google_map = property_map_pdf.custom_map
		sections = self.get_grouped_blocks()
		instruction_block_maps = self.get_instruction_block_maps(sections)
		google_translate = self.get_google_translate_settings()
		wifi_password_public = self.get_public_wifi_password()
		wifi_security_type = self.get_normalized_wifi_security_type()
		show_wifi_qr_in_pdf = bool(cint(self.show_wifi_qr_in_pdf or 0))
		my_maps_presentation = get_map_presentation_context("google-my-maps")
		return frappe._dict(
			title=self.title,
			page_title=self.title,
			noindex_robots_content=NOINDEX_ROBOTS_CONTENT,
			sections=sections,
			has_sections=bool(sections),
			address=self.address,
			cover_image=self.get_public_pdf_image_src(self.cover_image),
			google_maps_url=property_map.external_url,
			map_embed_url=property_map.embed_url,
			map_embed_enabled=bool(property_map.embed_url),
			custom_map_embed_url=property_map.custom_embed_url,
			instruction_block_maps=instruction_block_maps,
			property_map=property_map,
			my_maps_header_crop_px=my_maps_presentation["my_maps_header_crop_px"],
			my_maps_bottom_overscan_px=my_maps_presentation["my_maps_bottom_overscan_px"],
			my_maps_presentation_version=my_maps_presentation["my_maps_presentation_version"],
			check_in_time=self.format_display_time(self.check_in_time),
			check_out_time=self.format_display_time(self.check_out_time),
			wifi_name=self.wifi_name,
			wifi_password_public=wifi_password_public,
			show_wifi_qr_in_pdf=show_wifi_qr_in_pdf,
			wifi_security_type=wifi_security_type,
			wifi_hidden_network=bool(cint(self.wifi_hidden_network or 0)),
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
				block_row = row.as_dict()
				block_row.pop("google_maps_embed_html", None)
				block_row.pop("custom_map_embed_url", None)
				block_map = self.get_block_map_data(row)
				block_pdf = self.get_pdf_map_representation("block", row.name)
				block_data = dict(block_row)
				block_data.update(
					title_translation_protected=self.should_protect_identifier_value(row.title),
					body_translation_protected=self.should_protect_body_value(row.body),
					caption_translation_protected=self.should_protect_identifier_value(row.caption),
					display_section=section,
					safe_body=self.get_safe_body(row.body),
					anchor=self.scrub(section),
					display_step_number=row.step_number or step_counter or None,
					display_link_label=row.link_label or row.link_url,
					image=self.get_public_pdf_image_src(row.image),
					map_embed_url=block_map.embed_url,
					map_embed_kind=block_map.embed_kind,
					map_embed_kind_class=block_map.embed_kind_class,
					map_external_url=block_map.external_url,
					map_pdf_representation=block_pdf.representation,
					map_pdf_snapshot_image_url=block_pdf.snapshot_image_url,
					map_pdf_open_url=block_pdf.open_url,
					map_pdf_desired_source_hash=block_pdf.desired_source_hash,
					map_pdf_reason_code=block_pdf.reason_code,
					map_is_custom_google_map=block_pdf.custom_map,
					display_link_label_translation_protected=self.should_protect_identifier_value(
						row.link_label or row.link_url
					),
					image_alt=row.caption or row.title or f"{self.title} - {section}",
					hide_in_print=self.should_hide_block_in_print(row, self.get_map_external_url()),
				)
				section_blocks.append(
					frappe._dict(block_data)
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

	def get_instruction_block_maps(self, sections=None):
		block_maps = frappe._dict()
		sorted_rows = sorted(
			self.instruction_blocks or [],
			key=lambda row: ((row.sort_order or row.idx or 0), row.idx or 0),
		)
		for row in sorted_rows:
			if not row.get("name") or not self.block_has_content(row):
				continue
			if not self.get_block_map_embed_input(row):
				continue
			block_map = self.get_block_map_data(row)
			block_pdf = self.get_pdf_map_representation("block", row.name)
			if not (block_map.embed_url or block_map.external_url):
				continue
			block_maps[row.name] = frappe._dict(
				name=row.name,
				title=row.title,
				embed_url=block_map.embed_url,
				embed_kind=block_map.embed_kind,
				embed_kind_class=block_map.embed_kind_class,
				external_url=block_map.external_url,
				link_label=row.link_label or row.link_url,
				pdf_representation=block_pdf.representation,
				pdf_snapshot_image_url=block_pdf.snapshot_image_url,
				pdf_open_url=block_pdf.open_url,
				pdf_desired_source_hash=block_pdf.desired_source_hash,
				pdf_reason_code=block_pdf.reason_code,
				is_custom_google_map=block_pdf.custom_map,
			)
		return block_maps

	def normalize_map_fields(self):
		self.set("custom_map_embed_url", self.normalize_google_maps_embed_input(self.get("custom_map_embed_url")))

	def normalize_wifi_qr_fields(self):
		self.show_wifi_qr_in_pdf = cint(self.show_wifi_qr_in_pdf or 0)
		self.wifi_hidden_network = cint(self.wifi_hidden_network or 0)
		self.wifi_security_type = self.get_normalized_wifi_security_type()

	def get_normalized_wifi_security_type(self):
		security_type = (self.wifi_security_type or "WPA").strip().upper()
		return WIFI_SECURITY_TYPES.get(security_type, "WPA")

	def get_property_map(self):
		custom_embed_url = self.get_custom_property_map_embed_url()
		embed_url = custom_embed_url
		embed_kind = self.get_google_maps_embed_kind(embed_url)
		return frappe._dict(
			custom_embed_url=custom_embed_url,
			embed_url=embed_url,
			embed_kind=embed_kind,
			embed_kind_class=get_map_kind_class(embed_kind),
			external_url=self.get_map_external_url(embed_url),
			uses_api_key=False,
			is_custom_embed=bool(custom_embed_url),
		)

	def get_pdf_map_representation(self, map_key, row_name=None):
		return build_pdf_map_representation(self, map_key, row_name)

	def get_guest_guide_web_assets(self, existing_assets=None, asset_type="css"):
		assets = list(existing_assets or frappe.get_hooks(f"web_include_{asset_type}") or [])
		return [
			asset
			for asset in assets
			if asset and not asset.startswith(GUEST_GUIDE_EXCLUDED_WEB_ASSET_PREFIXES)
		]

	def get_map_external_url(self, effective_embed_url=None):
		custom_embed_url = self.get_custom_property_map_embed_url()
		embed_url = (custom_embed_url or effective_embed_url or "").strip()
		if not embed_url:
			return None
		if self.google_maps_url:
			return self.google_maps_url
		return self.derive_google_maps_view_url(embed_url)

	def get_map_embed_url(self):
		return self.get_custom_property_map_embed_url() or None

	def get_custom_property_map_embed_url(self):
		return self.normalize_google_maps_embed_input(self.get("custom_map_embed_url"))

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
				row.get("custom_map_embed_url"),
				row.get("google_maps_embed_html"),
			]
		)

	def normalize_google_maps_embed_input(self, value):
		return normalize_google_maps_embed_input_value(value)

	def get_block_map_canonical_embed_input(self, row):
		return (row.get("custom_map_embed_url") or "").strip()

	def get_block_map_legacy_embed_input(self, row):
		return (row.get("google_maps_embed_html") or "").strip()

	def get_block_map_embed_input(self, row):
		return self.get_block_map_canonical_embed_input(row) or self.get_block_map_legacy_embed_input(row)

	def extract_google_maps_embed_url(self, embed_input):
		return extract_google_maps_embed_url_value(embed_input)

	def validate_google_maps_embed_url(self, url):
		return validate_google_maps_embed_url_value(url)

	def get_google_maps_embed_kind(self, url):
		return get_google_maps_embed_kind_value(url)

	def derive_google_maps_view_url(self, embed_url):
		return derive_google_maps_view_url_value(embed_url)

	def resolve_block_map_embed_url(self, row, *, raise_invalid=False):
		embed_input = self.get_block_map_embed_input(row)
		if not embed_input:
			return ""
		try:
			return self.extract_google_maps_embed_url(embed_input) or ""
		except frappe.ValidationError:
			if raise_invalid:
				raise
			return ""

	def get_block_map_data(self, row):
		embed_url = self.resolve_block_map_embed_url(row, raise_invalid=False)
		if not embed_url:
			return frappe._dict(
				embed_url=None,
				embed_kind="",
				external_url=None,
			)
		external_url = (row.link_url or "").strip()
		if not external_url and embed_url:
			external_url = self.derive_google_maps_view_url(embed_url)
		if not external_url and embed_url:
			external_url = embed_url
		return frappe._dict(
			embed_url=embed_url,
			embed_kind=self.get_google_maps_embed_kind(embed_url),
			embed_kind_class=get_map_kind_class(self.get_google_maps_embed_kind(embed_url)),
			external_url=external_url,
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


def _require_map_snapshot_admin_access(name):
	doc = frappe.get_doc("Property Instruction", name)
	if not doc.has_permission("write"):
		raise frappe.PermissionError
	frappe.only_for("System Manager")
	return doc


@frappe.whitelist()
def generate_property_instruction_map_snapshots(name):
	_require_map_snapshot_admin_access(name)
	return queue_snapshot_generation(name)


@frappe.whitelist()
def regenerate_property_instruction_map_snapshots(name):
	_require_map_snapshot_admin_access(name)
	return queue_snapshot_generation(name, force=True)


@frappe.whitelist()
def retry_failed_property_instruction_map_snapshots(name):
	_require_map_snapshot_admin_access(name)
	return queue_snapshot_generation(name, retry_failed_only=True)


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

	return parsed


def is_current_site_file_url(parsed):
	hostname = normalize_host_name(parsed.hostname or "")
	current_site = normalize_host_name(getattr(frappe.local, "site", "") or "")
	request = getattr(frappe.local, "request", None)
	request_host = normalize_host_name((getattr(request, "host", "") or "").split(":", 1)[0])
	local_hosts = {
		current_site,
		request_host,
		"development.localhost",
		"localhost",
		"127.0.0.1",
	}
	return hostname in {host for host in local_hosts if host}


def resolve_local_public_image(path):
	decoded_path = unquote(path or "")
	for prefix, base_parts in (
		("/files/", ("public", "files")),
		("/private/files/", ("private", "files")),
	):
		if not decoded_path.startswith(prefix):
			continue
		relative_path = os.path.normpath(decoded_path[len(prefix) :]).lstrip(os.sep)
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
	if parsed.path.startswith(PUBLIC_SITE_IMAGE_PREFIXES) and is_current_site_file_url(parsed):
		local_image = resolve_local_public_image(parsed.path)
		if local_image:
			return local_image
		frappe.throw(_("Requested guest guide image was not found."))
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
