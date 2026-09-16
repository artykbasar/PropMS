from __future__ import annotations

from dataclasses import asdict, dataclass

import frappe
from frappe import _

from .validation import extract_google_maps_embed_url


BLOCK_DOCTYPE = "Property Instruction Block"
BLOCK_TABLE = "`tabProperty Instruction Block`"
LEGACY_FIELD_NAME = "google_maps_embed_html"
CANONICAL_FIELD_NAME = "custom_map_embed_url"

SAFE_CANONICAL = "CANONICAL_VALID"
COPY_LEGACY = "LEGACY_ONLY_VALID"
BLOCK_CANONICAL = "CANONICAL_INVALID"
BLOCK_LEGACY = "LEGACY_ONLY_INVALID"


@dataclass(frozen=True)
class LegacyFieldRemovalCandidate:
	name: str
	parent: str
	classification: str
	canonical_url: str = ""
	legacy_url: str = ""

	def to_dict(self) -> dict[str, str]:
		return asdict(self)


@dataclass(frozen=True)
class LegacyFieldRemovalAudit:
	table_exists: bool
	legacy_column_exists: bool
	canonical_column_exists: bool
	candidates: tuple[LegacyFieldRemovalCandidate, ...] = ()

	@property
	def blockers(self) -> tuple[LegacyFieldRemovalCandidate, ...]:
		return tuple(
			candidate
			for candidate in self.candidates
			if candidate.classification in {BLOCK_CANONICAL, BLOCK_LEGACY}
		)

	@property
	def copy_candidates(self) -> tuple[LegacyFieldRemovalCandidate, ...]:
		return tuple(candidate for candidate in self.candidates if candidate.classification == COPY_LEGACY)

	def to_dict(self) -> dict[str, object]:
		counts: dict[str, int] = {}
		for candidate in self.candidates:
			counts[candidate.classification] = counts.get(candidate.classification, 0) + 1
		return {
			"table_exists": self.table_exists,
			"legacy_column_exists": self.legacy_column_exists,
			"canonical_column_exists": self.canonical_column_exists,
			"counts": counts,
			"candidate_count": len(self.candidates),
			"blocker_count": len(self.blockers),
			"copy_count": len(self.copy_candidates),
			"candidates": [candidate.to_dict() for candidate in self.candidates],
		}


def _clean_text(value) -> str:
	return (value or "").strip()


def _validate_embed_input(value: str) -> str:
	return extract_google_maps_embed_url(value) or ""


def classify_legacy_field_row(*, name: str, parent: str, canonical_raw: str, legacy_raw: str) -> LegacyFieldRemovalCandidate:
	canonical_raw = _clean_text(canonical_raw)
	legacy_raw = _clean_text(legacy_raw)

	if canonical_raw:
		try:
			canonical_url = _validate_embed_input(canonical_raw)
		except Exception:
			return LegacyFieldRemovalCandidate(
				name=name,
				parent=parent,
				classification=BLOCK_CANONICAL,
			)
		return LegacyFieldRemovalCandidate(
			name=name,
			parent=parent,
			classification=SAFE_CANONICAL,
			canonical_url=canonical_url,
		)

	try:
		legacy_url = _validate_embed_input(legacy_raw)
	except Exception:
		return LegacyFieldRemovalCandidate(
			name=name,
			parent=parent,
			classification=BLOCK_LEGACY,
		)
	if not legacy_url:
		return LegacyFieldRemovalCandidate(
			name=name,
			parent=parent,
			classification=BLOCK_LEGACY,
		)
	return LegacyFieldRemovalCandidate(
		name=name,
		parent=parent,
		classification=COPY_LEGACY,
		legacy_url=legacy_url,
	)


