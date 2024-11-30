// Copyright (c) 2018, Aakvatech and contributors
// For license information, please see license.txt

frappe.ui.form.on('Property', {
	refresh: function (frm) {
		
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
					query: "propms.controllers.queries.or_filter_query",
					filters: {
						for_sale: ['=', 1],
						rentable: ['=', 1],
						rented: ['=', 1],
						development_project: ['=', 1]
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
		
		frm.get_field('unit_children').grid.header_row.__proto__.set_dependant_property = function set_dependant_property(df) {
			if (
				df.mandatory_depends_on
			) {
				if (this.evaluate_depends_on_value(df.mandatory_depends_on)) {
					df.reqd = 1;
				} else {
					df.reqd = 0;
				}
			}
	
			if (
				df.read_only_depends_on
			) {
				if (this.evaluate_depends_on_value(df.read_only_depends_on)) {
					df.read_only = 1;
				} else {
					df.read_only = 0;
				}					
			}
			return df
		}
		frm.get_field('unit_children').grid.header_row.__proto__.hide_form = function hide_form() {
			if (frappe.utils.is_xs()) {
				$(this.grid.form_grid).css("min-width", "738px");
				$(this.grid.form_grid).css("position", "relative");
			}
			frappe.dom.unfreeze();
			this.row.toggle(true);
			if (!frappe.dom.is_element_in_modal(this.row)) {
				frappe.utils.scroll_to(this.row, true, 15);
			}
			this.refresh();
			if (cur_frm) cur_frm.cur_grid = null;
			this.wrapper.removeClass("grid-row-open");
			this.grid.reset_grid()
		}
		frm.get_field('unit_children').grid.header_row.__proto__.make_control = function make_control(column) {
			if (column.field) return;
			column.df = this.set_dependant_property(column.df)
			var me = this,
				parent = column.field_area,
				df = column.df;
	
			var field = frappe.ui.form.make_control({
				df: df,
				parent: parent,
				only_input: true,
				with_link_btn: true,
				doc: this.doc,
				doctype: this.doc.doctype,
				docname: this.doc.name,
				frm: this.grid.frm,
				grid: this.grid,
				grid_row: this,
				value: this.doc[df.fieldname],
			});
	
			// sync get_query
			field.get_query = this.grid.get_field(df.fieldname).get_query;
	
			if (!field.df.onchange_modified) {
				var field_on_change_function = field.df.onchange;
				field.df.onchange = (e) => {
					field_on_change_function && field_on_change_function(e);
					this.refresh_field(field.df.fieldname);
				};
	
				field.df.onchange_modified = true;
			}
	
			field.refresh();
			if (field.$input) {
				field.$input
					.addClass("input-sm")
					.attr("data-col-idx", column.column_index)
					.attr("placeholder", __(df.placeholder || df.label));
				// flag list input
				if (this.columns_list && this.columns_list.slice(-1)[0] === column) {
					field.$input.attr("data-last-input", 1);
				}
			}
	
			this.set_arrow_keys(field);
			column.field = field;
			this.on_grid_fields_dict[df.fieldname] = field;
			this.on_grid_fields.push(field);
		}


	},
	onload: function (frm) {
		show_relevant_table_columns(frm, 'unit_children', unit_children_column_list(frm))
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

const unit_children_columns = {
	rentable: ["unit_type", "property", 'room_name', 'rent_price', 'rent_uom', 'security_deposit_period', 'security_deposit'],
	new_development: ["unit_type", "property"]
}


frappe.ui.form.on('Unit Characteristics', {

	unit_type: function (frm, cdt, cdn) {
		show_relevant_table_columns(frm, 'unit_children', unit_children_column_list(frm))
	},
	unit_children_remove: function (frm, cdt, cdn) {
		show_relevant_table_columns(frm, 'unit_children', unit_children_column_list(frm))
	},
	security_deposit_period: function (frm, cdt, cdn) {
		security_deposit_amount_fetcher(frm, cdt, cdn)
	},
	rent_price: function (frm, cdt, cdn) {
		security_deposit_amount_fetcher(frm, cdt, cdn)
	},
	rent_uom: function (frm, cdt, cdn) {
		security_deposit_amount_fetcher(frm, cdt, cdn)
	}
});

function unit_children_column_list(frm) {
	let column_list = []
	if (frm.doc.advanced_property_management == 1) {
		if (frm.get_field('unit_children').grid.data){
			frm.get_field("unit_children").grid.data.forEach((row) => {
				if (row.rentable) {
					column_list = [...new Set([...column_list, ...unit_children_columns['rentable']])]
				}
				if (row.new_development) {
					column_list = [...new Set([...column_list, ...unit_children_columns['new_development']])]
				}
			})
		}
	}
	return column_list
}

function show_relevant_table_columns(frm, table_field_name, selected_fields=[]) {
	if (frm.doc.advanced_property_management == 1) {
		let child_table = frm.get_field(table_field_name)
		let value = {}
		let selected_columns_for_grid = [];
		if (selected_fields) {
			selected_fields.forEach((selected_column) => {
				let docfield = frappe.meta.get_docfield(child_table.grid.doctype, selected_column);
				selected_columns_for_grid.push({
						fieldname: selected_column,
						columns: docfield.columns || docfield.colsize,
					});
				});
		}
		value[child_table.grid.doctype] = selected_columns_for_grid;
		frappe.model.user_settings[frm.doctype]['GridView'] = value
		if (!cur_frm.cur_grid) {
			child_table.grid.reset_grid()
		}
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
				show_relevant_table_columns(frm, 'unit_children', unit_children_column_list(frm))
			}
		})

	}
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

