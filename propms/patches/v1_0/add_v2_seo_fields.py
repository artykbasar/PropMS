import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields


WEB_PAGE_FIELDS = [
    {
        "fieldname": "propms_seo_section",
        "label": "PropMS Website V2 SEO",
        "fieldtype": "Section Break",
        "insert_after": "meta_image",
    },
    {
        "fieldname": "propms_index_state",
        "label": "Index State",
        "fieldtype": "Select",
        "options": "\nindex\nnoindex",
        "insert_after": "propms_seo_section",
    },
    {
        "fieldname": "propms_canonical_url",
        "label": "Canonical URL",
        "fieldtype": "Data",
        "description": "Leave empty for deterministic route-based canonical generation.",
        "insert_after": "propms_index_state",
    },
]


def execute():
    create_custom_fields({"Web Page": WEB_PAGE_FIELDS}, update=True)
    frappe.clear_cache(doctype="Web Page")
