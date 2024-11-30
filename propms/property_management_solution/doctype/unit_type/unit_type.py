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
        if self.rented and "Rented" not in self.unit_type:
            new_name = f"{new_name}-Rented"
        elif self.rented == 0:
            new_name = str(new_name).replace("-Rented", "")
        self.unit_type = new_name
        if self.for_sale and "For Sale" not in self.unit_type:
            new_name = f"{new_name}-For Sale"
        elif self.for_sale == 0:
            new_name = str(new_name).replace("-For Sale", "")
        self.unit_type = new_name
        if self.new_development and "New Development" not in self.unit_type:
            new_name = f"{new_name}-New Development"
        elif self.new_development == 0:
            new_name = str(new_name).replace("-New Development", "")
        self.unit_type = new_name
        if self.development_project and "Development Project" not in self.unit_type:
            new_name = f"{new_name}-Development Project"
        elif self.development_project == 0:
            new_name = str(new_name).replace("-Development Project", "")
        self.unit_type = new_name
        self.new_name = new_name
