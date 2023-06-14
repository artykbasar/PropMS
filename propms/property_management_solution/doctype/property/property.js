// Copyright (c) 2018, Aakvatech and contributors
// For license information, please see license.txt

frappe.ui.form.on('Property', {
	refresh: function (frm) {
		security_deposit_toggle_editable_all(frm)
	},
	validate: function (frm) {
		cost_center_validation(frm)
	},
	setup: function (frm) {
		frm.set_query("cost_center", function () {
			return {
				"filters": {
					"company": frm.doc.company,
				},
			};
		});

		if (frm.doc.advanced_property_management == 1) {
			frm.set_query("type", function (frm) {
				return {
					filters: {
						unit_type: ['like', '%Rent%']
					}
				}
			})
		}

		frm.set_query("rent_uom", "unit_children", function () {
			return {
				filters: {
					uom_name: ['in', ["Day", "Week", "Month", "Year"]]
				}
			}

		})
		frm.set_query("rent_uom", function () {
			return {
				filters: {
					uom_name: ['in', ["Day", "Week", "Month", "Year"]]
				}
			}

		})

		frm.set_query("property", "unit_children", function () {
			return {
				filters: {
					parent_property: frm.doc.name1
				}
			}
		})
		frm.set_query('security_deposit_period', "unit_children", () => {
			return {
				query: 'propms.property_management_solution.doctype.property.property.security_deposit_period_filter'
			}
		})

		frm.set_query('security_deposit_period', () => {
			return {
				query: 'propms.property_management_solution.doctype.property.property.security_deposit_period_filter'
			}
		})

		frm.set_query("parent_property", { is_group: 1 });
	},
	onload_post_render: function (frm) {

		child_node_fetcher(frm)

	},
	onload: function (frm) {
	},
	company: function (frm) {
		// frm.set_value("cost_center", "");
	},
	address: function (frm) {
		name_fetcher(frm)

	},
	room_name: function (frm) {
		name_fetcher(frm)

	},
	type: function (frm) {
		name_fetcher(frm)

	},
	after_save: function (frm) {
		if (frm.doc.name != frm.doc.name1) {
			frappe.set_route('Form', frm.doc.doctype, frm.doc.name1)
		}
		child_node_fetcher(frm)
	},
	unit_children: function (frm) {
		frm.refresh_field('unit_children')
	},
	rent: function (frm) {
		security_deposit_amount_fetcher(frm)
	},
	rent_uom: function (frm) {
		security_deposit_amount_fetcher(frm)
	},
	security_deposit_period: function (frm) {
		security_deposit_amount_fetcher(frm)
	}
});



frappe.ui.form.on('Unit Characteristics', {
	unit_type: function (frm, cdt, cdn) {
		read_only_setter_rows(frm, cdt, cdn)
	},
	security_deposit_period: function (frm, cdt, cdn) {
		security_deposit_toggle_editable(frm, cdt, cdn)
		security_deposit_amount_fetcher(frm, cdt, cdn)
	},
	rent_price: function (frm, cdt, cdn) {
		security_deposit_amount_fetcher(frm, cdt, cdn)
	},
	rent_uom: function (frm, cdt, cdn) {
		security_deposit_amount_fetcher(frm, cdt, cdn)
	}
});

