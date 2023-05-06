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

});

function name_fetcher(frm) {
	return frm.call({
		method: "naming_unit_type",
		doc: frm.doc,
		freeze: false,
		callback: function (r) {
			if (r.docs[0].unit_type) {
				frm.set_value("unit_type", r.docs[0].unit_type)
			}
		}
	});
}