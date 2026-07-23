frappe.ui.form.on("Property Instruction", {
	refresh(frm) {
		if (frm.is_new()) {
			return;
		}

		if (!frm.perm[0] || !frm.perm[0].write) {
			return;
		}

		frm.add_custom_button(__("Generate Translation"), () => {
			frappe.prompt(
				[
					{
						fieldname: "language_code",
						fieldtype: "Data",
						label: __("Language Code"),
						reqd: 1,
						description: __("Use an ISO language code such as es or fr."),
					},
					{
						fieldname: "language_name",
						fieldtype: "Data",
						label: __("Language Name"),
					},
				],
				(values) => {
					frappe.call({
						method: "propms.property_management_solution.doctype.property_instruction.property_instruction.generate_translation",
						args: {
							property_instruction: frm.doc.name,
							language_code: values.language_code,
							language_name: values.language_name,
						},
						freeze: true,
						callback: (r) => {
							if (!r.exc) {
								frappe.show_alert({
									message: __("Translation draft created"),
									indicator: "green",
								});
								frm.reload_doc();
							}
						},
					});
				},
				__("Generate Translation"),
				__("Generate")
			);
		});
	},
});
