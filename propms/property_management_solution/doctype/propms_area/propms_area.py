from propms.website_catalog import StructuredWebsitePage


class PropMSArea(StructuredWebsitePage):
    route_prefix = "areas"
    hub_label = "Areas"
    title_field = "area_name"
    content_fields = ("introduction", "property_context", "landlord_information", "coverage", "local_context")
    relationship_fields = (("related_services", "service"), ("nearby_areas", "area"))
    media_alt_pairs = (("hero_image", "hero_image_alt"), ("local_media", "local_media_alt"))
    publication_required_fields = ("region",) + content_fields + ("cta_title", "cta_text", "cta_label", "cta_url", "seo_title", "seo_description")
    website = StructuredWebsitePage.website.copy()
    website.template = "templates/website_v2/area.html"
    website.page_title_field = "area_name"
