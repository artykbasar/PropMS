import frappe
from frappe.utils import get_url


DEFAULTS = {
    "seo_default_language": "en-GB",
    "seo_default_index_state": "index",
    "schema_business_type": "Organization",
    "schema_country": "GB",
}


def execute():
    website = frappe.get_cached_doc("Website Settings")
    brand_name = website.app_name or website.title_prefix or "PropMS"
    defaults = {
        **DEFAULTS,
        "seo_default_title": brand_name,
        "seo_default_description": f"Property services from {brand_name}.",
        "seo_base_url": get_url().rstrip("/"),
        "schema_business_name": brand_name,
    }
    for fieldname, value in defaults.items():
        if not frappe.db.get_single_value("PropMS Website Settings", fieldname):
            frappe.db.set_single_value("PropMS Website Settings", fieldname, value)
    frappe.clear_cache(doctype="PropMS Website Settings")
