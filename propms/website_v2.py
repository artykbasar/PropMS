from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

import frappe
from frappe.utils import get_build_version


HEX_COLOUR = re.compile(r"^#[0-9A-Fa-f]{6}$")
CARD_HOVER_STYLES = {"shadow", "brand-fill", "lift-brand-fill"}

LEGACY_TOKEN_FIELDS = {
    "--brand-primary": "brand_primary",
    "--brand-secondary": "brand_secondary",
    "--brand-accent": "brand_accent",
    "--brand-background": "brand_background",
    "--brand-surface": "brand_surface",
    "--brand-text": "brand_text",
}

SAFE_TOKEN_DEFAULTS = {
    "--brand-primary": "#2563EB",
    "--brand-secondary": "#111827",
    "--brand-accent": "#60A5FA",
    "--brand-background": "#F4F4F4",
    "--brand-surface": "#FFFFFF",
    "--brand-text": "#444444",
    "--brand-dark": "#111827",
    "--brand-light": "#F4F4F4",
    "--brand-border": "#E5E7EB",
}

V2_ASSET_FILES = (
    ("public", "css", "website_v2.css"),
    ("public", "css", "home_v2.css"),
    ("public", "css", "account_v2.css"),
    ("public", "js", "website_v2.js"),
)


@dataclass(frozen=True)
class WebsiteV2Shell:
    brand_name: str
    logo_url: str | None
    favicon_url: str | None
    design_tokens: dict[str, str]
    language: str
    theme_name: str
    card_hover_style: str


def get_asset_version() -> str:
    latest_mtime = 0
    for path_parts in V2_ASSET_FILES:
        try:
            source = Path(frappe.get_app_path("propms", *path_parts))
            latest_mtime = max(latest_mtime, source.stat().st_mtime_ns)
        except (OSError, ValueError):
            continue
    return str(latest_mtime or get_build_version())


def _safe_colour(value: str | None, fallback: str) -> str:
    return value if value and HEX_COLOUR.fullmatch(value) else fallback


def _theme_link_colour(theme, fieldname: str) -> str | None:
    value = theme.get(fieldname) if theme else None
    if not value:
        return None
    if HEX_COLOUR.fullmatch(str(value)):
        return str(value)
    return frappe.get_cached_value("Color", value, "color")


def _relative_luminance(colour: str) -> float:
    channels = [int(colour[index : index + 2], 16) / 255 for index in (1, 3, 5)]
    linear = [
        channel / 12.92 if channel <= 0.04045 else ((channel + 0.055) / 1.055) ** 2.4
        for channel in channels
    ]
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]


def _contrast_ratio(first: str, second: str) -> float:
    lighter, darker = sorted((_relative_luminance(first), _relative_luminance(second)), reverse=True)
    return (lighter + 0.05) / (darker + 0.05)


def _best_foreground(background: str, candidates: list[str]) -> str:
    return max(candidates, key=lambda colour: _contrast_ratio(background, colour))


def _selected_theme(website_settings):
    name = website_settings.get("website_theme")
    if not name or not frappe.db.exists("Website Theme", name):
        return None
    return frappe.get_cached_doc("Website Theme", name)


def get_design_tokens() -> dict[str, str]:
    website_settings = frappe.get_cached_doc("Website Settings")
    theme = _selected_theme(website_settings)
    legacy = frappe.get_cached_doc("PropMS Website Settings")
    sources = {
        "--brand-primary": _theme_link_colour(theme, "primary_color"),
        "--brand-secondary": theme.get("propms_secondary_color") if theme else None,
        "--brand-accent": theme.get("propms_accent_color") if theme else None,
        "--brand-background": _theme_link_colour(theme, "background_color"),
        "--brand-surface": theme.get("propms_surface_color") if theme else None,
        "--brand-text": _theme_link_colour(theme, "text_color"),
        "--brand-dark": _theme_link_colour(theme, "dark_color"),
        "--brand-light": _theme_link_colour(theme, "light_color"),
        "--brand-border": theme.get("propms_border_color") if theme else None,
    }
    tokens = {}
    for token, fallback in SAFE_TOKEN_DEFAULTS.items():
        legacy_field = LEGACY_TOKEN_FIELDS.get(token)
        legacy_value = legacy.get(legacy_field) if legacy_field else None
        tokens[token] = _safe_colour(sources.get(token) or legacy_value, fallback)
    candidates = [tokens["--brand-dark"], tokens["--brand-surface"], tokens["--brand-text"]]
    tokens["--brand-on-primary"] = _best_foreground(tokens["--brand-primary"], candidates)
    tokens["--brand-on-secondary"] = _best_foreground(tokens["--brand-secondary"], candidates)
    return tokens


def get_shell() -> WebsiteV2Shell:
    website_settings = frappe.get_cached_doc("Website Settings")
    theme = _selected_theme(website_settings)
    hover_style = theme.get("propms_card_hover_style") if theme else None
    if hover_style not in CARD_HOVER_STYLES:
        hover_style = "brand-fill"
    logo = website_settings.banner_image or website_settings.footer_logo or website_settings.favicon or None
    return WebsiteV2Shell(
        brand_name=website_settings.app_name or website_settings.title_prefix or "PropMS",
        logo_url=logo,
        favicon_url=website_settings.favicon or logo,
        design_tokens=get_design_tokens(),
        language=frappe.local.lang or "en",
        theme_name=website_settings.website_theme or "Standard",
        card_hover_style=hover_style,
    )


def is_preview_enabled() -> bool:
    return bool(frappe.conf.get("propms_v2_preview_enabled"))
