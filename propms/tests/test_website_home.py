from pathlib import Path

import frappe
from bs4 import BeautifulSoup
from frappe.tests import IntegrationTestCase

from propms.website_home import V2_HOME_TEMPLATES, apply_v2_home
from propms.website_v2 import V2_ASSET_FILES, get_asset_version, get_shell


class TestWebsiteHome(IntegrationTestCase):
    def setUp(self):
        self.previous_user = frappe.session.user
        frappe.set_user("Guest")

    def tearDown(self):
        frappe.set_user(self.previous_user)

    def test_home_page_uses_only_controlled_v2_page_builder_blocks(self):
        page = frappe.get_cached_doc("Web Page", "home")
        self.assertEqual(page.content_type, "Page Builder")
        self.assertTrue(page.page_blocks)
        self.assertTrue(all(row.web_template in V2_HOME_TEMPLATES for row in page.page_blocks))

    def test_home_adapter_renders_native_page_builder_inside_shared_shell(self):
        context = frappe._dict()
        self.assertTrue(apply_v2_home(context))
        self.assertEqual(context.template, "propms/templates/website_v2/home.html")
        self.assertTrue(context.home_parity)
        self.assertEqual(context.page_builder_html.count("<h1"), 1)
        self.assertEqual(context.asset_version, get_asset_version())
        self.assertEqual(context.build_version, context.asset_version)
        self.assertEqual(context.shell.theme_name, frappe.get_cached_doc("Website Settings").website_theme)
        soup = BeautifulSoup(context.page_builder_html, "html.parser")
        self.assertIsNotNone(soup.select_one("#hero"))
        self.assertIsNotNone(soup.select_one("#about"))
        self.assertIsNotNone(soup.select_one("#services"))
        self.assertIsNotNone(soup.select_one("#contact"))

    def test_theme_drives_brand_tokens_and_card_hover(self):
        shell = get_shell()
        self.assertIn(shell.card_hover_style, {"shadow", "brand-fill", "lift-brand-fill"})
        self.assertRegex(shell.design_tokens["--brand-primary"], r"^#[0-9A-Fa-f]{6}$")
        self.assertRegex(shell.design_tokens["--brand-secondary"], r"^#[0-9A-Fa-f]{6}$")
        self.assertRegex(shell.design_tokens["--brand-accent"], r"^#[0-9A-Fa-f]{6}$")

        base = Path(frappe.get_app_path("propms", "templates", "website_v2", "base.html")).read_text()
        styles = Path(frappe.get_app_path("propms", "public", "css", "home_v2.css")).read_text()
        self.assertIn("v2-card-hover--{{ shell.card_hover_style", base)
        self.assertIn(".v2-card-hover--brand-fill", styles)
        self.assertIn("background: var(--brand-primary)", styles)
        self.assertIn(".v2-hero--scroll-fixed.v2-media-fixed-ready", styles)
        self.assertIn("background-attachment: fixed", styles)
        self.assertNotIn("@media (min-width: 48rem) and (prefers-reduced-motion: no-preference)", styles)
        self.assertIn('font-family: "boxicons-home"', styles)
        self.assertIn("transform: translate(-50%, -50%)", styles)
        self.assertIn('a[href*="facebook.com"] span::before { content: "\\e92f"; }', styles)
        self.assertNotIn("--v2-social-icon:", styles)
        self.assertNotIn(".v2-home--", styles)

    def test_mobile_navigation_is_anchored_below_header(self):
        app_path = Path(frappe.get_app_path("propms"))
        base_styles = (app_path / "public/css/website_v2.css").read_text()
        home_styles = (app_path / "public/css/home_v2.css").read_text()

        self.assertIn("position: absolute;", base_styles)
        self.assertIn("top: calc(100% + 0.5rem);", base_styles)
        self.assertIn("left: auto;", base_styles)
        self.assertIn("width: max-content;", base_styles)
        self.assertIn('v2-nav-toggle[aria-expanded="true"] .v2-nav-toggle__icon', base_styles)
        self.assertIn("max-height: calc(100dvh - 8rem);", base_styles)
        self.assertIn("color-mix(in srgb, var(--brand-secondary) 38%, transparent)", home_styles)
        self.assertIn("backdrop-filter: blur(12px)", home_styles)

    def test_v2_asset_version_tracks_latest_static_asset(self):
        expected = max(
            Path(frappe.get_app_path("propms", *path_parts)).stat().st_mtime_ns
            for path_parts in V2_ASSET_FILES
        )
        self.assertEqual(get_asset_version(), str(expected))
    def test_home_navigation_uses_authenticated_safe_route(self):
        frappe.set_user("Administrator")
        authenticated = frappe._dict()
        self.assertTrue(apply_v2_home(authenticated))
        self.assertEqual(authenticated.website_home_href, "/home")
        self.assertIn("My Account", [item["label"] for item in authenticated.primary_navigation])

        frappe.set_user("Guest")
        guest = frappe._dict()
        self.assertTrue(apply_v2_home(guest))
        self.assertEqual(guest.website_home_href, "/")
        self.assertIn("Login", [item["label"] for item in guest.primary_navigation])

    def test_v2_home_uses_native_progressive_enhancement(self):
        script = Path(frappe.get_app_path("propms", "public", "js", "website_v2.js")).read_text()
        self.assertIn("prefers-reduced-motion", script)
        self.assertIn("IntersectionObserver", script)
        self.assertIn("propms.website_enquiry.submit_enquiry", script)
        self.assertIn("propms.website.subscribe_to_newsletter", script)
        self.assertIn("v2-header--compact", script)
        self.assertIn("frappe.translate.get_all_languages", script)
        self.assertIn("preferred_language", script)
        self.assertIn("v2-media-fixed-ready", script)
        self.assertIn("--v2-fixed-media", script)
        self.assertNotIn("AOS.init", script)

    def test_consent_ui_uses_modal_preferences_and_in_place_media(self):
        app_path = Path(frappe.get_app_path("propms"))
        base = (app_path / "templates/website_v2/base.html").read_text()
        contact = (
            app_path
            / "property_management_solution/web_template/propms_v2_contact_location/propms_v2_contact_location.html"
        ).read_text()
        styles = (app_path / "public/css/website_v2.css").read_text()
        home_styles = (app_path / "public/css/home_v2.css").read_text()
        script = (app_path / "public/js/website_v2.js").read_text()

        self.assertIn("data-consent-backdrop", base)
        self.assertIn('role="dialog"', base)
        self.assertIn("Load interactive map", contact)
        self.assertIn("v2-external-media__address", contact)
        self.assertIn(".v2-external-media__placeholder[hidden]", styles)
        self.assertIn(".v2-contact__map[hidden]", styles)
        self.assertIn("v2-consent--preferences", script)
        self.assertIn("consentBannerDelay = 400", script)
        self.assertIn("placeholder.hidden = true", script)
        self.assertIn('aria-label="Privacy choices"', base)
        self.assertIn('.v2-form-consent input[type="checkbox"]', home_styles)

    def test_runtime_home_code_contains_no_brand_or_site_specific_switches(self):
        app_path = Path(frappe.get_app_path("propms"))
        runtime_paths = (
            app_path / "website_home.py",
            app_path / "website_native_settings.py",
            app_path / "website_v2.py",
            app_path / "website_catalog.py",
            app_path / "public/css/home_v2.css",
        )
        combined = "\n".join(path.read_text().lower() for path in runtime_paths)
        for marker in ("home_profiles", "v2-home--", "frappe.local.site"):
            self.assertNotIn(marker, combined)
