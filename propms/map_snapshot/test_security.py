from __future__ import annotations

from unittest.mock import patch

from frappe.tests.utils import FrappeTestCase

from propms.map_snapshot.security import (
	CAPTURE_TOKEN_PURPOSE,
	CAPTURE_TOKEN_VERSION,
	build_capture_claim,
	parse_and_verify_capture_claim,
)


class TestMapSnapshotSecurity(FrappeTestCase):
	def test_valid_claim_passes(self):
		token = build_capture_claim("PI-00001", "property-location", "abc123")
		claim = parse_and_verify_capture_claim(token)
		self.assertEqual(claim.property_instruction, "PI-00001")
		self.assertEqual(claim.map_key, "property-location")

	def test_tampered_claim_fails(self):
		token = build_capture_claim("PI-00001", "property-location", "abc123")
		with self.assertRaises(Exception):
			parse_and_verify_capture_claim(token + "x")

	def test_expired_claim_fails(self):
		with patch("time.time", return_value=1000):
			token = build_capture_claim("PI-00001", "property-location", "abc123", lifetime_seconds=5)
		with patch("time.time", return_value=2000):
			with self.assertRaises(Exception):
				parse_and_verify_capture_claim(token)

	def test_wrong_purpose_fails(self):
		token = build_capture_claim("PI-00001", "property-location", "abc123")
		payload, signature = token.split(".", 1)
		import base64, json
		raw = base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4))
		data = json.loads(raw.decode("utf-8"))
		data["purpose"] = "wrong"
		new_payload = base64.urlsafe_b64encode(json.dumps(data, sort_keys=True, separators=(",", ":")).encode()).decode().rstrip("=")
		with self.assertRaises(Exception):
			parse_and_verify_capture_claim(f"{new_payload}.{signature}")

	def test_token_contains_no_raw_google_url(self):
		token = build_capture_claim("PI-00001", "property-location", "abc123")
		self.assertNotIn("google.com", token)

	def test_claim_fields_are_versioned(self):
		token = build_capture_claim("PI-00001", "property-location", "abc123")
		claim = parse_and_verify_capture_claim(token)
		self.assertEqual(claim.purpose, CAPTURE_TOKEN_PURPOSE)
		self.assertEqual(claim.version, CAPTURE_TOKEN_VERSION)
