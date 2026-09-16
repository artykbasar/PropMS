import re
from urllib.parse import urlsplit

import frappe
from frappe.model.document import Document


DESIGN_TOKEN_FIELDS = (
    "brand_primary",
    "brand_secondary",
    "brand_accent",
    "brand_background",
    "brand_surface",
    "brand_text",
)
HEX_COLOUR = re.compile(r"^#[0-9A-Fa-f]{6}$")
GA_MEASUREMENT_ID = re.compile(r"^G-[A-Z0-9]{6,20}$")
LANGUAGE_CODE = re.compile(r"^[a-z]{2}(?:-[A-Z][a-z]{3})?(?:-(?:[A-Z]{2}|[0-9]{3}))?$")


class PropMSWebsiteSettings(Document):
    def validate(self):
        for fieldname in DESIGN_TOKEN_FIELDS:
            value = self.get(fieldname)
            if value and not HEX_COLOUR.fullmatch(value):
                frappe.throw(frappe._("{0} must be a six-digit hex colour.").format(self.meta.get_label(fieldname)))

        if self.seo_default_language and not LANGUAGE_CODE.fullmatch(self.seo_default_language):
            frappe.throw("Default Language must use a code such as en, en-GB, or zh-Hant.")

        if self.seo_base_url:
            parsed = urlsplit(self.seo_base_url.strip())
            if parsed.scheme not in {"http", "https"} or not parsed.netloc:
                frappe.throw("Canonical Base URL must be an absolute HTTP(S) URL.")

        if self.seo_default_social_image:
            from propms.website_media import validate_media_for_usage

            validate_media_for_usage(self.seo_default_social_image, "social-preview")

        if self.analytics_provider == "Google Analytics":
            measurement_id = (self.analytics_measurement_id or "").strip().upper()
            if not GA_MEASUREMENT_ID.fullmatch(measurement_id):
                frappe.throw("Google Analytics requires a valid G- measurement ID.")
            self.analytics_measurement_id = measurement_id
        elif self.analytics_measurement_id:
            self.analytics_measurement_id = ""

        if self.consent_privacy_url:
            parsed = urlsplit(self.consent_privacy_url.strip())
            if parsed.scheme or parsed.netloc or not self.consent_privacy_url.startswith("/"):
                frappe.throw("Privacy / Cookie Policy URL must be a local path beginning with /.")
