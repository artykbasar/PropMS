from __future__ import annotations

import sys
import uuid
import unittest
from unittest.mock import patch

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.website.page_renderers.document_page import _find_matching_document_webview
from frappe.website.router import clear_routing_cache, get_base_template

from propms.property_management_solution.doctype.property_instruction.property_instruction import (
	generate_translation,
)
from propms.property_management_solution.doctype.property_instruction import translation_service


class PropertyInstructionTestMixin:
	def setUp(self):
		super().setUp()
		frappe.set_user("Administrator")
		self.to_delete = []
		self.conf_backup = {}
		self.single_backup = {}
		self.original_form_dict = frappe._dict(getattr(frappe.local, "form_dict", {}) or {})
		self.original_request = getattr(frappe.local, "request", None)
		self.original_request_args = getattr(self.original_request, "args", None) if self.original_request else None
		self.clear_route_cache()

	def tearDown(self):
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
				"wifi_name": overrides.pop("wifi_name", "TestWifi"),
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

	def make_translation(self, instruction, language_code="es", status="Ready", **overrides):
		instruction.reload()
		source_blocks = instruction.get_translation_source_payload()["blocks"]
		blocks = overrides.pop(
			"blocks",
			[
				{
					"source_block_name": row["source_block_name"],
					"section": f"{row['section']} ES",
					"title": f"{(row.get('title') or row['section'])} ES",
					"body": row.get("body"),
					"caption": f"{row.get('caption') or ''} ES".strip() or None,
					"link_label": f"{row.get('link_label') or ''} ES".strip() or None,
					"sort_order": row.get("sort_order"),
				}
				for row in source_blocks
			],
		)
		doc = frappe.get_doc(
			{
				"doctype": "Property Instruction Translation",
				"property_instruction": instruction.name,
				"language_code": language_code,
				"language_name": overrides.pop("language_name", "Spanish"),
				"status": status,
				"source_modified": instruction.modified,
				"title": overrides.pop("title", f"{instruction.title} ES"),
				"address": overrides.pop("address", f"{instruction.address} ES"),
				"emergency_contact": overrides.pop("emergency_contact", "Contacto de emergencia"),
				"blocks": blocks,
				**overrides,
			}
		).insert(ignore_permissions=True)
		self.to_delete.append(("Property Instruction Translation", doc.name))
		return doc

	def get_context(self, doc, lang=None):
		doc.reload()
		frappe.local.form_dict = frappe._dict({"lang": lang} if lang else {})
		if getattr(frappe.local, "request", None):
			frappe.local.request.args = frappe._dict({"lang": lang} if lang else {})
		else:
			frappe.local.request = frappe._dict(args=frappe._dict({"lang": lang} if lang else {}))
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
		out = doc.get_context(context)
		if out:
			context.update(out)
		return context

	def render_instruction(self, doc, lang=None):
		context = self.get_context(doc, lang=lang)
		return frappe.get_template("templates/generators/property_instruction.html").render(context)


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
				{"section": "Check-In", "block_type": "Step", "title": "Second", "sort_order": 20},
				{"section": "Parking", "block_type": "Text", "title": "Parking", "sort_order": 5},
				{"section": "Check-In", "block_type": "Step", "title": "First", "sort_order": 10},
			]
		)
		sections = doc.get_grouped_blocks()
		self.assertEqual(sections[0].section, "Check-In")
		self.assertEqual([b.title for b in sections[0].blocks], ["First", "Second"])

	def test_javascript_url_rejection(self):
		with self.assertRaises(frappe.ValidationError):
			self.make_instruction(
				instruction_blocks=[
					{
						"section": "Finding the Property",
						"block_type": "Link",
						"title": "Unsafe",
						"link_url": "javascript:alert(1)",
					}
				]
			)

	def test_empty_optional_fields_do_not_break_rendering(self):
		doc = self.make_instruction(
			address=None,
			cover_image=None,
			google_maps_url=None,
			wifi_name=None,
			wifi_password=None,
			emergency_contact=None,
			instruction_blocks=[{"section": "Check-In", "block_type": "Text", "title": "Welcome", "body": ""}],
		)
		html = self.render_instruction(doc)
		self.assertIn("Test Guest Guide Property", html)

	def test_map_embed_url_uses_place_id_first(self):
		self.set_conf("google_maps_embed_api_key", "test-key")
		doc = self.make_instruction(
			address="123 Test Road, London",
			google_maps_place_id="ChIJ123abc",
			map_search_query="Ignored query",
		)
		url = doc.get_map_embed_url()
		self.assertIn("key=test-key", url)
		self.assertIn("q=place_id%3AChIJ123abc", url)
		self.assertNotIn("Ignored+query", url)

	def test_map_embed_url_encodes_address_query(self):
		self.set_conf("google_maps_embed_api_key", "test-key")
		doc = self.make_instruction(google_maps_place_id=None, map_search_query=None, address="99A Burlington Road, London SW11 2AA")
		url = doc.get_map_embed_url()
		self.assertIn("99A+Burlington+Road%2C+London+SW11+2AA", url)

	def test_map_embed_url_not_rendered_without_api_key(self):
		self.set_conf("google_maps_embed_api_key", None)
		doc = self.make_instruction()
		html = self.render_instruction(doc)
		self.assertIn("https://www.google.com/maps?", doc.get_map_embed_url())
		self.assertIn("<iframe", html)
		self.assertIn("output=embed", html)
		self.assertNotIn("key=", html)

	def test_map_embed_url_not_rendered_when_disabled(self):
		self.set_conf("google_maps_embed_api_key", "test-key")
		doc = self.make_instruction(show_embedded_map=0)
		html = self.render_instruction(doc)
		self.assertIsNone(doc.get_map_embed_url())
		self.assertNotIn("www.google.com/maps/embed/v1/place", html)
		self.assertNotIn("key=test-key", html)

	def test_map_type_and_zoom_are_normalized(self):
		self.set_conf("google_maps_embed_api_key", "test-key")
		doc = self.make_instruction(map_type="streetview", map_zoom=999)
		url = doc.get_map_embed_url()
		self.assertIn("maptype=roadmap", url)
		self.assertIn("zoom=16", url)

	def test_google_maps_url_rejects_untrusted_host(self):
		with self.assertRaises(frappe.ValidationError):
			self.make_instruction(google_maps_url="https://example.com/map")

	def test_map_external_url_is_generated_from_address(self):
		doc = self.make_instruction(google_maps_url=None, address="99A Burlington Road, New Malden")
		property_map = doc.get_property_map()
		self.assertIn("www.google.com/maps/search/", property_map.external_url)
		self.assertIn("99A+Burlington+Road%2C+New+Malden", property_map.external_url)

	def test_rendered_output_includes_expected_section_content(self):
		self.set_conf("google_maps_embed_api_key", "test-key")
		doc = self.make_instruction()
		html = self.render_instruction(doc)
		self.assertIn("Check-In", html)
		self.assertIn("Parking", html)
		self.assertIn("Open map", html)
		self.assertIn("title=\"Map showing the property location\"", html)
		self.assertIn("referrerpolicy=\"strict-origin-when-cross-origin\"", html)
		self.assertIn("allowfullscreen", html)
		self.assertIn("property-instruction-print", html)
		self.assertIn("Print or save guide", html)
		self.assertNotIn('href="javascript:', html)
		self.assertNotIn("guest-wifi-only", html)
		self.assertNotIn("15:00:00", html)
		self.assertIn("@page {", html)
		self.assertIn("pi-screen-layout", html)
		self.assertIn("pi-print-layout", html)
		self.assertIn("pi-print-title", html)
		self.assertIn("break-inside: avoid;", html)
		self.assertIn(">15:00<", html)
		print_slice = html.split('class="pi-print-layout"', 1)[1]
		self.assertNotIn("<iframe", print_slice)
		self.assertEqual(print_slice.count("https://www.google.com/maps/place/99A+Burlington+Road"), 1)

	def test_print_layout_has_dedicated_wrappers(self):
		doc = self.make_instruction()
		html = self.render_instruction(doc)
		self.assertEqual(html.count('class="pi-print-title"'), 1)
		self.assertIn(".pi-screen-layout {\n      display: none !important;", html)
		self.assertIn(".pi-print-layout {\n      display: block !important;", html)
		self.assertIn(".pi-print-meta-grid", html)
		self.assertIn(".pi-print-image-block", html)

	def test_print_hides_duplicate_map_link_block(self):
		doc = self.make_instruction(
			google_maps_url="https://www.google.com/maps/place/99A+Burlington+Road",
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Link",
					"title": "Map",
					"link_url": "https://www.google.com/maps/place/99A+Burlington+Road",
					"link_label": "Open map",
				},
				{
					"section": "Finding the Property",
					"block_type": "Text",
					"title": "Find the entrance",
					"body": "<p>Look for the black gate beside the shopfront.</p>",
				},
			],
		)
		html = self.render_instruction(doc)
		print_slice = html.split('class="pi-print-layout"', 1)[1]
		self.assertEqual(print_slice.count("https://www.google.com/maps/place/99A+Burlington+Road"), 1)
		self.assertNotIn("<strong>Open map</strong>", print_slice)
		self.assertIn("Find the entrance", print_slice)

	def test_rendered_output_excludes_unpublished_content(self):
		published_doc = self.make_instruction(title="Published Guide")
		unpublished_doc = self.make_instruction(
			property_name=self.make_property().name,
			title="Unpublished Guide",
			published=0,
			slug="unpublished-guide",
		)
		html = self.render_instruction(published_doc)
		self.assertIn("Published Guide", html)
		self.assertNotIn(unpublished_doc.title, html)

	def test_google_translate_widget_disabled_by_default(self):
		self.set_property_management_setting("enable_guest_guide_google_translate", 0)
		doc = self.make_instruction()
		html = self.render_instruction(doc)
		self.assertNotIn("translate.google.com/translate_a/element.js", html)
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
		self.assertEqual(html.count("translate.google.com/translate_a/element.js"), 1)
		self.assertIn("id=\"google_translate_element\"", html)
		self.assertIn('config.includedLanguages = "es,fr,de";', html)

	def test_no_key_map_embed_uses_trusted_google_host(self):
		self.set_conf("google_maps_embed_api_key", None)
		doc = self.make_instruction(address="99A Burlington Road, New Malden")
		self.assertTrue(doc.get_map_embed_url().startswith("https://www.google.com/maps?"))


