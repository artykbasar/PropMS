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
		self.validate_ready_translation_completeness()

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

	def validate_ready_translation_completeness(self):
		if self.status != "Ready" or not self.property_instruction:
			return

		instruction = frappe.get_doc("Property Instruction", self.property_instruction)
		missing_fields = []
		if instruction.title and not (self.title or "").strip():
			missing_fields.append(_("guide title"))
		if instruction.emergency_contact and not instruction.should_protect_identifier_value(
			instruction.emergency_contact
		) and not (self.emergency_contact or "").strip():
			missing_fields.append(_("emergency guidance"))

		translation_rows = {
			row.source_block_name: row for row in (self.blocks or []) if (row.source_block_name or "").strip()
		}
		block_issues = []

		for source_block in instruction.get_translation_source_payload()["blocks"]:
			row = translation_rows.get(source_block["source_block_name"])
			block_label = source_block.get("title") or source_block["section"] or source_block["source_block_name"]
			if not row:
				block_issues.append(_("{0}: missing translation row").format(frappe.bold(block_label)))
				continue

			row_missing = []
			if source_block.get("section") and not (row.section or "").strip():
				row_missing.append(_("section"))
			if source_block.get("title") and not (row.title or "").strip():
				row_missing.append(_("title"))
			if source_block.get("body") and not (row.body or "").strip():
				row_missing.append(_("body"))
			if source_block.get("caption") and not instruction.should_protect_identifier_value(
				source_block.get("caption")
			) and not (row.caption or "").strip():
				row_missing.append(_("caption"))
			if source_block.get("link_label") and not instruction.should_protect_identifier_value(
				source_block.get("link_label")
			) and not (row.link_label or "").strip():
				row_missing.append(_("link label"))

			if row_missing:
				block_issues.append(
					_("{0}: missing {1}").format(frappe.bold(block_label), ", ".join(row_missing))
				)

		if missing_fields or block_issues:
			message = _("This translation cannot be marked Ready until all required translated content is complete.")
			if missing_fields:
				message += "<br><br>" + _("Missing top-level fields: {0}").format(", ".join(missing_fields))
			if block_issues:
				message += "<br><br>" + _("Block issues: {0}").format("; ".join(block_issues))
			frappe.throw(message)

	def get_completion_status(self):
		instruction = frappe.get_doc("Property Instruction", self.property_instruction)
		required = 0
		completed = 0

		if instruction.title:
			required += 1
			completed += 1 if (self.title or "").strip() else 0
		if instruction.emergency_contact and not instruction.should_protect_identifier_value(
			instruction.emergency_contact
		):
			required += 1
			completed += 1 if (self.emergency_contact or "").strip() else 0

		translation_rows = {
			row.source_block_name: row for row in (self.blocks or []) if (row.source_block_name or "").strip()
		}
		missing_count = 0

		for source_block in instruction.get_translation_source_payload()["blocks"]:
			row = translation_rows.get(source_block["source_block_name"])
			for fieldname, value in (
				("section", source_block.get("section")),
				("title", source_block.get("title")),
				("body", source_block.get("body")),
			):
				if value:
					required += 1
					if row and (getattr(row, fieldname, "") or "").strip():
						completed += 1
			if source_block.get("caption") and not instruction.should_protect_identifier_value(
				source_block.get("caption")
			):
				required += 1
				if row and (row.caption or "").strip():
					completed += 1
			if source_block.get("link_label") and not instruction.should_protect_identifier_value(
				source_block.get("link_label")
			):
				required += 1
				if row and (row.link_label or "").strip():
					completed += 1

		missing_count = max(required - completed, 0)
		return {
			"required_fields": required,
			"completed_fields": completed,
			"missing_fields": missing_count,
			"completion_percent": round((completed / required) * 100, 1) if required else 100.0,
		}
