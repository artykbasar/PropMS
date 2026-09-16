from __future__ import annotations

import json
from dataclasses import dataclass

import frappe


ALLOWED_BUSINESS_TYPES = {"Organization", "LocalBusiness"}
ALLOWED_SCHEMA_TYPES = {
    "Organization",
    "LocalBusiness",
    "WebSite",
    "WebPage",
    "BreadcrumbList",
    "Service",
}


@dataclass(frozen=True)
class BusinessFacts:
    name: str
    url: str
    business_type: str = "Organization"
    logo: str | None = None
    email: str | None = None
    telephone: str | None = None
    street_address: str | None = None
    locality: str | None = None
    region: str | None = None
    postal_code: str | None = None
    country: str | None = None


def business_facts_from_settings(canonical_url: str | None) -> BusinessFacts:
    settings = frappe.get_cached_doc("PropMS Website Settings")
    website = frappe.get_cached_doc("Website Settings")
    name = (
        settings.get("schema_business_name") or website.app_name or website.title_prefix or "PropMS"
    )
    business_type = settings.get("schema_business_type") or "Organization"
    return BusinessFacts(
        name=name,
        url=settings.get("seo_base_url") or canonical_url or frappe.utils.get_url(),
        business_type=business_type,
        logo=website.banner_image or website.favicon or None,
        email=settings.get("schema_email"),
        telephone=settings.get("schema_phone"),
        street_address=settings.get("schema_street_address"),
        locality=settings.get("schema_locality"),
        region=settings.get("schema_region"),
        postal_code=settings.get("schema_postal_code"),
        country=settings.get("schema_country"),
    )


def build_schema_graph(
    *,
    page_url: str,
    page_name: str,
    description: str,
    language: str,
    breadcrumbs=(),
    service_name: str | None = None,
) -> dict:
    facts = business_facts_from_settings(page_url)
    business_id = facts.url.rstrip("/") + "#organization"
    website_id = facts.url.rstrip("/") + "#website"
    page_id = page_url.rstrip("/") + "#webpage"
    graph = [
        _business_node(facts, business_id),
        {
            "@type": "WebSite",
            "@id": website_id,
            "url": facts.url,
            "name": facts.name,
            "publisher": {"@id": business_id},
        },
        {
            "@type": "WebPage",
            "@id": page_id,
            "url": page_url,
            "name": page_name,
            "description": description,
            "inLanguage": language,
            "isPartOf": {"@id": website_id},
            "about": {"@id": business_id},
        },
    ]
    if breadcrumbs:
        graph.append(_breadcrumb_node(page_url, breadcrumbs))
    if service_name:
        graph.append(
            {
                "@type": "Service",
                "name": service_name,
                "url": page_url,
                "provider": {"@id": business_id},
            }
        )
    result = {"@context": "https://schema.org", "@graph": graph}
    validate_schema(result)
    return result


def serialize_schema(value: dict) -> str:
    validate_schema(value)
    return json.dumps(value, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")


def validate_schema(value: dict) -> None:
    if value.get("@context") != "https://schema.org" or not isinstance(value.get("@graph"), list):
        raise frappe.ValidationError("Invalid PropMS schema graph.")
    for node in value["@graph"]:
        schema_type = node.get("@type")
        if schema_type not in ALLOWED_SCHEMA_TYPES:
            raise frappe.ValidationError(f"Unsupported PropMS schema type: {schema_type}")
        if (
            schema_type in {"Organization", "LocalBusiness", "WebSite", "WebPage", "Service"}
            and not node.get("name")
        ):
            raise frappe.ValidationError(f"{schema_type} schema requires name.")
        if schema_type in {"Organization", "LocalBusiness", "WebSite", "WebPage", "Service"} and not str(
            node.get("url", "")
        ).startswith(("http://", "https://")):
            raise frappe.ValidationError(f"{schema_type} schema requires an absolute URL.")


def _business_node(facts: BusinessFacts, node_id: str) -> dict:
    if facts.business_type not in ALLOWED_BUSINESS_TYPES:
        raise frappe.ValidationError("PropMS business schema type must be Organization or LocalBusiness.")
    node = {
        "@type": facts.business_type,
        "@id": node_id,
        "name": facts.name,
        "url": facts.url,
    }
    if facts.logo:
        node["logo"] = (
            facts.logo
            if facts.logo.startswith(("http://", "https://"))
            else frappe.utils.get_url(facts.logo)
        )
    if facts.email:
        node["email"] = facts.email
    if facts.telephone:
        node["telephone"] = facts.telephone
    address = {
        "streetAddress": facts.street_address,
        "addressLocality": facts.locality,
        "addressRegion": facts.region,
        "postalCode": facts.postal_code,
        "addressCountry": facts.country,
    }
    address = {key: val for key, val in address.items() if val}
    if address:
        node["address"] = {"@type": "PostalAddress", **address}
    return node


def _breadcrumb_node(page_url: str, breadcrumbs) -> dict:
    items = []
    for position, item in enumerate(breadcrumbs, 1):
        url = item.get("url") or item.get("href") or page_url
        if not url.startswith(("http://", "https://")):
            url = frappe.utils.get_url(url)
        items.append(
            {"@type": "ListItem", "position": position, "name": item["label"], "item": url}
        )
    return {"@type": "BreadcrumbList", "itemListElement": items}
