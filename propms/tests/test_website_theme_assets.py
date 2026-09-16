from unittest import TestCase

from propms.website_theme_assets import rewrite_app_public_imports


class TestWebsiteThemeAssets(TestCase):
    def test_app_public_imports_are_rewritten_to_assets(self):
        source = (
            '@import"frappe/public/css/espresso/colors.css";'
            '@import "erpnext/public/css/example.css";'
            '@import url("https://fonts.googleapis.com/css2?family=Inter");'
        )

        rendered = rewrite_app_public_imports(source)

        self.assertIn('@import"/assets/frappe/css/espresso/colors.css";', rendered)
        self.assertIn('@import"/assets/erpnext/css/example.css";', rendered)
        self.assertIn('https://fonts.googleapis.com', rendered)

    def test_parent_path_import_is_not_rewritten(self):
        source = '@import"frappe/public/../private/secret.css";'
        self.assertEqual(rewrite_app_public_imports(source), source)
