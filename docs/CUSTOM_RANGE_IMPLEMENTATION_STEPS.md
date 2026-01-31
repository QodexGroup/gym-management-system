# Custom Date Range + Export Size Check – Implementation Steps

Record of steps for review. Each step is implemented and then logged here.

**Summary:** (1) Added "Custom range" date option and From/To inputs on Collection, Expense, and Summary reports. (2) Backend endpoint `POST /reports/check-export` counts rows for the selected range; returns `tooLarge` when row count > 200. (3) When user clicks Export PDF or Export Excel, frontend calls check-export first; if `tooLarge`, shows SweetAlert (Swal) "Data is too large. We will send the report to your email." and triggers email report; otherwise runs the existing client-side export.

---

## Step 1: Add custom date range to reportConstants.js ✅

**Goal:** Add "Custom range" option and allow getReportDateRange to return custom From/To when provided.

**Status:** Done

**Changes:**
- `REPORT_DATE_RANGE_OPTIONS`: added `{ value: 'custom', label: 'Custom range' }`.
- `getReportDateRange(key, customStart, customEnd)`: when `key === 'custom'` and both `customStart` and `customEnd` are provided, returns `{ start: customStart, end: customEnd }` (sliced to YYYY-MM-DD). Otherwise unchanged behavior for presets.

---

## Step 2: CollectionReport – custom date UI + state ✅

**Goal:** Add custom date state (customDateFrom, customDateTo), "Custom range" in dropdown, two date inputs when custom selected; resolve dateFrom/dateTo for API and export.

**Status:** Done

**Changes:**
- **reportService.getCollectionData:** Now passes `options.customDateFrom`, `options.customDateTo` into `getReportDateRange(dateRange, customDateFrom, customDateTo)`.
- **CollectionReport:** Added state `customDateFrom`, `customDateTo` (strings). Passes them to `useReportCollection` when `dateRange === 'custom'`. Resolved dates via `getReportDateRange(dateRange, customDateFrom, customDateTo)` for `periodLabel` and `handleEmailReport`. When "Custom range" is selected, two date inputs (From / To) are shown next to the dropdown.

---

## Step 3: ExpenseReport – custom date UI + state ✅

**Goal:** Same as Step 2 for ExpenseReport.

**Status:** Done

**Changes:**
- Added state `customDateFrom`, `customDateTo`. Resolved dates via `getReportDateRange(dateRange, customDateFrom, customDateTo)` for `expenseOptions`, `periodLabel`, and `handleEmailReport`. When "Custom range" is selected, two date inputs (From / To) shown next to the dropdown.

---

## Step 4: SummaryReport – custom date UI + state ✅

**Goal:** Same as Step 2 for SummaryReport.

**Status:** Done

**Changes:**
- Added state `customDateFrom`, `customDateTo`. Resolved dates via `getReportDateRange(dateRange, customDateFrom, customDateTo)` for `expenseOptions`, `useReportCollection`, `periodLabel`, and `handleEmailReport`. When "Custom range" is selected, two date inputs (From / To) shown next to the dropdown.

---

## Step 5: Backend – check export size endpoint ✅

**Goal:** New endpoint (e.g. POST /reports/check-export) that accepts reportType, dateFrom, dateTo; counts rows (bills for collection, expenses for expense/summary); returns { tooLarge: rowCount > 200, rowCount }.

**Status:** Done

**Changes:**
- **ReportController::checkExportSize(Request $request):** Validates reportType, dateFrom, dateTo (dateTo after_or_equal dateFrom). Gets account_id from request user. Counts: collection = CustomerBill in date range, expense/summary = Expense in date range. Returns `{ tooLarge: rowCount > 200, rowCount }`. MAX_EXPORT_ROWS = 200.
- **Route:** POST `/reports/check-export` added (protected).

---

## Step 6: Frontend – export flow + Swal when tooLarge ✅

**Goal:** Before Export PDF/Excel, call backend check-export. If tooLarge, show Swal ("Data is too large. We will send the report to your email."), then call email report API. If not tooLarge, use current client-side export. Use SweetAlert2 (Swal), not toast.

**Status:** Done

**Changes:**
- **reportService.checkExportSize(options):** POST `/reports/check-export` with reportType, dateFrom, dateTo; returns `data.data` with `tooLarge` and `rowCount`.
- **CollectionReport, ExpenseReport, SummaryReport:** Renamed direct export logic to `doExportPdf` / `doExportExcel`. `handleExportPdf` and `handleExportExcel` now: (1) call `reportService.checkExportSize` with report type and resolved dateFrom/dateTo; (2) if `res.tooLarge`, show `Alert.warning` (SweetAlert2) with message "Data is too large. We will send the report to your email (PDF/Excel).", then call `reportService.emailReport` with format; (3) else call `doExportPdf` / `doExportExcel`. Import `Alert` from `../../utils/alert` in all three reports.
