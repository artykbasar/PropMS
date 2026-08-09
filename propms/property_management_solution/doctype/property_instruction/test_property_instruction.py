from __future__ import annotations

import base64
import json
import os
import time
import unittest
import uuid
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import get_assets_json
from frappe.utils.file_manager import save_file
from frappe.website.page_renderers.document_page import _find_matching_document_webview
from frappe.website.router import clear_routing_cache, get_base_template
from werkzeug.datastructures import Headers

from propms.property_management_solution.doctype.property_instruction import property_instruction as property_instruction_module
from propms.property_management_solution.doctype.property_instruction.property_instruction import (
	NOINDEX_ROBOTS_CONTENT,
	PUBLIC_PDF_IMAGE_MAX_BYTES,
	apply_guest_guide_noindex_headers,
	fetch_remote_public_image,
	resolve_local_public_image,
	resolve_public_pdf_image_target,
	validate_public_pdf_image_url,
)
from propms.map_snapshot.pdf_assets import PUBLIC_MAP_SNAPSHOT_IMAGE_ENDPOINT
from propms.map_snapshot.manifest import MapSnapshotManifestEntry, build_manifest_hash
from propms.map_snapshot.presentation import build_map_source_hash
from propms.map_snapshot.storage import save_snapshot_png
from propms.www.sitemap import get_filtered_public_pages_from_doctypes


PNG_BYTES = base64.b64decode(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9sX7LQAAAABJRU5ErkJggg=="
)
ATTACHMENT_PNG_BYTES = base64.b64decode(
	"iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFElEQVR42mP8z8AARAwMjIzwHwAFgwJ/lzvN/wAAAABJRU5ErkJggg=="
)
EXPORT_SCRIPT_PATH = os.path.abspath(
	os.path.join(
		os.path.dirname(__file__),
		"..",
		"..",
		"..",
		"public",
		"js",
		"property_instruction_export.js",
	)
)
PROPERTY_DOCTYPE_PATH = os.path.abspath(
	os.path.join(
		os.path.dirname(__file__),
		"property_instruction.json",
	)
)
BLOCK_DOCTYPE_PATH = os.path.abspath(
	os.path.join(
		os.path.dirname(__file__),
		"..",
		"property_instruction_block",
		"property_instruction_block.json",
	)
)
PROPERTY_DOCTYPE_SCRIPT_PATH = os.path.abspath(
	os.path.join(
		os.path.dirname(__file__),
		"property_instruction.js",
	)
)


class PropertyInstructionTestMixin:
	def setUp(self):
		super().setUp()
		frappe.set_user("Administrator")
		self.conf_backup = {}
		self.set_conf("developer_mode", 1)
		frappe.local.bundled_assets = get_assets_json() or {}
		self.to_delete = []
		self.temp_files = []
		self.single_backup = {}
		self.original_form_dict = frappe._dict(getattr(frappe.local, "form_dict", {}) or {})
		self.original_request = getattr(frappe.local, "request", None)
		self.original_request_args = getattr(self.original_request, "args", None) if self.original_request else None
		frappe.local.request = frappe._dict(args=frappe._dict({}), host="development.localhost:8000", path="/")
		self.clear_route_cache()

	def tearDown(self):
		for file_path in reversed(self.temp_files):
			if os.path.exists(file_path):
				os.remove(file_path)
		for doctype, name in reversed(self.to_delete):
			if not frappe.db.exists(doctype, name):
				continue
			for attempt in range(15):
				try:
					frappe.delete_doc(doctype, name, force=1)
					break
				except frappe.QueryTimeoutError:
					if attempt == 14:
						raise
					frappe.db.rollback()
					time.sleep(1.0)
		for key, value in self.conf_backup.items():
			if value is None:
				frappe.conf.pop(key, None)
			else:
				frappe.conf[key] = value
		for key, value in self.single_backup.items():
			frappe.db.set_single_value("Property Management Settings", key, value)
		frappe.local.form_dict = self.original_form_dict
		if self.original_request is not None:
			self.original_request.args = self.original_request_args
			frappe.local.request = self.original_request
		else:
			frappe.local.request = None
		self.clear_route_cache()
		super().tearDown()

	def clear_route_cache(self):
		_find_matching_document_webview.clear_cache()
		clear_routing_cache()

	def get_snapshot_state(self, doctype, name):
		return frappe.db.get_value(
			doctype,
			name,
			[
				"custom_map_snapshot",
				"custom_map_snapshot_status",
				"custom_map_snapshot_source_hash",
				"custom_map_snapshot_generated_at",
				"custom_map_snapshot_error_log",
			],
			as_dict=True,
		)

	def save_snapshot_system_state(self, doc):
		with property_instruction_module.allow_snapshot_system_field_update():
			doc.save(ignore_permissions=True)

	def make_snapshot_error_log(self):
		error_log = frappe.log_error(title="Snapshot lifecycle test", message="Test-only snapshot lifecycle reference")
		self.to_delete.append(("Error Log", error_log.name))
		return error_log.name

	def set_conf(self, key, value):
		if key not in self.conf_backup:
			self.conf_backup[key] = frappe.conf.get(key)
		if value is None:
			frappe.conf.pop(key, None)
		else:
			frappe.conf[key] = value

	def set_property_management_setting(self, key, value):
		if key not in self.single_backup:
			self.single_backup[key] = frappe.db.get_single_value("Property Management Settings", key)
		frappe.db.set_single_value("Property Management Settings", key, value)

	def make_property(self):
		doc = frappe.get_doc(
			{
				"doctype": "Property",
				"name1": f"Test Property {uuid.uuid4().hex[:8]}",
			}
		).insert(ignore_permissions=True)
		self.to_delete.append(("Property", doc.name))
		return doc

	def make_instruction(self, property_name=None, **overrides):
		property_name = property_name or self.make_property().name
		doc = frappe.get_doc(
			{
				"doctype": "Property Instruction",
				"title": overrides.pop("title", f"Test Guest Guide Property {uuid.uuid4().hex[:8]}"),
				"property": property_name,
				"published": overrides.pop("published", 1),
				"address": overrides.pop("address", "99A Burlington Road"),
				"custom_map_embed_url": overrides.pop("custom_map_embed_url", None),
				"google_maps_url": overrides.pop(
					"google_maps_url",
					"https://www.google.com/maps/place/99A+Burlington+Road",
				),
				"wifi_name": overrides.pop("wifi_name", "Estaex Guest WiFi"),
				"wifi_password": overrides.pop("wifi_password", "guest-wifi-only"),
				"check_in_time": overrides.pop("check_in_time", "15:00:00"),
				"check_out_time": overrides.pop("check_out_time", "11:00:00"),
				"emergency_contact": overrides.pop("emergency_contact", "Emergency Contact"),
				"instruction_blocks": overrides.pop(
					"instruction_blocks",
					[
						{
							"section": "Finding the Property",
							"block_type": "Link",
							"title": "Map",
							"link_url": "https://example.com/map",
							"link_label": "Open map",
						},
						{
							"section": "Check-In",
							"block_type": "Step",
							"step_number": 1,
							"title": "Find entrance",
							"body": "<p>Use the side gate.</p>",
						},
						{
							"section": "Check-In",
							"block_type": "Step",
							"title": "Arrive inside",
							"body": "<p>Collect keys from the host.</p>",
						},
						{
							"section": "Parking",
							"block_type": "Text",
							"title": "Parking bay",
							"body": "<p>Use bay 7.</p>",
						},
						{
							"section": "Rubbish",
							"block_type": "Text",
							"title": "Bins",
							"body": "<p>Green bins are behind the gate.</p>",
						},
						{
							"section": "House Rules",
							"block_type": "Warning",
							"title": "Quiet hours",
							"body": "<p>No loud music after 10pm.</p>",
						},
					],
				),
				**overrides,
			}
		).insert(ignore_permissions=True)
		self.to_delete.append(("Property Instruction", doc.name))
		self.clear_route_cache()
		return doc

	def get_context(self, doc):
		doc.reload()
		frappe.local.form_dict = frappe._dict({})
		frappe.local.request.args = frappe._dict({})
		context = frappe._dict(doc=doc)
		context.update(doc.as_dict())
		context.update(doc.get_page_info())
		context.base_template_path = get_base_template(doc.route) or "templates/base.html"
		context.boot = frappe._dict(lang="en", sysdefaults={})
		context.asset_version = "test-build-version"
		context.build_version = context.asset_version
		context.dev_server = "false"
		context.path = f"/{doc.route}"
		context.pathname = f"/{doc.route}"
		context.web_include_js = []
		context.web_include_icons = []
		context.show_language_picker = "false"
		context._context_dict = context
		frappe.local.response_headers = Headers()
		frappe.local.bundled_assets = get_assets_json() or {}
		out = doc.get_context(context)
		if out:
			context.update(out)
		return context

	def render_instruction(self, doc):
		context = self.get_context(doc)
		return frappe.get_template("templates/generators/property_instruction.html").render(context)

	def get_export_script_source(self):
		with open(EXPORT_SCRIPT_PATH) as export_script_file:
			return export_script_file.read()

	def get_property_instruction_schema(self):
		with open(PROPERTY_DOCTYPE_PATH) as doctype_file:
			return json.load(doctype_file)

	def get_block_doctype_json(self):
		with open(BLOCK_DOCTYPE_PATH) as block_doctype_file:
			return json.load(block_doctype_file)

	def get_property_instruction_doctype_script(self):
		with open(PROPERTY_DOCTYPE_SCRIPT_PATH) as doctype_script_file:
			return doctype_script_file.read()

	def make_site_file(self, filename, content=PNG_BYTES, private=False):
		base_path = frappe.get_site_path("private" if private else "public", "files")
		os.makedirs(base_path, exist_ok=True)
		file_path = os.path.join(base_path, filename)
		with open(file_path, "wb") as site_file:
			site_file.write(content)
		self.temp_files.append(file_path)
		return file_path

	def attach_private_file(self, attached_to_name, filename, content=ATTACHMENT_PNG_BYTES):
		file_doc = save_file(
			filename,
			content,
			"Property Instruction",
			attached_to_name,
			is_private=1,
		)
		self.to_delete.append(("File", file_doc.name))
		return file_doc

	def make_external_file_record(self, url):
		doc = frappe.get_doc(
			{
				"doctype": "File",
				"file_name": os.path.basename(urlparse(url).path) or "external-guide-image",
				"file_url": url,
				"is_private": 0,
			}
		).insert(ignore_permissions=True)
		self.to_delete.append(("File", doc.name))
		return doc


