from __future__ import annotations

import re
from contextlib import contextmanager
from difflib import SequenceMatcher
from html import unescape
from urllib.parse import urlsplit

import frappe
from frappe import _
from frappe.utils import now_datetime, sanitize_html
from frappe.website.website_generator import WebsiteGenerator

from propms.website_native_settings import get_native_shell_values
from propms.website_schema import build_schema_graph
from propms.website_seo import SEOValues, apply_seo_context, resolve_seo
from propms.website_settings import get_consent_config
from propms.website_v2 import get_asset_version, get_shell

PLACEHOLDER_PATTERN = re.compile(r"\b(?:todo|tbd|lorem ipsum|placeholder|coming soon|insert text)\b", re.I)
TAG_PATTERN = re.compile(r"<[^>]+>")
SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
PUBLICATION_FLAG = "propms_structured_content_publication"
MIN_UNIQUE_WORDS = 120
MIN_TOTAL_WORDS = 300
MAX_SIMILARITY = 0.80


class StructuredWebsitePage(WebsiteGenerator):
    route_prefix = ""
    title_field = "title"
    content_fields: tuple[str, ...] = ()
    relationship_fields: tuple[tuple[str, str], ...] = ()
    media_alt_pairs: tuple[tuple[str, str], ...] = ()
    publication_required_fields: tuple[str, ...] = ()
    website = frappe._dict(condition_field="published", page_title_field="title")

    def validate(self):
        self._normalise_slug_and_route()
        self._validate_publication_fields_are_server_managed()
        self._validate_relationships()
        self._validate_media_alt_policy()
        self._validate_no_placeholders_in_publication_fields()
        super().validate()

    def _normalise_slug_and_route(self):
        slug = (self.slug or "").strip().lower()
        if not SLUG_PATTERN.fullmatch(slug):
            frappe.throw(_("Slug must use lowercase letters, numbers, and single hyphens only."))
        self.slug = slug
        self.route = f"{self.route_prefix}/{slug}"

    def _validate_publication_fields_are_server_managed(self):
        managed = ("publication_status", "published", "index_state", "approved_by", "approved_on")
        if frappe.flags.get(PUBLICATION_FLAG):
            return
        previous = None if self.is_new() else self.get_doc_before_save()
        expected = {"publication_status": "Draft", "published": 0, "index_state": "noindex", "approved_by": None, "approved_on": None}
        for fieldname in managed:
            before = previous.get(fieldname) if previous else expected[fieldname]
            if self.get(fieldname) != before:
                frappe.throw(_("Publication state is managed by Website Publisher approval actions."))

    def _validate_relationships(self):
        for fieldname, link_field in self.relationship_fields:
            seen = set()
            for row in self.get(fieldname) or []:
                target = row.get(link_field)
                if not target:
                    continue
                if target in seen:
                    frappe.throw(_("Duplicate relationship in {0}: {1}").format(self.meta.get_label(fieldname), target))
                seen.add(target)
                if target == self.name and row.get("parenttype") == self.doctype:
                    frappe.throw(_("A page cannot relate to itself."))

    def _validate_media_alt_policy(self):
        for media_field, alt_field in self.media_alt_pairs:
            if self.get(media_field) and not (self.get(alt_field) or "").strip():
                frappe.throw(_("{0} is required when {1} is set.").format(self.meta.get_label(alt_field), self.meta.get_label(media_field)))
        for row in self.get("optional_sections") or []:
            if row.image and not (row.image_alt or "").strip():
                frappe.throw(_("Image Alt Text is required for optional section images."))

    def _validate_no_placeholders_in_publication_fields(self):
        for fieldname in self.content_fields + ("seo_title", "seo_description", "cta_title", "cta_text", "cta_label"):
            if PLACEHOLDER_PATTERN.search(_plain_text(self.get(fieldname))):
                frappe.throw(_("{0} contains placeholder text.").format(self.meta.get_label(fieldname)))
        for row in self.get("optional_sections") or []:
            if PLACEHOLDER_PATTERN.search(_plain_text(row.body)):
                frappe.throw(_("Optional section {0} contains placeholder text.").format(row.heading))

    def validate_publication_quality(self):
        for fieldname in self.publication_required_fields:
            value = _plain_text(self.get(fieldname))
            if not value:
                frappe.throw(_("{0} is required before publication.").format(self.meta.get_label(fieldname)))
            if fieldname in self.content_fields and len(value) < 60:
                frappe.throw(_("{0} needs substantive content before publication.").format(self.meta.get_label(fieldname)))
        title = _plain_text(self.get(self.title_field))
        if not title or len(title) > 90:
            frappe.throw(_("The page H1 must be present and no longer than 90 characters."))
        seo_title = _plain_text(self.seo_title)
        if not 30 <= len(seo_title) <= 65:
            frappe.throw(_("SEO Title must be between 30 and 65 characters."))
        seo_description = _plain_text(self.seo_description)
        if not 120 <= len(seo_description) <= 170:
            frappe.throw(_("SEO Description must be between 120 and 170 characters."))
        body = " ".join(_plain_text(self.get(field)) for field in self.content_fields)
        words = body.split()
        if len(words) < MIN_TOTAL_WORDS or len(set(word.lower() for word in words)) < MIN_UNIQUE_WORDS:
            frappe.throw(_("Publication requires at least 300 words of substantive content with meaningful vocabulary."))
        if not any(self.get(fieldname) for fieldname, _ in self.relationship_fields):
            frappe.throw(_("Publication requires at least one internal relationship."))
        _validate_cta_url(self.cta_url)
        _validate_canonical(self.canonical_url, self.route)
        self._validate_near_duplicate_content(body)

    def _validate_near_duplicate_content(self, body: str):
        rows = frappe.get_all(
            self.doctype,
            filters={"name": ["!=", self.name], "publication_status": "Approved"},
            fields=["name", *self.content_fields],
            order_by="modified desc",
            limit=200,
        )
        normalised = _normalise_comparison_text(body)
        for row in rows:
            candidate = _normalise_comparison_text(" ".join(_plain_text(row.get(field)) for field in self.content_fields))
            if candidate and SequenceMatcher(None, normalised, candidate).ratio() > MAX_SIMILARITY:
                frappe.throw(_("Content is too similar to approved page {0}; add genuinely unique information before publishing.").format(row.name))

    def get_context(self, context):
        apply_structured_page_context(context, self)
        return context


