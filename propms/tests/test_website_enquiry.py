import time
from unittest.mock import patch

import frappe
from frappe.tests import IntegrationTestCase

from propms.website_enquiry import ENQUIRY_DOCTYPE, submit_enquiry


class TestPropMSWebsiteEnquiry(IntegrationTestCase):
    def setUp(self):
        frappe.form_dict = frappe._dict()
        frappe.db.set_single_value("PropMS Website Settings", "enquiry_notification_email", "")
        frappe.db.set_single_value("PropMS Website Settings", "enquiry_crm_enabled", 0)
        frappe.clear_cache(doctype="PropMS Website Settings")

    def payload(self, **overrides):
        values = {
            "name": "M8 Test User",
            "email": "m8-test@example.com",
            "telephone": "+44 20 8123 4567",
            "subject": "General",
            "message": "Please contact me about property management.",
            "source_page": "/?utm_source=test",
            "form_started_at": str((time.time() - 2) * 1000),
        }
        values.update(overrides)
        return values

    def find_latest(self):
        name = frappe.db.get_value(
            ENQUIRY_DOCTYPE,
            {"email": "m8-test@example.com"},
            "name",
            order_by="creation desc",
        )
        return frappe.get_doc(ENQUIRY_DOCTYPE, name) if name else None

    def test_valid_submission_persists_before_optional_integrations(self):
        result = submit_enquiry(**self.payload(marketing_consent="1"))
        enquiry = self.find_latest()
        self.assertEqual(result, {"accepted": True})
        self.assertIsNotNone(enquiry)
        self.assertEqual(enquiry.processing_status, "Completed")
        self.assertEqual(enquiry.notification_status, "Skipped")
        self.assertEqual(enquiry.crm_status, "Disabled")
        self.assertEqual(enquiry.marketing_consent, 1)
        self.assertIsNotNone(enquiry.consent_timestamp)

    def test_email_failure_does_not_rollback_enquiry(self):
        frappe.db.set_single_value("PropMS Website Settings", "enquiry_notification_email", "alerts@example.com")
        frappe.clear_cache(doctype="PropMS Website Settings")
        with patch("propms.website_enquiry.frappe.sendmail", side_effect=RuntimeError("smtp down")), patch(
            "propms.website_enquiry.frappe.log_error"
        ):
            submit_enquiry(**self.payload(message="SMTP failure persistence test"))
        enquiry = self.find_latest()
        self.assertIsNotNone(enquiry)
        self.assertEqual(enquiry.notification_status, "Failed")
        self.assertEqual(enquiry.processing_status, "Needs Attention")

    def test_crm_failure_does_not_rollback_enquiry(self):
        frappe.db.set_single_value("PropMS Website Settings", "enquiry_crm_enabled", 1)
        frappe.clear_cache(doctype="PropMS Website Settings")
        original_get_doc = frappe.get_doc

        def fail_lead(*args, **kwargs):
            if args and isinstance(args[0], dict) and args[0].get("doctype") == "Lead":
                raise RuntimeError("crm down")
            return original_get_doc(*args, **kwargs)

        with patch("propms.website_enquiry.frappe.get_doc", side_effect=fail_lead), patch(
            "propms.website_enquiry.frappe.log_error"
        ):
            submit_enquiry(**self.payload(message="CRM failure persistence test"))
        enquiry = self.find_latest()
        self.assertIsNotNone(enquiry)
        self.assertEqual(enquiry.crm_status, "Failed")
        self.assertEqual(enquiry.processing_status, "Needs Attention")

    def test_duplicate_submission_is_suppressed(self):
        payload = self.payload(message="Duplicate suppression test")
        submit_enquiry(**payload)
        second = submit_enquiry(**self.payload(message="Duplicate suppression test"))
        count = frappe.db.count(ENQUIRY_DOCTYPE, {"email": "m8-test@example.com", "message": "Duplicate suppression test"})
        self.assertEqual(second, {"accepted": True})
        self.assertEqual(count, 1)

    def test_honeypot_does_not_persist(self):
        before = frappe.db.count(ENQUIRY_DOCTYPE, {"email": "m8-test@example.com"})
        result = submit_enquiry(**self.payload(website="https://spam.invalid"))
        after = frappe.db.count(ENQUIRY_DOCTYPE, {"email": "m8-test@example.com"})
        self.assertEqual(result, {"accepted": True})
        self.assertEqual(after, before)

    def test_invalid_boundary_values_are_rejected(self):
        with self.assertRaises(frappe.ValidationError):
            submit_enquiry(**self.payload(email="not-an-email"))
        with self.assertRaises(frappe.ValidationError):
            submit_enquiry(**self.payload(source_page="https://attacker.invalid/"))
        with self.assertRaises(frappe.ValidationError):
            submit_enquiry(**self.payload(marketing_consent="maybe"))
        with self.assertRaises(frappe.ValidationError):
            submit_enquiry(**self.payload(form_started_at=str(time.time() * 1000)))

    def test_notification_escapes_user_content(self):
        frappe.db.set_single_value("PropMS Website Settings", "enquiry_notification_email", "alerts@example.com")
        frappe.clear_cache(doctype="PropMS Website Settings")
        with patch("propms.website_enquiry.frappe.sendmail") as sendmail:
            submit_enquiry(**self.payload(message="<script>alert(1)</script>"))
        html = sendmail.call_args.kwargs["message"]
        self.assertNotIn("<script>", html)
