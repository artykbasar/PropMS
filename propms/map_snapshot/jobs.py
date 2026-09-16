from __future__ import annotations

from contextlib import ExitStack

import frappe
from frappe.utils import now_datetime
from frappe.utils.background_jobs import enqueue, get_job_status
from frappe.utils.synchronization import LockTimeoutError, filelock
from rq.job import JobStatus

from .error_logging import log_map_snapshot_failure
from .manifest import (
	SNAPSHOT_STATUS_FAILED,
	SNAPSHOT_STATUS_NOT_REQUIRED,
	SNAPSHOT_STATUS_PENDING,
	SNAPSHOT_STATUS_PROCESSING,
	SNAPSHOT_STATUS_READY,
	MapSnapshotManifestEntry,
	build_manifest_entries,
	build_manifest_hash,
	deserialize_manifest_entries,
	get_map_snapshot_target,
	serialize_manifest_entries,
)
from .storage import (
	delete_generated_snapshot_file_if_owned,
	get_generated_snapshot_file,
	save_snapshot_png,
	schedule_delete_generated_snapshot_file,
)


MAP_SNAPSHOT_DOC_LOCK_PREFIX = "propms:map-snapshot:"
MAP_SNAPSHOT_GLOBAL_LOCK = "propms:map-snapshot:global"
MAP_SNAPSHOT_QUEUE = "long"
MAP_SNAPSHOT_TIMEOUT = 180
MAP_SNAPSHOT_JOB_PREFIX = "propms-map-snapshot"


def capture_map_png(*args, **kwargs):
	from .capture import capture_map_png as _capture_map_png

	return _capture_map_png(*args, **kwargs)


def build_snapshot_job_id(property_instruction: str, manifest_hash: str) -> str:
	return f"{MAP_SNAPSHOT_JOB_PREFIX}:{property_instruction}:{manifest_hash}"


def _target_identity(entry: MapSnapshotManifestEntry) -> tuple[str, str | None]:
	return (entry.map_key, entry.row_name)


def _set_parent_snapshot_fields(property_instruction: str, values: dict[str, object]):
	frappe.db.set_value("Property Instruction", property_instruction, values, update_modified=False)


def _set_block_snapshot_fields(row_name: str, values: dict[str, object]):
	frappe.db.set_value("Property Instruction Block", row_name, values, update_modified=False)


def _get_target_state(property_instruction: str, map_key: str, row_name: str | None) -> dict[str, object]:
	if map_key == "property-location":
		table = "tabProperty Instruction"
		name = property_instruction
	elif map_key == "block" and row_name:
		table = "tabProperty Instruction Block"
		name = row_name
	else:
		raise frappe.ValidationError("Unsupported snapshot target.")

	row = frappe.db.sql(
		f"""
		select
			custom_map_snapshot,
			custom_map_snapshot_status,
			custom_map_snapshot_source_hash,
			custom_map_snapshot_generated_at,
			custom_map_snapshot_error_log
		from `{table}`
		where name = %s
		""",
		(name,),
		as_dict=True,
	)
	if not row:
		return {}
	return dict(row[0])


def update_snapshot_fields(
	*,
	property_instruction: str,
	map_key: str,
	row_name: str | None,
	values: dict[str, object],
):
	old_values = _get_target_state(property_instruction, map_key, row_name)
	if map_key == "property-location":
		_set_parent_snapshot_fields(property_instruction, values)
	elif map_key == "block" and row_name:
		_set_block_snapshot_fields(row_name, values)
	else:
		raise frappe.ValidationError("Unsupported snapshot update target.")


def _transition_target_state(
	*,
	property_instruction: str,
	entry: MapSnapshotManifestEntry,
	values: dict[str, object],
	expected_statuses: tuple[str, ...] | None = None,
) -> bool:
	doc = frappe.get_doc("Property Instruction", property_instruction)
	target = get_map_snapshot_target(doc, entry.map_key, entry.row_name)
	if not target or target.expected_source_hash != entry.expected_source_hash:
		return False

	current_status = (target.snapshot_status or "").strip()
	if expected_statuses and current_status not in expected_statuses:
		return False

	update_snapshot_fields(
		property_instruction=property_instruction,
		map_key=entry.map_key,
		row_name=entry.row_name,
		values=values,
	)
	return True


