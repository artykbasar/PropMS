from unittest.mock import patch

import frappe
from frappe.tests import IntegrationTestCase

from propms.website_native_settings import get_native_shell_values


class TestNativeWebsiteSettings(IntegrationTestCase):
    def setUp(self):
        self.previous_user = frappe.session.user
        frappe.set_user("Guest")

    def tearDown(self):
        frappe.set_user(self.previous_user)

    def _row(self, label, url=None, *, parent=None, new_tab=0):
        return frappe._dict(
            label=label,
            url=url,
            parent_label=parent,
            open_in_new_tab=new_tab,
            right=1,
        )

    def _settings(self, **overrides):
        values = dict(
            app_name="Native Brand",
            title_prefix="Native Prefix",
            home_page="home",
            banner_image=None,
            favicon=None,
            hide_login=0,
            show_language_picker=1,
            hide_footer_signup=1,
            show_footer_on_login=1,            navbar_search=0,
            call_to_action=None,
            call_to_action_url=None,
            copyright="Native copyright",
            footer_logo="/files/footer.svg",
            footer_powered="Powered natively",
            address="",
            top_bar_items=[],
            footer_items=[],
            propms_x_url=None,
            propms_facebook_url=None,
            propms_instagram_url=None,
            propms_linkedin_url=None,
            propms_google_url=None,
        )
        values.update(overrides)
        return frappe._dict(values)
    def _contact(self, **overrides):
        values = dict(email_id=None, phone=None, address_line1=None, address_line2=None)
        values.update(city=None, state=None, pincode=None, country=None)
        values.update(overrides)
        return frappe._dict(values)

    def _values(self, settings, contact=None):
        contact = contact or self._contact()

        def cached_doc(doctype, *args, **kwargs):
            if doctype == "Website Settings":
                return settings
            if doctype == "Contact Us Settings":
                return contact
            raise AssertionError(f"Unexpected DocType: {doctype}")

        with patch(
            "propms.website_native_settings.frappe.get_cached_doc",
            side_effect=cached_doc,
        ), patch(
            "propms.website_native_settings.frappe.get_cached_value",
            return_value="English",
        ):
            return get_native_shell_values(homepage_shell=True)
    def test_native_login_and_language_controls_are_authoritative(self):
        shown = self._values(self._settings(hide_login=0, show_language_picker=1))
        self.assertIn("Login", [item["label"] for item in shown.primary_navigation])
        self.assertIsNotNone(shown.language_picker)

        hidden = self._values(self._settings(hide_login=1, show_language_picker=0))
        self.assertNotIn("Login", [item["label"] for item in hidden.primary_navigation])
        self.assertIsNone(hidden.language_picker)

    def test_authenticated_navigation_adds_my_account_and_uses_native_home(self):
        frappe.set_user("Administrator")
        values = self._values(self._settings(home_page="portal-home", hide_login=0))
        self.assertEqual(values.website_home_href, "/portal-home")
        self.assertIn("My Account", [item["label"] for item in values.primary_navigation])
        self.assertNotIn("Login", [item["label"] for item in values.primary_navigation])
        self.assertIsNone(values.language_picker)

    def test_native_nav_rows_preserve_order_nesting_and_new_tab(self):
        rows = [
            self._row("Home", "/#"),
            self._row("Company"),
            self._row("About", "/#about", parent="Company", new_tab=1),
        ]
        values = self._values(self._settings(top_bar_items=rows))
        self.assertEqual(values.primary_navigation[0]["label"], "Home")
        self.assertEqual(values.primary_navigation[1]["label"], "Company")
        self.assertEqual(values.primary_navigation[1]["children"][0]["href"], "/#about")
        self.assertTrue(values.primary_navigation[1]["children"][0]["open_in_new_tab"])
        self.assertEqual(values.primary_navigation[-1]["href"], "/login")

    def test_native_footer_controls_logo_links_copyright_and_signup(self):
        footer_rows = [
            self._row("Useful Links"),
            self._row("Policies", "/policies", parent="Useful Links"),
            self._row("Contact", "/#contact", parent="Useful Links"),
        ]
        values = self._values(self._settings(footer_items=footer_rows, hide_footer_signup=1))
        self.assertEqual(values.footer_groups[0]["label"], "Useful Links")
        self.assertEqual(values.footer_groups[0]["items"][1]["href"], "/#contact")
        self.assertEqual(values.footer_logo, "/files/footer.svg")
        self.assertEqual(values.footer_copyright_text, "Native copyright")
        self.assertEqual(values.footer_powered, "Powered natively")
        self.assertFalse(values.footer_newsletter_enabled)
        self.assertTrue(values.show_footer_on_login)

    def test_blank_native_footer_logo_does_not_fallback_to_brand_image(self):
        values = self._values(
            self._settings(banner_image="/files/header.svg", footer_logo=None)
        )
        self.assertEqual(values.home_logo_url, "/files/header.svg")
        self.assertIsNone(values.footer_logo)

    def test_native_brand_and_contact_fields_use_safe_values(self):
        settings = self._settings(
            banner_image="/files/native-logo.svg",
            address='<p onclick="bad()">unsafe legacy html</p>',
            navbar_search=1,
            call_to_action="Book",
            call_to_action_url="/contact",
        )
        contact = self._contact(email_id="native@example.com", phone="+44 20 1234 5678")
        values = self._values(settings, contact)
        self.assertEqual(values.home_logo_url, "/files/native-logo.svg")
        self.assertFalse(values.home_logo_layers)
        self.assertEqual(values.footer_details["address"], "")
        self.assertEqual(values.footer_details["email"], "native@example.com")
        self.assertEqual(values.footer_details["phone"], "+44 20 1234 5678")
        self.assertTrue(values.navbar_search)
        self.assertEqual(values.navbar_call_to_action["href"], "/contact")

    def test_plain_native_website_address_is_allowed_when_contact_address_is_empty(self):
        values = self._values(self._settings(address="1 Native Street\nLondon"))
        self.assertEqual(values.footer_details["address"], "1 Native Street\nLondon")

    def test_social_profiles_come_from_website_settings(self):
        values = self._values(
            self._settings(
                propms_x_url="https://x.com/example",
                propms_linkedin_url="https://www.linkedin.com/company/example",
            )
        )
        self.assertEqual([item["label"] for item in values.top_bar_social], ["X", "LinkedIn"])
        self.assertEqual(values.top_bar_social, values.footer_social)

    def test_unsafe_native_navigation_social_and_cta_urls_are_not_exposed(self):
        rows = [self._row("Unsafe", "javascript:alert(1)"), self._row("Safe", "/services")]
        values = self._values(
            self._settings(
                top_bar_items=rows,
                call_to_action="Unsafe CTA",
                call_to_action_url="javascript:alert(1)",
                propms_x_url="javascript:alert(1)",
            )
        )
        self.assertNotIn("Unsafe", [item["label"] for item in values.primary_navigation])
        self.assertIn("Safe", [item["label"] for item in values.primary_navigation])
        self.assertIsNone(values.navbar_call_to_action)
        self.assertFalse(values.top_bar_social)
