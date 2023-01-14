# -*- coding: utf-8 -*-
# Copyright (c) 2018, Aakvatech and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
from frappe.utils.nestedset import NestedSet
import frappe


class Property(NestedSet):
    nsm_parent_field = "parent_property"

    def on_trash(self, allow_root_deletion=True):
        super().on_trash(allow_root_deletion)

    def validate(self):
        self.address_as_name()

    @frappe.whitelist()
    def address_as_name(self):
        if self.advanced_property_management == 1 and not self.name1:
            if self.type in ["Apartment (Flat)", "House"]:
                address_doc = frappe.get_doc("Address", self.address)
                self.name1 = address_doc.address_line1
                if address_doc.address_line2:
                    self.name1 = f"{address_doc.address_line1} {address_doc.address_line2}"
    


@frappe.whitelist()
def add_node():
    from frappe.desk.treeview import make_tree_args

    args = frappe.form_dict
    args = make_tree_args(**frappe.form_dict)

    if args["is_root"]:
        args["parent_property"] = None

    doc = frappe.get_doc(args)

    doc.save()
