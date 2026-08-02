from __future__ import annotations

from dataclasses import dataclass

import frappe
from frappe import _

from .presentation import build_map_source_hash
from .validation import extract_google_maps_embed_url, get_google_maps_embed_kind


@dataclass(frozen=True)
class CaptureMapReference:
	property_instruction: str
	map_key: str
	row_name: str | None = None


@dataclass(frozen=True)
class ResolvedMap:
	property_instruction: str
	map_key: str
	row_name: str | None
	embed_url: str
	map_kind: str
	source_hash: str
	title: str
	external_url: str | None


def _load_instruction(name: str):
	from propms.property_management_solution.doctype.property_instruction.property_instruction import (
		PropertyInstruction,
	)

	if not name:
		frappe.throw(_("Property Instruction is required."))
	doc = frappe.get_doc("Property Instruction", name)
	if not isinstance(doc, PropertyInstruction):
		doc = frappe.get_doc("Property Instruction", name)
	return doc


def resolve_capture_map(reference: CaptureMapReference) -> ResolvedMap:
	doc = _load_instruction(reference.property_instruction)
	map_key = (reference.map_key or "").strip()
	if map_key == "property-location":
		embed_url = extract_google_maps_embed_url(doc.get_custom_property_map_embed_url())
		if not embed_url:
			frappe.throw(_("Property map is not configured for capture."))
		map_kind = get_google_maps_embed_kind(embed_url)
		if not map_kind:
			frappe.throw(_("Unsupported property map kind."))
		return ResolvedMap(
			property_instruction=doc.name,
			map_key=map_key,
			row_name=None,
			embed_url=embed_url,
			map_kind=map_kind,
			source_hash=build_map_source_hash(embed_url, map_kind),
			title=doc.title or doc.name,
			external_url=doc.get_map_external_url(embed_url),
		)

	if map_key == "block":
		row_name = (reference.row_name or "").strip()
		if not row_name:
			frappe.throw(_("Block row name is required for block map capture."))
		row = next((child for child in (doc.instruction_blocks or []) if child.name == row_name), None)
		if not row:
			frappe.throw(_("Property Instruction block was not found."))
		block_map = doc.get_block_map_data(row)
		if not block_map.embed_url:
			frappe.throw(_("Property Instruction block does not contain a capturable map."))
		map_kind = get_google_maps_embed_kind(block_map.embed_url)
		if not map_kind:
			frappe.throw(_("Unsupported block map kind."))
		return ResolvedMap(
			property_instruction=doc.name,
			map_key=map_key,
			row_name=row.name,
			embed_url=block_map.embed_url,
			map_kind=map_kind,
			source_hash=build_map_source_hash(block_map.embed_url, map_kind),
			title=row.title or doc.title or row.name,
			external_url=block_map.external_url,
		)

	frappe.throw(_("Unsupported map capture target."))
