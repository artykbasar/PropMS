from __future__ import annotations

import io
import json
import sys
import uuid
import unittest
from unittest.mock import patch

import frappe
from frappe.tests.utils import FrappeTestCase
from pypdf import PdfReader, PdfWriter
from frappe.website.page_renderers.document_page import _find_matching_document_webview
from frappe.website.router import clear_routing_cache, get_base_template
from frappe.utils.pdf import get_pdf
from werkzeug.datastructures import Headers

from propms.property_management_solution.doctype.property_instruction.property_instruction import (
	NOINDEX_ROBOTS_CONTENT,
	PDF_WIDGET_TRANSLATION_NOTE,
	apply_guest_guide_noindex_headers,
	download_pdf,
	generate_translation,
)
from propms.property_management_solution.doctype.property_instruction import translation_service
from propms.www.sitemap import get_filtered_public_pages_from_doctypes


class PropertyInstructionTestMixin:
	def setUp(self):
		super().setUp()
		frappe.set_user("Administrator")
		self.to_delete = []
		self.conf_backup = {}
		self.single_backup = {}
		self.original_form_dict = frappe._dict(getattr(frappe.local, "form_dict", {}) or {})
		self.original_request = getattr(frappe.local, "request", None)
		self.original_request_args = getattr(self.original_request, "args", None) if self.original_request else None
		self.clear_route_cache()

	def tearDown(self):
		for doctype, name in reversed(self.to_delete):
			if frappe.db.exists(doctype, name):
				frappe.delete_doc(doctype, name, force=1)
		for key, value in self.conf_backup.items():
			if value is None:
				frappe.conf.pop(key, None)
			else:
				frappe.conf[key] = value
		for key, value in self.single_backup.items():
			frappe.db.set_single_value("Property Management Settings", key, value)
		frappe.local.form_dict = self.original_form_dict
		if self.original_request is not None:
			self.original_request.args = self.original_request_args
			frappe.local.request = self.original_request
		else:
			frappe.local.request = None
		self.clear_route_cache()
		super().tearDown()

	def clear_route_cache(self):
		_find_matching_document_webview.clear_cache()
		clear_routing_cache()

	def set_conf(self, key, value):
		if key not in self.conf_backup:
			self.conf_backup[key] = frappe.conf.get(key)
		if value is None:
			frappe.conf.pop(key, None)
		else:
			frappe.conf[key] = value

	def set_property_management_setting(self, key, value):
		if key not in self.single_backup:
			self.single_backup[key] = frappe.db.get_single_value("Property Management Settings", key)
		frappe.db.set_single_value("Property Management Settings", key, value)

	def make_property(self):
		doc = frappe.get_doc(
			{
				"doctype": "Property",
				"name1": f"Test Property {uuid.uuid4().hex[:8]}",
			}
		).insert(ignore_permissions=True)
		self.to_delete.append(("Property", doc.name))
		return doc

	def make_instruction(self, property_name=None, **overrides):
		property_name = property_name or self.make_property().name
		doc = frappe.get_doc(
			{
				"doctype": "Property Instruction",
				"title": overrides.pop("title", "Test Guest Guide Property"),
				"property": property_name,
				"published": overrides.pop("published", 1),
				"address": overrides.pop("address", "99A Burlington Road"),
				"google_maps_url": overrides.pop(
					"google_maps_url",
					"https://www.google.com/maps/place/99A+Burlington+Road",
				),
				"show_embedded_map": overrides.pop("show_embedded_map", 1),
				"google_maps_place_id": overrides.pop("google_maps_place_id", None),
				"map_search_query": overrides.pop("map_search_query", None),
				"map_zoom": overrides.pop("map_zoom", 16),
				"map_type": overrides.pop("map_type", "roadmap"),
				"wifi_name": overrides.pop("wifi_name", "TestWifi"),
				"wifi_password": overrides.pop("wifi_password", "guest-wifi-only"),
				"check_in_time": overrides.pop("check_in_time", "15:00:00"),
				"check_out_time": overrides.pop("check_out_time", "11:00:00"),
				"emergency_contact": overrides.pop("emergency_contact", "Emergency Contact"),
				"instruction_blocks": overrides.pop(
					"instruction_blocks",
					[
						{
							"section": "Finding the Property",
							"block_type": "Link",
							"title": "Map",
							"link_url": "https://example.com/map",
							"link_label": "Open map",
						},
						{
							"section": "Check-In",
							"block_type": "Step",
							"step_number": 1,
							"title": "Find entrance",
							"body": "<p>Use the side gate.</p>",
						},
						{
							"section": "Check-In",
							"block_type": "Step",
							"title": "Arrive inside",
							"body": "<p>Collect keys from the host.</p>",
						},
						{
							"section": "Parking",
							"block_type": "Text",
							"title": "Parking bay",
							"body": "<p>Use bay 7.</p>",
						},
						{
							"section": "Rubbish",
							"block_type": "Text",
							"title": "Bins",
							"body": "<p>Green bins are behind the gate.</p>",
						},
						{
							"section": "House Rules",
							"block_type": "Warning",
							"title": "Quiet hours",
							"body": "<p>No loud music after 10pm.</p>",
						},
					],
				),
				**overrides,
			}
		).insert(ignore_permissions=True)
		self.to_delete.append(("Property Instruction", doc.name))
		self.clear_route_cache()
		return doc

	def make_translation(self, instruction, language_code="es", status="Ready", **overrides):
		instruction.reload()
		source_blocks = instruction.get_translation_source_payload()["blocks"]
		blocks = overrides.pop(
			"blocks",
			[
				{
					"source_block_name": row["source_block_name"],
					"section": f"{row['section']} ES",
					"title": f"{(row.get('title') or row['section'])} ES",
					"body": row.get("body"),
					"caption": f"{row.get('caption') or ''} ES".strip() or None,
					"link_label": f"{row.get('link_label') or ''} ES".strip() or None,
					"sort_order": row.get("sort_order"),
				}
				for row in source_blocks
			],
		)
		doc = frappe.get_doc(
			{
				"doctype": "Property Instruction Translation",
				"property_instruction": instruction.name,
				"language_code": language_code,
				"language_name": overrides.pop("language_name", "Spanish"),
				"status": status,
				"source_modified": instruction.modified,
				"title": overrides.pop("title", f"{instruction.title} ES"),
				"address": overrides.pop("address", f"{instruction.address} ES"),
				"emergency_contact": overrides.pop("emergency_contact", "Contacto de emergencia"),
				"blocks": blocks,
				**overrides,
			}
		).insert(ignore_permissions=True)
		self.to_delete.append(("Property Instruction Translation", doc.name))
		return doc

	def get_context(self, doc, lang=None):
		doc.reload()
		frappe.local.form_dict = frappe._dict({"lang": lang} if lang else {})
		if getattr(frappe.local, "request", None):
			frappe.local.request.args = frappe._dict({"lang": lang} if lang else {})
		else:
			frappe.local.request = frappe._dict(args=frappe._dict({"lang": lang} if lang else {}))
		context = frappe._dict(doc=doc)
		context.update(doc.as_dict())
		context.update(doc.get_page_info())
		context.base_template_path = get_base_template(doc.route) or "templates/base.html"
		context.boot = frappe._dict(lang="en", sysdefaults={})
		context.build_version = ""
		context.dev_server = "false"
		context.path = f"/{doc.route}"
		context.pathname = f"/{doc.route}"
		context.web_include_js = []
		context.web_include_icons = []
		context.show_language_picker = "false"
		context._context_dict = context
		frappe.local.response_headers = Headers()
		out = doc.get_context(context)
		if out:
			context.update(out)
		return context

	def render_instruction(self, doc, lang=None):
		context = self.get_context(doc, lang=lang)
		return frappe.get_template("templates/generators/property_instruction.html").render(context)

	def render_pdf(self, doc, lang=None):
		return doc.render_pdf_html(language_code=lang)

	def generate_pdf_bytes(self, doc, lang=None, translated_snapshot=None):
		pdf_html = doc.render_pdf_html(language_code=lang, translated_snapshot=translated_snapshot)
		pdf_bytes = get_pdf(pdf_html, options=doc.get_pdf_options())
		pdf_bytes, _removed = doc.cleanup_trailing_footer_only_page(pdf_bytes)
		return pdf_bytes

	def extract_pdf_text(self, pdf_bytes):
		reader = PdfReader(io.BytesIO(pdf_bytes))
		return "\n".join((page.extract_text() or "") for page in reader.pages)

	def extract_pdf_pages(self, pdf_bytes):
		reader = PdfReader(io.BytesIO(pdf_bytes))
		return [(page.extract_text() or "") for page in reader.pages]

	def make_widget_snapshot(self, doc, language="fr", expanded=False):
		section_map = {
			"fr": {
				"Finding the Property": "Trouver le bien immobilier",
				"Check-In": "Enregistrement",
				"Parking": "Parking",
				"WiFi": "Wi-Fi",
				"Rubbish": "Déchets",
				"Check-Out": "Vérifier",
			},
			"de": {
				"Finding the Property": "Die Unterkunft finden",
				"Check-In": "Anreise",
				"Parking": "Parken",
				"WiFi": "WLAN",
				"Rubbish": "Abfall",
				"Check-Out": "Abreise",
			},
		}
		block_map = {
			"fr": {
				"Map": {"title": "Carte", "link_label": "Ouvrir la carte"},
				"Entrance reference": {"title": "Référence d'entrée", "caption": "Image de remplacement pour l'entrée."},
				"Arrive at the main entrance": {
					"title": "Arrivez à l'entrée principale",
					"body": "<p>Empruntez le chemin principal et attendez dans la zone d'entrée couverte.</p>",
				},
				"Follow separately supplied arrival instructions": {
					"title": "Suivez les instructions d'arrivée fournies séparément.",
					"body": "<p>Veuillez utiliser le message d'arrivée qui vous a été envoyé séparément. Aucun code d'accès n'est indiqué dans ce guide public.</p>",
				},
				"Confirm the door is locked after entry": {
					"title": "Vérifiez que la porte est verrouillée après l'entrée.",
					"body": "<p>Une fois à l'intérieur, vérifiez que la porte est bien fermée et verrouillée.</p>",
				},
				"Guest parking": {
					"title": "Parking visiteurs",
					"body": "<p>Les visiteurs peuvent utiliser les places de stationnement réservées aux visiteurs sur Burlington Road lorsqu'elles sont disponibles.</p>",
				},
				"Parking restrictions": {
					"title": "Restrictions de stationnement",
					"body": "<p>Veuillez respecter les restrictions de stationnement locales et éviter de bloquer les allées des voisins.</p>",
				},
				"Waste and recycling": {
					"title": "Déchets et recyclage",
					"body": "<p>Veuillez déposer les ordures ménagères dans le bac noir et les déchets recyclables dans le bac vert situé près du portail latéral. Les détails concernant les jours de collecte ne sont pas indiqués ici, sauf confirmation ultérieure.</p>",
				},
				"Turn off lights and appliances": {
					"title": "Éteignez les lumières et les appareils électroménagers",
					"body": "<p>Veuillez éteindre les lumières, le chauffage d'appoint et les petits appareils électroménagers avant de partir.</p>",
				},
				"Close windows": {
					"title": "Fermer les fenêtres",
					"body": "<p>Assurez-vous que toutes les fenêtres accessibles sont complètement fermées.</p>",
				},
				"Lock the property": {
					"title": "Verrouillez la propriété",
					"body": "<p>Vérifiez que l'entrée principale est bien sécurisée avant de quitter les lieux.</p>",
				},
				"Follow separate key-return instructions": {
					"title": "Suivez les instructions séparées pour le retour des clés",
					"body": "<p>Veuillez utiliser les instructions de restitution des clés fournies séparément après votre départ.</p>",
				},
			},
			"de": {
				"Map": {"title": "Karte", "link_label": "Karte öffnen"},
				"Entrance reference": {"title": "Eingangsreferenz", "caption": "Entwicklungsplatzhalterbild für den Eingangsbereich."},
				"Arrive at the main entrance": {
					"title": "Kommen Sie am Haupteingang an",
					"body": "<p>Benutzen Sie den vorderen Weg und warten Sie im überdachten Eingangsbereich, bis Ihre separat gesendeten Anreisehinweise vollständig befolgt werden können.</p>",
				},
				"Follow separately supplied arrival instructions": {
					"title": "Folgen Sie den separat bereitgestellten Anreisehinweisen",
					"body": "<p>Bitte verwenden Sie die separat zugesandte Anreisenachricht. In diesem öffentlichen Leitfaden werden keine Zugangscodes angezeigt, und zusätzliche sicherheitsrelevante Informationen werden bewusst nicht aufgenommen.</p>",
				},
				"Confirm the door is locked after entry": {
					"title": "Bestätigen Sie nach dem Betreten, dass die Tür verriegelt ist",
					"body": "<p>Überprüfen Sie nach dem Betreten sorgfältig, dass die Tür vollständig geschlossen, korrekt eingerastet und weiterhin sicher verriegelt ist.</p>",
				},
				"Guest parking": {
					"title": "Gästeparkplätze",
					"body": "<p>Gäste können die markierten Besucherparkplätze an der Burlington Road nutzen, sofern sie verfügbar sind und keine lokalen Einschränkungen vorliegen.</p>",
				},
				"Parking restrictions": {
					"title": "Parkbeschränkungen",
					"body": "<p>Bitte beachten Sie die örtlichen Parkbeschränkungen und vermeiden Sie es, benachbarte Einfahrten, Tore oder Rettungswege auch nur kurzzeitig zu blockieren.</p>",
				},
				"Waste and recycling": {
					"title": "Müll und Recycling",
					"body": "<p>Bitte legen Sie den Restmüll in die schwarze Tonne und gemischtes Recycling in die grüne Tonne am Seitentor. Angaben zu den Abholtagen werden hier nur angezeigt, wenn sie gesondert bestätigt wurden.</p>",
				},
				"Turn off lights and appliances": {
					"title": "Schalten Sie Lichter und Geräte aus",
					"body": "<p>Bitte schalten Sie vor Ihrer Abreise alle Lichter, zusätzliche Heizfunktionen und kleinen Elektrogeräte vollständig aus.</p>",
				},
				"Close windows": {
					"title": "Schließen Sie die Fenster",
					"body": "<p>Stellen Sie sicher, dass alle zugänglichen Fenster vollständig geschlossen und ordnungsgemäß gesichert sind.</p>",
				},
				"Lock the property": {
					"title": "Verriegeln Sie die Unterkunft",
					"body": "<p>Vergewissern Sie sich vor dem Verlassen der Unterkunft, dass der Haupteingang vollständig gesichert und korrekt verriegelt ist.</p>",
				},
				"Follow separate key-return instructions": {
					"title": "Befolgen Sie die separat mitgeteilten Hinweise zur Schlüsselrückgabe",
					"body": "<p>Verwenden Sie nach Ihrer Abreise die separat übermittelten Hinweise zur Schlüsselrückgabe und beachten Sie dabei alle bestätigten Zeitfenster.</p>",
				},
			},
		}
		fields = {
			"title": "Guide des visiteurs du 99A Burlington Road" if language == "fr" else "Gästeleitfaden für 99A Burlington Road",
			"emergency_contact": "En cas de danger immédiat, contactez les services d'urgence."
			if language == "fr"
			else "Wenden Sie sich bei unmittelbarer Gefahr an den Rettungsdienst.",
		}
		snapshot = {
			"display_language": "en",
			"reviewed_language": "en",
			"widget_language": language,
			"fields": fields,
			"sections": {},
			"blocks": {},
		}
		for section in doc.get_public_render_context().sections:
			snapshot["sections"][section.anchor] = section_map[language].get(section.section, section.section)
			for block in section.blocks:
				override = block_map[language].get(block.title)
				if override:
					snapshot["blocks"][block.name] = dict(override)
				elif expanded and block.safe_body:
					snapshot["blocks"][block.name] = {
						"title": block.title,
						"body": "<p>" + ("Zusätzlicher übersetzter Fließtext. " * 18) + "</p>",
					}
		return snapshot

	def set_request_payload(self, payload, method="POST", args=None):
		body = json.dumps(payload)
		request = frappe._dict(method=method, args=frappe._dict(args or {}))
		request.get_data = lambda as_text=False: body if as_text else body.encode()
		frappe.local.request = request
		frappe.local.request_ip = "127.0.0.1"
		frappe.local.form_dict = frappe._dict(args or {})
		return request


