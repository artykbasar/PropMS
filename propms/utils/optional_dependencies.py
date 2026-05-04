import frappe


def is_app_installed(app_name):
    try:
        return app_name in (frappe.get_installed_apps() or [])
    except Exception:
        return False


def safe_get_meta(doctype):
    try:
        return frappe.get_meta(doctype)
    except Exception:
        return None


def doctype_exists(doctype):
    try:
        return bool(frappe.db.exists("DocType", doctype))
    except Exception:
        return safe_get_meta(doctype) is not None


def field_exists(doctype, fieldname):
    meta = safe_get_meta(doctype)
    return bool(meta and meta.has_field(fieldname))


def get_value_if_field_exists(doctype, name, fieldname, default=None):
    if not doctype_exists(doctype) or not field_exists(doctype, fieldname):
        return default

    try:
        value = frappe.db.get_value(doctype, name, fieldname)
        return default if value is None else value
    except Exception:
        return default