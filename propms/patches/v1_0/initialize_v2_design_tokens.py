"""Historical compatibility patch.

Website V2 branding is now driven by Frappe Website Theme records and their
PropMS custom fields. Brand-name detection was intentionally removed; existing
site values are preserved and the migration to themes is performed explicitly
per site so this old patch remains safe and idempotent on fresh installs.
"""


def execute():
    return