class TestPropertyInstruction(PropertyInstructionTestMixin, FrappeTestCase):
	def test_slug_generation_from_title(self):
		doc = self.make_instruction(slug=None, title="Test Guest Guide Property")
		self.assertEqual(doc.slug, "test-guest-guide-property")
		self.assertEqual(doc.route, "instructions/test-guest-guide-property")

	def test_slug_normalization(self):
		doc = self.make_instruction(slug="  Test_Guest GUIDE  ")
		self.assertEqual(doc.slug, "test-guest-guide")

	def test_route_generation(self):
		doc = self.make_instruction(slug="my-custom-slug")
		self.assertEqual(doc.route, "instructions/my-custom-slug")

	def test_duplicate_slug_rejection(self):
		self.make_instruction(slug="same-slug")
		with self.assertRaises(frappe.ValidationError):
			self.make_instruction(property_name=self.make_property().name, slug="same-slug")

	def test_explicit_valid_slug_preservation(self):
		doc = self.make_instruction(slug="keep-this-slug")
		self.assertEqual(doc.slug, "keep-this-slug")

	def test_published_document_public_route_exists(self):
		doc = self.make_instruction(published=1)
		self.assertEqual(_find_matching_document_webview(doc.route), ("Property Instruction", doc.name))

	def test_unpublished_document_not_publicly_available(self):
		doc = self.make_instruction(published=0)
		self.assertIsNone(_find_matching_document_webview(doc.route))

	def test_grouping_and_ordering_of_blocks(self):
		doc = self.make_instruction(
			instruction_blocks=[
				{"section": "Check-In", "block_type": "Step", "title": "Second", "sort_order": 20},
				{"section": "Parking", "block_type": "Text", "title": "Parking", "sort_order": 5},
				{"section": "Check-In", "block_type": "Step", "title": "First", "sort_order": 10},
			]
		)
		sections = doc.get_grouped_blocks()
		self.assertEqual(sections[0].section, "Check-In")
		self.assertEqual([b.title for b in sections[0].blocks], ["First", "Second"])

	def test_javascript_url_rejection(self):
		with self.assertRaises(frappe.ValidationError):
			self.make_instruction(
				instruction_blocks=[
					{
						"section": "Finding the Property",
						"block_type": "Link",
						"title": "Unsafe",
						"link_url": "javascript:alert(1)",
					}
				]
			)

	def test_empty_optional_fields_do_not_break_rendering(self):
		doc = self.make_instruction(
			address=None,
			cover_image=None,
			google_maps_url=None,
			wifi_name=None,
			wifi_password=None,
			emergency_contact=None,
			instruction_blocks=[{"section": "Check-In", "block_type": "Text", "title": "Welcome", "body": ""}],
		)
		html = self.render_instruction(doc)
		self.assertIn("Test Guest Guide Property", html)

	def test_map_embed_url_uses_place_id_first(self):
		self.set_conf("google_maps_embed_api_key", "test-key")
		doc = self.make_instruction(
			address="123 Test Road, London",
			google_maps_place_id="ChIJ123abc",
			map_search_query="Ignored query",
		)
		url = doc.get_map_embed_url()
		self.assertIn("key=test-key", url)
		self.assertIn("q=place_id%3AChIJ123abc", url)
		self.assertNotIn("Ignored+query", url)

	def test_map_embed_url_encodes_address_query(self):
		self.set_conf("google_maps_embed_api_key", "test-key")
		doc = self.make_instruction(google_maps_place_id=None, map_search_query=None, address="99A Burlington Road, London SW11 2AA")
		url = doc.get_map_embed_url()
		self.assertIn("99A+Burlington+Road%2C+London+SW11+2AA", url)

	def test_map_embed_url_not_rendered_without_api_key(self):
		self.set_conf("google_maps_embed_api_key", None)
		doc = self.make_instruction()
		html = self.render_instruction(doc)
		self.assertIn("https://www.google.com/maps?", doc.get_map_embed_url())
		self.assertIn("<iframe", html)
		self.assertIn("output=embed", html)
		self.assertNotIn("key=", html)

	def test_map_embed_url_not_rendered_when_disabled(self):
		self.set_conf("google_maps_embed_api_key", "test-key")
		doc = self.make_instruction(show_embedded_map=0)
		html = self.render_instruction(doc)
		self.assertIsNone(doc.get_map_embed_url())
		self.assertNotIn("www.google.com/maps/embed/v1/place", html)
		self.assertNotIn("key=test-key", html)

	def test_map_type_and_zoom_are_normalized(self):
		self.set_conf("google_maps_embed_api_key", "test-key")
		doc = self.make_instruction(map_type="streetview", map_zoom=999)
		url = doc.get_map_embed_url()
		self.assertIn("maptype=roadmap", url)
		self.assertIn("zoom=16", url)

	def test_google_maps_url_rejects_untrusted_host(self):
		with self.assertRaises(frappe.ValidationError):
			self.make_instruction(google_maps_url="https://example.com/map")

	def test_map_external_url_is_generated_from_address(self):
		doc = self.make_instruction(google_maps_url=None, address="99A Burlington Road, New Malden")
		property_map = doc.get_property_map()
		self.assertIn("www.google.com/maps/search/", property_map.external_url)
		self.assertIn("99A+Burlington+Road%2C+New+Malden", property_map.external_url)

	def test_rendered_output_includes_expected_section_content(self):
		self.set_conf("google_maps_embed_api_key", "test-key")
		doc = self.make_instruction()
		html = self.render_instruction(doc)
		self.assertNotIn("page-header-wrapper", html)
		self.assertNotIn("/assets/propms/day/assets/", html)
		self.assertIn("Check-In", html)
		self.assertIn("Parking", html)
		self.assertIn("Open map", html)
		self.assertIn("title=\"Map showing the property location\"", html)
		self.assertIn("referrerpolicy=\"strict-origin-when-cross-origin\"", html)
		self.assertIn("allowfullscreen", html)
		self.assertIn("property-instruction-print", html)
		self.assertIn("Download PDF", html)
		self.assertNotIn('href="javascript:', html)
		self.assertNotIn("guest-wifi-only", html)
		self.assertNotIn("15:00:00", html)
		self.assertIn("@page {", html)
		self.assertIn("pi-screen-layout", html)
		self.assertIn("pi-print-layout", html)
		self.assertIn("pi-print-title", html)
		self.assertIn("break-inside: avoid;", html)
		self.assertIn(">15:00<", html)
		print_slice = html.split('class="pi-print-layout"', 1)[1]
		self.assertNotIn("<iframe", print_slice)
		self.assertEqual(print_slice.count("https://www.google.com/maps/place/99A+Burlington+Road"), 1)
		self.assertIn('data-copy-target="property-address"', html)
		self.assertIn('data-copy-target="wifi-network-name"', html)
		self.assertIn('id="property-address"', html)
		self.assertIn('id="wifi-network-name"', html)
		self.assertIn('class="pi-copy-icon pi-copy-icon-copy"', html)
		self.assertIn('class="pi-copy-icon pi-copy-icon-check"', html)
		self.assertIn('class="pi-copy-status sr-only"', html)
		self.assertNotIn(">Copy address<", html)
		self.assertNotIn(">Copy network<", html)
		self.assertIn('data-pdf-field="title"', html)
		self.assertIn('data-pdf-field="emergency_contact"', html)
		self.assertIn('data-pdf-section="check-in"', html)
		self.assertIn('data-pdf-block-field="body"', html)
		self.assertIn('class="pi-btn pi-btn-secondary pi-pdf-download"', html)
		self.assertIn('data-pdf-token="', html)
		self.assertIn("Preparing PDF", html)
		self.assertIn("PDF downloaded", html)
		self.assertIn("Unable to prepare PDF", html)
		self.assertIn("window.fetch", html)
		self.assertIn("data-pdf-download-url", html)
		self.assertIn(f'<meta name="robots" content="{NOINDEX_ROBOTS_CONTENT}">', html)
		self.assertNotIn(f">{NOINDEX_ROBOTS_CONTENT}<", html)

	def test_print_layout_has_dedicated_wrappers(self):
		doc = self.make_instruction()
		html = self.render_instruction(doc)
		self.assertEqual(html.count('class="pi-print-title"'), 1)
		self.assertIn(".pi-screen-layout {\n      display: none !important;", html)
		self.assertIn(".pi-print-layout {\n      display: block !important;", html)
		self.assertIn(".pi-print-meta-grid", html)
		self.assertIn(".pi-print-image-block", html)

	def test_print_hides_duplicate_map_link_block(self):
		doc = self.make_instruction(
			google_maps_url="https://www.google.com/maps/place/99A+Burlington+Road",
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Link",
					"title": "Map",
					"link_url": "https://www.google.com/maps/place/99A+Burlington+Road",
					"link_label": "Open map",
				},
				{
					"section": "Finding the Property",
					"block_type": "Text",
					"title": "Find the entrance",
					"body": "<p>Look for the black gate beside the shopfront.</p>",
				},
			],
		)
		html = self.render_instruction(doc)
		print_slice = html.split('class="pi-print-layout"', 1)[1]
		self.assertEqual(print_slice.count("https://www.google.com/maps/place/99A+Burlington+Road"), 1)
		self.assertNotIn("<strong>Open map</strong>", print_slice)
		self.assertIn("Find the entrance", print_slice)

	def test_rendered_output_excludes_unpublished_content(self):
		published_doc = self.make_instruction(title="Published Guide")
		unpublished_doc = self.make_instruction(
			property_name=self.make_property().name,
			title="Unpublished Guide",
			published=0,
			slug="unpublished-guide",
		)
		html = self.render_instruction(published_doc)
		self.assertIn("Published Guide", html)
		self.assertNotIn(unpublished_doc.title, html)

	def test_google_translate_widget_disabled_by_default(self):
		self.set_property_management_setting("enable_guest_guide_google_translate", 0)
		doc = self.make_instruction()
		self.make_translation(doc, language_code="es", status="Ready", title="Guia lista")
		html = self.render_instruction(doc)
		self.assertNotIn("translate.google.com/translate_a/element.js", html)
		self.assertNotIn("google_translate_element", html)
		self.assertIn("Language selector", html)
		self.assertIn("English", html)
		self.assertIn("Spanish", html)

	def test_google_translate_widget_renders_when_enabled(self):
		self.set_property_management_setting("enable_guest_guide_google_translate", 1)
		self.set_property_management_setting("guest_guide_source_language", "en")
		self.set_property_management_setting("guest_guide_translate_languages", "es,fr,de")
		doc = self.make_instruction()
		self.make_translation(doc, language_code="es", status="Ready", title="Guia lista")
		context = self.get_context(doc)
		html = self.render_instruction(doc)
		self.assertTrue(context.google_translate.enabled)
		self.assertEqual(context.google_translate.included_languages, ["es", "fr", "de"])
		self.assertEqual(html.count("translate.google.com/translate_a/element.js"), 1)
		self.assertIn("id=\"google_translate_element\"", html)
		self.assertIn('"includedLanguages": "es,fr,de"', html)
		self.assertIn("propmsGuestGuideTranslateInit_", html)
		self.assertNotIn("Language selector", html)
		self.assertNotIn('class="pi-language-option', html)

	def test_google_translate_uses_full_language_list_when_restriction_empty(self):
		self.set_property_management_setting("enable_guest_guide_google_translate", 1)
		self.set_property_management_setting("guest_guide_source_language", "en")
		self.set_property_management_setting("guest_guide_translate_languages", "")
		doc = self.make_instruction()
		context = self.get_context(doc)
		html = self.render_instruction(doc)
		self.assertEqual(context.google_translate.included_languages, [])
		self.assertNotIn("includedLanguages", html)

	def test_google_translate_restriction_is_sanitized(self):
		self.set_property_management_setting("enable_guest_guide_google_translate", 1)
		self.set_property_management_setting("guest_guide_translate_languages", 'es, FR ,<script>alert(1)</script>,pt-br,xx";alert(1)//')
		doc = self.make_instruction()
		context = self.get_context(doc)
		html = self.render_instruction(doc)
		self.assertEqual(context.google_translate.included_languages, ["es", "fr", "pt-br"])
		self.assertIn('"includedLanguages": "es,fr,pt-br"', html)
		self.assertNotIn("alert(1)", html)

	def test_wifi_password_rendered_only_with_public_opt_in(self):
		doc = self.make_instruction(show_wifi_password_publicly=1)
		html = self.render_instruction(doc)
		self.assertIn("guest-wifi-only", html)
		self.assertIn('id="wifi-password-public"', html)
		self.assertIn('data-copy-target="wifi-password-public"', html)
		self.assertIn('class="pi-copy-value notranslate"', html)
		self.assertIn('translate="no">guest-wifi-only</span>', html)
		self.assertNotIn(">Copy password<", html)

	def test_protected_identifier_values_are_marked_notranslate(self):
		doc = self.make_instruction(emergency_contact="+44 20 7946 0958")
		html = self.render_instruction(doc)
		self.assertIn('id="property-address"', html)
		self.assertIn('id="wifi-network-name"', html)
		self.assertIn('class="pi-copy-value notranslate"', html)
		self.assertIn('id="property-address"', html)
		self.assertIn('translate="no">99A Burlington Road</span>', html)
		self.assertIn('translate="no">TestWifi</span>', html)
		self.assertIn('class="pi-value notranslate"', html)
		self.assertIn('translate="no">+44 20 7946 0958</span>', html)

	def test_copy_buttons_reference_visible_targets(self):
		doc = self.make_instruction()
		html = self.render_instruction(doc)
		self.assertIn('data-copy-target="property-address"', html)
		self.assertIn('data-copy-target="wifi-network-name"', html)
		self.assertNotIn("data-copy-value=", html)
		self.assertIn('document.getElementById(copyTarget)', html)
		self.assertIn("targetElement.textContent.trim()", html)
		self.assertIn('aria-label="Copy property address"', html)
		self.assertIn('title="Copy property address"', html)
		self.assertIn('aria-label="Copy Wi-Fi network name"', html)
		self.assertIn('title="Copy Wi-Fi network name"', html)
		self.assertIn('copyButton.classList.add("is-copied")', html)
		self.assertIn('statusElement.textContent = "Copied"', html)
		self.assertIn('statusElement.textContent = "Unable to copy"', html)

	def test_password_remains_hidden_without_public_opt_in(self):
		doc = self.make_instruction(show_wifi_password_publicly=0)
		html = self.render_instruction(doc)
		self.assertNotIn("guest-wifi-only", html)
		self.assertNotIn("Copy password", html)
		self.assertNotIn("wifi-password-public", html)

	def test_copy_script_is_included_once(self):
		doc = self.make_instruction()
		html = self.render_instruction(doc)
		self.assertEqual(html.count("document.addEventListener(\"click\""), 1)
		self.assertIn('copyButton.setAttribute("aria-label", "Copied")', html)
		self.assertIn('copyButton.setAttribute("title", "Copied")', html)

	def test_pdf_template_contains_text_without_screen_controls(self):
		doc = self.make_instruction()
		html = self.render_pdf(doc)
		self.assertIn("Estaex Guest Guide", html)
		self.assertIn("TestWifi", html)
		self.assertIn("99A Burlington Road", html)
		self.assertNotIn("<iframe", html)
		self.assertNotIn("translate.google.com/translate_a/element.js", html)
		self.assertNotIn("pi-copy-button", html)
		self.assertNotIn("property-instruction-print", html)
		self.assertIn("Open property in Google Maps", html)
		self.assertIn('class="pdf-link-anchor"', html)

	def test_pdf_public_images_are_inlined(self):
		doc = self.make_instruction(
			cover_image="/files/test-cover.jpg",
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Image",
					"title": "Entrance",
					"image": "/files/test-guide-image.jpg",
					"caption": "Guide image",
				}
			],
		)
		with patch.object(
			doc,
			"get_inline_asset_data_uri",
			side_effect=["data:image/jpeg;base64,cover123", "data:image/jpeg;base64,guide123"],
		):
			html = doc.render_pdf_html()
		self.assertIn('src="data:image/jpeg;base64,cover123"', html)
		self.assertIn('src="data:image/jpeg;base64,guide123"', html)
		self.assertNotIn('src="/files/test-cover.jpg"', html)
		self.assertNotIn('src="/files/test-guide-image.jpg"', html)

	def test_pdf_private_images_are_inlined(self):
		doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Image",
					"title": "Entrance",
					"image": "/private/files/test-guide-image.jpg",
					"caption": "Guide image",
				}
			],
		)
		with patch.object(doc, "get_inline_asset_data_uri", return_value="data:image/jpeg;base64,abc123"):
			html = doc.render_pdf_html()
		self.assertIn('src="data:image/jpeg;base64,abc123"', html)

	def test_pdf_map_uses_static_image_when_google_key_available(self):
		self.set_conf("google_maps_embed_api_key", "test-key")
		doc = self.make_instruction(address="99A Burlington Road")
		context = doc.get_pdf_render_context()
		self.assertTrue(context.pdf_map.image_url)
		self.assertIn("maps.googleapis.com/maps/api/staticmap", context.pdf_map.image_url)
		self.assertIn("key=test-key", context.pdf_map.image_url)

	def test_pdf_map_fallback_renders_without_google_key(self):
		self.set_conf("google_maps_embed_api_key", None)
		doc = self.make_instruction(address="99A Burlington Road")
		html = self.render_pdf(doc)
		self.assertIn("Map preview unavailable in this PDF", html)
		self.assertIn("Open property in Google Maps", html)
		self.assertIn("www.google.com/maps/place/99A+Burlington+Road", html)

	def test_pdf_template_includes_public_password_only_when_enabled(self):
		doc = self.make_instruction(show_wifi_password_publicly=1)
		html = self.render_pdf(doc)
		self.assertIn("guest-wifi-only", html)
		self.assertIn("Wi-Fi Password", html)

	def test_pdf_endpoint_returns_download_response(self):
		doc = self.make_instruction()
		frappe.local.response = frappe._dict(headers={})
		frappe.local.response_headers = Headers()
		with patch(
			"propms.property_management_solution.doctype.property_instruction.property_instruction.get_pdf",
			return_value=b"%PDF-1.4 test",
		):
			download_pdf(slug=doc.slug)
		self.assertEqual(frappe.local.response.filename, "test-guest-guide-property.pdf")
		self.assertEqual(frappe.local.response.type, "download")
		self.assertEqual(frappe.local.response.content_type, "application/pdf")
		self.assertEqual(frappe.local.response_headers.get("X-Robots-Tag"), NOINDEX_ROBOTS_CONTENT)

	def test_widget_translated_pdf_has_no_footer_only_third_page(self):
		doc = self.make_instruction(wifi_name="Estaex Guest WiFi")
		pdf_bytes = self.generate_pdf_bytes(doc, translated_snapshot=self.make_widget_snapshot(doc, language="fr"))
		pages = self.extract_pdf_pages(pdf_bytes)
		self.assertEqual(len(pages), 2)
		self.assertIn("Guide des visiteurs du 99A", pages[0])
		self.assertRegex(pages[0], r"Page\s+1\s+of\s+2")
		self.assertRegex(pages[1], r"Page\s+2\s+of\s+2")
		self.assertNotRegex("\n".join(pages), r"Page\s+3\s+of\s+3")
		self.assertIn(PDF_WIDGET_TRANSLATION_NOTE, "\n".join(pages))
		self.assertIn("99A Burlington Road", "\n".join(pages))
		self.assertIn("Estaex Guest WiFi", "\n".join(pages))
		self.assertNotIn("guest-wifi-only", "\n".join(pages))

	def test_long_translated_pdf_retains_all_content_without_blank_trailing_page(self):
		doc = self.make_instruction(wifi_name="Estaex Guest WiFi")
		pdf_bytes = self.generate_pdf_bytes(doc, translated_snapshot=self.make_widget_snapshot(doc, language="de", expanded=True))
		pages = self.extract_pdf_pages(pdf_bytes)
		self.assertGreaterEqual(len(pages), 2)
		self.assertTrue(all(page.strip() for page in pages))
		self.assertIn("Gästeleitfaden für 99A Burlington Road", "\n".join(pages))
		self.assertIn("Zusätzlicher übersetzter Fließtext.", "\n".join(pages))
		self.assertEqual("\n".join(pages).count("Diese"), 0)
		self.assertIn("99A Burlington Road", "\n".join(pages))
		self.assertIn("Estaex Guest WiFi", "\n".join(pages))
		self.assertNotIn("guest-wifi-only", "\n".join(pages))

	def test_cleanup_removes_only_footer_only_trailing_page(self):
		doc = self.make_instruction()
		class FakePage:
			def __init__(self, text):
				self._text = text

			def extract_text(self):
				return self._text

		class FakeReader:
			def __init__(self, pages):
				self.pages = pages

		class FakeWriter:
			def __init__(self):
				self.pages = []

			def add_page(self, page):
				self.pages.append(page)

		fake_pages = [
			FakePage("Content page one"),
			FakePage("Content page two"),
			FakePage("Estaex Guest Guide\n23-07-2026\nPage 3 of 3"),
		]
		with patch(
			"propms.property_management_solution.doctype.property_instruction.property_instruction.PdfReader",
			return_value=FakeReader(fake_pages),
		), patch(
			"propms.property_management_solution.doctype.property_instruction.property_instruction.PdfWriter",
			FakeWriter,
		), patch.object(
			doc,
			"get_pdf_bytes_from_writer",
			side_effect=lambda writer: str(len(writer.pages)).encode(),
		):
			cleaned_bytes, removed = doc.cleanup_trailing_footer_only_page(b"pdf")
		self.assertTrue(removed)
		self.assertEqual(cleaned_bytes, b"2")

	def test_cleanup_does_not_remove_legitimate_content_page(self):
		doc = self.make_instruction()
		class FakePage:
			def __init__(self, text):
				self._text = text

			def extract_text(self):
				return self._text

		class FakeReader:
			def __init__(self, pages):
				self.pages = pages

		fake_pages = [
			FakePage("Content page one"),
			FakePage("Content page two"),
			FakePage("Estaex Guest Guide\nParking details\nPage 3 of 3"),
		]
		with patch(
			"propms.property_management_solution.doctype.property_instruction.property_instruction.PdfReader",
			return_value=FakeReader(fake_pages),
		):
			cleaned_bytes, removed = doc.cleanup_trailing_footer_only_page(b"pdf")
		self.assertFalse(removed)
		self.assertEqual(cleaned_bytes, b"pdf")

	def test_page_context_contains_pdf_snapshot_token(self):
		doc = self.make_instruction()
		context = self.get_context(doc)
		self.assertTrue(context.pdf_snapshot_token)
		self.assertIn(".", context.pdf_snapshot_token)

	def test_expired_pdf_snapshot_token_is_rejected(self):
		doc = self.make_instruction()
		payload = {
			"slug": doc.slug,
			"token": doc.get_pdf_snapshot_token(expires_at=1),
			"display_language": "fr",
			"reviewed_language": "en",
			"fields": {"title": "Guide en francais"},
			"sections": {},
			"blocks": {},
		}
		self.set_request_payload(payload)
		with self.assertRaises(frappe.ValidationError):
			download_pdf()

	def test_pdf_snapshot_token_for_other_instruction_is_rejected(self):
		doc = self.make_instruction()
		other = self.make_instruction(property_name=self.make_property().name, slug="other-guide")
		payload = {
			"slug": doc.slug,
			"token": other.get_pdf_snapshot_token(),
			"display_language": "fr",
			"reviewed_language": "en",
			"fields": {"title": "Guide en francais"},
			"sections": {},
			"blocks": {},
		}
		self.set_request_payload(payload)
		with self.assertRaises(frappe.ValidationError):
			download_pdf()

	def test_malformed_pdf_snapshot_payload_is_rejected(self):
		doc = self.make_instruction()
		payload = {
			"slug": doc.slug,
			"token": doc.get_pdf_snapshot_token(),
			"display_language": "fr",
			"reviewed_language": "en",
			"fields": {"title": "Guide"},
			"sections": [],
			"blocks": {},
		}
		self.set_request_payload(payload)
		with self.assertRaises(frappe.ValidationError):
			download_pdf()

	def test_translated_snapshot_overlays_only_permitted_fields(self):
		doc = self.make_instruction(emergency_contact="For immediate danger, contact emergency services.")
		source_block = doc.get_translation_source_payload()["blocks"][1]
		payload = {
			"slug": doc.slug,
			"token": doc.get_pdf_snapshot_token(),
			"display_language": "fr",
			"reviewed_language": "en",
			"widget_language": "fr",
			"fields": {
				"title": "Guide d'arrivee",
				"emergency_contact": "Appelez les services d'urgence",
			},
			"sections": {"check-in": "Arrivee"},
			"blocks": {
				source_block["source_block_name"]: {
					"title": "Entrez",
					"body": "<p onclick='alert(1)'>Entrez par la porte laterale.</p><script>alert(1)</script>",
					"caption": "Legende",
					"link_label": "Ignored label",
				},
				"UNKNOWN-BLOCK": {"title": "Ignored"},
			},
		}
		snapshot = doc.parse_translated_pdf_snapshot(payload)
		html = doc.render_pdf_html(translated_snapshot=snapshot)
		self.assertIn("Guide d'arrivee", html)
		self.assertIn("Arrivee", html)
		self.assertIn("Entrez", html)
		self.assertIn("Entrez par la porte laterale.", html)
		self.assertNotIn("onclick", html)
		self.assertNotIn("alert(1)", html)
		self.assertIn("99A Burlington Road", html)
		self.assertIn("TestWifi", html)
		self.assertIn("Machine translated using the language selected on the guest guide.", html)

	def test_translated_snapshot_cannot_expose_password_or_reorder_blocks(self):
		doc = self.make_instruction(show_wifi_password_publicly=0)
		source_blocks = doc.get_translation_source_payload()["blocks"]
		payload = {
			"slug": doc.slug,
			"token": doc.get_pdf_snapshot_token(),
			"display_language": "de",
			"reviewed_language": "en",
			"fields": {"title": "Gastanleitung"},
			"sections": {"parking": "Parken", "check-in": "Ankunft"},
			"blocks": {
				source_blocks[-1]["source_block_name"]: {"title": "Muell"},
				source_blocks[0]["source_block_name"]: {"title": "Karte"},
			},
		}
		snapshot = doc.parse_translated_pdf_snapshot(payload)
		html = doc.render_pdf_html(translated_snapshot=snapshot)
		self.assertNotIn("guest-wifi-only", html)
		self.assertLess(html.find("Ankunft"), html.find("Parken"))
		self.assertNotIn("UNKNOWN-BLOCK", html)

	def test_post_pdf_endpoint_returns_pdf_for_translated_snapshot(self):
		doc = self.make_instruction(emergency_contact="For immediate danger, contact emergency services.")
		payload = doc.get_snapshot_request_payload(
			{
				"display_language": "fr",
				"reviewed_language": "en",
				"widget_language": "fr",
				"fields": {
					"title": "Guide traduit",
					"emergency_contact": "Appelez les services d'urgence",
				},
				"sections": {"check-in": "Arrivee"},
				"blocks": {},
			}
		)
		self.set_request_payload(payload)
		frappe.local.response = frappe._dict(headers={})
		frappe.local.response_headers = Headers()
		with patch(
			"propms.property_management_solution.doctype.property_instruction.property_instruction.get_pdf",
			return_value=b"%PDF-1.4 translated",
		) as get_pdf_mock:
			download_pdf()
		rendered_html = get_pdf_mock.call_args.args[0]
		self.assertIn("Guide traduit", rendered_html)
		self.assertIn("Arrivee", rendered_html)
		self.assertEqual(frappe.local.response.content_type, "application/pdf")
		self.assertEqual(frappe.local.response.filename, "test-guest-guide-property.pdf")
		self.assertEqual(frappe.local.response_headers.get("X-Robots-Tag"), NOINDEX_ROBOTS_CONTENT)

	def test_unpublished_pdf_request_is_rejected(self):
		doc = self.make_instruction(published=0, slug="hidden-guide")
		frappe.local.response = frappe._dict(headers={})
		frappe.local.response_headers = Headers()
		with self.assertRaises(frappe.DoesNotExistError):
			download_pdf(slug=doc.slug)

	def test_no_key_map_embed_uses_trusted_google_host(self):
		self.set_conf("google_maps_embed_api_key", None)
		doc = self.make_instruction(address="99A Burlington Road, New Malden")
		self.assertTrue(doc.get_map_embed_url().startswith("https://www.google.com/maps?"))

	def test_guide_context_sets_noindex_header(self):
		doc = self.make_instruction()
		self.get_context(doc)
		self.assertEqual(frappe.local.response_headers.get("X-Robots-Tag"), NOINDEX_ROBOTS_CONTENT)

	def test_sitemap_filter_excludes_property_instruction_only(self):
		doc = self.make_instruction(slug="sitemap-hidden-guide")
		routes = {
			doc.route: {"doctype": "Property Instruction", "name": doc.name, "modified": doc.modified},
			"contact": {"doctype": "Web Page", "name": "contact", "modified": doc.modified},
		}
		with patch("frappe.www.sitemap.get_public_pages_from_doctypes", return_value=routes):
			filtered = get_filtered_public_pages_from_doctypes()
		self.assertNotIn(doc.route, filtered)
		self.assertIn("contact", filtered)

	def test_after_request_hook_adds_noindex_header_for_guest_guide_route(self):
		response = frappe._dict(headers={})
		request = frappe._dict(path="/instructions/test-guide")
		apply_guest_guide_noindex_headers(response=response, request=request)
		self.assertEqual(response.headers.get("X-Robots-Tag"), NOINDEX_ROBOTS_CONTENT)

	def test_after_request_hook_does_not_touch_unrelated_route(self):
		response = frappe._dict(headers={})
		request = frappe._dict(path="/contact")
		apply_guest_guide_noindex_headers(response=response, request=request)
		self.assertIsNone(response.headers.get("X-Robots-Tag"))


