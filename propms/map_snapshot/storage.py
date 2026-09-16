from __future__ import annotations

import re

import frappe
from frappe.utils.file_manager import get_content_hash, save_file


GENERATED_MAP_FILE_PREFIX = "propms-map-"
_FILENAME_SANITIZE_PATTERN = re.compile(r"[^a-z0-9._-]+")


def _clean_text(value) -> str:
	return (value or "").strip()


def sanitize_filename_component(value: str | None, *, fallback: str, max_length: int = 48) -> str:
	text = _FILENAME_SANITIZE_PATTERN.sub("-", _clean_text(value).lower()).strip("-._")
	if not text:
		text = fallback
	return text[:max_length].strip("-._") or fallback


def build_snapshot_filename(property_instruction: str, map_key: str, row_name: str | None, source_hash: str) -> str:
	instruction_component = sanitize_filename_component(property_instruction, fallback="instruction")
	hash_component = sanitize_filename_component((source_hash or "")[:12], fallback="hash")
	if map_key == "property-location":
		return f"{GENERATED_MAP_FILE_PREFIX}{instruction_component}-property-location-{hash_component}.png"
	row_component = sanitize_filename_component(row_name, fallback="row")
	return f"{GENERATED_MAP_FILE_PREFIX}{instruction_component}-block-{row_component}-{hash_component}.png"


def _get_generated_snapshot_files(snapshot_url: str | None, property_instruction: str | None = None) -> list:
	snapshot_url = _clean_text(snapshot_url)
	if not snapshot_url:
		return []
	filters = {
		"file_url": snapshot_url,
		"attached_to_doctype": "Property Instruction",
		"is_private": 1,
	}
	if property_instruction:
		filters["attached_to_name"] = _clean_text(property_instruction)
	names = frappe.get_all("File", filters=filters, order_by="creation asc", pluck="name")
	return [frappe.get_doc("File", name) for name in names]


def get_generated_snapshot_file(snapshot_url: str | None, property_instruction: str | None = None) -> frappe.model.document.Document | None:
	files = _get_generated_snapshot_files(snapshot_url, property_instruction)
	return files[0] if files else None


def is_owned_generated_snapshot_file(file_doc, property_instruction: str, expected_url: str | None = None) -> bool:
	if not file_doc:
		return False
	if expected_url and _clean_text(file_doc.file_url) != _clean_text(expected_url):
		return False
	if _clean_text(file_doc.attached_to_doctype) != "Property Instruction":
		return False
	if _clean_text(file_doc.attached_to_name) != _clean_text(property_instruction):
		return False
	if not frappe.utils.cint(file_doc.is_private):
		return False
	if not _clean_text(file_doc.file_name).startswith(GENERATED_MAP_FILE_PREFIX):
		return False
	return True


def has_owned_generated_snapshot_file(snapshot_url: str | None, property_instruction: str) -> bool:
	return bool(get_generated_snapshot_file(snapshot_url, property_instruction))


def _delete_stale_generated_duplicates(content_hash: str):
	names = frappe.get_all(
		"File",
		filters={
			"content_hash": content_hash,
			"is_private": 1,
		},
		pluck="name",
	)
	for name in names:
		file_doc = frappe.get_doc("File", name)
		if not _clean_text(file_doc.file_name).startswith(GENERATED_MAP_FILE_PREFIX):
			continue
		try:
			if file_doc.exists_on_disk():
				continue
		except Exception:
			pass
		frappe.delete_doc("File", file_doc.name, ignore_permissions=True)


def delete_generated_snapshot_file_if_owned(snapshot_url: str | None, property_instruction: str) -> bool:
	file_doc = get_generated_snapshot_file(snapshot_url, property_instruction)
	if not is_owned_generated_snapshot_file(file_doc, property_instruction, snapshot_url):
		return False
	frappe.delete_doc("File", file_doc.name, ignore_permissions=True)
	return True


def schedule_delete_generated_snapshot_file(snapshot_url: str | None, property_instruction: str):
	snapshot_url = _clean_text(snapshot_url)
	if not snapshot_url:
		return
	frappe.db.after_commit.add(
		lambda: delete_generated_snapshot_file_if_owned(snapshot_url, property_instruction)
	)


def save_snapshot_png(
	*,
	property_instruction: str,
	map_key: str,
	row_name: str | None,
	source_hash: str,
	png_bytes: bytes,
):
	if not png_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
		raise frappe.ValidationError("Snapshot storage received non-PNG content.")

	_delete_stale_generated_duplicates(get_content_hash(png_bytes))
	filename = build_snapshot_filename(property_instruction, map_key, row_name, source_hash)
	file_doc = save_file(
		filename,
		png_bytes,
		"Property Instruction",
		property_instruction,
		is_private=1,
	)

	if is_owned_generated_snapshot_file(file_doc, property_instruction):
		return file_doc

	cloned = frappe.get_doc(
		{
			"doctype": "File",
			"file_name": file_doc.file_name,
			"file_url": file_doc.file_url,
			"attached_to_doctype": "Property Instruction",
			"attached_to_name": property_instruction,
			"file_size": file_doc.file_size,
			"content_hash": file_doc.content_hash,
			"is_private": 1,
		}
	)
	cloned.flags.ignore_permissions = True
	try:
		cloned.insert()
	except frappe.DuplicateEntryError:
		existing = frappe.get_doc("File", cloned.duplicate_entry)
		if is_owned_generated_snapshot_file(existing, property_instruction):
			return existing
		raise
	return cloned
