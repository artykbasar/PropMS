from __future__ import annotations

from frappe.tests.utils import FrappeTestCase

from propms.map_snapshot.validation import (
	derive_google_maps_view_url,
	extract_google_maps_embed_url,
	get_google_maps_embed_kind,
	validate_google_maps_embed_url,
)


class TestMapSnapshotValidation(FrappeTestCase):
	def test_standard_iframe_input_is_canonicalized(self):
		self.assertEqual(
			extract_google_maps_embed_url('<iframe src="https://www.google.com/maps/embed?pb=abc&amp;z=12"></iframe>'),
			"https://www.google.com/maps/embed?pb=abc&z=12",
		)

	def test_standard_direct_url_is_accepted(self):
		self.assertEqual(
			validate_google_maps_embed_url("https://www.google.com/maps/embed?pb=abc"),
			"https://www.google.com/maps/embed?pb=abc",
		)

	def test_my_maps_direct_url_is_accepted(self):
		self.assertEqual(
			validate_google_maps_embed_url("https://www.google.com/maps/d/embed?mid=mid123&ehbc=2E312F"),
			"https://www.google.com/maps/d/embed?mid=mid123&ehbc=2E312F",
		)

	def test_my_maps_iframe_input_is_accepted(self):
		self.assertEqual(
			extract_google_maps_embed_url("<iframe src='https://www.google.com/maps/d/embed?mid=mid123&ehbc=2E312F'></iframe>"),
			"https://www.google.com/maps/d/embed?mid=mid123&ehbc=2E312F",
		)

	def test_untrusted_host_is_rejected(self):
		with self.assertRaises(Exception):
			validate_google_maps_embed_url("https://evil.example/maps/embed?pb=1")

	def test_http_is_rejected(self):
		with self.assertRaises(Exception):
			validate_google_maps_embed_url("http://www.google.com/maps/embed?pb=1")

	def test_credentials_are_rejected(self):
		with self.assertRaises(Exception):
			validate_google_maps_embed_url("https://user:pass@www.google.com/maps/embed?pb=1")

	def test_multiple_iframes_are_rejected(self):
		with self.assertRaises(Exception):
			extract_google_maps_embed_url(
				'<iframe src="https://www.google.com/maps/embed?pb=1"></iframe>'
				'<iframe src="https://www.google.com/maps/embed?pb=2"></iframe>'
			)

	def test_srcdoc_is_rejected(self):
		with self.assertRaises(Exception):
			extract_google_maps_embed_url(
				'<iframe srcdoc="<script>alert(1)</script>" src="https://www.google.com/maps/embed?pb=1"></iframe>'
			)

	def test_viewer_url_derivation_for_my_maps_preserves_mid(self):
		self.assertEqual(
			derive_google_maps_view_url("https://www.google.com/maps/d/embed?mid=mid123&ehbc=2E312F"),
			"https://www.google.com/maps/d/viewer?mid=mid123&ehbc=2E312F",
		)

	def test_embed_kind_values_remain_backwards_compatible(self):
		self.assertEqual(get_google_maps_embed_kind("https://www.google.com/maps/embed?pb=abc"), "google-maps")
		self.assertEqual(get_google_maps_embed_kind("https://www.google.com/maps/d/embed?mid=mid123"), "google-my-maps")
