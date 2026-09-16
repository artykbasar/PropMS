from __future__ import annotations

import frappe


PROPERTY_INSTRUCTION_DOCTYPE = "Property Instruction"
PROPERTY_INSTRUCTION_TABLE = "`tabProperty Instruction`"
OBSOLETE_PROPERTY_MAP_COLUMNS = (
	"google_maps_place_id",
	"map_search_query",
	"map_zoom",
	"map_type",
	"show_embedded_map",
)


def execute():
	# Release 1 removed these fields from active metadata and application logic.
	# This deferred patch performs the physical column cleanup once model sync is complete.
	if not frappe.db.table_exists(PROPERTY_INSTRUCTION_DOCTYPE):
		return

	for column in OBSOLETE_PROPERTY_MAP_COLUMNS:
		if not frappe.db.has_column(PROPERTY_INSTRUCTION_DOCTYPE, column):
			continue
		frappe.db.sql_ddl(f"alter table {PROPERTY_INSTRUCTION_TABLE} drop column `{column}`")
