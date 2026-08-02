from __future__ import annotations

from unittest.mock import patch

import frappe
from frappe.tests.utils import FrappeTestCase

from propms.map_snapshot.security import build_capture_claim
from propms.property_management_solution.doctype.property_instruction.test_property_instruction import (
	PropertyInstructionTestMixin,
)
from propms.www import internal_map_capture


class TestInternalMapCaptureRoute(PropertyInstructionTestMixin, FrappeTestCase):
	def setUp(self):
		super().setUp()
		frappe.local.request.cookies = {}
		frappe.local.request.host = "development.localhost:8000"
		frappe.local.request.path = "/internal_map_capture"
		frappe.local.request.headers = {}

	def test_missing_capture_cookie_returns_not_found(self):
		with self.assertRaises(frappe.DoesNotExistError):
			internal_map_capture.get_context(frappe._dict())

	def test_valid_property_map_claim_returns_capture_context(self):
		doc = self.make_instruction(
			custom_map_embed_url="https://www.google.com/maps/d/embed?mid=mid123&ehbc=2E312F"
		)
		token = build_capture_claim(doc.name, "property-location", "placeholder")
		claim = internal_map_capture.parse_and_verify_capture_claim(token)
		resolved = internal_map_capture.resolve_capture_map(
			internal_map_capture.CaptureMapReference(
				property_instruction=claim.property_instruction,
				map_key=claim.map_key,
				row_name=claim.row_name,
			)
		)
		token = build_capture_claim(doc.name, "property-location", resolved.source_hash)
		frappe.local.request.cookies = {internal_map_capture.CAPTURE_TOKEN_COOKIE_NAME: token}
		context = internal_map_capture.get_context(frappe._dict())
		self.assertEqual(context.map_kind, "google-my-maps")
		self.assertEqual(context.map_kind_class, "google-my-maps")
		self.assertEqual(context.my_maps_header_crop_px, 60)
		self.assertEqual(context.capture_visible_width_css_px, 1047)
		self.assertEqual(context.capture_visible_height_css_px, 590)

	def test_mismatched_source_hash_is_rejected(self):
		doc = self.make_instruction(
			custom_map_embed_url="https://www.google.com/maps/embed?pb=abc"
		)
		token = build_capture_claim(doc.name, "property-location", "stale-hash")
		frappe.local.request.cookies = {internal_map_capture.CAPTURE_TOKEN_COOKIE_NAME: token}
		with self.assertRaises(frappe.DoesNotExistError):
			internal_map_capture.get_context(frappe._dict())

	def test_invalid_capture_token_returns_not_found(self):
		frappe.local.request.cookies = {internal_map_capture.CAPTURE_TOKEN_COOKIE_NAME: "bad.token"}
		with self.assertRaises(frappe.DoesNotExistError):
			internal_map_capture.get_context(frappe._dict())

	def test_expired_capture_token_returns_not_found(self):
		doc = self.make_instruction(
			custom_map_embed_url="https://www.google.com/maps/embed?pb=abc"
		)
		token = build_capture_claim(doc.name, "property-location", "stale-hash", lifetime_seconds=-1)
		frappe.local.request.cookies = {internal_map_capture.CAPTURE_TOKEN_COOKIE_NAME: token}
		with self.assertRaises(frappe.DoesNotExistError):
			internal_map_capture.get_context(frappe._dict())

	def test_claim_signed_with_another_site_secret_is_rejected(self):
		doc = self.make_instruction(
			custom_map_embed_url="https://www.google.com/maps/embed?pb=abc"
		)
		with patch("propms.map_snapshot.security._get_site_secret", return_value=b"not-the-current-site-secret"):
			token = build_capture_claim(doc.name, "property-location", "stale-hash")
		frappe.local.request.cookies = {internal_map_capture.CAPTURE_TOKEN_COOKIE_NAME: token}
		with self.assertRaises(frappe.DoesNotExistError):
			internal_map_capture.get_context(frappe._dict())

	def test_missing_request_returns_not_found(self):
		frappe.local.request = None
		with self.assertRaises(frappe.DoesNotExistError):
			internal_map_capture.get_context(frappe._dict())
