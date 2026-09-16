from pathlib import Path
from unittest.mock import patch

import frappe
from frappe.tests import IntegrationTestCase

from propms.website_routes import (
    PUBLIC_ROUTE_STATUS,
    apply_m10_context,
    apply_property_context,
    get_public_development_by_path,
)


class TestWebsiteV2Routes(IntegrationTestCase):
    def test_route_inventory_covers_m10_contracts(self):
        routes = {row[0]: row for row in PUBLIC_ROUTE_STATUS}
        for route in (
            "/login",
            "/me + account routes",
            "/policies",
            "/about",
            "/contact",
            "/new-developments",
            "/new-developments/<web_name>",
            "/instructions/<slug>",
            "404 / error",
        ):
            self.assertIn(route, routes)
        self.assertEqual(routes["/instructions/<slug>"][2], "noindex")
        self.assertIn("native-auth", routes["/login"][1])
        self.assertEqual(routes["/me + account routes"][2], "noindex")
        self.assertIn("native-account", routes["/me + account routes"][1])

    @patch("propms.website_routes.frappe.db.get_value")
    def test_public_development_resolver_requires_public_development(self, get_value):
        get_value.return_value = "Example Development"
        result = get_public_development_by_path("new-developments/Example%20Development")
        self.assertEqual(result, "Example Development")
        get_value.assert_called_once_with(
            "Property",
            {"publish_online": 1, "development_project": 1, "web_name": "Example Development"},
            "name",
            cache=True,
        )

    def test_login_template_suppresses_legacy_banner_html(self):
        template = Path(frappe.get_app_path("propms", "templates", "website_v2", "login.html")).read_text(encoding="utf-8")
        self.assertIn("{% block banner %}{% endblock %}", template)

    def test_login_and_base_share_site_shell_templates(self):
        app_path = Path(frappe.get_app_path("propms", "templates", "website_v2"))
        base = (app_path / "base.html").read_text(encoding="utf-8")
        login = (app_path / "login.html").read_text(encoding="utf-8")
        for partial in ("topbar.html", "header.html", "footer.html"):
            include = f'propms/templates/website_v2/includes/{partial}'
            self.assertIn(include, base)
            self.assertIn(include, login)
        self.assertIn("/assets/propms/css/home_v2.css", login)
        self.assertNotIn("Back to website", login)

    def test_native_account_templates_extend_frappe_and_share_v2_shell(self):
        app_path = Path(frappe.get_app_path("propms", "templates", "website_v2"))
        templates = {
            "account_me.html": 'www/me.html',
            "account_update_password.html": 'www/update-password.html',
            "account_third_party_apps.html": 'www/third_party_apps.html',
            "account_update_profile.html": 'website/doctype/web_form/templates/web_form.html',
        }
        for filename, parent in templates.items():
            template = (app_path / filename).read_text(encoding="utf-8")
            self.assertIn(f'{{% extends "{parent}" %}}', template)
            self.assertIn("account_head.html", template)
            self.assertIn("topbar.html", template)
            self.assertIn("header.html", template)
            self.assertIn("footer.html", template)
            self.assertIn("{% block banner %}{% endblock %}", template)
        me_template = (app_path / "account_me.html").read_text(encoding="utf-8")
        self.assertIn("replace('href=\"/\"', 'href=\"/home\"', 1)", me_template)

    @patch("propms.website_routes.is_propms_v2_enabled", return_value=True)
    @patch("propms.website_routes._apply_error_context")
    def test_native_account_permission_error_keeps_403_contract(self, apply_error, _enabled):
        context = frappe._dict(template="frappe/templates/message.html")
        previous = getattr(frappe.local, "message_title", None)
        frappe.local.message_title = frappe._("Not Permitted")
        try:
            self.assertTrue(apply_m10_context(context, "/me"))
        finally:
            frappe.local.message_title = previous
        apply_error.assert_called_once_with(context, 403)

    @patch("propms.website_routes.is_propms_v2_enabled", return_value=True)
    @patch("propms.website_routes.apply_shared_v2_context")
    def test_native_account_routes_keep_native_content_inside_v2_shell(self, shared_context, _enabled):
        cases = {
            "/me": "account_me.html",
            "/update-password": "account_update_password.html",
            "/third_party_apps": "account_third_party_apps.html",
            "/update-profile/Administrator": "account_update_profile.html",
            "/update-profile/Administrator/edit": "account_update_profile.html",
        }
        for route, filename in cases.items():
            context = frappe._dict(
                http_status_code=200,
                body_class="native-page",
                head_html='<link href="https://fonts.googleapis.com/css?family=Legacy" rel="stylesheet"><meta name="theme-color" content="#fff">',
            )
            self.assertTrue(apply_m10_context(context, route))
            self.assertTrue(context.template.endswith(filename))
            self.assertEqual(context.robots_meta, "noindex, nofollow")
            self.assertFalse(context.get("full_width"))
            self.assertEqual(context.banner_html, "")
            self.assertEqual(context.theme.name, "Standard")
            self.assertNotIn("fonts.googleapis.com", context.head_html)
            self.assertIn('meta name="theme-color"', context.head_html)
            self.assertIn("v2-account", context.body_class.split())
            self.assertIn("v2-home-parity", context.body_class.split())
        self.assertEqual(shared_context.call_count, len(cases))
        for call in shared_context.call_args_list:
            self.assertTrue(call.kwargs.get("homepage_shell"))

    def test_native_account_css_scopes_frappe_layout_collisions(self):
        css = Path(frappe.get_app_path("propms", "public", "css", "account_v2.css")).read_text(encoding="utf-8")
        self.assertIn(".v2-account main.container {", css)
        self.assertIn(".v2-account .icon,", css)
        self.assertIn(".v2-account .for-reset-password .page-card {", css)
        self.assertIn("min-height: 0;", css)

    def test_layered_brand_logo_layout_is_in_shared_v2_css(self):
        app_path = Path(frappe.get_app_path("propms"))
        shared = (app_path / "public/css/website_v2.css").read_text(encoding="utf-8")
        home = (app_path / "public/css/home_v2.css").read_text(encoding="utf-8")

        self.assertIn(".v2-brand__layers { position: relative;", shared)
        self.assertIn(".v2-brand__layer { position: absolute;", shared)
        self.assertIn(".v2-brand__layer--full { opacity: 0; }", shared)
        self.assertNotIn(".v2-brand__layers { position: relative;", home)
        self.assertNotIn(".v2-brand__layer { position: absolute;", home)

    @patch("propms.website_routes.is_propms_v2_enabled", return_value=True)
    @patch("propms.website_routes.apply_shared_v2_context")
    def test_login_uses_v2_skin_without_replacing_native_auth_context(self, shared_context, _enabled):
        context = frappe._dict(http_status_code=200, provider_logins=[{"name": "example"}])
        apply_m10_context(context, "/login")
        self.assertEqual(context.template, "propms/templates/website_v2/login.html")
        self.assertEqual(context.robots_meta, "noindex, nofollow")
        self.assertEqual(context.provider_logins, [{"name": "example"}])
        self.assertIn("v2-home-parity", context.body_class.split())
        shared_context.assert_called_once_with(context, homepage_shell=True)

    @patch("propms.website_routes.is_propms_v2_enabled", return_value=True)
    @patch("propms.website_routes.apply_shared_v2_context")
    @patch("propms.website_routes.resolve_seo")
    def test_error_pages_keep_v2_noindex_contract(self, resolve_seo, shared_context, _enabled):
        resolve_seo.return_value = frappe._dict(robots="noindex, nofollow")
        context = frappe._dict(http_status_code=404)
        apply_m10_context(context, "/missing")
        self.assertEqual(context.template, "propms/templates/website_v2/error.html")
        self.assertEqual(context.error_status, 404)
        self.assertEqual(context.seo.robots, "noindex, nofollow")
        shared_context.assert_called_once_with(context)



    @patch("propms.website_routes.is_propms_v2_enabled", return_value=False)
    def test_section_redirects_do_not_change_legacy_engine(self, _enabled):
        from propms.website_routes import redirect_m10_section_routes

        with patch.object(frappe.local, "request", frappe._dict(path="/about"), create=True):
            redirect_m10_section_routes()

    @patch("propms.website_routes.is_propms_v2_enabled", return_value=True)
    def test_section_redirects_are_301_in_v2(self, _enabled):
        from propms.website_routes import redirect_m10_section_routes

        with patch.object(frappe.local, "request", frappe._dict(path="/contact"), create=True):
            with self.assertRaises(frappe.Redirect) as raised:
                redirect_m10_section_routes()
        self.assertEqual(raised.exception.http_status_code, 301)
        self.assertEqual(frappe.local.flags.redirect_location, "/#contact")

    @patch("propms.website_routes.build_schema_graph", return_value={"@context": "https://schema.org", "@graph": []})
    @patch("propms.website_routes.resolve_seo")
    @patch("propms.website_routes.apply_shared_v2_context")
    def test_property_gallery_script_is_conditional(self, shared_context, resolve_seo, _schema):
        def set_shell(context):
            context.shell = frappe._dict(brand_name="Example")

        shared_context.side_effect = set_shell
        resolve_seo.return_value = frappe._dict(
            title="Example", description="Example", canonical="https://example.test/new-developments/Example", language="en-GB"
        )
        doc = frappe._dict(
            name="Example",
            web_name="Example",
            description="",
            location="",
            bullet_points=[],
            images=[],
            development_project=1,
        )
        doc.get_children = lambda: []

        without_gallery = frappe._dict()
        apply_property_context(without_gallery, doc)
        self.assertFalse(without_gallery.get("page_scripts"))

        doc.images = [frappe._dict(image="/files/example.jpg")]
        with_gallery = frappe._dict()
        apply_property_context(with_gallery, doc)
        self.assertEqual(with_gallery.page_scripts, ("/assets/propms/js/property_gallery_v2.js",))

    def test_guest_guide_noindex_hook_is_path_scoped(self):
        from propms.property_management_solution.doctype.property_instruction.property_instruction import (
            apply_guest_guide_noindex_headers,
        )

        response = frappe._dict(headers={})
        request = frappe._dict(path="/instructions/example")
        apply_guest_guide_noindex_headers(response=response, request=request)
        self.assertEqual(
            response.headers.get("X-Robots-Tag"),
            "noindex, nofollow, noarchive, nosnippet, noimageindex",
        )
