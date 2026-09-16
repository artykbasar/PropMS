from __future__ import annotations

from collections import defaultdict
from urllib.parse import urlsplit

import frappe
from frappe import _
from frappe.utils import cint


SOCIAL_FIELDS = (
    ("X", "propms_x_url"),
    ("Facebook", "propms_facebook_url"),
    ("Instagram", "propms_instagram_url"),
    ("LinkedIn", "propms_linkedin_url"),
    ("Google", "propms_google_url"),
)


def get_native_shell_values(*, homepage_shell: bool = False):
    """Map Frappe website records into the controlled V2 shell."""
    settings = frappe.get_cached_doc("Website Settings")
    contact = frappe.get_cached_doc("Contact Us Settings")
    home_route = get_website_home_route(settings)
    footer_details = _contact_details(settings, contact)
    footer_groups = _footer_groups(settings, home_route)
    social = _social_links(settings)
    call_to_action_url = _safe_url(settings.call_to_action_url)
    return frappe._dict(
        website_home_href=home_route,
        home_logo_url=settings.banner_image or settings.footer_logo or settings.favicon or None,
        home_logo_layers=(),
        top_bar_items=_contact_links(footer_details),
        top_bar_social=social,
        language_picker=_language_picker(settings),
        primary_navigation=_navigation(settings, home_route, homepage_shell),
        footer_details=footer_details,
        footer_groups=footer_groups,
        footer_navigation=_flatten_footer_groups(footer_groups),
        footer_social=social,
        footer_newsletter_enabled=not cint(settings.hide_footer_signup),
        footer_copyright_brand=settings.app_name or settings.title_prefix or "PropMS",
        footer_copyright_text=settings.copyright or "",
        footer_logo=settings.footer_logo or None,
        footer_powered=settings.footer_powered or None,
        navbar_search=bool(settings.navbar_search),
        navbar_call_to_action=(
            {"label": settings.call_to_action, "href": call_to_action_url}
            if settings.call_to_action and call_to_action_url
            else None
        ),
        show_footer_on_login=bool(settings.show_footer_on_login),
    )


def get_website_home_route(settings=None) -> str:
    if frappe.session.user == "Guest":
        return "/"
    settings = settings or frappe.get_cached_doc("Website Settings")
    route = str(settings.home_page or "home").strip("/") or "home"
    return f"/{route}"


def _contact_details(settings, contact) -> dict:
    return {
        "brand": settings.app_name or settings.title_prefix or "PropMS",
        "address": _contact_address(contact) or _plain_website_address(settings.address),
        "phone": contact.get("phone") or "",
        "email": contact.get("email_id") or "",
    }


def _contact_links(details: dict) -> tuple[dict, ...]:
    items = []
    if details.get("email"):
        items.append({"label": details["email"], "href": f"mailto:{details['email']}"})
    if details.get("phone"):
        phone_href = "".join(
            character for character in str(details["phone"]) if character.isdigit() or character == "+"
        )
        items.append({"label": details["phone"], "href": f"tel:{phone_href}"})
    return tuple(items)


def _social_links(settings) -> tuple[dict, ...]:
    items = []
    for label, fieldname in SOCIAL_FIELDS:
        href = _safe_url(settings.get(fieldname))
        if href and urlsplit(href).scheme in {"http", "https"}:
            items.append({"label": label, "href": href})
    return tuple(items)


def _contact_address(contact) -> str:
    fields = ("address_line1", "address_line2", "city", "state", "pincode", "country")
    return ", ".join(str(contact.get(field)).strip() for field in fields if contact.get(field))


def _plain_website_address(value) -> str:
    address = str(value or "").strip()
    return address if address and "<" not in address and ">" not in address else ""


def _language_picker(settings):
    if frappe.session.user != "Guest" or not cint(settings.show_language_picker):
        return None
    code = getattr(frappe.local, "lang", None) or "en"
    name = frappe.get_cached_value("Language", code, "language_name") or code
    return {"code": code, "name": name}