class TestPropertyInstructionTranslations(PropertyInstructionTestMixin, FrappeTestCase):
	def test_only_ready_translations_are_public(self):
		doc = self.make_instruction()
		self.make_translation(doc, language_code="es", status="Ready", language_name="Spanish")
		self.make_translation(doc, language_code="fr", status="Draft", language_name="French")
		context = self.get_context(doc, lang="fr")
		self.assertEqual(context.title, doc.title)
		self.assertEqual(context.boot.lang, "en")
		self.assertEqual([row.language_code for row in context.available_languages], ["en", "es"])

	def test_ready_translation_renders_selected_language(self):
		doc = self.make_instruction()
		self.make_translation(doc, language_code="es", status="Ready", title="Guia de huespedes")
		context = self.get_context(doc, lang="es")
		html = self.render_instruction(doc, lang="es")
		self.assertEqual(context.boot.lang, "es")
		self.assertEqual(context.title, "Guia de huespedes")
		self.assertIn("Guia de huespedes", html)
		self.assertIn("Language", html)
		self.assertIn("Spanish", html)

	def test_ready_translation_reads_language_from_request_args(self):
		doc = self.make_instruction()
		self.make_translation(doc, language_code="es", status="Ready", title="Guia desde query")
		html = self.render_instruction(doc, lang="es")
		self.assertIn("Guia desde query", html)

	def test_context_boot_dict_is_normalized_for_public_render(self):
		doc = self.make_instruction()
		self.make_translation(doc, language_code="es", status="Ready", title="Guia publica")
		context = self.get_context(doc, lang="es")
		context.boot = {"lang": "en"}
		doc.get_context(context)
		self.assertEqual(context.boot.lang, "es")

	def test_translated_blocks_retain_source_ordering(self):
		doc = self.make_instruction(
			instruction_blocks=[
				{"section": "Check-In", "block_type": "Step", "title": "Second", "sort_order": 20},
				{"section": "Parking", "block_type": "Text", "title": "Parking", "sort_order": 5},
				{"section": "Check-In", "block_type": "Step", "title": "First", "sort_order": 10},
			]
		)
		doc.reload()
		source_blocks = doc.get_translation_source_payload()["blocks"]
		self.make_translation(
			doc,
			blocks=[
				{
					"source_block_name": source_blocks[0]["source_block_name"],
					"section": "Llegada",
					"title": "Aparcamiento traducido",
					"body": None,
					"caption": None,
					"link_label": None,
					"sort_order": source_blocks[0]["sort_order"],
				},
				{
					"source_block_name": source_blocks[1]["source_block_name"],
					"section": "Registro",
					"title": "Primero traducido",
					"body": None,
					"caption": None,
					"link_label": None,
					"sort_order": source_blocks[1]["sort_order"],
				},
				{
					"source_block_name": source_blocks[2]["source_block_name"],
					"section": "Registro",
					"title": "Segundo traducido",
					"body": None,
					"caption": None,
					"link_label": None,
					"sort_order": source_blocks[2]["sort_order"],
				},
			],
		)
		context = self.get_context(doc, lang="es")
		self.assertEqual(context.sections[0].section, "Registro")
		self.assertEqual([block.title for block in context.sections[0].blocks], ["Primero traducido", "Segundo traducido"])

	def test_translated_html_is_sanitized(self):
		doc = self.make_instruction()
		source_block = doc.get_translation_source_payload()["blocks"][1]
		self.make_translation(
			doc,
			blocks=[
				{
					"source_block_name": source_block["source_block_name"],
					"section": "Registro",
					"title": "Paso seguro",
					"body": "<p>Texto</p><script>alert(1)</script>",
					"caption": None,
					"link_label": None,
					"sort_order": source_block["sort_order"],
				}
			],
		)
		html = self.render_instruction(doc, lang="es")
		self.assertIn("Texto", html)
		self.assertNotIn("alert(1)", html)

	def test_urls_and_image_paths_remain_source_values(self):
		doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Image",
					"title": "Entrance",
					"image": "/files/test-guide-image.png",
					"caption": "Original caption",
				},
				{
					"section": "Finding the Property",
					"block_type": "Link",
					"title": "Directions",
					"link_url": "https://example.com/original-map",
					"link_label": "Original link",
				},
			],
		)
		source_blocks = doc.get_translation_source_payload()["blocks"]
		self.make_translation(
			doc,
			blocks=[
				{
					"source_block_name": source_blocks[0]["source_block_name"],
					"section": "Encontrar la propiedad",
					"title": "Entrada",
					"body": None,
					"caption": "Subtitulo",
					"link_label": None,
					"sort_order": source_blocks[0]["sort_order"],
				},
				{
					"source_block_name": source_blocks[1]["source_block_name"],
					"section": "Encontrar la propiedad",
					"title": "Direcciones",
					"body": None,
					"caption": None,
					"link_label": "Abrir mapa",
					"sort_order": source_blocks[1]["sort_order"],
				},
			],
		)
		html = self.render_instruction(doc, lang="es")
		self.assertIn("/files/test-guide-image.png", html)
		self.assertIn("https://example.com/original-map", html)
		self.assertIn("Abrir mapa", html)

	def test_generate_translation_creates_draft_with_mocked_service(self):
		doc = self.make_instruction()
		with patch.object(
			translation_service,
			"translate_property_instruction",
			return_value={
				"title": "Guia de huespedes",
				"address": "99A Burlington Road ES",
				"emergency_contact": "Emergencia",
				"blocks": [
					{
						"source_block_name": row["source_block_name"],
						"section": f"{row['section']} ES",
						"title": f"{row.get('title') or ''} ES".strip() or None,
						"body": row.get("body"),
						"caption": row.get("caption"),
						"link_label": row.get("link_label"),
						"sort_order": row.get("sort_order"),
					}
					for row in doc.get_translation_source_payload()["blocks"]
				],
			},
		):
			result = generate_translation(doc.name, "es", "Spanish")
		translation = frappe.get_doc("Property Instruction Translation", result["name"])
		self.to_delete.append(("Property Instruction Translation", translation.name))
		self.assertEqual(translation.status, "Draft")
		self.assertEqual(translation.language_code, "es")
		self.assertEqual(translation.title, "Guia de huespedes")

	def test_missing_google_credentials_error_does_not_break_english_page(self):
		doc = self.make_instruction()
		with patch("importlib.util.find_spec", return_value=None):
			with self.assertRaises(frappe.ValidationError):
				translation_service.translate_property_instruction(
					doc.get_translation_source_payload(),
					target_language="es",
				)
		html = self.render_instruction(doc)
		self.assertIn(doc.title, html)

	def test_translation_change_marks_existing_translations_stale(self):
		doc = self.make_instruction()
		translation = self.make_translation(doc, language_code="es", status="Ready")
		doc.title = "Updated Guide Title"
		doc.save(ignore_permissions=True)
		translation.reload()
		self.assertEqual(translation.status, "Stale")

	def test_translated_print_output_uses_selected_language(self):
		doc = self.make_instruction()
		self.make_translation(doc, language_code="es", status="Ready", title="Guia para imprimir")
		html = self.render_instruction(doc, lang="es")
		self.assertIn("Guia para imprimir", html)
		self.assertIn("@page {", html)
		self.assertIn(".pi-language-switcher", html)

	def test_translation_fallback_excludes_unready_content(self):
		doc = self.make_instruction(title="English Guide")
		self.make_translation(doc, language_code="es", status="Stale", title="Guia caducada")
		html = self.render_instruction(doc, lang="es")
		self.assertIn("English Guide", html)
		self.assertNotIn("Guia caducada", html)


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