class TestPropertyInstructionTranslations(PropertyInstructionTestMixin, FrappeTestCase):
	def test_only_ready_translations_are_public(self):
		doc = self.make_instruction()
		self.make_translation(doc, language_code="es", status="Ready", language_name="Spanish")
		self.make_translation(doc, language_code="fr", status="Draft", language_name="French")
		context = self.get_context(doc, lang="fr")
		self.assertEqual(context.title, doc.title)
		self.assertEqual(context.boot.lang, "en")
		self.assertEqual([row.language_code for row in context.available_languages], ["en", "es"])

	def test_ready_translation_renders_selected_language(self):
		doc = self.make_instruction()
		self.make_translation(doc, language_code="es", status="Ready", title="Guia de huespedes")
		context = self.get_context(doc, lang="es")
		html = self.render_instruction(doc, lang="es")
		self.assertEqual(context.boot.lang, "es")
		self.assertEqual(context.title, "Guia de huespedes")
		self.assertIn("Guia de huespedes", html)
		self.assertIn("Guia de huespedes", self.render_pdf(doc, lang="es"))
		self.assertIn(f'<meta name="robots" content="{NOINDEX_ROBOTS_CONTENT}">', html)
		self.assertEqual(frappe.local.response_headers.get("X-Robots-Tag"), NOINDEX_ROBOTS_CONTENT)

	def test_ready_translation_reads_language_from_request_args(self):
		doc = self.make_instruction()
		self.make_translation(doc, language_code="es", status="Ready", title="Guia desde query")
		html = self.render_instruction(doc, lang="es")
		self.assertIn("Guia desde query", html)

	def test_context_boot_dict_is_normalized_for_public_render(self):
		doc = self.make_instruction()
		self.make_translation(doc, language_code="es", status="Ready", title="Guia publica")
		context = self.get_context(doc, lang="es")
		context.boot = {"lang": "en"}
		doc.get_context(context)
		self.assertEqual(context.boot.lang, "es")

	def test_translated_blocks_retain_source_ordering(self):
		doc = self.make_instruction(
			instruction_blocks=[
				{"section": "Check-In", "block_type": "Step", "title": "Second", "sort_order": 20},
				{"section": "Parking", "block_type": "Text", "title": "Parking", "sort_order": 5},
				{"section": "Check-In", "block_type": "Step", "title": "First", "sort_order": 10},
			]
		)
		doc.reload()
		source_blocks = doc.get_translation_source_payload()["blocks"]
		self.make_translation(
			doc,
			status="Ready",
			blocks=[
				{
					"source_block_name": source_blocks[0]["source_block_name"],
					"section": "Llegada",
					"title": "Aparcamiento traducido",
					"body": None,
					"caption": None,
					"link_label": None,
					"sort_order": source_blocks[0]["sort_order"],
				},
				{
					"source_block_name": source_blocks[1]["source_block_name"],
					"section": "Registro",
					"title": "Primero traducido",
					"body": None,
					"caption": None,
					"link_label": None,
					"sort_order": source_blocks[1]["sort_order"],
				},
				{
					"source_block_name": source_blocks[2]["source_block_name"],
					"section": "Registro",
					"title": "Segundo traducido",
					"body": None,
					"caption": None,
					"link_label": None,
					"sort_order": source_blocks[2]["sort_order"],
				},
			],
		)
		context = self.get_context(doc, lang="es")
		self.assertEqual(context.sections[0].section, "Registro")
		self.assertEqual([block.title for block in context.sections[0].blocks], ["Primero traducido", "Segundo traducido"])

	def test_translated_html_is_sanitized(self):
		doc = self.make_instruction()
		source_blocks = doc.get_translation_source_payload()["blocks"]
		self.make_translation(
			doc,
			status="Ready",
			blocks=[
				{
					"source_block_name": row["source_block_name"],
					"section": "Registro" if row["section"] == "Check-In" else f"{row['section']} ES",
					"title": "Paso seguro" if row["source_block_name"] == source_blocks[1]["source_block_name"] else f"{(row.get('title') or row['section'])} ES",
					"body": "<p>Texto</p><script>alert(1)</script>" if row["source_block_name"] == source_blocks[1]["source_block_name"] else row.get("body"),
					"caption": row.get("caption"),
					"link_label": row.get("link_label"),
					"sort_order": row["sort_order"],
				}
				for row in source_blocks
			]
		)
		html = self.render_instruction(doc, lang="es")
		self.assertIn("Texto", html)
		self.assertNotIn("alert(1)", html)

	def test_urls_and_image_paths_remain_source_values(self):
		doc = self.make_instruction(
			instruction_blocks=[
				{
					"section": "Finding the Property",
					"block_type": "Image",
					"title": "Entrance",
					"image": "/files/test-guide-image.png",
					"caption": "Original caption",
				},
				{
					"section": "Finding the Property",
					"block_type": "Link",
					"title": "Directions",
					"link_url": "https://example.com/original-map",
					"link_label": "Original link",
				},
			],
		)
		source_blocks = doc.get_translation_source_payload()["blocks"]
		self.make_translation(
			doc,
			blocks=[
				{
					"source_block_name": source_blocks[0]["source_block_name"],
					"section": "Encontrar la propiedad",
					"title": "Entrada",
					"body": None,
					"caption": "Subtitulo",
					"link_label": None,
					"sort_order": source_blocks[0]["sort_order"],
				},
				{
					"source_block_name": source_blocks[1]["source_block_name"],
					"section": "Encontrar la propiedad",
					"title": "Direcciones",
					"body": None,
					"caption": None,
					"link_label": "Abrir mapa",
					"sort_order": source_blocks[1]["sort_order"],
				},
			],
		)
		html = self.render_instruction(doc, lang="es")
		self.assertIn("/files/test-guide-image.png", html)
		self.assertIn("https://example.com/original-map", html)
		self.assertIn("Abrir mapa", html)

	def test_generate_translation_creates_draft_with_mocked_service(self):
		doc = self.make_instruction()
		with patch.object(
			translation_service,
			"translate_property_instruction",
			return_value={
				"title": "Guia de huespedes",
				"address": "99A Burlington Road ES",
				"emergency_contact": "Emergencia",
				"blocks": [
					{
						"source_block_name": row["source_block_name"],
						"section": f"{row['section']} ES",
						"title": f"{row.get('title') or ''} ES".strip() or None,
						"body": row.get("body"),
						"caption": row.get("caption"),
						"link_label": row.get("link_label"),
						"sort_order": row.get("sort_order"),
					}
					for row in doc.get_translation_source_payload()["blocks"]
				],
			},
		):
			result = generate_translation(doc.name, "es", "Spanish")
		translation = frappe.get_doc("Property Instruction Translation", result["name"])
		self.to_delete.append(("Property Instruction Translation", translation.name))
		self.assertEqual(translation.status, "Draft")
		self.assertEqual(translation.language_code, "es")
		self.assertEqual(translation.title, "Guia de huespedes")
		self.assertEqual(translation.address, doc.address)

	def test_reviewed_translation_cannot_be_ready_with_missing_title(self):
		doc = self.make_instruction()
		translation = self.make_translation(doc, status="Draft", title="")
		translation.status = "Ready"
		with self.assertRaises(frappe.ValidationError):
			translation.save(ignore_permissions=True)

	def test_reviewed_translation_cannot_be_ready_with_missing_source_block(self):
		doc = self.make_instruction()
		translation = self.make_translation(doc, status="Draft")
		translation.blocks = translation.blocks[:-1]
		translation.status = "Ready"
		with self.assertRaises(frappe.ValidationError):
			translation.save(ignore_permissions=True)

	def test_reviewed_translation_cannot_be_ready_with_missing_block_body_or_title(self):
		doc = self.make_instruction()
		translation = self.make_translation(doc, status="Draft")
		translation.blocks[1].title = ""
		translation.blocks[1].body = ""
		translation.status = "Ready"
		with self.assertRaises(frappe.ValidationError):
			translation.save(ignore_permissions=True)

	def test_protected_address_and_ssid_are_not_required_for_ready_translation(self):
		doc = self.make_instruction(wifi_name="Estaex Guest WiFi")
		translation = self.make_translation(doc, status="Draft", address="")
		translation.status = "Ready"
		translation.save(ignore_permissions=True)
		translation.reload()
		self.assertEqual(translation.status, "Ready")

	def test_completed_spanish_translation_can_be_ready(self):
		doc = self.make_instruction()
		translation = self.make_translation(
			doc,
			status="Draft",
			title="Guia de huespedes de prueba",
			emergency_contact="En caso de peligro inmediato, contacte con los servicios de emergencia.",
			blocks=[
				{
					"source_block_name": row["source_block_name"],
					"section": f"{row['section']} ES",
					"title": f"{(row.get('title') or row['section'])} ES",
					"body": "<p>Contenido traducido.</p>" if row.get("body") else None,
					"caption": "Subtitulo ES" if row.get("caption") else None,
					"link_label": "Abrir mapa" if row.get("link_label") else None,
					"sort_order": row.get("sort_order"),
				}
				for row in doc.get_translation_source_payload()["blocks"]
			],
		)
		translation.status = "Ready"
		translation.save(ignore_permissions=True)
		translation.reload()
		self.assertEqual(translation.status, "Ready")

	def test_spanish_pdf_no_longer_contains_known_untranslated_english_fixture_phrases(self):
		doc = self.make_instruction(wifi_name="Estaex Guest WiFi")
		self.make_translation(
			doc,
			language_code="es",
			status="Ready",
			title="Guia de huespedes de 99A Burlington Road",
			emergency_contact="En caso de peligro inmediato, contacte con los servicios de emergencia.",
			blocks=[
				{
					"source_block_name": row["source_block_name"],
					"section": {
						"Finding the Property": "Encontrar la propiedad",
						"Check-In": "Registro",
						"Parking": "Aparcamiento",
						"WiFi": "WiFi",
						"Rubbish": "Residuos",
						"Check-Out": "Salida",
					}.get(row["section"], row["section"]),
					"title": {
						"Map": "Mapa",
						"Entrance reference": "Referencia de entrada",
						"Arrive at the main entrance": "Llegue a la entrada principal",
						"Follow separately supplied arrival instructions": "Siga las instrucciones de llegada facilitadas por separado",
						"Confirm the door is locked after entry": "Confirme que la puerta queda cerrada despues de entrar",
						"Guest parking": "Aparcamiento para invitados",
						"Parking restrictions": "Restricciones de aparcamiento",
						"Waste and recycling": "Residuos y reciclaje",
						"Turn off lights and appliances": "Apague las luces y los electrodomesticos",
						"Close windows": "Cierre las ventanas",
						"Lock the property": "Cierre la propiedad",
						"Follow separate key-return instructions": "Siga las instrucciones separadas para devolver las llaves",
					}.get(row.get("title"), row.get("title")),
					"body": (
						"<p>Contenido traducido al espanol.</p>" if row.get("body") else None
					),
					"caption": "Imagen de referencia de desarrollo." if row.get("caption") else None,
					"link_label": "Abrir mapa" if row.get("link_label") else None,
					"sort_order": row.get("sort_order"),
				}
				for row in doc.get_translation_source_payload()["blocks"]
			],
		)
		pdf_text = self.render_pdf(doc, lang="es")
		self.assertIn("Guia de huespedes de 99A Burlington Road", pdf_text)
		self.assertNotIn("Arrive at the main entrance", pdf_text)
		self.assertNotIn("Follow separately supplied arrival instructions", pdf_text)
		self.assertIn("99A Burlington Road", pdf_text)
		self.assertIn("Estaex Guest WiFi", pdf_text)
		self.assertNotIn("guest-wifi-only", pdf_text)

	def test_reviewed_translation_keeps_original_address_and_wifi_name(self):
		doc = self.make_instruction()
		self.make_translation(
			doc,
			language_code="es",
			status="Ready",
			address="Direccion traducida",
			blocks=[
				{
					"source_block_name": row["source_block_name"],
					"section": f"{row['section']} ES",
					"title": f"{(row.get('title') or row['section'])} ES",
					"body": row.get("body"),
					"caption": row.get("caption"),
					"link_label": row.get("link_label"),
					"sort_order": row.get("sort_order"),
				}
				for row in doc.get_translation_source_payload()["blocks"]
			],
		)
		html = self.render_instruction(doc, lang="es")
		self.assertIn("99A Burlington Road", html)
		self.assertIn("TestWifi", html)
		self.assertNotIn("Direccion traducida", html)

	def test_identifier_values_are_preserved_during_translation(self):
		payload = {
			"title": "Guest guide",
			"address": "99A Burlington Road",
			"emergency_contact": "+44 20 7946 0958",
			"blocks": [
				{
					"source_block_name": "ROW-1",
					"section": "Check-In",
					"title": "Call +44 20 7946 0958",
					"body": "<p>Contact us on +44 20 7946 0958 or email host@example.com.</p>",
					"caption": "host@example.com",
					"link_label": "https://example.com/guide",
					"sort_order": 1,
				}
			],
		}
		with patch.object(
			translation_service,
			"translate_jobs",
			return_value=["Guia", "Registro", "<p>Contact us on [[PROPMS_TOKEN_0]] or email [[PROPMS_TOKEN_1]].</p>"],
		):
			result = translation_service.translate_property_instruction(payload, target_language="es")
		self.assertEqual(result["address"], "99A Burlington Road")
		self.assertEqual(result["emergency_contact"], "+44 20 7946 0958")
		self.assertEqual(result["blocks"][0]["caption"], "host@example.com")
		self.assertEqual(result["blocks"][0]["link_label"], "https://example.com/guide")
		self.assertEqual(result["blocks"][0]["title"], "Call +44 20 7946 0958")
		self.assertIn("+44 20 7946 0958", result["blocks"][0]["body"])
		self.assertIn("host@example.com", result["blocks"][0]["body"])

	def test_missing_google_credentials_error_does_not_break_english_page(self):
		doc = self.make_instruction()
		with patch("importlib.util.find_spec", return_value=None):
			with self.assertRaises(frappe.ValidationError):
				translation_service.translate_property_instruction(
					doc.get_translation_source_payload(),
					target_language="es",
				)
		html = self.render_instruction(doc)
		self.assertIn(doc.title, html)

	def test_translation_change_marks_existing_translations_stale(self):
		doc = self.make_instruction()
		translation = self.make_translation(doc, language_code="es", status="Ready")
		doc.title = "Updated Guide Title"
		doc.save(ignore_permissions=True)
		translation.reload()
		self.assertEqual(translation.status, "Stale")

	def test_translated_print_output_uses_selected_language(self):
		doc = self.make_instruction()
		self.make_translation(doc, language_code="es", status="Ready", title="Guia para imprimir")
		html = self.render_instruction(doc, lang="es")
		self.assertIn("Guia para imprimir", html)
		self.assertIn("@page {", html)
		self.assertIn(".pi-language-switcher", html)
		self.assertIn("Guia para imprimir", self.render_pdf(doc, lang="es"))

	def test_translation_fallback_excludes_unready_content(self):
		doc = self.make_instruction(title="English Guide")
		self.make_translation(doc, language_code="es", status="Stale", title="Guia caducada")
		html = self.render_instruction(doc, lang="es")
		self.assertIn("English Guide", html)
		self.assertNotIn("Guia caducada", html)
		self.assertIn(f'<meta name="robots" content="{NOINDEX_ROBOTS_CONTENT}">', html)

	def test_pdf_falls_back_to_english_for_stale_translation(self):
		doc = self.make_instruction(title="English Guide")
		self.make_translation(doc, language_code="es", status="Stale", title="Guia caducada")
		html = self.render_pdf(doc, lang="es")
		self.assertIn("English Guide", html)
		self.assertNotIn("Guia caducada", html)

	def test_unsupported_language_fallback_keeps_noindex(self):
		doc = self.make_instruction(title="English Guide")
		html = self.render_instruction(doc, lang="it")
		self.assertIn("English Guide", html)
		self.assertIn(f'<meta name="robots" content="{NOINDEX_ROBOTS_CONTENT}">', html)
		self.assertEqual(frappe.local.response_headers.get("X-Robots-Tag"), NOINDEX_ROBOTS_CONTENT)

	def test_noindex_present_when_google_translate_disabled(self):
		self.set_property_management_setting("enable_guest_guide_google_translate", 0)
		doc = self.make_instruction()
		html = self.render_instruction(doc)
		self.assertIn(f'<meta name="robots" content="{NOINDEX_ROBOTS_CONTENT}">', html)
		self.assertEqual(frappe.local.response_headers.get("X-Robots-Tag"), NOINDEX_ROBOTS_CONTENT)

	def test_noindex_present_when_google_translate_enabled(self):
		self.set_property_management_setting("enable_guest_guide_google_translate", 1)
		doc = self.make_instruction()
		html = self.render_instruction(doc)
		self.assertIn("translate.google.com/translate_a/element.js", html)
		self.assertIn(f'<meta name="robots" content="{NOINDEX_ROBOTS_CONTENT}">', html)
		self.assertEqual(frappe.local.response_headers.get("X-Robots-Tag"), NOINDEX_ROBOTS_CONTENT)