class TestPropertyInstruction(PropertyInstructionTestMixin, FrappeTestCase):
	def test_slug_generation_from_title(self):
		doc = self.make_instruction(slug=None, title="Test Guest Guide Property")
		self.assertEqual(doc.slug, "test-guest-guide-property")
		self.assertEqual(doc.route, "instructions/test-guest-guide-property")

	def test_slug_normalization(self):
		doc = self.make_instruction(slug="  Test_Guest GUIDE  ")
		self.assertEqual(doc.slug, "test-guest-guide")

	def test_route_generation(self):
		doc = self.make_instruction(slug="my-custom-slug")
		self.assertEqual(doc.route, "instructions/my-custom-slug")

	def test_user_supplied_route_is_replaced_by_the_slug_derived_route(self):
		doc = self.make_instruction(slug="server-route")
		doc.route = "arbitrary-public-route"
		doc.save(ignore_permissions=True)
		self.assertEqual(doc.route, "instructions/server-route")

	def test_existing_parent_snapshot_fields_reject_ordinary_save(self):
		doc = self.make_instruction()
		error_log_name = self.make_snapshot_error_log()
		for fieldname, value in {
			"custom_map_snapshot": "/private/files/forged.png",
			"custom_map_snapshot_status": "Ready",
			"custom_map_snapshot_source_hash": "forged-source-hash",
			"custom_map_snapshot_generated_at": "2099-01-01 00:00:00",
			"custom_map_snapshot_error_log": error_log_name,
		}.items():
			attempt = frappe.get_doc("Property Instruction", doc.name)
			attempt.set(fieldname, value)
			with self.assertRaisesRegex(frappe.ValidationError, "system managed"):
				attempt.save(ignore_permissions=True)

	def test_new_parent_rejects_prepopulated_snapshot_lifecycle_state(self):
		error_log_name = self.make_snapshot_error_log()
		doc = frappe.get_doc(
			{
				"doctype": "Property Instruction",
				"title": "Forged lifecycle guide",
				"property": self.make_property().name,
				"custom_map_snapshot": "/private/files/forged.png",
				"custom_map_snapshot_status": "Ready",
				"custom_map_snapshot_source_hash": "forged-source-hash",
				"custom_map_snapshot_generated_at": "2099-01-01 00:00:00",
				"custom_map_snapshot_error_log": error_log_name,
			}
		)
		with self.assertRaisesRegex(frappe.ValidationError, "system managed"):
			doc.insert(ignore_permissions=True)

	def test_existing_child_snapshot_fields_reject_ordinary_parent_save(self):
		doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Parking",
					"block_type": "Map",
					"title": "Parking map",
					"custom_map_embed_url": "https://www.google.com/maps/embed?pb=child-forgery",
				}
			]
		)
		attempt = frappe.get_doc("Property Instruction", doc.name)
		attempt.instruction_blocks[0].custom_map_snapshot_status = "Ready"
		with self.assertRaisesRegex(frappe.ValidationError, "system managed"):
			attempt.save(ignore_permissions=True)

	def test_new_child_rejects_prepopulated_snapshot_lifecycle_state(self):
		doc = self.make_instruction()
		error_log_name = self.make_snapshot_error_log()
		doc.append(
			"instruction_blocks",
			{
				"section": "Parking",
				"block_type": "Map",
				"title": "Forged map",
				"custom_map_embed_url": "https://www.google.com/maps/embed?pb=new-child-forgery",
				"custom_map_snapshot": "/private/files/forged.png",
				"custom_map_snapshot_status": "Ready",
				"custom_map_snapshot_source_hash": "forged-source-hash",
				"custom_map_snapshot_generated_at": "2099-01-01 00:00:00",
				"custom_map_snapshot_error_log": error_log_name,
			},
		)
		with self.assertRaisesRegex(frappe.ValidationError, "system managed"):
			doc.save(ignore_permissions=True)

	def test_client_set_value_cannot_bypass_snapshot_protection(self):
		doc = self.make_instruction()
		with self.assertRaisesRegex(frappe.ValidationError, "system managed"):
			frappe.get_attr("frappe.client.set_value")(
				doctype="Property Instruction",
				name=doc.name,
				fieldname="custom_map_snapshot_status",
				value="Ready",
			)

	def test_normal_parent_and_block_edits_remain_allowed(self):
		doc = self.make_instruction()
		doc.emergency_contact = "Updated contact"
		doc.instruction_blocks[0].title = "Updated block title"
		doc.save(ignore_permissions=True)
		doc.reload()
		self.assertEqual(doc.emergency_contact, "Updated contact")
		self.assertEqual(doc.instruction_blocks[0].title, "Updated block title")

	def test_duplicate_slug_rejection(self):
		self.make_instruction(slug="same-slug")
		with self.assertRaises(frappe.ValidationError):
			self.make_instruction(property_name=self.make_property().name, slug="same-slug")

	def test_explicit_valid_slug_preservation(self):
		doc = self.make_instruction(slug="keep-this-slug")
		self.assertEqual(doc.slug, "keep-this-slug")

	def test_published_document_public_route_exists(self):
		doc = self.make_instruction(published=1)
		self.assertEqual(_find_matching_document_webview(doc.route), ("Property Instruction", doc.name))

	def test_unpublished_document_not_publicly_available(self):
		doc = self.make_instruction(published=0)
		self.assertIsNone(_find_matching_document_webview(doc.route))

	def test_grouping_and_ordering_of_blocks(self):
		doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Check-In",
					"block_type": "Step",
					"title": "First",
					"body": "<p>One</p>",
					"step_number": 8,
				},
				{
					"section": "Check-In",
					"block_type": "Step",
					"title": "Second",
					"body": "<p>Two</p>",
					"step_number": 3,
				},
			]
		)
		sections = doc.get_grouped_blocks()
		self.assertEqual(sections[0].navigation_icon, "key")
		self.assertEqual([block.title for block in sections[0].blocks], ["First", "Second"])
		self.assertEqual([block.display_step_number for block in sections[0].blocks], [8, 3])

	def test_javascript_url_rejection(self):
		with self.assertRaises(frappe.ValidationError):
			self.make_instruction(
				instruction_blocks=[
					{
						"section": "Check-In",
						"block_type": "Link",
						"link_url": "javascript:alert(1)",
						"link_label": "Bad",
					}
				]
			)

	def test_empty_optional_fields_do_not_break_rendering(self):
		doc = self.make_instruction(
			address=None,
			google_maps_url=None,
			wifi_name=None,
			wifi_password=None,
			emergency_contact=None,
			cover_image=None,
		)
		html = self.render_instruction(doc)
		self.assertIn("Test Guest Guide Property", html)
		self.assertNotIn("WI-FI PASSWORD", html)

	def test_rendered_output_includes_expected_section_content(self):
		doc = self.make_instruction()
		html = self.render_instruction(doc)
		self.assertIn("Find entrance", html)
		self.assertIn("Parking bay", html)
		self.assertIn("Bins", html)
		self.assertIn("Quiet hours", html)
		self.assertIn("guest-wifi-only", html)

	def test_rendered_output_excludes_unpublished_content(self):
		doc = self.make_instruction(published=0)
		self.assertIsNone(_find_matching_document_webview(doc.route))

	def test_main_property_map_requires_explicit_embed(self):
		doc = self.make_instruction(
			custom_map_embed_url="",
			google_maps_url="",
			address="99A Burlington Road",
		)
		self.assertIsNone(doc.get_map_embed_url())
		property_map = doc.get_property_map()
		self.assertFalse(property_map.embed_url)
		self.assertFalse(property_map.external_url)

	def test_main_property_map_ignores_legacy_columns_without_explicit_embed(self):
		doc = self.make_instruction(
			custom_map_embed_url="",
			google_maps_url="",
			address="99A Burlington Road",
		)
		meta = frappe.get_meta("Property Instruction")
		self.assertFalse(meta.has_field("google_maps_place_id"))
		self.assertFalse(meta.has_field("map_search_query"))
		self.assertFalse(meta.has_field("map_zoom"))
		self.assertFalse(meta.has_field("map_type"))
		self.assertFalse(meta.has_field("show_embedded_map"))
		self.assertIsNone(doc.get_map_embed_url())
		context = doc.get_public_render_context()
		self.assertFalse(context.map_embed_enabled)
		self.assertFalse(context.property_map.embed_url)
		self.assertFalse(context.google_maps_url)

	def test_property_map_requires_embed_even_when_google_maps_url_is_present(self):
		doc = self.make_instruction(
			custom_map_embed_url="",
			google_maps_url="https://www.google.com/maps/place/99A+Burlington+Road",
		)
		property_map = doc.get_property_map()
		self.assertFalse(property_map.embed_url)
		self.assertFalse(property_map.external_url)
		html = self.render_instruction(doc)
		self.assertNotIn('data-guide-map-card', html)
		self.assertNotIn('data-guide-map-link', html)
		self.assertNotIn("Open in Google Maps", html)

	def test_property_map_custom_embed_url_exists_in_schema(self):
		schema = self.get_property_instruction_schema()
		fields_by_name = {field["fieldname"]: field for field in schema["fields"]}
		self.assertIn("custom_map_embed_url", fields_by_name)
		self.assertEqual(fields_by_name["custom_map_embed_url"]["fieldtype"], "Small Text")
		self.assertIn("Paste a Google Maps embed iframe or its src URL.", fields_by_name["custom_map_embed_url"]["description"])

	def test_property_custom_embed_accepts_standard_iframe_and_stores_canonical_url(self):
		doc = self.make_instruction(
			custom_map_embed_url='<iframe src="https://www.google.com/maps/embed?pb=abc&amp;z=12" width="600" height="450"></iframe>'
		)
		self.assertEqual(doc.custom_map_embed_url, "https://www.google.com/maps/embed?pb=abc&z=12")
		self.assertEqual(doc.get_map_embed_url(), "https://www.google.com/maps/embed?pb=abc&z=12")

	def test_property_custom_embed_accepts_mymaps_url_and_derives_viewer_link(self):
		doc = self.make_instruction(
			custom_map_embed_url="https://www.google.com/maps/d/embed?mid=1A1kCH3-hgmeHlANOAt-XJAm3t2ptm1U&ehbc=2E312F",
			google_maps_url=None,
			address=None,
		)
		context = doc.get_public_render_context()
		self.assertEqual(
			context.map_embed_url,
			"https://www.google.com/maps/d/embed?mid=1A1kCH3-hgmeHlANOAt-XJAm3t2ptm1U&ehbc=2E312F",
		)
		self.assertEqual(
			context.google_maps_url,
			"https://www.google.com/maps/d/viewer?mid=1A1kCH3-hgmeHlANOAt-XJAm3t2ptm1U&ehbc=2E312F",
		)
		self.assertEqual(context.property_map.embed_kind, "google-my-maps")

	def test_property_custom_embed_is_the_only_main_embed_source(self):
		doc = self.make_instruction(
			custom_map_embed_url="https://www.google.com/maps/embed?pb=override",
		)
		self.assertEqual(doc.get_map_embed_url(), "https://www.google.com/maps/embed?pb=override")
		self.assertEqual(doc.get_public_render_context().property_map.embed_url, "https://www.google.com/maps/embed?pb=override")

	def test_property_custom_embed_rejects_invalid_inputs(self):
		for invalid in (
			"https://example.com/maps/embed?pb=abc",
			"http://www.google.com/maps/embed?pb=abc",
			"javascript:alert(1)",
			'<iframe src="https://www.google.com/maps/embed?pb=one"></iframe><iframe src="https://www.google.com/maps/embed?pb=two"></iframe>',
			'<iframe width="600"></iframe>',
			"https://www.google.com.evil.example/maps/embed?pb=abc",
		):
			with self.assertRaises(frappe.ValidationError):
				self.make_instruction(title=f"Invalid {uuid.uuid4().hex[:6]}", custom_map_embed_url=invalid)

	def test_google_maps_url_rejects_untrusted_host(self):
		with self.assertRaises(frappe.ValidationError):
			self.make_instruction(google_maps_url="https://example.com/maps")

	def test_map_external_url_is_derived_from_explicit_embed(self):
		doc = self.make_instruction(
			custom_map_embed_url="https://www.google.com/maps/d/embed?mid=derive-main&ehbc=2E312F",
			google_maps_url=None,
		)
		self.assertEqual(
			doc.get_map_external_url(),
			"https://www.google.com/maps/d/viewer?mid=derive-main&ehbc=2E312F",
		)

	def test_map_block_option_and_canonical_embed_field_exist_in_schema(self):
		schema = self.get_block_doctype_json()
		fields_by_name = {field["fieldname"]: field for field in schema["fields"]}
		block_type_field = fields_by_name["block_type"]
		custom_embed_field = fields_by_name["custom_map_embed_url"]
		self.assertIn("Map", block_type_field["options"].splitlines())
		self.assertEqual(custom_embed_field["fieldtype"], "Small Text")
		self.assertEqual(custom_embed_field["depends_on"], 'eval:doc.block_type')
		self.assertEqual(custom_embed_field["mandatory_depends_on"], 'eval:doc.block_type == "Map"')
		self.assertIn("Paste a Google Maps embed iframe or its src URL.", custom_embed_field["description"])
		self.assertNotIn("google_maps_embed_html", fields_by_name)
		self.assertNotIn("google_maps_embed_html", schema["field_order"])
		self.assertNotIn("sort_order", fields_by_name)
		self.assertNotIn("sort_order", schema["field_order"])
		self.assertEqual(len(schema["fields"]), 15)

	def test_snapshot_fields_exist_in_parent_schema(self):
		schema = self.get_property_instruction_schema()
		fields_by_name = {field["fieldname"]: field for field in schema["fields"]}
		for removed_field in (
			"google_maps_place_id",
			"map_search_query",
			"map_zoom",
			"map_type",
			"show_embedded_map",
		):
			self.assertNotIn(removed_field, fields_by_name)
		self.assertEqual(fields_by_name["custom_map_snapshot"]["fieldtype"], "Attach Image")
		self.assertEqual(fields_by_name["custom_map_snapshot"]["hidden"], 1)
		self.assertEqual(fields_by_name["custom_map_snapshot"]["read_only"], 1)
		self.assertEqual(fields_by_name["custom_map_snapshot_status"]["options"], "Not Required\nPending\nProcessing\nReady\nFailed")
		self.assertEqual(fields_by_name["custom_map_snapshot_status"]["read_only"], 1)
		self.assertEqual(fields_by_name["custom_map_snapshot_source_hash"]["hidden"], 1)
		self.assertEqual(fields_by_name["custom_map_snapshot_source_hash"]["read_only"], 1)
		self.assertEqual(fields_by_name["custom_map_snapshot_generated_at"]["fieldtype"], "Datetime")
		self.assertEqual(fields_by_name["custom_map_snapshot_generated_at"]["read_only"], 1)
		self.assertEqual(fields_by_name["custom_map_snapshot_error_log"]["options"], "Error Log")
		self.assertEqual(fields_by_name["custom_map_snapshot_error_log"]["read_only"], 1)
		self.assertEqual(fields_by_name["route"]["read_only"], 1)
		for fieldname in (
			"custom_map_snapshot",
			"custom_map_snapshot_status",
			"custom_map_snapshot_source_hash",
			"custom_map_snapshot_generated_at",
			"custom_map_snapshot_error_log",
		):
			self.assertEqual(fields_by_name[fieldname]["in_list_view"], 0)
		for fieldname in ("slug", "custom_map_embed_url", "google_maps_url"):
			self.assertNotEqual(fields_by_name[fieldname].get("read_only"), 1)

	def test_snapshot_fields_exist_in_block_schema(self):
		schema = self.get_block_doctype_json()
		fields_by_name = {field["fieldname"]: field for field in schema["fields"]}
		self.assertEqual(fields_by_name["custom_map_snapshot"]["fieldtype"], "Attach Image")
		self.assertEqual(fields_by_name["custom_map_snapshot"]["hidden"], 1)
		self.assertEqual(fields_by_name["custom_map_snapshot"]["read_only"], 1)
		self.assertEqual(fields_by_name["custom_map_snapshot_status"]["options"], "Not Required\nPending\nProcessing\nReady\nFailed")
		self.assertEqual(fields_by_name["custom_map_snapshot_status"]["read_only"], 1)
		self.assertEqual(fields_by_name["custom_map_snapshot_source_hash"]["hidden"], 1)
		self.assertEqual(fields_by_name["custom_map_snapshot_source_hash"]["read_only"], 1)
		self.assertEqual(fields_by_name["custom_map_snapshot_generated_at"]["fieldtype"], "Datetime")
		self.assertEqual(fields_by_name["custom_map_snapshot_generated_at"]["read_only"], 1)
		self.assertEqual(fields_by_name["custom_map_snapshot_error_log"]["options"], "Error Log")
		self.assertEqual(fields_by_name["custom_map_snapshot_error_log"]["read_only"], 1)
		for fieldname in (
			"custom_map_snapshot",
			"custom_map_snapshot_status",
			"custom_map_snapshot_source_hash",
			"custom_map_snapshot_generated_at",
			"custom_map_snapshot_error_log",
		):
			self.assertEqual(fields_by_name[fieldname]["in_list_view"], 0)
		for fieldname in ("custom_map_embed_url", "step_number"):
			self.assertNotEqual(fields_by_name[fieldname].get("read_only"), 1)

	def test_property_instruction_admin_form_actions_are_present(self):
		source = self.get_property_instruction_doctype_script()
		self.assertIn("Generate Map Snapshots", source)
		self.assertIn("Regenerate Map Snapshots", source)
		self.assertIn("Retry Failed Map Snapshots", source)

	def test_new_custom_map_becomes_pending(self):
		doc = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=pending-main")
		self.assertEqual(doc.custom_map_snapshot_status, "Pending")

	def test_ready_matching_snapshot_remains_ready_on_unrelated_save(self):
		doc = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=stable-main")
		doc.custom_map_snapshot = "/private/files/current.png"
		doc.custom_map_snapshot_status = "Ready"
		doc.custom_map_snapshot_source_hash = property_instruction_module.build_map_source_hash(
			doc.custom_map_embed_url,
			doc.get_property_map().embed_kind,
		)
		self.attach_private_file(doc.name, "current.png")
		doc.emergency_contact = "Updated"
		self.save_snapshot_system_state(doc)
		self.assertEqual(doc.custom_map_snapshot_status, "Ready")

	def test_stale_parent_save_preserves_newer_ready_snapshot_state(self):
		doc = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=stale-parent")
		stale_doc = frappe.get_doc("Property Instruction", doc.name)
		expected_hash = property_instruction_module.build_map_source_hash(
			doc.custom_map_embed_url,
			doc.get_property_map().embed_kind,
		)
		capture_job = frappe.get_attr("propms.map_snapshot.jobs.capture_property_instruction_maps")
		with patch("propms.map_snapshot.jobs.capture_map_png") as capture_mock:
			capture_mock.return_value = frappe._dict(
				png_bytes=PNG_BYTES,
				pixel_width=2094,
				pixel_height=1180,
				map_kind="google-maps",
				source_hash=expected_hash,
				capture_duration_seconds=1.0,
				settling_duration_seconds=1.0,
				stability_score=0.0,
				chromium_version="Chromium 150.0.7871.181",
				cleanup_diagnostics={},
			)
			capture_job(
				doc.name,
				build_manifest_hash(
					[
						MapSnapshotManifestEntry(
							map_key="property-location",
							row_name=None,
							map_kind="google-maps",
							expected_source_hash=expected_hash,
						)
					]
				),
				[
					{
						"map_key": "property-location",
						"row_name": None,
						"map_kind": "google-maps",
						"expected_source_hash": expected_hash,
					}
				],
			)
		frappe.db.commit()
		ready_state = self.get_snapshot_state("Property Instruction", doc.name)
		self.assertEqual(ready_state.custom_map_snapshot_status, "Ready")
		stale_doc.emergency_contact = "Stale save"
		self.save_snapshot_system_state(stale_doc)
		frappe.db.commit()
		final_state = self.get_snapshot_state("Property Instruction", doc.name)
		self.assertEqual(final_state.custom_map_snapshot_status, "Ready")
		self.assertEqual(final_state.custom_map_snapshot, ready_state.custom_map_snapshot)
		self.assertEqual(final_state.custom_map_snapshot_source_hash, ready_state.custom_map_snapshot_source_hash)

	def test_stale_child_save_preserves_newer_ready_snapshot_state(self):
		doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Map",
					"title": "Door map",
					"custom_map_embed_url": "https://www.google.com/maps/embed?pb=stale-child",
				}
			]
		)
		row_name = doc.instruction_blocks[0].name
		stale_doc = frappe.get_doc("Property Instruction", doc.name)
		block_map = doc.get_block_map_data(doc.instruction_blocks[0])
		expected_hash = property_instruction_module.build_map_source_hash(
			block_map.embed_url,
			block_map.embed_kind,
		)
		capture_job = frappe.get_attr("propms.map_snapshot.jobs.capture_property_instruction_maps")
		with patch("propms.map_snapshot.jobs.capture_map_png") as capture_mock:
			capture_mock.return_value = frappe._dict(
				png_bytes=PNG_BYTES,
				pixel_width=2094,
				pixel_height=1180,
				map_kind="google-maps",
				source_hash=expected_hash,
				capture_duration_seconds=1.0,
				settling_duration_seconds=1.0,
				stability_score=0.0,
				chromium_version="Chromium 150.0.7871.181",
				cleanup_diagnostics={},
			)
			capture_job(
				doc.name,
				build_manifest_hash(
					[
						MapSnapshotManifestEntry(
							map_key="block",
							row_name=row_name,
							map_kind="google-maps",
							expected_source_hash=expected_hash,
						)
					]
				),
				[
					{
						"map_key": "block",
						"row_name": row_name,
						"map_kind": "google-maps",
						"expected_source_hash": expected_hash,
					}
				],
			)
		frappe.db.commit()
		ready_state = self.get_snapshot_state("Property Instruction Block", row_name)
		self.assertEqual(ready_state.custom_map_snapshot_status, "Ready")
		stale_doc.emergency_contact = "Stale child save"
		self.save_snapshot_system_state(stale_doc)
		frappe.db.commit()
		final_state = self.get_snapshot_state("Property Instruction Block", row_name)
		self.assertEqual(final_state.custom_map_snapshot_status, "Ready")
		self.assertEqual(final_state.custom_map_snapshot, ready_state.custom_map_snapshot)
		self.assertEqual(final_state.custom_map_snapshot_source_hash, ready_state.custom_map_snapshot_source_hash)

	def test_failed_unchanged_snapshot_does_not_auto_retry(self):
		doc = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=failed-main")
		error_log = frappe.log_error(
			title="Snapshot failed",
			message="snapshot failed",
			reference_doctype="Property Instruction",
			reference_name=doc.name,
		)
		self.to_delete.append(("Error Log", error_log.name))
		doc.custom_map_snapshot_status = "Failed"
		doc.custom_map_snapshot_error_log = error_log.name
		self.save_snapshot_system_state(doc)
		self.assertEqual(doc.custom_map_snapshot_status, "Failed")
		self.assertEqual(doc.custom_map_snapshot_error_log, error_log.name)

	def test_removed_custom_map_becomes_not_required(self):
		doc = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=remove-main")
		file_doc = save_snapshot_png(
			property_instruction=doc.name,
			map_key="property-location",
			row_name=None,
			source_hash=build_map_source_hash(doc.custom_map_embed_url, doc.get_property_map().embed_kind),
			png_bytes=PNG_BYTES,
		)
		doc.custom_map_snapshot = file_doc.file_url
		doc.custom_map_snapshot_status = "Ready"
		doc.custom_map_snapshot_source_hash = build_map_source_hash(
			doc.custom_map_embed_url, doc.get_property_map().embed_kind
		)
		self.save_snapshot_system_state(doc)
		doc.custom_map_embed_url = ""
		doc.save(ignore_permissions=True)
		frappe.db.commit()
		self.assertEqual(doc.custom_map_snapshot_status, "Not Required")
		self.assertFalse(doc.custom_map_snapshot)
		self.assertFalse(frappe.db.exists("File", file_doc.name))

	def test_clearing_main_embed_preserves_snapshot_file_still_used_by_block(self):
		doc = self.make_instruction(
			custom_map_embed_url="https://www.google.com/maps/embed?pb=shared-main",
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Map",
					"title": "Shared block map",
					"custom_map_embed_url": "https://www.google.com/maps/embed?pb=shared-main",
				}
			],
		)
		source_hash = build_map_source_hash(doc.custom_map_embed_url, doc.get_property_map().embed_kind)
		file_doc = save_snapshot_png(
			property_instruction=doc.name,
			map_key="property-location",
			row_name=None,
			source_hash=source_hash,
			png_bytes=PNG_BYTES,
		)
		doc.custom_map_snapshot = file_doc.file_url
		doc.custom_map_snapshot_status = "Ready"
		doc.custom_map_snapshot_source_hash = source_hash
		block_row = doc.instruction_blocks[0]
		block_row.custom_map_snapshot = file_doc.file_url
		block_row.custom_map_snapshot_status = "Ready"
		block_row.custom_map_snapshot_source_hash = source_hash
		self.save_snapshot_system_state(doc)
		doc.custom_map_embed_url = ""
		doc.save(ignore_permissions=True)
		frappe.db.commit()
		doc.reload()
		block_row = doc.instruction_blocks[0]
		self.assertEqual(doc.custom_map_snapshot_status, "Not Required")
		self.assertFalse(doc.custom_map_snapshot)
		self.assertEqual(block_row.custom_map_snapshot, file_doc.file_url)
		self.assertEqual(block_row.custom_map_snapshot_status, "Ready")
		self.assertTrue(frappe.db.exists("File", file_doc.name))

	def test_property_instruction_wifi_qr_fields_exist_in_schema(self):
		schema = self.get_property_instruction_schema()
		fields_by_name = {field["fieldname"]: field for field in schema["fields"]}
		self.assertIn("show_wifi_qr_in_pdf", fields_by_name)
		self.assertIn("wifi_security_type", fields_by_name)
		self.assertIn("wifi_hidden_network", fields_by_name)
		self.assertEqual(fields_by_name["show_wifi_qr_in_pdf"]["default"], "0")
		self.assertEqual(fields_by_name["wifi_security_type"]["default"], "WPA")
		self.assertEqual(fields_by_name["wifi_security_type"]["options"], "WPA\nWEP\nOpen")
		self.assertEqual(fields_by_name["wifi_security_type"]["depends_on"], "eval:doc.show_wifi_qr_in_pdf")
		self.assertEqual(fields_by_name["wifi_hidden_network"]["depends_on"], "eval:doc.show_wifi_qr_in_pdf")

	def test_wifi_security_type_normalization_uses_canonical_values(self):
		self.assertEqual(self.make_instruction(title="WiFi WPA", wifi_security_type="WPA").get_normalized_wifi_security_type(), "WPA")
		self.assertEqual(self.make_instruction(title="WiFi WEP", wifi_security_type="WEP").get_normalized_wifi_security_type(), "WEP")
		self.assertEqual(self.make_instruction(title="WiFi Open Canonical", wifi_security_type="Open").get_normalized_wifi_security_type(), "Open")
		self.assertEqual(self.make_instruction(title="WiFi Open Lowercase", wifi_security_type="open").get_normalized_wifi_security_type(), "Open")
		self.assertEqual(self.make_instruction(title="WiFi Open Uppercase", wifi_security_type="OPEN").get_normalized_wifi_security_type(), "Open")
		self.assertEqual(self.make_instruction(title="WiFi invalid", wifi_security_type="unknown").get_normalized_wifi_security_type(), "WPA")

	def test_open_wifi_network_is_exposed_as_open_without_password_requirement(self):
		doc = self.make_instruction(
			show_wifi_qr_in_pdf=1,
			show_wifi_password_publicly=1,
			wifi_security_type="OPEN",
			wifi_password=None,
		)
		source = self.get_export_script_source()
		self.assertEqual(doc.get_normalized_wifi_security_type(), "Open")
		self.assertIn('securityType === "OPEN"', source)
		self.assertIn('return "WIFI:T:nopass;S:"', source)

	def test_map_block_accepts_valid_google_embed_and_excludes_raw_html_from_context(self):
		embed_html = '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2484.0!2d-0.249!3d51.399!2m3!1f0!2f0!3f0!3m2!1i1024!2i768"></iframe>'
		doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Map",
					"title": "Front entrance map",
					"custom_map_embed_url": embed_html,
				},
			]
		)
		self.assertEqual(
			doc.instruction_blocks[0].custom_map_embed_url,
			"https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2484.0!2d-0.249!3d51.399!2m3!1f0!2f0!3f0!3m2!1i1024!2i768",
		)
		grouped_sections = doc.get_grouped_blocks()
		block = grouped_sections[0].blocks[0]
		self.assertEqual(block.block_type, "Map")
		self.assertEqual(block.map_embed_url, "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2484.0!2d-0.249!3d51.399!2m3!1f0!2f0!3f0!3m2!1i1024!2i768")
		self.assertNotIn("google_maps_embed_html", block)
		self.assertNotIn("custom_map_embed_url", block)
		html = self.render_instruction(doc)
		self.assertIn('class="pi-instruction-map"', html)
		self.assertIn('src="https://www.google.com/maps/embed?pb=', html)
		self.assertNotIn("onclick=", html)
		self.assertNotIn("google_maps_embed_html", html)

	def test_map_block_rejects_invalid_google_embed_html(self):
		with self.assertRaises(frappe.ValidationError):
			self.make_instruction(
				instruction_blocks=[
					{
						"section": "Finding the Property",
						"block_type": "Map",
						"title": "Bad map",
						"custom_map_embed_url": '<iframe src="https://example.com/maps/embed"></iframe>',
					},
				]
			)
		with self.assertRaises(frappe.ValidationError):
			self.make_instruction(
				instruction_blocks=[
					{
						"section": "Finding the Property",
						"block_type": "Map",
						"title": "Bad map",
						"custom_map_embed_url": '<iframe srcdoc="<script>alert(1)</script>" src="https://www.google.com/maps/embed?pb=1"></iframe>',
					},
				]
			)
		with self.assertRaises(frappe.ValidationError):
			self.make_instruction(
				instruction_blocks=[
					{
						"section": "Finding the Property",
						"block_type": "Map",
						"title": "Bad map",
						"custom_map_embed_url": '<iframe src="javascript:alert(1)"></iframe>',
					},
				]
			)

	def test_map_block_accepts_direct_mymaps_url(self):
		doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Map",
					"title": "Site map",
					"custom_map_embed_url": "https://www.google.com/maps/d/embed?mid=mid123&ehbc=2E312F",
				},
			]
		)
		block = doc.get_grouped_blocks()[0].blocks[0]
		self.assertEqual(block.map_embed_url, "https://www.google.com/maps/d/embed?mid=mid123&ehbc=2E312F")
		self.assertEqual(block.map_embed_kind, "google-my-maps")
		self.assertEqual(block.map_external_url, "https://www.google.com/maps/d/viewer?mid=mid123&ehbc=2E312F")

	def test_map_block_counts_as_content_and_uses_embed_or_view_link_fallback(self):
		doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Map",
					"title": "Arrival map",
					"custom_map_embed_url": '<iframe src="https://www.google.com/maps?output=embed&q=99A+Burlington+Road"></iframe>',
				},
			]
		)
		grouped_sections = doc.get_grouped_blocks()
		self.assertEqual(grouped_sections[0].blocks[0].block_type, "Map")
		self.assertIn("https://www.google.com/maps", grouped_sections[0].blocks[0].map_external_url)

	def test_step_block_with_embed_html_renders_a_validated_map(self):
		embed_html = '<iframe src="https://www.google.com/maps/embed?pb=!1m18!2m3!1d1!2d-0.249!3d51.399!3m2!1i1024!2i768!4f13.1"></iframe>'
		doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Check-In",
					"block_type": "Step",
					"title": "Find the entrance",
					"body": "<p>Use this map to find the side entrance.</p>",
					"custom_map_embed_url": embed_html,
				},
			]
		)
		block = doc.get_grouped_blocks()[0].blocks[0]
		self.assertEqual(block.block_type, "Step")
		self.assertEqual(block.map_embed_url, "https://www.google.com/maps/embed?pb=!1m18!2m3!1d1!2d-0.249!3d51.399!3m2!1i1024!2i768!4f13.1")
		html = self.render_instruction(doc)
		self.assertIn('data-guide-block-map', html)
		self.assertIn('class="pi-instruction-map"', html)
		self.assertNotIn("data-guide-block-map-center-latitude=", html)
		self.assertNotIn("data-guide-block-map-coordinate-source=", html)

	def test_export_script_creates_block_shell_with_embed_kind_class(self):
		source = self.get_export_script_source()
		self.assertIn('shell.className = "pi-instruction-map-shell notranslate";', source)
		self.assertIn('shell.classList.add("pi-instruction-map-shell--" + embedKindClass);', source)

	def test_public_render_context_exposes_safe_pdf_snapshot_fields(self):
		doc = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=context-snapshot")
		source_hash = build_map_source_hash(doc.custom_map_embed_url, doc.get_property_map().embed_kind)
		file_doc = save_snapshot_png(
			property_instruction=doc.name,
			map_key="property-location",
			row_name=None,
			source_hash=source_hash,
			png_bytes=PNG_BYTES,
		)
		doc.custom_map_snapshot = file_doc.file_url
		doc.custom_map_snapshot_status = "Ready"
		doc.custom_map_snapshot_source_hash = source_hash
		context = doc.get_public_render_context()
		self.assertEqual(context.property_map.pdf_representation, "snapshot")
		self.assertIn(PUBLIC_MAP_SNAPSHOT_IMAGE_ENDPOINT, context.property_map.pdf_snapshot_image_url)
		self.assertNotIn("/private/files/", context.property_map.pdf_snapshot_image_url)
		self.assertEqual(context.property_map.pdf_desired_source_hash, source_hash)

	def test_empty_main_embed_renders_no_property_location_section(self):
		doc = self.make_instruction(
			custom_map_embed_url="",
			google_maps_url="",
			address="10 Downing Street",
		)
		context = doc.get_public_render_context()
		self.assertFalse(context.property_map.embed_url)
		self.assertFalse(context.property_map.external_url)
		self.assertEqual(context.property_map.pdf_representation, "none")
		self.assertEqual(context.property_map.pdf_snapshot_image_url, "")
		html = self.render_instruction(doc)
		self.assertNotIn('data-guide-map-card', html)
		self.assertNotIn('data-guide-map-embed-url=', html)
		self.assertNotIn('data-guide-map-link', html)
		self.assertNotIn("Property Location", html)
		self.assertNotIn("Open in Google Maps", html)
		self.assertNotIn("Legacy Query", html)

	def test_google_maps_url_without_embed_renders_no_property_location_section(self):
		doc = self.make_instruction(
			custom_map_embed_url="",
			google_maps_url="https://www.google.com/maps/place/No+Embed",
		)
		html = self.render_instruction(doc)
		self.assertNotIn('data-guide-map-card', html)
		self.assertNotIn('data-guide-map-link', html)
		self.assertNotIn("Open in Google Maps", html)

	def test_rendered_html_contains_safe_main_and_block_pdf_map_attributes(self):
		doc = self.make_instruction(
			custom_map_embed_url="https://www.google.com/maps/d/embed?mid=html-parent&ehbc=2E312F",
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Map",
					"title": "Arrival map",
					"custom_map_embed_url": "https://www.google.com/maps/embed?pb=html-child",
				}
			]
		)
		parent_hash = build_map_source_hash(doc.custom_map_embed_url, doc.get_property_map().embed_kind)
		parent_file = save_snapshot_png(
			property_instruction=doc.name,
			map_key="property-location",
			row_name=None,
			source_hash=parent_hash,
			png_bytes=PNG_BYTES,
		)
		doc.custom_map_snapshot = parent_file.file_url
		doc.custom_map_snapshot_status = "Ready"
		doc.custom_map_snapshot_source_hash = parent_hash
		row = doc.instruction_blocks[0]
		block_map = doc.get_block_map_data(row)
		block_hash = build_map_source_hash(block_map.embed_url, block_map.embed_kind)
		block_file = save_snapshot_png(
			property_instruction=doc.name,
			map_key="block",
			row_name=row.name,
			source_hash=block_hash,
			png_bytes=PNG_BYTES,
		)
		row.custom_map_snapshot = block_file.file_url
		row.custom_map_snapshot_status = "Ready"
		row.custom_map_snapshot_source_hash = block_hash
		self.save_snapshot_system_state(doc)
		html = self.render_instruction(doc)
		self.assertIn('data-guide-map-pdf-representation="snapshot"', html)
		self.assertIn('data-guide-block-map-pdf-representation="snapshot"', html)
		self.assertIn(PUBLIC_MAP_SNAPSHOT_IMAGE_ENDPOINT, html)
		self.assertNotIn("/private/files/", html)

	def test_text_block_with_embed_html_renders_a_validated_map(self):
		embed_html = '<iframe src="https://www.google.com/maps?output=embed&q=51.399,-0.249"></iframe>'
		doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Text",
					"title": "Map details",
					"body": "<p>Approach from the high street.</p>",
					"custom_map_embed_url": embed_html,
				},
			]
		)
		block = doc.get_grouped_blocks()[0].blocks[0]
		self.assertEqual(block.block_type, "Text")
		self.assertEqual(block.map_embed_url, "https://www.google.com/maps?output=embed&q=51.399,-0.249")
		self.assertIn("https://www.google.com/maps", block.map_external_url)

	def test_block_map_external_url_falls_back_to_embed_or_view_url_without_coordinates(self):
		embed_html = (
			'<iframe src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!'
			'1d1279.5630588056072!2d-0.24875145778959576!3d51.40036019312703!2m3!'
			'1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!'
			'1s0x48760b63ea8c7a0d%3A0x17987c5fb2499918!2s99A%20Burlington%20Rd%2C%20New%20Malden%20KT3%204LR!'
			'5e0!3m2!1sen!2suk!4v1753776094216!5m2!1sen!2suk!2zNTHCsDI0JzAyLjEiTiAwwrAxNCc1MC4zIlc"></iframe>'
		)
		doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Parking",
					"block_type": "Map",
					"title": "Parking map",
					"custom_map_embed_url": embed_html,
				},
			]
		)
		block = doc.get_grouped_blocks()[0].blocks[0]
		self.assertTrue(block.map_embed_url.startswith("https://www.google.com/maps/embed?pb="))
		self.assertTrue(block.map_external_url)
		self.assertIn("https://www.google.com/maps", block.map_external_url)

	def test_non_map_blocks_do_not_require_embed_html(self):
		doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Check-In",
					"block_type": "Step",
					"title": "No map needed",
					"body": "<p>Use the front gate.</p>",
				},
			]
		)
		self.assertEqual(doc.get_grouped_blocks()[0].blocks[0].block_type, "Step")

	def test_invalid_non_map_embed_html_is_rejected(self):
		with self.assertRaises(frappe.ValidationError):
			self.make_instruction(
				instruction_blocks=[
					{
						"section": "Check-In",
						"block_type": "Step",
						"title": "Bad step map",
						"body": "<p>Bad map.</p>",
						"custom_map_embed_url": '<iframe src="https://example.com/maps/embed"></iframe>',
					},
				]
			)

	def test_legacy_block_embed_value_is_not_a_runtime_fallback(self):
		doc = self.make_instruction()
		row = frappe._dict(
			section="Finding the Property",
			block_type="Map",
			title="Legacy map",
			custom_map_embed_url="",
			google_maps_embed_html='<iframe src="https://www.google.com/maps/embed?pb=legacy"></iframe>',
		)
		self.assertEqual(doc.get_block_map_embed_input(row), "")
		self.assertFalse(doc.get_block_map_data(row).embed_url)

	def test_google_translate_widget_disabled_by_default(self):
		self.set_property_management_setting("enable_guest_guide_google_translate", 0)
		doc = self.make_instruction()
		context = self.get_context(doc)
		html = self.render_instruction(doc)
		self.assertFalse(context.google_translate.enabled)
		self.assertNotIn("google_translate_element", html)

	def test_google_translate_widget_renders_when_enabled(self):
		self.set_property_management_setting("enable_guest_guide_google_translate", 1)
		self.set_property_management_setting("guest_guide_source_language", "en")
		self.set_property_management_setting("guest_guide_translate_languages", "es,fr,de")
		doc = self.make_instruction()
		context = self.get_context(doc)
		html = self.render_instruction(doc)
		self.assertTrue(context.google_translate.enabled)
		self.assertEqual(context.google_translate.included_languages, ["es", "fr", "de"])
		self.assertIn("translate.google.com/translate_a/element.js", html)
		self.assertIn("id=\"google_translate_element\"", html)

	def test_google_translate_uses_full_language_list_when_restriction_empty(self):
		self.set_property_management_setting("enable_guest_guide_google_translate", 1)
		self.set_property_management_setting("guest_guide_translate_languages", "")
		doc = self.make_instruction()
		context = self.get_context(doc)
		self.assertEqual(context.google_translate.included_languages, [])
		self.assertNotIn("includedLanguages", context.google_translate.config_json)

	def test_google_translate_restriction_is_sanitized(self):
		self.set_property_management_setting("enable_guest_guide_google_translate", 1)
		self.set_property_management_setting(
			"guest_guide_translate_languages",
			'es, FR ,<script>alert(1)</script>,pt-br,xx";alert(1)//',
		)
		doc = self.make_instruction()
		context = self.get_context(doc)
		self.assertEqual(context.google_translate.included_languages, ["es", "fr", "pt-br"])
		self.assertNotIn("<script>", context.google_translate.config_json)
		self.assertNotIn("alert(1)", context.google_translate.config_json)

	def test_wifi_password_renders_when_populated(self):
		doc = self.make_instruction(wifi_password="guest-wifi-only")
		html = self.render_instruction(doc)
		self.assertIn("Wi-Fi Password", html)
		self.assertIn("guest-wifi-only", html)
		self.assertIn('id="wifi-password-public"', html)

	def test_password_is_omitted_when_empty(self):
		doc = self.make_instruction(wifi_password=None)
		html = self.render_instruction(doc)
		self.assertNotIn("WI-FI PASSWORD", html)
		self.assertNotIn('id="wifi-password-public"', html)

	def test_password_special_characters_render_exactly(self):
		doc = self.make_instruction(wifi_password="Gu3st! Pass: #%&[]")
		html = self.render_instruction(doc)
		self.assertIn("Gu3st! Pass:", html)
		self.assertIn("%", html)
		self.assertIn("[]", html)

	def test_protected_identifier_values_are_marked_notranslate(self):
		doc = self.make_instruction(address="99A Burlington Road", wifi_name="Estaex Guest WiFi")
		html = self.render_instruction(doc)
		self.assertIn('id="property-address"', html)
		self.assertIn('id="wifi-network-name"', html)
		self.assertIn('class="pi-copy-value notranslate"', html)
		self.assertIn('translate="no">99A Burlington Road', html)
		self.assertIn('translate="no">Estaex Guest WiFi', html)

	def test_copy_buttons_reference_visible_targets(self):
		doc = self.make_instruction()
		html = self.render_instruction(doc)
		self.assertIn('data-copy-target="property-address"', html)
		self.assertIn('data-copy-target="wifi-network-name"', html)
		self.assertIn('data-copy-target="wifi-password-public"', html)
		self.assertNotIn("data-copy-value=", html)

	def test_template_includes_external_export_script_and_hooks(self):
		self.set_property_management_setting("enable_guest_guide_google_translate", 1)
		doc = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=template-main")
		html = self.render_instruction(doc)
		self.assertIn("/assets/propms/js/property_instruction_export.js?v=test-build-version", html)
		self.assertIn("translate.google.com/translate_a/element.js", html)
		self.assertIn("pi-pdf-download", html)
		self.assertIn('data-guide-root', html)
		self.assertIn('data-guide-screen', html)
		self.assertIn('data-guide-section', html)
		self.assertIn('data-guide-block', html)
		self.assertIn('data-guide-map-card', html)
		self.assertIn('data-guide-kicker', html)
		self.assertIn('data-guide-map-title', html)
		self.assertIn('data-guide-translation-kind="translatable"', html)
		self.assertIn('data-guide-translation-kind="proper_name_or_identifier"', html)
		self.assertIn('data-guide-translation-kind="protected"', html)
		self.assertIn('data-guide-translation-kind="numeric_or_time"', html)
		self.assertNotIn("download_pdf?", html)
		self.assertNotIn("Property Instruction Translation", html)
		self.assertNotIn("Google Cloud Translation", html)
		self.assertIn('data-guide-toolbar', html)
		self.assertIn('class="pi-google-translate-engine"', html)
		self.assertNotIn('class="pi-translate-shell"', html)

	def test_template_uses_sticky_toolbar_outside_guide_screen_without_duplicate_actions(self):
		self.set_property_management_setting("enable_guest_guide_google_translate", 1)
		doc = self.make_instruction()
		html = self.render_instruction(doc)
		self.assertEqual(html.count("pi-pdf-download"), 1)
		self.assertEqual(html.count("property-instruction-print"), 1)
		self.assertLess(html.index('data-guide-toolbar'), html.index('data-guide-screen'))
		self.assertIn('data-guide-language-select', html)
		self.assertIn('Powered by Google Translate', html)
		self.assertIn('iframe.goog-te-banner-frame', html)
		self.assertIn('iframe.VIpgJd-ZVi9od-ORHb-OEVmcd', html)
		self.assertIn('.VIpgJd-ZVi9od-xl07Ob-OEVmcd', html)
		self.assertIn('.VIpgJd-ZVi9od-SmfZ-OEVmcd', html)
		self.assertEqual(html.count('class="pi-toolbar-action-icon"'), 3)
		self.assertEqual(html.count('class="pi-toolbar-action-label"'), 3)
		self.assertIn('class="pi-translate-attribution pi-translate-attribution--toolbar"', html)
		self.assertIn('class="pi-translate-attribution pi-translate-attribution--mobile"', html)
		self.assertLess(
			html.index('data-guide-toolbar'),
			html.index('class="pi-translate-attribution pi-translate-attribution--mobile"')
		)
		self.assertLess(
			html.index('class="pi-translate-attribution pi-translate-attribution--mobile"'),
			html.index('data-guide-screen')
		)

	def test_template_uses_compact_mobile_icon_toolbar_rules(self):
		html = self.render_instruction(self.make_instruction())
		self.assertIn("grid-template-columns: minmax(0, 1fr) auto;", html)
		self.assertIn(".pi-toolbar-actions .pi-btn {", html)
		self.assertIn("flex: 0 0 2.75rem;", html)
		self.assertIn("width: 2.75rem;", html)
		self.assertIn("height: 2.75rem;", html)
		self.assertIn(".pi-toolbar-action-label,", html)
		self.assertIn(".pi-toolbar-label,", html)
		self.assertIn(".pi-translation-status {", html)
		self.assertIn("clip-path: inset(50%);", html)
		self.assertIn(".pi-pdf-progress {", html)
		self.assertIn("grid-column: 1 / -1;", html)
		self.assertIn(".pi-translate-attribution--toolbar {", html)
		self.assertIn(".pi-translate-attribution--mobile {", html)
		self.assertIn("text-align: end;", html)

	def test_template_includes_empty_state_hook_when_no_sections(self):
		doc = self.make_instruction(instruction_blocks=[])
		html = self.render_instruction(doc)
		self.assertIn('data-guide-empty-state', html)

	def test_parking_heading_remains_translatable_while_road_list_is_protected(self):
		doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Parking",
					"block_type": "Text",
					"title": "Nearby roads",
					"body": "<p>• Beverley Road</p><p>• Blagdon Road</p><p>• Onslow Road</p>",
				},
			],
		)
		html = self.render_instruction(doc)
		self.assertIn(
			'data-pdf-section="parking" data-guide-section-title data-guide-signature data-guide-translation-kind="translatable" data-guide-allow-identical-languages="fr">Parking</h2>',
			html,
		)
		self.assertNotIn(
			'data-pdf-section="parking" data-guide-section-title data-guide-signature data-guide-translation-kind="translatable" data-guide-allow-identical="1"',
			html,
		)
		self.assertIn(
			'Nearby roads',
			html,
		)
		self.assertIn(
			'data-guide-block-body data-guide-signature data-guide-translation-kind="proper_name_or_identifier" data-guide-allow-identical="1" translate="no"',
			html,
		)

	def test_template_loads_export_script_before_google_translate_script(self):
		self.set_property_management_setting("enable_guest_guide_google_translate", 1)
		doc = self.make_instruction()
		html = self.render_instruction(doc)
		export_index = html.index("/assets/propms/js/property_instruction_export.js?v=test-build-version")
		google_index = html.index("translate.google.com/translate_a/element.js")
		self.assertLess(export_index, google_index)
		self.assertIn("__propertyInstructionGoogleScriptRequestedAt = Date.now()", html)

	def test_export_script_uses_adaptive_vector_jspdf_without_html2canvas(self):
		source = self.get_export_script_source()
		ensure_original_snapshot_start = source.index("function ensureOriginalSnapshotCaptured()")
		ensure_original_snapshot_end = source.index("function sleep(", ensure_original_snapshot_start)
		ensure_original_snapshot_source = source[ensure_original_snapshot_start:ensure_original_snapshot_end]
		self.assertIn("function buildPdfExportDocument(model)", source)
		self.assertIn('querySelectorAll("[data-pdf-page]")', source)
		self.assertIn("new jsPDF({", source)
		self.assertIn('var PDF_RENDERER_ID = "adaptive-vector";', source)
		self.assertIn("function renderExportPagesToVectorPdf(exportState, pageNodes, performanceState)", source)
		self.assertNotIn("html2canvas", source)
		self.assertNotIn("renderExportPagesToRasterPdf", source)
		self.assertNotIn("html2" + "pdf().from(", source)
		self.assertIn("destroyExportRoot", source)
		self.assertIn("getVisibleText(", source)
		self.assertIn("anchor.getClientRects()", source)
		self.assertIn("img.decode", source)
		self.assertIn("populatePageFooters", source)
		self.assertNotIn("window.scrollTo(", source)
		self.assertIn("schedulePdfLibraryWarmup()", source)
		self.assertNotIn("schedulePdfLibraryWarmup();", ensure_original_snapshot_source)
		self.assertIn("getCurrentSnapshotIfReady(warmupLanguage, warmupGeneration)", source)
		self.assertIn("captureSemanticSnapshot", source)
		self.assertIn("waitForGuideTranslationReadiness", source)
		self.assertIn("compareSnapshotToModel", source)
		self.assertIn("translationState.generation += 1", source)
		self.assertIn("translationState.requestedLanguage", source)
		self.assertIn("translationState.readySnapshot = null", source)
		self.assertIn("redactSnapshot", source)
		self.assertIn("syncTranslationLanguageState", source)
		self.assertIn("analyzeSnapshotState(currentSnapshot, translationState.originalSnapshot, expectedLanguage)", source)
		self.assertIn("markExportNodeNotranslate(exportRoot)", source)
		self.assertIn("mountExportRoot(exportState.exportRoot)", source)
		self.assertIn("data-guide-translation-kind", self.render_instruction(self.make_instruction()))
		self.assertIn("snapshotsEqual(settledSnapshot, finalSnapshot)", source)
		self.assertNotIn("download_pdf?", source)
		self.assertNotIn("Property Instruction Translation", source)

	def test_export_script_supports_language_specific_identical_translations(self):
		source = self.get_export_script_source()
		html = self.render_instruction(self.make_instruction())
		self.assertIn('data-guide-allow-identical-languages="fr"', html)
		self.assertIn("allowIdenticalLanguages", source)
		self.assertIn("allowsIdenticalForLanguage", source)
		self.assertIn('reason: "language-specific-identical"', source)
		self.assertIn("allowIdenticalLanguages.indexOf(expectedLanguage) !== -1", source)
		self.assertIn('nodeId: nodeId,', source)
		self.assertNotIn('data-guide-allow-identical="1">Parking', html)

	def test_export_script_keeps_unchanged_parking_valid_only_for_french(self):
		source = self.get_export_script_source()
		html = self.render_instruction(self.make_instruction())
		self.assertIn('data-guide-allow-identical-languages="fr"', html)
		self.assertIn('expectedLanguage', source)
		self.assertIn("language-specific-identical", source)
		self.assertIn("unexpectedUnchangedTranslatableNodeIds.push(nodeId)", source)
		self.assertIn("meta.allowIdentical", source)
		self.assertIn("allowIdenticalLanguages.indexOf(expectedLanguage) !== -1", source)
		self.assertNotIn('data-guide-allow-identical-languages="de"', html)
		self.assertNotIn('data-guide-allow-identical-languages="tr"', html)

	def test_export_script_ensures_qr_library_after_runtime_snapshot_fallback(self):
		source = self.get_export_script_source()
		prepare_assets_start = source.index("async function prepareGuideModelAssets(")
		prepare_assets_end = source.index("async function prewarmPdfLibraries()", prepare_assets_start)
		prepare_assets_source = source[prepare_assets_start:prepare_assets_end]
		self.assertIn("var needsQrLibrary =", prepare_assets_source)
		self.assertIn("await ensureQrCodeLibrary();", prepare_assets_source)
		self.assertIn("assignQrImagesToEntries", prepare_assets_source)
		self.assertLess(
			prepare_assets_source.index("await ensureQrCodeLibrary();"),
			prepare_assets_source.index("assignQrImagesToEntries"),
		)

	def test_export_script_does_not_use_legacy_cloned_print_layout(self):
		source = self.get_export_script_source()
		self.assertNotIn(".pi-print-layout", source)
		self.assertNotIn("render_print_block", self.render_instruction(self.make_instruction()))
		self.assertNotIn("html2" + "pdf__overlay", source)
		self.assertNotIn("data-pdf-token", source)

	def test_export_script_uses_full_snapshots_instead_of_truncated_signature(self):
		source = self.get_export_script_source()
		self.assertNotIn(".slice(0, 240)", source)
		self.assertIn("nodeCount", source)
		self.assertIn("orderedNodeIds", source)
		self.assertIn("duplicateNodeIds", source)
		self.assertIn("unexpectedUnchangedTranslatableNodeIds", source)
		self.assertIn("missingRequiredNodeIds", source)
		self.assertIn("GUIDE_SETTLE_QUIET_MS = 2500", source)
		self.assertIn("GUIDE_SETTLE_STABLE_INTERVAL_MS = 1500", source)

	def test_export_script_does_not_inject_post_translation_english_pdf_copy(self):
		source = self.get_export_script_source()
		self.assertNotIn("Property Location", source)
		self.assertNotIn("Map preview unavailable", source)
		self.assertNotIn("Image unavailable", source)
		self.assertNotIn("No published instruction content is available for this property yet.", source)
		self.assertNotIn('"Page " + (index + 1) + " of " + pageNodes.length', source)

	def test_export_script_uses_language_neutral_footer_numbering(self):
		source = self.get_export_script_source()
		self.assertIn('right.textContent = (index + 1) + " / " + pageNodes.length;', source)

	def test_export_script_contains_translation_diagnostics_and_abort_paths(self):
		source = self.get_export_script_source()
		self.assertIn("__propertyInstructionTranslationDiagnostics", source)
		self.assertIn("__propertyInstructionLastExportParityMap", source)
		self.assertIn("parityMismatches", source)
		self.assertIn("baselineCapturedAt", source)
		self.assertIn("widgetScriptRequestedAt", source)
		self.assertIn("firstTranslationMutationAt", source)
		self.assertIn("changedTranslatableNodeIds", source)
		self.assertIn("unexpectedUnchangedTranslatableNodeIds", source)
		self.assertIn("redactNodeMap", source)
		self.assertIn("intentionallyUnchangedNodes", source)
		self.assertIn("lastSemanticProgressAt", source)
		self.assertIn("getSnapshotProgressFingerprint", source)
		self.assertIn("export-dom-mutated-after-translation", source)
		self.assertIn("startExportMutationGuard", source)
		self.assertIn("validateExportDomParity", source)
		self.assertIn("data-export-source-id", source)
		self.assertIn('throw new Error("Guide translation changed before PDF rendering")', source)
		self.assertIn('throw new Error("Selected translation changed during PDF export")', source)
		self.assertIn('throw new Error("PDF export content does not match the visible guide")', source)
		self.assertIn('throw new Error("Guide translation changed before PDF download")', source)

	def test_export_script_resolves_images_through_same_origin_proxy_for_vector_embedding(self):
		source = self.get_export_script_source()
		self.assertIn("function resolveExportImageUrl(sourceUrl)", source)
		self.assertIn("PUBLIC_PDF_IMAGE_ENDPOINT", source)
		self.assertIn("function getExportImageDataUri(url, cache)", source)
		self.assertIn("function inlineExportImages(exportRoot, exportImageDataCache)", source)
		self.assertIn('exportRoot.querySelectorAll("img[data-export-image-fetch-src]")', source)
		self.assertIn("constent-Type", source.replace("contentType", "constent-Type"))
		self.assertIn("blobToDataUri", source)
		self.assertIn("inlineExportImages(exportState.exportRoot, exportImageDataCache)", source)
		self.assertNotIn("temporarilyInlineDocumentProxyImages(exportState.exportRoot, exportImageDataCache)", source)
		self.assertNotIn("data-export-inline-proxy-src", source)
		self.assertIn("assertExportImageSourcesAreCapturable", source)
		self.assertIn("function prepareVectorImageAssets(layoutModel)", source)
		self.assertIn("function drawVectorImageElement(pdf, element, preparedAssets)", source)
		self.assertNotIn("validateExportImagesCanPaintToCanvas", source)
		self.assertNotIn("validateCanvasPaintedImages", source)

	def test_export_script_records_pdf_performance_and_ignores_non_current_pages(self):
		source = self.get_export_script_source()
		self.assertIn("window.__propertyInstructionPdfPerformance", source)
		self.assertIn("window.__propertyInstructionPdfLifecycle", source)
		self.assertIn("translationReadyMs", source)
		self.assertIn("vectorLayoutExtractionMs", source)
		self.assertIn("fontReadinessMs", source)
		self.assertNotIn("function applyCaptureIgnoreAttributes(", source)
		self.assertNotIn("function clearCaptureIgnoreAttributes(", source)
		self.assertNotIn("pageCaptureMs", source)
		self.assertNotIn("isSafariFamily", source)

	def test_export_script_preserves_toolbar_icon_buttons_during_progress_updates(self):
		source = self.get_export_script_source()
		self.assertIn("function setToolbarButtonLabel(button, labelText)", source)
		self.assertIn('var labelNode = button.querySelector(".pi-toolbar-action-label");', source)
		self.assertIn("labelNode.textContent = String(labelText || \"\");", source)
		self.assertIn("setToolbarButtonLabel(downloadButton, currentLabel + \"…\");", source)
		self.assertIn("setToolbarButtonLabel(triggerElement, originalLabel);", source)

	def test_export_script_builds_translated_filenames_and_custom_toolbar_sync(self):
		source = self.get_export_script_source()
		self.assertIn("function sanitizePdfFilenamePart(value)", source)
		self.assertIn("function buildTranslatedPdfFilename(fallbackFilename)", source)
		self.assertIn("getVisibleText(document.querySelector(\"[data-guide-kicker]\"))", source)
		self.assertIn("syncCustomLanguageSelectorFromGoogle", source)
		self.assertIn("function syncShowOriginalButton(selectedLanguage)", source)
		self.assertIn("applyCustomLanguageSelection", source)
		self.assertIn("resetToSourceLanguage", source)
		self.assertIn("expireCookie(\"googtrans\")", source)
		html = self.render_instruction(self.make_instruction(title="Toolbar Guide"))
		self.assertIn("data-guide-show-original", html)
		self.assertIn("pi-google-translate-engine", html)
		self.assertIn("getPdfFilename(downloadButton)", source)
		self.assertIn("normalize(\"NFKC\")", source)
		self.assertIn('setTranslationStatus("Restoring original…")', source)
		self.assertIn("applyCustomLanguageSelection(SOURCE_LANGUAGE)", source)

	def test_export_script_includes_progress_contents_and_qr_support(self):
		source = self.get_export_script_source()
		html = self.render_instruction(
			self.make_instruction(
				title="QR Guide",
				show_wifi_password_publicly=1,
				show_wifi_qr_in_pdf=1,
				wifi_security_type="WEP",
				wifi_hidden_network=1,
			)
		)
		self.assertIn("QRCODE_LIBRARY_URL", source)
		self.assertIn("function ensureQrCodeLibrary()", source)
		self.assertIn("function buildWifiQrPayload(model)", source)
		self.assertIn("function createQrPngDataUri(payload)", source)
		self.assertIn("window.qrcodegen.QrCode.Ecc.MEDIUM", source)
		self.assertIn('canvas.toDataURL("image/png")', source)
		self.assertIn("function buildQuickAccessEntries(model)", source)
		self.assertIn("function attachBlockQrEntries(model, remainingEntries, qrImageCache)", source)
		self.assertIn("function summarizeDiagnosticImageSource(source, role, extra)", source)
		self.assertIn("function triggerAutomaticPdfDownload(blob, filename)", source)
		self.assertIn("data-pdf-internal-target", source)
		self.assertIn("populatePdfContentsDestinations(exportState)", source)
		self.assertIn("recordProgressHistory(", source)
		self.assertIn("getAverageProgressHistory(", source)
		self.assertIn("data-pdf-progress", html)
		self.assertIn("data-pdf-download-anchor", html)
		self.assertNotIn("Save PDF", html)
		self.assertIn("data-guide-contents-title", html)
		self.assertIn('data-guide-show-wifi-qr="1"', html)
		self.assertIn('data-guide-wifi-security-type="WEP"', html)
		self.assertIn('data-guide-wifi-hidden-network="1"', html)

	def test_export_script_uses_single_export_controller_and_card_qr_placement(self):
		source = self.get_export_script_source()
		html = self.render_instruction(self.make_instruction(title="Save Guide"))
		self.assertIn("pdfExportController.activePromise", source)
		self.assertIn("setGuidePdfActionButtonsDisabled(true)", source)
		self.assertIn("function getOrCreateGuidePdfArtifact(triggerElement)", source)
		self.assertIn("function performGuidePdfArtifactGeneration(triggerElement)", source)
		self.assertIn("setPdfExportControlsDisabled(true)", source)
		self.assertIn("function createReadyPdfObjectUrl(blob)", source)
		self.assertIn("function triggerAutomaticPdfDownload(blob, filename)", source)
		self.assertIn("window.addEventListener(\"pagehide\", clearReadyPdfObjectUrl);", source)
		self.assertIn("window.addEventListener(\"beforeunload\", clearReadyPdfObjectUrl);", source)
		self.assertIn("5 * 60 * 1000", source)
		self.assertIn("pdfPreparationState.artifactCache = {};", source)
		self.assertNotIn("isSafariFamily()) {", source)
		self.assertIn("blockModel.qrEntries", source)
		self.assertIn('blockId: linkEntry.blockId || ""', source)
		self.assertIn("pi-export-card-qr-panel", source)
		self.assertIn("data-pdf-section-item", source)
		self.assertNotIn("pageImageBlobs", source)
		self.assertIn("PDF pagination dropped export content", source)
		self.assertNotIn("pi-export-section--quick-links", source)
		self.assertIn("data-pdf-download-anchor", html)
		self.assertIn("data-guide-pdf-feedback", html)
		self.assertIn("data-guide-pdf-feedback-retry", html)
		self.assertNotIn("data-pdf-save-link", html)
		self.assertNotIn("Save PDF", html)

	def test_export_script_does_not_classify_render_failures_as_translation_timeouts(self):
		source = self.get_export_script_source()
		self.assertIn('getGuideCopyText("translation_unavailable", "Translation is temporarily unavailable.")', source)
		self.assertIn('getGuideCopyText("pdf_generation_failed", "The PDF could not be generated. Please try again.")', source)
		self.assertNotIn(
			'setTranslationAbortReason(error && error.message ? error.message : "Unable to prepare PDF", "translation-timeout-unknown");',
			source,
		)

	def test_export_script_validates_image_clipping_separately_from_ratio(self):
		source = self.get_export_script_source()
		self.assertIn("function fitImageSize(naturalWidth, naturalHeight, maxWidth, maxHeight)", source)
		self.assertIn("function getPdfImageMaxHeight(img)", source)
		self.assertIn("function validateExportImageClipping(exportRoot)", source)
		self.assertIn('throw new Error("export-image-clipped")', source)
		self.assertIn("clippedHorizontally", source)
		self.assertIn("clippedVertically", source)
		self.assertIn("frame.style.height = fitted.height + \"px\";", source)
		self.assertIn("frame.style.maxHeight = \"none\";", source)

	def test_export_script_hides_modern_google_translation_ui_and_resets_offsets(self):
		source = self.get_export_script_source()
		html = self.render_instruction(self.make_instruction())
		self.assertIn("function resetGoogleInjectedOffsets()", source)
		self.assertIn("GOOGLE_PRESENTATION_SELECTORS", source)
		self.assertIn("iframe.goog-te-banner-frame", source)
		self.assertIn("iframe.VIpgJd-ZVi9od-ORHb-OEVmcd", source)
		self.assertIn(".VIpgJd-ZVi9od-xl07Ob-OEVmcd", source)
		self.assertIn(".VIpgJd-ZVi9od-SmfZ-OEVmcd", source)
		self.assertIn('node.style.setProperty("display", "none", "important")', source)
		self.assertIn('node.style.setProperty("visibility", "hidden", "important")', source)
		self.assertIn('node.style.setProperty("top", "0px", "important")', source)
		self.assertIn('node.style.setProperty("margin-top", "0px", "important")', source)
		self.assertIn('node.style.setProperty("transform", "none", "important")', source)
		self.assertIn("scheduleGoogleUiHide()", source)
		self.assertIn("window.__propertyInstructionGoogleUiDiagnostics", source)
		self.assertIn('iframe.goog-te-banner-frame', html)

	def test_export_script_loads_dedicated_pdf_fonts_and_typography(self):
		source = self.get_export_script_source()
		html = self.render_instruction(self.make_instruction())
		self.assertIn('@font-face', html)
		self.assertIn('font-family: "PropMS PDF Inter"', html)
		self.assertIn('/assets/frappe/css/fonts/inter/Inter-Regular.woff2', html)
		self.assertIn('/assets/frappe/css/fonts/inter/Inter-Medium.woff2', html)
		self.assertIn('/assets/frappe/css/fonts/inter/Inter-SemiBold.woff2', html)
		self.assertIn('/assets/frappe/css/fonts/inter/Inter-Bold.woff2', html)
		self.assertIn("PDF_EXPORT_FONT_LOADS", source)
		self.assertIn("VECTOR_PDF_FONT_MANIFEST", source)
		self.assertIn("function ensureVectorPdfFontsRegistered(pdf)", source)
		self.assertIn('pdf.addFont(fontEntry.file, fontEntry.family, fontEntry.style, "Identity-H");', source)
		self.assertIn("VECTOR_PDF_FONT_FAMILY_ARABIC", source)
		self.assertNotIn("frameDocument.fonts", source)
		self.assertIn("word-spacing: 0.08em;", html)
		self.assertIn("word-spacing: 0.07em;", html)
		self.assertIn("word-spacing: normal;", html)

	def test_rendered_instruction_text_preserves_ordinary_spaces(self):
		doc = self.make_instruction(
			address="99A Burlington Road",
			instruction_blocks=[
				{
					"section": "Check-In",
					"block_type": "Step",
					"title": "Property's entrance on the side of this shop",
					"body": "<p>This is the entrance door of the property</p>",
				},
			],
		)
		html = self.render_instruction(doc)
		self.assertIn("Property's entrance on the side of this shop", html)
		self.assertIn("This is the entrance door of the property", html)
		self.assertIn("99A Burlington Road", html)

	def test_export_script_marks_export_dom_notranslate_before_mount(self):
		source = self.get_export_script_source()
		self.assertIn("function markExportNodeNotranslate(node)", source)
		self.assertIn('node.classList.add("notranslate")', source)
		self.assertIn('node.setAttribute("translate", "no")', source)
		self.assertIn("markExportNodeNotranslate(exportRoot);", source)
		self.assertIn("return exportRoot;", source)
		self.assertIn("document.body.appendChild(exportRoot);", source)
		self.assertLess(
			source.index("markExportNodeNotranslate(exportRoot);"),
			source.index("document.body.appendChild(exportRoot);"),
		)
		self.assertIn("markExportNodeNotranslate(exportWrapper);", source)
		self.assertIn("markExportNodeNotranslate(exportDocument);", source)
		self.assertIn("markExportNodeNotranslate(page);", source)
		self.assertIn("markExportNodeNotranslate(viewport);", source)
		self.assertIn("markExportNodeNotranslate(footer);", source)

	def test_export_script_checks_export_dom_parity_through_vector_rendering(self):
		source = self.get_export_script_source()
		self.assertIn('validateExportDomParity(exportState.exportRoot, preMountParity.modelParityMap, "detached-build")', source)
		self.assertIn('validateExportDomParity(exportState.exportRoot, preMountParity.modelParityMap, "post-mount")', source)
		self.assertIn('validateExportDomParity(exportState.exportRoot, preMountParity.modelParityMap, "post-pagination")', source)
		self.assertIn('validateExportDomParity(exportState.exportRoot, modelParityMap, "pre-render", mutationGuardState)', source)
		self.assertIn('validateExportDomParity(exportState.exportRoot, modelParityMap, "post-fonts-images", mutationGuardState)', source)
		self.assertIn('validateExportDomParity(exportState.exportRoot, modelParityMap, "post-render", mutationGuardState)', source)
		self.assertNotIn("before-canvas-page-", source)
		self.assertIn('setTranslationAbortReason("Export DOM mutated after translation", "export-dom-mutated-after-translation")', source)

	def test_export_script_syncs_sticky_toolbar_offset_and_active_nav(self):
		source = self.get_export_script_source()
		html = self.render_instruction(self.make_instruction())
		self.assertIn("function syncStickyToolbarOffset()", source)
		self.assertIn("function ensureStickyToolbarObservers()", source)
		self.assertIn("function ensureSectionNavObserver()", source)
		self.assertIn("function getActiveGuideSectionId(sectionNodes, activationY, atDocumentBottom)", source)
		self.assertIn("function syncActiveSectionNavigation()", source)
		self.assertIn("window.addEventListener(\"scroll\", scheduleActiveSectionNavigationSync, { passive: true });", source)
		self.assertIn('shell.style.setProperty("--pi-toolbar-bottom-offset"', source)
		self.assertIn("new ResizeObserver", source)
		self.assertIn('linkNode.setAttribute("aria-current", "location")', source)
		self.assertNotIn("rootMargin: \"-20% 0px -60% 0px\"", source)
		self.assertIn("--pi-toolbar-bottom-offset", html)
		self.assertIn("scroll-margin-top: calc(var(--pi-toolbar-bottom-offset) + 1rem);", html)

	def test_export_script_removes_legacy_iframe_print_route(self):
		source = self.get_export_script_source()
		html = self.render_instruction(self.make_instruction())
		legacy_print_name = "printGeneratedGuide" + "LegacyIframe"
		legacy_prepare_name = "prepareGenerated" + "PrintFrame"
		legacy_cleanup_name = "cleanup" + "PrintFrame"
		legacy_schedule_name = "schedule" + "IOSPrintCleanup"
		ios_device_name = "isIOS" + "Device"
		ios_safari_name = "isIOS" + "Safari"
		print_width_name = "PRINT_PAGE_" + "WIDTH_PT"
		print_height_name = "PRINT_PAGE_" + "HEIGHT_PT"
		self.assertIn("function printGeneratedGuide(printButton)", source)
		self.assertIn("10 * 60 * 1000", source)
		self.assertIn("artifact.artifactCacheHit", source)
		self.assertNotIn("window.print()", source)
		self.assertNotIn(legacy_print_name, source)
		self.assertNotIn(legacy_prepare_name, source)
		self.assertNotIn(legacy_cleanup_name, source)
		self.assertNotIn(legacy_schedule_name, source)
		self.assertNotIn("function createPrintFrame()", source)
		self.assertNotIn(ios_device_name, source)
		self.assertNotIn(ios_safari_name, source)
		self.assertNotIn(print_width_name, source)
		self.assertNotIn(print_height_name, source)
		self.assertNotIn("__propertyInstructionPrintDiagnostics", source)
		self.assertEqual(html.count("property-instruction-print"), 1)

	def test_export_script_routes_production_print_guide_through_pdf_tab_flow(self):
		source = self.get_export_script_source()
		debug_query_name = "propms_" + "ios_print_debug"
		trace_name = "__propms" + "IosArtifactTrace"
		legacy_print_name = "printGeneratedGuide" + "LegacyIframe"
		self.assertNotIn("propms_pdf_tab_print_test", source)
		self.assertNotIn(debug_query_name, source)
		self.assertNotIn("ios-physical-artifact-trace-1", source)
		self.assertNotIn(trace_name, source)
		self.assertNotIn("universal-pdf-ready-confirm-print-1", source)
		self.assertNotIn("data-pdf-tab-print-universal", source)
		self.assertNotIn("PDF tab print test", source)
		self.assertIn("function getCurrentCompletedPdfArtifact(triggerElement)", source)
		self.assertIn("function ensurePrintGuideReadyDialog()", source)
		self.assertIn("function printGeneratedGuide(printButton)", source)
		self.assertNotIn(legacy_print_name, source)
		self.assertIn('data-guide-print-ready-dialog', source)
		self.assertIn('data-guide-pdf-ready-print', source)
		self.assertIn('data-guide-print-ready-cancel', source)
		self.assertIn("PDF ready", source)
		self.assertIn("Choose Print PDF to open the printable PDF in a new tab.", source)
		self.assertIn('<svg class="pi-toolbar-action-icon"', source)
		self.assertIn('aria-labelledby", "pi-print-ready-kicker"', source)
		self.assertIn('margin:auto;inset:0;', source)
		self.assertIn('grid-template-columns:repeat(3,minmax(0,1fr));', source)
		self.assertIn('.pi-print-ready-actions .pi-btn-primary{background:var(--pi-accent,#115e59);color:#fff;border:1px solid transparent;}', source)
		self.assertIn('data-guide-print-ready-error aria-live="polite" hidden', source)
		self.assertIn('dialog.addEventListener("click", function (event) {', source)
		self.assertIn("if (event.target === dialog) {", source)
		self.assertNotIn("The printable PDF has been prepared. Select Print now to open the print options.", source)
		self.assertNotIn('data-guide-print-ready-meta', source)
		self.assertNotIn("Your guide is ready to print", source)
		self.assertIn("print-requested", source)
		self.assertIn("artifact-ready-at-click", source)
		self.assertIn("generation-started", source)
		self.assertIn("generation-completed", source)
		self.assertIn("ready-dialog-opened", source)
		self.assertIn("ready-dialog-cancelled", source)
		self.assertIn("print-now-selected", source)
		self.assertIn('const pdfReadyPrintButton', source)
		self.assertIn('var readyTab = window.open("", "_blank");', source)
		self.assertIn("if (!navigatePdfTabAndSchedulePrint(readyTab, readyPrintArtifact, 2)) {", source)
		self.assertIn("The browser blocked the printable PDF tab. Allow pop-ups for this site, then select Print PDF again.", source)
		self.assertIn("The printable PDF tab could not be opened. Select Print PDF to try again.", source)
		self.assertIn('openPrintGuideReadyDialog(artifact, printButton, "");', source)
		self.assertIn('printGuideController.pendingArtifact = artifact;', source)
		self.assertIn("resetPrintGuidePendingState();", source)
		self.assertIn("function getEventActionTarget(event, selector)", source)
		self.assertIn('const printButton = getEventActionTarget(event, ".property-instruction-print");', source)
		self.assertIn('recordPdfInteractionDiagnostic("raw-click-received"', source)
		self.assertIn('handlePdfInteractionControllerError(error, getSafeEventTargetInfo(event));', source)
		self.assertIn("await printGeneratedGuide(printButton);", source)
		self.assertNotIn("await " + legacy_print_name + "(printButton);", source)

	def test_rendered_instruction_uses_fingerprinted_export_script_and_no_literal_build_version(self):
		html = self.render_instruction(self.make_instruction())
		self.assertIn("/assets/propms/js/property_instruction_export.js?v=test-build-version", html)
		self.assertNotIn("{{ build_version }}", html)
		self.assertNotIn("?ver={{ build_version }}", html)
		self.assertIn('window._version_number = "test-build-version";', html)

	def test_export_script_exposes_visible_pdf_feedback_and_interaction_trace(self):
		source = self.get_export_script_source()
		html = self.render_instruction(self.make_instruction())
		self.assertIn("function initializePdfInteractionDiagnostics()", source)
		self.assertIn("function getSafeEventTargetInfo(event)", source)
		self.assertIn("function getEventActionTarget(event, selector)", source)
		self.assertIn("window.__propertyInstructionPdfInteractionDiagnostics", source)
		self.assertIn('recordPdfInteractionDiagnostic("download-click-received"', source)
		self.assertIn('recordPdfInteractionDiagnostic("print-click-received"', source)
		self.assertIn('recordPdfInteractionDiagnostic("raw-click-received"', source)
		self.assertIn('recordPdfInteractionDiagnostic("action-target-resolved"', source)
		self.assertIn('recordPdfInteractionDiagnostic("generation-requested"', source)
		self.assertIn('recordPdfInteractionDiagnostic("generation-failed"', source)
		self.assertIn('recordPdfInteractionDiagnostic("ready-dialog-opened"', source)
		self.assertIn('recordPdfInteractionDiagnostic("automatic-download-attempted"', source)
		self.assertIn('recordPdfInteractionDiagnostic("popup-opened"', source)
		self.assertIn('recordPdfInteractionDiagnostic("print-called"', source)
		self.assertIn("function handlePdfInteractionControllerError(error, contextDetails)", source)
		self.assertIn("function showPdfFeedback(kind, message, options)", source)
		self.assertIn('data-guide-pdf-feedback', html)
		self.assertIn('data-guide-pdf-feedback-message', html)
		self.assertIn('data-guide-pdf-feedback-code', html)
		self.assertIn('data-guide-pdf-feedback-retry', html)
		self.assertIn('showPdfFeedback("error"', source)
		self.assertIn('showPdfFeedback("success"', source)

	def test_export_script_removes_legacy_coordinate_map_renderer(self):
		source = self.get_export_script_source()
		self.assertNotIn("legacy-coordinate-map", source)
		self.assertNotIn("renderStaticMapSnapshot", source)
		self.assertNotIn("projectLongitudeToWorldX", source)
		self.assertNotIn("projectLatitudeToWorldY", source)
		self.assertNotIn("map-marker-outside-canvas", source)
		self.assertNotIn("tile.openstreetmap.org", source)

	def test_export_script_uses_language_sync_without_relying_only_on_change_event(self):
		source = self.get_export_script_source()
		self.assertIn("function syncTranslationLanguageState()", source)
		self.assertIn("currentLanguage !== translationState.requestedLanguage", source)
		self.assertIn("widgetObserver.observe(document.body", source)
		self.assertIn("syncTranslationLanguageState();", source)

	def test_export_script_redacts_protected_fields_in_diagnostics(self):
		source = self.get_export_script_source()
		self.assertIn("PROTECTED_GUIDE_FIELDS", source)
		self.assertIn('return "[redacted]";', source)
		self.assertIn("window.__propertyInstructionLastExportParityMap = redactNodeMap", source)

	def test_export_script_uses_language_neutral_progress_copy(self):
		source = self.get_export_script_source()
		html = self.render_instruction(self.make_instruction())
		self.assertIn("getGuideCopyText(", source)
		self.assertIn('data-guide-progress-copy="wait_translation"', html)
		self.assertIn('data-guide-progress-copy="prepare_assets"', html)
		self.assertIn('data-guide-progress-copy="render_page"', html)
		self.assertIn('setToolbarButtonLabel(downloadButton, currentLabel + "…");', source)
		self.assertIn('statusElement.textContent = statusMessage || "…";', source)

	def test_export_script_uses_the_adaptive_a4_pdf_layout(self):
		source = self.get_export_script_source()
		html = self.render_instruction(self.make_instruction())
		self.assertIn('PDF_ADAPTIVE_LAYOUT_VERSION', source)
		self.assertIn('PDF_EXPORT_WIDTH = 794', source)
		self.assertIn('PDF_EXPORT_PAGE_HEIGHT = 1122', source)
		self.assertIn('PDF_EXPORT_CONTENT_WIDTH', source)
		self.assertIn('PDF_ADAPTIVE_HALF_WIDTH', source)
		self.assertIn('PDF_ADAPTIVE_WIDE_WIDTH', source)
		self.assertIn('applyAdaptiveSectionRows(exportState);', source)
		self.assertIn('evaluateAdaptivePagePlans(exportState, adaptiveSectionPlans);', source)
		self.assertIn('bestRejectedTwoPageReason', source)
		self.assertIn('getAdaptivePageOverflowPixels(pageNode)', source)
		self.assertIn('window.__propertyInstructionPdfAdaptiveLayoutSummary', source)
		self.assertIn('data-guide-progress-copy="continued_suffix"', html)
		self.assertNotIn('propms_pdf_layout', source)
		self.assertNotIn('legacy pagination', source)

	def test_export_script_builds_adaptive_rows_and_orientation_aware_cards(self):
		source = self.get_export_script_source()
		html = self.render_instruction(self.make_instruction())
		self.assertIn('function getAdaptiveImageOrientation(naturalWidth, naturalHeight)', source)
		self.assertIn('function createAdaptiveCardCandidates(cardNode, measurementHost, measurementCache)', source)
		self.assertIn('function buildAdaptiveCardContentProfile(cardNode, orientation, metrics, textLength)', source)
		self.assertIn('function getAdaptiveProjectedHeaderStrategyOptions(firstCandidate, secondCandidate, firstPlan, secondPlan)', source)
		self.assertIn('function getAdaptiveContentMediaRelationship(layout)', source)
		self.assertIn('function planAdaptiveSectionRows(cardPlans)', source)
		self.assertIn('function selectBestAdaptivePairCandidate(firstPlan, secondPlan)', source)
		self.assertIn('function projectAdaptiveCardRowGeometry(cardPlan, candidate, rowHeight, options)', source)
		self.assertIn('function getAdaptiveProjectedPairPenalty(firstProjection, secondProjection, firstCandidate, secondCandidate, headerStrategy)', source)
		self.assertIn('function createAdaptiveRow(documentNode, cards, className, rowDetails)', source)
		self.assertIn('function collectAdaptivePageSummary(exportPages)', source)
		self.assertIn('function ensureAdaptiveContinuationTitle(titleNode)', source)
		self.assertIn('.pi-export-card-title', source)
		self.assertIn('.pi-export-card-body', source)
		self.assertIn('.pi-export-card-caption', source)
		self.assertIn('.pi-export-card-link', source)
		self.assertIn('occupiedHeight', source)
		self.assertIn('remainingHeight', source)
		self.assertIn('sparseWarningReason', source)
		self.assertIn('data-pdf-row-score', source)
		self.assertIn('data-pdf-row-variants', source)
		self.assertIn('bestTwoPageScore', source)
		self.assertIn('renderAdaptivePlan(candidatePlan.pages || [])', source)
		self.assertIn('pi-export-row--two-up', source)
		self.assertIn('pi-export-row--full', source)
		self.assertIn('pi-export-row--parking', source)
		self.assertIn('pi-export-card--adaptive-layout-half-portrait-side .pi-export-card-layout', html)
		self.assertIn('pi-export-card--adaptive-layout-half-portrait-side-narrow .pi-export-card-layout', html)
		self.assertIn('pi-export-card--adaptive-layout-half-portrait-side-wide .pi-export-card-layout', html)
		self.assertIn('pi-export-card--adaptive-layout-half-portrait-stacked .pi-export-card-image-frame', html)
		self.assertIn('pi-export-card--adaptive-layout-half-portrait-stacked-compact .pi-export-card-image-frame', html)
		self.assertIn('pi-export-card--adaptive-layout-wide-horizontal .pi-export-card-layout', html)
		self.assertIn('pi-export-card--adaptive-layout-half-compact .pi-export-card-image-frame', html)
		self.assertIn('pi-export-card--adaptive-layout-half-landscape-stacked .pi-export-card-image-frame', html)
		self.assertIn('pi-export-card--adaptive-layout-wide-stacked .pi-export-card-image-frame', html)
		self.assertIn('pi-export-card--adaptive-parking-text .pi-export-qr-grid', html)
		self.assertIn('pi-export-card--adaptive-layout-parking-map-right-compact .pi-export-card-qr-panel .pi-export-qr-link', html)
		self.assertIn('setAttribute("data-card-region", "header")', source)
		self.assertIn('setAttribute("data-card-region", "body")', source)
		self.assertIn('setAttribute("data-card-region", "media")', source)
		self.assertIn('setAttribute("data-card-region", "footer")', source)
		self.assertIn('pi-export-card-body-region', source)
		self.assertIn('pi-export-card-footer-region', source)
		self.assertIn('pi-export-card-flex-spacer', source)
		self.assertIn('headerAndMediaOnly', source)
		self.assertIn('mostlyMediaContent', source)
		self.assertIn('adjacentPairEvaluations', source)
		self.assertNotIn('.pi-export-card--adaptive-layout-parking-map-right-compact .pi-export-card-layout {\n    min-height: 100%;', html)
		self.assertIn('object-fit: cover;', html)
		self.assertIn('sectionTitle.textContent = [', source)
		self.assertIn('getGuideCopyText("continued_suffix", "continued")', source)

	def test_export_script_supports_adaptive_typography_scaling_and_equalised_rows(self):
		source = self.get_export_script_source()
		html = self.render_instruction(self.make_instruction())
		self.assertIn('ADAPTIVE_TYPOGRAPHY_SCALES = [1, 0.96, 0.92, 0.88]', source)
		self.assertIn('PDF_ADAPTIVE_MIN_TITLE_FONT_SIZE', source)
		self.assertIn('PDF_ADAPTIVE_MIN_BODY_FONT_SIZE', source)
		self.assertIn('function getAdaptiveTypographyMetrics(scale)', source)
		self.assertIn('function applyAdaptiveTypographyScale(cardNode, scale)', source)
		self.assertIn('function getAdaptivePortraitSideLayouts()', source)
		self.assertIn('function buildAdaptiveHalfCandidateEligibility(candidate, cardPlan)', source)
		self.assertIn('function getAdaptiveCandidateMinimumMediaHeight(candidate, contentProfile)', source)
		self.assertIn('function getAdaptiveCandidateSoftPenalty(candidate)', source)
		self.assertIn('function getAdaptiveCandidateHardFailureReason(candidate)', source)
		self.assertIn('mixedTypographyPenalty', source)
		self.assertIn('rowHeightMismatchPenalty', source)
		self.assertIn('internalFreeSpaceDifferencePenalty', source)
		self.assertIn('mediaAlignmentPenalty', source)
		self.assertIn('footerAlignmentPenalty', source)
		self.assertIn('titleAlignmentPenalty', source)
		self.assertIn('buildAdaptiveTypographySelectionDiagnostics(cardPlan, selectedVariant, rowHeight)', source)
		self.assertIn('getAdaptiveFreeSpaceDistribution(variant, rowHeight)', source)
		self.assertIn('applyAdaptiveRowDistribution(cardNode, variant, rowDetails)', source)
		self.assertIn('projectedTitleToMediaGap', source)
		self.assertIn('trailingResidualSpace', source)
		self.assertIn('appliedHeaderHeight', source)
		self.assertIn('headerStrategy', source)
		self.assertIn('headerGrowth', source)
		self.assertIn('titleToMediaGapDelta', source)
		self.assertIn('meaningfulContentBounds', source)
		self.assertIn('projection-render-mismatch', source)
		self.assertIn('rowQualityScore', source)
		self.assertIn('data-pdf-card-row-projection', source)
		self.assertIn('data-pdf-card-trailing-space', source)
		self.assertIn('data-pdf-card-applied-header-height', source)
		self.assertIn('data-pdf-row-header-strategy', source)
		self.assertIn('naturalContentHeight', source)
		self.assertIn('renderedCardHeight', source)
		self.assertIn('internalFreeSpace', source)
		self.assertIn('contentOccupancy', source)
		self.assertIn('structuralOccupancy', source)
		self.assertIn('data-pdf-card-region-distribution', source)
		self.assertIn('data-pdf-card-typography-selection', source)
		self.assertIn('data-pdf-row-header-height', source)
		self.assertIn('data-pdf-row-typography-scale', source)
		self.assertIn('data-pdf-card-natural-height', source)
		self.assertIn('data-pdf-card-internal-free-space', source)
		self.assertIn('grid-template-columns: 38px minmax(0, 1fr);', html)
		self.assertIn('font-variant-numeric: tabular-nums;', html)
		self.assertIn('place-items: center;', html)
		self.assertIn('transform: translateY(0.5px);', html)
		self.assertIn('.pi-export-step-badge > span', html)
		self.assertIn('.pi-export-document[dir="rtl"] .pi-export-card-head', html)
		self.assertIn('align-items: stretch;', html)
		self.assertIn('--pi-export-adaptive-title-size', html)
		self.assertIn('--pi-export-adaptive-body-size', html)
		self.assertIn('--pi-export-card-header-height: auto;', html)
		self.assertIn('--pi-export-card-flex-spacer: 0px;', html)
		self.assertIn('--pi-export-card-trailing-space: 0px;', html)
		self.assertIn('min-height: var(--pi-export-card-media-region-extra, 0px);', html)
		self.assertIn('padding-bottom: var(--pi-export-card-trailing-space, 0px);', html)
		self.assertIn('function getAdaptiveParkingLayoutVariant(cardNode, direction)', source)
		self.assertIn('function buildAdaptiveRowSeverityDiagnostics(rowDiagnostic)', source)
		self.assertIn('function getAdaptiveCardLargestBlankRegion(cardDiagnostic)', source)
		self.assertIn('function getAdaptiveRowAlignmentMode(rowVariant, cardDiagnostics)', source)
		self.assertIn('function classifyAdaptiveRowSeverity(rowDiagnostic)', source)
		self.assertIn('severity: "expected-asymmetry"', source)
		self.assertIn('severity: "visual-warning"', source)
		self.assertIn('severity: "blocker"', source)
		self.assertIn('largestBlankRegionByCard', source)
		self.assertIn('visualAssessment', source)
		self.assertIn('alignmentMode', source)
		self.assertIn('candidateDiagnostics', source)
		self.assertIn('softFailures', source)
		self.assertIn('hardFailures', source)
		self.assertIn('unavailableDiagnostics', source)
		self.assertIn('no-valid-half-candidates', source)
		self.assertIn('header-height-warning', source)
		self.assertIn('media-below-useful-minimum', source)
		self.assertIn('half-portrait-side-narrow', source)
		self.assertIn('half-portrait-side-wide', source)
		self.assertIn('half-portrait-stacked', source)
		self.assertIn('half-portrait-stacked-compact', source)
		self.assertIn('data-pdf-parking-variant', source)
		self.assertIn('parking-map-right-list-columns', source)
		self.assertIn('.pi-export-card--adaptive-parking-list-columns .pi-export-card-body ul', html)
		self.assertIn('.pi-export-card--adaptive-parking-text .pi-export-card-footer-region', html)
		self.assertIn('.pi-export-card--adaptive-parking-text .pi-export-card-qr-panel .pi-export-qr-link', html)
		self.assertIn('PDF_ADAPTIVE_CARD_CONTAINMENT_TOLERANCE_PX = 1', source)
		self.assertIn('function collectAdaptiveCardContainment(cardNode)', source)
		self.assertIn('function validateAdaptiveCardContainment(exportRoot)', source)
		self.assertIn('throw new Error("adaptive-card-containment-overflow")', source)
		self.assertIn('card-containment-overflow', source)
		self.assertIn('overflowTop', source)
		self.assertIn('overflowRight', source)
		self.assertIn('overflowBottom', source)
		self.assertIn('overflowLeft', source)
		self.assertIn('innerBounds', source)
		self.assertIn('descendantBounds', source)
		self.assertIn('cardContainmentDiagnostics', source)
		self.assertIn('box-sizing: border-box;', html)
		self.assertIn('overflow-wrap: anywhere;', html)
		self.assertIn('word-break: break-word;', html)
		self.assertIn('object-fit: contain;', html)
		self.assertIn('PDF_ADAPTIVE_MEDIA_RATIO_WARNING = 0.005', source)
		self.assertIn('PDF_ADAPTIVE_MEDIA_RATIO_BLOCKER = 0.01', source)
		self.assertIn('function fitMediaWithinBounds(naturalWidth, naturalHeight, maxWidth, maxHeight, allowUpscale)', source)
		self.assertIn('function getExportMediaType(img)', source)
		self.assertIn('function getAdaptiveMediaFitPolicy(img, cardNode)', source)
		self.assertIn('function applyAdaptiveMediaDimensions(frameNode, img, options)', source)
		self.assertIn('function resolveAdaptiveMediaFramePolicy(cardNode, img, options)', source)
		self.assertIn('function applyAdaptiveMediaFramePolicy(frameNode, mediaNode, cardNode, img, options)', source)
		self.assertIn('function collectAdaptiveMediaVisualPlacement(cardNode)', source)
		self.assertIn('function validateAdaptiveMediaVisualPlacement(exportRoot)', source)
		self.assertIn('function classifyAdaptiveMediaVisualPlacement(details)', source)
		self.assertIn('contentMediaRelationship', source)
		self.assertIn('projectedContentMediaGapAxis', source)
		self.assertIn('measuredContentMediaGapAxis', source)
		self.assertIn('mediaRegionInnerBounds', source)
		self.assertIn('frameToMediaRegionCentreDeltaY', source)
		self.assertIn('mediaVisualPlacementBlockers', source)
		self.assertIn('data-export-media-fit-policy', source)
		self.assertIn('data-pdf-media-frame-policy', source)
		self.assertIn('data-pdf-media-vertical-alignment', source)
		self.assertIn('mediaVisualPlacementDiagnostics', source)
		self.assertIn('media-placement-blocker', source)
		self.assertIn('excessive-contain-letterbox', source)
		self.assertIn('frame-source-aspect-mismatch', source)
		self.assertIn('media-top-heavy', source)
		self.assertIn('media-bottom-heavy', source)
		self.assertIn('PDF_ADAPTIVE_MEDIA_LETTERBOX_WARNING_RATIO = 0.35', source)
		self.assertIn('PDF_ADAPTIVE_MEDIA_LETTERBOX_BLOCKER_RATIO = 0.5', source)
		self.assertIn('PDF_ADAPTIVE_MEDIA_FRAME_RATIO_WARNING = 1.8', source)
		self.assertIn('PDF_ADAPTIVE_MEDIA_FRAME_RATIO_BLOCKER = 2.3', source)
		self.assertIn('PDF_ADAPTIVE_HEADER_GROWTH_WARNING_RATIO = 0.22', source)
		self.assertIn('PDF_ADAPTIVE_HEADER_GROWTH_BLOCKER_RATIO = 0.34', source)
		self.assertIn('PDF_ADAPTIVE_RENDER_PROJECTION_DELTA_WARNING_PX = 12', source)
		self.assertIn('PDF_ADAPTIVE_RENDER_PROJECTION_DELTA_BLOCKER_PX = 24', source)
		self.assertIn('relationship === "stacked"', source)
		self.assertIn('relationship === "side"', source)
		self.assertIn('isCenteredMode()', source)
		self.assertIn('isHeaderAnchoredMode()', source)
		self.assertIn('adaptive-media-visual-placement-invalid:', source)
		self.assertIn('fitPolicy: getAdaptiveMediaFitPolicy(imageNode, cardNode)', source)
		self.assertIn('policy.framePolicy = "shrink-wrap-natural";', source)
		self.assertIn('visualReason = "contain-letterbox-reduction"', source)
		self.assertIn('ratioErrorPercent', source)
		self.assertIn('distorted: ratioDifference > PDF_ADAPTIVE_MEDIA_RATIO_BLOCKER', source)
		self.assertNotIn('img.style.height = "100%";', source)
		self.assertNotIn('object-fit: fill;', html)
		self.assertNotIn('scaleX(', source)
		self.assertNotIn('scaleY(', source)
		self.assertIn('.pi-export-card--adaptive {', html)
		self.assertIn('overflow: hidden;', html)
		self.assertIn('min-width: 0;', html)
		self.assertIn('min-height: 0;', html)
		self.assertIn('justify-content: var(--pi-export-card-media-justify, flex-start);', html)
		self.assertIn('.pi-export-card-image-frame[data-pdf-media-frame-policy="shrink-wrap-natural"]', html)
		self.assertNotIn('flexibleSpacer += remaining;', source)

	def test_export_script_supports_test_only_pdf_artifact_capture_mode(self):
		source = self.get_export_script_source()
		self.assertIn('function isPdfArtifactModeEnabled()', source)
		self.assertIn('propms_pdf_artifact_mode', source)
		self.assertIn('window.propmsPdfArtifactResult', source)
		self.assertIn('window.PropmsPdfExport = {', source)
		self.assertIn('generateArtifact: async function () {', source)
		self.assertIn('status: "running"', source)
		self.assertIn('status: "complete"', source)
		self.assertIn('status: "failed"', source)
		self.assertIn('propms-pdf-artifact-ready', source)
		self.assertIn('createPdfArtifactModeBlobUrl(artifact.pdfBlob)', source)
		self.assertIn('clearPdfArtifactModeResult("api-regenerate")', source)
		self.assertIn('clearPdfArtifactModeResult("pagehide")', source)
		self.assertIn('clearPdfArtifactModeResult("beforeunload")', source)
		self.assertIn('if (isPdfArtifactModeEnabled()) {', source)
		self.assertIn('publishPdfArtifactModeResult(artifact);', source)
		self.assertIn('if (!isPdfArtifactModeEnabled()) {', source)
		self.assertIn('triggerAutomaticPdfDownload(artifact.pdfBlob, getPdfFilename(downloadButton))', source)
		self.assertIn('showAutomaticDownloadFallback(artifact, {', source)

	def test_export_script_uses_the_vector_pdf_renderer(self):
		source = self.get_export_script_source()
		self.assertIn('var PDF_RENDERER_ID = "adaptive-vector";', source)
		self.assertIn('VECTOR_PDF_FONT_MANIFEST', source)
		self.assertIn('VECTOR_PDF_FONT_FAMILY_LATIN', source)
		self.assertIn('VECTOR_PDF_FONT_FAMILY_ARABIC', source)
		self.assertIn('function ensureVectorPdfFontsRegistered(pdf)', source)
		self.assertIn('function buildAdaptiveVectorLayoutModel(exportState, pdfWidth, pdfHeight)', source)
		self.assertIn('function drawVectorTextElement(pdf, element, diagnostics)', source)
		self.assertIn('function drawVectorRectElement(pdf, element)', source)
		self.assertIn('function drawVectorImageElement(pdf, element, preparedAssets)', source)
		self.assertIn('function drawVectorQrElement(pdf, element)', source)
		self.assertIn('function prepareVectorImageAssets(layoutModel)', source)
		self.assertIn('function renderExportPagesToVectorPdf(exportState, pageNodes, performanceState)', source)
		self.assertIn('unit: "pt"', source)
		self.assertIn('window.__propertyInstructionPdfRenderer = PDF_RENDERER_ID;', source)
		self.assertIn('layoutModel: renderResult.layoutModel || null', source)
		self.assertIn('embeddedFonts: renderResult.embeddedFonts || []', source)
		self.assertIn('renderer: String(artifact.renderer || PDF_RENDERER_ID)', source)
		self.assertIn('vectorTextDiagnostics', source)
		self.assertIn('preparedImageAssets', source)
		self.assertIn('isPdfArtifactModeEnabled()', source)
		self.assertNotIn('captureDiagnosticPageImages', source)
		self.assertIn('setPdfSemantic(badge, "badge", "step-badge"', source)
		self.assertIn('setPdfSemantic(badgeText, "text", "step-badge-text"', source)
		self.assertIn('function buildVectorLineCharacters(node, pageRect, scaleMetrics)', source)
		self.assertIn('function mergeVectorLineRuns(lineCharacters, paragraphDirection)', source)
		self.assertIn('logicalText', source)
		self.assertIn('direction: "neutral"', source)
		self.assertNotIn('var matcher = /\\S+\\s*/g;', source)

	def test_export_script_removes_renderer_and_layout_switches(self):
		source = self.get_export_script_source()
		self.assertIn('var PDF_RENDERER_ID = "adaptive-vector";', source)
		self.assertNotIn('propms_pdf_layout', source)
		self.assertNotIn('propms_pdf_renderer', source)
		self.assertNotIn('resolvePdfExportMode', source)
		self.assertNotIn('isLegacyPdfLayoutEnabled', source)
		self.assertNotIn('isAdaptiveVectorPdfRendererEnabled', source)
		self.assertNotIn('renderExportPagesToRasterPdf', source)

	def test_font_inventory_documents_vector_pdf_font_provenance(self):
		font_readme_path = os.path.abspath(
			os.path.join(
				os.path.dirname(__file__),
				"..",
				"..",
				"..",
				"public",
				"js",
				"vendor",
				"fonts",
				"README.md",
			)
		)
		with open(font_readme_path) as font_readme_file:
			font_readme = font_readme_file.read()
		self.assertIn("Vector PDF Font Inventory", font_readme)
		self.assertIn("Inter-Regular.ttf", font_readme)
		self.assertIn("NotoSansArabic-Regular.ttf", font_readme)
		self.assertIn("SIL Open Font License 1.1", font_readme)

	def test_repo_contains_browser_matrix_tooling_for_pdf_validation(self):
		tool_path = os.path.abspath(
			os.path.join(
				os.path.dirname(__file__),
				"..",
				"..",
				"..",
				"tools",
				"pdf_validation",
				"browser_matrix.js",
			)
		)
		with open(tool_path) as tool_file:
			tool_source = tool_file.read()
		self.assertIn("playwright", tool_source)
		self.assertIn('renderer: "adaptive-vector"', tool_source)
		self.assertIn('browsers: ["chromium", "firefox", "webkit"]', tool_source)
		self.assertIn('token === "--viewport-width"', tool_source)
		self.assertIn('token === "--viewport-height"', tool_source)
		self.assertNotIn("propms_pdf_layout", tool_source)
		self.assertNotIn("propms_pdf_renderer", tool_source)
		self.assertNotIn("--renderers", tool_source)
		self.assertIn("acceptDownloads: true", tool_source)
		self.assertIn('waitForEvent("download"', tool_source)
		self.assertIn('page.on("popup"', tool_source)
		self.assertIn("pollPrintSignal(page, popupObserver", tool_source)
		self.assertIn("pollPopupAfterReadyPrint(page, popupObserver", tool_source)

	def test_pdf_export_has_one_adaptive_vector_mode(self):
		source = self.get_export_script_source()
		self.assertIn('var PDF_RENDERER_ID = "adaptive-vector";', source)
		self.assertIn('var renderResult = await renderExportPagesToVectorPdf(exportState, pageNodes, performanceState);', source)
		self.assertNotIn('renderExportPagesToRasterPdf', source)
		self.assertNotIn('propms_pdf_layout', source)
		self.assertNotIn('propms_pdf_renderer', source)

	def test_vector_renderer_uses_inter_for_latin_and_preserves_weight_faces(self):
		source = self.get_export_script_source()
		self.assertIn('var VECTOR_PDF_FONT_FAMILY_LATIN = "propms-vector-inter";', source)
		self.assertIn('/assets/propms/js/vendor/fonts/Inter-Regular.ttf', source)
		self.assertIn('/assets/propms/js/vendor/fonts/Inter-Medium.ttf', source)
		self.assertIn('/assets/propms/js/vendor/fonts/Inter-SemiBold.ttf', source)
		self.assertIn('/assets/propms/js/vendor/fonts/Inter-Bold.ttf', source)
		self.assertIn('return "medium";', source)
		self.assertIn('if (fontEntry.family === VECTOR_PDF_FONT_FAMILY_ARABIC) {', source)
		self.assertIn('pdf.addFont(fontEntry.file, fontEntry.family, fontEntry.style, "Identity-H");', source)
		self.assertIn('pdf.addFont(fontEntry.file, fontEntry.family, fontEntry.style);', source)
		self.assertIn('VECTOR_PDF_FONT_FAMILY_ARABIC', source)

	def test_export_script_allows_optional_instruction_image_placeholders_without_remote_fallback(self):
		source = self.get_export_script_source()
		self.assertIn('function resolveMediaFailurePolicy(options)', source)
		self.assertIn('mediaRole: "instruction-image"', source)
		self.assertIn("placeholderAllowed: !required", source)
		self.assertIn("optionalMediaWarnings", source)
		self.assertIn("buildRequiredMediaUnavailableError", source)
		self.assertIn("placeholderOnly: !!blockModel.mediaUnavailable", source)
		self.assertIn("buildInlinePlaceholderImageDataUri", source)

	def test_vector_renderer_preserves_media_frame_and_qr_panel_geometry(self):
		source = self.get_export_script_source()
		self.assertIn('function getVectorFrameStyleDescriptor(node, scaleMetrics)', source)
		self.assertIn('frameBounds: convertRectToPdfBounds(frameRect, pageRect, scaleMetrics)', source)
		self.assertIn('imageBounds: convertRectToPdfBounds(rect, pageRect, scaleMetrics)', source)
		self.assertIn('function withPdfClip(pdf, bounds, radiusPt, drawFn)', source)
		self.assertIn('drawVectorRectElement(pdf, frameElement);', source)
		self.assertIn('panelBounds: convertRectToPdfBounds(frameNode.getBoundingClientRect(), pageRect, scaleMetrics)', source)
		self.assertIn('qrBounds: convertRectToPdfBounds((frameNode.querySelector("img") || frameNode).getBoundingClientRect(), pageRect, scaleMetrics)', source)
		self.assertIn('drawVectorRectElement(pdf, panelElement);', source)

	def test_parking_actions_stack_variant_is_generic_and_measured(self):
		source = self.get_export_script_source()
		html = self.render_instruction(self.make_instruction())
		self.assertIn('parking-map-right-actions-stack', source)
		self.assertIn('moveAdaptiveParkingActionsToMap(exportDocument.ownerDocument, parkingTextPlan.cardNode, parkingMapNode);', source)
		self.assertIn('[data-property-instruction-export] .pi-export-parking-map-actions {', html)
		self.assertIn('[data-property-instruction-export] .pi-export-row--parking[data-pdf-row-variant="parking-map-right-actions-stack"]', html)

	def test_export_script_records_generation_stage_diagnostics(self):
		source = self.get_export_script_source()
		self.assertIn('window.__propertyInstructionPdfGenerationDiagnostics', source)
		self.assertIn('function resetPdfGenerationDiagnostics(renderer)', source)
		self.assertIn('function recordPdfGenerationStage(stageName, extraDetails)', source)
		self.assertIn('generation-entered', source)
		self.assertIn('vector-renderer-entered', source)
		self.assertIn('vector-font-registration-started', source)
		self.assertIn('vector-font-registration-completed', source)
		self.assertIn('pdf-assembly-completed', source)
		self.assertIn('generation-ready', source)

	def test_export_script_tracks_deterministic_parking_action_relocation(self):
		source = self.get_export_script_source()
		self.assertIn('function isParkingMutationDiagnosticBypassEnabled()', source)
		self.assertIn('propms_pdf_debug_disable_parking_action_relocation', source)
		self.assertIn('clone.setAttribute("data-pdf-measurement-clone", "1");', source)
		self.assertIn('data-pdf-parking-actions-relocated', source)
		self.assertIn('function recordParkingMutationDiagnostic(details)', source)
		self.assertIn('parkingActionRelocations', source)
		self.assertIn('parkingActionRelocationByCard', source)
		self.assertIn('measurementClone: cardNode.getAttribute("data-pdf-measurement-clone") === "1"', source)
		self.assertIn('reason: "already-relocated"', source)

	def test_export_script_persists_card_containment_blockers(self):
		source = self.get_export_script_source()
		self.assertIn('cardContainmentBlockers', source)
		self.assertIn('window.__propertyInstructionLastPdfDiagnostics = Object.assign({}, window.__propertyInstructionLastPdfDiagnostics || {}, {', source)
		self.assertIn('throw new Error("adaptive-card-containment-overflow");', source)

	def test_export_script_reserves_media_sibling_height_during_final_sizing(self):
		source = self.get_export_script_source()
		self.assertIn('function getAdaptiveMediaSiblingReservedHeight(mediaNode, frameNode)', source)
		self.assertIn('function getAdaptiveAvailableFrameHeight(mediaNode, frameNode, fallbackHeight)', source)
		self.assertIn('var cloneAvailableFrameHeight = getAdaptiveAvailableFrameHeight(', source)
		self.assertIn('var availableFrameHeight = getAdaptiveAvailableFrameHeight(mediaNode, frameNode, allowedMediaHeight);', source)
		self.assertIn('frameNode.style.maxHeight = availableFrameHeight + "px";', source)
		self.assertIn('availableHeight: cloneAvailableFrameHeight', source)

	def test_export_script_uses_vector_clip_geometry_for_framed_raster_media(self):
		source = self.get_export_script_source()
		self.assertIn('function resolveVectorMediaClipGeometry(details)', source)
		self.assertIn('function collectVectorContainmentAncestors(frameNode, imageNode, pageNode, pageRect, scaleMetrics)', source)
		self.assertIn('function isVectorContainmentAncestor(node, imageNode)', source)
		self.assertIn('frameInnerBounds', source)
		self.assertIn('cardInnerBounds', source)
		self.assertIn('containmentClipBounds', source)
		self.assertIn('overview-map-panel', source)
		self.assertIn('collectVectorContainmentAncestors(node, img, pageNode, pageRect, scaleMetrics)', source)
		self.assertIn('clipBounds', source)
		self.assertIn('overflowBeforeClip', source)
		self.assertIn('expectedVisibleBounds', source)
		self.assertIn('clipOutsideContainment', source)
		self.assertIn('visibleOverflowAfterClip', source)
		self.assertIn('vectorMediaClipDiagnostics', source)
		self.assertIn('withPdfClip(pdf, clipGeometry.clipBounds', source)
		self.assertIn('throw new Error("vector-media-clip-invalid");', source)

	def test_export_script_supports_automatic_download_with_visible_fallback(self):
		source = self.get_export_script_source()
		self.assertIn('data-guide-pdf-feedback-download', source)
		self.assertIn('data-guide-pdf-feedback-open', source)
		self.assertIn('function showAutomaticDownloadFallback(artifact, options)', source)
		self.assertIn('automatic-download-attempted', source)
		self.assertIn('automatic-download-fallback-shown', source)
		self.assertIn('openReadyPdfInNewTab', source)
		self.assertIn('triggerAutomaticPdfDownload(artifact.pdfBlob, getPdfFilename(downloadButton))', source)

	def test_noindex_present_when_google_translate_disabled(self):
		self.set_property_management_setting("enable_guest_guide_google_translate", 0)
		doc = self.make_instruction()
		html = self.render_instruction(doc)
		self.assertIn(f'<meta name="robots" content="{NOINDEX_ROBOTS_CONTENT}">', html)
		self.assertEqual(frappe.local.response_headers.get("X-Robots-Tag"), NOINDEX_ROBOTS_CONTENT)

	def test_noindex_present_when_google_translate_enabled(self):
		self.set_property_management_setting("enable_guest_guide_google_translate", 1)
		doc = self.make_instruction()
		html = self.render_instruction(doc)
		self.assertIn(f'<meta name="robots" content="{NOINDEX_ROBOTS_CONTENT}">', html)
		self.assertEqual(frappe.local.response_headers.get("X-Robots-Tag"), NOINDEX_ROBOTS_CONTENT)

	def test_sitemap_filter_excludes_property_instruction_only(self):
		self.make_instruction()
		filtered_routes = get_filtered_public_pages_from_doctypes()
		self.assertNotIn("instructions/test-guest-guide-property", filtered_routes)

	def test_after_request_hook_adds_noindex_header_for_guest_guide_route(self):
		response = frappe._dict(headers={})
		request = frappe._dict(path="/instructions/test-guide")
		apply_guest_guide_noindex_headers(response=response, request=request)
		self.assertEqual(response.headers["X-Robots-Tag"], NOINDEX_ROBOTS_CONTENT)

	def test_after_request_hook_does_not_touch_unrelated_route(self):
		response = frappe._dict(headers={})
		request = frappe._dict(path="/about")
		apply_guest_guide_noindex_headers(response=response, request=request)
		self.assertEqual(response.headers, {})

	def test_validate_public_pdf_image_url_allows_current_site_file(self):
		parsed = validate_public_pdf_image_url("https://development.localhost/files/test-guide.png")
		self.assertEqual(parsed.hostname, "development.localhost")
		self.assertEqual(parsed.path, "/files/test-guide.png")

	def test_resolve_public_pdf_image_target_allows_local_frappe_file(self):
		self.make_site_file("test-guide-image.png")
		image_response = resolve_public_pdf_image_target("https://development.localhost/files/test-guide-image.png")
		self.assertEqual(image_response["content_type"], "image/png")
		self.assertEqual(image_response["filename"], "test-guide-image.png")
		self.assertEqual(image_response["content"], PNG_BYTES)

	def test_resolve_local_public_image_decodes_encoded_public_filenames(self):
		cases = [
			("/files/example%20image.jpeg", "example image.jpeg"),
			("/files/example%20(1).jpeg", "example (1).jpeg"),
			("/files/door%23one.png", "door#one.png"),
			("/files/caf%C3%A9.jpeg", "café.jpeg"),
			("/files/subfolder/image%20one.webp", "subfolder/image one.webp"),
			("/files/image+one.jpeg", "image+one.jpeg"),
		]
		expected_content_types = {
			".jpeg": "image/jpeg",
			".png": "image/png",
			".webp": "image/webp",
		}
		for encoded_path, filename in cases:
			with self.subTest(path=encoded_path):
				self.make_site_file(filename)
				image_response = resolve_local_public_image(encoded_path)
				self.assertEqual(image_response["filename"], os.path.basename(filename))
				self.assertEqual(image_response["content"], PNG_BYTES)
				self.assertEqual(
					image_response["content_type"],
					expected_content_types[os.path.splitext(filename)[1].lower()],
				)

	def test_resolve_public_pdf_image_target_decodes_actual_regression_filename(self):
		self.make_site_file("IMG_3861 (1).jpeg")
		with patch.object(property_instruction_module, "fetch_remote_public_image") as remote_fetch:
			with patch.object(property_instruction_module.socket, "getaddrinfo", side_effect=AssertionError("dns should not run")):
				image_response = resolve_public_pdf_image_target(
					"http://development.localhost:8000/files/IMG_3861%20(1).jpeg"
				)
		self.assertEqual(image_response["filename"], "IMG_3861 (1).jpeg")
		self.assertEqual(image_response["content_type"], "image/jpeg")
		self.assertEqual(image_response["content"], PNG_BYTES)
		remote_fetch.assert_not_called()

	def test_resolve_public_pdf_image_target_treats_external_frappe_style_url_as_remote(self):
		url = "https://estaex.co.uk/files/example%20image.jpeg"
		with patch.object(property_instruction_module, "resolve_local_public_image", side_effect=AssertionError("local resolver should not run")):
			with patch.object(property_instruction_module, "fetch_remote_public_image", return_value={"filename": "example image.jpeg", "content_type": "image/jpeg", "content": PNG_BYTES}) as remote_fetch:
				image_response = resolve_public_pdf_image_target(url)
		self.assertEqual(image_response["filename"], "example image.jpeg")
		remote_fetch.assert_called_once_with(url)

	def test_resolve_local_public_image_blocks_encoded_traversal(self):
		for path in (
			"/files/%2e%2e/private/files/secret.png",
			"/files/%2E%2E%2Fsite_config.json",
			"/files/subdir/%2e%2e/%2e%2e/secret.png",
		):
			with self.subTest(path=path):
				with self.assertRaises(frappe.ValidationError):
					resolve_local_public_image(path)

	def test_resolve_public_pdf_image_target_missing_same_site_file_does_not_fetch_remote(self):
		with patch.object(
			property_instruction_module,
			"fetch_remote_public_image",
			side_effect=AssertionError("remote fetch should not be called"),
		):
			with patch.object(property_instruction_module.socket, "getaddrinfo", side_effect=AssertionError("dns should not run")):
				with self.assertRaisesRegex(frappe.ValidationError, "Requested guest guide image was not found."):
					resolve_public_pdf_image_target(
						"http://development.localhost:8000/files/missing%20image.jpeg"
					)

	def test_validate_public_pdf_image_url_allows_registered_external_file_url(self):
		url = "https://estaex.co.uk/files/test-guide-image.png"
		self.make_external_file_record(url)
		parsed = validate_public_pdf_image_url(url)
		self.assertEqual(parsed.hostname, "estaex.co.uk")

	def test_instruction_template_contains_image_unavailable_copy(self):
		html = self.render_instruction(self.make_instruction())
		self.assertIn('data-guide-progress-copy="image_unavailable"', html)
		self.assertIn(">Image unavailable<", html)

	def test_export_script_treats_map_qr_composites_as_expected_side_asymmetry(self):
		source = self.get_export_script_source()
		self.assertIn("var hasMapContent = !!(details && details.hasMapContent);", source)
		self.assertIn("var hasQrContent = !!(details && details.hasQrContent);", source)
		self.assertIn("if (hasMapContent || hasQrContent) {", source)
		self.assertIn("Composite map/QR cards intentionally reserve asymmetric text/footer space", source)

	def test_export_script_throws_when_adaptive_section_has_no_valid_row_plan(self):
		source = self.get_export_script_source()
		self.assertIn('adaptive-no-valid-row-plan:', source)
		self.assertIn('adaptiveNoValidRowPlan', source)
		self.assertIn('cardPlans.length && !planResult.rows.length', source)

	def test_validate_public_pdf_image_url_allows_property_instruction_image_host(self):
		self.make_instruction(
			cover_image="https://guides.example/files/cover.png",
			instruction_blocks=[
				{
					"section": "Check-In",
					"block_type": "Image",
					"title": "Guide image",
					"image": "https://guides.example/files/block.png",
				},
			],
		)
		parsed = validate_public_pdf_image_url("https://guides.example/files/block.png")
		self.assertEqual(parsed.hostname, "guides.example")

	def test_validate_public_pdf_image_url_rejects_removed_legacy_map_hosts(self):
		with self.assertRaises(frappe.ValidationError):
			validate_public_pdf_image_url("https://tile.openstreetmap.org/16/32722/21824.png")
		with self.assertRaises(frappe.ValidationError):
			validate_public_pdf_image_url("https://maps.googleapis.com/maps/api/staticmap?center=99A")

	def test_validate_public_pdf_image_url_rejects_arbitrary_external_host(self):
		with self.assertRaises(frappe.ValidationError):
			validate_public_pdf_image_url("https://evil.example/image.png")

	def test_validate_public_pdf_image_url_rejects_malformed_url(self):
		with self.assertRaises(frappe.ValidationError):
			validate_public_pdf_image_url("javascript:alert(1)")

	def test_fetch_remote_public_image_rejects_redirect_to_disallowed_host(self):
		class FakeRedirectResponse:
			status = 302
			headers = {"Location": "https://evil.example/image.png"}

		class FakeOpener:
			def open(self, request, timeout=None):  # noqa: ARG002
				return FakeRedirectResponse()

		with patch.object(property_instruction_module, "build_opener", return_value=FakeOpener()):
			with patch.object(property_instruction_module, "validate_remote_public_image_host", return_value=False):
				with self.assertRaises(frappe.ValidationError):
					fetch_remote_public_image("https://guides.example/files/map.png")

	def test_fetch_remote_public_image_rejects_oversized_response(self):
		class FakeLargeResponse:
			status = 200
			headers = {"Content-Type": "image/png"}

			def __init__(self):
				self._read_count = 0

			def read(self, size=-1):  # noqa: ARG002
				self._read_count += 1
				if self._read_count == 1:
					return b"x" * (PUBLIC_PDF_IMAGE_MAX_BYTES + 1)
				return b""

		class FakeOpener:
			def open(self, request, timeout=None):  # noqa: ARG002
				return FakeLargeResponse()

		with patch.object(property_instruction_module, "build_opener", return_value=FakeOpener()):
			with patch.object(property_instruction_module, "validate_remote_public_image_host", return_value=False):
				with self.assertRaises(frappe.ValidationError):
					fetch_remote_public_image("https://guides.example/files/map.png")

	def test_fetch_remote_public_image_rejects_non_image_response(self):
		class FakeHtmlResponse:
			status = 200
			headers = {"Content-Type": "text/html"}

			def read(self, size=-1):  # noqa: ARG002
				return b"<html></html>"

		class FakeOpener:
			def open(self, request, timeout=None):  # noqa: ARG002
				return FakeHtmlResponse()

		with patch.object(property_instruction_module, "build_opener", return_value=FakeOpener()):
			with patch.object(property_instruction_module, "validate_remote_public_image_host", return_value=False):
				with self.assertRaises(frappe.ValidationError):
					fetch_remote_public_image("https://guides.example/files/map.png")


