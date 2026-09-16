from __future__ import annotations

import frappe
from frappe.tests.utils import FrappeTestCase
from werkzeug.datastructures import Headers

from propms.map_snapshot.pdf_assets import (
	PDF_MAP_REPRESENTATION_NONE,
	PDF_MAP_REPRESENTATION_QR,
	PDF_MAP_REPRESENTATION_SNAPSHOT,
	PUBLIC_MAP_SNAPSHOT_IMAGE_ENDPOINT,
	build_pdf_map_representation,
	public_map_snapshot_image,
)
from propms.map_snapshot.presentation import build_map_source_hash
from propms.map_snapshot.storage import save_snapshot_png
from propms.property_management_solution.doctype.property_instruction.test_property_instruction import (
	PNG_BYTES,
	PropertyInstructionTestMixin,
)


class TestPdfMapAssets(PropertyInstructionTestMixin, FrappeTestCase):
	def _set_ready_parent_snapshot(self, doc):
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
		self.save_snapshot_system_state(doc)
		return source_hash, file_doc

	def _set_ready_block_snapshot(self, doc, row):
		block_map = doc.get_block_map_data(row)
		source_hash = build_map_source_hash(block_map.embed_url, block_map.embed_kind)
		file_doc = save_snapshot_png(
			property_instruction=doc.name,
			map_key="block",
			row_name=row.name,
			source_hash=source_hash,
			png_bytes=PNG_BYTES,
		)
		row.custom_map_snapshot = file_doc.file_url
		row.custom_map_snapshot_status = "Ready"
		row.custom_map_snapshot_source_hash = source_hash
		self.save_snapshot_system_state(doc)
		return source_hash, file_doc

	def _reset_response(self):
		frappe.response = frappe._dict({})
		frappe.local.response_headers = Headers()

	def test_current_parent_snapshot_uses_public_endpoint_representation(self):
		doc = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=current-parent")
		source_hash, file_doc = self._set_ready_parent_snapshot(doc)
		representation = build_pdf_map_representation(doc, "property-location")
		self.assertEqual(representation.representation, PDF_MAP_REPRESENTATION_SNAPSHOT)
		self.assertEqual(representation.desired_source_hash, source_hash)
		self.assertIn(PUBLIC_MAP_SNAPSHOT_IMAGE_ENDPOINT, representation.snapshot_image_url)
		self.assertNotIn("/private/files/", representation.snapshot_image_url)
		self.assertEqual(representation.open_url, doc.get_property_map().external_url)
		self.assertEqual(file_doc.attached_to_name, doc.name)

	def test_current_child_snapshot_uses_public_endpoint_representation(self):
		doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Map",
					"title": "Entrance map",
					"custom_map_embed_url": "https://www.google.com/maps/d/embed?mid=child-ready&ehbc=2E312F",
				}
			]
		)
		row = doc.instruction_blocks[0]
		source_hash, _ = self._set_ready_block_snapshot(doc, row)
		representation = build_pdf_map_representation(doc, "block", row.name)
		self.assertEqual(representation.representation, PDF_MAP_REPRESENTATION_SNAPSHOT)
		self.assertEqual(representation.desired_source_hash, source_hash)
		self.assertIn(PUBLIC_MAP_SNAPSHOT_IMAGE_ENDPOINT, representation.snapshot_image_url)
		self.assertNotIn("/private/files/", representation.snapshot_image_url)

	def test_pending_custom_map_uses_qr_representation(self):
		doc = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=pending-parent")
		doc.custom_map_snapshot_status = "Pending"
		representation = build_pdf_map_representation(doc, "property-location")
		self.assertEqual(representation.representation, PDF_MAP_REPRESENTATION_QR)
		self.assertEqual(representation.reason_code, "pending")

	def test_ready_stale_hash_uses_qr_representation(self):
		doc = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=stale-parent")
		self._set_ready_parent_snapshot(doc)
		doc.custom_map_snapshot_source_hash = "stale-hash"
		representation = build_pdf_map_representation(doc, "property-location")
		self.assertEqual(representation.representation, PDF_MAP_REPRESENTATION_QR)
		self.assertEqual(representation.reason_code, "stale-hash")

	def test_ready_foreign_file_uses_qr_representation(self):
		first = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=first-file")
		second = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=second-file")
		_, first_file = self._set_ready_parent_snapshot(first)
		second.custom_map_snapshot = first_file.file_url
		second.custom_map_snapshot_status = "Ready"
		second.custom_map_snapshot_source_hash = build_map_source_hash(
			second.custom_map_embed_url, second.get_property_map().embed_kind
		)
		representation = build_pdf_map_representation(second, "property-location")
		self.assertEqual(representation.representation, PDF_MAP_REPRESENTATION_QR)
		self.assertEqual(representation.reason_code, "wrong-owner")

	def test_no_custom_map_representation_is_none(self):
		doc = self.make_instruction(custom_map_embed_url="")
		representation = build_pdf_map_representation(doc, "property-location")
		self.assertEqual(representation.representation, PDF_MAP_REPRESENTATION_NONE)
		self.assertFalse(representation.custom_map)

	def test_no_custom_map_representation_stays_none_even_with_google_maps_url(self):
		doc = self.make_instruction(
			custom_map_embed_url="",
			google_maps_url="https://www.google.com/maps/place/221B+Baker+Street",
		)
		property_map = doc.get_property_map()
		self.assertFalse(property_map.embed_url)
		representation = build_pdf_map_representation(doc, "property-location")
		self.assertEqual(representation.representation, PDF_MAP_REPRESENTATION_NONE)
		self.assertFalse(representation.custom_map)
		self.assertEqual(representation.reason_code, "not-custom")
		self.assertEqual(representation.open_url, property_map.external_url or "")

	def test_public_parent_snapshot_endpoint_returns_png(self):
		doc = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=endpoint-parent")
		source_hash, _ = self._set_ready_parent_snapshot(doc)
		self._reset_response()
		public_map_snapshot_image(doc.name, "property-location", source_hash)
		self.assertEqual(frappe.response["type"], "binary")
		self.assertTrue(frappe.response["filecontent"].startswith(b"\x89PNG\r\n\x1a\n"))
		self.assertEqual(frappe.local.response_headers.get("Content-Type"), "image/png")
		self.assertEqual(frappe.local.response_headers.get("X-Content-Type-Options"), "nosniff")
		self.assertEqual(frappe.local.response_headers.get("ETag"), source_hash)

	def test_public_child_snapshot_endpoint_returns_png(self):
		doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Map",
					"title": "Door map",
					"custom_map_embed_url": "https://www.google.com/maps/embed?pb=endpoint-child",
				}
			]
		)
		row = doc.instruction_blocks[0]
		source_hash, _ = self._set_ready_block_snapshot(doc, row)
		self._reset_response()
		public_map_snapshot_image(doc.name, "block", source_hash, row.name)
		self.assertEqual(frappe.response["type"], "binary")
		self.assertTrue(frappe.response["filecontent"].startswith(b"\x89PNG\r\n\x1a\n"))

	def test_public_snapshot_endpoint_rejects_wrong_hash_generically(self):
		doc = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=endpoint-wrong-hash")
		self._set_ready_parent_snapshot(doc)
		self._reset_response()
		with self.assertRaises(frappe.DoesNotExistError):
			public_map_snapshot_image(doc.name, "property-location", "wrong-hash")

	def test_public_snapshot_endpoint_rejects_unpublished_instruction(self):
		doc = self.make_instruction(
			custom_map_embed_url="https://www.google.com/maps/embed?pb=endpoint-unpublished",
			published=0,
		)
		source_hash, _ = self._set_ready_parent_snapshot(doc)
		self._reset_response()
		with self.assertRaises(frappe.DoesNotExistError):
			public_map_snapshot_image(doc.name, "property-location", source_hash)
