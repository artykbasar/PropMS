from __future__ import annotations

import frappe
from frappe.tests.utils import FrappeTestCase

from propms.map_snapshot.storage import (
	GENERATED_MAP_FILE_PREFIX,
	build_snapshot_filename,
	delete_generated_snapshot_file_if_owned,
	get_generated_snapshot_file,
	has_owned_generated_snapshot_file,
	is_owned_generated_snapshot_file,
	save_snapshot_png,
)
from propms.property_management_solution.doctype.property_instruction.test_property_instruction import (
	PNG_BYTES,
	PropertyInstructionTestMixin,
)


class TestMapSnapshotStorage(PropertyInstructionTestMixin, FrappeTestCase):
	def test_save_snapshot_png_creates_private_attached_file(self):
		doc = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=storage-main")
		file_doc = save_snapshot_png(
			property_instruction=doc.name,
			map_key="property-location",
			row_name=None,
			source_hash="abc123def456",
			png_bytes=PNG_BYTES,
		)
		self.to_delete.append(("File", file_doc.name))
		self.assertEqual(file_doc.attached_to_doctype, "Property Instruction")
		self.assertEqual(file_doc.attached_to_name, doc.name)
		self.assertEqual(file_doc.is_private, 1)
		self.assertTrue(file_doc.file_name.startswith(GENERATED_MAP_FILE_PREFIX))

	def test_owned_generated_file_can_be_deleted(self):
		doc = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=storage-delete")
		file_doc = save_snapshot_png(
			property_instruction=doc.name,
			map_key="property-location",
			row_name=None,
			source_hash="abc123delete",
			png_bytes=PNG_BYTES,
		)
		self.assertTrue(is_owned_generated_snapshot_file(file_doc, doc.name, file_doc.file_url))
		self.assertTrue(delete_generated_snapshot_file_if_owned(file_doc.file_url, doc.name))
		self.assertFalse(frappe.db.exists("File", file_doc.name))

	def test_non_generated_file_is_preserved(self):
		doc = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=storage-preserve")
		file_doc = self.attach_private_file(doc.name, "manual-upload.png")
		self.assertFalse(delete_generated_snapshot_file_if_owned(file_doc.file_url, doc.name))
		self.assertTrue(frappe.db.exists("File", file_doc.name))

	def test_identical_snapshot_content_creates_owned_attachment_for_each_instruction(self):
		first = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=shared-storage")
		second = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=shared-storage")
		first_file = save_snapshot_png(
			property_instruction=first.name,
			map_key="property-location",
			row_name=None,
			source_hash="abc123shared",
			png_bytes=PNG_BYTES,
		)
		second_file = save_snapshot_png(
			property_instruction=second.name,
			map_key="property-location",
			row_name=None,
			source_hash="abc123shared",
			png_bytes=PNG_BYTES,
		)
		self.assertTrue(has_owned_generated_snapshot_file(first_file.file_url, first.name))
		self.assertTrue(has_owned_generated_snapshot_file(second_file.file_url, second.name))
		self.assertEqual(get_generated_snapshot_file(second_file.file_url, second.name).attached_to_name, second.name)
		self.assertTrue(delete_generated_snapshot_file_if_owned(first_file.file_url, first.name))
		self.assertTrue(has_owned_generated_snapshot_file(second_file.file_url, second.name))

	def test_filename_includes_row_identifier_for_block_snapshots(self):
		filename = build_snapshot_filename("PI-00007", "block", "abc-row", "abc123def456")
		self.assertIn("block-abc-row", filename)
