import frappe
from frappe.tests import IntegrationTestCase

from propms.website_catalog import (
    _published_relationships,
    approve_for_publication,
    withdraw_publication,
)


class TestStructuredWebsiteContent(IntegrationTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        self.created = []

    def tearDown(self):
        for doctype, name in reversed(self.created):
            if frappe.db.exists(doctype, name):
                frappe.delete_doc(doctype, name, force=True)
        frappe.db.rollback()

    def test_service_defaults_to_draft_noindex_and_generates_route(self):
        doc = self._service("draft-service")
        self.assertEqual(doc.route, "services/draft-service")
        self.assertEqual(doc.publication_status, "Draft")
        self.assertEqual(doc.published, 0)
        self.assertEqual(doc.index_state, "noindex")

    def test_duplicate_service_slug_is_rejected(self):
        self._service("duplicate-service")
        with self.assertRaises((frappe.UniqueValidationError, frappe.DuplicateEntryError)):
            self._service("duplicate-service")

    def test_publication_state_cannot_be_set_directly(self):
        doc = self._service("protected-publication")
        doc.published = 1
        doc.publication_status = "Approved"
        doc.index_state = "index"
        with self.assertRaises(frappe.ValidationError):
            doc.save()

    def test_publication_rejects_thin_or_placeholder_content(self):
        area = self._area("thin-area", substantive=False)
        area.introduction = "TODO add local details"
        with self.assertRaises(frappe.ValidationError):
            area.save()

        service = self._service("thin-service", substantive=False)
        service.append("related_areas", {"area": area.name})
        service.save()
        with self.assertRaises(frappe.ValidationError):
            approve_for_publication("PropMS Service", service.name)

    def test_approval_and_withdrawal_manage_index_state(self):
        area = self._area("approval-area")
        service = self._service("approval-service")
        service.append("related_areas", {"area": area.name})
        service.save()

        result = approve_for_publication("PropMS Service", service.name)
        service.reload()
        self.assertTrue(result["published"])
        self.assertEqual(service.publication_status, "Approved")
        self.assertEqual(service.published, 1)
        self.assertEqual(service.index_state, "index")
        self.assertEqual(service.approved_by, "Administrator")

        withdraw_publication("PropMS Service", service.name)
        service.reload()
        self.assertEqual(service.publication_status, "Draft")
        self.assertEqual(service.published, 0)
        self.assertEqual(service.index_state, "noindex")
        self.assertFalse(service.approved_by)

    def test_internal_relationships_only_expose_approved_pages(self):
        area = self._area("relationship-area")
        service = self._service("relationship-service")
        service.append("related_areas", {"area": area.name})
        service.save()
        area.append("related_services", {"service": service.name})
        area.save()

        approve_for_publication("PropMS Service", service.name)
        links = _published_relationships(area.related_services, "service", "PropMS Service", "title", "services")
        self.assertEqual(links, [{"title": service.title, "href": "/services/relationship-service"}])

    def test_explicit_canonical_must_use_configured_host_and_self_route(self):
        settings = frappe.get_doc("PropMS Website Settings")
        original = settings.seo_base_url
        settings.seo_base_url = "https://example.test"
        settings.save()
        try:
            area = self._area("canonical-area")
            service = self._service("canonical-service")
            service.append("related_areas", {"area": area.name})
            service.canonical_url = "https://other.test/services/canonical-service"
            service.save()
            with self.assertRaises(frappe.ValidationError):
                approve_for_publication("PropMS Service", service.name)

            service.canonical_url = "https://example.test/services/other-slug"
            service.save()
            with self.assertRaises(frappe.ValidationError):
                approve_for_publication("PropMS Service", service.name)
        finally:
            settings.seo_base_url = original
            settings.save()

    def _service(self, slug, substantive=True):
        body = self._body(f"service-{slug}") if substantive else "Short useful service copy."
        doc = frappe.get_doc({
            "doctype": "PropMS Service",
            "title": slug.replace("-", " ").title(),
            "slug": slug,
            "summary": "A clear property service for landlords who need reliable operational support and transparent local delivery.",
            "introduction": body,
            "benefits": body,
            "service_process": body,
            "suitability": body,
            "trust_content": body,
            "cta_title": "Discuss your property requirements",
            "cta_text": "Tell our team about the property, tenancy and support you need before deciding whether this service is suitable.",
            "cta_label": "Contact our team",
            "cta_url": "/#contact",
            "seo_title": "Reliable Property Management Service for London",
            "seo_description": "Understand how this property management service works, who it suits, what landlords can expect, and how local support is delivered across London.",
        }).insert()
        self.created.append((doc.doctype, doc.name))
        return doc

    def _area(self, slug, substantive=True):
        body = self._body(f"area-{slug}") if substantive else "Short local area copy."
        doc = frappe.get_doc({
            "doctype": "PropMS Area",
            "area_name": slug.replace("-", " ").title(),
            "slug": slug,
            "region": "London",
            "introduction": body,
            "property_context": body,
            "landlord_information": body,
            "coverage": body,
            "local_context": body,
            "cta_title": "Discuss a property in this area",
            "cta_text": "Share the property location and landlord priorities so our team can explain suitable services and practical local coverage.",
            "cta_label": "Contact our team",
            "cta_url": "/#contact",
            "seo_title": "Property Management and Landlord Support in London",
            "seo_description": "Explore practical property management coverage, landlord support, local housing context, and relevant services available for this London area.",
        }).insert()
        self.created.append((doc.doctype, doc.name))
        return doc

    @staticmethod
    def _body(seed):
        vocabulary = " ".join(f"{seed.replace('-', '')}term{i:03d}" for i in range(1, 151))
        return (
            "<p>Landlords need clear responsibilities, documented communication, practical maintenance coordination, tenancy awareness, "
            "reliable reporting, responsive support, compliance minded administration, local supplier knowledge, and transparent service boundaries. "
            f"This rehearsal content exercises the structured quality gate using deliberately varied vocabulary: {vocabulary}.</p>"
        )
