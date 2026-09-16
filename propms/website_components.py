from __future__ import annotations

import re
from collections.abc import Mapping
from urllib.parse import urlparse

import frappe
from frappe import _

from propms.website_media import validate_image_text_policy, validate_media_for_usage


COMPONENT_TEMPLATES = {
    "hero": "PropMS V2 Hero",
    "media_content_split": "PropMS V2 Media Content Split",
    "feature_grid": "PropMS V2 Feature Grid",
    "service_grid": "PropMS V2 Service Grid",
    "area_grid": "PropMS V2 Area Grid",
    "cta": "PropMS V2 CTA",
    "contact_location": "PropMS V2 Contact Location",
}

APPROVED_COMPONENT_CATALOGUE = (
    "Hero",
    "Rich Content",
    "Media + Content Split",
    "Feature / Benefit Grid",
    "Service Grid",
    "Area Grid",
    "Statistics",
    "Trust / Accreditation Strip",
    "Testimonial / Quote",
    "Logo / Platform Strip",
    "CTA",
    "Contact / Enquiry",
    "Location / Map",
    "Gallery",
    "Questions / Answers",
)

URL_FIELD_SUFFIXES = ("_url", "_link", "_href")
SAFE_SCHEMES = {"", "http", "https", "mailto", "tel"}
SECTION_ID_PATTERN = re.compile(r"^[a-z][a-z0-9-]*$")
OWNED_MEDIA_PREFIXES = ("/files/", "/private/files/", "/assets/")


def render_component(component: str, values: Mapping | None = None) -> str:
    """Render one approved V2 component after validating its typed values."""
    template_name = COMPONENT_TEMPLATES.get(component)
    if not template_name:
        frappe.throw(_("Unsupported PropMS V2 component: {0}").format(component))

    if values is not None and not isinstance(values, Mapping):
        frappe.throw(_("PropMS V2 component configuration must be an object"))
    parsed_values = dict(values or {})
    validate_component_values(template_name, parsed_values)
    return frappe.get_cached_doc("Web Template", template_name).render(parsed_values)


def validate_web_page_components(doc, method=None):
    """Enforce controlled configuration for PropMS V2 blocks on Web Pages."""
    v2_blocks = [
        block for block in (doc.get("page_blocks") or [])
        if block.web_template in COMPONENT_TEMPLATES.values()
    ]
    if not v2_blocks:
        return

    if doc.get("javascript") or doc.get("css"):
        frappe.throw(_("PropMS V2 pages cannot use custom JavaScript or CSS"))

    for block in v2_blocks:
        if block.get("css_class"):
            frappe.throw(_("PropMS V2 components cannot use custom CSS classes"))
        values = _parse_values(block.web_template_values)
        validate_component_values(block.web_template, values)
        if doc.get("published"):
            _validate_component_media_for_publish(block.web_template, values)


def validate_component_values(template_name: str, values: Mapping) -> None:
    """Validate values against the approved Web Template field schema."""
    if template_name not in COMPONENT_TEMPLATES.values():
        frappe.throw(_("Web Template {0} is not an approved PropMS V2 component").format(template_name))

    if not isinstance(values, Mapping):
        frappe.throw(_("PropMS V2 component configuration must be an object"))
    parsed_values = dict(values)
    fields, tables = _template_schema(template_name)
    allowed_keys = set(fields) | set(tables)
    unexpected = sorted(set(parsed_values) - allowed_keys)
    if unexpected:
        frappe.throw(_("Unsupported component field(s): {0}").format(", ".join(unexpected)))

    _validate_field_values(fields, parsed_values)
    _validate_component_media_text(template_name, parsed_values)
    for table_name, table_fields in tables.items():
        rows = parsed_values.get(table_name) or []
        if not isinstance(rows, list):
            frappe.throw(_("Component field {0} must be a list").format(table_name))
        for row in rows:
            if not isinstance(row, Mapping):
                frappe.throw(_("Rows in component field {0} must be objects").format(table_name))
            unexpected_row = sorted(set(row) - set(table_fields))
            if unexpected_row:
                frappe.throw(_("Unsupported component field(s): {0}").format(", ".join(unexpected_row)))
            _validate_field_values(table_fields, row)


def _parse_values(values: Mapping | str | None) -> dict:
    parsed = frappe.parse_json(values or {})
    if not isinstance(parsed, Mapping):
        frappe.throw(_("PropMS V2 component configuration must be an object"))
    return dict(parsed)


def _template_schema(template_name: str) -> tuple[dict, dict[str, dict]]:
    template = frappe.get_cached_doc("Web Template", template_name)
    fields = {}
    tables: dict[str, dict] = {}
    current_table = None

    for field in template.fields:
        if field.fieldtype == "Table Break":
            current_table = field.fieldname
            tables[current_table] = {}
        elif current_table:
            tables[current_table][field.fieldname] = field
        else:
            fields[field.fieldname] = field

    return fields, tables


def _validate_field_values(fields: dict, values: Mapping) -> None:
    for fieldname, field in fields.items():
        value = values.get(fieldname)
        if value in (None, ""):
            if field.reqd:
                frappe.throw(_("Component field {0} is required").format(fieldname))
            continue
        if field.fieldtype == "Select":
            options = {option.strip() for option in (field.options or "").splitlines() if option.strip()}
            if value not in options:
                frappe.throw(_("Invalid value for component field {0}").format(fieldname))
        if fieldname == "section_id" and not SECTION_ID_PATTERN.fullmatch(str(value)):
            frappe.throw(_("Section ID must use lowercase letters, numbers, and hyphens."))
        if field.fieldtype == "Attach Image" and not str(value).startswith(OWNED_MEDIA_PREFIXES):
            frappe.throw(_("Component images must use site-owned files or assets."))
        if fieldname.endswith(URL_FIELD_SUFFIXES):
            _validate_url(fieldname, value)


def _validate_url(fieldname: str, value) -> None:
    if not isinstance(value, str):
        frappe.throw(_("Component field {0} must be text").format(fieldname))
    parsed = urlparse(value.strip())
    if parsed.scheme.lower() not in SAFE_SCHEMES:
        frappe.throw(_("Unsafe URL scheme in component field {0}").format(fieldname))


def _validate_component_media_text(template_name: str, values: Mapping) -> None:
    image = values.get("image")
    if image and template_name in {"PropMS V2 Hero", "PropMS V2 Media Content Split"}:
        validate_image_text_policy(
            image,
            alt=str(values.get("image_alt") or ""),
            decorative=bool(values.get("image_decorative")),
        )
    if template_name == "PropMS V2 Area Grid":
        for item in values.get("items") or []:
            if item.get("image") and not str(item.get("image_alt") or "").strip():
                frappe.throw(_("Image alternative text is required for area and logo images."))


def _validate_component_media_for_publish(template_name: str, values: Mapping) -> None:
    image = values.get("image")
    if not image:
        return
    if template_name == "PropMS V2 Hero":
        validate_media_for_usage(image, "hero")
    elif template_name == "PropMS V2 Media Content Split":
        validate_media_for_usage(image, "content")
