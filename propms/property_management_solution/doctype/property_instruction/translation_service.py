from __future__ import annotations

import importlib

import frappe
from frappe import _


def translate_property_instruction(payload, target_language, source_language="en"):
	target_language = (target_language or "").strip().lower()
	if not target_language:
		frappe.throw(_("A target language is required."))

	jobs = []
	for fieldname in ("title", "address", "emergency_contact"):
		value = (payload.get(fieldname) or "").strip()
		if value:
			jobs.append(
				{
					"index": len(jobs),
					"path": ("field", fieldname),
					"text": value,
					"mime_type": "text/plain",
				}
			)

	translated_blocks = []
	for block in payload.get("blocks") or []:
		block_copy = {
			"source_block_name": block.get("source_block_name"),
			"section": block.get("section"),
			"title": block.get("title"),
			"body": block.get("body"),
			"caption": block.get("caption"),
			"link_label": block.get("link_label"),
			"sort_order": block.get("sort_order"),
		}
		for fieldname in ("section", "title", "caption", "link_label"):
			value = (block.get(fieldname) or "").strip()
			if value:
				jobs.append(
					{
						"index": len(jobs),
						"path": ("block", len(translated_blocks), fieldname),
						"text": value,
						"mime_type": "text/plain",
					}
				)
		if block.get("body"):
			jobs.append(
				{
					"index": len(jobs),
					"path": ("block", len(translated_blocks), "body"),
					"text": block.get("body"),
					"mime_type": "text/html",
				}
			)
		translated_blocks.append(block_copy)

	results = translate_jobs(jobs, target_language=target_language, source_language=source_language)
	output = {
		"title": payload.get("title"),
		"address": payload.get("address"),
		"emergency_contact": payload.get("emergency_contact"),
		"blocks": translated_blocks,
	}

	for job, translated_text in zip(jobs, results):
		scope = job["path"][0]
		if scope == "field":
			output[job["path"][1]] = translated_text
		else:
			_, block_index, fieldname = job["path"]
			output["blocks"][block_index][fieldname] = translated_text

	return output


def translate_jobs(jobs, target_language, source_language="en"):
	if not jobs:
		return []

	translator = get_google_translation_client()
	return translator.translate_jobs(
		jobs=jobs,
		target_language=target_language,
		source_language=source_language,
	)


def get_google_translation_client():
	if importlib.util.find_spec("google") is None:
		raise_translation_unavailable()

	translate_v3 = import_optional_module("google.cloud.translate")
	if translate_v3 and hasattr(translate_v3, "TranslationServiceClient"):
		return GoogleTranslationV3Client(translate_v3)

	translate_v2 = import_optional_module("google.cloud.translate_v2")
	if translate_v2 and hasattr(translate_v2, "Client"):
		return GoogleTranslationV2Client(translate_v2)

	raise_translation_unavailable()


def import_optional_module(module_name):
	try:
		return importlib.import_module(module_name)
	except ModuleNotFoundError:
		return None


def raise_translation_unavailable():
	frappe.throw(
		_(
			"Google Cloud Translation is not available in this environment. "
			"Install the Google client library and provide Application Default Credentials."
		)
	)


class GoogleTranslationV3Client:
	def __init__(self, translate_module):
		project_id = frappe.conf.get("google_cloud_translation_project_id")
		location = frappe.conf.get("google_cloud_translation_location") or "global"
		if not project_id:
			frappe.throw(_("Set google_cloud_translation_project_id in site config before generating translations."))

		self.client = translate_module.TranslationServiceClient()
		self.parent = f"projects/{project_id}/locations/{location}"

	def translate_jobs(self, jobs, target_language, source_language="en"):
		results = [None] * len(jobs)
		for mime_type in ("text/plain", "text/html"):
			subset = [job for job in jobs if job["mime_type"] == mime_type]
			if not subset:
				continue
			response = self.client.translate_text(
				request={
					"parent": self.parent,
					"contents": [job["text"] for job in subset],
					"mime_type": mime_type,
					"source_language_code": source_language,
					"target_language_code": target_language,
				}
			)
			for job, translation in zip(subset, response.translations):
				results[job["index"]] = translation.translated_text

		return results


class GoogleTranslationV2Client:
	def __init__(self, translate_module):
		project_id = frappe.conf.get("google_cloud_translation_project_id") or None
		self.client = translate_module.Client(project=project_id)

	def translate_jobs(self, jobs, target_language, source_language="en"):
		results = [None] * len(jobs)
		for mime_type, format_name in (("text/plain", "text"), ("text/html", "html")):
			subset = [job for job in jobs if job["mime_type"] == mime_type]
			if not subset:
				continue
			response = self.client.translate(
				[job["text"] for job in subset],
				target_language=target_language,
				source_language=source_language,
				format_=format_name,
			)
			if isinstance(response, dict):
				response = [response]
			for job, translated in zip(subset, response):
				results[job["index"]] = translated.get("translatedText")

		return results
