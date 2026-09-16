from __future__ import annotations

from html import unescape
import re
from urllib.parse import quote, unquote

import frappe
from frappe.utils import sanitize_html, strip_html

from propms.website_catalog import apply_shared_v2_context
from propms.website_schema import build_schema_graph
from propms.website_seo import SEOValues, apply_seo_context, resolve_seo, web_page_explicit_values
from propms.website_settings import is_propms_v2_enabled

PUBLIC_ROUTE_STATUS = (
    ("/login", "v2-shell/native-auth", "noindex", "Frappe login controller and client authentication remain native."),
    ("/me + account routes", "v2-shell/native-account", "noindex", "Native Frappe account controllers and Web Forms render inside the shared V2 shell."),
    ("/policies", "v2", "index", "Published legal Web Page content rendered inside the shared V2 shell."),
    ("/about", "redirect", "n/a", "301 to the authoritative homepage About section."),
    ("/contact", "redirect", "n/a", "301 to the authoritative homepage Contact section."),
    ("/new-developments", "v2", "index", "Published development-project hub; only explicitly public Property records are listed."),
    ("/new-developments/<web_name>", "v2", "index", "Published Property development page with public-field allowlist."),
    ("/instructions/<slug>", "specialised", "noindex", "Shareable published guest guide; noindex + X-Robots-Tag; unpublished guides remain inaccessible."),
    ("404 / error", "v2", "noindex", "Shared V2 error presentation; HTTP status is preserved."),
    ("other Frappe/Desk/private routes", "legacy/native", "n/a", "Not a public marketing migration target for M10."),
)

_SPACE = re.compile(r"\s+")
_GOOGLE_FONT_STYLESHEET = re.compile(
    r'''<link\b[^>]*href=["']https://fonts\.googleapis\.com/[^"']*["'][^>]*>\s*''',
    re.I,
)


def apply_m10_context(context, path: str) -> bool:
    if not is_propms_v2_enabled():
        return False

    normalized = (path or "").strip("/")
    status = int(context.get("http_status_code") or 0)
    template = str(context.get("template") or "")
    is_not_found = template.endswith("404.html") or context.get("name") == "404" or context.get("route") == "404"

    if status >= 400 or is_not_found:
        _apply_error_context(context, status or 404)
        return True
    if normalized == "login":
        _apply_login_context(context)
        return True
    account_template = _native_account_template(normalized)
    if account_template:
        if _is_native_not_permitted_context(context):
            _apply_error_context(context, 403)
        else:
            _apply_native_account_context(context, account_template)
        return True
    if normalized == "new-developments":
        if context.get("template") != "propms/templates/website_v2/property_hub.html":
            _apply_property_hub_context(context)
        return True
    if normalized == "policies" and context.get("doctype") == "Web Page":
        _apply_generic_web_page_context(context)
        return True
    return False


def get_public_development_by_path(path: str):
    normalized = unquote((path or "").strip("/"))
    prefix = "new-developments/"
    if not normalized.lower().startswith(prefix):
        return None
    web_name = normalized[len(prefix):].strip()
    if not web_name:
        return None
    return frappe.db.get_value(
        "Property",
        {"publish_online": 1, "development_project": 1, "web_name": web_name},
        "name",
        cache=True,
    )


def apply_property_context(context, doc) -> None:
    apply_shared_v2_context(context)
    context.template = "propms/property_management_solution/doctype/property/templates/property.html"
    context.page_stylesheets = ("/assets/propms/css/property_v2.css",)
    context.doc = doc
    context.page_title = doc.web_name or doc.name
    context.property_description = sanitize_html(doc.description or "", always_sanitize=True)
    context.property_location = _plain(doc.location)
    context.property_bullets = tuple(
        _plain(row.get("bullet_point")) for row in (doc.get("bullet_points") or []) if _plain(row.get("bullet_point"))
    )
    context.gallery = tuple(
        {"src": row.get("image"), "alt": f"{context.page_title} property image {index}"}
        for index, row in enumerate(doc.get("images") or [], start=1)
        if row.get("image")
    )
    if context.gallery:
        context.page_scripts = ("/assets/propms/js/property_gallery_v2.js",)
    context.public_children = _public_property_children(doc)
    context.breadcrumbs = (
        {"label": "Home", "href": "/"},
        {"label": "New Developments", "href": "/new-developments"},
        {"label": context.page_title, "href": None},
    )
    description = _property_meta_description(doc, context.page_title)
    route = "/new-developments/" + quote(doc.web_name or doc.name, safe="")
    seo = resolve_seo(
        route=route,
        generated=SEOValues(title=f"{context.page_title} | {context.shell.brand_name}", description=description, index_state="index"),
    )
    apply_seo_context(
        context,
        seo,
        build_schema_graph(
            page_url=seo.canonical or frappe.utils.get_url(route),
            page_name=seo.title,
            description=seo.description,
            language=seo.language,
            breadcrumbs=context.breadcrumbs,
        ),
    )


def _apply_login_context(context) -> None:
    apply_shared_v2_context(context, homepage_shell=True)
    context.template = "propms/templates/website_v2/login.html"
    context.robots_meta = "noindex, nofollow"
    context.no_breadcrumbs = 1
    _apply_v2_body_classes(context)


def _is_native_not_permitted_context(context) -> bool:
    template = str(context.get("template") or "")
    title = str(getattr(frappe.local, "message_title", "") or "")
    return template.endswith("message.html") and title == frappe._("Not Permitted")


