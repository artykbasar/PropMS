// Copyright (c) 2019, Aakvatech and contributors
// For license information, please see license.txt

frappe.ui.form.on('Property Management Settings', {
    setup: function (frm) {

        frm.set_query("default_rent_uom", function () {
            return {
                filters: {
                    uom_name: ['in', ["Day", "Week", "Month", "Year"]]
                }
            }

        })

        frm.set_query('default_security_deposit_period', () => {
            return {
                query: 'propms.property_management_solution.doctype.property.property.security_deposit_period_filter'
            }
        })
    }
});
