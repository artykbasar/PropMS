
import frappe


@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def or_filter_query(doctype, txt, searchfield, start, page_len, filters=None, as_dict=False):

	if txt:
		txt = {
			"name": ['like', f"%{txt}%"]
		}

	return frappe.db.get_list(
		doctype, 
		filters=txt,
		or_filters=filters, 
		fields=searchfield, 
		start=start, 
		page_length=page_len, 
		as_list= not as_dict)