def mark_snapshot_processing(property_instruction: str, entry: MapSnapshotManifestEntry):
	return _transition_target_state(
		property_instruction=property_instruction,
		entry=entry,
		values={
			"custom_map_snapshot_status": SNAPSHOT_STATUS_PROCESSING,
			"custom_map_snapshot_error_log": "",
		},
		expected_statuses=(SNAPSHOT_STATUS_PENDING, SNAPSHOT_STATUS_FAILED),
	)


def mark_snapshot_success(
	*,
	property_instruction: str,
	entry: MapSnapshotManifestEntry,
	file_url: str,
	source_hash: str,
	generated_at,
):
	return _transition_target_state(
		property_instruction=property_instruction,
		entry=entry,
		values={
			"custom_map_snapshot": file_url,
			"custom_map_snapshot_status": SNAPSHOT_STATUS_READY,
			"custom_map_snapshot_source_hash": source_hash,
			"custom_map_snapshot_generated_at": generated_at,
			"custom_map_snapshot_error_log": "",
		},
		expected_statuses=(SNAPSHOT_STATUS_PROCESSING, SNAPSHOT_STATUS_PENDING),
	)


def mark_snapshot_failure(
	*,
	property_instruction: str,
	entry: MapSnapshotManifestEntry,
	error_log_name: str,
):
	return _transition_target_state(
		property_instruction=property_instruction,
		entry=entry,
		values={
			"custom_map_snapshot_status": SNAPSHOT_STATUS_FAILED,
			"custom_map_snapshot_error_log": error_log_name,
		},
		expected_statuses=(SNAPSHOT_STATUS_PROCESSING, SNAPSHOT_STATUS_PENDING),
	)


def build_manifest_for_save(doc) -> tuple[list[MapSnapshotManifestEntry], str]:
	entries = build_manifest_entries(doc, allowed_statuses={SNAPSHOT_STATUS_PENDING})
	return entries, build_manifest_hash(entries)


def enqueue_snapshot_job(
	doc,
	*,
	entries: list[MapSnapshotManifestEntry],
	manifest_hash: str,
):
	if not entries:
		return None
	job_id = build_snapshot_job_id(doc.name, manifest_hash)
	enqueue(
		"propms.map_snapshot.jobs.capture_property_instruction_maps",
		queue=MAP_SNAPSHOT_QUEUE,
		timeout=MAP_SNAPSHOT_TIMEOUT,
		enqueue_after_commit=True,
		job_name=job_id,
		job_id=job_id,
		deduplicate=True,
		property_instruction=doc.name,
		expected_manifest_hash=manifest_hash,
		entries=serialize_manifest_entries(entries),
	)
	return job_id


def queue_document_snapshot_job(doc):
	entries, manifest_hash = build_manifest_for_save(doc)
	if not entries:
		return None
	doc.flags.map_snapshot_manifest_entries = serialize_manifest_entries(entries)
	doc.flags.map_snapshot_manifest_hash = manifest_hash
	doc.flags.map_snapshot_job_id = enqueue_snapshot_job(
		doc,
		entries=entries,
		manifest_hash=manifest_hash,
	)
	return doc.flags.map_snapshot_job_id


def _mark_entries_pending(doc, entries: list[MapSnapshotManifestEntry]):
	for entry in entries:
		update_snapshot_fields(
			property_instruction=doc.name,
			map_key=entry.map_key,
			row_name=entry.row_name,
			values={
				"custom_map_snapshot_status": SNAPSHOT_STATUS_PENDING,
				"custom_map_snapshot_error_log": "",
			},
		)


