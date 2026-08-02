from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass

import frappe
from frappe.utils import cint
from frappe.utils import get_table_name

from .jobs import queue_snapshot_generation
from .manifest import (
	SNAPSHOT_STATUS_FAILED,
	SNAPSHOT_STATUS_PENDING,
	SNAPSHOT_STATUS_READY,
)
from .validation import (
	extract_google_maps_embed_url,
	get_google_maps_embed_kind,
	validate_google_maps_embed_url,
)


LEGACY_FIELD_NAME = "google_maps_embed_html"
CANONICAL_FIELD_NAME = "custom_map_embed_url"
MIGRATION_DEFAULT_BATCH_SIZE = 10
MIGRATION_MAX_BATCH_SIZE = 50
MIGRATABLE_CLASSIFICATIONS = {"LEGACY_ONLY_VALID"}
ALL_CLASSIFICATIONS = (
	"EMPTY",
	"LEGACY_ONLY_VALID",
	"LEGACY_ONLY_INVALID",
	"CANONICAL_ONLY_VALID",
	"BOTH_EQUIVALENT",
	"BOTH_CONFLICT",
	"CANONICAL_INVALID",
	"LEGACY_MULTIPLE_IFRAMES",
	"LEGACY_SRCDOC",
	"LEGACY_UNTRUSTED_HOST",
)


@dataclass(frozen=True)
class LegacyMapMigrationCandidate:
	doctype: str
	document_name: str
	row_name: str | None
	classification: str
	canonical_url: str
	map_kind: str
	published: bool
	snapshot_status: str
	record_signature: str
	legacy_value_present: bool
	canonical_value_present: bool
	legacy_validation_category: str = ""
	canonical_validation_category: str = ""
	legacy_url_fingerprint: str = ""
	canonical_url_fingerprint: str = ""

	def identity(self) -> tuple[str, str, str]:
		return (self.doctype, self.document_name, self.row_name or "")

	def to_dict(self) -> dict[str, object]:
		return asdict(self)


@dataclass(frozen=True)
class LegacyMapMigrationPlan:
	plan_hash: str
	candidates: tuple[LegacyMapMigrationCandidate, ...]
	counts: dict[str, int]

	def to_dict(self) -> dict[str, object]:
		return {
			"plan_hash": self.plan_hash,
			"counts": dict(self.counts),
			"candidates": [candidate.to_dict() for candidate in self.candidates],
		}


def _clean_text(value) -> str:
	return (value or "").strip()


def _url_fingerprint(value: str | None) -> str:
	text = _clean_text(value)
	if not text:
		return ""
	return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def _build_record_signature(
	*,
	doctype: str,
	document_name: str,
	row_name: str | None,
	legacy_value: str,
	canonical_value: str,
	snapshot_url: str,
	snapshot_status: str,
	snapshot_source_hash: str,
	snapshot_error_log: str,
) -> str:
	payload = {
		"doctype": _clean_text(doctype),
		"document_name": _clean_text(document_name),
		"row_name": _clean_text(row_name) or None,
		"legacy_value": legacy_value,
		"canonical_value": canonical_value,
		"snapshot_url": snapshot_url,
		"snapshot_status": snapshot_status,
		"snapshot_source_hash": snapshot_source_hash,
		"snapshot_error_log": snapshot_error_log,
	}
	return hashlib.sha256(
		json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
	).hexdigest()


def _classify_legacy_error(error: Exception) -> str:
	message = frappe.safe_decode(str(error))
	if "multiple-iframes-not-allowed" in message:
		return "LEGACY_MULTIPLE_IFRAMES"
	if "srcdoc" in message:
		return "LEGACY_SRCDOC"
	if "trusted Google Maps hostname" in message:
		return "LEGACY_UNTRUSTED_HOST"
	return "LEGACY_ONLY_INVALID"


def _classify_canonical_error(error: Exception) -> str:
	return "CANONICAL_INVALID" if error else ""


