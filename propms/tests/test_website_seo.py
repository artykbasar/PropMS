import json

import frappe
from frappe.tests import IntegrationTestCase

from propms.website_schema import build_schema_graph, serialize_schema, validate_schema
from propms.website_seo import SEOValues, resolve_seo, validate_web_page_seo
from propms.www.sitemap import _include_v2_detail_route, _include_web_page


class TestWebsiteSEO(IntegrationTestCase):
    def setUp(self):
        self.settings = frappe.get_doc("PropMS Website Settings")
        self.website = frappe.get_cached_doc("Website Settings")

    def test_metadata_precedence_explicit_generated_default(self):
        self.settings.seo_default_title = "Site default title"
        self.settings.seo_default_description = "Site default description"
        self.settings.save()

        seo = resolve_seo(
            route="/services/management",
            explicit=SEOValues(title="Explicit title"),
            generated=SEOValues(title="Generated title", description="Generated description"),
        )
        self.assertEqual(seo.title, "Explicit title")
        self.assertEqual(seo.description, "Generated description")

    def test_site_default_is_brand_specific(self):
        self.settings.seo_default_title = self.website.app_name
        self.settings.seo_default_index_state = "index"
        self.settings.save()
        seo = resolve_seo(route="/example")
        self.assertEqual(seo.title, self.website.app_name)
        self.assertEqual(seo.robots, "index, follow")

    def test_canonical_is_deterministic(self):
        self.settings.seo_base_url = "https://Example.test/"
        self.settings.save()
        seo = resolve_seo(route="/services/management/?ref=campaign#top")
        self.assertEqual(seo.canonical, "https://example.test/services/management")
        self.assertIn((seo.language, seo.canonical), seo.hreflang)
        self.assertIn(("x-default", seo.canonical), seo.hreflang)

    def test_noindex_omits_canonical_and_hreflang(self):
        seo = resolve_seo(route="/preview", explicit=SEOValues(index_state="noindex", canonical="/other"))
        self.assertEqual(seo.robots, "noindex, nofollow")
        self.assertIsNone(seo.canonical)
        self.assertEqual(seo.hreflang, ())

    def test_hreflang_accepts_future_locale_routes(self):
        self.settings.seo_base_url = "https://example.test"
        self.settings.save()
        seo = resolve_seo(
            route="/services",
            generated=SEOValues(alternates={"fr": "/fr/services", "de": "/de/services"}),
        )
        self.assertIn(("fr", "https://example.test/fr/services"), seo.hreflang)
        self.assertIn(("de", "https://example.test/de/services"), seo.hreflang)
        self.assertIn(("x-default", "https://example.test/services"), seo.hreflang)

        same_language = resolve_seo(
            route="/services",
            generated=SEOValues(alternates={"en-GB": "/duplicate", "fr": "/fr/services"}),
        )
        self.assertEqual(sum(code == "en-GB" for code, _ in same_language.hreflang), 1)

    def test_hreflang_rejects_invalid_language_code(self):
        with self.assertRaises(frappe.ValidationError):
            resolve_seo(route="/services", generated=SEOValues(alternates={"eng": "/services"}))

    def test_sitemap_excludes_noindex_and_non_self_canonical_pages(self):
        self.assertFalse(_include_web_page("private", frappe._dict(propms_index_state="noindex")))
        self.assertFalse(
            _include_web_page(
                "duplicate",
                frappe._dict(propms_index_state="index", propms_canonical_url="/canonical"),
            )
        )
        self.assertTrue(
            _include_web_page(
                "canonical",
                frappe._dict(propms_index_state="index", propms_canonical_url="/canonical"),
            )
        )
        self.assertFalse(
            _include_web_page(
                "canonical",
                frappe._dict(
                    propms_index_state="index",
                    propms_canonical_url="https://external.example/canonical",
                ),
            )
        )

    def test_v2_sitemap_detail_filter_rejects_legacy_and_placeholder_routes(self):
        self.assertTrue(_include_v2_detail_route("services/full-property-management"))
        self.assertTrue(_include_v2_detail_route("areas/wandsworth"))
        self.assertFalse(_include_v2_detail_route("pages/10-Example-Street"))
        self.assertFalse(_include_v2_detail_route("instructions/10-example-street"))
        self.assertFalse(_include_v2_detail_route("new-developments/<development_project>"))

    def test_robots_preserves_rules_and_advertises_sitemap(self):
        from propms.www.robots import get_context

        original = frappe.db.get_single_value("Website Settings", "robots_txt")
        try:
            frappe.db.set_single_value("Website Settings", "robots_txt", "User-agent: *\nDisallow: /private")
            result = get_context(frappe._dict())
            self.assertIn("Disallow: /private", result["robots_txt"])
            self.assertIn("Sitemap: ", result["robots_txt"])
            self.assertIn("/sitemap.xml", result["robots_txt"])
        finally:
            frappe.db.set_single_value("Website Settings", "robots_txt", original or "")

    def test_web_page_rejects_noindex_canonical_conflict(self):
        doc = frappe._dict(propms_index_state="noindex", propms_canonical_url="/other")
        with self.assertRaises(frappe.ValidationError):
            validate_web_page_seo(doc)

    def test_v2_web_page_social_image_uses_media_policy(self):
        from unittest.mock import patch

        doc = frappe._dict(
            meta_image="/files/social.jpg",
            page_blocks=[frappe._dict(web_template="PropMS V2 Hero")],
        )
        with patch("propms.website_media.validate_media_for_usage") as validate_media:
            validate_web_page_seo(doc)
        validate_media.assert_called_once_with("/files/social.jpg", "social-preview")

    def test_hardening_patch_backfills_index_state_without_overwriting_description(self):
        from propms.patches.v1_0.harden_v2_seo_defaults import execute

        frappe.db.delete(
            "Singles",
            {"doctype": "PropMS Website Settings", "field": "seo_default_index_state"},
        )
        frappe.db.set_single_value("PropMS Website Settings", "seo_default_description", "Custom description")
        execute()
        execute()
        self.assertEqual(
            frappe.db.get_single_value("PropMS Website Settings", "seo_default_index_state"),
            "index",
        )
        self.assertEqual(
            frappe.db.get_single_value("PropMS Website Settings", "seo_default_description"),
            "Custom description",
        )

    def test_schema_graph_is_structurally_valid(self):
        self.settings.schema_business_type = "Organization"
        self.settings.save()
        schema = build_schema_graph(
            page_url="https://example.test/services/management",
            page_name="Property management",
            description="A service page.",
            language="en-GB",
            breadcrumbs=[{"label": "Home", "url": "https://example.test/"}],
            service_name="Property management",
        )
        validate_schema(schema)
        types = {node["@type"] for node in schema["@graph"]}
        self.assertTrue({"Organization", "WebSite", "WebPage", "BreadcrumbList", "Service"}.issubset(types))
        self.assertEqual(json.loads(serialize_schema(schema))["@context"], "https://schema.org")

    def test_local_business_schema_uses_structured_facts(self):
        self.settings.schema_business_type = "LocalBusiness"
        self.settings.schema_street_address = "1 Example Street"
        self.settings.schema_locality = "London"
        self.settings.schema_country = "GB"
        self.settings.save()
        schema = build_schema_graph(
            page_url="https://example.test/",
            page_name="Example",
            description="Example page.",
            language="en-GB",
        )
        business = next(node for node in schema["@graph"] if node["@type"] == "LocalBusiness")
        self.assertEqual(business["address"]["addressLocality"], "London")
        self.assertEqual(business["address"]["addressCountry"], "GB")

    def test_preview_context_has_server_rendered_seo(self):
        from propms.www.propms_v2_preview import get_context

        context = frappe._dict()
        get_context(context)
        self.assertEqual(context.seo.robots, "noindex, nofollow")
        self.assertIsNone(context.seo.canonical)
        self.assertIn('"@type":"WebPage"', context.schema_json)
        self.assertIn("Website V2 Component Preview", context.seo.title)
