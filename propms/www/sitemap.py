# Copyright (c) 2026, contributors

from urllib.parse import quote, urlsplit

import frappe
from frappe.utils import get_url
from frappe.website.router import get_pages

from propms.website_settings import is_propms_v2_enabled

no_cache = 1
base_template_path = "www/sitemap.xml"
EXCLUDED_SITEMAP_DOCTYPES = {"Property Instruction"}
V2_STATIC_ROUTES = ("", "policies", "services", "areas", "new-developments")
V2_DETAIL_PREFIXES = ("services/", "areas/")


def get_context(context):
    """Generate a canonical-only sitemap without fabricated modification dates."""
    links = _get_v2_links() if is_propms_v2_enabled() else _get_legacy_links()
    return {"links": _deduplicate_links(links)}


def _get_v2_links():
    page_seo = _web_page_seo_by_route()
    links = []

    for route in V2_STATIC_ROUTES:
        data = page_seo.get(route) or {}
        if route == "policies" and data and not _include_web_page(route, data):
            continue
        links.append(_link(route, data.get("modified")))

    for route, data in get_filtered_public_pages_from_doctypes().items():
        if _include_v2_detail_route(route):
            links.append(_link(route, data.get("modified")))

    if frappe.db.exists("DocType", "Property"):
        for row in frappe.get_all(
            "Property",
            filters={"publish_online": 1, "development_project": 1},
            fields=["web_name", "modified"],
        ):
            if row.web_name:
                links.append(_link(f"new-developments/{row.web_name}", row.modified))

    return links


def _get_legacy_links():
    page_seo = _web_page_seo_by_route()
    links = []
    for route, page in get_pages().items():
        if not page.sitemap or not _include_web_page(route, page_seo.get(route)):
            continue
        data = page_seo.get(route) or {}
        links.append(_link(page.name, data.get("modified")))

    links.extend(
        _link(route, data.get("modified"))
        for route, data in get_filtered_public_pages_from_doctypes().items()
    )
    return links


def get_filtered_public_pages_from_doctypes():
    """Return guest-view document routes except doctypes explicitly excluded from sitemap."""
    from frappe.www.sitemap import get_public_pages_from_doctypes

    routes = get_public_pages_from_doctypes()
    return {
        route: data
        for route, data in routes.items()
        if data.get("doctype") not in EXCLUDED_SITEMAP_DOCTYPES
    }


def _web_page_seo_by_route():
    if not frappe.db.exists("DocType", "Web Page"):
        return {}
    fields = ["route", "modified", "propms_index_state", "propms_canonical_url"]
    rows = frappe.get_all("Web Page", filters={"published": 1}, fields=fields)
    return {row.route: row for row in rows if row.route}


def _include_v2_detail_route(route):
    normalized = (route or "").strip("/")
    if not normalized or "<" in normalized or ">" in normalized:
        return False
    return normalized.startswith(V2_DETAIL_PREFIXES)


def _include_web_page(route, data):
    if not data:
        return True
    if data.get("propms_index_state") == "noindex":
        return False
    canonical = (data.get("propms_canonical_url") or "").strip()
    if not canonical:
        return True
    if canonical.startswith(("http://", "https://")):
        parsed = urlsplit(canonical)
        if parsed.netloc.lower() != urlsplit(get_url()).netloc.lower():
            return False
        canonical = parsed.path
    return canonical.strip("/") == route.strip("/")


def _link(route, modified=None):
    normalized = (route or "").strip("/")
    path = "/" if not normalized else f"/{quote(normalized, safe='/')}"
    return {"loc": get_url(path), "lastmod": _format_modified(modified)}


def _deduplicate_links(links):
    unique = {}
    for link in links:
        unique.setdefault(link["loc"].rstrip("/") or link["loc"], link)
    return list(unique.values())


def _format_modified(value):
    return value.strftime("%Y-%m-%d") if value else None
