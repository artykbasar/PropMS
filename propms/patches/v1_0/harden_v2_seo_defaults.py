import frappe


def execute():
    website = frappe.get_cached_doc("Website Settings")
    brand_name = website.app_name or website.title_prefix or "PropMS"

    if not frappe.db.get_single_value("PropMS Website Settings", "seo_default_index_state"):
        frappe.db.set_single_value("PropMS Website Settings", "seo_default_index_state", "index")

    description = frappe.db.get_single_value("PropMS Website Settings", "seo_default_description")
    if not description or description == brand_name:
        frappe.db.set_single_value(
            "PropMS Website Settings",
            "seo_default_description",
            f"Property services from {brand_name}.",
        )

    frappe.clear_cache(doctype="PropMS Website Settings")
