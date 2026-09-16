// Copyright (c) 2018, Aakvatech and contributors
// For license information, please see license.txt

frappe.ui.form.on('Unit Type', {

	after_save: function (frm) {
		if (frm.doc.name != frm.doc.unit_type) {
			frappe.set_route('Form', frm.doc.doctype, frm.doc.unit_type)
		}
	},
	refresh: function (frm) {

	},
	balcony: function (frm) {
		name_fetcher(frm)
	},
	showerbath: function (frm) {
		name_fetcher(frm)
	},
	toilet: function (frm) {
		name_fetcher(frm)
	},
	rentable: function (frm) {
		name_fetcher(frm)
	},
	rented: function (frm) {
		name_fetcher(frm)
	},
	for_sale: function (frm) {
		name_fetcher(frm)
	},
	new_development: function (frm) {
		name_fetcher(frm)
	},
	development_project: function (frm) {
		name_fetcher(frm)
	},
	room: function (frm) {
		name_fetcher(frm)
	},
	

});

function name_fetcher(frm) {
	return frm.call({
		method: "naming_unit_type",
		doc: frm.doc,
		freeze: false,
		callback: function (r) {
			if (r.docs[0].unit_type) {
				frm.set_value("unit_type", r.docs[0].unit_type)
				if (r.docs[0].development_project == 1) {
					if (r.docs[0].rentable == 1) {
						frm.set_value("rentable", 0)
					}
					if (r.docs[0].rented == 1) {
						frm.set_value("rented", 0)
					}
					if (r.docs[0].for_sale == 1) {
						frm.set_value("for_sale", 0)
					}
					if (r.docs[0].room == 1) {
						frm.set_value("room", 0)
					}
				}
				if (r.docs[0].for_sale == 0 && r.docs[0].new_development == 1) {
					frm.set_value("new_development", 0)
				}
				if (r.docs[0].room == 0 && r.docs[0].balcony == 1) {
					frm.set_value("balcony", 0)
				}
				if (r.docs[0].room == 0 && r.docs[0].showerbath == 1) {
					frm.set_value("showerbath", 0)
				}
				if (r.docs[0].room == 0 && r.docs[0].toilet == 1) {
					frm.set_value("toilet", 0)
				}
			}
		}
	});
}