@frappe.whitelist()
def run_import_isolation_focused_tests():
	module_names = [
		"propms.map_snapshot.test_import_isolation",
	]
	suite = unittest.TestSuite(
		unittest.defaultTestLoader.loadTestsFromName(module_name)
		for module_name in module_names
	)
	result = unittest.TextTestRunner(verbosity=2).run(suite)
	if not result.wasSuccessful():
		raise frappe.ValidationError("Focused import-isolation tests failed")
	return {
		"tests_run": result.testsRun,
		"failures": len(result.failures),
		"errors": len(result.errors),
	}


@frappe.whitelist()
def run_migration_focused_tests():
	module_names = [
		"propms.map_snapshot.test_import_isolation",
		"propms.map_snapshot.test_validation",
		"propms.map_snapshot.test_legacy_migration",
		"propms.map_snapshot.test_legacy_field_cleanup",
	]
	suite = unittest.TestSuite(
		unittest.defaultTestLoader.loadTestsFromName(module_name)
		for module_name in module_names
	)
	result = unittest.TextTestRunner(verbosity=2).run(suite)
	if not result.wasSuccessful():
		raise frappe.ValidationError("Focused migration tests failed")
	return {
		"tests_run": result.testsRun,
		"failures": len(result.failures),
		"errors": len(result.errors),
	}