def _load_legacy_rows(*, canonical_column_exists: bool) -> list[dict[str, object]]:
	canonical_select = f"`{CANONICAL_FIELD_NAME}`" if canonical_column_exists else "''"
	return frappe.db.sql(
		f"""
		select
			`name`,
			`parent`,
			{canonical_select} as `{CANONICAL_FIELD_NAME}`,
			`{LEGACY_FIELD_NAME}`
		from {BLOCK_TABLE}
		where coalesce(trim(`{LEGACY_FIELD_NAME}`), '') != ''
		order by `parent` asc, `idx` asc, `name` asc
		""",
		as_dict=True,
	)


def audit_legacy_field_removal() -> LegacyFieldRemovalAudit:
	if not frappe.db.table_exists(BLOCK_DOCTYPE):
		return LegacyFieldRemovalAudit(False, False, False)

	legacy_column_exists = frappe.db.has_column(BLOCK_DOCTYPE, LEGACY_FIELD_NAME)
	canonical_column_exists = frappe.db.has_column(BLOCK_DOCTYPE, CANONICAL_FIELD_NAME)
	if not legacy_column_exists:
		return LegacyFieldRemovalAudit(True, False, canonical_column_exists)

	candidates = tuple(
		classify_legacy_field_row(
			name=_clean_text(row.get("name")),
			parent=_clean_text(row.get("parent")),
			canonical_raw=_clean_text(row.get(CANONICAL_FIELD_NAME)),
			legacy_raw=_clean_text(row.get(LEGACY_FIELD_NAME)),
		)
		for row in _load_legacy_rows(canonical_column_exists=canonical_column_exists)
	)
	return LegacyFieldRemovalAudit(True, True, canonical_column_exists, candidates)


def _throw_blockers(audit: LegacyFieldRemovalAudit):
	if not audit.blockers:
		return
	identifiers = ", ".join(
		f"{candidate.parent}/{candidate.name} ({candidate.classification})"
		for candidate in audit.blockers[:10]
	)
	if len(audit.blockers) > 10:
		identifiers += _(" and {0} more").format(len(audit.blockers) - 10)
	frappe.throw(
		_(
			"Cannot remove the legacy Google Maps block field because unresolved rows remain: {0}. "
			"Fix the canonical Google Maps Embed iframe or URL before retrying migration."
		).format(identifiers)
	)


def preflight_legacy_field_removal() -> dict[str, object]:
	"""Validate legacy block-map data before model sync removes the field metadata."""
	audit = audit_legacy_field_removal()
	_throw_blockers(audit)
	return audit.to_dict()


def migrate_and_drop_legacy_field() -> dict[str, object]:
	"""Rescue legacy-only rows, then physically drop only the deprecated legacy column."""
	audit = audit_legacy_field_removal()
	if not audit.table_exists or not audit.legacy_column_exists:
		return {
			**audit.to_dict(),
			"updated_count": 0,
			"dropped": False,
		}
	if not audit.canonical_column_exists:
		frappe.throw(
			_("Cannot remove the legacy Google Maps block field because the canonical field column is missing.")
		)

	# Validate the complete physical legacy dataset before making any writes.
	_throw_blockers(audit)

	updated_count = 0
	for candidate in audit.copy_candidates:
		frappe.db.set_value(
			BLOCK_DOCTYPE,
			candidate.name,
			CANONICAL_FIELD_NAME,
			candidate.legacy_url,
			update_modified=False,
		)
		updated_count += 1

	# Hard precondition immediately before destructive DDL: every legacy row must
	# now have a valid canonical source and no copy work may remain.
	final_audit = audit_legacy_field_removal()
	_throw_blockers(final_audit)
	if final_audit.copy_candidates:
		frappe.throw(
			_("Cannot remove the legacy Google Maps block field because legacy-only rows remain after migration.")
		)

	frappe.db.sql_ddl(f"alter table {BLOCK_TABLE} drop column `{LEGACY_FIELD_NAME}`")
	return {
		**final_audit.to_dict(),
		"updated_count": updated_count,
		"dropped": True,
	}
