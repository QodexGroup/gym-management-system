import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import Layout from '../../components/layout/Layout';
import {
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Printer,
  PieChart as PieChartIcon,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Mail,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
} from 'recharts';
import { useExpenses, useExpenseCategories } from '../../hooks/useExpenses';
import { useReportCollection } from '../../hooks/useReportCollection';
import { reportService } from '../../services/reportService';
import { exportReportToPdf, exportReportToExcel } from '../../utils/reportPrintExport';
import { REPORT_DATE_RANGE_OPTIONS, getReportDateRange, MAX_REPORT_ROWS } from '../../constants/reportConstants';
import { Alert, Toast } from '../../utils/alert';

const categoryColors = [
  '#ef4444', '#f59e0b', '#22c55e', '#0ea5e9', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#6366f1',
];
const CUSTOM_DATE_DEBOUNCE_MS = 2000;

const SummaryReport = () => {
  const printRef = useRef(null);
  const [dateRange, setDateRange] = useState('this_month');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [inputDateFrom, setInputDateFrom] = useState('');
  const [inputDateTo, setInputDateTo] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const debounceFromRef = useRef(null);
  const debounceToRef = useRef(null);

  const { start: dateFrom, end: dateTo } = getReportDateRange(dateRange, customDateFrom, customDateTo);
  const { data: dashboardStats } = useReportCollection({
    dateRange,
    customDateFrom: dateRange === 'custom' ? customDateFrom : undefined,
    customDateTo: dateRange === 'custom' ? customDateTo : undefined,
  });
  const expenseOptions = useMemo(() => ({
    page: 1,
    pagelimit: MAX_REPORT_ROWS,
    relations: 'category',
    filters: { dateFrom, dateTo },
  }), [dateRange, dateFrom, dateTo]);

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

  const { data: expensesData } = useExpenses(expenseOptions);
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
        amount: parseFloat(apiExpense.amount),
        date: apiExpense.expenseDate,
        status: apiExpense.status,
      };
    });
    if (filterCategory !== 'all') list = list.filter((e) => e.category === filterCategory);
    return list;
  }, [expenses, categories, filterCategory]);

  const totalExpenses = transformedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const todayRevenue = dashboardStats?.todayRevenue ?? 0;
  const totalCollectedFromBills = dashboardStats?.totalCollectedFromBills ?? 0;
  const totalRevenue = totalCollectedFromBills;
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

  const expenseByCategory = useMemo(() => {
    const byCat = {};
    transformedExpenses.forEach((e) => {
      byCat[e.category] = (byCat[e.category] || 0) + e.amount;
    });
    return Object.entries(byCat)
      .map(([name, value]) => ({ name, value }))
      .filter((d) => d.value > 0);
  }, [transformedExpenses]);

  const monthlyExpenseTrend = useMemo(() => {
    const byMonth = {};
    transformedExpenses.forEach((e) => {
      const d = new Date(e.date);
      const key = d.toLocaleDateString('en-US', { month: 'short' });
      byMonth[key] = (byMonth[key] || 0) + e.amount;
    });
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month) => ({ month, expenses: byMonth[month] || 0, budget: totalExpenses / 6 })).slice(-6);
  }, [transformedExpenses, totalExpenses]);

  const profitLossData = useMemo(() => {
    const byMonth = {};
    transformedExpenses.forEach((e) => {
      const d = new Date(e.date);
      const key = d.toLocaleDateString('en-US', { month: 'short' });
      byMonth[key] = (byMonth[key] || 0) + e.amount;
    });
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.slice(-6).map((month) => ({
      month,
      revenue: totalCollectedFromBills / 6,
      expenses: byMonth[month] || 0,
      profit: (totalCollectedFromBills / 6) - (byMonth[month] || 0),
    }));
  }, [transformedExpenses, totalCollectedFromBills]);

  const periodLabel =
    dateRange === 'custom' && customDateFrom && customDateTo
      ? `${customDateFrom} – ${customDateTo}`
      : REPORT_DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label || dateRange;
  const handleEmailReport = async () => {
    try {
      const res = await reportService.emailReport({
        reportType: 'summary',
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
    ['Total Revenue', formatCurrency(totalRevenue)],
    ['Total Expenses', formatCurrency(totalExpenses)],
    ['Net Profit', formatCurrency(netProfit)],
    ['Profit Margin', `${profitMargin}%`],
    ["Today's Revenue", formatCurrency(todayRevenue)],
  ];

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Summary Report',
  });

  const doExportPdf = () => {
    const headers = ['Category', 'Amount'];
    const rows = expenseByCategory.map((c) => [c.name, formatCurrency(c.value)]);
    exportReportToPdf({
      title: 'Summary Report',
      periodLabel,
      generatedAt,
      summaryRows,
      headers,
      rows,
      filename: 'summary-report.pdf',
    });
  };

  const doExportExcel = () => {
    const headers = ['Category', 'Amount'];
    const rows = expenseByCategory.map((c) => [c.name, c.value]);
    exportReportToExcel({
      sheetName: 'Summary',
      title: 'Summary Report',
      periodLabel,
      generatedAt,
      summaryRows,
      headers,
      rows,
      filename: 'summary-report.xlsx',
    });
  };

  const handleExportPdf = async () => {
    try {
      const res = await reportService.checkExportSize({ reportType: 'summary', dateFrom, dateTo });
      if (res.tooLarge) {
        await Alert.warning(
          'Data is too large',
          'We will send the report to your email (PDF). The full report will be delivered via email.',
          { confirmButtonText: 'OK' }
        );
        await reportService.emailReport({ reportType: 'summary', dateRange, dateFrom, dateTo, format: 'pdf' });
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
      const res = await reportService.checkExportSize({ reportType: 'summary', dateFrom, dateTo });
      if (res.tooLarge) {
        await Alert.warning(
          'Data is too large',
          'We will send the report to your email (Excel). The full report will be delivered via email.',
          { confirmButtonText: 'OK' }
        );
        await reportService.emailReport({ reportType: 'summary', dateRange, dateFrom, dateTo, format: 'excel' });
        Toast.success('Report request submitted. You will receive it by email.');
      } else {
        doExportExcel();
      }
    } catch (err) {
      Toast.error(err.message || 'Export failed');
    }
  };

  return (
    <Layout title="Summary Report" subtitle="Comprehensive overview of revenue, expenses, and profit">
      <div ref={printRef} className="report-print-only report-print-area p-6">
        <div className="text-center mb-4">
          <p className="font-bold text-lg">Kaizen Gym</p>
          <p className="font-semibold text-base uppercase">Summary Report</p>
          <p className="text-sm">Period: {periodLabel}</p>
          <p className="text-sm">Generated: {generatedAt}</p>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-2 max-w-md text-sm">
          {summaryRows.map(([label, value]) => (
            <div key={label} className="flex justify-between border-b border-slate-200 pb-1">
              <span className="font-medium">{label}</span>
              <span>{value}</span>
            </div>
          ))}
        </div>
        <p className="text-sm font-semibold mb-2">Expense by Category</p>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="table-header text-left p-2 border border-slate-300">Category</th>
              <th className="table-header text-left p-2 border border-slate-300">Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenseByCategory.map((cat) => (
              <tr key={cat.name}>
                <td className="p-2 border border-slate-300">{cat.name}</td>
                <td className="p-2 border border-slate-300">{formatCurrency(cat.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {expenseByCategory.length === 0 && (
          <p className="text-center py-4 text-slate-500">No expense data</p>
        )}
        <p className="text-xs mt-4 text-slate-500">Generated: {generatedAt}</p>
      </div>

      <div className="card mb-6 no-print bg-transparent border-transparent shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-dark-400" />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-4 py-2 bg-transparent border border-dark-200 rounded-lg focus:border-primary-500 outline-none"
                >
                  {REPORT_DATE_RANGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {dateRange === 'custom' && (
                  <>
                    <input
                      type="date"
                      value={inputDateFrom}
                      onChange={(e) => {
                        const v = e.target.value;
                        setInputDateFrom(v);
                        applyCustomFrom(v);
                      }}
                      className="px-3 py-2 bg-transparent border border-dark-200 rounded-lg focus:border-primary-500 outline-none"
                      title="From date"
                    />
                    <span className="text-dark-400">–</span>
                    <input
                      type="date"
                      value={inputDateTo}
                      onChange={(e) => {
                        const v = e.target.value;
                        setInputDateTo(v);
                        applyCustomTo(v);
                      }}
                      className="px-3 py-2 bg-transparent border border-dark-200 rounded-lg focus:border-primary-500 outline-none"
                      title="To date"
                    />
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-dark-400" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 bg-transparent border border-dark-200 rounded-lg focus:border-primary-500 outline-none"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {reportTooLarge ? (
                <button type="button" onClick={handleEmailReport} className="btn-primary flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email Report
                </button>
              ) : (
                <>
                  <button type="button" onClick={handlePrint} className="btn-secondary flex items-center gap-2">
                    <Printer className="w-4 h-4" /> Print
                  </button>
                  <button type="button" onClick={handleExportPdf} className="btn-primary flex items-center gap-2">
                    <Download className="w-4 h-4" /> Export PDF
                  </button>
                  <button type="button" onClick={handleExportExcel} className="btn-secondary flex items-center gap-2">
                    <Download className="w-4 h-4" /> Export Excel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {reportTooLarge && (
          <div className="card mb-6 no-print p-6 text-center">
            <p className="text-dark-600 mb-2">
              This report has more than {MAX_REPORT_ROWS} rows ({totalRows} total). We will email you the full PDF or Excel report instead.
            </p>
            <button type="button" onClick={handleEmailReport} className="btn-primary inline-flex items-center gap-2">
              <Mail className="w-4 h-4" /> Email Report
            </button>
          </div>
        )}

        {!reportTooLarge && (
        <>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 no-print">
          <div className="card bg-gradient-to-br from-success-500 to-success-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-success-100 text-sm">Total Revenue</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(totalRevenue)}</p>
              </div>
              <DollarSign className="w-12 h-12 text-success-200" />
            </div>
          </div>
          <div className="card bg-gradient-to-br from-danger-500 to-danger-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-danger-100 text-sm">Total Expenses</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(totalExpenses)}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-danger-200" />
            </div>
          </div>
          <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 text-sm">Net Profit</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(netProfit)}</p>
                <p className="text-primary-100 text-xs mt-2 flex items-center gap-1">
                  {netProfit >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {profitMargin}% margin
                </p>
              </div>
              <BarChart3 className="w-12 h-12 text-primary-200" />
            </div>
          </div>
          <div className="card bg-gradient-to-br from-warning-500 to-warning-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-warning-100 text-sm">Today&apos;s Revenue</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(todayRevenue)}</p>
              </div>
              <PieChartIcon className="w-12 h-12 text-warning-200" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 no-print">
          <div className="card">
            <h3 className="text-lg font-semibold text-dark-800 mb-4">Profit/Loss Overview</h3>
            <div className="h-72">
              {profitLossData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={profitLossData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="profit" name="Profit" stroke="#0ea5e9" strokeWidth={2} dot={{ fill: '#0ea5e9' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-dark-400">No data</div>
              )}
            </div>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold text-dark-800 mb-4">Expense Distribution</h3>
            <div className="h-72">
              {expenseByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {expenseByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-dark-400">No data</div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 no-print">
          <div className="card">
            <h3 className="text-lg font-semibold text-dark-800 mb-4">Expense vs Budget Trend</h3>
            <div className="h-64">
              {monthlyExpenseTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyExpenseTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="expenses" name="Actual" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} />
                    <Line type="monotone" dataKey="budget" name="Budget" stroke="#8b5cf6" strokeDasharray="5 5" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-dark-400">No data</div>
              )}
            </div>
          </div>
          <div className="card no-print">
            <h3 className="text-lg font-semibold text-dark-800 mb-4">Expense Breakdown by Category</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {expenseByCategory.map((cat, index) => {
                const percentage = totalExpenses > 0 ? ((cat.value / totalExpenses) * 100).toFixed(1) : '0';
                return (
                  <div
                    key={cat.name}
                    className="p-4 bg-dark-50 rounded-xl border-l-4"
                    style={{ borderColor: categoryColors[index % categoryColors.length] }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-dark-800">{cat.name}</span>
                      <span className="text-sm text-dark-500">{percentage}%</span>
                    </div>
                    <p className="text-2xl font-bold text-dark-800">{formatCurrency(cat.value)}</p>
                    <div className="mt-2 bg-dark-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: categoryColors[index % categoryColors.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {expenseByCategory.length === 0 && (
              <p className="text-dark-400 text-center py-8">No expense data</p>
            )}
          </div>
        </div>
        </>
        )}
    </Layout>
  );
};

export default SummaryReport;
