from __future__ import annotations

import frappe
from frappe.tests.utils import FrappeTestCase

from propms.map_snapshot.manifest import (
	SNAPSHOT_STATUS_FAILED,
	SNAPSHOT_STATUS_READY,
	build_manifest_entries,
	build_manifest_hash,
	serialize_manifest_entries,
)
from propms.property_management_solution.doctype.property_instruction.test_property_instruction import (
	PropertyInstructionTestMixin,
)


class TestMapSnapshotManifest(PropertyInstructionTestMixin, FrappeTestCase):
	def _attach_snapshot_file(self, doc, file_url="/private/files/snapshot.png"):
		return self.attach_private_file(doc.name, file_url.rsplit("/", 1)[-1])

	def test_parent_map_discovery_uses_identifier_only_manifest_entries(self):
		doc = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=parent-map")
		entries = build_manifest_entries(doc, force=True)
		self.assertEqual(entries[0].map_key, "property-location")
		self.assertIsNone(entries[0].row_name)
		self.assertNotIn("embed", frappe.as_json(serialize_manifest_entries(entries)))

	def test_child_map_discovery_uses_row_name(self):
		doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Map",
					"title": "Door map",
					"custom_map_embed_url": "https://www.google.com/maps/embed?pb=child-map",
				}
			]
		)
		entries = build_manifest_entries(doc, force=True)
		self.assertEqual(entries[0].map_key, "block")
		self.assertEqual(entries[0].row_name, doc.instruction_blocks[0].name)

	def test_matching_ready_snapshot_is_excluded(self):
		doc = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=ready-map")
		doc.custom_map_snapshot = "/private/files/current-map.png"
		doc.custom_map_snapshot_status = SNAPSHOT_STATUS_READY
		doc.custom_map_snapshot_source_hash = doc.custom_map_snapshot_source_hash = frappe.get_attr(
			"propms.map_snapshot.presentation.build_map_source_hash"
		)(doc.custom_map_embed_url, doc.get_property_map().embed_kind)
		self._attach_snapshot_file(doc, doc.custom_map_snapshot)
		entries = build_manifest_entries(doc)
		self.assertEqual(entries, [])

	def test_ready_snapshot_owned_by_another_instruction_is_not_current(self):
		first = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=owned-first")
		second = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=owned-second")
		second.custom_map_snapshot = "/private/files/current-map.png"
		second.custom_map_snapshot_status = SNAPSHOT_STATUS_READY
		second.custom_map_snapshot_source_hash = frappe.get_attr(
			"propms.map_snapshot.presentation.build_map_source_hash"
		)(second.custom_map_embed_url, second.get_property_map().embed_kind)
		self._attach_snapshot_file(first, second.custom_map_snapshot)
		entries = build_manifest_entries(second)
		self.assertEqual(len(entries), 1)

	def test_failed_snapshot_can_be_selected_for_retry(self):
		doc = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=failed-map")
		doc.custom_map_snapshot_status = SNAPSHOT_STATUS_FAILED
		entries = build_manifest_entries(doc, retry_failed_only=True)
		self.assertEqual(len(entries), 1)

	def test_manifest_hash_is_deterministic(self):
		doc = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=hash-map")
		first = build_manifest_entries(doc, force=True)
		second = build_manifest_entries(doc, force=True)
		self.assertEqual(build_manifest_hash(first), build_manifest_hash(second))
