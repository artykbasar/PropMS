from __future__ import annotations

import uuid
import unittest

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.website.page_renderers.document_page import _find_matching_document_webview
from frappe.website.router import clear_routing_cache, get_base_template


class TestPropertyInstruction(FrappeTestCase):
	def setUp(self):
		super().setUp()
		frappe.set_user("Administrator")
		self.to_delete = []
		self.clear_route_cache()

	def tearDown(self):
		for doctype, name in reversed(self.to_delete):
			if frappe.db.exists(doctype, name):
				frappe.delete_doc(doctype, name, force=1)
		self.clear_route_cache()
		super().tearDown()

	def clear_route_cache(self):
		_find_matching_document_webview.clear_cache()
		clear_routing_cache()

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
				"google_maps_url": overrides.pop("google_maps_url", "https://maps.example.com/test"),
				"wifi_name": overrides.pop("wifi_name", "TestWifi"),
				"wifi_password": overrides.pop("wifi_password", "guest-wifi-only"),
				"check_in_time": overrides.pop("check_in_time", "15:00:00"),
				"check_out_time": overrides.pop("check_out_time", "11:00:00"),
				"emergency_contact": overrides.pop("emergency_contact", "Emergency Contact"),
				"instruction_blocks": overrides.pop(
					"instruction_blocks",
					[
						{
							"section": "Check-In",
							"block_type": "Step",
							"step_number": 1,
							"title": "Find lockbox",
							"body": "<p>Use the side gate.</p>",
						},
						{
							"section": "Check-In",
							"block_type": "Step",
							"title": "Enter code",
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
						{
							"section": "Finding the Property",
							"block_type": "Link",
							"title": "Map",
							"link_url": "https://example.com/map",
							"link_label": "Open map",
						},
					],
				),
				**overrides,
			}
		).insert(ignore_permissions=True)
		self.to_delete.append(("Property Instruction", doc.name))
		self.clear_route_cache()
		return doc

	def render_instruction(self, doc):
		doc.reload()
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
		return frappe.get_template("templates/generators/property_instruction.html").render(context)

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
		self.assertEqual(
			_find_matching_document_webview(doc.route),
			("Property Instruction", doc.name),
		)

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
			instruction_blocks=[
				{
					"section": "Check-In",
					"block_type": "Text",
					"title": "Welcome",
					"body": "",
				}
			],
		)
		html = self.render_instruction(doc)
		self.assertIn("Test Guest Guide Property", html)

	def test_rendered_output_includes_expected_section_content(self):
		doc = self.make_instruction()
		html = self.render_instruction(doc)
		self.assertIn("Check-In", html)
		self.assertIn("Parking", html)
		self.assertIn("Open map", html)

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


@frappe.whitelist()
def run_codex_tests():
	suite = unittest.defaultTestLoader.loadTestsFromTestCase(TestPropertyInstruction)
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


@frappe.whitelist()
def set_temp_instruction_published(instruction_name, published):
	doc = frappe.get_doc("Property Instruction", instruction_name)
	doc.published = int(published)
	doc.save(ignore_permissions=True)
	clear_routing_cache()
	return {"instruction_name": doc.name, "published": doc.published, "route": doc.route}
