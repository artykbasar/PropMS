from __future__ import annotations

import frappe
from frappe import _
from frappe.model.document import Document


class PropertyInstructionTranslation(Document):
	def validate(self):
		self.language_code = (self.language_code or "").strip().lower()
		self.language_name = (self.language_name or self.language_code.upper()).strip()
		self.validate_unique_language()
		self.normalize_blocks()

	def validate_unique_language(self):
		existing = frappe.db.exists(
			self.doctype,
			{
				"property_instruction": self.property_instruction,
				"language_code": self.language_code,
				"name": ["!=", self.name],
			},
		)
		if existing:
			frappe.throw(
				_("A translation already exists for language {0}.").format(frappe.bold(self.language_code))
			)

	def normalize_blocks(self):
		for index, row in enumerate(self.blocks or [], start=1):
			if not row.sort_order:
				row.sort_order = index
