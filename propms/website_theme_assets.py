import re
from pathlib import Path

import frappe


_APP_PUBLIC_IMPORT = re.compile(
    r'@import\s*(["\'])(?P<app>[A-Za-z0-9_]+)/public/(?P<asset>[^"\']+)\1\s*;'
)


def rewrite_app_public_imports(stylesheet: str) -> str:
    """Make app-public imports absolute inside Frappe-generated theme CSS."""

    def replace(match: re.Match) -> str:
        asset = match.group("asset")
        if ".." in Path(asset).parts:
            return match.group(0)
        return f'@import"/assets/{match.group("app")}/{asset}";'

    return _APP_PUBLIC_IMPORT.sub(replace, stylesheet)


def normalize_generated_theme_asset(doc, method=None) -> None:
    """Repair relative app-public imports emitted by Frappe theme compilation."""
    theme_url = str(doc.get("theme_url") or "")
    if not theme_url.startswith("/files/website_theme/"):
        return

    public_root = Path(frappe.get_site_path("public")).resolve()
    stylesheet_path = (public_root / theme_url.lstrip("/")).resolve()
    if public_root not in stylesheet_path.parents or not stylesheet_path.is_file():
        return

    stylesheet = stylesheet_path.read_text(encoding="utf-8")
    normalized = rewrite_app_public_imports(stylesheet)
    if normalized != stylesheet:
        stylesheet_path.write_text(normalized, encoding="utf-8")


def prepare_v2_theme_assets() -> None:
    """Ensure PropMS-configured Website Themes have site-local compiled assets."""
    if not frappe.get_meta("Website Theme").has_field("propms_managed_theme"):
        return

    theme_names = frappe.get_all(
        "Website Theme",
        filters={"propms_managed_theme": 1},
        pluck="name",
    )
    for theme_name in theme_names:
        theme = frappe.get_doc("Website Theme", theme_name)
        if _generated_theme_asset_exists(theme.get("theme_url")):
            normalize_generated_theme_asset(theme)
            continue
        theme.save(ignore_permissions=True)


def _generated_theme_asset_exists(theme_url: str | None) -> bool:
    value = str(theme_url or "")
    if not value.startswith("/files/website_theme/"):
        return False
    public_root = Path(frappe.get_site_path("public")).resolve()
    path = (public_root / value.lstrip("/")).resolve()
    return public_root in path.parents and path.is_file()
