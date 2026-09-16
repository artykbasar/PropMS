import frappe
from frappe.rate_limiter import rate_limit
from frappe.utils import validate_email_address


@frappe.whitelist(allow_guest=True)
@rate_limit(limit=30, seconds=60 * 60)
def subscribe_to_newsletter(email: str):
    """Subscribe to an explicitly configured website newsletter group.

    Do not create site data/configuration implicitly. An administrator can create
    an Email Group named "Website Newsletter" or "Newsletter" when signup is wanted.
    """
    email = validate_email_address(email, throw=True)
    group = next(
        (name for name in ("Website Newsletter", "Newsletter") if frappe.db.exists("Email Group", name)),
        None,
    )
    if not group:
        return {"configured": False, "added": False}

    filters = {"email_group": group, "email": email}
    if frappe.db.exists("Email Group Member", filters):
        return {"configured": True, "added": False}

    frappe.get_doc({"doctype": "Email Group Member", **filters}).insert(ignore_permissions=True)
    return {"configured": True, "added": True}
