from propms.website_catalog import get_hub_context


sitemap = 1

def get_context(context):
    return get_hub_context(
        context,
        doctype="PropMS Service",
        title_field="title",
        hub="services",
        title="Services",
        description="Explore our property services, each with clear suitability, process, benefits and local coverage information.",
    )
