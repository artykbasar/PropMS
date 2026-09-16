from propms.website_catalog import StructuredWebsitePage


class PropMSService(StructuredWebsitePage):
    route_prefix = "services"
    hub_label = "Services"
    title_field = "title"
    content_fields = ("summary", "introduction", "benefits", "service_process", "suitability", "trust_content")
    relationship_fields = (("related_services", "service"), ("related_areas", "area"))
    media_alt_pairs = (("hero_image", "hero_image_alt"),)
    publication_required_fields = content_fields + ("cta_title", "cta_text", "cta_label", "cta_url", "seo_title", "seo_description")
    website = StructuredWebsitePage.website.copy()
    website.template = "templates/website_v2/service.html"