def queue_snapshot_generation(
	name: str,
	*,
	force: bool = False,
	retry_failed_only: bool = False,
	target_row_names: set[str] | None = None,
) -> dict[str, object]:
	doc = frappe.get_doc("Property Instruction", name)
	entries = build_manifest_entries(
		doc,
		force=force,
		retry_failed_only=retry_failed_only,
		target_row_names=target_row_names,
	)
	if not entries:
		has_maps = bool(build_manifest_entries(doc, force=True, target_row_names=target_row_names))
		return {
			"queued": False,
			"already_current": bool(has_maps and not retry_failed_only),
			"no_maps": not has_maps,
			"job_name": None,
			"affected_map_count": 0,
		}

	manifest_hash = build_manifest_hash(entries)
	job_id = build_snapshot_job_id(doc.name, manifest_hash)
	existing_job_status = get_job_status(job_id)
	if existing_job_status in {JobStatus.QUEUED, JobStatus.STARTED}:
		return {
			"queued": True,
			"already_current": False,
			"no_maps": False,
			"job_name": job_id,
			"affected_map_count": len(entries),
		}

	_mark_entries_pending(doc, entries)
	job_id = enqueue_snapshot_job(doc, entries=entries, manifest_hash=manifest_hash)
	return {
		"queued": bool(job_id),
		"already_current": False,
		"no_maps": False,
		"job_name": job_id,
		"affected_map_count": len(entries),
	}


def _current_job_id() -> str | None:
	try:
		import rq

		job = rq.get_current_job()
		return job.id if job else None
	except Exception:
		return None