@frappe.whitelist()
def run_codex_tests():
	suite = unittest.defaultTestLoader.loadTestsFromName(__name__)
	result = unittest.TextTestRunner(verbosity=2).run(suite)
	if not result.wasSuccessful():
		raise frappe.ValidationError("Property Instruction tests failed")
	return {
		"tests_run": result.testsRun,
		"failures": len(result.failures),
		"errors": len(result.errors),
	}


@frappe.whitelist()
def create_temp_http_instruction():
	property_doc = frappe.get_doc(
		{
			"doctype": "Property",
			"name1": f"HTTP Test Property {uuid.uuid4().hex[:8]}",
		}
	).insert(ignore_permissions=True)
	instruction = frappe.get_doc(
		{
			"doctype": "Property Instruction",
			"title": "Test Guest Guide Property",
			"property": property_doc.name,
			"published": 1,
			"google_maps_url": "https://example.com/map",
			"wifi_name": "TestWifi",
			"wifi_password": "guest-wifi-only",
			"instruction_blocks": [
				{
					"section": "Check-In",
					"block_type": "Step",
					"title": "Arrive",
					"body": "<p>Welcome to the property.</p>",
				},
				{
					"section": "Parking",
					"block_type": "Text",
					"title": "Parking",
					"body": "<p>Use the allocated bay.</p>",
				},
			],
		}
	).insert(ignore_permissions=True)
	clear_routing_cache()
	return {
		"instruction_name": instruction.name,
		"property_name": property_doc.name,
		"route": instruction.route,
	}


@frappe.whitelist()
def delete_temp_http_instruction(instruction_name, property_name):
	if frappe.db.exists("Property Instruction", instruction_name):
		frappe.delete_doc("Property Instruction", instruction_name, force=1)
	if frappe.db.exists("Property", property_name):
		frappe.delete_doc("Property", property_name, force=1)
	clear_routing_cache()
	return {"deleted": True}
