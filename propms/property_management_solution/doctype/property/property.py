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
        self.status_as_common_area()
        self.automatic_group_node()

    def on_update(self):
        self.check_child_nodes()
        self.validate_rename()

    def validate_rename(self):
        if self.advanced_property_management == 1:
            if self.name != self.new_name:
                self.rename(self.new_name)
            self.reload()

    def check_child_nodes(self):
        if self.advanced_property_management == 1:
            if self.unit_children:
                save_status = False
                rentable_status = False
                for each_row in self.unit_children:
                    if each_row.rentable == 1:
                        rentable_status = True
                        if not each_row.property:
                            for each_child_node in self.get_children():
                                if each_child_node.room_name == each_row.room_name:
                                    each_row.property = each_child_node.name
                                    self.sync_parent_each_row_to_child(each_row, each_child_node)
                                    save_status = True
                            if not each_row.property:
                                new_doc = frappe.new_doc("Property")
                                new_doc.address = self.address
                                new_doc.company = self.company
                                new_doc.cost_center = self.cost_center
                                new_doc.type = each_row.unit_type
                                new_doc.rentable = each_row.rentable
                                new_doc.room = 1
                                new_doc.room_name = each_row.room_name
                                new_doc.parent_property = self.name
                                new_doc.rent = each_row.rent_price
                                new_doc.rent_uom = each_row.rent_uom
                                new_doc.security_deposit_period = each_row.security_deposit_period
                                new_doc.security_deposit = each_row.security_deposit
                                new_doc.address_as_name()
                                new_doc.save()
                                each_row.property = new_doc.name
                                save_status = True
                        else:
                            child_doc = frappe.get_doc("Property", each_row.property)
                            self.sync_parent_each_row_to_child(each_row, child_doc)
                if save_status:
                    self.save()
                    self.reload()
                if not rentable_status:
                    self.remove_all_child_nodes()
                else:
                    for each_child_node in self.get_children():
                        child_node_used = False
                        for each_row in self.unit_children:
                            if each_row.room_name == each_child_node.room_name:
                                child_node_used = True
                        if not child_node_used:
                            each_child_node.delete()
            else:
                self.remove_all_child_nodes()

    def sync_parent_each_row_to_child(self, each_row, child_doc):
        save_status = False
        if self.address != child_doc.address:
            child_doc.address = self.address
            child_doc.address_as_name()
            save_status = True
        if self.company != child_doc.company:
            child_doc.company = self.company
            save_status = True
        if self.cost_center != child_doc.cost_center:
            child_doc.cost_center = self.cost_center
            save_status = True
        if each_row.unit_type != child_doc.type:
            child_doc.type = each_row.unit_type
            child_doc.address_as_name()
            save_status = True
        if each_row.room_name != child_doc.room_name:
            child_doc.room_name = each_row.room_name
            child_doc.address_as_name()
            save_status = True
        if each_row.rent_price != child_doc.rent:
            child_doc.rent = each_row.rent_price
            save_status = True
        if each_row.rent_uom != child_doc.rent_uom:
            child_doc.rent_uom = each_row.rent_uom
            save_status = True
        if each_row.security_deposit_period != child_doc.security_deposit_period:
            child_doc.security_deposit_period = each_row.security_deposit_period
            save_status = True
        if each_row.security_deposit != each_row.security_deposit:
            child_doc.security_deposit = each_row.security_deposit
            save_status = True
        if save_status:
            child_doc.save()
                    
    def remove_all_child_nodes(self):
        for each_child_node in self.get_children():
            each_child_node.delete()

    @frappe.whitelist()
    def address_as_name(self):
        if self.advanced_property_management == 1:
            if self.type and self.address:
                type_doc = frappe.get_doc("Unit Type", self.type)
                address_doc = frappe.get_doc("Address", self.address)
                if not type_doc.room:
                    if self.room_name:
                        self.room_name = None
                    if address_doc.address_line2:
                        self.name1 = f"{address_doc.address_line1} {address_doc.address_line2}"
                    else:
                        self.name1 = address_doc.address_line1
                elif self.room_name:
                    if address_doc.address_line2:
                        self.name1 = f"{address_doc.address_line1} {address_doc.address_line2} Room {self.room_name}"
                    else:
                        self.name1 = f"{address_doc.address_line1} Room {self.room_name}"
                else:
                    self.name1 = None
                    self.room_name = None
            self.new_name = self.name1

    @frappe.whitelist()
    def status_as_common_area(self):
        if self.advanced_property_management == 1 and self.rentable == 0:
            self.status = "Common Area (Not for lease)"
        elif self.advanced_property_management == 1 and self.rentable == 1 and self.status == "Common Area (Not for lease)":
            self.status = "Available"

    def automatic_group_node(self):
        if self.advanced_property_management == 1:
            rentable = 0
            for each_child in self.unit_children:
                rentable += each_child.rentable
            if rentable > 0:
                self.is_group = 1
            else:
                self.is_group = 0


@frappe.whitelist()
def add_node():
    from frappe.desk.treeview import make_tree_args

    args = frappe.form_dict
    args = make_tree_args(**frappe.form_dict)

    if args["is_root"]:
        args["parent_property"] = None

    doc = frappe.get_doc(args)

    doc.save()