def _native_account_template(normalized: str) -> str | None:
    if normalized == "me":
        return "propms/templates/website_v2/account_me.html"
    if normalized == "update-password":
        return "propms/templates/website_v2/account_update_password.html"
    if normalized == "third_party_apps":
        return "propms/templates/website_v2/account_third_party_apps.html"
    if normalized == "update-profile" or normalized.startswith("update-profile/"):
        return "propms/templates/website_v2/account_update_profile.html"
    return None


def _apply_native_account_context(context, template: str) -> None:
    apply_shared_v2_context(context, homepage_shell=True)
    context.template = template
    context.robots_meta = "noindex, nofollow"
    context.no_breadcrumbs = 1
    context.banner_html = ""
    context.theme = frappe._dict(name="Standard")
    context.head_html = _GOOGLE_FONT_STYLESHEET.sub("", str(context.get("head_html") or ""))
    _apply_v2_body_classes(context, "v2-account")


def _apply_v2_body_classes(context, *extra: str) -> None:
    values = [context.get("body_class"), "v2-home-parity", *extra]
    context.body_class = " ".join(dict.fromkeys(value for value in values if value))


def _apply_generic_web_page_context(context) -> None:
    doc = frappe.get_cached_doc("Web Page", context.get("name") or "policies")
    apply_shared_v2_context(context)
    context.template = "propms/templates/website_v2/generic_page.html"
    context.page_stylesheets = ("/assets/propms/css/generic_page.css",)
    context.page_title = doc.title
    context.generic_content = sanitize_html(context.get("main_section") or "", always_sanitize=True)
    context.breadcrumbs = ({"label": "Home", "href": "/"}, {"label": doc.title, "href": None})
    description = doc.meta_description or _summary(context.generic_content) or f"{doc.title} for {context.shell.brand_name}."
    seo = resolve_seo(
        route="/" + doc.route.strip("/"),
        explicit=web_page_explicit_values(doc),
        generated=SEOValues(title=f"{doc.title} | {context.shell.brand_name}", description=description, index_state="index"),
    )
    apply_seo_context(
        context,
        seo,
        build_schema_graph(
            page_url=seo.canonical or frappe.utils.get_url("/" + doc.route.strip("/")),
            page_name=seo.title,
            description=seo.description,
            language=seo.language,
            breadcrumbs=context.breadcrumbs,
        ),
    )


def _apply_property_hub_context(context) -> None:
    apply_shared_v2_context(context)
    context.template = "propms/templates/website_v2/property_hub.html"
    context.page_stylesheets = ("/assets/propms/css/property_v2.css",)
    context.page_title = "New Developments"
    context.breadcrumbs = ({"label": "Home", "href": "/"}, {"label": "New Developments", "href": None})
    context.properties = frappe.get_all(
        "Property",
        filters={"publish_online": 1, "development_project": 1},
        fields=["name", "web_name", "location", "description"],
        order_by="web_name asc",
    )
    description = f"Explore published property developments from {context.shell.brand_name}."
    seo = resolve_seo(
        route="/new-developments",
        generated=SEOValues(title=f"New Developments | {context.shell.brand_name}", description=description, index_state="index"),
    )
    apply_seo_context(
        context,
        seo,
        build_schema_graph(
            page_url=seo.canonical or frappe.utils.get_url("/new-developments"),
            page_name=seo.title,
            description=seo.description,
            language=seo.language,
            breadcrumbs=context.breadcrumbs,
        ),
    )


def _apply_error_context(context, status: int) -> None:
    apply_shared_v2_context(context)
    context.template = "propms/templates/website_v2/error.html"
    if status == 404:
        context.page_title = "Page not found"
        context.error_message = "The page you requested could not be found."
    elif status == 403:
        context.page_title = "Access denied"
        context.error_message = "You do not have permission to view this page."
    else:
        context.page_title = "Something went wrong"
        context.error_message = "We could not complete this request."
    context.error_status = status
    context.seo = resolve_seo(route="/error", explicit=SEOValues(title=context.page_title, description=context.error_message, index_state="noindex"))
    context.no_breadcrumbs = 1


def _public_property_children(doc):
    rows = []
    for child in doc.get_children() or []:
        if not child.publish_online:
            continue
        images = [row.get("image") for row in (child.get("images") or []) if row.get("image")]
        rows.append(
            frappe._dict(
                title=child.web_name or child.name,
                href=_public_property_href(child),
                image=images[0] if images else None,
            )
        )
    return tuple(rows)


def _public_property_href(doc) -> str:
    if doc.development_project:
        return "/new-developments/" + quote(doc.web_name or doc.name, safe="")
    route = (doc.route or "").strip()
    return route if route.startswith("/") else "/" + route if route else ""


def _property_meta_description(doc, title: str) -> str:
    description = _summary(doc.description or "")
    return description or f"View public details and images for {title}, a published property development."


def _summary(value: str, limit: int = 160) -> str:
    text = _plain(value)
    if len(text) <= limit:
        return text
    return text[: limit - 1].rsplit(" ", 1)[0] + "…"


def _plain(value) -> str:
    return _SPACE.sub(" ", unescape(strip_html(value or ""))).strip()


def redirect_m10_section_routes():
    if not is_propms_v2_enabled():
        return
    request = getattr(frappe.local, "request", None)
    if not request:
        return
    target = {"/about": "/#about", "/contact": "/#contact"}.get(request.path.rstrip("/"))
    if not target:
        return
    frappe.local.flags.redirect_location = target
    raise frappe.Redirect(301)