@frappe.whitelist()
def run_snapshot_focused_tests():
	module_names = [
		"propms.map_snapshot.test_presentation",
		"propms.map_snapshot.test_import_isolation",
		"propms.map_snapshot.test_validation",
		"propms.map_snapshot.test_legacy_migration",
		"propms.map_snapshot.test_legacy_field_cleanup",
		"propms.map_snapshot.test_resolver",
		"propms.map_snapshot.test_capture",
		"propms.map_snapshot.test_manifest",
		"propms.map_snapshot.test_storage",
		"propms.map_snapshot.test_jobs",
		"propms.map_snapshot.test_pdf_assets",
		"propms.map_snapshot.test_error_logging",
	]
	suite = unittest.TestSuite(
		unittest.defaultTestLoader.loadTestsFromName(module_name)
		for module_name in module_names
	)
	result = unittest.TextTestRunner(verbosity=2).run(suite)
	if not result.wasSuccessful():
		raise frappe.ValidationError("Focused snapshot tests failed")
	return {
		"tests_run": result.testsRun,
		"failures": len(result.failures),
		"errors": len(result.errors),
	}


@frappe.whitelist()
def run_property_instruction_focused_tests():
	module_names = [
		__name__,
	]
	suite = unittest.TestSuite(
		unittest.defaultTestLoader.loadTestsFromName(module_name)
		for module_name in module_names
	)
	result = unittest.TextTestRunner(verbosity=2).run(suite)
	if not result.wasSuccessful():
		raise frappe.ValidationError("Focused Property Instruction tests failed")
	return {
		"tests_run": result.testsRun,
		"failures": len(result.failures),
		"errors": len(result.errors),
	}


