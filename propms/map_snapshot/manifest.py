from __future__ import annotations

import json
import hashlib
from dataclasses import asdict, dataclass

import frappe

from .presentation import build_map_source_hash
from .storage import has_owned_generated_snapshot_file


SNAPSHOT_STATUS_NOT_REQUIRED = "Not Required"
SNAPSHOT_STATUS_PENDING = "Pending"
SNAPSHOT_STATUS_PROCESSING = "Processing"
SNAPSHOT_STATUS_READY = "Ready"
SNAPSHOT_STATUS_FAILED = "Failed"
SNAPSHOT_STATUS_OPTIONS = [
	SNAPSHOT_STATUS_NOT_REQUIRED,
	SNAPSHOT_STATUS_PENDING,
	SNAPSHOT_STATUS_PROCESSING,
	SNAPSHOT_STATUS_READY,
	SNAPSHOT_STATUS_FAILED,
]

PARENT_SNAPSHOT_FIELDS = (
	"custom_map_snapshot",
	"custom_map_snapshot_status",
	"custom_map_snapshot_source_hash",
	"custom_map_snapshot_generated_at",
	"custom_map_snapshot_error_log",
)


@dataclass(frozen=True)
class MapSnapshotManifestEntry:
	map_key: str
	row_name: str | None
	map_kind: str
	expected_source_hash: str

	def identity(self) -> tuple[str, str | None]:
		return (self.map_key, self.row_name)

	def to_dict(self) -> dict[str, str | None]:
		return {
			"map_key": self.map_key,
			"row_name": self.row_name,
			"map_kind": self.map_kind,
			"expected_source_hash": self.expected_source_hash,
		}


@dataclass(frozen=True)
class MapSnapshotTarget:
	map_key: str
	row_name: str | None
	map_kind: str
	embed_url: str
	expected_source_hash: str
	snapshot_url: str
	snapshot_status: str
	snapshot_source_hash: str
	snapshot_error_log: str

	def identity(self) -> tuple[str, str | None]:
		return (self.map_key, self.row_name)

	def to_manifest_entry(self) -> MapSnapshotManifestEntry:
		return MapSnapshotManifestEntry(
			map_key=self.map_key,
			row_name=self.row_name,
			map_kind=self.map_kind,
			expected_source_hash=self.expected_source_hash,
		)


def _clean_text(value) -> str:
	return (value or "").strip()


def _get_snapshot_field_values(target) -> tuple[str, str, str, str]:
	return (
		_clean_text(target.get("custom_map_snapshot")),
		_clean_text(target.get("custom_map_snapshot_status")),
		_clean_text(target.get("custom_map_snapshot_source_hash")),
		_clean_text(target.get("custom_map_snapshot_error_log")),
	)


def snapshot_file_exists(snapshot_url: str | None, property_instruction: str) -> bool:
	return has_owned_generated_snapshot_file(snapshot_url, property_instruction)


def is_snapshot_current(
	snapshot_url: str | None,
	snapshot_status: str | None,
	snapshot_source_hash: str | None,
	desired_hash: str,
	property_instruction: str,
) -> bool:
	if _clean_text(snapshot_status) != SNAPSHOT_STATUS_READY:
		return False
	if _clean_text(snapshot_source_hash) != _clean_text(desired_hash):
		return False
	if not snapshot_file_exists(snapshot_url, property_instruction):
		return False
	return True


def get_current_main_map_target(doc) -> MapSnapshotTarget | None:
	embed_url = _clean_text(doc.get_custom_property_map_embed_url())
	if not embed_url:
		return None

	property_map = doc.get_property_map()
	map_kind = _clean_text(property_map.embed_kind)
	if not map_kind:
		return None

	snapshot_url, snapshot_status, snapshot_source_hash, snapshot_error_log = _get_snapshot_field_values(doc)
	expected_source_hash = build_map_source_hash(embed_url, map_kind)
	return MapSnapshotTarget(
		map_key="property-location",
		row_name=None,
		map_kind=map_kind,
		embed_url=embed_url,
		expected_source_hash=expected_source_hash,
		snapshot_url=snapshot_url,
		snapshot_status=snapshot_status,
		snapshot_source_hash=snapshot_source_hash,
		snapshot_error_log=snapshot_error_log,
	)


