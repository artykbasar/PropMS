import frappe
from frappe import _

from propms.utils.optional_dependencies import field_exists


def execute(filters=None):
    filters = frappe._dict(filters or {})
    columns = get_columns()

    if not field_exists("Sales Invoice Item", "withholding_tax_rate"):
        return (
            columns,
            [],
            _("Withholding tax fields are not available. Install CSF_TZ to enable this report."),
        )

    conditions = ["si.docstatus = 1", "si.is_return = 0", "ifnull(sii.withholding_tax_rate, 0) > 0"]
    values = {}

    if filters.get("from_date"):
        conditions.append("si.posting_date >= %(from_date)s")
        values["from_date"] = filters.from_date

    if filters.get("to_date"):
        conditions.append("si.posting_date <= %(to_date)s")
        values["to_date"] = filters.to_date

    query = """
        SELECT
            si.posting_date AS date,
            si.customer_name AS customer,
            sii.item_name AS particulars,
            si.name AS voucher_no,
            {lease_expr} AS property,
            {period_expr} AS period,
            sii.base_net_amount AS amount,
            sii.base_net_amount * (sii.withholding_tax_rate / 100) AS withholding_tax,
            {tra_control_number_expr} AS control_number,
            {witholding_tax_certificate_number_expr} AS witholding_tax_certificate_number,
            {tin_expr} AS tin_number
        FROM `tabSales Invoice` si
        LEFT JOIN `tabSales Invoice Item` sii ON si.name = sii.parent
        INNER JOIN `tabCustomer` c ON si.customer = c.name
        WHERE {conditions}
    """.format(
        conditions=" AND ".join(conditions),
        lease_expr=get_field_or_empty("Sales Invoice", "lease", "si"),
        period_expr=get_period_expr(),
        tra_control_number_expr=get_field_or_empty(
            "Sales Invoice", "tra_control_number", "si"
        ),
        witholding_tax_certificate_number_expr=get_field_or_empty(
            "Sales Invoice", "witholding_tax_certificate_number", "si"
        ),
        tin_expr=get_tin_expr(),
    )

    return columns, frappe.db.sql(query, values, as_dict=True)


def get_columns():
    return [
        {
            "label": "Date",
            "fieldname": "date",
            "fieldtype": "Date",
            "width": 100,
        },
        {
            "label": "Customer",
            "fieldname": "customer",
            "fieldtype": "Link",
            "options": "Customer",
            "width": 180,
        },
        {
            "label": "Particulars",
            "fieldname": "particulars",
            "fieldtype": "Data",
            "width": 180,
        },
        {
            "label": "Voucher No",
            "fieldname": "voucher_no",
            "fieldtype": "Link",
            "options": "Sales Invoice",
            "width": 160,
        },
        {
            "label": "Property",
            "fieldname": "property",
            "fieldtype": "Link",
            "options": "Lease",
            "width": 160,
        },
        {
            "label": "Period",
            "fieldname": "period",
            "fieldtype": "Data",
            "width": 180,
        },
        {
            "label": "Amount",
            "fieldname": "amount",
            "fieldtype": "Currency",
            "width": 130,
        },
        {
            "label": "Withholding Tax",
            "fieldname": "withholding_tax",
            "fieldtype": "Currency",
            "width": 130,
        },
        {
            "label": "Control Number",
            "fieldname": "control_number",
            "fieldtype": "Data",
            "width": 140,
        },
        {
            "label": "Withholding Tax Certificate Number",
            "fieldname": "witholding_tax_certificate_number",
            "fieldtype": "Data",
            "width": 180,
        },
        {
            "label": "TIN Number",
            "fieldname": "tin_number",
            "fieldtype": "Data",
            "width": 140,
        },
    ]


def get_field_or_empty(doctype, fieldname, table_alias):
    if field_exists(doctype, fieldname):
        return "{0}.{1}".format(table_alias, fieldname)

    return "''"


def get_period_expr():
    if field_exists("Sales Invoice Item", "service_start_date") and field_exists(
        "Sales Invoice Item", "service_end_date"
    ):
        return "concat_ws(' and ', sii.service_start_date, sii.service_end_date)"

    return "''"


def get_tin_expr():
    has_sales_invoice_tax_id = field_exists("Sales Invoice", "tax_id")
    has_customer_tax_id = field_exists("Customer", "tax_id")

    if has_sales_invoice_tax_id and has_customer_tax_id:
        return "if(si.tax_id, si.tax_id, c.tax_id)"
    if has_sales_invoice_tax_id:
        return "si.tax_id"
    if has_customer_tax_id:
        return "c.tax_id"

    return "''"