@frappe.whitelist()
def run_pdf_export_focused_tests():
	module_names = [
		"propms.map_snapshot.test_pdf_assets",
	]
	suite = unittest.TestSuite(
		unittest.defaultTestLoader.loadTestsFromName(module_name)
		for module_name in module_names
	)
	result = unittest.TextTestRunner(verbosity=2).run(suite)
	if not result.wasSuccessful():
		raise frappe.ValidationError("Focused PDF/export tests failed")
	return {
		"tests_run": result.testsRun,
		"failures": len(result.failures),
		"errors": len(result.errors),
	}


@frappe.whitelist()
def run_codex_tests():
	module_names = [
		__name__,
		"propms.map_snapshot.test_presentation",
		"propms.map_snapshot.test_import_isolation",
		"propms.map_snapshot.test_validation",
		"propms.map_snapshot.test_legacy_migration",
		"propms.map_snapshot.test_legacy_field_cleanup",
		"propms.map_snapshot.test_resolver",
		"propms.map_snapshot.test_capture",
		"propms.map_snapshot.test_manifest",
		"propms.map_snapshot.test_storage",
		"propms.map_snapshot.test_jobs",
		"propms.map_snapshot.test_pdf_assets",
		"propms.map_snapshot.test_error_logging",
	]
	suite = unittest.TestSuite(
		unittest.defaultTestLoader.loadTestsFromName(module_name)
		for module_name in module_names
	)
	result = unittest.TextTestRunner(verbosity=2).run(suite)
	if not result.wasSuccessful():
		raise frappe.ValidationError("Property Instruction tests failed")
	return {
		"tests_run": result.testsRun,
		"failures": len(result.failures),
		"errors": len(result.errors),
	}