def _read_parent_candidate(doc) -> LegacyMapMigrationCandidate:
	canonical_raw = _clean_text(doc.get(CANONICAL_FIELD_NAME))
	canonical_url = ""
	canonical_validation_category = ""
	classification = "EMPTY"
	if canonical_raw:
		try:
			canonical_url = validate_google_maps_embed_url(canonical_raw)
			classification = "CANONICAL_ONLY_VALID"
		except Exception as error:
			canonical_validation_category = _classify_canonical_error(error)
			classification = "CANONICAL_INVALID"

	return LegacyMapMigrationCandidate(
		doctype="Property Instruction",
		document_name=doc.name,
		row_name=None,
		classification=classification,
		canonical_url=canonical_url,
		map_kind=get_google_maps_embed_kind(canonical_url),
		published=bool(cint(doc.published)),
		snapshot_status=_clean_text(doc.get("custom_map_snapshot_status")),
		record_signature=_build_record_signature(
			doctype="Property Instruction",
			document_name=doc.name,
			row_name=None,
			legacy_value="",
			canonical_value=canonical_raw,
			snapshot_url=_clean_text(doc.get("custom_map_snapshot")),
			snapshot_status=_clean_text(doc.get("custom_map_snapshot_status")),
			snapshot_source_hash=_clean_text(doc.get("custom_map_snapshot_source_hash")),
			snapshot_error_log=_clean_text(doc.get("custom_map_snapshot_error_log")),
		),
		legacy_value_present=False,
		canonical_value_present=bool(canonical_raw),
		canonical_validation_category=canonical_validation_category,
		canonical_url_fingerprint=_url_fingerprint(canonical_url),
	)


def _read_block_candidate(doc, row) -> LegacyMapMigrationCandidate:
	canonical_raw = _clean_text(row.get(CANONICAL_FIELD_NAME))
	legacy_raw = _clean_text(row.get(LEGACY_FIELD_NAME))
	canonical_url = ""
	legacy_url = ""
	canonical_validation_category = ""
	legacy_validation_category = ""
	classification = "EMPTY"

	if canonical_raw:
		try:
			canonical_url = validate_google_maps_embed_url(canonical_raw)
		except Exception as error:
			canonical_validation_category = _classify_canonical_error(error)

	if legacy_raw:
		try:
			legacy_url = extract_google_maps_embed_url(legacy_raw) or ""
		except Exception as error:
			legacy_validation_category = _classify_legacy_error(error)

	if canonical_raw and canonical_validation_category:
		classification = "CANONICAL_INVALID"
	elif not canonical_raw and not legacy_raw:
		classification = "EMPTY"
	elif canonical_url and not legacy_raw:
		classification = "CANONICAL_ONLY_VALID"
	elif legacy_raw and not canonical_raw:
		classification = "LEGACY_ONLY_VALID" if legacy_url else (legacy_validation_category or "LEGACY_ONLY_INVALID")
	elif canonical_url and legacy_url:
		classification = "BOTH_EQUIVALENT" if canonical_url == legacy_url else "BOTH_CONFLICT"
	elif canonical_url and legacy_raw:
		classification = "CANONICAL_ONLY_VALID"
	elif legacy_validation_category:
		classification = legacy_validation_category
	else:
		classification = "EMPTY"

	return LegacyMapMigrationCandidate(
		doctype="Property Instruction Block",
		document_name=doc.name,
		row_name=row.name,
		classification=classification,
		canonical_url=canonical_url or legacy_url,
		map_kind=get_google_maps_embed_kind(canonical_url or legacy_url),
		published=bool(cint(doc.published)),
		snapshot_status=_clean_text(row.get("custom_map_snapshot_status")),
		record_signature=_build_record_signature(
			doctype="Property Instruction Block",
			document_name=doc.name,
			row_name=row.name,
			legacy_value=legacy_raw,
			canonical_value=canonical_raw,
			snapshot_url=_clean_text(row.get("custom_map_snapshot")),
			snapshot_status=_clean_text(row.get("custom_map_snapshot_status")),
			snapshot_source_hash=_clean_text(row.get("custom_map_snapshot_source_hash")),
			snapshot_error_log=_clean_text(row.get("custom_map_snapshot_error_log")),
		),
		legacy_value_present=bool(legacy_raw),
		canonical_value_present=bool(canonical_raw),
		legacy_validation_category=legacy_validation_category,
		canonical_validation_category=canonical_validation_category,
		legacy_url_fingerprint=_url_fingerprint(legacy_url),
		canonical_url_fingerprint=_url_fingerprint(canonical_url),
	)


