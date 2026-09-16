from __future__ import annotations

from dataclasses import asdict, dataclass
from urllib.parse import urlencode

import frappe
from frappe import _
from werkzeug.datastructures import Headers

from .manifest import (
	SNAPSHOT_STATUS_FAILED,
	SNAPSHOT_STATUS_PENDING,
	SNAPSHOT_STATUS_PROCESSING,
	SNAPSHOT_STATUS_READY,
	get_map_snapshot_target,
	is_snapshot_current,
)
from .storage import (
	get_generated_snapshot_file,
	is_owned_generated_snapshot_file,
)


PDF_MAP_REPRESENTATION_SNAPSHOT = "snapshot"
PDF_MAP_REPRESENTATION_QR = "qr"
PDF_MAP_REPRESENTATION_NONE = "none"
PDF_MAP_REPRESENTATION_VALUES = (
	PDF_MAP_REPRESENTATION_SNAPSHOT,
	PDF_MAP_REPRESENTATION_QR,
	PDF_MAP_REPRESENTATION_NONE,
)
PUBLIC_MAP_SNAPSHOT_IMAGE_METHOD = (
	"propms.map_snapshot.pdf_assets.public_map_snapshot_image"
)
PUBLIC_MAP_SNAPSHOT_IMAGE_ENDPOINT = (
	f"/api/method/{PUBLIC_MAP_SNAPSHOT_IMAGE_METHOD}"
)
PUBLIC_MAP_SNAPSHOT_CACHE_SECONDS = 300
PUBLIC_MAP_SNAPSHOT_NOINDEX = "noindex, nofollow, noarchive, nosnippet, noimageindex"


@dataclass(frozen=True)
class PdfMapRepresentation:
	map_key: str
	row_name: str | None
	map_kind: str
	custom_map: bool
	representation: str
	snapshot_image_url: str
	open_url: str
	desired_source_hash: str
	reason_code: str

	def to_context(self) -> dict[str, str | bool | None]:
		return asdict(self)


def _clean_text(value) -> str:
	return (value or "").strip()


def _not_found():
	frappe.throw(_("Requested guide map snapshot was not found."), frappe.DoesNotExistError)


def _get_property_row(doc, row_name: str | None):
	row_name = _clean_text(row_name)
	if not row_name:
		return None
	return next((row for row in (doc.instruction_blocks or []) if _clean_text(row.name) == row_name), None)


def _build_public_map_snapshot_image_url(
	property_instruction: str,
	map_key: str,
	source_hash: str,
	row_name: str | None = None,
) -> str:
	query = {
		"property_instruction": _clean_text(property_instruction),
		"map_key": _clean_text(map_key),
		"source_hash": _clean_text(source_hash),
	}
	if row_name:
		query["row_name"] = _clean_text(row_name)
	return f"{PUBLIC_MAP_SNAPSHOT_IMAGE_ENDPOINT}?{urlencode(query)}"


def _get_snapshot_reason(target, desired_source_hash: str, property_instruction: str) -> str:
	status = _clean_text(getattr(target, "snapshot_status", ""))
	snapshot_url = _clean_text(getattr(target, "snapshot_url", ""))
	snapshot_source_hash = _clean_text(getattr(target, "snapshot_source_hash", ""))

	if status == SNAPSHOT_STATUS_PENDING:
		return "pending"
	if status == SNAPSHOT_STATUS_PROCESSING:
		return "processing"
	if status == SNAPSHOT_STATUS_FAILED:
		return "failed"
	if status != SNAPSHOT_STATUS_READY:
		return "not-ready"
	if snapshot_source_hash != _clean_text(desired_source_hash):
		return "stale-hash"
	if not snapshot_url:
		return "missing-file"

	owned_file = get_generated_snapshot_file(snapshot_url, property_instruction)
	if owned_file and is_owned_generated_snapshot_file(owned_file, property_instruction, snapshot_url):
		return "snapshot-ready"

	foreign_file = get_generated_snapshot_file(snapshot_url)
	if foreign_file and not is_owned_generated_snapshot_file(foreign_file, property_instruction, snapshot_url):
		return "wrong-owner"

	return "missing-file"


