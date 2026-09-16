import frappe

from propms.website_components import render_component
from propms.website_schema import build_schema_graph, serialize_schema
from propms.website_seo import SEOValues, resolve_seo
from propms.website_settings import get_consent_config
from propms.website_v2 import get_asset_version, get_shell, is_preview_enabled


def get_context(context):
    if not is_preview_enabled():
        raise frappe.DoesNotExistError

    context.no_cache = 1
    context.shell = get_shell()
    context.asset_version = get_asset_version()
    context.consent_config = get_consent_config()
    context.page_title = "Website V2 Component Preview"
    context.robots_meta = "noindex, nofollow"
    context.seo = resolve_seo(
        route="/propms-v2-preview",
        explicit=SEOValues(index_state="noindex"),
        generated=SEOValues(
            title="Website V2 Component Preview",
            description="Server-rendered PropMS Website V2 component and SEO preview.",
        ),
    )
    context.top_bar_label = "Website V2 component preview"
    context.breadcrumbs = [
        {"label": "Home", "href": "/"},
        {"label": "Website V2 component preview", "href": None},
    ]
    schema = build_schema_graph(
        page_url=frappe.utils.get_url("/propms-v2-preview"),
        page_name=context.seo.title,
        description=context.seo.description,
        language=context.seo.language,
        breadcrumbs=context.breadcrumbs,
    )
    context.schema_json = serialize_schema(schema)
    context.components = [
        render_component(
            "hero",
            {
                "theme": "default",
                "variant": "split",
                "eyebrow": "PropMS Website V2",
                "title": "Controlled components, shared across brands",
                "description": (
                    "Typed, server-rendered sections with semantic colour choices "
                    "and no page-specific JavaScript."
                ),
                "primary_label": "Explore services",
                "primary_url": "/",
                "secondary_label": "Contact us",
                "secondary_url": "/login",
            },
        ),
        render_component(
            "feature_grid",
            {
                "theme": "soft",
                "variant": "cards",
                "eyebrow": "Why this framework",
                "title": "Built for editors and performance",
                "description": "The same component API works for both rehearsal brands.",
                "items": [
                    {
                        "title": "Typed fields",
                        "description": "Editors choose from documented fields and variants.",
                    },
                    {
                        "title": "Server rendered",
                        "description": "Critical content is present in the initial HTML.",
                    },
                    {
                        "title": "Controlled styling",
                        "description": "Semantic themes replace arbitrary CSS.",
                    },
                ],
            },
        ),
        render_component(
            "service_grid",
            {
                "theme": "default",
                "variant": "cards",
                "title": "Example services",
                "description": "Reusable structured content for later homepage migration.",
                "items": [
                    {
                        "title": "Property management",
                        "description": "Structured service content without custom markup.",
                        "url": "/",
                    },
                    {
                        "title": "Tenant support",
                        "description": "Shared presentation across brands.",
                        "url": "/",
                    },
                    {
                        "title": "Compliance support",
                        "description": "Accessible links and headings by default.",
                        "url": "/",
                    },
                ],
            },
        ),
        render_component(
            "cta",
            {
                "theme": "primary",
                "variant": "default",
                "title": "Ready to talk?",
                "description": "This CTA uses site-level brand tokens, not hard-coded colours.",
                "button_label": "Contact us",
                "button_url": "/login",
            },
        ),
        render_component(
            "contact_location",
            {
                "theme": "soft",
                "variant": "split",
                "title": "Contact and location",
                "description": "A typed foundation for contact and location details.",
                "email": "info@example.com",
                "phone": "+44 20 0000 0000",
                "address": "Rehearsal website preview",
                "map_label": "Return to current site",
                "map_url": "/",
            },
        ),
    ]
    return context
