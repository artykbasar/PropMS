"""Route-scoped public website assets for PropMS.

The old hooks loaded the complete Day marketing stack on every public route.
Keep a tiny brand shell shared, load marketing dependencies only on the home
page, and reserve gallery libraries for property pages.
"""

from html import escape
from pathlib import Path
import re

import frappe
from frappe.website.utils import find_first_image

from propms.website_settings import is_propms_v2_enabled

SHARED_CSS = [
    "/assets/propms/css/website_brand.css",
    "/assets/propms/css/home_icons.css",
]
BRAND_ICON_CSS = [
    "/assets/propms/day/assets/vendor/bootstrap-icons/bootstrap-icons.css",
    "/assets/propms/day/assets/vendor/boxicons/css/boxicons.min.css",
]
SHARED_JS = ["/assets/propms/js/website_brand.js"]

HOME_CSS = [
    "/assets/propms/day/assets/vendor/bootstrap/css/bootstrap-reboot.min.css",
    "/assets/propms/css/home_grid.css",
    "/assets/propms/css/home_bootstrap_utilities.css",
    "/assets/propms/day/assets/css/style.css",
    "/assets/propms/css/home_frappe_compat.css",
]
HOME_RUNTIME_JS = "/assets/propms/js/home_frappe_runtime.js"
HOME_JS = [
    "/assets/propms/js/website_brand.js",
    "/assets/propms/js/home.js",
]

LOGIN_CSS = ["/assets/propms/css/login.css"]

PROPERTY_CSS = [
    *BRAND_ICON_CSS,
    "/assets/propms/day/assets/vendor/bootstrap/css/bootstrap.min.css",
    "/assets/propms/day/assets/vendor/glightbox/css/glightbox.min.css",
    "/assets/propms/day/assets/vendor/swiper/swiper-bundle.min.css",
    "/assets/propms/day/assets/css/style.css",
    "propms_website.bundle.css",
]
PROPERTY_JS = [
    "/assets/propms/day/assets/vendor/bootstrap/js/bootstrap.bundle.min.js",
    "/assets/propms/day/assets/vendor/glightbox/js/glightbox.min.js",
    "/assets/propms/day/assets/vendor/swiper/swiper-bundle.min.js",
    "/assets/propms/js/property_gallery.js",
]


def _request_path() -> str:
    path = getattr(frappe.local, "path", "") or ""
    if not path and getattr(frappe, "request", None):
        path = getattr(frappe.request, "path", "") or ""
    return path.split("?", 1)[0].strip("/")


def _extend_unique(current, extra):
    values = list(current or [])
    for value in extra:
        if value not in values:
            values.append(value)
    return values


def _version_propms_asset(asset: str) -> str:
    prefix = "/assets/propms/"
    if not asset.startswith(prefix):
        return asset
    relative = asset[len(prefix):].split("?", 1)[0]
    try:
        source = Path(frappe.get_app_path("propms", "public", *relative.split("/")))
        version = source.stat().st_mtime_ns
    except (OSError, ValueError):
        return asset
    return f"{asset.split('?', 1)[0]}?v={version}"


def _version_assets(assets):
    return [_version_propms_asset(asset) for asset in assets]


def should_use_lightweight_home(path: str, user: str) -> bool:
    normalized = (path or "").strip("/").lower()
    return normalized in {"", "home"} and user == "Guest"


def get_assets(path: str, lightweight_home: bool = False):
    normalized = (path or "").strip("/")
    lower = normalized.lower()
    css = list(SHARED_CSS)
    js = [] if lower in {"", "home"} else list(SHARED_JS)

    if lower in {"", "home"}:
        css.extend(HOME_CSS)
        if lightweight_home:
            js.append(HOME_RUNTIME_JS)
        js.extend(HOME_JS)
    elif lower == "login":
        css.extend(LOGIN_CSS)
    elif lower.startswith("property/") or lower == "property":
        css.extend(PROPERTY_CSS)
        js.extend(PROPERTY_JS)
    else:
        # Generic public pages still render the shared Day navbar/footer.
        css.extend(BRAND_ICON_CSS)

    return css, js


def normalize_brand_html(brand_html: str, brand_name: str) -> str:
    """Add accessible names without changing the legacy brand artwork."""
    if not brand_html:
        return brand_html

    label = escape((brand_name or "Home").strip(), quote=True)

    def add_image_alt(match):
        tag = match.group(0)
        if re.search(r"\balt\s*=", tag, flags=re.IGNORECASE):
            return tag
        return tag[:-1] + f' alt="{label}">'

    def add_home_link_label(match):
        tag = match.group(0)
        if re.search(r"\baria-label\s*=", tag, flags=re.IGNORECASE):
            return tag
        return tag[:-1] + f' aria-label="{label} home">'

    brand_html = re.sub(r"<img\b[^>]*>", add_image_alt, brand_html, flags=re.IGNORECASE)
    return re.sub(
        r'''<a\b(?=[^>]*\bhref\s*=\s*['"]/['"])[^>]*>''',
        add_home_link_label,
        brand_html,
        flags=re.IGNORECASE,
    )


def _set_home_metadata(context):
    tags = frappe._dict(context.get("metatags") or {})
    image = tags.get("image") or find_first_image(context.get("page_builder_html") or "")
    if image:
        tags["image"] = frappe.utils.get_url(image)
        tags["og:image"] = tags["image"]
        tags["twitter:image"] = tags["image"]
        tags["twitter:card"] = "summary_large_image"

    if tags.get("description"):
        tags["og:description"] = tags["description"]
        tags["twitter:description"] = tags["description"]

    context.metatags = tags


def update_website_context(context):
    path = _request_path()
    if is_propms_v2_enabled():
        from propms.website_routes import apply_m10_context

        if apply_m10_context(context, path):
            return

    normalized_path = (path or "").strip("/").lower()
    if normalized_path in {"", "home"} and is_propms_v2_enabled():
        from propms.website_home import apply_v2_home

        if apply_v2_home(context):
            return

    if context.get("brand_html"):
        context.brand_html = normalize_brand_html(
            context.brand_html, context.get("app_name") or context.get("title_prefix") or "Home"
        )
    lightweight_home = should_use_lightweight_home(path, frappe.session.user)
    css, js = get_assets(path, lightweight_home=lightweight_home)
    context.web_include_css = _extend_unique(context.get("web_include_css"), _version_assets(css))
    context.web_include_js = _extend_unique(context.get("web_include_js"), _version_assets(js))
    if lightweight_home:
        _set_home_metadata(context)
        context.base_template_path = "propms/templates/home_base.html"
        context.web_include_icons = []
