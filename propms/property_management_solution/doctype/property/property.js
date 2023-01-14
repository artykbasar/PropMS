// Copyright (c) 2018, Aakvatech and contributors
// For license information, please see license.txt

frappe.ui.form.on('Property', {
	refresh: function (frm) {

	},
	setup: function (frm) {
		frm.set_query("cost_center", function () {
			return {
				"filters": {
					"company": frm.doc.company,
				},
			};
		});

		frm.set_query("parent_property", { is_group: 1 });
	},
	company: function (frm) {
		frm.set_value("cost_center", "");
	},
	address: function (frm) {
		name_fetcher(frm)

	},
	type: function (frm) {
		name_fetcher(frm)

	}
});



frappe.ui.form.on('Unit Characteristics', {
	unit_type: function (frm, cdt, cdn) {
		read_only_setter_rows(frm)
	},
});

function read_only_setter_rows(frm) {
	var rows = frm.get_field('unit_children').grid.grid_rows
	if (rows) {
		rows.forEach(function (row) {
			row.columns_list.forEach(function (column) {
				if (column.df.fieldname !== 'unit_type' || column.df.fieldname !== 'rentable') {
					row.toggle_editable(column.df.fieldname, row.on_grid_fields_dict.rentable.value == 1);
				}
				if (!(row.on_grid_fields_dict.rentable.value == 1)) {
					row.get_field("rent_price").set_value()
					row.get_field("rent_cycle").set_value()
					row.get_field("property").set_value()
					row.get_field("room_name").set_value()
				}
			});

		})
	}
}

function read_only_setter_row(frm, cdt, cdn) {
	var row = frm.get_field('unit_children').grid.get_row(cdn),
		read_only = row.on_grid_fields_dict.rentable.value == 1
	row.columns_list.forEach(function (column) {
		if (read_only) {
			if (column.df.fieldname !== 'unit_type') {
				row.toggle_editable(column.df.fieldname, read_only);
			}
		} else {
			row.get_field("rent_price").set_value()
			row.get_field("rent_cycle").set_value()
			row.get_field("property").set_value()
		}
	});
}

function name_fetcher(frm) {
	if (frm.doc.advanced_property_management == 1 &&
		frm.doc.address && frm.doc.type) {
		return frm.call({
			method: "address_as_name",
			doc: frm.doc,
			freeze: false,
			callback: function (r) {
				if (r.docs[0].name1) {
					frm.set_value("name1", r.docs[0].name1)
				}
			}
		});
	}
}

frappe.ui.form.on('Property Meter Reading', {
	meter_number: function (frm, cdt, cdn) {
		var property_doc = locals[cur_frm.doc.doctype][cur_frm.doc.name];
		var meter_doc = locals[cdt][cdn];
		if (meter_doc.meter_number != "") {
			$.each(property_doc.property_meter_reading, function (i, d) {
				if (d.name != meter_doc.name && meter_doc.meter_type == d.meter_type && d.status == "Active") {
					var msg = "Another Active Meter of type " + meter_doc.meter_type + " Is Already allocated. Please de-activate it before adding a new meter of same type."
					frappe.model.set_value(cdt, cdn, "meter_number", '')
					frappe.throw(msg)
				}
			})
		}
	},
	status: function (frm, cdt, cdn) {
		var property_doc = locals[cur_frm.doc.doctype][cur_frm.doc.name];
		var meter_doc = locals[cdt][cdn];
		if (meter_doc.meter_number != "") {
			$.each(property_doc.property_meter_reading, function (i, d) {
				if (d.name != meter_doc.name && meter_doc.meter_type == d.meter_type && d.status == "Active") {
					var msg = "Another Active Meter of type " + meter_doc.meter_type + " Is Already allocated. Please de-activate it before adding a new meter of same type."
					frappe.model.set_value(cdt, cdn, "status", '')
					frappe.throw(msg)
				}
			})
		}
	}
})

