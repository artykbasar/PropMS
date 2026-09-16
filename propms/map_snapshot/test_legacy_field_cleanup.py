from __future__ import annotations

from unittest.mock import call, patch

import frappe
from frappe.tests.utils import FrappeTestCase

from propms.map_snapshot.legacy_field_cleanup import (
	BLOCK_CANONICAL,
	BLOCK_DOCTYPE,
	BLOCK_LEGACY,
	BLOCK_TABLE,
	CANONICAL_FIELD_NAME,
	COPY_LEGACY,
	LEGACY_FIELD_NAME,
	SAFE_CANONICAL,
	LegacyFieldRemovalAudit,
	LegacyFieldRemovalCandidate,
	audit_legacy_field_removal,
	classify_legacy_field_row,
	migrate_and_drop_legacy_field,
	preflight_legacy_field_removal,
)


class TestLegacyFieldCleanup(FrappeTestCase):
	def test_valid_canonical_is_authoritative_even_when_legacy_conflicts(self):
		candidate = classify_legacy_field_row(
			name="ROW-1",
			parent="PI-1",
			canonical_raw="https://www.google.com/maps/d/embed?mid=canonical",
			legacy_raw='<iframe src="https://www.google.com/maps/embed?pb=legacy"></iframe>',
		)
		self.assertEqual(candidate.classification, SAFE_CANONICAL)
		self.assertEqual(candidate.canonical_url, "https://www.google.com/maps/d/embed?mid=canonical")
		self.assertFalse(candidate.legacy_url)

	def test_valid_canonical_is_authoritative_even_when_legacy_is_invalid(self):
		candidate = classify_legacy_field_row(
			name="ROW-1",
			parent="PI-1",
			canonical_raw="https://www.google.com/maps/embed?pb=canonical",
			legacy_raw='<iframe src="https://evil.example/maps/embed?pb=legacy"></iframe>',
		)
		self.assertEqual(candidate.classification, SAFE_CANONICAL)

	def test_legacy_only_valid_row_is_copy_candidate(self):
		candidate = classify_legacy_field_row(
			name="ROW-1",
			parent="PI-1",
			canonical_raw="",
			legacy_raw='<iframe src="https://www.google.com/maps/embed?pb=legacy"></iframe>',
		)
		self.assertEqual(candidate.classification, COPY_LEGACY)
		self.assertEqual(candidate.legacy_url, "https://www.google.com/maps/embed?pb=legacy")

	def test_legacy_only_invalid_row_blocks_removal(self):
		candidate = classify_legacy_field_row(
			name="ROW-1",
			parent="PI-1",
			canonical_raw="",
			legacy_raw='<iframe src="https://evil.example/maps/embed?pb=legacy"></iframe>',
		)
		self.assertEqual(candidate.classification, BLOCK_LEGACY)

	def test_invalid_canonical_blocks_even_when_legacy_is_valid(self):
		candidate = classify_legacy_field_row(
			name="ROW-1",
			parent="PI-1",
			canonical_raw="https://evil.example/maps/embed?pb=canonical",
			legacy_raw='<iframe src="https://www.google.com/maps/embed?pb=legacy"></iframe>',
		)
		self.assertEqual(candidate.classification, BLOCK_CANONICAL)

	def test_preflight_allows_valid_legacy_only_rows_when_canonical_column_is_not_yet_present(self):
		with patch(
			"propms.map_snapshot.legacy_field_cleanup.frappe.db.table_exists",
			return_value=True,
		), patch(
			"propms.map_snapshot.legacy_field_cleanup.frappe.db.has_column",
			side_effect=lambda _doctype, fieldname: fieldname == LEGACY_FIELD_NAME,
		), patch(
			"propms.map_snapshot.legacy_field_cleanup._load_legacy_rows",
			return_value=[
				{
					"name": "ROW-1",
					"parent": "PI-1",
					CANONICAL_FIELD_NAME: "",
					LEGACY_FIELD_NAME: '<iframe src="https://www.google.com/maps/embed?pb=legacy"></iframe>',
				}
			],
		):
			result = preflight_legacy_field_removal()
		self.assertEqual(result["copy_count"], 1)
		self.assertEqual(result["blocker_count"], 0)
		self.assertFalse(result["canonical_column_exists"])

	def test_preflight_blocks_before_model_sync_when_unresolved_row_exists(self):
		blocked = LegacyFieldRemovalAudit(
			True,
			True,
			True,
			(LegacyFieldRemovalCandidate("ROW-1", "PI-1", BLOCK_LEGACY),),
		)
		with patch(
			"propms.map_snapshot.legacy_field_cleanup.audit_legacy_field_removal",
			return_value=blocked,
		), self.assertRaises(frappe.ValidationError):
			preflight_legacy_field_removal()

	def test_audit_skips_missing_table_without_querying_columns(self):
		with patch(
			"propms.map_snapshot.legacy_field_cleanup.frappe.db.table_exists",
			return_value=False,
		), patch(
			"propms.map_snapshot.legacy_field_cleanup.frappe.db.has_column"
		) as has_column_mock, patch(
			"propms.map_snapshot.legacy_field_cleanup.frappe.db.sql"
		) as sql_mock:
			audit = audit_legacy_field_removal()
		self.assertFalse(audit.table_exists)
		has_column_mock.assert_not_called()
		sql_mock.assert_not_called()

	def test_audit_skips_when_legacy_column_already_absent(self):
		with patch(
			"propms.map_snapshot.legacy_field_cleanup.frappe.db.table_exists",
			return_value=True,
		), patch(
			"propms.map_snapshot.legacy_field_cleanup.frappe.db.has_column",
			side_effect=lambda _doctype, fieldname: fieldname == CANONICAL_FIELD_NAME,
		), patch(
			"propms.map_snapshot.legacy_field_cleanup.frappe.db.sql"
		) as sql_mock:
			audit = audit_legacy_field_removal()
		self.assertTrue(audit.table_exists)
		self.assertFalse(audit.legacy_column_exists)
		self.assertTrue(audit.canonical_column_exists)
		sql_mock.assert_not_called()

	def test_drop_blocks_before_writes_when_any_row_is_unresolved(self):
		blocked = LegacyFieldRemovalAudit(
			True,
			True,
			True,
			(
				LegacyFieldRemovalCandidate("ROW-1", "PI-1", COPY_LEGACY, legacy_url="https://www.google.com/maps/embed?pb=legacy"),
				LegacyFieldRemovalCandidate("ROW-2", "PI-1", BLOCK_CANONICAL),
			),
		)
		with patch(
			"propms.map_snapshot.legacy_field_cleanup.audit_legacy_field_removal",
			return_value=blocked,
		), patch(
			"propms.map_snapshot.legacy_field_cleanup.frappe.db.set_value"
		) as set_value_mock, patch(
			"propms.map_snapshot.legacy_field_cleanup.frappe.db.sql_ddl"
		) as ddl_mock, self.assertRaises(frappe.ValidationError):
			migrate_and_drop_legacy_field()
		set_value_mock.assert_not_called()
		ddl_mock.assert_not_called()

	def test_drop_requires_canonical_column_after_model_sync(self):
		missing_canonical = LegacyFieldRemovalAudit(True, True, False)
		with patch(
			"propms.map_snapshot.legacy_field_cleanup.audit_legacy_field_removal",
			return_value=missing_canonical,
		), patch(
			"propms.map_snapshot.legacy_field_cleanup.frappe.db.sql_ddl"
		) as ddl_mock, self.assertRaises(frappe.ValidationError):
			migrate_and_drop_legacy_field()
		ddl_mock.assert_not_called()

	def test_drop_copies_legacy_only_rows_then_drops_only_legacy_column(self):
		initial = LegacyFieldRemovalAudit(
			True,
			True,
			True,
			(
				LegacyFieldRemovalCandidate(
					"ROW-1",
					"PI-1",
					COPY_LEGACY,
					legacy_url="https://www.google.com/maps/embed?pb=legacy",
				),
				LegacyFieldRemovalCandidate(
					"ROW-2",
					"PI-2",
					SAFE_CANONICAL,
					canonical_url="https://www.google.com/maps/d/embed?mid=canonical",
				),
			),
		)
		final = LegacyFieldRemovalAudit(
			True,
			True,
			True,
			(
				LegacyFieldRemovalCandidate(
					"ROW-1",
					"PI-1",
					SAFE_CANONICAL,
					canonical_url="https://www.google.com/maps/embed?pb=legacy",
				),
				LegacyFieldRemovalCandidate(
					"ROW-2",
					"PI-2",
					SAFE_CANONICAL,
					canonical_url="https://www.google.com/maps/d/embed?mid=canonical",
				),
			),
		)
		with patch(
			"propms.map_snapshot.legacy_field_cleanup.audit_legacy_field_removal",
			side_effect=[initial, final],
		), patch(
			"propms.map_snapshot.legacy_field_cleanup.frappe.db.set_value"
		) as set_value_mock, patch(
			"propms.map_snapshot.legacy_field_cleanup.frappe.db.sql_ddl"
		) as ddl_mock:
			result = migrate_and_drop_legacy_field()
		set_value_mock.assert_called_once_with(
			BLOCK_DOCTYPE,
			"ROW-1",
			CANONICAL_FIELD_NAME,
			"https://www.google.com/maps/embed?pb=legacy",
			update_modified=False,
		)
		ddl_mock.assert_called_once_with(f"alter table {BLOCK_TABLE} drop column `{LEGACY_FIELD_NAME}`")
		self.assertEqual(result["updated_count"], 1)
		self.assertTrue(result["dropped"])

	def test_hard_precondition_blocks_drop_if_copy_work_remains_after_write(self):
		copy_candidate = LegacyFieldRemovalCandidate(
			"ROW-1",
			"PI-1",
			COPY_LEGACY,
			legacy_url="https://www.google.com/maps/embed?pb=legacy",
		)
		initial = LegacyFieldRemovalAudit(True, True, True, (copy_candidate,))
		still_pending = LegacyFieldRemovalAudit(True, True, True, (copy_candidate,))
		with patch(
			"propms.map_snapshot.legacy_field_cleanup.audit_legacy_field_removal",
			side_effect=[initial, still_pending],
		), patch(
			"propms.map_snapshot.legacy_field_cleanup.frappe.db.set_value"
		) as set_value_mock, patch(
			"propms.map_snapshot.legacy_field_cleanup.frappe.db.sql_ddl"
		) as ddl_mock, self.assertRaises(frappe.ValidationError):
			migrate_and_drop_legacy_field()
		set_value_mock.assert_called_once()
		ddl_mock.assert_not_called()

	def test_second_drop_execution_is_an_idempotent_noop(self):
		already_removed = LegacyFieldRemovalAudit(True, False, True)
		with patch(
			"propms.map_snapshot.legacy_field_cleanup.audit_legacy_field_removal",
			return_value=already_removed,
		), patch(
			"propms.map_snapshot.legacy_field_cleanup.frappe.db.set_value"
		) as set_value_mock, patch(
			"propms.map_snapshot.legacy_field_cleanup.frappe.db.sql_ddl"
		) as ddl_mock:
			result = migrate_and_drop_legacy_field()
		self.assertFalse(result["dropped"])
		self.assertEqual(result["updated_count"], 0)
		set_value_mock.assert_not_called()
		ddl_mock.assert_not_called()