def audit_legacy_map_records() -> dict[str, object]:
	candidates: list[LegacyMapMigrationCandidate] = []
	for row in frappe.get_all(
		"Property Instruction",
		fields=["name", "published"],
		order_by="name asc",
		limit_page_length=0,
	):
		doc = frappe.get_doc("Property Instruction", row.name)
		candidates.append(_read_parent_candidate(doc))
		for block in doc.instruction_blocks or []:
			if not block.get("name"):
				continue
			candidates.append(_read_block_candidate(doc, block))

	candidates = sorted(candidates, key=lambda item: item.identity())
	counts = {classification: 0 for classification in ALL_CLASSIFICATIONS}
	for candidate in candidates:
		counts[candidate.classification] = counts.get(candidate.classification, 0) + 1
	return {
		"counts": counts,
		"candidates": [candidate.to_dict() for candidate in candidates],
	}


def plan_legacy_map_migration(audit_result: dict[str, object] | None = None) -> LegacyMapMigrationPlan:
	audit_result = audit_result or audit_legacy_map_records()
	all_candidates = [
		LegacyMapMigrationCandidate(**candidate)
		for candidate in audit_result.get("candidates", [])
	]
	eligible_candidates = tuple(
		sorted(
			(candidate for candidate in all_candidates if candidate.classification in MIGRATABLE_CLASSIFICATIONS),
			key=lambda item: item.identity(),
		)
	)
	counts = {
		"audited": len(all_candidates),
		"eligible": len(eligible_candidates),
	}
	plan_payload = [
		{
			"doctype": candidate.doctype,
			"document_name": candidate.document_name,
			"row_name": candidate.row_name,
			"classification": candidate.classification,
			"canonical_url": candidate.canonical_url,
			"record_signature": candidate.record_signature,
		}
		for candidate in eligible_candidates
	]
	plan_hash = hashlib.sha256(
		json.dumps(plan_payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
	).hexdigest()[:16]
	return LegacyMapMigrationPlan(plan_hash=plan_hash, candidates=eligible_candidates, counts=counts)


def _get_doc_and_row(candidate: LegacyMapMigrationCandidate):
	doc = frappe.get_doc("Property Instruction", candidate.document_name)
	if candidate.doctype == "Property Instruction":
		return doc, None
	row = next((item for item in (doc.instruction_blocks or []) if _clean_text(item.name) == _clean_text(candidate.row_name)), None)
	return doc, row


def _rebuild_candidate(candidate: LegacyMapMigrationCandidate) -> LegacyMapMigrationCandidate | None:
	doc, row = _get_doc_and_row(candidate)
	if candidate.doctype == "Property Instruction":
		return _read_parent_candidate(doc)
	if not row:
		return None
	return _read_block_candidate(doc, row)


def _get_existing_fields(doctype: str, fieldnames: tuple[str, ...]) -> set[str]:
	table_name = get_table_name(doctype)
	rows = frappe.db.sql(
		f"SHOW COLUMNS FROM `{table_name}` WHERE Field IN ({', '.join(['%s'] * len(fieldnames))})",
		tuple(fieldnames),
		as_dict=True,
	)
	return {row["Field"] for row in rows}


def _set_pending_snapshot_state(doctype: str, name: str, canonical_url: str):
	existing_fields = _get_existing_fields(
		doctype,
		(
			CANONICAL_FIELD_NAME,
			"custom_map_snapshot_status",
			"custom_map_snapshot_error_log",
		),
	)
	values = {CANONICAL_FIELD_NAME: canonical_url}
	if "custom_map_snapshot_status" in existing_fields:
		values["custom_map_snapshot_status"] = SNAPSHOT_STATUS_PENDING
	if "custom_map_snapshot_error_log" in existing_fields:
		values["custom_map_snapshot_error_log"] = ""
	frappe.db.set_value(doctype, name, values, update_modified=False)


def apply_legacy_map_migration_plan(
	plan: LegacyMapMigrationPlan | dict[str, object] | None = None,
	*,
	commit_every: int = 25,
	commit: bool = False,
) -> dict[str, object]:
	if isinstance(plan, dict):
		plan = LegacyMapMigrationPlan(
			plan_hash=plan["plan_hash"],
			counts=plan.get("counts", {}),
			candidates=tuple(LegacyMapMigrationCandidate(**candidate) for candidate in plan.get("candidates", [])),
		)
	plan = plan or plan_legacy_map_migration()
	updated: list[dict[str, str | None]] = []
	skipped: list[dict[str, str | None]] = []
	processed = 0

	for candidate in plan.candidates:
		current = _rebuild_candidate(candidate)
		if not current:
			skipped.append(
				{
					"doctype": candidate.doctype,
					"document_name": candidate.document_name,
					"row_name": candidate.row_name,
					"reason": "missing-record",
				}
			)
			continue
		if current.record_signature != candidate.record_signature:
			skipped.append(
				{
					"doctype": candidate.doctype,
					"document_name": candidate.document_name,
					"row_name": candidate.row_name,
					"reason": "changed-after-plan",
				}
			)
			continue
		if current.classification != "LEGACY_ONLY_VALID":
			skipped.append(
				{
					"doctype": current.doctype,
					"document_name": current.document_name,
					"row_name": current.row_name,
					"reason": current.classification,
				}
			)
			continue
		if not current.canonical_url:
			skipped.append(
				{
					"doctype": current.doctype,
					"document_name": current.document_name,
					"row_name": current.row_name,
					"reason": "missing-canonical-url",
				}
			)
			continue
		if candidate.doctype != "Property Instruction Block" or not candidate.row_name:
			skipped.append(
				{
					"doctype": candidate.doctype,
					"document_name": candidate.document_name,
					"row_name": candidate.row_name,
					"reason": "unsupported-target",
				}
			)
			continue

		_set_pending_snapshot_state(candidate.doctype, candidate.row_name, current.canonical_url)
		updated.append(
			{
				"doctype": candidate.doctype,
				"document_name": candidate.document_name,
				"row_name": candidate.row_name,
				"classification": current.classification,
				"canonical_url_fingerprint": _url_fingerprint(current.canonical_url),
			}
		)
		processed += 1
		if commit and commit_every > 0 and processed % commit_every == 0:
			frappe.db.commit()

	if commit and processed % commit_every:
		frappe.db.commit()

	return {
		"plan_hash": plan.plan_hash,
		"eligible_count": len(plan.candidates),
		"updated_count": len(updated),
		"skipped_count": len(skipped),
		"updated": updated,
		"skipped": skipped,
	}


def migrate_google_maps_embed_html_to_custom_map_embed_url(*, commit_every: int = 25) -> dict[str, object]:
	audit_result = audit_legacy_map_records()
	plan = plan_legacy_map_migration(audit_result)
	result = apply_legacy_map_migration_plan(plan, commit_every=commit_every, commit=True)
	frappe.logger().info(
		"Legacy Google Maps migration plan %s applied: %s updated, %s skipped",
		plan.plan_hash,
		result["updated_count"],
		result["skipped_count"],
	)
	return {
		"audit_counts": audit_result["counts"],
		"plan": plan.to_dict(),
		"result": result,
	}


def _get_pending_backfill_targets(doc, *, include_failed: bool = False) -> tuple[bool, set[str]]:
	main_status = _clean_text(doc.get("custom_map_snapshot_status"))
	main_url = _clean_text(doc.get(CANONICAL_FIELD_NAME))
	include_main = False
	if main_url:
		try:
			validate_google_maps_embed_url(main_url)
		except Exception:
			include_main = False
		else:
			include_main = main_status == SNAPSHOT_STATUS_PENDING or (
				include_failed and main_status == SNAPSHOT_STATUS_FAILED
			)

	child_row_names: set[str] = set()
	for row in doc.instruction_blocks or []:
		if not _clean_text(row.get("name")):
			continue
		canonical_url = _clean_text(row.get(CANONICAL_FIELD_NAME))
		if not canonical_url:
			continue
		try:
			validate_google_maps_embed_url(canonical_url)
		except Exception:
			continue
		row_status = _clean_text(row.get("custom_map_snapshot_status"))
		if row_status == SNAPSHOT_STATUS_PENDING or (include_failed and row_status == SNAPSHOT_STATUS_FAILED):
			child_row_names.add(row.name)

	return include_main, child_row_names


@frappe.whitelist()
def enqueue_pending_migrated_map_snapshots(
	*,
	batch_size: int = MIGRATION_DEFAULT_BATCH_SIZE,
	cursor: str | None = None,
	dry_run: bool = True,
	include_failed: bool = False,
) -> dict[str, object]:
	frappe.only_for("System Manager")
	batch_size = max(1, min(cint(batch_size or MIGRATION_DEFAULT_BATCH_SIZE), MIGRATION_MAX_BATCH_SIZE))
	cursor = _clean_text(cursor)
	dry_run = bool(cint(dry_run))
	include_failed = bool(cint(include_failed))

	rows = frappe.get_all(
		"Property Instruction",
		filters={"name": [">", cursor]} if cursor else None,
		fields=["name", "published"],
		order_by="name asc",
		limit_page_length=batch_size,
	)

	inspected = 0
	eligible = 0
	queued = 0
	skipped = 0
	job_names: list[str] = []
	details: list[dict[str, object]] = []
	next_cursor = cursor or None

	for row in rows:
		inspected += 1
		next_cursor = row.name
		doc = frappe.get_doc("Property Instruction", row.name)
		if not cint(doc.published):
			skipped += 1
			details.append({"property_instruction": doc.name, "reason": "unpublished"})
			continue

		include_main, child_row_names = _get_pending_backfill_targets(doc, include_failed=include_failed)
		if not include_main and not child_row_names:
			skipped += 1
			details.append({"property_instruction": doc.name, "reason": "no-eligible-pending-targets"})
			continue

		eligible += 1
		if dry_run:
			details.append(
				{
					"property_instruction": doc.name,
					"main_target": include_main,
					"child_row_names": sorted(child_row_names),
					"queued": False,
				}
			)
			continue

		target_row_names = None if include_main else child_row_names
		result = queue_snapshot_generation(
			doc.name,
			retry_failed_only=bool(include_failed and not include_main and child_row_names and not any(
				_clean_text(item.get("custom_map_snapshot_status")) == SNAPSHOT_STATUS_PENDING
				for item in (doc.instruction_blocks or [])
				if _clean_text(item.get("name")) in child_row_names
			)),
			target_row_names=target_row_names,
		)
		if result.get("queued"):
			queued += 1
			if result.get("job_name"):
				job_names.append(result["job_name"])
		else:
			skipped += 1
		details.append(
			{
				"property_instruction": doc.name,
				"main_target": include_main,
				"child_row_names": sorted(child_row_names),
				"queued": bool(result.get("queued")),
				"job_name": result.get("job_name"),
			}
		)

	if not dry_run and queued:
		frappe.db.commit()

	return {
		"inspected_count": inspected,
		"eligible_count": eligible,
		"queued_count": queued,
		"skipped_count": skipped,
		"next_cursor": next_cursor,
		"job_names": job_names,
		"details": details,
		"dry_run": dry_run,
		"batch_size": batch_size,
	}
