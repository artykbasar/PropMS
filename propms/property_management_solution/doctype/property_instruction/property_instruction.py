# Copyright (c) 2026, contributors

from __future__ import annotations

from urllib.parse import urlparse

import frappe
from frappe import _
from frappe.model.naming import make_autoname
from frappe.utils import sanitize_html, validate_url
from frappe.website.website_generator import WebsiteGenerator
from markupsafe import Markup


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
			self.validate_external_link(self.google_maps_url, _("Google Maps URL"))

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

	def get_page_info(self):
		page_info = super().get_page_info()
		page_info.full_width = 1
		page_info.title = self.title
		return page_info

	def get_context(self, context):
		context.no_cache = 1
		context.no_breadcrumbs = 1
		context.title = self.title
		context.page_title = self.title
		context.sections = self.get_grouped_blocks()
		context.has_sections = bool(context.sections)
		context.address = self.address
		context.cover_image = self.cover_image
		context.google_maps_url = self.google_maps_url
		context.check_in_time = self.check_in_time
		context.check_out_time = self.check_out_time
		context.wifi_name = self.wifi_name
		context.emergency_contact = self.emergency_contact
		context.last_reviewed_on = self.last_reviewed_on
		return context

	def get_grouped_blocks(self):
		grouped = []
		ordered_blocks = sorted(
			self.instruction_blocks or [],
			key=lambda row: ((row.sort_order or row.idx or 0), row.idx or 0),
		)

		for section in SECTION_OPTIONS:
			section_blocks = []
			step_counter = 0
			for row in ordered_blocks:
				if row.section != section:
					continue
				if not self.block_has_content(row):
					continue
				if row.block_type == "Step":
					step_counter += 1
				section_blocks.append(
					frappe._dict(
						row.as_dict(),
						safe_body=self.get_safe_body(row.body),
						anchor=self.scrub(section),
						display_step_number=row.step_number or step_counter or None,
						display_link_label=row.link_label or row.link_url,
						image_alt=row.caption or row.title or f"{self.title} - {section}",
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