def build_pdf_map_representation(doc, map_key: str, row_name: str | None = None) -> PdfMapRepresentation:
	map_key = _clean_text(map_key)
	row_name = _clean_text(row_name) or None

	if map_key == "property-location":
		property_map = doc.get_property_map()
		if not property_map or not property_map.is_custom_embed:
			return PdfMapRepresentation(
				map_key=map_key,
				row_name=None,
				map_kind=_clean_text(getattr(property_map, "embed_kind", "")),
				custom_map=False,
				representation=PDF_MAP_REPRESENTATION_NONE,
				snapshot_image_url="",
				open_url=_clean_text(getattr(property_map, "external_url", "")),
				desired_source_hash="",
				reason_code="not-custom",
			)
		target = get_map_snapshot_target(doc, map_key, None)
		open_url = _clean_text(getattr(property_map, "external_url", ""))
	elif map_key == "block":
		row = _get_property_row(doc, row_name)
		block_map = doc.get_block_map_data(row) if row else frappe._dict()
		embed_input = doc.get_block_map_embed_input(row) if row else ""
		if not row or not _clean_text(embed_input):
			return PdfMapRepresentation(
				map_key=map_key,
				row_name=row_name,
				map_kind=_clean_text(getattr(block_map, "embed_kind", "")),
				custom_map=False,
				representation=PDF_MAP_REPRESENTATION_NONE,
				snapshot_image_url="",
				open_url=_clean_text(getattr(block_map, "external_url", "")),
				desired_source_hash="",
				reason_code="not-custom",
			)
		target = get_map_snapshot_target(doc, map_key, row_name)
		open_url = _clean_text(getattr(block_map, "external_url", ""))
	else:
		return PdfMapRepresentation(
			map_key=map_key,
			row_name=row_name,
			map_kind="",
			custom_map=False,
			representation=PDF_MAP_REPRESENTATION_NONE,
			snapshot_image_url="",
			open_url="",
			desired_source_hash="",
			reason_code="unsupported-map-key",
		)

	if not target:
		return PdfMapRepresentation(
			map_key=map_key,
			row_name=row_name,
			map_kind="",
			custom_map=True,
			representation=PDF_MAP_REPRESENTATION_QR,
			snapshot_image_url="",
			open_url=open_url,
			desired_source_hash="",
			reason_code="target-missing",
		)

	desired_source_hash = _clean_text(target.expected_source_hash)
	map_kind = _clean_text(target.map_kind)
	reason_code = _get_snapshot_reason(target, desired_source_hash, doc.name)
	is_current = is_snapshot_current(
		target.snapshot_url,
		target.snapshot_status,
		target.snapshot_source_hash,
		desired_source_hash,
		doc.name,
	)
	representation = (
		PDF_MAP_REPRESENTATION_SNAPSHOT
		if is_current
		else PDF_MAP_REPRESENTATION_QR
	)
	snapshot_image_url = (
		_build_public_map_snapshot_image_url(doc.name, map_key, desired_source_hash, row_name)
		if representation == PDF_MAP_REPRESENTATION_SNAPSHOT
		else ""
	)
	return PdfMapRepresentation(
		map_key=map_key,
		row_name=row_name,
		map_kind=map_kind,
		custom_map=True,
		representation=representation,
		snapshot_image_url=snapshot_image_url,
		open_url=open_url,
		desired_source_hash=desired_source_hash,
		reason_code=reason_code,
	)


def resolve_current_public_snapshot_file(
	property_instruction: str,
	map_key: str,
	source_hash: str,
	row_name: str | None = None,
):
	property_instruction = _clean_text(property_instruction)
	source_hash = _clean_text(source_hash)
	row_name = _clean_text(row_name) or None
	try:
		doc = frappe.get_doc("Property Instruction", property_instruction)
	except frappe.DoesNotExistError:
		_not_found()
	if not frappe.utils.cint(doc.published):
		_not_found()

	representation = build_pdf_map_representation(doc, map_key, row_name)
	if not representation.custom_map:
		_not_found()
	if representation.representation != PDF_MAP_REPRESENTATION_SNAPSHOT:
		_not_found()
	if representation.desired_source_hash != source_hash:
		_not_found()

	target = get_map_snapshot_target(doc, map_key, row_name)
	if not target:
		_not_found()
	file_doc = get_generated_snapshot_file(target.snapshot_url, doc.name)
	if not is_owned_generated_snapshot_file(file_doc, doc.name, target.snapshot_url):
		_not_found()
	return doc, representation, file_doc


@frappe.whitelist(allow_guest=True)
def public_map_snapshot_image(
	property_instruction: str,
	map_key: str,
	source_hash: str,
	row_name: str | None = None,
):
	_, representation, file_doc = resolve_current_public_snapshot_file(
		property_instruction=property_instruction,
		map_key=map_key,
		source_hash=source_hash,
		row_name=row_name,
	)
	try:
		content = file_doc.get_content()
	except Exception:
		_not_found()
	if isinstance(content, str):
		content = content.encode("utf-8")
	if not content.startswith(b"\x89PNG\r\n\x1a\n"):
		_not_found()
	frappe.response["type"] = "binary"
	frappe.response["filename"] = _clean_text(file_doc.file_name) or "map-snapshot.png"
	frappe.response["filecontent"] = content
	if not hasattr(frappe.local, "response_headers") or frappe.local.response_headers is None:
		frappe.local.response_headers = Headers()
	frappe.local.response_headers.set("Content-Type", "image/png")
	frappe.local.response_headers.set("X-Content-Type-Options", "nosniff")
	frappe.local.response_headers.set("X-Robots-Tag", PUBLIC_MAP_SNAPSHOT_NOINDEX)
	frappe.local.response_headers.set(
		"Cache-Control",
		f"public, max-age={PUBLIC_MAP_SNAPSHOT_CACHE_SECONDS}",
	)
	frappe.local.response_headers.set("ETag", representation.desired_source_hash)
	return
