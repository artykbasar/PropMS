from __future__ import annotations

import frappe
from frappe.tests.utils import FrappeTestCase

from propms.map_snapshot.error_logging import log_map_snapshot_failure
from propms.property_management_solution.doctype.property_instruction.test_property_instruction import (
	PropertyInstructionTestMixin,
)


class TestMapSnapshotErrorLogging(PropertyInstructionTestMixin, FrappeTestCase):
	def test_capture_failure_creates_error_log(self):
		doc = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=error-main")
		try:
			raise RuntimeError("capture failed")
		except RuntimeError as exc:
			error_log_name = log_map_snapshot_failure(
				property_instruction=doc.name,
				map_key="property-location",
				row_name=None,
				source_hash="hash-one",
				map_kind="google-maps",
				stage="capture",
				exception=exc,
			)
		self.to_delete.append(("Error Log", error_log_name))
		error_log = frappe.get_doc("Error Log", error_log_name)
		self.assertEqual(error_log.reference_doctype, "Property Instruction")
		self.assertEqual(error_log.reference_name, doc.name)
		self.assertIn("Map snapshot context", error_log.error)

	def test_identical_failure_is_deduplicated(self):
		doc = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=error-dedupe")
		try:
			raise RuntimeError("capture failed")
		except RuntimeError as exc:
			first = log_map_snapshot_failure(
				property_instruction=doc.name,
				map_key="property-location",
				row_name=None,
				source_hash="hash-two",
				map_kind="google-maps",
				stage="capture",
				exception=exc,
			)
		try:
			raise RuntimeError("capture failed")
		except RuntimeError as exc:
			second = log_map_snapshot_failure(
				property_instruction=doc.name,
				map_key="property-location",
				row_name=None,
				source_hash="hash-two",
				map_kind="google-maps",
				stage="capture",
				exception=exc,
			)
		self.to_delete.append(("Error Log", first))
		self.assertEqual(first, second)

	def test_capture_failure_sanitizes_data_urls_and_embed_urls(self):
		doc = self.make_instruction(custom_map_embed_url="https://www.google.com/maps/embed?pb=error-redact")
		sensitive_data_url = "data:text/html;charset=utf-8;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="
		try:
			raise RuntimeError(
				f"navigation failed for {sensitive_data_url} and https://www.google.com/maps/embed?pb=secret-map"
			)
		except RuntimeError as exc:
			error_log_name = log_map_snapshot_failure(
				property_instruction=doc.name,
				map_key="property-location",
				row_name=None,
				source_hash="hash-three",
				map_kind="google-maps",
				stage="capture",
				exception=exc,
			)
		self.to_delete.append(("Error Log", error_log_name))
		error_log = frappe.get_doc("Error Log", error_log_name)
		self.assertNotIn("data:text/html", error_log.error)
		self.assertNotIn("secret-map", error_log.error)
		self.assertNotIn("<script>", error_log.error)
		self.assertIn("<redacted-data-url>", error_log.error)
		self.assertIn("<redacted-url>", error_log.error)
