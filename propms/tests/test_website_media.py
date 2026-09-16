import io
from unittest.mock import patch

import frappe
from bs4 import BeautifulSoup
from frappe.tests import IntegrationTestCase
from PIL import Image

from propms.website_media import (
    PROFILES,
    generate_media_derivatives,
    render_responsive_image,
    resolve_media,
    _get_source_file,
    validate_image_text_policy,
    validate_media_for_usage,
)


class TestWebsiteMedia(IntegrationTestCase):
    def _make_image_file(self, width=2000, height=1200, name="m4-test.jpg"):
        image = Image.new("RGB", (width, height), "white")
        output = io.BytesIO()
        image.save(output, format="JPEG", quality=90)
        with patch("frappe.enqueue"):
            doc = frappe.get_doc(
                {
                    "doctype": "File",
                    "file_name": name,
                    "is_private": 0,
                    "website_media_enabled": 1,
                    "content": output.getvalue(),
                }
            )
            doc.flags.ignore_permissions = True
            doc.insert()
        return doc

    def test_file_insert_enqueues_derivatives_after_commit(self):
        image = Image.new("RGB", (100, 100), "white")
        output = io.BytesIO()
        image.save(output, format="JPEG")
        with patch("frappe.enqueue") as enqueue:
            doc = frappe.get_doc({"doctype": "File", "file_name": "m4-queue.jpg", "website_media_enabled": 1, "content": output.getvalue()})
            doc.flags.ignore_permissions = True
            doc.insert()
        enqueue.assert_called_once()
        self.assertTrue(enqueue.call_args.kwargs["enqueue_after_commit"])

    def test_generation_creates_fixed_profiles_and_formats(self):
        source = self._make_image_file()
        metadata = generate_media_derivatives(source.name)
        self.assertEqual(set(PROFILES), {item["profile"] for item in metadata["derivatives"]})
        self.assertEqual(len(metadata["derivatives"]), len(PROFILES) * 3)
        self.assertEqual(metadata["width"], 2000)
        self.assertEqual(metadata["height"], 1200)
        self.assertTrue(frappe.db.exists("File", source.name))
        self.assertEqual(frappe.db.get_value("File", source.name, "website_media_status"), "ready")

    def test_resolver_and_markup_use_precomputed_derivatives(self):
        source = self._make_image_file(name="m4-render.jpg")
        generate_media_derivatives(source.name)
        media = resolve_media(source.file_url, usage="hero")
        self.assertTrue(media["sources"])
        html = render_responsive_image(source.file_url, "Letting team", usage="hero")
        soup = BeautifulSoup(html, "html.parser")
        image = soup.find("img")
        self.assertEqual(image["loading"], "eager")
        self.assertEqual(image["fetchpriority"], "high")
        self.assertTrue(image.get("width"))
        self.assertTrue(image.get("height"))
        self.assertTrue(soup.find("source", {"type": "image/avif"}))
        self.assertTrue(soup.find("source", {"type": "image/webp"}))

    def test_below_fold_media_is_lazy(self):
        source = self._make_image_file(name="m4-lazy.jpg")
        generate_media_derivatives(source.name)
        html = render_responsive_image(source.file_url, "Office", usage="content")
        self.assertEqual(BeautifulSoup(html, "html.parser").find("img")["loading"], "lazy")

    def test_alt_policy_requires_text_or_explicit_decorative(self):
        with self.assertRaises(frappe.ValidationError):
            validate_image_text_policy("/files/example.jpg", alt="", decorative=False)
        validate_image_text_policy("/files/example.jpg", alt="", decorative=True)

    def test_undersized_hero_is_rejected(self):
        source = self._make_image_file(width=1200, height=800, name="m4-small.jpg")
        generate_media_derivatives(source.name)
        with self.assertRaises(frappe.ValidationError):
            validate_media_for_usage(source.file_url, "hero")

    def test_resolve_does_not_generate_on_request(self):
        source = self._make_image_file(name="m4-no-request-work.jpg")
        generate_media_derivatives(source.name)
        with patch("propms.website_media._encode_image", side_effect=AssertionError("conversion on request")):
            media = resolve_media(source.file_url, usage="content")
        self.assertTrue(media["src"].endswith((".jpg", ".png")))

    def test_failed_optimisation_keeps_original_file(self):
        source = self._make_image_file(name="m4-failure.jpg")
        with patch("propms.website_media._generate_all_profiles", side_effect=RuntimeError("test failure")):
            result = generate_media_derivatives(source.name)
        self.assertEqual(result, {})
        self.assertTrue(frappe.db.exists("File", source.name))
        self.assertEqual(frappe.db.get_value("File", source.name, "website_media_status"), "failed")

    def test_social_preview_ratio_is_enforced(self):
        source = self._make_image_file(width=1600, height=1200, name="m4-social.jpg")
        generate_media_derivatives(source.name)
        with self.assertRaises(frappe.ValidationError):
            validate_media_for_usage(source.file_url, "social-preview")

    def test_duplicate_source_urls_prefer_ready_media(self):
        pending = frappe._dict(name="pending", website_media_status="pending")
        ready = frappe._dict(name="ready", website_media_status="ready")
        with patch("frappe.get_all", return_value=[pending, ready]):
            source = _get_source_file("/files/example.jpg")
        self.assertEqual(source.name, "ready")
