import frappe
from bs4 import BeautifulSoup
from frappe.tests import IntegrationTestCase

from propms.website_components import (
    render_component,
    validate_component_values,
    validate_web_page_components,
)


class TestWebsiteComponents(IntegrationTestCase):
    def test_hero_renders_server_side_with_semantic_theme(self):
        html = render_component(
            "hero",
            {
                "theme": "primary",
                "variant": "centered",
                "title": "Hello",
                "primary_label": "Contact",
                "primary_url": "/contact",
            },
        )
        soup = BeautifulSoup(html, "html.parser")
        section = soup.find("section")
        self.assertIn("v2-theme-primary", section.get("class", []))
        self.assertEqual(soup.find("h1").get_text(strip=True), "Hello")
        self.assertEqual(soup.find("a")["href"], "/contact")

    def test_grid_renders_typed_rows(self):
        html = render_component(
            "feature_grid",
            {
                "theme": "soft",
                "variant": "cards",
                "title": "Why us",
                "items": [
                    {"title": "Fast", "description": "Server rendered"},
                    {"title": "Safe", "description": "Typed fields"},
                ],
            },
        )
        soup = BeautifulSoup(html, "html.parser")
        self.assertEqual(
            [heading.get_text(strip=True) for heading in soup.find_all("h3")],
            ["Fast", "Safe"],
        )

    def test_all_implemented_components_render(self):
        examples = {
            "hero": {"title": "Hero"},
            "media_content_split": {"title": "About"},
            "feature_grid": {"title": "Features", "items": []},
            "service_grid": {"title": "Services", "items": []},
            "area_grid": {"title": "Areas", "items": []},
            "cta": {"title": "CTA"},
            "contact_location": {"title": "Contact"},
        }
        for component, values in examples.items():
            with self.subTest(component=component):
                html = render_component(component, values)
                self.assertIn("v2-component", html)

    def test_invalid_variant_is_rejected(self):
        with self.assertRaises(frappe.ValidationError):
            validate_component_values(
                "PropMS V2 Hero",
                {"theme": "rainbow", "variant": "default", "title": "No"},
            )

    def test_unknown_field_is_rejected(self):
        with self.assertRaises(frappe.ValidationError):
            validate_component_values(
                "PropMS V2 CTA",
                {"title": "No", "custom_css": "body{}"},
            )

    def test_unsafe_url_scheme_is_rejected(self):
        with self.assertRaises(frappe.ValidationError):
            validate_component_values(
                "PropMS V2 CTA",
                {
                    "title": "No",
                    "button_label": "Click",
                    "button_url": "javascript:alert(1)",
                },
            )

    def test_required_field_is_rejected(self):
        with self.assertRaises(frappe.ValidationError):
            validate_component_values(
                "PropMS V2 Hero",
                {"theme": "default", "variant": "default"},
            )

    def test_rendered_content_is_escaped(self):
        html = render_component(
            "cta",
            {
                "theme": "primary",
                "variant": "default",
                "title": "<script>alert(1)</script>",
            },
        )
        soup = BeautifulSoup(html, "html.parser")
        self.assertIsNone(soup.find("script"))
        self.assertIn("<script>alert(1)</script>", soup.find("h2").get_text())

    def test_web_page_rejects_custom_styling(self):
        doc = frappe.get_doc(
            {
                "doctype": "Web Page",
                "title": "M3 controlled",
                "route": "m3-controlled",
                "content_type": "Page Builder",
                "css": "body { display:none }",
                "page_blocks": [
                    {
                        "web_template": "PropMS V2 CTA",
                        "web_template_values": frappe.as_json(
                            {"title": "Safe", "theme": "primary", "variant": "default"}
                        ),
                    }
                ],
            }
        )
        with self.assertRaises(frappe.ValidationError):
            validate_web_page_components(doc)

    def test_web_page_hook_validates_propms_blocks(self):
        doc = frappe.get_doc(
            {
                "doctype": "Web Page",
                "title": "M3 validation",
                "route": "m3-validation",
                "content_type": "Page Builder",
                "page_blocks": [
                    {
                        "web_template": "PropMS V2 CTA",
                        "web_template_values": frappe.as_json(
                            {"title": "Safe", "theme": "primary", "variant": "default"}
                        ),
                    }
                ],
            }
        )
        validate_web_page_components(doc)
        doc.page_blocks[0].web_template_values = frappe.as_json(
            {"title": "Unsafe", "theme": "unknown"}
        )
        with self.assertRaises(frappe.ValidationError):
            validate_web_page_components(doc)


    def test_section_id_is_restricted_to_safe_anchor_syntax(self):
        with self.assertRaises(frappe.ValidationError):
            validate_component_values(
                "PropMS V2 CTA",
                {"section_id": "Bad ID!", "title": "CTA"},
            )

    def test_component_images_must_use_owned_media(self):
        with self.assertRaises(frappe.ValidationError):
            validate_component_values(
                "PropMS V2 CTA",
                {
                    "title": "CTA",
                    "background_image": "https://example.com/external.jpg",
                },
            )
    def test_area_images_require_meaningful_alt_text(self):
        with self.assertRaises(frappe.ValidationError):
            validate_component_values(
                "PropMS V2 Area Grid",
                {
                    "title": "Areas",
                    "items": [{"title": "Wandsworth", "image": "/files/logo.svg"}],
                },
            )

    def test_hero_presentation_is_data_driven(self):
        html = render_component(
            "hero",
            {
                "title": "Hero",
                "overlay": "strong",
                "overlay_style": "left-gradient",
                "media_treatment": "muted",
                "mobile_height": "viewport",
                "background_scroll": "fixed",
            },
        )
        classes = BeautifulSoup(html, "html.parser").find("section").get("class", [])
        self.assertIn("v2-hero--overlay-style-left-gradient", classes)
        self.assertIn("v2-hero--media-muted", classes)
        self.assertIn("v2-hero--mobile-viewport", classes)
        self.assertIn("v2-hero--scroll-fixed", classes)

    def test_cta_background_scroll_is_data_driven(self):
        html = render_component(
            "cta",
            {"title": "Investors", "background_scroll": "fixed"},
        )
        classes = BeautifulSoup(html, "html.parser").find("section").get("class", [])
        self.assertIn("v2-cta--scroll-fixed", classes)

    def test_area_logo_presentation_is_data_driven(self):
        html = render_component(
            "area_grid",
            {
                "title": "Areas",
                "variant": "logos",
                "show_heading": 0,
                "heading_alignment": "center",
                "heading_case": "uppercase",
                "logo_density": "compact",
                "grid_columns": "6",
                "grid_width": "narrow",
                "items": [],
            },
        )
        soup = BeautifulSoup(html, "html.parser")
        classes = soup.find("section").get("class", [])
        self.assertIn("v2-area-grid--heading-center", classes)
        self.assertIn("v2-area-grid--heading-case-uppercase", classes)
        self.assertIn("v2-area-grid--logos-compact", classes)
        self.assertIn("v2-area-grid--columns-6", classes)
        self.assertIn("v2-area-grid--grid-narrow", classes)
        self.assertIn("v2-visually-hidden", soup.select_one(".v2-section-heading").get("class", []))

    def test_contact_layout_is_data_driven(self):
        html = render_component(
            "contact_location",
            {"title": "Contact", "layout": "map-form", "show_form": 1},
        )
        soup = BeautifulSoup(html, "html.parser")
        self.assertIsNotNone(soup.select_one(".v2-contact-layout--map-form"))
