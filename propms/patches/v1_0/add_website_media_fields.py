import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields


FILE_FIELDS = [
    {"fieldname": "website_media_section", "label": "Website Media", "fieldtype": "Section Break", "insert_after": "file_size"},
    {"fieldname": "website_media_enabled", "label": "Generate Website Media", "fieldtype": "Check", "default": "0", "insert_after": "website_media_section"},
    {"fieldname": "website_alt_text", "label": "Website Alt Text", "fieldtype": "Small Text", "insert_after": "website_media_enabled"},
    {"fieldname": "website_is_decorative", "label": "Decorative Image", "fieldtype": "Check", "default": "0", "insert_after": "website_alt_text"},
    {"fieldname": "website_media_status", "label": "Optimisation Status", "fieldtype": "Select", "options": "\npending\nprocessing\nready\nfailed\nunsupported", "read_only": 1, "insert_after": "website_is_decorative"},
    {"fieldname": "website_media_width", "label": "Image Width", "fieldtype": "Int", "read_only": 1, "insert_after": "website_media_status"},
    {"fieldname": "website_media_height", "label": "Image Height", "fieldtype": "Int", "read_only": 1, "insert_after": "website_media_width"},
    {"fieldname": "website_media_aspect_ratio", "label": "Aspect Ratio", "fieldtype": "Data", "read_only": 1, "insert_after": "website_media_height"},
    {"fieldname": "website_media_derivatives", "label": "Responsive Derivatives", "fieldtype": "Long Text", "read_only": 1, "hidden": 1, "insert_after": "website_media_aspect_ratio"},
    {"fieldname": "website_media_error", "label": "Optimisation Error", "fieldtype": "Small Text", "read_only": 1, "insert_after": "website_media_derivatives"},
    {"fieldname": "website_media_is_derivative", "label": "Website Media Derivative", "fieldtype": "Check", "default": "0", "hidden": 1, "read_only": 1, "insert_after": "website_media_error"},
    {"fieldname": "website_media_source_file", "label": "Website Media Source File", "fieldtype": "Link", "options": "File", "hidden": 1, "read_only": 1, "insert_after": "website_media_is_derivative"},
    {"fieldname": "website_media_profile", "label": "Website Media Profile", "fieldtype": "Data", "hidden": 1, "read_only": 1, "insert_after": "website_media_source_file"},
    {"fieldname": "website_media_format", "label": "Website Media Format", "fieldtype": "Data", "hidden": 1, "read_only": 1, "insert_after": "website_media_profile"},
]


def execute():
    create_custom_fields({"File": FILE_FIELDS}, update=True)
    frappe.clear_cache(doctype="File")
