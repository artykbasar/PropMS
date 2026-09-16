import frappe

from propms.website_settings import LEGACY_DAY, SETTINGS_DOCTYPE, VALID_WEBSITE_ENGINES


def execute():
    current = frappe.db.get_single_value(SETTINGS_DOCTYPE, "website_engine")
    if current not in VALID_WEBSITE_ENGINES:
        frappe.db.set_single_value(SETTINGS_DOCTYPE, "website_engine", LEGACY_DAY)
