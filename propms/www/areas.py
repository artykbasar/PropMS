from propms.website_catalog import get_hub_context


sitemap = 1

def get_context(context):
    return get_hub_context(
        context,
        doctype="PropMS Area",
        title_field="area_name",
        hub="areas",
        title="Areas",
        description="Explore the London areas we cover, with local property context, landlord information and relevant services.",
    )