def capture_property_instruction_maps(property_instruction: str, expected_manifest_hash: str, entries: list[dict]):
	manifest_entries = deserialize_manifest_entries(entries)
	if build_manifest_hash(manifest_entries) != expected_manifest_hash:
		return {"status": "stale-manifest", "processed": 0}

	try:
		with ExitStack() as stack:
			stack.enter_context(filelock(MAP_SNAPSHOT_GLOBAL_LOCK, timeout=5, is_global=True))
			stack.enter_context(filelock(f"{MAP_SNAPSHOT_DOC_LOCK_PREFIX}{property_instruction}", timeout=5))
			processed = 0
			entry_results: list[dict[str, object]] = []
			for entry in manifest_entries:
				doc = frappe.get_doc("Property Instruction", property_instruction)
				target = get_map_snapshot_target(doc, entry.map_key, entry.row_name)
				if not target or target.expected_source_hash != entry.expected_source_hash:
					entry_results.append(
						{
							"map_key": entry.map_key,
							"row_name": entry.row_name,
							"result": "superseded",
							"final_status": None,
							"source_hash": entry.expected_source_hash,
							"file_url": None,
						}
					)
					continue

				old_snapshot_url = target.snapshot_url
				if not mark_snapshot_processing(property_instruction, entry):
					entry_results.append(
						{
							"map_key": entry.map_key,
							"row_name": entry.row_name,
							"result": "superseded",
							"final_status": _get_target_state(property_instruction, entry.map_key, entry.row_name).get(
								"custom_map_snapshot_status"
							),
							"source_hash": entry.expected_source_hash,
							"file_url": None,
						}
					)
					continue
				processed += 1
				try:
					result = capture_map_png(
						property_instruction,
						entry.map_key,
						row_name=entry.row_name,
						expected_source_hash=entry.expected_source_hash,
					)
					if result.source_hash != entry.expected_source_hash:
						raise frappe.ValidationError("Captured source hash did not match expected manifest hash.")

					doc_after_capture = frappe.get_doc("Property Instruction", property_instruction)
					target_after_capture = get_map_snapshot_target(doc_after_capture, entry.map_key, entry.row_name)
					if not target_after_capture or target_after_capture.expected_source_hash != entry.expected_source_hash:
						entry_results.append(
							{
								"map_key": entry.map_key,
								"row_name": entry.row_name,
								"result": "superseded",
								"final_status": None,
								"source_hash": result.source_hash,
								"file_url": None,
							}
						)
						continue

					file_doc = save_snapshot_png(
						property_instruction=property_instruction,
						map_key=entry.map_key,
						row_name=entry.row_name,
						source_hash=result.source_hash,
						png_bytes=result.png_bytes,
					)
					if not mark_snapshot_success(
						property_instruction=property_instruction,
						entry=entry,
						file_url=file_doc.file_url,
						source_hash=result.source_hash,
						generated_at=now_datetime(),
					):
						entry_results.append(
							{
								"map_key": entry.map_key,
								"row_name": entry.row_name,
								"result": "superseded",
								"final_status": _get_target_state(property_instruction, entry.map_key, entry.row_name).get(
									"custom_map_snapshot_status"
								),
								"source_hash": result.source_hash,
								"file_url": file_doc.file_url,
							}
						)
						continue

					final_state = _get_target_state(property_instruction, entry.map_key, entry.row_name)
					owned_file = get_generated_snapshot_file(file_doc.file_url, property_instruction)
					if (
						final_state.get("custom_map_snapshot_status") != SNAPSHOT_STATUS_READY
						or final_state.get("custom_map_snapshot") != file_doc.file_url
						or final_state.get("custom_map_snapshot_source_hash") != result.source_hash
						or not owned_file
					):
						raise frappe.ValidationError("Snapshot final verification failed.")

					if old_snapshot_url and old_snapshot_url != file_doc.file_url:
						schedule_delete_generated_snapshot_file(old_snapshot_url, property_instruction)
					entry_results.append(
						{
							"map_key": entry.map_key,
							"row_name": entry.row_name,
							"result": "ready",
							"final_status": final_state.get("custom_map_snapshot_status"),
							"source_hash": result.source_hash,
							"file_url": file_doc.file_url,
							"cleanup_diagnostics": result.cleanup_diagnostics,
							"pixel_width": result.pixel_width,
							"pixel_height": result.pixel_height,
						}
					)
				except Exception as exc:
					doc_for_failure = frappe.get_doc("Property Instruction", property_instruction)
					target_for_failure = get_map_snapshot_target(doc_for_failure, entry.map_key, entry.row_name)
					if not target_for_failure or target_for_failure.expected_source_hash != entry.expected_source_hash:
						entry_results.append(
							{
								"map_key": entry.map_key,
								"row_name": entry.row_name,
								"result": "superseded",
								"final_status": None,
								"source_hash": entry.expected_source_hash,
								"file_url": None,
							}
						)
						continue
					error_log_name = log_map_snapshot_failure(
						property_instruction=property_instruction,
						map_key=entry.map_key,
						row_name=entry.row_name,
						source_hash=entry.expected_source_hash,
						map_kind=entry.map_kind,
						stage="capture",
						exception=exc,
						job_id=_current_job_id(),
					)
					mark_snapshot_failure(
						property_instruction=property_instruction,
						entry=entry,
						error_log_name=error_log_name,
					)
					entry_results.append(
						{
							"map_key": entry.map_key,
							"row_name": entry.row_name,
							"result": "failed",
							"final_status": _get_target_state(property_instruction, entry.map_key, entry.row_name).get(
								"custom_map_snapshot_status"
							),
							"source_hash": entry.expected_source_hash,
							"file_url": None,
							"error_log": error_log_name,
						}
					)
			job_status = "completed"
			if processed and any(entry["result"] not in {"ready", "superseded"} for entry in entry_results):
				job_status = "failed"
			return {
				"status": job_status,
				"property_instruction": property_instruction,
				"processed": processed,
				"entries": entry_results,
			}
	except LockTimeoutError:
		return {
			"status": "locked",
			"property_instruction": property_instruction,
			"processed": 0,
			"entries": [],
		}


def remove_snapshot_file(snapshot_url: str | None, property_instruction: str):
	return delete_generated_snapshot_file_if_owned(snapshot_url, property_instruction)
