from __future__ import annotations

import hashlib
import re
import time
from datetime import timedelta
from html import escape
from urllib.parse import urlsplit

import frappe
from frappe import _
from frappe.rate_limiter import rate_limit
from frappe.utils import cint, now_datetime, validate_email_address

ENQUIRY_DOCTYPE = "PropMS Website Enquiry"
MAX_NAME = 140
MAX_EMAIL = 254
MAX_PHONE = 40
MAX_SUBJECT = 140
MAX_MESSAGE = 5000
MAX_ATTRIBUTION = 140
MIN_FILL_SECONDS = 1.5
MAX_FILL_SECONDS = 24 * 60 * 60
DUPLICATE_WINDOW_MINUTES = 10
PHONE_PATTERN = re.compile(r"^[0-9+().\-\s]{5,40}$")
UTM_FIELDS = ("utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content")


def _text(value, fieldname: str, max_length: int, *, required: bool = False) -> str:
    if value is None:
        value = ""
    if not isinstance(value, str):
        frappe.throw(_("{0} must be text.").format(fieldname), frappe.ValidationError)
    value = value.strip()
    if required and not value:
        frappe.throw(_("{0} is required.").format(fieldname), frappe.ValidationError)
    if len(value) > max_length:
        frappe.throw(_("{0} is too long.").format(fieldname), frappe.ValidationError)
    return value


def _single_line(value, fieldname: str, max_length: int, *, required: bool = False) -> str:
    value = _text(value, fieldname, max_length, required=required)
    if "\n" in value or "\r" in value:
        frappe.throw(_("{0} must be a single line.").format(fieldname), frappe.ValidationError)
    return value


def _checkbox(value, fieldname: str) -> int:
    if value in (None, "", 0, "0", False, "false", "False"):
        return 0
    if value in (1, "1", True, "true", "True"):
        return 1
    frappe.throw(_("{0} must be a boolean value.").format(fieldname), frappe.ValidationError)


def _source_page(value) -> str:
    value = _text(value, "Source page", 500, required=True)
    parsed = urlsplit(value)
    if parsed.scheme or parsed.netloc or not value.startswith("/"):
        frappe.throw(_("Source page must be a local website path."), frappe.ValidationError)
    return parsed.path or "/"


def _validate_payload(data: dict) -> dict:
    email = _single_line(data.get("email"), "Email", MAX_EMAIL, required=True).lower()
    if not validate_email_address(email):
        frappe.throw(_("Please enter a valid email address."), frappe.ValidationError)
    telephone = _single_line(data.get("telephone"), "Telephone", MAX_PHONE)
    if telephone and not PHONE_PATTERN.fullmatch(telephone):
        frappe.throw(_("Please enter a valid telephone number."), frappe.ValidationError)

    result = {
        "sender_name": _single_line(data.get("name"), "Name", MAX_NAME, required=True),
        "email": email,
        "telephone": telephone,
        "enquiry_type": _single_line(data.get("enquiry_type") or data.get("subject"), "Enquiry type", MAX_SUBJECT),
        "subject": _single_line(data.get("subject"), "Subject", MAX_SUBJECT, required=True),
        "message": _text(data.get("message"), "Message", MAX_MESSAGE, required=True),
        "source_page": _source_page(data.get("source_page") or "/"),
        "marketing_consent": _checkbox(data.get("marketing_consent"), "Marketing consent"),
    }
    for fieldname in UTM_FIELDS:
        result[fieldname] = _single_line(data.get(fieldname), fieldname, MAX_ATTRIBUTION)
    return result


def _is_honeypot_filled(data: dict) -> bool:
    return bool(_text(data.get("website"), "Website", 200))


def _validate_timing(data: dict) -> None:
    raw = data.get("form_started_at")
    try:
        started_ms = float(raw)
    except (TypeError, ValueError):
        frappe.throw(_("Please reload the page and try again."), frappe.ValidationError)
    elapsed = time.time() - (started_ms / 1000)
    if elapsed < MIN_FILL_SECONDS or elapsed > MAX_FILL_SECONDS:
        frappe.throw(_("Please reload the page and try again."), frappe.ValidationError)


def _fingerprint(values: dict) -> str:
    material = "\x1f".join(
        [values["email"], values["subject"].lower(), values["message"], values["source_page"]]
    )
    return hashlib.sha256(material.encode("utf-8")).hexdigest()


