/**
 * Report print and export utilities using jspdf, jspdf-autotable, xlsx
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const DEFAULT_BUSINESS_NAME = 'Kaizen Gym';

/** Default PDF font (Helvetica) has no Peso sign (₱) and can render it as ±. Use "PHP " for PDF. */
const pdfSafeCurrency = (str) => (typeof str === 'string' ? str.replace(/\u20B1/g, 'PHP ').replace(/\u00B1/g, '') : str);

/** Make summary rows and table rows safe for default PDF font (no ₱ or ±). */
const pdfSafeRows = (rows) => rows.map((row) => (Array.isArray(row) ? row.map(pdfSafeCurrency) : pdfSafeCurrency(row)));
const pdfSafeSummary = (summaryRows) => summaryRows.map((pair) => [pdfSafeCurrency(pair[0]), pdfSafeCurrency(pair[1])]);

/**
 * Export table data to PDF (simple, legacy)
 */
export const exportToPdf = (title, headers, rows, filename = 'report.pdf') => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFontSize(14);
  doc.text(title, 14, 15);
  autoTable(doc, {
    head: [headers],
    body: pdfSafeRows(rows),
    startY: 22,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 23, 42] },
  });
  doc.save(filename);
};

/**
 * Export table data to Excel (simple, legacy)
 */
export const exportToExcel = (sheetName, headers, rows, filename = 'report.xlsx') => {
  const body = !rows || rows.length === 0 ? [] : (Array.isArray(rows[0]) ? rows : rows.map((r) => headers.map((h) => r[h] ?? '')));
  const data = [headers, ...body];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, filename);
};

/**
 * Receipt-style report PDF: header (business, title, period, generated), summary block, detail table, footer
 * @param {Object} options
 * @param {string} options.title - Report title
 * @param {string} [options.businessName] - Business name (default: Kaizen Gym)
 * @param {string} [options.periodLabel] - e.g. "This Month (Jan 2025)" or "1 Jan 2025 – 31 Jan 2025"
 * @param {string} [options.generatedAt] - Generated date/time string
 * @param {Array<[string, string]>} [options.summaryRows] - e.g. [['Total Collected', '₱10,000.00'], ['Transactions', '25']]
 * @param {string[]} options.headers - Table column headers
 * @param {string[][]} options.rows - Table row data (array of arrays)
 * @param {string} [options.filename] - Download filename
 */
export const exportReportToPdf = (options) => {
  const {
    title,
    businessName = DEFAULT_BUSINESS_NAME,
    periodLabel = '',
    generatedAt = new Date().toLocaleString(),
    summaryRows = [],
    headers,
    rows,
    filename = 'report.pdf',
  } = options;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 12;

  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text(businessName, margin, y);
  y += 6;
  doc.setFontSize(12);
  doc.text(title.toUpperCase(), margin, y);
  y += 6;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  if (periodLabel) {
    doc.text(`Period: ${periodLabel}`, margin, y);
    y += 5;
  }
  doc.text(`Generated: ${generatedAt}`, margin, y);
  y += 10;

  if (summaryRows.length > 0) {
    autoTable(doc, {
      head: [['Summary', '']],
      body: pdfSafeSummary(summaryRows),
      startY: y,
      theme: 'plain',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'normal', cellWidth: 50 }, 1: { cellWidth: 'auto' } },
      margin: { left: margin },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  autoTable(doc, {
    head: [headers],
    body: pdfSafeRows(rows),
    startY: y,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 23, 42] },
    margin: { left: margin },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text(
        `Generated: ${generatedAt}  |  Page ${data.pageNumber} of ${pageCount}`,
        margin,
        doc.internal.pageSize.getHeight() - 8
      );
    },
  });

  doc.save(filename);
};

/**
 * Receipt-style report Excel: header rows, summary section, detail table
 * @param {Object} options
 * @param {string} options.sheetName - Sheet name (max 31 chars)
 * @param {string} options.title - Report title
 * @param {string} [options.businessName]
 * @param {string} [options.periodLabel]
 * @param {string} [options.generatedAt]
 * @param {Array<[string, string]>} [options.summaryRows]
 * @param {string[]} options.headers - Table headers
 * @param {string[][]} options.rows - Table rows (array of arrays)
 * @param {string} [options.filename]
 */
export const exportReportToExcel = (options) => {
  const {
    sheetName,
    title,
    businessName = DEFAULT_BUSINESS_NAME,
    periodLabel = '',
    generatedAt = new Date().toLocaleString(),
    summaryRows = [],
    headers,
    rows,
    filename = 'report.xlsx',
  } = options;

  const data = [];
  data.push([businessName]);
  data.push([title.toUpperCase()]);
  if (periodLabel) data.push([`Period: ${periodLabel}`]);
  data.push([`Generated: ${generatedAt}`]);
  data.push([]);
  if (summaryRows.length > 0) {
    data.push(['Summary', '']);
    summaryRows.forEach(([label, value]) => data.push([label, value]));
    data.push([]);
  }
  data.push(headers);
  (rows || []).forEach((row) => data.push(row));

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, (sheetName || 'Report').slice(0, 31));
  XLSX.writeFile(wb, filename);
};
