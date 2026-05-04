<div align="center">
    <img src="https://aakvatech.com/wp-content/uploads/2020/05/LOGO.png" height="128">
    <h2>Aakvatech's Property Management Solution Powered on ERPNext</h2>

[https:/aakvatech.com](https://aakvatech.com)

</div>

## Property Management Solution
Includes: Lease, Daily Checklist, Key Set, Meter, Outsourced Attendance. Requires ERPNext.

Property Management Solution is powered by [ERPNext](https://github.com/frappe/erpnext), the world's best 100% open source ERP and a comprehensive one system solution that includes accounting, inventory, asset management, HR & Payroll and much more.

### Install
>Step 1: run the following commands to install PropMS. CSF_TZ is optional and can be installed later for Tanzania-specific tax fields and reports.

1. Install PropMS
```
bench get-app https://github.com/artykbasar/PropMS.git
bench --site "site-name" install-app propms
```

2. Optional: install CSF_TZ for Tanzania-specific integrations
```
bench get-app https://github.com/artykbasar/CSF_TZ.git
bench --site "site-name" install-app csf_tz
```

>Step 2: Create a domain named Property Management Solution

#### License

GPL
