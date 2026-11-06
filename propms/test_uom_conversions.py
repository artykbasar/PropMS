"""Regression tests for safe, repeatable PropMS UOM migration data."""
import json
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from propms.uom_conversions import sync_week_conversions


class FakeDB:
    def __init__(self, rows=()):
        self.rows = [dict(row) for row in rows]

    def exists(self, doctype, filters):
        assert doctype == "UOM Conversion Factor"
        for row in self.rows:
            if isinstance(filters, str):
                if row["name"] == filters:
                    return row["name"]
            elif all(row.get(key) == value for key, value in filters.items()):
                return row["name"]
        return None


class FakeFrappe:
    def __init__(self, rows=()):
        self.db = FakeDB(rows)
        self.creates = []

    def get_doc(self, data):
        instance = self

        class FakeDocument:
            def insert(self, *, ignore_permissions):
                assert ignore_permissions
                row = dict(data)
                assert row["from_uom"] != row["to_uom"]
                assert float(row["value"]) > 0
                instance.db.rows.append(row)
                instance.creates.append(row)
                return row

        return FakeDocument()


class UOMConversionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.root = Path(__file__).resolve().parent
        cls.fixture = json.loads(
            (cls.root / "data" / "uom_conversion_factor.json").read_text()
        )

    def invoke(self, frappe):
        with patch.dict(sys.modules, {"frappe": frappe}):
            sync_week_conversions()
        return frappe

    def test_fixture_has_only_valid_unique_conversions(self):
        self.assertEqual(len(self.fixture), 11)
        identity = set()
        for record in self.fixture:
            self.assertEqual(record["doctype"], "UOM Conversion Factor")
            self.assertNotEqual(record["from_uom"], record["to_uom"])
            self.assertGreater(record["value"], 0)
            key = (
                record["category"],
                frozenset([record["from_uom"], record["to_uom"]]),
            )
            self.assertNotIn(key, identity)
            identity.add(key)

    def test_frappe17_fixture_directory_has_no_uom_conversion_file(self):
        self.assertFalse(
            (self.root / "fixtures" / "uom_conversion_factor.json").exists()
        )

    def test_hooks_preserve_theme_and_disable_unsafe_fixture(self):
        hooks = (self.root / "hooks.py").read_text()
        self.assertNotIn('"doctype": "UOM Conversion Factor"', hooks)
        self.assertIn("propms.website_theme_assets.prepare_v2_theme_assets", hooks)
        self.assertIn("propms.uom_conversions.sync_week_conversions", hooks)

    def test_missing_conversions_created_once_without_rewriting(self):
        frappe = FakeFrappe()
        self.invoke(frappe)
        self.assertEqual(len(frappe.creates), 11)
        self.assertEqual(
            {row["name"]: row["value"] for row in frappe.creates},
            {row["name"]: row["value"] for row in self.fixture},
        )
        self.invoke(frappe)
        self.assertEqual(len(frappe.creates), 11)

    def test_preserve_existing_factor_and_reverse_pair(self):
        first, second = self.fixture[0], self.fixture[1]
        existing = {
            **first,
            "name": "OTHER-EXISTING-DIRECT",
            "value": 42.0,
        }
        reverse = {
            **second,
            "name": "OTHER-EXISTING-REVERSE",
            "from_uom": second["to_uom"],
            "to_uom": second["from_uom"],
            "value": 99.0,
        }
        frappe = FakeFrappe((existing, reverse))
        self.invoke(frappe)
        self.assertEqual(frappe.db.rows[:2], [existing, reverse])
        self.assertNotIn(first["name"], [r["name"] for r in frappe.creates])
        self.assertNotIn(second["name"], [r["name"] for r in frappe.creates])
        self.assertEqual(len(frappe.creates), 9)

    def test_name_collision_kept_without_overwrite(self):
        first = self.fixture[0]
        existing = {
            **first, "from_uom": "Other", "to_uom": "Different", "value": 9.0
        }
        frappe = FakeFrappe((existing,))
        self.invoke(frappe)
        self.assertEqual(frappe.db.rows[0], existing)
        self.assertNotIn(first["name"], [r["name"] for r in frappe.creates])

    def test_existing_invalid_live_record_not_deleted(self):
        invalid = {
            "doctype": "UOM Conversion Factor", "name": "LEGACY-WEEK-TO-WEEK",
            "category": "Time", "from_uom": "Week", "to_uom": "Week",
            "value": 1.0,
        }
        frappe = FakeFrappe((invalid,))
        self.invoke(frappe)
        self.assertEqual(frappe.db.rows[0], invalid)


if __name__ == "__main__":
    unittest.main(verbosity=2)
