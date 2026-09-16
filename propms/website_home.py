from __future__ import annotations

import frappe
from frappe.website.doctype.web_page.web_page import get_web_blocks_html

from propms.website_native_settings import get_native_shell_values
from propms.website_schema import build_schema_graph, serialize_schema
from propms.website_seo import SEOValues, resolve_seo
from propms.website_settings import get_consent_config
from propms.website_v2 import get_asset_version, get_shell


V2_HOME_TEMPLATES = {
    "PropMS V2 Hero",
    "PropMS V2 Media Content Split",
    "PropMS V2 Feature Grid",
    "PropMS V2 Service Grid",
    "PropMS V2 Area Grid",
    "PropMS V2 CTA",
    "PropMS V2 Contact Location",
}


def apply_v2_home(context) -> bool:
    """Render the native Frappe Page Builder home inside the shared V2 shell."""
    page = frappe.get_cached_doc("Web Page", "home")
    if page.content_type != "Page Builder" or not _uses_v2_blocks(page):
        return False

    shell = get_shell()
    rendered = get_web_blocks_html(page.page_blocks)
    context.template = "propms/templates/website_v2/home.html"
    context.shell = shell
    context.asset_version = get_asset_version()
    context.build_version = context.asset_version
    context.consent_config = get_consent_config()
    context.home_parity = True
    context.update(get_native_shell_values(homepage_shell=True))
    context.no_breadcrumbs = 1
    context.full_width = 1
    context.style = ""
    context.script = ""
    context.page_builder_html = rendered.html
    context.page_builder_styles = rendered.styles
    context.page_builder_scripts = rendered.scripts

    seo = resolve_seo(
        route="/",
        explicit=SEOValues(
            title=page.meta_title or page.title or shell.brand_name,
            description=page.meta_description or None,
            social_image=page.meta_image or _first_image(page),
        ),
    )
    context.seo = seo
    context.schema_json = serialize_schema(
        build_schema_graph(
            page_url=seo.canonical or frappe.utils.get_url("/"),
            page_name=seo.title,
            description=seo.description,
            language=seo.language,
        )
    )
    return True


def _uses_v2_blocks(page) -> bool:
    blocks = list(page.page_blocks or [])
    return bool(blocks) and all(block.web_template in V2_HOME_TEMPLATES for block in blocks)


def _first_image(page) -> str | None:
    for block in page.page_blocks or []:
        values = frappe.parse_json(block.web_template_values or "{}")
        for fieldname in ("image", "background_image"):
            image = values.get(fieldname)
            if image:
                return image
        for item in values.get("items") or []:
            if item.get("image"):
                return item["image"]
    return None