@frappe.whitelist()
def approve_for_publication(doctype: str, name: str):
    _require_website_publisher()
    doc = frappe.get_doc(doctype, name)
    if doctype not in {"PropMS Service", "PropMS Area"}:
        frappe.throw(_("Unsupported structured website DocType."))
    doc.validate_publication_quality()
    with _publication_mutation():
        doc.publication_status = "Approved"
        doc.published = 1
        doc.index_state = "index"
        doc.approved_by = frappe.session.user
        doc.approved_on = now_datetime()
        doc.save()
    return {"route": "/" + doc.route, "published": True}


@frappe.whitelist()
def withdraw_publication(doctype: str, name: str):
    _require_website_publisher()
    doc = frappe.get_doc(doctype, name)
    if doctype not in {"PropMS Service", "PropMS Area"}:
        frappe.throw(_("Unsupported structured website DocType."))
    with _publication_mutation():
        doc.publication_status = "Draft"
        doc.published = 0
        doc.index_state = "noindex"
        doc.approved_by = None
        doc.approved_on = None
        doc.save()
    return {"published": False}


def apply_structured_page_context(context, doc):
    apply_shared_v2_context(context)
    context.page_stylesheets = ("/assets/propms/css/structured_content.css",)
    context.doc = doc
    context.content = {field: sanitize_html(doc.get(field) or "", always_sanitize=True) for field in doc.content_fields}
    context.optional_sections = [frappe._dict(heading=row.heading, body=sanitize_html(row.body or "", always_sanitize=True), image=row.image, image_alt=row.image_alt) for row in (doc.optional_sections or [])]
    context.page_title = doc.get(doc.title_field)
    context.breadcrumbs = (
        {"label": "Home", "href": "/"},
        {"label": doc.hub_label, "href": f"/{doc.route_prefix}"},
        {"label": context.page_title, "href": None},
    )
    context.related_services = _published_relationships(doc.related_services, "service", "PropMS Service", "title", "services") if hasattr(doc, "related_services") else []
    context.related_areas = _published_relationships(getattr(doc, "related_areas", None), "area", "PropMS Area", "area_name", "areas")
    context.nearby_areas = _published_relationships(getattr(doc, "nearby_areas", None), "area", "PropMS Area", "area_name", "areas")
    route = "/" + doc.route
    seo = resolve_seo(
        route=route,
        explicit=SEOValues(
            title=doc.seo_title,
            description=doc.seo_description,
            canonical=doc.canonical_url or None,
            index_state="index" if doc.published and doc.publication_status == "Approved" else "noindex",
            social_image=doc.social_image or doc.hero_image or None,
        ),
    )
    schema = build_schema_graph(
        page_url=seo.canonical or frappe.utils.get_url(route),
        page_name=seo.title,
        description=seo.description,
        language=seo.language,
        breadcrumbs=context.breadcrumbs,
        service_name=doc.title if doc.doctype == "PropMS Service" else None,
    )
    apply_seo_context(context, seo, schema)