def _navigation(settings, home_route: str, homepage_shell: bool) -> tuple[dict, ...]:
    configured = _configured_navigation(settings, home_route)
    items = list(configured or _default_navigation(home_route, homepage_shell))
    if frappe.session.user == "Guest":
        if not cint(settings.hide_login) and not _has_href(items, "/login"):
            items.append({"label": _("Login"), "href": "/login"})
    elif not _has_href(items, "/me"):
        items.append({"label": _("My Account"), "href": "/me"})
    return tuple(items)


def _configured_navigation(settings, home_route: str) -> tuple[dict, ...]:
    rows = list(settings.top_bar_items or [])
    if not rows:
        return ()
    children = defaultdict(list)
    for row in rows:
        if row.parent_label:
            children[row.parent_label].append(row)

    items = []
    for row in rows:
        if row.parent_label:
            continue
        child_items = _valid_row_items(children.get(row.label, []), home_route)
        item = _row_item(row, home_route)
        if child_items:
            item["children"] = child_items
        if item.get("href") or child_items:
            items.append(item)
    return tuple(items)


def _default_navigation(home_route: str, homepage_shell: bool) -> tuple[dict, ...]:
    areas_href = f"{home_route}#clients" if homepage_shell else "/areas"
    services_href = f"{home_route}#services" if homepage_shell else "/services"
    return (
        {"label": _("Home"), "href": home_route},
        {"label": _("About Us"), "href": f"{home_route}#about"},
        {"label": _("Why Us"), "href": f"{home_route}#why-us"},
        {"label": _("Areas"), "href": areas_href},
        {"label": _("Services"), "href": services_href},
        {"label": _("Contact"), "href": f"{home_route}#contact"},
    )


def _row_item(row, home_route: str) -> dict:
    return {
        "label": row.label,
        "href": _normalise_url(row.url, home_route) if row.url else None,
        "open_in_new_tab": bool(row.open_in_new_tab),
    }


def _valid_row_items(rows, home_route: str) -> tuple[dict, ...]:
    items = tuple(_row_item(row, home_route) for row in rows)
    return tuple(item for item in items if item.get("href"))


def _normalise_url(url: str, home_route: str) -> str | None:
    value = _safe_url(url)
    if not value:
        return None
    if home_route != "/" and value in {"/", "/#"}:
        return home_route
    if home_route != "/" and value.startswith("/#"):
        return home_route + value[1:]
    return value


def _safe_url(url: str | None) -> str | None:
    value = str(url or "").strip()
    if not value:
        return None
    if value.startswith(("/", "#")):
        return value
    scheme = urlsplit(value).scheme.lower()
    if scheme in {"http", "https", "mailto", "tel"}:
        return value
    if not scheme and ":" not in value:
        return f"/{value.lstrip('/')}"
    return None


def _footer_groups(settings, home_route: str) -> tuple[dict, ...]:
    rows = list(settings.footer_items or [])
    if not rows:
        return _default_footer_groups(home_route)

    children = defaultdict(list)
    for row in rows:
        if row.parent_label:
            children[row.parent_label].append(row)

    groups = []
    standalone = []
    for row in rows:
        if row.parent_label:
            continue
        child_rows = children.get(row.label, [])
        if child_rows:
            groups.append({
                "label": row.label,
                "items": _valid_row_items(child_rows, home_route),
            })
        elif row.url:
            item = _row_item(row, home_route)
            if item.get("href"):
                standalone.append(item)
    if standalone:
        groups.append({"label": _("Useful Links"), "items": tuple(standalone)})
    return tuple(group for group in groups if group["items"])


def _default_footer_groups(home_route: str) -> tuple[dict, ...]:
    return (
        {
            "label": _("Useful Links"),
            "items": (
                {"label": _("Policies"), "href": "/policies", "open_in_new_tab": False},
                {
                    "label": _("Contact Us"),
                    "href": f"{home_route}#contact",
                    "open_in_new_tab": False,
                },
            ),
        },
    )


def _flatten_footer_groups(groups) -> tuple[dict, ...]:
    return tuple(item for group in groups for item in group.get("items", ()))


def _has_href(items, href: str) -> bool:
    for item in items:
        if item.get("href") == href:
            return True
        if _has_href(item.get("children") or (), href):
            return True
    return False