function read_only_setter_rows(frm, cdt, cdn) {
	if (frm.doc.advanced_property_management == 1) {
		var row = locals[cdt][cdn]
		var rentable = row.rentable
		fields = ["property", 'room_name', 'rent_price', 'rent_uom', 'security_deposit_period']
		if (rentable == 0) {
			fields.forEach(fieldname => {
				locals[cdt][cdn][fieldname] = undefined
			});
		}
		fields.forEach(fieldname => {
			frm.get_field("unit_children").grid.get_row(cdn).toggle_editable(fieldname, rentable)
			if ((rentable == 1) && (fieldname == "rent_uom" || fieldname == "security_deposit_period")) {
				if (!locals[cdt][cdn][fieldname]) {
					if (fieldname == "rent_uom") {
						frappe.db.get_single_value('Property Management Settings', 'default_rent_uom')
							.then(r => {
								locals[cdt][cdn][fieldname] = r
								frm.refresh()
							})
					} else if (fieldname == "security_deposit_period") {
						frappe.db.get_single_value('Property Management Settings', 'default_security_deposit_period')
							.then(r => {
								locals[cdt][cdn][fieldname] = r
								frm.refresh()
							})
					}
				}
			}
		});

		frm.get_field("unit_children").grid.get_row(cdn).toggle_reqd('room_name', rentable)

		frm.refresh()
	}
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


function cost_center_validation(frm) {
	if (frm.doc.advanced_property_management == 1 &&
		frm.doc.address && (frm.doc.cost_center == undefined || frm.doc.cost_center == '')) {
		return frm.call({
			method: "cost_center_validation",
			doc: frm.doc,
			freeze: false,
			callback: function (r) {
				if (r.docs[0].cost_center) {
					frm.set_value("cost_center", r.docs[0].cost_center)
				}
			}
		});
	}
}



function child_node_fetcher(frm) {
	if (frm.doc.advanced_property_management == 1) {
		return frm.call({
			method: "show_child_nodes_as_row",
			doc: frm.doc,
			freeze: false,
			callback: function (r) {
				frm.doc = r.docs[0]
				frm.refresh()
			}
		})

	}
}

function security_deposit_toggle_editable(frm, cdt, cdn) {
	var row = locals[cdt][cdn]
	if (row.security_deposit_period == "Custom") {
		frm.get_field("unit_children").grid.get_row(cdn).toggle_editable("security_deposit", 1)
	} else {
		frm.get_field("unit_children").grid.get_row(cdn).toggle_editable("security_deposit", 0)
	}
}

function security_deposit_toggle_editable_all(frm) {
	frm.get_field("unit_children").grid.grid_rows.forEach(each => {
		if (each.doc.rentable) {
			if (each.doc.security_deposit_period == "Custom") {
				cur_frm.get_field("unit_children").grid.get_row(each.doc.name).toggle_editable("security_deposit", 1)
			} else {
				cur_frm.get_field("unit_children").grid.get_row(each.doc.name).toggle_editable("security_deposit", 0)
			}
		}
	});
}

function security_deposit_amount_fetcher(frm, cdt, cdn) {
	if (frm.doc.advanced_property_management == 1) {
		if (cdt != undefined && cdn != undefined) {
			var row = locals[cdt][cdn]
			var rent_price = row.rent_price
			var rent_uom = row.rent_uom
			var security_deposit_period = row.security_deposit_period
		} else {
			var rent_price = frm.doc.rent
			var rent_uom = frm.doc.rent_uom
			var security_deposit_period = frm.doc.security_deposit_period
		}
		if (rent_price && rent_uom && security_deposit_period != "Custom" && security_deposit_period) {
			return frm.call({
				method: "security_deposit_amount_setter",
				doc: frm.doc,
				args: {
					"rent_price": rent_price,
					"rent_uom": rent_uom,
					"security_deposit_period": security_deposit_period,
					"call": true
				},
				freeze: false,
				callback: function (r) {
					if (row) {
						row['security_deposit'] = r.message
						frm.refresh()
					} else if (row == undefined) {
						cur_frm.set_value("security_deposit", r.message)
					}
				}
			})
		} else {
			if (row) {
				row['security_deposit'] = 0
				frm.refresh()
			} else if (row == undefined) {
				cur_frm.set_value("security_deposit", 0)
			}
		}

	}

}

function status_fetcher(frm) {
	if (frm.doc.advanced_property_management == 1 && frm.doc.type) {
		return frm.call({
			method: "status_as_common_area",
			doc: frm.doc,
			freeze: false,
			callback: function (r) {
				if (r.docs[0].status) {
					frm.set_value("status", r.docs[0].status)
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

