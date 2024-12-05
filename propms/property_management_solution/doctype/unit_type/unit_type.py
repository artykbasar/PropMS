# -*- coding: utf-8 -*-
# Copyright (c) 2018, Aakvatech and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
from frappe.model.document import Document
import frappe


class UnitType(Document):
    def validate(self):
        self.naming_unit_type()

    def on_update(self):
        if self.name != self.new_name:
            self.rename(self.new_name)
            self.reload()

    def name_without_tags(self):
        return self.naming_unit_type(True)

    @frappe.whitelist()
    def naming_unit_type(self, remove_subfix=False):
        new_name = self.unit_type
        bold_docfields = frappe.get_all("DocField",
                                        filters={"parent": "Unit Type", "fieldtype": "Check", "bold": 1}, 
                                        fields=['label', 'bold','fieldname'],
                                        order_by="idx")
        self_dict = self.as_dict()
        for bold_docfield in bold_docfields:
            if bold_docfield.label in str(self.unit_type):
                new_name = str(new_name).replace(f"-{bold_docfield.label}", "")
            if not remove_subfix:
                if self_dict.get(bold_docfield.fieldname) == 1:
                    new_name = f"{new_name}-{bold_docfield.label}"
                elif self_dict.get(bold_docfield.fieldname) == 0:
                    new_name = str(new_name).replace(f"-{bold_docfield.label}", "")
                self.unit_type = new_name
                self.new_name = new_name
        if remove_subfix:
            return new_name
