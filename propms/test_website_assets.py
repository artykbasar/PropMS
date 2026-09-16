import unittest

from propms.website_assets import get_assets, normalize_brand_html, should_use_lightweight_home


class TestWebsiteAssets(unittest.TestCase):
    def test_login_is_lightweight(self):
        css, js = get_assets("login")
        joined = " ".join([*css, *js])
        self.assertIn("/assets/propms/css/login.css", css)
        self.assertIn("/assets/propms/css/home_icons.css", css)
        self.assertIn("/assets/propms/js/website_brand.js", js)
        self.assertNotIn("aos", joined)
        self.assertNotIn("swiper", joined)
        self.assertNotIn("glightbox", joined)
        self.assertNotIn("boxicons", joined)
        self.assertNotIn("bootstrap-icons", joined)
        self.assertNotIn("propms_website.bundle.css", css)

    def test_home_only_gets_home_dependencies(self):
        css, js = get_assets("home", lightweight_home=True)
        joined = " ".join([*css, *js])
        self.assertNotIn("aos", joined)
        self.assertIn("/assets/propms/css/home_icons.css", css)
        self.assertIn("/assets/propms/css/home_frappe_compat.css", css)
        self.assertNotIn("/assets/propms/day/assets/vendor/bootstrap/css/bootstrap.min.css", css)
        self.assertIn("/assets/propms/day/assets/vendor/bootstrap/css/bootstrap-reboot.min.css", css)
        self.assertNotIn("/assets/propms/day/assets/vendor/bootstrap/css/bootstrap-grid.min.css", css)
        self.assertIn("/assets/propms/css/home_grid.css", css)
        self.assertIn("/assets/propms/css/home_bootstrap_utilities.css", css)
        self.assertNotIn("propms_website.bundle.css", css)
        self.assertNotIn("/assets/propms/day/assets/vendor/bootstrap-icons/bootstrap-icons.css", css)
        self.assertNotIn("/assets/propms/day/assets/vendor/boxicons/css/boxicons.min.css", css)
        self.assertIn("/assets/propms/js/home_frappe_runtime.js", js)
        self.assertIn("/assets/propms/js/website_brand.js", js)
        self.assertIn("/assets/propms/js/home.js", js)
        self.assertNotIn("propms_website.bundle.css", css)
        self.assertNotIn("swiper", joined)
        self.assertNotIn("glightbox", joined)
        self.assertNotIn("isotope", joined)
        self.assertNotIn("php-email-form", joined)
        self.assertNotIn("bootstrap.bundle.min.js", joined)
        self.assertNotIn("/assets/propms/day/assets/js/main.js", joined)

    def test_lightweight_base_is_guest_home_only(self):
        self.assertTrue(should_use_lightweight_home("home", "Guest"))
        self.assertTrue(should_use_lightweight_home("/", "Guest"))
        self.assertFalse(should_use_lightweight_home("home", "Administrator"))
        self.assertFalse(should_use_lightweight_home("login", "Guest"))
        _, authenticated_js = get_assets("home", lightweight_home=False)
        self.assertNotIn("/assets/propms/js/home_frappe_runtime.js", authenticated_js)

    def test_generic_route_keeps_only_lightweight_shared_icons(self):
        css, js = get_assets("about")
        self.assertIn("/assets/propms/css/home_icons.css", css)
        self.assertIn("/assets/propms/day/assets/vendor/bootstrap-icons/bootstrap-icons.css", css)
        self.assertNotIn("/assets/propms/day/assets/vendor/bootstrap/css/bootstrap.min.css", css)
        self.assertIn("/assets/propms/js/website_brand.js", js)

    def test_brand_html_adds_accessible_names_without_overwriting_decorative_alt(self):
        html = normalize_brand_html(
            '<img src="brand.png"><a href="/" class="logo"><img src="layer.png" alt=""></a>',
            "Example Property",
        )
        self.assertIn('alt="Example Property"', html)
        self.assertIn('aria-label="Example Property home"', html)
        self.assertIn('src="layer.png" alt=""', html)

    def test_property_gets_gallery_dependencies(self):
        css, js = get_assets("property/example")
        self.assertIn("/assets/propms/day/assets/vendor/glightbox/css/glightbox.min.css", css)
        self.assertIn("/assets/propms/js/property_gallery.js", js)


if __name__ == "__main__":
    unittest.main()
