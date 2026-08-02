from __future__ import annotations

from unittest.mock import patch

from frappe.tests.utils import FrappeTestCase

from propms.map_snapshot.resolver import CaptureMapReference, resolve_capture_map
from propms.property_management_solution.doctype.property_instruction.test_property_instruction import (
	PropertyInstructionTestMixin,
)


class TestMapSnapshotResolver(PropertyInstructionTestMixin, FrappeTestCase):
	def test_main_map_resolution(self):
		doc = self.make_instruction(
			custom_map_embed_url="https://www.google.com/maps/d/embed?mid=mid123&ehbc=2E312F"
		)
		resolved = resolve_capture_map(CaptureMapReference(doc.name, "property-location"))
		self.assertEqual(resolved.map_kind, "google-my-maps")
		self.assertTrue(resolved.source_hash)

	def test_main_map_resolution_rejects_empty_explicit_embed(self):
		doc = self.make_instruction(
			custom_map_embed_url="",
			google_maps_url="https://www.google.com/maps/place/99A+Burlington+Road",
		)
		with self.assertRaises(Exception):
			resolve_capture_map(CaptureMapReference(doc.name, "property-location"))

	def test_block_map_resolution_by_row_name(self):
		doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Map",
					"title": "Map block",
					"custom_map_embed_url": "https://www.google.com/maps/embed?pb=abc",
				}
			]
		)
		row_name = doc.instruction_blocks[0].name
		resolved = resolve_capture_map(CaptureMapReference(doc.name, "block", row_name=row_name))
		self.assertEqual(resolved.row_name, row_name)
		self.assertEqual(resolved.map_kind, "google-maps")

	def test_missing_row_is_rejected(self):
		doc = self.make_instruction()
		with self.assertRaises(Exception):
			resolve_capture_map(CaptureMapReference(doc.name, "block", row_name="missing"))

	def test_non_map_row_is_rejected(self):
		doc = self.make_instruction()
		row_name = doc.instruction_blocks[0].name
		with self.assertRaises(Exception):
			resolve_capture_map(CaptureMapReference(doc.name, "block", row_name=row_name))

	def test_invalid_url_is_rejected(self):
		doc = self.make_instruction(
			custom_map_embed_url="https://www.google.com/maps/d/embed?mid=mid123&ehbc=2E312F"
		)
		with patch.object(
			type(doc),
			"get_custom_property_map_embed_url",
			return_value="https://example.com/maps/embed",
		):
			with self.assertRaises(Exception):
				resolve_capture_map(CaptureMapReference(doc.name, "property-location"))
