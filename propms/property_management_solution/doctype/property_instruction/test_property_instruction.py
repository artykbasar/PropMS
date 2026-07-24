from __future__ import annotations

import base64
import os
import unittest
import uuid
from unittest.mock import patch

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

	def make_site_file(self, filename, content=PNG_BYTES, private=False):
		base_path = frappe.get_site_path("private" if private else "public", "files")
		os.makedirs(base_path, exist_ok=True)
		file_path = os.path.join(base_path, filename)
		with open(file_path, "wb") as site_file:
			site_file.write(content)
		self.temp_files.append(file_path)
		return file_path


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
		self.assertNotIn("download_pdf?", html)
		self.assertNotIn("Property Instruction Translation", html)
		self.assertNotIn("Google Cloud Translation", html)

	def test_export_script_uses_per_page_html2canvas_and_direct_jspdf(self):
		source = self.get_export_script_source()
		self.assertIn("function buildPdfExportDocument(model)", source)
		self.assertIn('querySelectorAll("[data-pdf-page]")', source)
		self.assertIn("window.html2canvas(pageNode", source)
		self.assertIn("new jsPDF({", source)
		self.assertNotIn("html2" + "pdf().from(", source)
		self.assertIn("destroyExportRoot", source)
		self.assertIn("getVisibleText(", source)
		self.assertIn("anchor.getClientRects()", source)
		self.assertIn("img.decode", source)
		self.assertIn("populatePageFooters", source)
		self.assertIn('guideScreen.querySelectorAll("[data-guide-section]")', source)
		self.assertNotIn("download_pdf?", source)
		self.assertNotIn("Property Instruction Translation", source)

	def test_export_script_does_not_use_legacy_cloned_print_layout(self):
		source = self.get_export_script_source()
		self.assertNotIn(".pi-print-layout", source)
		self.assertNotIn("html2" + "pdf__overlay", source)
		self.assertNotIn("data-pdf-token", source)

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
