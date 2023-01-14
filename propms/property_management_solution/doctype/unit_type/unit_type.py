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

    @frappe.whitelist()
    def naming_unit_type(self):
        new_name = self.unit_type
        if self.balcony and "Balcony" not in self.unit_type:
            new_name = f"{new_name}-Balcony"
        elif self.balcony == 0:
            new_name = str(new_name).replace("-Balcony", "")
        if self.showerbath and "Shower/Bath" not in self.unit_type:
            new_name = f"{new_name}-Shower/Bath"
        elif self.showerbath == 0:
            new_name = str(new_name).replace("-Shower/Bath", "")
        if self.toilet and "Toilet" not in self.unit_type:
            new_name = f"{new_name}-Toilet"
        elif self.toilet == 0:
            new_name = str(new_name).replace("-Toilet", "")
        if self.rentable and "Rentable" not in self.unit_type:
            new_name = f"{new_name}-Rentable"
        elif self.rentable == 0:
            new_name = str(new_name).replace("-Rentable", "")
        self.unit_type = new_name
        self.new_name = new_name
