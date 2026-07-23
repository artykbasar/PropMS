# Copyright (c) 2026, contributors

from urllib.parse import quote

from frappe.utils import get_url, nowdate
from frappe.website.router import get_pages

no_cache = 1
base_template_path = "www/sitemap.xml"
EXCLUDED_SITEMAP_DOCTYPES = {"Property Instruction"}


def get_context(context):
	"""Generate sitemap XML while excluding guest guide routes from discovery."""
	links = [
		{"loc": get_url(quote(page.name.encode("utf-8"))), "lastmod": nowdate()}
		for route, page in get_pages().items()
		if page.sitemap
	]

	links.extend(
		{
			"loc": get_url(quote((route or "").encode("utf-8"))),
			"lastmod": f"{data['modified']:%Y-%m-%d}",
		}
		for route, data in get_filtered_public_pages_from_doctypes().items()
	)

	return {"links": links}


def get_filtered_public_pages_from_doctypes():
	"""Return guest-view document routes except doctypes explicitly excluded from sitemap."""
	from frappe.www.sitemap import get_public_pages_from_doctypes

	routes = get_public_pages_from_doctypes()
	return {
		route: data
		for route, data in routes.items()
		if data.get("doctype") not in EXCLUDED_SITEMAP_DOCTYPES
	}
