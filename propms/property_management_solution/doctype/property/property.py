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
        self.name_validation()
        self.cost_center_validation()
        self.status_as_common_area()
        self.automatic_group_node()
        self.check_child_nodes()
        self.default_value_fetcher()
        self.security_deposit_amount_setter()

    def on_update(self):
        self.validate_rename()

    def validate_rename(self):
        if self.advanced_property_management == 1:
            if self.name != self.new_name:
                self.rename(self.new_name)
            self.reload()

    def check_child_nodes(self):
        if self.advanced_property_management == 1:
            if self.unit_children:
                child_status = False
                cleaned_rows = []
                for index, each_row in enumerate(self.unit_children):
                    if each_row.rentable == 1 or each_row.for_sale == 1:
                        if each_row.rentable == 1:
                            child_status = True
                        if each_row.for_sale == 1:
                            child_status = True
                        if not each_row.property:
                            for each_child_node in self.get_children():
                                if each_row.new_development == 0 and each_child_node.room_name == each_row.room_name:
                                    each_row.property = each_child_node.name
                                    self.sync_parent_each_row_to_child(each_row, each_child_node)
                            if not each_row.property:
                                new_doc = frappe.new_doc("Property")
                                new_doc.address = self.address
                                new_doc.company = self.company
                                new_doc.cost_center = self.cost_center
                                new_doc.type = each_row.unit_type
                                new_doc.rentable = each_row.rentable
                                new_doc.for_sale = each_row.for_sale
                                new_doc.new_development = each_row.new_development
                                new_doc.facing = each_row.facing
                                new_doc.publish_online = each_row.publish_online
                                new_doc.web_name = each_row.web_name
                                if each_row.rentable == 1:
                                    new_doc.room = 1
                                    new_doc.room_name = each_row.room_name
                                    new_doc.rent = each_row.rent_price
                                    new_doc.rent_uom = each_row.rent_uom
                                    new_doc.security_deposit_period = each_row.security_deposit_period
                                    new_doc.security_deposit = each_row.security_deposit
                                new_doc.parent_property = self.name
                                new_doc.name_validation()
                                new_doc.save()
                                each_row.property = new_doc.name
                        else:
                            child_doc = frappe.get_doc("Property", each_row.property)
                            self.sync_parent_each_row_to_child(each_row, child_doc)
                    else:
                        cleaned_rows.append(each_row)
                if not child_status:
                    self.remove_all_child_nodes()
                else:
                    for each_child_node in self.get_children():
                        child_node_used = False
                        for each_row in self.unit_children:
                            if each_row.room_name == each_child_node.room_name:
                                child_node_used = True
                            if each_row.for_sale == 1 and each_row.new_development == 1 and each_row.property == each_child_node.name:
                                child_node_used = True
                        if not child_node_used:
                            each_child_node.delete()
                    
                    self.unit_children = cleaned_rows
                        
            else:
                self.remove_all_child_nodes()

    def sync_parent_each_row_to_child(self, each_row, child_doc):
        save_status = False
        parent_to_child_field_list = ['address', 'company', 'cost_center']
        for each_field in parent_to_child_field_list:
            if self.__dict__[each_field] != child_doc.__dict__[each_field]:
                child_doc.__dict__[each_field] = self.__dict__[each_field]
                child_doc.name_validation()
                save_status = True
        row_to_child_docfield_list = [
            {"row_field_name": "unit_type", "child_docfield_name": "type"},
            {"row_field_name": "room_name", "child_docfield_name": "room_name"},
            {"row_field_name": "rent_price", "child_docfield_name": "rent"},
            {"row_field_name": "rent_uom", "child_docfield_name": "rent_uom"},
            {"row_field_name": "security_deposit_period", "child_docfield_name": "security_deposit_period"},
            {"row_field_name": "for_sale", "child_docfield_name": "for_sale"},
            {"row_field_name": "new_development", "child_docfield_name": "new_development"},
            {"row_field_name": "facing", "child_docfield_name": "facing"},
            {"row_field_name": "web_name", "child_docfield_name": "web_name"},
            {"row_field_name": "publish_online", "child_docfield_name": "publish_online"},
            {"row_field_name": "security_deposit", "child_docfield_name": "security_deposit"}
        ]
        for each_row_field in row_to_child_docfield_list:
            if each_row.__dict__[each_row_field["row_field_name"]] != child_doc.__dict__[each_row_field["child_docfield_name"]]:
                child_doc.__dict__[each_row_field["child_docfield_name"]] = each_row.__dict__[each_row_field["row_field_name"]]
                child_doc.name_validation()
                save_status = True
        if save_status:
            child_doc.save()
                    
    def remove_all_child_nodes(self):
        if self.advanced_property_management == 1:
            for each_child_node in self.get_children():
                each_child_node.delete()
            

    @frappe.whitelist()
    def security_deposit_amount_setter(self, rent_price=None, rent_uom=None, security_deposit_period=None, call=None):
        if self.advanced_property_management == 1:
            if not rent_price:
                rent_price = self.rent
            if not rent_uom:
                rent_uom = self.rent_uom
            if not security_deposit_period:
                security_deposit_period = self.security_deposit_period
            if rent_price and rent_uom and (security_deposit_period != "Custom" or not security_deposit_period):
                uom_conversion_factor_weekly = frappe.db.get_value(
                    "UOM Conversion Factor",
                    {"from_uom": "Week", 
                        "to_uom": rent_uom,
                        "category": "Time"},
                    "value")
                weekly_rent_price = rent_price * uom_conversion_factor_weekly
                uom_conversion_factor_rent = frappe.db.get_value(
                    "UOM Conversion Factor",
                    {"from_uom": "Week", 
                        "to_uom": security_deposit_period,
                        "category": "Rent"},
                    "value")
                security_deposit_amount = weekly_rent_price * uom_conversion_factor_rent
                if call:
                    return security_deposit_amount
                else:
                    self.security_deposit = security_deposit_amount
            else:
                self.security_deposit = 0

    @frappe.whitelist()
    def default_value_fetcher(self, call=False):
        if self.advanced_property_management == 1:
            return_value = {"default_rent_uom": frappe.db.get_single_value('Property Management Settings', 'default_rent_uom'),
                            "default_security_deposit_period": frappe.db.get_single_value('Property Management Settings', 'default_security_deposit_period')}
            if not call:
                if not self.rent_uom and self.rentable:
                    self.rent_uom = return_value["default_rent_uom"]
                if not self.security_deposit_period and self.rentable:
                    self.security_deposit_period = return_value["default_security_deposit_period"]
            else:
                return return_value

    @frappe.whitelist()
    def name_validation(self):
        if self.advanced_property_management == 1:
            if self.type:
                type_doc = frappe.get_doc("Unit Type", self.type)
                if self.address and not self.new_development:
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
                elif self.new_development and self.parent_property:
                    if self.facing:
                        self.name1 = f"{self.parent_property} {type_doc.name_without_tags()} Facing {self.facing}"
                    else:
                        self.name1 = f"{self.parent_property} {type_doc.name_without_tags()}"
            self.new_name = self.name1

    @frappe.whitelist()
    def status_as_common_area(self):
        if self.advanced_property_management == 1 and self.rentable == 0 and self.for_sale == 0:
            self.status = "Common Area (Not for sale/lease)"
        elif self.advanced_property_management == 1 and (self.rentable == 1 or self.for_sale == 1) and self.status == "Common Area (Not for sale/lease)":
            self.status = "Available"

    @frappe.whitelist()
    def cost_center_validation(self):
        if self.advanced_property_management == 1:
            if self.address and self.company and not self.cost_center:
                address_doc = frappe.get_doc("Address", self.address)
                if address_doc.address_line2:
                    cost_center_name = f"{address_doc.address_line1} {address_doc.address_line2}"
                else:
                    cost_center_name = address_doc.address_line1
                cost_center_doc_name = frappe.db.get_value("Cost Center", 
                                                        {"cost_center_name": cost_center_name, 
                                                            "company": self.company})
                if cost_center_doc_name:
                    self.cost_center = cost_center_doc_name
                else:
                    parent_cost_center_doc_name = frappe.db.get_value("Cost Center", 
                                                                    {"cost_center_name": self.company, 
                                                                    "company": self.company})
                    new_cost_center = frappe.new_doc("Cost Center")
                    new_cost_center.cost_center_name = cost_center_name
                    new_cost_center.company = self.company
                    new_cost_center.parent_cost_center = parent_cost_center_doc_name
                    new_cost_center.save()
                    self.cost_center = new_cost_center.name


    @frappe.whitelist()
    def show_child_nodes_as_row(self):
        new_rows = self.get_children()
        if new_rows:
            for new_row in new_rows:
                self.append("unit_children", {
                    "unit_type": new_row.type,
                    "property": new_row.name,
                    "room_name": new_row.room_name,
                    "rent_price": new_row.rent,
                    "rent_uom": new_row.rent_uom,
                    "security_deposit_period": new_row.security_deposit_period,
                    "security_deposit": new_row.security_deposit,
                    "rentable": new_row.rentable,
                    "for_sale": new_row.for_sale,
                    "new_development": new_row.new_development,
                    "facing": new_row.facing,
                    "publish_online": new_row.publish_online,
                    "web_name": new_row.web_name
                })

    def automatic_group_node(self):
        if self.advanced_property_management == 1:
            group_status = 0
            for each_child in self.unit_children:
                group_status += each_child.rentable
                group_status += each_child.for_sale
            if group_status > 0:
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

@frappe.whitelist()
def security_deposit_period_filter(self, txt, searchfield, start, page_len, filters):
    # print(self, txt, searchfield, start, page_len, filters)
    filters = {'category': 'Rent'}
    if txt:
        filters['to_uom'] = ['like', f'%{txt}%']

    return frappe.db.get_list('UOM Conversion Factor',
                        filters=filters,
                        fields=['to_uom'],
                        start=start,
                        page_length=page_len,
                        as_list=True
                        )

