# -*- coding: utf-8 -*-
# Copyright (c) 2019, Aakvatech and contributors
# For license information, please see license.txt
from __future__ import unicode_literals
from frappe.model.document import Document
from frappe.custom.doctype.property_setter.property_setter import make_property_setter
import frappe


class PropertyManagementSettings(Document):
    def validate(self):
        self.advanced_property_management_setter()
        self.customize_unit_type_doctype()
        self.make_address_entry_quick()

    def advanced_property_management_setter(self):
        make_property_setter(
            doctype="Property",
            fieldname="advanced_property_management",
            property="default",
            value=self.advanced_property_management,
            property_type="Small Text"
        )
        make_property_setter(
            doctype="Property",
            fieldname="advanced_property_management",
            property="hidden",
            value=0 if self.advanced_property_management == 1 else 1,
            property_type="Check"
        )

    def customize_unit_type_doctype(self):
        cus_doc = frappe.get_single("Customize Form")
        cus_doc.doc_type = "Unit Type"
        cus_doc.fetch_to_customize()
        new_cus_doc_field_list = []
        for row in cus_doc.fields:
            if row.fieldname in ["rentable", "room", "balcony", "showerbath", "toilet", "rented"]:
                row.hidden = 0 if self.advanced_property_management == 1 else 1
                row.in_list_view = self.advanced_property_management
                row.in_standard_filter = self.advanced_property_management
            new_cus_doc_field_list.append(row)
        cus_doc.fields = new_cus_doc_field_list
        cus_doc.save_customization()

    def make_address_entry_quick(self):
        cus_doc = frappe.get_single("Customize Form")
        cus_doc.doc_type = "Address"
        cus_doc.fetch_to_customize()
        cus_doc.quick_entry = self.advanced_property_management
        new_cus_doc_field_list = []
        for row in cus_doc.fields:
            if row.fieldtype in ["Section Break", "Column Break", "Table"]:
                row.allow_in_quick_entry = 0
            else:
                row.allow_in_quick_entry = self.advanced_property_management
            new_cus_doc_field_list.append(row)
        cus_doc.fields = new_cus_doc_field_list
        cus_doc.save_customization()
