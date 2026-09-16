from __future__ import annotations

from typing import Final

import frappe


SETTINGS_DOCTYPE: Final = "PropMS Website Settings"
LEGACY_DAY: Final = "legacy_day"
PROPMS_V2: Final = "propms_v2"
VALID_WEBSITE_ENGINES: Final = frozenset({LEGACY_DAY, PROPMS_V2})


def get_website_engine() -> str:
    """Return the active website engine for the current site."""
    value = frappe.db.get_single_value(SETTINGS_DOCTYPE, "website_engine")
    return value if value in VALID_WEBSITE_ENGINES else LEGACY_DAY


def is_propms_v2_enabled() -> bool:
    """Return whether Website V2 is active for the current site."""
    return get_website_engine() == PROPMS_V2


def get_consent_config() -> dict:
    """Return controlled per-site consent and analytics configuration."""
    settings = frappe.get_cached_doc(SETTINGS_DOCTYPE)
    provider = settings.get("analytics_provider") or "None"
    measurement_id = (settings.get("analytics_measurement_id") or "").strip()
    return {
        "privacy_url": (settings.get("consent_privacy_url") or "/policies").strip() or "/policies",
        "analytics_provider": provider,
        "analytics_measurement_id": measurement_id if provider == "Google Analytics" else "",
    }
