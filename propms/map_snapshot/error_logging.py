from __future__ import annotations

import hashlib
import json
import re
import traceback
from datetime import datetime, timedelta

import frappe


ERROR_DEDUP_WINDOW_MINUTES = 30
DATA_URL_REPLACEMENT = "<redacted-data-url>"
URL_REPLACEMENT = "<redacted-url>"


def _clean_text(value) -> str:
	return (value or "").strip()


def _sanitize_sensitive_text(value) -> str:
	text = str(value or "")
	if not text:
		return ""
	text = re.sub(r"data:text/html[^)\]>\s'\"\\]+", DATA_URL_REPLACEMENT, text, flags=re.IGNORECASE)
	text = re.sub(r"https?://[^\s'\"<>]+", URL_REPLACEMENT, text, flags=re.IGNORECASE)
	return text


def sanitize_capture_failure_exception(exception: Exception) -> dict[str, str]:
	trace = "".join(
		traceback.format_exception(type(exception), exception, exception.__traceback__)
	)
	return {
		"exception_type": type(exception).__name__,
		"exception_message": _sanitize_sensitive_text(exception),
		"traceback": _sanitize_sensitive_text(trace),
	}


def build_failure_fingerprint(
	*,
	property_instruction: str,
	map_key: str,
	row_name: str | None,
	source_hash: str | None,
	stage: str,
	failure_class: str,
) -> str:
	payload = {
		"property_instruction": _clean_text(property_instruction),
		"map_key": _clean_text(map_key),
		"row_name": _clean_text(row_name),
		"source_hash": _clean_text(source_hash),
		"stage": _clean_text(stage),
		"failure_class": _clean_text(failure_class),
	}
	return hashlib.sha256(
		json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
	).hexdigest()[:12]


def find_recent_error_log(
	*,
	property_instruction: str,
	fingerprint: str,
	window_minutes: int = ERROR_DEDUP_WINDOW_MINUTES,
) -> str | None:
	cutoff = datetime.utcnow() - timedelta(minutes=window_minutes)
	logs = frappe.get_all(
		"Error Log",
		filters={
			"reference_doctype": "Property Instruction",
			"reference_name": property_instruction,
			"method": ["like", f"%[{fingerprint}]%"],
			"creation": [">=", cutoff.strftime("%Y-%m-%d %H:%M:%S")],
		},
		fields=["name"],
		limit=1,
		order_by="creation desc",
	)
	return logs[0].name if logs else None


def log_map_snapshot_failure(
	*,
	property_instruction: str,
	map_key: str,
	row_name: str | None,
	source_hash: str | None,
	map_kind: str | None,
	stage: str,
	exception: Exception,
	job_id: str | None = None,
	chromium_version: str | None = None,
	capture_duration_seconds: float | None = None,
	attempt_number: int | None = None,
	cleanup_diagnostics: dict[str, object] | None = None,
) -> str:
	failure_class = type(exception).__name__
	fingerprint = build_failure_fingerprint(
		property_instruction=property_instruction,
		map_key=map_key,
		row_name=row_name,
		source_hash=source_hash,
		stage=stage,
		failure_class=failure_class,
	)
	if existing := find_recent_error_log(property_instruction=property_instruction, fingerprint=fingerprint):
		return existing

	title = f"Property Instruction map snapshot failed [{fingerprint}]"
	context = {
		"property_instruction": _clean_text(property_instruction),
		"map_key": _clean_text(map_key),
		"row_name": _clean_text(row_name),
		"source_hash": _clean_text(source_hash),
		"map_kind": _clean_text(map_kind),
		"capture_stage": _clean_text(stage),
		"job_id": _clean_text(job_id),
		"chromium_version": _clean_text(chromium_version),
		"capture_duration_seconds": capture_duration_seconds,
		"attempt_number": attempt_number,
		"cleanup_diagnostics": cleanup_diagnostics or {},
		"exception": sanitize_capture_failure_exception(exception),
	}
	message = f"Map snapshot failure.\n\nMap snapshot context:\n{frappe.as_json(context, indent=2)}"
	error_log = frappe.log_error(
		title=title,
		message=message,
		reference_doctype="Property Instruction",
		reference_name=property_instruction,
	)
	return error_log.name if error_log else ""
