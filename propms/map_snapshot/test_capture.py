from __future__ import annotations

import uuid
from unittest.mock import patch

import frappe
from frappe.tests.utils import FrappeTestCase

from propms.map_snapshot.capture import (
	MAX_CAPTURE_DOCUMENT_BYTES,
	build_capture_document_data_url,
	capture_map_png,
	render_capture_document_html,
)
from propms.map_snapshot.resolver import CaptureMapReference, resolve_capture_map
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

	def test_source_hash_change_is_rejected_before_capture(self):
		doc = self.make_instruction(
			custom_map_embed_url=self.STANDARD_EMBED_URL
		)
		frappe.db.commit()
		with self.assertRaises(frappe.ValidationError):
			capture_map_png(doc.name, "property-location", expected_source_hash="stale")

	def test_document_wrapper_escapes_title(self):
		doc = self.make_instruction(
			title='Direct </title><script>alert("x")</script> "quoted" <angle>',
			custom_map_embed_url=self.STANDARD_EMBED_URL,
		)
		resolved = resolve_capture_map(CaptureMapReference(property_instruction=doc.name, map_key="property-location"))
		html = render_capture_document_html(resolved)
		self.assertNotIn('title="Direct </title>', html)
		self.assertNotIn("</script>", html)
		self.assertNotIn("<script>", html)
		self.assertIn("&quot;quoted&quot;", html)
		self.assertIn('id="map-capture"', html)
		self.assertNotIn('title="Direct  "quoted"', html)

	def test_capture_wrapper_uses_absolute_geometry_without_transform(self):
		doc = self.make_instruction(
			title="Geometry wrapper",
			custom_map_embed_url=self.MY_MAPS_EMBED_URL,
		)
		resolved = resolve_capture_map(CaptureMapReference(property_instruction=doc.name, map_key="property-location"))
		html = render_capture_document_html(resolved)
		self.assertIn("position: absolute;", html)
		self.assertIn("--pi-my-maps-bottom-overscan: 2px;", html)
		self.assertIn("var(--pi-my-maps-bottom-overscan)", html)
		self.assertNotIn("transform: translateY", html)

	def test_document_wrapper_supports_unicode_and_large_safe_titles(self):
		doc = self.make_instruction(
			title="Привет 地図 " + ("A" * 96),
			custom_map_embed_url=self.STANDARD_EMBED_URL,
		)
		resolved = resolve_capture_map(CaptureMapReference(property_instruction=doc.name, map_key="property-location"))
		html = render_capture_document_html(resolved)
		self.assertIn("Привет 地図", html)
		data_url = build_capture_document_data_url(html)
		self.assertTrue(data_url.startswith("data:text/html;charset=utf-8;base64,"))

	def test_document_capture_rejects_unexpectedly_large_wrapper(self):
		doc = self.make_instruction(
			title="Oversized wrapper",
			custom_map_embed_url=self.STANDARD_EMBED_URL,
		)
		resolved = resolve_capture_map(CaptureMapReference(property_instruction=doc.name, map_key="property-location"))
		html = render_capture_document_html(resolved)
		self.assertLess(len(html.encode("utf-8")), MAX_CAPTURE_DOCUMENT_BYTES)
		with patch("propms.map_snapshot.capture.MAX_CAPTURE_DOCUMENT_BYTES", 32):
			with self.assertRaisesRegex(frappe.ValidationError, "maximum safe size"):
				build_capture_document_data_url(html)

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

	def test_document_capture_engine_returns_expected_standard_dimensions_without_route_config(self):
		doc = self.make_instruction(
			title=f"Standard Direct Capture Fixture {uuid.uuid4().hex[:8]}",
			custom_map_embed_url=self.STANDARD_EMBED_URL,
		)
		frappe.db.commit()
		result = capture_map_png(
			doc.name,
			"property-location",
			collect_network_trace=True,
		)
		self.assertEqual(result.pixel_width, 2094)
		self.assertEqual(result.pixel_height, 1180)
		self.assertEqual(result.map_kind, "google-maps")
		self.assertIn("document_identity", result.cleanup_diagnostics)
		self.assertEqual(result.cleanup_diagnostics["document_identity"]["origin"], "null")
		self.assertEqual(result.cleanup_diagnostics["document_identity"]["href"]["scheme"], "data")
		self.assertEqual(result.cleanup_diagnostics["document_identity"]["iframeSrc"]["host"], "www.google.com")
		hosts = {entry["url"]["host"] for entry in result.cleanup_diagnostics.get("network_trace", []) if entry["url"]["host"]}
		self.assertNotIn("development.localhost", hosts)
		self.assertNotIn("127.0.0.1", hosts)
		for entry in result.cleanup_diagnostics.get("network_trace", []):
			host = entry["url"]["host"]
			if host and "google." in host:
				self.assertFalse(entry["has_frappe_site_header"])

	def test_document_capture_engine_returns_expected_mymaps_dimensions_without_route_config(self):
		doc = self.make_instruction(
			title=f"My Maps Direct Capture Fixture {uuid.uuid4().hex[:8]}",
			custom_map_embed_url=self.MY_MAPS_EMBED_URL,
		)
		frappe.db.commit()
		result = capture_map_png(
			doc.name,
			"property-location",
			collect_network_trace=True,
		)
		self.assertEqual(result.pixel_width, 2094)
		self.assertEqual(result.pixel_height, 1180)
		self.assertEqual(result.map_kind, "google-my-maps")
		hosts = {entry["url"]["host"] for entry in result.cleanup_diagnostics.get("network_trace", []) if entry["url"]["host"]}
		self.assertNotIn("development.localhost", hosts)

	def test_standard_capture_wrapper_has_no_my_maps_crop_class(self):
		doc = self.make_instruction(
			title="Standard geometry wrapper",
			custom_map_embed_url=self.STANDARD_EMBED_URL,
		)
		resolved = resolve_capture_map(CaptureMapReference(property_instruction=doc.name, map_key="property-location"))
		html = render_capture_document_html(resolved)
		self.assertIn('class="custom-map-frame custom-map-frame--google-maps"', html)
		self.assertIn("--pi-my-maps-bottom-overscan: 0px;", html)
