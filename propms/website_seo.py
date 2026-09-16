from __future__ import annotations

import re
from dataclasses import dataclass, field
from urllib.parse import urljoin, urlsplit, urlunsplit

import frappe
from frappe.utils import get_url


HREFLANG_CODE = re.compile(r"^[a-z]{2}(?:-[A-Z][a-z]{3})?(?:-(?:[A-Z]{2}|[0-9]{3}))?$")
VALID_INDEX_STATES = {"index", "noindex"}


@dataclass(frozen=True)
class SEOValues:
    title: str | None = None
    description: str | None = None
    canonical: str | None = None
    index_state: str | None = None
    social_image: str | None = None
    language: str | None = None
    alternates: dict[str, str] = field(default_factory=dict)


@dataclass(frozen=True)
class ResolvedSEO:
    title: str
    description: str
    canonical: str | None
    robots: str
    social_image: str | None
    language: str
    hreflang: tuple[tuple[str, str], ...]
    twitter_card: str


def resolve_seo(
    *, route: str, explicit: SEOValues | None = None, generated: SEOValues | None = None
) -> ResolvedSEO:
    explicit = explicit or SEOValues()
    generated = generated or SEOValues()
    settings = frappe.get_cached_doc("PropMS Website Settings")
    website = frappe.get_cached_doc("Website Settings")

    default_title = (
        settings.get("seo_default_title") or website.app_name or website.title_prefix or "PropMS"
    )
    default_description = settings.get("seo_default_description") or default_title
    title = _first(explicit.title, generated.title, default_title)
    description = _first(explicit.description, generated.description, default_description)
    language = _first(
        explicit.language,
        generated.language,
        settings.get("seo_default_language"),
        frappe.local.lang,
        "en",
    )
    social_image = _first(
        explicit.social_image, generated.social_image, settings.get("seo_default_social_image")
    )
    index_state = _first(
        explicit.index_state,
        generated.index_state,
        settings.get("seo_default_index_state"),
        "index",
    )
    if index_state not in VALID_INDEX_STATES:
        raise frappe.ValidationError("PropMS SEO index state must be index or noindex.")
    if not HREFLANG_CODE.fullmatch(language):
        raise frappe.ValidationError(f"Invalid PropMS page language: {language}")
    robots = "noindex, nofollow" if index_state == "noindex" else "index, follow"

    canonical = None
    hreflang: tuple[tuple[str, str], ...] = ()
    if index_state != "noindex":
        canonical = _canonical_url(
            explicit.canonical or generated.canonical or route, settings.get("seo_base_url")
        )
        alternates = dict(generated.alternates)
        alternates.update(explicit.alternates)
        resolved = [(language, canonical)]
        for code, value in sorted(alternates.items()):
            if not HREFLANG_CODE.fullmatch(code):
                raise frappe.ValidationError(f"Invalid PropMS hreflang code: {code}")
            if code == language:
                continue
            resolved.append((code, _canonical_url(value, settings.get("seo_base_url"))))
        resolved.append(("x-default", canonical))
        hreflang = tuple(_dedupe_pairs(resolved))

    if social_image:
        social_image = _canonical_url(social_image, settings.get("seo_base_url"))

    return ResolvedSEO(
        title=title,
        description=description,
        canonical=canonical,
        robots=robots,
        social_image=social_image,
        language=language,
        hreflang=hreflang,
        twitter_card="summary_large_image" if social_image else "summary",
    )


def apply_seo_context(context, seo: ResolvedSEO, schema_graph: dict | None = None) -> None:
    context.seo = seo
    if schema_graph:
        from propms.website_schema import serialize_schema

        context.schema_json = serialize_schema(schema_graph)


def web_page_explicit_values(doc) -> SEOValues:
    return SEOValues(
        title=doc.get("meta_title"),
        description=doc.get("meta_description"),
        canonical=doc.get("propms_canonical_url"),
        index_state=doc.get("propms_index_state"),
        social_image=doc.get("meta_image"),
    )


def validate_web_page_seo(doc, method=None) -> None:
    canonical = (doc.get("propms_canonical_url") or "").strip()
    if canonical and not _is_http_or_relative(canonical):
        frappe.throw("PropMS Canonical URL must be an HTTP(S) URL or a site-relative path.")
    if doc.get("propms_index_state") == "noindex" and canonical:
        frappe.throw("A noindex page must not define a PropMS Canonical URL.")
    if doc.get("meta_image") and _uses_propms_v2_seo(doc):
        from propms.website_media import validate_media_for_usage

        validate_media_for_usage(doc.get("meta_image"), "social-preview")


def _uses_propms_v2_seo(doc) -> bool:
    if doc.get("propms_index_state") or doc.get("propms_canonical_url"):
        return True
    from propms.website_components import COMPONENT_TEMPLATES

    templates = set(COMPONENT_TEMPLATES.values())
    return any(block.get("web_template") in templates for block in (doc.get("page_blocks") or []))


def _canonical_url(value: str, configured_base: str | None) -> str:
    base = _normalise_base(configured_base or get_url())
    raw = (value or "/").strip()
    if raw.startswith("http://") or raw.startswith("https://"):
        parsed = urlsplit(raw)
        return urlunsplit(
            (parsed.scheme.lower(), parsed.netloc.lower(), _normalise_path(parsed.path), "", "")
        )
    return urljoin(base + "/", _normalise_path(raw).lstrip("/"))


def _normalise_base(value: str) -> str:
    parsed = urlsplit(value.strip())
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise frappe.ValidationError("PropMS SEO Base URL must be an absolute HTTP(S) URL.")
    return urlunsplit((parsed.scheme.lower(), parsed.netloc.lower(), "", "", "")).rstrip("/")


def _normalise_path(value: str) -> str:
    path = "/" + value.split("?", 1)[0].split("#", 1)[0].strip("/")
    return "/" if path == "/" else path.rstrip("/")


def _is_http_or_relative(value: str) -> bool:
    return value.startswith("/") or value.startswith("http://") or value.startswith("https://")


def _first(*values):
    for value in values:
        if isinstance(value, str):
            value = value.strip()
        if value:
            return value
    return ""


def _dedupe_pairs(values):
    seen = set()
    for item in values:
        if item not in seen:
            seen.add(item)
            yield item
