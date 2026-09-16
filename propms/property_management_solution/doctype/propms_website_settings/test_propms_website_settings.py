import frappe
from frappe.tests import IntegrationTestCase

from propms.patches.v1_0.set_default_propms_website_engine import execute as set_default_engine
from propms.website_settings import LEGACY_DAY, PROPMS_V2, get_website_engine, is_propms_v2_enabled


class TestPropMSWebsiteSettings(IntegrationTestCase):
    def setUp(self):
        frappe.db.set_single_value("PropMS Website Settings", "website_engine", LEGACY_DAY)

    def test_legacy_day_is_default_engine(self):
        self.assertEqual(get_website_engine(), LEGACY_DAY)
        self.assertFalse(is_propms_v2_enabled())

    def test_propms_v2_can_be_selected(self):
        frappe.db.set_single_value("PropMS Website Settings", "website_engine", PROPMS_V2)

        self.assertEqual(get_website_engine(), PROPMS_V2)
        self.assertTrue(is_propms_v2_enabled())

    def test_missing_value_falls_back_to_legacy_day(self):
        frappe.db.delete("Singles", {"doctype": "PropMS Website Settings", "field": "website_engine"})

        self.assertEqual(get_website_engine(), LEGACY_DAY)

    def test_default_patch_persists_legacy_day_when_value_is_missing(self):
        frappe.db.delete("Singles", {"doctype": "PropMS Website Settings", "field": "website_engine"})

        set_default_engine()

        self.assertEqual(
            frappe.db.get_single_value("PropMS Website Settings", "website_engine"),
            LEGACY_DAY,
        )

    def test_design_tokens_resolve_from_site_settings(self):
        from propms.website_v2 import get_design_tokens

        tokens = get_design_tokens()

        self.assertRegex(tokens["--brand-primary"], r"^#[0-9A-Fa-f]{6}$")
        self.assertRegex(tokens["--brand-secondary"], r"^#[0-9A-Fa-f]{6}$")
        self.assertRegex(tokens["--brand-on-primary"], r"^#[0-9A-Fa-f]{6}$")
        self.assertRegex(tokens["--brand-on-secondary"], r"^#[0-9A-Fa-f]{6}$")

    def test_legacy_design_token_controls_are_hidden(self):
        meta = frappe.get_meta("PropMS Website Settings")
        fieldnames = (
            "design_tokens_section",
            "brand_primary",
            "brand_secondary",
            "brand_accent",
            "design_tokens_column",
            "brand_background",
            "brand_surface",
            "brand_text",
        )

        for fieldname in fieldnames:
            self.assertTrue(meta.get_field(fieldname).hidden, fieldname)

    def test_invalid_design_token_is_rejected(self):
        settings = frappe.get_doc("PropMS Website Settings")
        settings.brand_primary = "red"

        with self.assertRaises(frappe.ValidationError):
            settings.save()

    def test_historical_design_token_patch_is_site_agnostic(self):
        from pathlib import Path

        source = Path(
            frappe.get_app_path("propms", "patches", "v1_0", "initialize_v2_design_tokens.py")
        ).read_text(encoding="utf-8")
        self.assertNotIn("BRAND_PRESETS", source)
        self.assertNotIn("frappe.local.site", source)
        self.assertNotIn("SITE_PRESETS", source)

    def test_shell_uses_native_site_logo_and_name(self):
        from propms.website_v2 import get_shell

        shell = get_shell()
        website_settings = frappe.get_cached_doc("Website Settings")

        self.assertEqual(shell.brand_name, website_settings.app_name or website_settings.title_prefix or "PropMS")
        expected_logo = website_settings.banner_image or website_settings.footer_logo or website_settings.favicon or None
        self.assertEqual(shell.logo_url, expected_logo)
        self.assertEqual(shell.favicon_url, website_settings.favicon or expected_logo)
        self.assertEqual(shell.theme_name, website_settings.website_theme or "Standard")

    def test_preview_context_builds_shell_when_enabled(self):
        from unittest.mock import patch

        from propms.www.propms_v2_preview import get_context

        context = frappe._dict()
        with patch("propms.www.propms_v2_preview.is_preview_enabled", return_value=True):
            get_context(context)

        self.assertEqual(context.robots_meta, "noindex, nofollow")
        self.assertEqual(context.shell.brand_name, frappe.get_cached_doc("Website Settings").app_name)

    def test_preview_context_is_hidden_when_disabled(self):
        from unittest.mock import patch

        from propms.www.propms_v2_preview import get_context

        with patch("propms.www.propms_v2_preview.is_preview_enabled", return_value=False):
            with self.assertRaises(frappe.DoesNotExistError):
                get_context(frappe._dict())

    def test_invalid_google_analytics_id_is_rejected(self):
        settings = frappe.get_doc("PropMS Website Settings")
        settings.analytics_provider = "Google Analytics"
        settings.analytics_measurement_id = "invalid"
        with self.assertRaises(frappe.ValidationError):
            settings.save()

    def test_external_privacy_url_is_rejected(self):
        settings = frappe.get_doc("PropMS Website Settings")
        settings.consent_privacy_url = "https://example.com/privacy"
        with self.assertRaises(frappe.ValidationError):
            settings.save()
