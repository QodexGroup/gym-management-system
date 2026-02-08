import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import Layout from '../../components/layout/Layout';
import { Badge, DateRangeExportBar, PrintArea, MessageCard, StatsCards } from '../../components/common';
import DataTable from '../../components/DataTable';
import {
  Search,
  Download,
  Receipt,
  DollarSign,
  PieChart as PieChartIcon,
  Calendar,
  Filter,
  Printer,
  Mail,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  PieChart as RechartPie,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useExpenses, useExpenseCategories } from '../../hooks/useExpenses';
import { EXPENSE_STATUS, EXPENSE_STATUS_LABELS, EXPENSE_STATUS_VARIANTS } from '../../constants/expenseConstants';
import { reportService } from '../../services/reportService';
import { exportReportToPdf, exportReportToExcel } from '../../utils/reportPrintExport';
import { REPORT_DATE_RANGE_OPTIONS, getReportDateRange, MAX_REPORT_ROWS } from '../../constants/reportConstants';
import { Alert, Toast } from '../../utils/alert';

const categoryColors = [
  '#0ea5e9', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16', '#6366f1',
];
const CUSTOM_DATE_DEBOUNCE_MS = 2000;

const ExpenseReport = () => {
  const printRef = useRef(null);
  const [dateRange, setDateRange] = useState('this_month');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [inputDateFrom, setInputDateFrom] = useState('');
  const [inputDateTo, setInputDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const debounceFromRef = useRef(null);
  const debounceToRef = useRef(null);

  const { start: dateFrom, end: dateTo } = getReportDateRange(dateRange, customDateFrom, customDateTo);
  const expenseOptions = useMemo(() => {
    const filters = { dateFrom, dateTo };
    if (searchQuery) filters.description = searchQuery;
    if (filterCategory !== 'all') filters.category_id = filterCategory;
    return {
      page: 1,
      pagelimit: MAX_REPORT_ROWS,
      relations: 'category',
      filters,
    };
  }, [dateRange, dateFrom, dateTo, searchQuery, filterCategory]);

  const applyCustomFrom = useCallback((value) => {
    if (debounceFromRef.current) clearTimeout(debounceFromRef.current);
    debounceFromRef.current = setTimeout(() => setCustomDateFrom(value), CUSTOM_DATE_DEBOUNCE_MS);
  }, []);
  const applyCustomTo = useCallback((value) => {
    if (debounceToRef.current) clearTimeout(debounceToRef.current);
    debounceToRef.current = setTimeout(() => setCustomDateTo(value), CUSTOM_DATE_DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    if (dateRange === 'custom') {
      setInputDateFrom(customDateFrom);
      setInputDateTo(customDateTo);
    }
  }, [dateRange]);

  useEffect(() => {
    return () => {
      if (debounceFromRef.current) clearTimeout(debounceFromRef.current);
      if (debounceToRef.current) clearTimeout(debounceToRef.current);
    };
  }, []);

  const { data: expensesData, isLoading, isError, error } = useExpenses(expenseOptions);
  const { data: categoriesData } = useExpenseCategories({});
  const expenses = expensesData?.data || [];
  const totalRows = expensesData?.total ?? expenses.length;
  const reportTooLarge = totalRows > MAX_REPORT_ROWS;
  const categories = categoriesData?.data || [];

  const transformedExpenses = useMemo(() => {
    let list = expenses.map((apiExpense) => {
      let categoryName = apiExpense.category?.name;
      if (!categoryName && apiExpense.categoryId && categories.length > 0) {
        const found = categories.find((c) => c.id === apiExpense.categoryId);
        categoryName = found?.name;
      }
      if (!categoryName) categoryName = 'Unknown';
      return {
        id: apiExpense.id,
        category: categoryName,
        description: apiExpense.description,
        amount: parseFloat(apiExpense.amount),
        date: apiExpense.expenseDate,
        formattedDate: formatDate(apiExpense.expenseDate),
        status: apiExpense.status,
      };
    });
    if (filterStatus !== 'all') list = list.filter((e) => e.status === filterStatus);
    return list;
  }, [expenses, categories, filterStatus]);

  const totalExpenses = transformedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const paidExpenses = transformedExpenses
    .filter((e) => e.status === EXPENSE_STATUS.POSTED)
    .reduce((sum, e) => sum + e.amount, 0);
  const pendingExpenses = transformedExpenses
    .filter((e) => e.status === EXPENSE_STATUS.UNPOSTED)
    .reduce((sum, e) => sum + e.amount, 0);

  const expenseByCategory = useMemo(() => {
    const byCat = {};
    transformedExpenses.forEach((e) => {
      byCat[e.category] = (byCat[e.category] || 0) + e.amount;
    });
    return Object.entries(byCat).map(([name, value]) => ({ name, value })).filter((d) => d.value > 0);
  }, [transformedExpenses]);

  const monthlyTrend = useMemo(() => {
    const byMonth = {};
    transformedExpenses.forEach((e) => {
      const d = new Date(e.date);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      byMonth[key] = (byMonth[key] || 0) + e.amount;
    });
    return Object.entries(byMonth)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => new Date(a.month) - new Date(b.month))
      .slice(-6);
  }, [transformedExpenses]);

  const periodLabel =
    dateRange === 'custom' && customDateFrom && customDateTo
      ? `${customDateFrom} – ${customDateTo}`
      : REPORT_DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label || dateRange;
  const handleEmailReport = async () => {
    try {
      const res = await reportService.emailReport({
        reportType: 'expense',
        dateRange,
        dateFrom,
        dateTo,
      });
      Toast.success(res.message || 'Report request submitted. You will receive it by email.');
    } catch (err) {
      Toast.error(err.message || 'Failed to request report');
    }
  };
  const generatedAt = new Date().toLocaleString();
  const summaryRows = [
    ['Total Expenses', formatCurrency(totalExpenses)],
    ['Posted', formatCurrency(paidExpenses)],
    ['Unposted', formatCurrency(pendingExpenses)],
    ['Transactions', String(transformedExpenses.length)],
  ];

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Expense Report',
  });

  const doExportPdf = () => {
    const headers = ['Date', 'Category', 'Description', 'Amount', 'Status'];
    const rows = transformedExpenses.map((e) => [
      e.formattedDate,
      e.category,
      e.description,
      formatCurrency(e.amount),
      EXPENSE_STATUS_LABELS[e.status] || e.status,
    ]);
    exportReportToPdf({
      title: 'Expense Report',
      periodLabel,
      generatedAt,
      summaryRows,
      headers,
      rows,
      filename: 'expense-report.pdf',
    });
  };

  const doExportExcel = () => {
    const headers = ['Date', 'Category', 'Description', 'Amount', 'Status'];
    const rows = transformedExpenses.map((e) => [
      e.formattedDate,
      e.category,
      e.description,
      e.amount,
      EXPENSE_STATUS_LABELS[e.status] || e.status,
    ]);
    exportReportToExcel({
      sheetName: 'Expenses',
      title: 'Expense Report',
      periodLabel,
      generatedAt,
      summaryRows,
      headers,
      rows,
      filename: 'expense-report.xlsx',
    });
  };

  const handleExportPdf = async () => {
    try {
      const res = await reportService.checkExportSize({ reportType: 'expense', dateFrom, dateTo });
      if (res.tooLarge) {
        await Alert.warning(
          'Data is too large',
          'We will send the report to your email (PDF). The full report will be delivered via email.',
          { confirmButtonText: 'OK' }
        );
        await reportService.emailReport({ reportType: 'expense', dateRange, dateFrom, dateTo, format: 'pdf' });
        Toast.success('Report request submitted. You will receive it by email.');
      } else {
        doExportPdf();
      }
    } catch (err) {
      Toast.error(err.message || 'Export failed');
    }
  };

  const handleExportExcel = async () => {
    try {
      const res = await reportService.checkExportSize({ reportType: 'expense', dateFrom, dateTo });
      if (res.tooLarge) {
        await Alert.warning(
          'Data is too large',
          'We will send the report to your email (Excel). The full report will be delivered via email.',
          { confirmButtonText: 'OK' }
        );
        await reportService.emailReport({ reportType: 'expense', dateRange, dateFrom, dateTo, format: 'excel' });
        Toast.success('Report request submitted. You will receive it by email.');
      } else {
        doExportExcel();
      }
    } catch (err) {
      Toast.error(err.message || 'Export failed');
    }
  };

  if (isLoading) {
    return (
      <Layout title="Expense Report" subtitle="Track and manage gym expenses">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout title="Expense Report" subtitle="Track and manage gym expenses">
        <div className="card text-center py-12 text-danger-600">{error?.message || 'Failed to load report'}</div>
      </Layout>
    );
  }

  const expenseStats = [
    { label: 'Total Expenses', value: formatCurrency(totalExpenses), icon: DollarSign, gradient: 'from-primary-500 to-primary-600', textBg: 'text-primary-100', iconBg: 'text-primary-200' },
    { label: 'Posted', value: formatCurrency(paidExpenses), icon: Receipt, gradient: 'from-success-500 to-success-600', textBg: 'text-success-100', iconBg: 'text-success-200' },
    { label: 'Unposted', value: formatCurrency(pendingExpenses), icon: Calendar, gradient: 'from-warning-500 to-warning-600', textBg: 'text-warning-100', iconBg: 'text-warning-200' },
    { label: 'Transactions', value: transformedExpenses.length, icon: PieChartIcon, gradient: 'from-accent-500 to-accent-600', textBg: 'text-accent-100', iconBg: 'text-accent-200' },
  ];

  const expenseColumns = [
    { key: 'formattedDate', label: 'Date', render: (row) => row.formattedDate },
    { key: 'category', label: 'Category', render: (row) => <Badge variant="default">{row.category}</Badge> },
    { key: 'description', label: 'Description', render: (row) => <span className="font-medium">{row.description}</span> },
    { key: 'amount', label: 'Amount', render: (row) => <span className="font-semibold text-dark-800">{formatCurrency(row.amount)}</span> },
    { key: 'status', label: 'Status', render: (row) => <Badge variant={EXPENSE_STATUS_VARIANTS[row.status] || 'warning'}>{EXPENSE_STATUS_LABELS[row.status] || row.status}</Badge> },
  ];

  const expenseExtraFilters = (
    <>
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
        <input
          type="text"
          placeholder="Search expenses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-dark-200 rounded-lg focus:bg-transparent focus:border-primary-500 outline-none"
        />
      </div>
      <select
        value={filterCategory}
        onChange={(e) => setFilterCategory(e.target.value)}
        className="px-4 py-2.5 bg-transparent border border-dark-200 rounded-lg focus:border-primary-500 outline-none"
      >
        <option value="all">All Categories</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="px-4 py-2.5 bg-transparent border border-dark-200 rounded-lg focus:border-primary-500 outline-none"
      >
        <option value="all">All Status</option>
        <option value={EXPENSE_STATUS.POSTED}>{EXPENSE_STATUS_LABELS[EXPENSE_STATUS.POSTED]}</option>
        <option value={EXPENSE_STATUS.UNPOSTED}>{EXPENSE_STATUS_LABELS[EXPENSE_STATUS.UNPOSTED]}</option>
      </select>
    </>
  );

  return (
    <Layout title="Expense Report" subtitle="Track and manage gym expenses">
      <PrintArea
        ref={printRef}
        businessName="Kaizen Gym"
        title="Expense Report"
        periodLabel={periodLabel}
        generatedAt={generatedAt}
        summaryRows={summaryRows}
      >
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="table-header text-left p-2 border border-slate-300">Date</th>
              <th className="table-header text-left p-2 border border-slate-300">Category</th>
              <th className="table-header text-left p-2 border border-slate-300">Description</th>
              <th className="table-header text-left p-2 border border-slate-300">Amount</th>
              <th className="table-header text-left p-2 border border-slate-300">Status</th>
            </tr>
          </thead>
          <tbody>
            {transformedExpenses.map((expense) => (
              <tr key={expense.id}>
                <td className="p-2 border border-slate-300">{expense.formattedDate}</td>
                <td className="p-2 border border-slate-300">{expense.category}</td>
                <td className="p-2 border border-slate-300">{expense.description}</td>
                <td className="p-2 border border-slate-300">{formatCurrency(expense.amount)}</td>
                <td className="p-2 border border-slate-300">{EXPENSE_STATUS_LABELS[expense.status] || expense.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {transformedExpenses.length === 0 && (
          <p className="text-center py-4 text-slate-500">No expenses match filters</p>
        )}
      </PrintArea>

      <DateRangeExportBar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        dateRangeOptions={REPORT_DATE_RANGE_OPTIONS}
        inputDateFrom={inputDateFrom}
        inputDateTo={inputDateTo}
        onCustomDateFromChange={(v) => { setInputDateFrom(v); applyCustomFrom(v); }}
        onCustomDateToChange={(v) => { setInputDateTo(v); applyCustomTo(v); }}
        extraFilters={expenseExtraFilters}
        reportTooLarge={reportTooLarge}
        onEmailReport={handleEmailReport}
        onPrint={handlePrint}
        onExportPdf={handleExportPdf}
        onExportExcel={handleExportExcel}
      />

      {reportTooLarge && (
        <MessageCard
          message={`This report has more than ${MAX_REPORT_ROWS} rows (${totalRows} total).`}
          description="We will email you the full PDF or Excel report instead."
          actionLabel="Email Report"
          onAction={handleEmailReport}
          icon={Mail}
        />
      )}

        {!reportTooLarge && (
        <>
        <StatsCards stats={expenseStats} variant="gradient" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 no-print">
          <div className="card">
            <h3 className="text-lg font-semibold text-dark-800 mb-4">Expenses by Category</h3>
            <div className="h-64">
              {expenseByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartPie>
                    <Pie
                      data={expenseByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expenseByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </RechartPie>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-dark-400">No data</div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {expenseByCategory.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: categoryColors[index % categoryColors.length] }}
                  />
                  <span className="text-dark-600">{item.name}</span>
                  <span className="text-dark-400 ml-auto">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold text-dark-800 mb-4">Monthly Expense Trend</h3>
            <div className="h-64">
              {monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="amount" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-dark-400">No data</div>
              )}
            </div>
          </div>
        </div>

        <DataTable
          columns={expenseColumns}
          data={transformedExpenses}
          keyField="id"
          title="Expense List"
          wrapperClassName="card no-print"
          emptyMessage="No expenses match filters"
        />
        </>
        )}
    </Layout>
  );
};

export default ExpenseReport;