@frappe.whitelist()
def create_temp_http_instruction():
	property_doc = frappe.get_doc(
		{
			"doctype": "Property",
			"name1": f"HTTP Test Property {uuid.uuid4().hex[:8]}",
		}
	).insert(ignore_permissions=True)
	instruction = frappe.get_doc(
		{
			"doctype": "Property Instruction",
			"title": "Test Guest Guide Property",
			"property": property_doc.name,
			"published": 1,
			"google_maps_url": "https://example.com/map",
			"wifi_name": "TestWifi",
			"wifi_password": "guest-wifi-only",
			"instruction_blocks": [
				{
					"section": "Check-In",
					"block_type": "Step",
					"title": "Arrive",
					"body": "<p>Welcome to the property.</p>",
				},
				{
					"section": "Parking",
					"block_type": "Text",
					"title": "Parking",
					"body": "<p>Use the allocated bay.</p>",
				},
			],
		}
	).insert(ignore_permissions=True)
	clear_routing_cache()
	return {
		"instruction_name": instruction.name,
		"property_name": property_doc.name,
		"route": instruction.route,
	}


@frappe.whitelist()
def delete_temp_http_instruction(instruction_name, property_name):
	if frappe.db.exists("Property Instruction", instruction_name):
		frappe.delete_doc("Property Instruction", instruction_name, force=1)
	if frappe.db.exists("Property", property_name):
		frappe.delete_doc("Property", property_name, force=1)
	clear_routing_cache()
	return {"deleted": True}