def get_current_block_map_targets(doc) -> list[MapSnapshotTarget]:
	targets: list[MapSnapshotTarget] = []
	for row in doc.instruction_blocks or []:
		if not _clean_text(row.get("name")):
			continue
		embed_input = _clean_text(doc.get_block_map_embed_input(row))
		if not embed_input:
			continue
		block_map = doc.get_block_map_data(row)
		embed_url = _clean_text(block_map.embed_url)
		map_kind = _clean_text(block_map.embed_kind)
		if not (embed_url and map_kind):
			continue
		snapshot_url, snapshot_status, snapshot_source_hash, snapshot_error_log = _get_snapshot_field_values(row)
		targets.append(
			MapSnapshotTarget(
				map_key="block",
				row_name=row.name,
				map_kind=map_kind,
				embed_url=embed_url,
				expected_source_hash=build_map_source_hash(embed_url, map_kind),
				snapshot_url=snapshot_url,
				snapshot_status=snapshot_status,
				snapshot_source_hash=snapshot_source_hash,
				snapshot_error_log=snapshot_error_log,
			)
		)
	return targets


def get_all_map_snapshot_targets(doc) -> list[MapSnapshotTarget]:
	targets: list[MapSnapshotTarget] = []
	main_target = get_current_main_map_target(doc)
	if main_target:
		targets.append(main_target)
	targets.extend(get_current_block_map_targets(doc))
	return targets


def get_map_snapshot_target(doc, map_key: str, row_name: str | None = None) -> MapSnapshotTarget | None:
	for target in get_all_map_snapshot_targets(doc):
		if target.map_key == map_key and target.row_name == row_name:
			return target
	return None


def build_manifest_entries(
	doc,
	*,
	force: bool = False,
	retry_failed_only: bool = False,
	allowed_statuses: set[str] | None = None,
	target_row_names: set[str] | None = None,
) -> list[MapSnapshotManifestEntry]:
	entries: list[MapSnapshotManifestEntry] = []
	for target in get_all_map_snapshot_targets(doc):
		if target_row_names is not None and target.row_name not in target_row_names:
			continue

		is_current = is_snapshot_current(
			target.snapshot_url,
			target.snapshot_status,
			target.snapshot_source_hash,
			target.expected_source_hash,
			doc.name,
		)

		if retry_failed_only and target.snapshot_status != SNAPSHOT_STATUS_FAILED:
			continue
		if allowed_statuses and target.snapshot_status not in allowed_statuses:
			continue
		if not force and not retry_failed_only and is_current:
			continue

		entries.append(target.to_manifest_entry())

	return sorted(entries, key=lambda entry: (entry.map_key, entry.row_name or ""))


def build_manifest_hash(entries: list[MapSnapshotManifestEntry]) -> str:
	payload = [entry.to_dict() for entry in sorted(entries, key=lambda item: (item.map_key, item.row_name or ""))]
	encoded = json.dumps(payload, sort_keys=True, separators=(",", ":"))
	return hashlib.sha256(encoded.encode("utf-8")).hexdigest()[:12]


def serialize_manifest_entries(entries: list[MapSnapshotManifestEntry]) -> list[dict[str, str | None]]:
	return [entry.to_dict() for entry in entries]


def deserialize_manifest_entries(values: list[dict[str, str | None]] | None) -> list[MapSnapshotManifestEntry]:
	entries: list[MapSnapshotManifestEntry] = []
	for value in values or []:
		entries.append(
			MapSnapshotManifestEntry(
				map_key=_clean_text(value.get("map_key")),
				row_name=_clean_text(value.get("row_name")) or None,
				map_kind=_clean_text(value.get("map_kind")),
				expected_source_hash=_clean_text(value.get("expected_source_hash")),
			)
		)
	return entries


def describe_manifest_entries(entries: list[MapSnapshotManifestEntry]) -> list[dict[str, str | None]]:
	return [asdict(entry) for entry in entries]
