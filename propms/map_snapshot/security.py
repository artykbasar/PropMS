from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
from dataclasses import dataclass

import frappe
from frappe import _


CAPTURE_TOKEN_COOKIE_NAME = "propms_map_capture_token"
CAPTURE_TOKEN_PURPOSE = "property-instruction-map-capture"
CAPTURE_TOKEN_VERSION = 1
CAPTURE_TOKEN_LIFETIME_SECONDS = 300
CAPTURE_TOKEN_COOKIE_PATH = "/internal_map_capture"


class MapCaptureSecurityError(frappe.PermissionError):
	pass


@dataclass(frozen=True)
class CaptureClaim:
	purpose: str
	version: int
	property_instruction: str
	map_key: str
	row_name: str | None
	expected_source_hash: str
	issued_at: int
	expires_at: int
	nonce: str


def _urlsafe_b64encode(raw: bytes) -> str:
	return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _urlsafe_b64decode(text: str) -> bytes:
	padding = "=" * (-len(text) % 4)
	return base64.urlsafe_b64decode((text + padding).encode("ascii"))


def _get_site_secret() -> bytes:
	encryption_key = (getattr(frappe.local, "conf", None) and frappe.local.conf.get("encryption_key")) or frappe.conf.get("encryption_key")
	if not encryption_key:
		raise MapCaptureSecurityError(_("Map capture is not configured."))
	return hashlib.sha256(f"propms-map-capture:{encryption_key}".encode("utf-8")).digest()


def _serialize_claim_payload(payload: dict[str, object]) -> bytes:
	return json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")


def _sign_payload(payload_bytes: bytes) -> str:
	return _urlsafe_b64encode(hmac.new(_get_site_secret(), payload_bytes, hashlib.sha256).digest())


def build_capture_claim(
	property_instruction: str,
	map_key: str,
	expected_source_hash: str,
	row_name: str | None = None,
	lifetime_seconds: int = CAPTURE_TOKEN_LIFETIME_SECONDS,
) -> str:
	now = int(time.time())
	payload = {
		"purpose": CAPTURE_TOKEN_PURPOSE,
		"version": CAPTURE_TOKEN_VERSION,
		"property_instruction": property_instruction,
		"map_key": map_key,
		"row_name": row_name or "",
		"expected_source_hash": expected_source_hash,
		"issued_at": now,
		"expires_at": now + int(lifetime_seconds),
		"nonce": frappe.generate_hash(length=16),
	}
	payload_bytes = _serialize_claim_payload(payload)
	signature = _sign_payload(payload_bytes)
	return f"{_urlsafe_b64encode(payload_bytes)}.{signature}"


def parse_and_verify_capture_claim(token: str | None) -> CaptureClaim:
	text = (token or "").strip()
	if not text or "." not in text:
		raise MapCaptureSecurityError(_("Invalid map capture token."))
	payload_part, signature_part = text.split(".", 1)
	payload_bytes = _urlsafe_b64decode(payload_part)
	expected_signature = _sign_payload(payload_bytes)
	if not hmac.compare_digest(signature_part, expected_signature):
		raise MapCaptureSecurityError(_("Invalid map capture token."))
	payload = json.loads(payload_bytes.decode("utf-8"))
	required_fields = {
		"purpose",
		"version",
		"property_instruction",
		"map_key",
		"row_name",
		"expected_source_hash",
		"issued_at",
		"expires_at",
		"nonce",
	}
	if not required_fields.issubset(payload.keys()):
		raise MapCaptureSecurityError(_("Invalid map capture token."))
	if payload["purpose"] != CAPTURE_TOKEN_PURPOSE or int(payload["version"]) != CAPTURE_TOKEN_VERSION:
		raise MapCaptureSecurityError(_("Invalid map capture token."))
	now = int(time.time())
	if int(payload["expires_at"]) < now or int(payload["issued_at"]) > now + 5:
		raise MapCaptureSecurityError(_("Map capture token has expired."))
	return CaptureClaim(
		purpose=str(payload["purpose"]),
		version=int(payload["version"]),
		property_instruction=str(payload["property_instruction"]),
		map_key=str(payload["map_key"]),
		row_name=(str(payload["row_name"]).strip() or None),
		expected_source_hash=str(payload["expected_source_hash"]),
		issued_at=int(payload["issued_at"]),
		expires_at=int(payload["expires_at"]),
		nonce=str(payload["nonce"]),
	)
