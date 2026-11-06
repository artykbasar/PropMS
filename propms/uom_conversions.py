"""Import the supported UOM conversions without changing existing site data.

ERPNext validates category/direction pairs on import. Its fixture importer
updates records by name, which rejects existing reverse-direction conversions.
Reconcile missing records instead, after standard fixture synchronization.
"""
import json
from pathlib import Path


def sync_week_conversions():
    """Add missing PropMS conversions, keeping all existing records unchanged."""
    import frappe

    rows = json.loads(
        (Path(__file__).parent / "data" / "uom_conversion_factor.json").read_text(
            encoding="utf-8"
        )
    )
    created = 0
    preserved = 0
    name_conflicts = 0
    seen = set()

    for row in rows:
        if row.get("doctype") != "UOM Conversion Factor":
            raise ValueError("Unexpected PropMS UOM fixture DocType")
        category, source, target = (
            row["category"], row["from_uom"], row["to_uom"]
        )
        if source == target or float(row["value"]) <= 0:
            raise ValueError("Invalid PropMS UOM conversion")
        key = (category, tuple(sorted((source, target))))
        if key in seen:
            raise ValueError("Duplicate PropMS UOM conversion pair")
        seen.add(key)

        for left, right in ((source, target), (target, source)):
            if frappe.db.exists("UOM Conversion Factor", {
                "category": category, "from_uom": left, "to_uom": right,
            }):
                preserved += 1
                break
        else:
            if frappe.db.exists("UOM Conversion Factor", row["name"]):
                # Do not repurpose an existing record with the same name.
                name_conflicts += 1
                continue
            record = {
                field: row[field]
                for field in (
                    "doctype", "name", "category",
                    "from_uom", "to_uom", "value",
                )
            }
            frappe.get_doc(record).insert(ignore_permissions=True)
            created += 1

    print(
        f"PROPMS_UOM_CONVERSIONS_CREATED={created} "
        f"PRESERVED={preserved} NAME_CONFLICTS={name_conflicts}"
    )
