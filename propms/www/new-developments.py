from propms.website_routes import _apply_property_hub_context

no_cache = 1


def get_context(context):
    _apply_property_hub_context(context)
    return context
