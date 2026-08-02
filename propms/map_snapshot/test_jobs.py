from __future__ import annotations

from unittest.mock import patch

import frappe
from frappe.tests.utils import FrappeTestCase
from rq.job import JobStatus

from propms.map_snapshot.jobs import (
	MAP_SNAPSHOT_QUEUE,
	MAP_SNAPSHOT_TIMEOUT,
	build_snapshot_job_id,
	capture_property_instruction_maps,
	queue_snapshot_generation,
)
from propms.map_snapshot.manifest import (
	MapSnapshotManifestEntry,
	SNAPSHOT_STATUS_FAILED,
	build_manifest_entries,
	build_manifest_hash,
)
from propms.property_management_solution.doctype.property_instruction.test_property_instruction import (
	PNG_BYTES,
	PropertyInstructionTestMixin,
)


class TestMapSnapshotJobs(PropertyInstructionTestMixin, FrappeTestCase):
	def test_queue_snapshot_generation_uses_long_queue(self):
		doc = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=queue-main")
		with patch("propms.map_snapshot.jobs.enqueue") as enqueue_mock:
			result = queue_snapshot_generation(doc.name, force=True)
		self.assertTrue(result["queued"])
		self.assertEqual(result["affected_map_count"], 1)
		self.assertEqual(enqueue_mock.call_args.kwargs["queue"], MAP_SNAPSHOT_QUEUE)
		self.assertEqual(enqueue_mock.call_args.kwargs["timeout"], MAP_SNAPSHOT_TIMEOUT)
		self.assertNotIn("https://www.google.com/maps", frappe.as_json(enqueue_mock.call_args.kwargs["entries"]))

	def test_retry_failed_snapshot_targets_failed_rows_only(self):
		doc = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=retry-main")
		doc.custom_map_snapshot_status = SNAPSHOT_STATUS_FAILED
		doc.save(ignore_permissions=True)
		with patch("propms.map_snapshot.jobs.enqueue") as enqueue_mock:
			result = queue_snapshot_generation(doc.name, retry_failed_only=True)
		self.assertTrue(result["queued"])
		self.assertEqual(result["affected_map_count"], 1)
		self.assertTrue(enqueue_mock.called)

	def test_force_queue_reuses_active_job_without_resetting_pending_state(self):
		doc = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=duplicate-active")
		manifest_hash = build_manifest_hash(build_manifest_entries(doc, force=True))
		job_id = build_snapshot_job_id(doc.name, manifest_hash)
		with patch("propms.map_snapshot.jobs.get_job_status", return_value=JobStatus.STARTED), patch(
			"propms.map_snapshot.jobs.enqueue"
		) as enqueue_mock:
			result = queue_snapshot_generation(doc.name, force=True)
		self.assertTrue(result["queued"])
		self.assertEqual(result["job_name"], job_id)
		self.assertEqual(result["affected_map_count"], 1)
		self.assertFalse(enqueue_mock.called)
		reloaded = frappe.get_doc("Property Instruction", doc.name)
		self.assertEqual(reloaded.custom_map_snapshot_status, "Pending")

	def test_stale_manifest_is_skipped(self):
		doc = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=stale-main")
		result = capture_property_instruction_maps(
			doc.name,
			"wrong-hash",
			[
				{
					"map_key": "property-location",
					"row_name": None,
					"map_kind": "google-maps",
					"expected_source_hash": "stale",
				}
			],
		)
		self.assertEqual(result["status"], "stale-manifest")

	def test_job_id_is_deterministic(self):
		self.assertEqual(
			build_snapshot_job_id("PI-00007", "abc123"),
			"propms-map-snapshot:PI-00007:abc123",
		)

	def test_capture_job_marks_ready_when_capture_succeeds(self):
		doc = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=job-ready")
		doc.custom_map_snapshot_status = "Pending"
		doc.save(ignore_permissions=True)
		expected_hash = doc.get("custom_map_snapshot_source_hash") or ""
		if not expected_hash:
			expected_hash = frappe.get_attr("propms.map_snapshot.presentation.build_map_source_hash")(
				doc.custom_map_embed_url,
				doc.get_property_map().embed_kind,
			)
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
			result = capture_property_instruction_maps(
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
		self.assertEqual(result["status"], "completed")
		self.assertEqual(result["entries"][0]["result"], "ready")
		self.assertEqual(result["entries"][0]["final_status"], "Ready")
		self.assertIn("cleanup_diagnostics", result["entries"][0])
