frappe.ui.form.on("PropMS Area", {
  refresh(frm) {
    if (frm.is_new()) return;
    const action = frm.doc.published ? "withdraw_publication" : "approve_for_publication";
    const label = frm.doc.published ? __("Withdraw publication") : __("Approve and publish");
    frm.add_custom_button(label, () => {
      frappe.call({
        method: `propms.website_catalog.${action}`,
        args: { doctype: frm.doctype, name: frm.doc.name },
        callback: () => frm.reload_doc(),
      });
    }, __("Publication"));
  },
});
