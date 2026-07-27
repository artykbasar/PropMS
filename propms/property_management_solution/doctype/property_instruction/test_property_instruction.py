from __future__ import annotations

import base64
import json
import os
import unittest
import uuid
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.website.page_renderers.document_page import _find_matching_document_webview
from frappe.website.router import clear_routing_cache, get_base_template
from werkzeug.datastructures import Headers

from propms.property_management_solution.doctype.property_instruction import property_instruction as property_instruction_module
from propms.property_management_solution.doctype.property_instruction.property_instruction import (
	NOINDEX_ROBOTS_CONTENT,
	PUBLIC_PDF_IMAGE_MAX_BYTES,
	apply_guest_guide_noindex_headers,
	fetch_remote_public_image,
	resolve_public_pdf_image_target,
	validate_public_pdf_image_url,
)
from propms.www.sitemap import get_filtered_public_pages_from_doctypes


PNG_BYTES = base64.b64decode(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9sX7LQAAAABJRU5ErkJggg=="
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


class PropertyInstructionTestMixin:
	def setUp(self):
		super().setUp()
		frappe.set_user("Administrator")
		self.to_delete = []
		self.temp_files = []
		self.conf_backup = {}
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
			if frappe.db.exists(doctype, name):
				frappe.delete_doc(doctype, name, force=1)
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
				"title": overrides.pop("title", "Test Guest Guide Property"),
				"property": property_name,
				"published": overrides.pop("published", 1),
				"address": overrides.pop("address", "99A Burlington Road"),
				"google_maps_url": overrides.pop(
					"google_maps_url",
					"https://www.google.com/maps/place/99A+Burlington+Road",
				),
				"show_embedded_map": overrides.pop("show_embedded_map", 1),
				"google_maps_place_id": overrides.pop("google_maps_place_id", None),
				"map_search_query": overrides.pop("map_search_query", None),
				"map_zoom": overrides.pop("map_zoom", 16),
				"map_type": overrides.pop("map_type", "roadmap"),
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
		context.build_version = ""
		context.dev_server = "false"
		context.path = f"/{doc.route}"
		context.pathname = f"/{doc.route}"
		context.web_include_js = []
		context.web_include_icons = []
		context.show_language_picker = "false"
		context._context_dict = context
		frappe.local.response_headers = Headers()
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

	def make_site_file(self, filename, content=PNG_BYTES, private=False):
		base_path = frappe.get_site_path("private" if private else "public", "files")
		os.makedirs(base_path, exist_ok=True)
		file_path = os.path.join(base_path, filename)
		with open(file_path, "wb") as site_file:
			site_file.write(content)
		self.temp_files.append(file_path)
		return file_path

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
					"title": "Second",
					"body": "<p>Two</p>",
					"sort_order": 2,
				},
				{
					"section": "Check-In",
					"block_type": "Step",
					"title": "First",
					"body": "<p>One</p>",
					"sort_order": 1,
				},
			]
		)
		sections = doc.get_grouped_blocks()
		self.assertEqual([block.title for block in sections[0].blocks], ["First", "Second"])
		self.assertEqual([block.display_step_number for block in sections[0].blocks], [1, 2])

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
			show_embedded_map=0,
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

	def test_map_embed_url_uses_place_id_first(self):
		self.set_conf("google_maps_embed_api_key", "test-key")
		doc = self.make_instruction(
			google_maps_place_id="ChIJ123",
			map_search_query="Other Query",
			address="99A Burlington Road",
		)
		embed_url = doc.get_map_embed_url()
		self.assertIn("embed/v1/place", embed_url)
		self.assertIn("place_id%3AChIJ123", embed_url)
		self.assertIn("key=test-key", embed_url)

	def test_map_embed_url_encodes_address_query_without_api_key(self):
		doc = self.make_instruction(google_maps_place_id=None, map_search_query=None, address="99A Burlington Road")
		embed_url = doc.get_map_embed_url()
		self.assertIn("https://www.google.com/maps", embed_url)
		self.assertIn("99A+Burlington+Road", embed_url)
		self.assertIn("output=embed", embed_url)

	def test_map_embed_url_not_rendered_when_disabled(self):
		doc = self.make_instruction(show_embedded_map=0)
		self.assertIsNone(doc.get_map_embed_url())

	def test_map_type_and_zoom_are_normalized(self):
		doc = self.make_instruction(map_type="bad", map_zoom=88)
		self.assertEqual(doc.map_type, "roadmap")
		self.assertEqual(doc.map_zoom, 16)

	def test_google_maps_url_rejects_untrusted_host(self):
		with self.assertRaises(frappe.ValidationError):
			self.make_instruction(google_maps_url="https://example.com/maps")

	def test_map_external_url_is_generated_from_address(self):
		doc = self.make_instruction(google_maps_url=None, google_maps_place_id=None, map_search_query=None)
		self.assertIn("https://www.google.com/maps/search/", doc.get_map_external_url())
		self.assertIn("99A+Burlington+Road", doc.get_map_external_url())

	def test_map_block_option_and_embed_field_exist_in_schema(self):
		schema = self.get_block_doctype_json()
		block_type_field = next(field for field in schema["fields"] if field["fieldname"] == "block_type")
		embed_field = next(field for field in schema["fields"] if field["fieldname"] == "google_maps_embed_html")
		self.assertIn("Map", block_type_field["options"].splitlines())
		self.assertEqual(embed_field["fieldtype"], "Code")
		self.assertEqual(embed_field["options"], "HTML")
		self.assertEqual(embed_field["depends_on"], 'eval:doc.block_type')
		self.assertEqual(embed_field["mandatory_depends_on"], 'eval:doc.block_type == "Map"')
		self.assertIn("Required for Map blocks. Optional for Step/Text/Image/Warning/Link.", embed_field["description"])

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
					"google_maps_embed_html": embed_html,
				},
			]
		)
		grouped_sections = doc.get_grouped_blocks()
		block = grouped_sections[0].blocks[0]
		self.assertEqual(block.block_type, "Map")
		self.assertEqual(block.map_embed_url, "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2484.0!2d-0.249!3d51.399!2m3!1f0!2f0!3f0!3m2!1i1024!2i768")
		self.assertNotIn("google_maps_embed_html", block)
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
						"google_maps_embed_html": '<iframe src="https://example.com/maps/embed"></iframe>',
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
						"google_maps_embed_html": '<iframe srcdoc="<script>alert(1)</script>" src="https://www.google.com/maps/embed?pb=1"></iframe>',
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
						"google_maps_embed_html": '<iframe src="javascript:alert(1)"></iframe>',
					},
				]
			)

	def test_map_block_coordinate_parsing_supports_embed_formats(self):
		doc = self.make_instruction()
		for url in (
			"https://www.google.com/maps/@51.399,-0.249,16z",
			"https://www.google.com/maps?output=embed&q=51.399,-0.249",
			"https://www.google.com/maps/embed?pb=!1m18!2m3!1d1!2d-0.249!3d51.399!3m2!1i1024!2i768!4f13.1",
		):
			coordinates = doc.parse_map_coordinates_from_url(url)
			self.assertAlmostEqual(coordinates.latitude, 51.399)
			self.assertAlmostEqual(coordinates.longitude, -0.249)

	def test_map_block_prefers_embed_marker_coordinates_over_viewport_center(self):
		doc = self.make_instruction()
		url = (
			"https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d1279.5630588056072!"
			"2d-0.24875145778959576!3d51.40036019312703!2m3!1f0!2f0!3f0!"
			"3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48760b63ea8c7a0d%3A0x17987c5fb2499918!"
			"2s99A%20Burlington%20Rd%2C%20New Malden%20KT3%204LR!5e0!3m2!1sen!2suk!"
			"4v1753776094216!5m2!1sen!2suk!2zNTHCsDI0JzAyLjEiTiAwwrAxNCc1MC4zIlc"
		)
		coordinates = doc.parse_map_coordinates_from_url(url)
		center = doc.parse_map_center_coordinates_from_url(url)
		self.assertAlmostEqual(center.latitude, 51.40036019312703)
		self.assertAlmostEqual(center.longitude, -0.24875145778959576)
		self.assertAlmostEqual(coordinates.latitude, 51.4005833333, places=6)
		self.assertAlmostEqual(coordinates.longitude, -0.2473055556, places=6)
		self.assertEqual(coordinates.source, "google_embed_dms_marker")

	def test_google_embed_marker_coordinate_decoder_supports_urlsafe_and_padding(self):
		doc = self.make_instruction()
		token = "NTHCsDI0JzAyLjEiTiAwwrAxNCc1MC4zIlc".replace("+", "-").replace("/", "_").rstrip("=")
		decoded = doc.decode_google_embed_marker_token(token)
		self.assertIn('51°24\'02.1"N', decoded)
		coordinates = doc.parse_map_coordinates_from_dms_text(decoded)
		self.assertAlmostEqual(coordinates.latitude, 51.4005833333, places=6)
		self.assertAlmostEqual(coordinates.longitude, -0.2473055556, places=6)

	def test_map_block_counts_as_content_and_uses_link_fallback_without_coordinates(self):
		doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Map",
					"title": "Arrival map",
					"google_maps_embed_html": '<iframe src="https://www.google.com/maps?output=embed&q=99A+Burlington+Road"></iframe>',
				},
			]
		)
		grouped_sections = doc.get_grouped_blocks()
		self.assertEqual(grouped_sections[0].blocks[0].block_type, "Map")
		self.assertIsNone(grouped_sections[0].blocks[0].map_latitude)
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
					"google_maps_embed_html": embed_html,
				},
			]
		)
		block = doc.get_grouped_blocks()[0].blocks[0]
		self.assertEqual(block.block_type, "Step")
		self.assertEqual(block.map_embed_url, "https://www.google.com/maps/embed?pb=!1m18!2m3!1d1!2d-0.249!3d51.399!3m2!1i1024!2i768!4f13.1")
		html = self.render_instruction(doc)
		self.assertIn('data-guide-block-map', html)
		self.assertIn('class="pi-instruction-map"', html)
		self.assertIn('data-guide-block-map-center-latitude="51.399"', html)
		self.assertIn('data-guide-block-map-marker-latitude="51.399"', html)
		self.assertIn('data-guide-block-map-coordinate-source="google_embed_viewport_center"', html)

	def test_text_block_with_embed_html_renders_a_validated_map(self):
		embed_html = '<iframe src="https://www.google.com/maps?output=embed&q=51.399,-0.249"></iframe>'
		doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Text",
					"title": "Map details",
					"body": "<p>Approach from the high street.</p>",
					"google_maps_embed_html": embed_html,
				},
			]
		)
		block = doc.get_grouped_blocks()[0].blocks[0]
		self.assertEqual(block.block_type, "Text")
		self.assertEqual(block.map_embed_url, "https://www.google.com/maps?output=embed&q=51.399,-0.249")
		self.assertAlmostEqual(block.map_latitude, 51.399)
		self.assertAlmostEqual(block.map_longitude, -0.249)

	def test_block_map_external_url_uses_marker_coordinates(self):
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
					"google_maps_embed_html": embed_html,
				},
			]
		)
		block = doc.get_grouped_blocks()[0].blocks[0]
		self.assertAlmostEqual(block.map_center_latitude, 51.40036019312703)
		self.assertAlmostEqual(block.map_center_longitude, -0.24875145778959576)
		self.assertAlmostEqual(block.map_marker_latitude, 51.4005833333, places=6)
		self.assertAlmostEqual(block.map_marker_longitude, -0.2473055556, places=6)
		self.assertEqual(block.map_coordinate_source, "google_embed_dms_marker")
		parsed = urlparse(block.map_external_url)
		query = parse_qs(parsed.query or "")
		self.assertEqual(query.get("api"), ["1"])
		latitude_text, longitude_text = (query.get("query") or ["0,0"])[0].split(",", 1)
		self.assertAlmostEqual(float(latitude_text), 51.4005833333, places=6)
		self.assertAlmostEqual(float(longitude_text), -0.2473055556, places=6)

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
						"google_maps_embed_html": '<iframe src="https://example.com/maps/embed"></iframe>',
					},
				]
			)

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
		doc = self.make_instruction()
		html = self.render_instruction(doc)
		self.assertIn("/assets/propms/js/property_instruction_export.js", html)
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
		export_index = html.index("/assets/propms/js/property_instruction_export.js")
		google_index = html.index("translate.google.com/translate_a/element.js")
		self.assertLess(export_index, google_index)
		self.assertIn("__propertyInstructionGoogleScriptRequestedAt = Date.now()", html)

	def test_export_script_uses_per_page_html2canvas_and_direct_jspdf(self):
		source = self.get_export_script_source()
		ensure_original_snapshot_start = source.index("function ensureOriginalSnapshotCaptured()")
		ensure_original_snapshot_end = source.index("function sleep(", ensure_original_snapshot_start)
		ensure_original_snapshot_source = source[ensure_original_snapshot_start:ensure_original_snapshot_end]
		self.assertIn("function buildPdfExportDocument(model)", source)
		self.assertIn('querySelectorAll("[data-pdf-page]")', source)
		self.assertIn("function ensureCaptureFrame()", source)
		self.assertIn("function prepareCaptureFramePage(pageNode, performanceState)", source)
		self.assertIn("window.html2canvas(captureTarget.page", source)
		self.assertIn("new jsPDF({", source)
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

	def test_export_script_resolves_images_through_same_origin_proxy_and_validates_painting(self):
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
		self.assertIn("validateExportImagesCanPaintToCanvas", source)
		self.assertIn("validateCanvasPaintedImages(pageNode, canvas, index)", source)
		self.assertIn('throw new Error("image-not-painted")', source)

	def test_export_script_records_pdf_performance_and_ignores_non_current_pages(self):
		source = self.get_export_script_source()
		self.assertIn("window.__propertyInstructionPdfPerformance", source)
		self.assertIn("window.__propertyInstructionPdfLifecycle", source)
		self.assertIn("translationReadyMs", source)
		self.assertIn("pageCaptureMs", source)
		self.assertIn("frameCreatedAt", source)
		self.assertIn("frameStylesReadyMs", source)
		self.assertIn("frameFontsReadyMs", source)
		self.assertIn("pageDomReplacementMs", source)
		self.assertIn("captureTarget = await prepareCaptureFramePage(pageNode, performanceState)", source)
		self.assertIn("destroyCaptureFrame(captureFrame)", source)
		self.assertIn("prepareCaptureClone(clonedDocument)", source)
		self.assertNotIn("function applyCaptureIgnoreAttributes(", source)
		self.assertNotIn("function clearCaptureIgnoreAttributes(", source)
		self.assertIn("canvas.width = 1;", source)
		self.assertIn("await sleep(isSafariFamily() ? 16 : 0);", source)

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
		self.assertIn("pageImageBlobs.push(jpegBlob)", source)
		self.assertIn("PDF pagination dropped export content", source)
		self.assertNotIn("pi-export-section--quick-links", source)
		self.assertIn("data-pdf-download-anchor", html)
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
		self.assertIn("frameDocument.fonts.load(fontSpec)", source)
		self.assertIn("frameDocument.fonts.check(fontSpec)", source)
		self.assertIn('setTranslationAbortReason("PDF font load failed", "pdf-font-load-failed")', source)
		self.assertIn("window.__propertyInstructionPdfTypographyDiagnostics", source)
		self.assertIn("collectTypographyDiagnostics", source)
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

	def test_export_script_checks_export_dom_parity_after_mount_and_before_canvas(self):
		source = self.get_export_script_source()
		self.assertIn('validateExportDomParity(exportState.exportRoot, preMountParity.modelParityMap, "detached-build")', source)
		self.assertIn('validateExportDomParity(exportState.exportRoot, preMountParity.modelParityMap, "post-mount")', source)
		self.assertIn('validateExportDomParity(exportState.exportRoot, preMountParity.modelParityMap, "post-pagination")', source)
		self.assertIn('validateExportDomParity(exportState.exportRoot, modelParityMap, "pre-render", mutationGuardState)', source)
		self.assertIn('validateExportDomParity(exportState.exportRoot, modelParityMap, "post-fonts-images", mutationGuardState)', source)
		self.assertIn('validateExportDomParity(exportState.exportRoot, modelParityMap, "before-canvas-page-" + (index + 1), mutationGuardState)', source)
		self.assertIn('validateExportDomParity(exportState.exportRoot, modelParityMap, "post-render", mutationGuardState)', source)
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
		self.assertIn('data-guide-print-ready-confirm', source)
		self.assertIn('data-guide-print-ready-cancel', source)
		self.assertIn("Now ready to print", source)
		self.assertIn('<svg class="pi-toolbar-action-icon"', source)
		self.assertIn('aria-labelledby", "pi-print-ready-kicker"', source)
		self.assertIn('margin:auto;inset:0;', source)
		self.assertIn('grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);', source)
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
		self.assertIn('const printGuideReadyConfirmButton', source)
		self.assertIn('var readyTab = window.open("", "_blank");', source)
		self.assertIn('var cachedPrintTab = window.open("", "_blank");', source)
		self.assertIn("if (!navigatePdfTabAndSchedulePrint(readyTab, readyArtifact, 2)) {", source)
		self.assertIn("if (!navigatePdfTabAndSchedulePrint(cachedPrintTab, completedArtifact, 1)) {", source)
		self.assertIn("The browser blocked the printable PDF tab. Allow pop-ups for this site, then select Print now again.", source)
		self.assertIn("The printable PDF tab could not be opened. Select Print now to try again.", source)
		self.assertIn('openPrintGuideReadyDialog(artifact, printButton, "");', source)
		self.assertIn('printGuideController.pendingArtifact = artifact;', source)
		self.assertIn("resetPrintGuidePendingState();", source)
		self.assertIn("const printButton = event.target.closest(\".property-instruction-print\");", source)
		self.assertIn("await printGeneratedGuide(printButton);", source)
		self.assertNotIn("await " + legacy_print_name + "(printButton);", source)

	def test_export_script_projects_map_marker_separately_from_center(self):
		source = self.get_export_script_source()
		self.assertIn("centerLatitude", source)
		self.assertIn("centerLongitude", source)
		self.assertIn("markerLatitude", source)
		self.assertIn("markerLongitude", source)
		self.assertIn("projectedMarkerX", source)
		self.assertIn("projectedMarkerY", source)
		self.assertIn("markerInsideCanvas", source)
		self.assertIn("map-marker-outside-canvas", source)

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

	def test_validate_public_pdf_image_url_allows_registered_external_file_url(self):
		url = "https://estaex.co.uk/files/test-guide-image.png"
		self.make_external_file_record(url)
		parsed = validate_public_pdf_image_url(url)
		self.assertEqual(parsed.hostname, "estaex.co.uk")

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

	def test_validate_public_pdf_image_url_allows_openstreetmap_tile_host(self):
		parsed = validate_public_pdf_image_url("https://tile.openstreetmap.org/16/32722/21824.png")
		self.assertEqual(parsed.hostname, "tile.openstreetmap.org")

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
					fetch_remote_public_image("https://maps.googleapis.com/maps/api/staticmap?center=99A")

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
					fetch_remote_public_image("https://maps.googleapis.com/maps/api/staticmap?center=99A")

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
					fetch_remote_public_image("https://maps.googleapis.com/maps/api/staticmap?center=99A")


@frappe.whitelist()
def run_codex_tests():
	suite = unittest.defaultTestLoader.loadTestsFromName(__name__)
	result = unittest.TextTestRunner(verbosity=2).run(suite)
	if not result.wasSuccessful():
		raise frappe.ValidationError("Property Instruction tests failed")
	return {
		"tests_run": result.testsRun,
		"failures": len(result.failures),
		"errors": len(result.errors),
	}
