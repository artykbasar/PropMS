frappe.ui.form.on("Property Instruction", {
	refresh(frm) {
		if (frm.is_new() || !frappe.user.has_role("System Manager")) {
			return;
		}

		add_snapshot_action(
			frm,
			"Generate Map Snapshots",
			"propms.property_management_solution.doctype.property_instruction.property_instruction.generate_property_instruction_map_snapshots",
		);
		add_snapshot_action(
			frm,
			"Regenerate Map Snapshots",
			"propms.property_management_solution.doctype.property_instruction.property_instruction.regenerate_property_instruction_map_snapshots",
		);
		add_snapshot_action(
			frm,
			"Retry Failed Map Snapshots",
			"propms.property_management_solution.doctype.property_instruction.property_instruction.retry_failed_property_instruction_map_snapshots",
		);
	},
});

function add_snapshot_action(frm, label, method) {
	frm.add_custom_button(__(label), () => {
		frappe.call({
			method,
			args: { name: frm.doc.name },
			callback(response) {
				const result = response.message || {};
				if (result.queued) {
					frappe.show_alert({
						message: __("Queued {0} map snapshot job(s).", [result.affected_map_count || 0]),
						indicator: "green",
					});
				} else if (result.already_current) {
					frappe.show_alert({
						message: __("Current map snapshots are already up to date."),
						indicator: "blue",
					});
				} else if (result.no_maps) {
					frappe.show_alert({
						message: __("No custom Google Maps are available for snapshot generation."),
						indicator: "orange",
					});
				}
				frm.reload_doc();
			},
		});
	}, __("Map Snapshots"));
}
