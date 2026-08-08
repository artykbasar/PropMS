import frappe


BLOCK_DOCTYPE = "Property Instruction Block"
BLOCK_TABLE = "`tabProperty Instruction Block`"


def execute():
	if not frappe.db.table_exists(BLOCK_DOCTYPE):
		return
	if not frappe.db.has_column(BLOCK_DOCTYPE, "sort_order"):
		return
	frappe.db.sql_ddl(f"alter table {BLOCK_TABLE} drop column `sort_order`")
