## Business Context

Property managers need a single, publishable guest guide per property that can be maintained from Desk and exposed on a stable public route like `/instructions/<slug>`.

## Scope

- Add a `Property Instruction` parent DocType linked to `Property`
- Add a flat `Property Instruction Block` child DocType for ordered content blocks
- Publish guest-facing pages through Frappe's website generator flow
- Add automated tests for routing, validation, ordering, publication, and rendering

## Architecture

- `Property Instruction` subclasses `WebsiteGenerator`
- Public routing is driven by `published`, `slug`, and `route`
- `Property Instruction Block` stores ordered section content
- A dedicated generator template renders grouped sections with isolated styling
- Tests exercise document validation, route visibility, and rendered HTML

## Files Changed

- `docs/tasks/TASK-01-property-instructions.md`
- `propms/hooks.py`
- `propms/property_management_solution/doctype/property_instruction/*`
- `propms/property_management_solution/doctype/property_instruction_block/*`
- `propms/templates/generators/property_instruction.html`

## Test Plan

- Run `bench --site development.localhost migrate`
- Run `bench --site development.localhost clear-cache`
- Run `bench --site development.localhost run-tests --app propms`
- If broad app tests fail for unrelated reasons, run the new test module directly and `test_property.py`
- Verify published and unpublished HTTP behavior on `/instructions/<slug>`

## Acceptance Criteria

- Administrators can manage one published guest guide per property
- Ordered blocks render on `/instructions/<slug>`
- Unpublished instructions are not publicly discoverable
- Rendering is responsive and print-friendly
- Automated tests cover validation, ordering, publication, and rendering

## Out Of Scope

- Booking-specific or guest-specific access credentials
- Auth tokens or expiring share links
- Channel-manager synchronization
- Builder integration
- Cross-app refactors outside `propms`