def _find_recent_duplicate(fingerprint: str) -> str | None:
    threshold = now_datetime() - timedelta(minutes=DUPLICATE_WINDOW_MINUTES)
    return frappe.db.exists(
        ENQUIRY_DOCTYPE,
        {"submission_fingerprint": fingerprint, "creation": [">=", threshold]},
    )


def _settings():
    return frappe.get_cached_doc("PropMS Website Settings")


def _notification_recipient(settings) -> str:
    configured = (settings.get("enquiry_notification_email") or "").strip()
    if configured and validate_email_address(configured):
        return configured
    return ""


def _notify(enquiry, settings) -> None:
    recipient = _notification_recipient(settings)
    if not recipient:
        enquiry.db_set("notification_status", "Skipped", update_modified=False)
        return
    try:
        frappe.sendmail(
            recipients=[recipient],
            subject=f"Website enquiry: {enquiry.subject}",
            message=(
                f"<p><strong>Name:</strong> {escape(enquiry.sender_name)}</p>"
                f"<p><strong>Email:</strong> {escape(enquiry.email)}</p>"
                f"<p><strong>Telephone:</strong> {escape(enquiry.telephone or '')}</p>"
                f"<p><strong>Source:</strong> {escape(enquiry.source_page)}</p>"
                f"<p>{escape(enquiry.message).replace(chr(10), '<br>')}</p>"
            ),
            reference_doctype=ENQUIRY_DOCTYPE,
            reference_name=enquiry.name,
        )
        enquiry.db_set("notification_status", "Sent", update_modified=False)
    except Exception:
        enquiry.db_set("notification_status", "Failed", update_modified=False)
        frappe.log_error(title="Website enquiry notification failed", message=f"Enquiry {enquiry.name}")


def _create_crm_lead(enquiry, settings) -> None:
    if not cint(settings.get("enquiry_crm_enabled")):
        enquiry.db_set("crm_status", "Disabled", update_modified=False)
        return
    if not frappe.db.exists("DocType", "Lead"):
        enquiry.db_set("crm_status", "Skipped", update_modified=False)
        return
    enquiry.db_set("crm_status", "Pending", update_modified=False)
    try:
        lead = frappe.get_doc(
            {
                "doctype": "Lead",
                "lead_name": enquiry.sender_name,
                "email_id": enquiry.email,
                "mobile_no": enquiry.telephone,
                "notes": f"Website enquiry {enquiry.name}: {enquiry.message}",
            }
        ).insert(ignore_permissions=True)
        enquiry.db_set("crm_lead", lead.name, update_modified=False)
        enquiry.db_set("crm_status", "Linked", update_modified=False)
    except Exception:
        enquiry.db_set("crm_status", "Failed", update_modified=False)
        frappe.log_error(title="Website enquiry CRM integration failed", message=f"Enquiry {enquiry.name}")


def _mark_processing_result(enquiry) -> None:
    statuses = {enquiry.notification_status, enquiry.crm_status}
    final = "Needs Attention" if "Failed" in statuses else "Completed"
    enquiry.db_set("processing_status", final, update_modified=False)


@frappe.whitelist(allow_guest=True, methods=["POST"])
@rate_limit(limit=10, seconds=60 * 60, methods=["POST"])
def submit_enquiry(**kwargs):
    data = dict(frappe.form_dict)
    data.update(kwargs)
    if _is_honeypot_filled(data):
        frappe.logger("propms.website_enquiry").warning("Blocked website enquiry: honeypot")
        return {"accepted": True}
    _validate_timing(data)
    values = _validate_payload(data)
    fingerprint = _fingerprint(values)
    if _find_recent_duplicate(fingerprint):
        frappe.logger("propms.website_enquiry").info("Suppressed duplicate website enquiry")
        return {"accepted": True}

    values.update(
        {
            "doctype": ENQUIRY_DOCTYPE,
            "submission_fingerprint": fingerprint,
            "validation_state": "Validated",
            "processing_status": "Received",
            "notification_status": "Pending",
            "crm_status": "Pending" if cint(_settings().get("enquiry_crm_enabled")) else "Disabled",
            "consent_timestamp": now_datetime() if values["marketing_consent"] else None,
        }
    )
    enquiry = frappe.get_doc(values).insert(ignore_permissions=True)
    settings = _settings()
    _notify(enquiry, settings)
    _create_crm_lead(enquiry, settings)
    enquiry.reload()
    _mark_processing_result(enquiry)
    return {"accepted": True}
