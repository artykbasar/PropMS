import frappe
from frappe.utils import get_url


no_cache = 1
base_template_path = "www/robots.txt"


def get_context(context):
    """Preserve configured rules and advertise the canonical sitemap."""
    configured = (
        frappe.db.get_single_value("Website Settings", "robots_txt")
        or (frappe.local.conf.robots_txt and frappe.read_file(frappe.local.conf.robots_txt))
        or ""
    ).strip()
    rules = configured or "User-agent: *\nAllow: /"
    sitemap = f"Sitemap: {get_url('/sitemap.xml')}"
    if sitemap not in rules.splitlines():
        rules = f"{rules.rstrip()}\n\n{sitemap}"
    return {"robots_txt": rules}
