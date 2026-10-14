# Doctor Maintenance ERP

Premium React + TypeScript frontend for Doctor Maintenance’s internal business workspace. This release uses clearly identified demonstration data and browser-local persistence. It contains no backend, database, authentication service, payment gateway or external messaging integration.

## Run locally

Requires Node.js 22.6 or newer.

```sh
npm ci
npm run dev
```

```sh
npm run check
npm test
npm run build
```

## Workspaces

- Executive dashboard, global command search (Ctrl/Cmd + K), quick creation and role previews.
- Lead pipeline and list, customer/property records, notes and follow-ups.
- Configurable services and rate cards, specialist profiles and contractor comparison.
- Quotation studio: dynamic items, live A4 preview, payment milestones, revisions, issue/accept and linked project conversion.
- Jobs: work orders, multiple contractors, milestones, costs, change orders and mock attachments.
- Invoice studio, partial receipts, expense approvals and contractor payments.
- Cash/accounts with a separate accrual profitability view and source-linked transaction ledger.
- Manual marketing spend, CSV import with validation and duplicate checks, campaign attribution and eleven report views.
- Team role simulation, company defaults, document templates, configuration and audit trail.

## Accounting semantics

Earned revenue is recognized on project handover. Invoices and customer advances are tracked separately. Approved bills and expenses are incurred costs; payments settle balances and move cash without deducting costs twice. Pending costs are excluded until approval. Marketing allocations are separate from direct job costs and overhead. Service reporting excludes shared company overhead.

This is a demonstrator, not a production accounting engine. Double-entry journals, enforced period locking, bank reconciliation, reversals, credit notes and real security remain future backend work.

## Documents and interactions

Print / PDF uses the browser’s print dialog; select **Save as PDF**. Customer quotations and invoices exclude internal cost and margin fields. Work orders are contractor copies. Company address, email and phone remain unconfigured until real details are supplied.

Call and WhatsApp controls preview the shortcut and send no messages. Attachment actions store filenames only. Team invitations do not send email. Demo state is stored under `dm-erp-v1` in localStorage and can be reset in Settings → Demo controls.

## Architecture

`src/domain.ts` contains typed records and financial selectors. `src/workflows.ts` owns pure conversion, payment and record operations. `src/store.tsx` provides shared local state and navigation. Domain-based modules share the shell, forms, tables, drawers and document renderer. External services can later replace local mutations without rebuilding the UI.

Fonts are bundled locally through Fontsource. Brand assets are in `public/assets`. Sites hosting is configured in `.openai/hosting.json`.

## Verification

Financial and workflow tests cover advances, cash/expense separation, overpayment prevention, approvals, duplicate project prevention, preserved quote versions, data relationships and CSV parsing. Server rendering checks cover module directories and detail workspaces. No automated browser or print-layout visual verification was available in the build environment.

## Service-specific quotation conditions

Go to **Services & Rates → Quotation terms**, select a service, and manage its reusable conditions. Owner can add, edit, reorder, enable/disable and choose which conditions are automatically included. Save the library once; future quotations copy enabled conditions and auto-select the configured defaults.

In **Quotation studio → Payments & terms**, staff can include/exclude individual conditions and add project-specific wording. **Apply latest defaults** refreshes a draft deliberately. Issued quotations preserve their saved text when the library changes. Existing browser data is migrated without resetting records.

The interface includes bespoke vector property/document illustrations, animated figures and charts, viewport reveals and refined interaction states. All motion respects reduced-motion settings.

## Editor and navigation layout

Quotation and invoice studios use one keyboard-accessible scroll region, with their header, tabs and action footer outside it. Desktop height follows available viewport space; tablet and short screens use natural page scrolling. Sidebar collapse is available in the top bar and footer, and its preference persists independently of demo records.
