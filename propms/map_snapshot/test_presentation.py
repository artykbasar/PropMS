from __future__ import annotations

import unittest
from dataclasses import replace
from unittest.mock import patch

from frappe.tests.utils import FrappeTestCase

from propms.map_snapshot.presentation import (
	MY_MAPS_HEADER_CROP_PX,
	MY_MAPS_PRESENTATION_VERSION,
	build_map_source_hash,
	get_map_presentation,
	is_google_my_maps,
)
from propms.property_management_solution.doctype.property_instruction.test_property_instruction import (
	PropertyInstructionTestMixin,
)


class TestMapSnapshotPresentation(PropertyInstructionTestMixin, FrappeTestCase):
	def test_crop_constant_and_presentation_version_are_fixed(self):
		self.assertEqual(MY_MAPS_HEADER_CROP_PX, 60)
		self.assertEqual(MY_MAPS_PRESENTATION_VERSION, 1)

	def test_standard_maps_descriptor_has_no_crop(self):
		presentation = get_map_presentation("google-maps")
		self.assertEqual(presentation.crop_px, 0)

	def test_my_maps_descriptor_has_sixty_pixel_crop(self):
		presentation = get_map_presentation("google-my-maps")
		self.assertEqual(presentation.crop_px, 60)
		self.assertTrue(is_google_my_maps(presentation.map_kind))

	def test_my_maps_source_hash_changes_when_crop_changes(self):
		url = "https://www.google.com/maps/d/embed?mid=mid123&ehbc=2E312F"
		baseline = build_map_source_hash(url, "google-my-maps")
		with patch(
			"propms.map_snapshot.presentation.get_map_presentation",
			return_value=replace(get_map_presentation("google-my-maps"), crop_px=64),
		):
			changed = build_map_source_hash(url, "google-my-maps")
		self.assertNotEqual(baseline, changed)

	def test_standard_maps_source_hash_is_deterministic(self):
		url = "https://www.google.com/maps/embed?pb=abc"
		self.assertEqual(build_map_source_hash(url, "google-maps"), build_map_source_hash(url, "google-maps"))

	def test_main_my_maps_live_html_contains_crop_class(self):
		doc = self.make_instruction(
			custom_map_embed_url="https://www.google.com/maps/d/embed?mid=mid123&ehbc=2E312F"
		)
		html = self.render_instruction(doc)
		self.assertIn("pi-map-shell--google-my-maps", html)
		self.assertIn("--pi-my-maps-header-crop: 60px", html)

	def test_main_standard_maps_live_html_does_not_use_my_maps_class(self):
		doc = self.make_instruction(
			custom_map_embed_url="https://www.google.com/maps/embed?pb=standard123"
		)
		html = self.render_instruction(doc)
		self.assertIn("pi-map-shell--google-maps", html)
		self.assertNotIn('class="pi-map-shell pi-map-shell--google-my-maps"', html)

	def test_block_my_maps_html_contains_crop_class(self):
		doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Map",
					"title": "Map block",
					"custom_map_embed_url": "https://www.google.com/maps/d/embed?mid=mid123&ehbc=2E312F",
				}
			]
		)
		html = self.render_instruction(doc)
		self.assertIn("pi-instruction-map-shell--google-my-maps", html)

	def test_export_script_does_not_hard_code_independent_sixty_pixel_value_for_my_maps(self):
		source = self.get_export_script_source()
		self.assertNotIn("translateY(-60px)", source)

	def test_live_html_omits_legacy_pdf_map_attribution_markup(self):
		doc = self.make_instruction(
			custom_map_embed_url="https://www.google.com/maps/d/embed?mid=mid123&ehbc=2E312F"
		)
		html = self.render_instruction(doc)
		self.assertNotIn("data-guide-map-attribution=", html)
