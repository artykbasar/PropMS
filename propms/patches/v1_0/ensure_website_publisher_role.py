import frappe


def execute():
    if not frappe.db.exists("Role", "Website Publisher"):
        frappe.get_doc({"doctype": "Role", "role_name": "Website Publisher", "desk_access": 1}).insert(ignore_permissions=True)