def apply_shared_v2_context(context, *, homepage_shell: bool = False):
    shell = get_shell()
    context.shell = shell
    context.asset_version = get_asset_version()
    context.build_version = context.asset_version
    context.consent_config = get_consent_config()
    context.home_parity = True
    context.update(get_native_shell_values(homepage_shell=homepage_shell))


def get_hub_context(context, *, doctype: str, title_field: str, hub: str, title: str, description: str):
    apply_shared_v2_context(context)
    context.page_stylesheets = ("/assets/propms/css/structured_content.css",)
    context.page_title = title
    context.hub_description = description
    context.items = frappe.get_all(doctype, filters={"published": 1, "publication_status": "Approved", "index_state": "index"}, fields=["name", title_field, "slug", "summary" if doctype == "PropMS Service" else "region", "hero_image", "hero_image_alt"], order_by=f"{title_field} asc")
    context.item_title_field = title_field
    context.breadcrumbs = ({"label": "Home", "href": "/"}, {"label": title, "href": None})
    route = f"/{hub}"
    seo = resolve_seo(route=route, generated=SEOValues(title=f"{title} | {context.shell.brand_name}", description=description, index_state="index"))
    apply_seo_context(context, seo, build_schema_graph(page_url=seo.canonical or frappe.utils.get_url(route), page_name=seo.title, description=seo.description, language=seo.language, breadcrumbs=context.breadcrumbs))
    return context


def _published_relationships(rows, link_field, doctype, title_field, prefix):
    names = [row.get(link_field) for row in (rows or []) if row.get(link_field)]
    if not names:
        return []
    records = frappe.get_all(doctype, filters={"name": ["in", names], "published": 1, "publication_status": "Approved"}, fields=["name", title_field, "slug"])
    by_name = {row.name: row for row in records}
    return [{"title": by_name[name].get(title_field), "href": f"/{prefix}/{by_name[name].slug}"} for name in names if name in by_name]


def _validate_cta_url(value):
    value = (value or "").strip()
    if value.startswith("/"):
        return
    parsed = urlsplit(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        frappe.throw(_("CTA URL must be a local path or absolute HTTP(S) URL."))


def _validate_canonical(value, route):
    value = (value or "").strip()
    if not value:
        return
    if value.startswith("/"):
        if value.rstrip("/") != ("/" + route).rstrip("/"):
            frappe.throw(_("Canonical URL must reference this page's own route."))
        return
    parsed = urlsplit(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc or parsed.query or parsed.fragment:
        frappe.throw(_("Canonical URL must be a clean absolute HTTP(S) URL or the page's local route."))
    settings = frappe.get_cached_doc("PropMS Website Settings")
    expected = urlsplit(settings.get("seo_base_url") or frappe.utils.get_url())
    if parsed.netloc.lower() != expected.netloc.lower():
        frappe.throw(_("Canonical URL must use this site's configured canonical host."))
    if parsed.path.rstrip("/") != ("/" + route).rstrip("/"):
        frappe.throw(_("Canonical URL must reference this page's own route."))


def _plain_text(value):
    return " ".join(unescape(TAG_PATTERN.sub(" ", str(value or ""))).split())


def _normalise_comparison_text(value):
    return re.sub(r"[^a-z0-9 ]+", "", value.lower())


def _require_website_publisher():
    if frappe.session.user == "Administrator":
        return
    if "Website Publisher" not in frappe.get_roles():
        frappe.throw(_("Website Publisher approval is required."), frappe.PermissionError)


@contextmanager
def _publication_mutation():
    previous = frappe.flags.get(PUBLICATION_FLAG)
    frappe.flags[PUBLICATION_FLAG] = True
    try:
        yield
    finally:
        if previous is None:
            frappe.flags.pop(PUBLICATION_FLAG, None)
        else:
            frappe.flags[PUBLICATION_FLAG] = previous
