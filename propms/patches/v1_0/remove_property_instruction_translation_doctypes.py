from __future__ import annotations

import frappe


REMOVED_DOCTYPES = [
	"Property Instruction Translation Block",
	"Property Instruction Translation",
]


def execute():
	for doctype_name in REMOVED_DOCTYPES:
		cleanup_removed_doctype_metadata(doctype_name)
		delete_removed_doctype(doctype_name)


def cleanup_removed_doctype_metadata(doctype_name):
	delete_records("Workspace Link", {"link_to": doctype_name})
	delete_records("Workspace Shortcut", {"link_to": doctype_name})
	delete_records("Custom Field", {"dt": doctype_name})
	delete_records("Custom Field", {"options": doctype_name})
	delete_records("Property Setter", {"doc_type": doctype_name})
	delete_records("DocPerm", {"parent": doctype_name})


def delete_removed_doctype(doctype_name):
	if not frappe.db.exists("DocType", doctype_name):
		return
	frappe.delete_doc("DocType", doctype_name, force=1, ignore_permissions=True)


def delete_records(doctype, filters):
	if not frappe.db.exists("DocType", doctype):
		return
	for name in frappe.get_all(doctype, filters=filters, pluck="name"):
		frappe.delete_doc(doctype, name, force=1, ignore_permissions=True)
