from __future__ import annotations

import uuid
from unittest.mock import patch

import frappe
from frappe.tests.utils import FrappeTestCase

from propms.map_snapshot.capture import (
	CAPTURE_ROUTE_PATH,
	build_internal_capture_host_resolver_rule,
	build_internal_capture_route_url,
	capture_map_png,
	get_internal_capture_base_url,
)
from propms.property_management_solution.doctype.property_instruction.test_property_instruction import (
	PropertyInstructionTestMixin,
)


class TestMapSnapshotCapture(PropertyInstructionTestMixin, FrappeTestCase):
	STANDARD_EMBED_URL = (
		"https://www.google.com/maps/embed?"
		"pb=!1m18!1m12!1m3!1d2468.359588489129!2d0.0987883!3d51.7813138!2m3!1f0!2f0!3f0!"
		"3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47d89bf71fc47d07%3A0x8c270aafbc40da2b!"
		"2sGodfrey%20House%2C%2093%20Edinburgh%20Gate%2C%20Harlow%20CM20%202UF!"
		"5e0!3m2!1sen!2suk!4v1785349658048!5m2!1sen!2suk"
	)
	MY_MAPS_EMBED_URL = "https://www.google.com/maps/d/embed?mid=1A1kCH3-hgmeHlANOAt-XJAm3t2ptm1U&ehbc=2E312F"

	def setUp(self):
		super().setUp()
		self.set_conf("propms_map_capture_internal_base_url", "http://127.0.0.1:8000")

	def test_internal_base_url_setting_is_required(self):
		self.set_conf("propms_map_capture_internal_base_url", None)
		with self.assertRaises(frappe.ValidationError):
			get_internal_capture_base_url()

	def test_invalid_internal_base_url_is_rejected(self):
		self.set_conf("propms_map_capture_internal_base_url", "https://user:pass@example.com")
		with self.assertRaises(frappe.ValidationError):
			get_internal_capture_base_url()

	def test_internal_base_url_path_is_rejected(self):
		self.set_conf("propms_map_capture_internal_base_url", "https://127.0.0.1:8000/internal_map_capture")
		with self.assertRaises(frappe.ValidationError):
			get_internal_capture_base_url()

	def test_external_internal_base_url_host_is_rejected(self):
		self.set_conf("propms_map_capture_internal_base_url", "https://example.com")
		with self.assertRaises(frappe.ValidationError):
			get_internal_capture_base_url()

	def test_explicit_allowed_internal_host_is_accepted(self):
		self.set_conf("propms_map_capture_internal_base_url", "https://capture.internal")
		self.set_conf("propms_map_capture_internal_allowed_hosts", "capture.internal")
		self.assertEqual(get_internal_capture_base_url(), "https://capture.internal")

	def test_capture_route_path_is_fixed(self):
		self.assertEqual(CAPTURE_ROUTE_PATH, "/internal_map_capture")

	def test_internal_capture_route_url_uses_target_site_hostname(self):
		self.assertEqual(
			build_internal_capture_route_url("http://127.0.0.1:8000", "development.localhost"),
			"http://development.localhost:8000/internal_map_capture",
		)

	def test_internal_capture_host_resolver_rule_maps_site_to_internal_host(self):
		self.assertEqual(
			build_internal_capture_host_resolver_rule("http://127.0.0.1:8000", "development.localhost"),
			"MAP development.localhost 127.0.0.1",
		)

	def test_internal_capture_host_resolver_rule_is_omitted_when_host_matches_site(self):
		self.assertIsNone(
			build_internal_capture_host_resolver_rule("http://development.localhost:8000", "development.localhost")
		)

	def test_source_hash_change_is_rejected_before_capture(self):
		doc = self.make_instruction(
			custom_map_embed_url=self.STANDARD_EMBED_URL
		)
		frappe.db.commit()
		with self.assertRaises(frappe.ValidationError):
			capture_map_png(doc.name, "property-location", expected_source_hash="stale")

	def test_capture_engine_returns_expected_standard_dimensions(self):
		doc = self.make_instruction(
			title=f"Standard Capture Fixture {uuid.uuid4().hex[:8]}",
			custom_map_embed_url=self.STANDARD_EMBED_URL
		)
		frappe.db.commit()
		result = capture_map_png(doc.name, "property-location")
		self.assertEqual(result.pixel_width, 2094)
		self.assertEqual(result.pixel_height, 1180)
		self.assertEqual(result.map_kind, "google-maps")
		self.assertLessEqual(result.stability_score, 3.0)

	def test_capture_engine_returns_expected_mymaps_dimensions(self):
		doc = self.make_instruction(
			title=f"My Maps Capture Fixture {uuid.uuid4().hex[:8]}",
			custom_map_embed_url=self.MY_MAPS_EMBED_URL
		)
		frappe.db.commit()
		result = capture_map_png(doc.name, "property-location")
		self.assertEqual(result.pixel_width, 2094)
		self.assertEqual(result.pixel_height, 1180)
		self.assertEqual(result.map_kind, "google-my-maps")
		self.assertLessEqual(result.stability_score, 3.0)

	def test_capture_cleanup_reports_page_and_socket_cleanup(self):
		doc = self.make_instruction(
			custom_map_embed_url=self.STANDARD_EMBED_URL
		)
		frappe.db.commit()
		result = capture_map_png(doc.name, "property-location")
		self.assertIn("page_closed", result.cleanup_diagnostics)
		self.assertIn("socket_disconnected", result.cleanup_diagnostics)
		self.assertIn("owned_launcher_pid", result.cleanup_diagnostics)
		self.assertIn("owned_processes_remaining", result.cleanup_diagnostics)
		self.assertIn("owned_defunct_processes", result.cleanup_diagnostics)
		self.assertTrue(result.cleanup_diagnostics.get("page_closed"))
		self.assertTrue(result.cleanup_diagnostics.get("socket_disconnected"))
		self.assertTrue(result.cleanup_diagnostics.get("generator_closed"))
		self.assertEqual(result.cleanup_diagnostics.get("owned_processes_remaining"), [])
