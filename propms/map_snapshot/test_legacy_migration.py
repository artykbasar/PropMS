from __future__ import annotations

from unittest.mock import patch

import frappe
from frappe.tests.utils import FrappeTestCase

from propms.map_snapshot.legacy_migration import (
	CANONICAL_FIELD_NAME,
	LEGACY_FIELD_NAME,
	apply_legacy_map_migration_plan,
	audit_legacy_map_records,
	enqueue_pending_migrated_map_snapshots,
	migrate_google_maps_embed_html_to_custom_map_embed_url,
	plan_legacy_map_migration,
)
from propms.patches.v1_0.drop_obsolete_property_instruction_map_columns import (
	OBSOLETE_PROPERTY_MAP_COLUMNS,
	PROPERTY_INSTRUCTION_DOCTYPE,
	PROPERTY_INSTRUCTION_TABLE,
	execute as drop_obsolete_property_instruction_map_columns,
)
from propms.property_management_solution.doctype.property_instruction.test_property_instruction import (
	PropertyInstructionTestMixin,
)


class TestLegacyMapMigration(PropertyInstructionTestMixin, FrappeTestCase):
	def _require_active_legacy_field(self):
		if not frappe.get_meta("Property Instruction Block").has_field(LEGACY_FIELD_NAME):
			self.skipTest("historical legacy-field integration test requires the pre-Release-3C2 schema")

	def _current_instruction_cursor(self):
		return frappe.db.get_value("Property Instruction", {}, "name", order_by="name desc")

	def _find_candidate(self, audit_result, *, row_name):
		for candidate in audit_result["candidates"]:
			if candidate["doctype"] == "Property Instruction Block" and candidate["row_name"] == row_name:
				return candidate
		self.fail(f"Could not find migration candidate for row {row_name}")

	def _set_block_snapshot_state(
		self,
		row,
		*,
		snapshot="/private/files/existing-map.png",
		status="Ready",
		source_hash="old-source-hash",
		error_log="ERR-LEGACY",
	):
		frappe.db.set_value(
			"Property Instruction Block",
			row.name,
			{
				"custom_map_snapshot": snapshot,
				"custom_map_snapshot_status": status,
				"custom_map_snapshot_source_hash": source_hash,
				"custom_map_snapshot_error_log": error_log,
			},
			update_modified=False,
		)

	def test_audit_classifies_legacy_only_valid_block(self):
		self._require_active_legacy_field()
		doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Map",
					"title": "Legacy map",
					LEGACY_FIELD_NAME: '<iframe src="https://www.google.com/maps/embed?pb=legacy-only"></iframe>',
				},
			]
		)
		candidate = self._find_candidate(audit_legacy_map_records(), row_name=doc.instruction_blocks[0].name)
		self.assertEqual(candidate["classification"], "LEGACY_ONLY_VALID")
		self.assertEqual(candidate["canonical_url"], "https://www.google.com/maps/embed?pb=legacy-only")

	def test_audit_classifies_equivalent_legacy_and_canonical_values(self):
		self._require_active_legacy_field()
		doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Map",
					"title": "Equivalent map",
					CANONICAL_FIELD_NAME: "https://www.google.com/maps/embed?pb=same",
					LEGACY_FIELD_NAME: '<iframe src="https://www.google.com/maps/embed?pb=same"></iframe>',
				},
			]
		)
		candidate = self._find_candidate(audit_legacy_map_records(), row_name=doc.instruction_blocks[0].name)
		self.assertEqual(candidate["classification"], "BOTH_EQUIVALENT")

	def test_audit_classifies_conflicting_legacy_and_canonical_values(self):
		self._require_active_legacy_field()
		doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Map",
					"title": "Conflict map",
					CANONICAL_FIELD_NAME: "https://www.google.com/maps/embed?pb=canonical",
					LEGACY_FIELD_NAME: '<iframe src="https://www.google.com/maps/embed?pb=legacy"></iframe>',
				},
			]
		)
		candidate = self._find_candidate(audit_legacy_map_records(), row_name=doc.instruction_blocks[0].name)
		self.assertEqual(candidate["classification"], "BOTH_CONFLICT")

	def test_audit_classifies_invalid_legacy_variants(self):
		self._require_active_legacy_field()
		cases = [
			(
				"LEGACY_MULTIPLE_IFRAMES",
				'<iframe src="https://www.google.com/maps/embed?pb=one"></iframe><iframe src="https://www.google.com/maps/embed?pb=two"></iframe>',
			),
			(
				"LEGACY_SRCDOC",
				'<iframe srcdoc="<p>bad</p>" src="https://www.google.com/maps/embed?pb=one"></iframe>',
			),
			(
				"LEGACY_UNTRUSTED_HOST",
				'<iframe src="https://evil.example/maps/embed?pb=one"></iframe>',
			),
		]
		for expected, legacy_html in cases:
			doc = self.make_instruction(
				instruction_blocks=[
					{
						"section": "Finding the Property",
						"block_type": "Map",
						"title": expected,
						LEGACY_FIELD_NAME: legacy_html,
					},
				]
			)
			candidate = self._find_candidate(audit_legacy_map_records(), row_name=doc.instruction_blocks[0].name)
			self.assertEqual(candidate["classification"], expected)

	def test_invalid_legacy_block_is_preserved_and_runtime_safe(self):
		self._require_active_legacy_field()
		doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Map",
					"title": "Invalid legacy map",
					LEGACY_FIELD_NAME: '<iframe src="https://evil.example/maps/embed?pb=invalid"></iframe>',
				},
			]
		)
		row = doc.instruction_blocks[0]
		self.assertFalse(doc.get_block_map_data(row).embed_url)
		self.assertEqual(doc.get_instruction_block_maps(), {})
		self.assertEqual(row.google_maps_embed_html, '<iframe src="https://evil.example/maps/embed?pb=invalid"></iframe>')

	def test_plan_hash_is_deterministic(self):
		self._require_active_legacy_field()
		doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Map",
					"title": "Plan hash map",
					LEGACY_FIELD_NAME: '<iframe src="https://www.google.com/maps/embed?pb=plan"></iframe>',
				},
			]
		)
		first_plan = plan_legacy_map_migration(audit_legacy_map_records())
		second_plan = plan_legacy_map_migration(audit_legacy_map_records())
		self.assertEqual(first_plan.plan_hash, second_plan.plan_hash)
		self.assertEqual(first_plan.to_dict(), second_plan.to_dict())
		self.assertTrue(any(candidate.row_name == doc.instruction_blocks[0].name for candidate in first_plan.candidates))

	def test_apply_migration_updates_canonical_field_and_preserves_legacy_html(self):
		self._require_active_legacy_field()
		doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Map",
					"title": "Migrated map",
					LEGACY_FIELD_NAME: '<iframe src="https://www.google.com/maps/embed?pb=migrate"></iframe>',
				},
			]
		)
		row = doc.instruction_blocks[0]
		self._set_block_snapshot_state(row)
		plan = plan_legacy_map_migration(audit_legacy_map_records())
		with patch("propms.map_snapshot.legacy_migration.queue_snapshot_generation") as queue_mock:
			result = apply_legacy_map_migration_plan(plan)
		queue_mock.assert_not_called()
		self.assertEqual(result["updated_count"], 1)
		reloaded = frappe.get_doc("Property Instruction", doc.name).instruction_blocks[0]
		self.assertEqual(reloaded.custom_map_embed_url, "https://www.google.com/maps/embed?pb=migrate")
		self.assertEqual(
			reloaded.google_maps_embed_html,
			'<iframe src="https://www.google.com/maps/embed?pb=migrate"></iframe>',
		)
		self.assertEqual(reloaded.custom_map_snapshot_status, "Pending")
		self.assertEqual(reloaded.custom_map_snapshot, "/private/files/existing-map.png")
		self.assertEqual(reloaded.custom_map_snapshot_source_hash, "old-source-hash")
		self.assertEqual(reloaded.custom_map_snapshot_error_log, "")

	def test_apply_migration_tolerates_missing_snapshot_columns(self):
		self._require_active_legacy_field()
		doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Map",
					"title": "Old schema map",
					LEGACY_FIELD_NAME: '<iframe src="https://www.google.com/maps/embed?pb=old-schema"></iframe>',
				},
			]
		)
		row = doc.instruction_blocks[0]
		plan = plan_legacy_map_migration(audit_legacy_map_records())
		with patch(
			"propms.map_snapshot.legacy_migration._get_existing_fields",
			return_value={CANONICAL_FIELD_NAME},
		), patch("propms.map_snapshot.legacy_migration.queue_snapshot_generation") as queue_mock:
			result = apply_legacy_map_migration_plan(plan)
		queue_mock.assert_not_called()
		self.assertEqual(result["updated_count"], 1)
		reloaded = frappe.get_doc("Property Instruction", doc.name).instruction_blocks[0]
		self.assertEqual(reloaded.custom_map_embed_url, "https://www.google.com/maps/embed?pb=old-schema")
		self.assertEqual(
			reloaded.google_maps_embed_html,
			'<iframe src="https://www.google.com/maps/embed?pb=old-schema"></iframe>',
		)

	def test_apply_migration_skips_changed_record(self):
		self._require_active_legacy_field()
		doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Map",
					"title": "Changed map",
					LEGACY_FIELD_NAME: '<iframe src="https://www.google.com/maps/embed?pb=changed"></iframe>',
				},
			]
		)
		row = doc.instruction_blocks[0]
		plan = plan_legacy_map_migration(audit_legacy_map_records())
		frappe.db.set_value(
			"Property Instruction Block",
			row.name,
			CANONICAL_FIELD_NAME,
			"https://www.google.com/maps/embed?pb=new-value",
			update_modified=False,
		)
		result = apply_legacy_map_migration_plan(plan)
		self.assertEqual(result["updated_count"], 0)
		self.assertEqual(result["skipped"][0]["reason"], "changed-after-plan")

	def test_migration_rerun_is_idempotent(self):
		self._require_active_legacy_field()
		self.make_instruction(
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Map",
					"title": "Idempotent map",
					LEGACY_FIELD_NAME: '<iframe src="https://www.google.com/maps/embed?pb=idempotent"></iframe>',
				},
			]
		)
		first = migrate_google_maps_embed_html_to_custom_map_embed_url()
		second = migrate_google_maps_embed_html_to_custom_map_embed_url()
		self.assertEqual(first["result"]["updated_count"], 1)
		self.assertEqual(second["plan"]["counts"]["eligible"], 0)
		self.assertEqual(second["result"]["updated_count"], 0)

	def test_backfill_dry_run_does_not_queue_jobs(self):
		cursor = self._current_instruction_cursor()
		doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Map",
					"title": "Dry-run map",
					CANONICAL_FIELD_NAME: "https://www.google.com/maps/embed?pb=dry-run",
				},
			]
		)
		row = doc.instruction_blocks[0]
		frappe.db.set_value("Property Instruction Block", row.name, "custom_map_snapshot_status", "Pending", update_modified=False)
		with patch("propms.map_snapshot.legacy_migration.queue_snapshot_generation") as queue_mock:
			result = enqueue_pending_migrated_map_snapshots(batch_size=10, cursor=cursor, dry_run=True)
		queue_mock.assert_not_called()
		self.assertEqual(result["queued_count"], 0)
		self.assertTrue(any(detail["property_instruction"] == doc.name for detail in result["details"]))

	def test_backfill_queues_one_job_per_instruction_without_raw_urls(self):
		cursor = self._current_instruction_cursor()
		doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Map",
					"title": "Queue child 1",
					CANONICAL_FIELD_NAME: "https://www.google.com/maps/embed?pb=queue-1",
				},
				{
					"section": "Finding the Property",
					"block_type": "Map",
					"title": "Queue child 2",
					CANONICAL_FIELD_NAME: "https://www.google.com/maps/d/embed?mid=queue-two",
				},
			]
		)
		row_names = {row.name for row in doc.instruction_blocks}
		for row in doc.instruction_blocks:
			frappe.db.set_value("Property Instruction Block", row.name, "custom_map_snapshot_status", "Pending", update_modified=False)
		with patch(
			"propms.map_snapshot.legacy_migration.queue_snapshot_generation",
			return_value={"queued": True, "job_name": "job-123", "affected_map_count": 2},
		) as queue_mock, patch("propms.map_snapshot.legacy_migration.frappe.db.commit") as commit_mock:
			result = enqueue_pending_migrated_map_snapshots(batch_size=10, cursor=cursor, dry_run=False)
		self.assertEqual(result["queued_count"], 1)
		self.assertEqual(result["job_names"], ["job-123"])
		self.assertEqual(queue_mock.call_args.args[0], doc.name)
		self.assertEqual(queue_mock.call_args.kwargs["target_row_names"], row_names)
		self.assertNotIn("https://www.google.com/maps", frappe.as_json(queue_mock.call_args))
		commit_mock.assert_called_once()

	def test_backfill_skips_unpublished_and_ready_records(self):
		cursor = self._current_instruction_cursor()
		unpublished = self.make_instruction(
			published=0,
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Map",
					"title": "Unpublished pending",
					CANONICAL_FIELD_NAME: "https://www.google.com/maps/embed?pb=unpublished",
				},
			]
		)
		ready_doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Map",
					"title": "Ready child",
					CANONICAL_FIELD_NAME: "https://www.google.com/maps/embed?pb=ready",
				},
			]
		)
		frappe.db.set_value(
			"Property Instruction Block",
			unpublished.instruction_blocks[0].name,
			"custom_map_snapshot_status",
			"Pending",
			update_modified=False,
		)
		frappe.db.set_value(
			"Property Instruction Block",
			ready_doc.instruction_blocks[0].name,
			"custom_map_snapshot_status",
			"Ready",
			update_modified=False,
		)
		with patch("propms.map_snapshot.legacy_migration.queue_snapshot_generation") as queue_mock:
			result = enqueue_pending_migrated_map_snapshots(batch_size=20, cursor=cursor, dry_run=False)
		queue_mock.assert_not_called()
		self.assertEqual(result["queued_count"], 0)

	def test_backfill_cursor_and_batch_size_are_bounded(self):
		cursor = self._current_instruction_cursor()
		first = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Map",
					"title": "Cursor first",
					CANONICAL_FIELD_NAME: "https://www.google.com/maps/embed?pb=cursor-first",
				},
			]
		)
		second = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Map",
					"title": "Cursor second",
					CANONICAL_FIELD_NAME: "https://www.google.com/maps/embed?pb=cursor-second",
				},
			]
		)
		for doc in (first, second):
			frappe.db.set_value(
				"Property Instruction Block",
				doc.instruction_blocks[0].name,
				"custom_map_snapshot_status",
				"Pending",
				update_modified=False,
			)
		result = enqueue_pending_migrated_map_snapshots(batch_size=1, cursor=cursor, dry_run=True)
		self.assertEqual(result["inspected_count"], 1)
		next_cursor = result["next_cursor"]
		follow_up = enqueue_pending_migrated_map_snapshots(batch_size=1000, cursor=next_cursor, dry_run=True)
		self.assertLessEqual(follow_up["batch_size"], 50)

	def test_drop_obsolete_property_instruction_map_columns_targets_only_allowlist(self):
		self.assertEqual(
			OBSOLETE_PROPERTY_MAP_COLUMNS,
			(
				"google_maps_place_id",
				"map_search_query",
				"map_zoom",
				"map_type",
				"show_embedded_map",
			),
		)
		self.assertEqual(PROPERTY_INSTRUCTION_DOCTYPE, "Property Instruction")
		self.assertEqual(PROPERTY_INSTRUCTION_TABLE, "`tabProperty Instruction`")

	def test_drop_obsolete_property_instruction_map_columns_skips_missing_table(self):
		with patch("propms.patches.v1_0.drop_obsolete_property_instruction_map_columns.frappe.db.table_exists", return_value=False), patch(
			"propms.patches.v1_0.drop_obsolete_property_instruction_map_columns.frappe.db.has_column"
		) as has_column_mock, patch(
			"propms.patches.v1_0.drop_obsolete_property_instruction_map_columns.frappe.db.sql_ddl"
		) as sql_ddl_mock:
			drop_obsolete_property_instruction_map_columns()
		has_column_mock.assert_not_called()
		sql_ddl_mock.assert_not_called()

	def test_drop_obsolete_property_instruction_map_columns_skips_absent_columns(self):
		with patch("propms.patches.v1_0.drop_obsolete_property_instruction_map_columns.frappe.db.table_exists", return_value=True), patch(
			"propms.patches.v1_0.drop_obsolete_property_instruction_map_columns.frappe.db.has_column",
			return_value=False,
		) as has_column_mock, patch(
			"propms.patches.v1_0.drop_obsolete_property_instruction_map_columns.frappe.db.sql_ddl"
		) as sql_ddl_mock:
			drop_obsolete_property_instruction_map_columns()
		self.assertEqual(has_column_mock.call_count, len(OBSOLETE_PROPERTY_MAP_COLUMNS))
		sql_ddl_mock.assert_not_called()

	def test_drop_obsolete_property_instruction_map_columns_drops_only_present_columns(self):
		present_columns = {"map_search_query", "map_type"}

		def has_column(_doctype, column):
			return column in present_columns

		with patch("propms.patches.v1_0.drop_obsolete_property_instruction_map_columns.frappe.db.table_exists", return_value=True), patch(
			"propms.patches.v1_0.drop_obsolete_property_instruction_map_columns.frappe.db.has_column",
			side_effect=has_column,
		), patch(
			"propms.patches.v1_0.drop_obsolete_property_instruction_map_columns.frappe.db.sql_ddl"
		) as sql_ddl_mock:
			drop_obsolete_property_instruction_map_columns()

		self.assertEqual(
			[call.args[0] for call in sql_ddl_mock.call_args_list],
			[
				f"alter table {PROPERTY_INSTRUCTION_TABLE} drop column `map_search_query`",
				f"alter table {PROPERTY_INSTRUCTION_TABLE} drop column `map_type`",
			],
		)
