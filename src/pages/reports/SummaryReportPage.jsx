import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import Layout from '../../components/layout/Layout';
import { DateRangeExportBar, PrintArea, MessageCard, StatsCards } from '../../components/common';
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
import { REPORT_DATE_RANGE_OPTIONS, getReportDateRange, MAX_REPORT_ROWS, CHART_TOOLTIP_STYLE, CHART_CURSOR, CHART_PIE_ACTIVE } from '../../constants/reportConstants';
import { Alert, Toast } from '../../utils/alert';

const categoryColors = [
  '#ef4444', '#f59e0b', '#22c55e', '#0ea5e9', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#6366f1',
];

const SummaryReportPage = () => {
  const printRef = useRef(null);
  const [dateRange, setDateRange] = useState('this_month');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [inputDateFrom, setInputDateFrom] = useState('');
  const [inputDateTo, setInputDateTo] = useState('');
  const [appliedDateRange, setAppliedDateRange] = useState('this_month');
  const [appliedCustomFrom, setAppliedCustomFrom] = useState('');
  const [appliedCustomTo, setAppliedCustomTo] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const { start: dateFrom, end: dateTo } = getReportDateRange(appliedDateRange, appliedCustomFrom, appliedCustomTo);
  const { data: dashboardStats } = useReportCollection({
    dateRange: appliedDateRange,
    customDateFrom: appliedDateRange === 'custom' ? appliedCustomFrom : undefined,
    customDateTo: appliedDateRange === 'custom' ? appliedCustomTo : undefined,
  });
  const expenseOptions = useMemo(() => ({
    page: 1,
    pagelimit: MAX_REPORT_ROWS,
    relations: 'category',
    filters: { dateFrom, dateTo },
  }), [dateFrom, dateTo]);

  const handleApply = useCallback(() => {
    setAppliedDateRange(dateRange);
    setAppliedCustomFrom(dateRange === 'custom' ? customDateFrom : '');
    setAppliedCustomTo(dateRange === 'custom' ? customDateTo : '');
  }, [dateRange, customDateFrom, customDateTo]);

  useEffect(() => {
    if (dateRange === 'custom') {
      setInputDateFrom(customDateFrom);
      setInputDateTo(customDateTo);
    }
  }, [dateRange]);

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
    appliedDateRange === 'custom' && appliedCustomFrom && appliedCustomTo
      ? `${appliedCustomFrom} – ${appliedCustomTo}`
      : REPORT_DATE_RANGE_OPTIONS.find((o) => o.value === appliedDateRange)?.label || appliedDateRange;
  const handleEmailReport = async () => {
    try {
      const res = await reportService.emailReport({
        reportType: 'summary',
        dateRange: appliedDateRange,
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
        await reportService.emailReport({ reportType: 'summary', dateRange: appliedDateRange, dateFrom, dateTo, format: 'pdf' });
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
        await reportService.emailReport({ reportType: 'summary', dateRange: appliedDateRange, dateFrom, dateTo, format: 'excel' });
        Toast.success('Report request submitted. You will receive it by email.');
      } else {
        doExportExcel();
      }
    } catch (err) {
      Toast.error(err.message || 'Export failed');
    }
  };

  const summaryStats = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, gradient: 'from-success-500 to-success-600', textBg: 'text-success-100', iconBg: 'text-success-200' },
    { label: 'Total Expenses', value: formatCurrency(totalExpenses), icon: TrendingUp, gradient: 'from-danger-500 to-danger-600', textBg: 'text-danger-100', iconBg: 'text-danger-200' },
    { label: 'Net Profit', value: `${formatCurrency(netProfit)} (${profitMargin}% margin)`, icon: BarChart3, gradient: 'from-primary-500 to-primary-600', textBg: 'text-primary-100', iconBg: 'text-primary-200' },
    { label: "Today's Revenue", value: formatCurrency(todayRevenue), icon: PieChartIcon, gradient: 'from-warning-500 to-warning-600', textBg: 'text-warning-100', iconBg: 'text-warning-200' },
  ];

  const summaryExtraFilters = (
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
  );

  return (
    <Layout title="Summary Report" subtitle="Comprehensive overview of revenue, expenses, and profit">
      <PrintArea
        ref={printRef}
        businessName="Kaizen Gym"
        title="Summary Report"
        periodLabel={periodLabel}
        generatedAt={generatedAt}
        summaryRows={summaryRows}
      >
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
      </PrintArea>

      <DateRangeExportBar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        dateRangeOptions={REPORT_DATE_RANGE_OPTIONS}
        inputDateFrom={inputDateFrom}
        inputDateTo={inputDateTo}
        onCustomDateFromChange={(v) => { setInputDateFrom(v); setCustomDateFrom(v); }}
        onCustomDateToChange={(v) => { setInputDateTo(v); setCustomDateTo(v); }}
        onApply={handleApply}
        extraFilters={summaryExtraFilters}
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
        <StatsCards stats={summaryStats} variant="gradient" />

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
                    <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={CHART_TOOLTIP_STYLE} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="#22c55e" radius={[4, 4, 0, 0]} cursor={CHART_CURSOR} />
                    <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} cursor={CHART_CURSOR} />
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
                      activeShape={CHART_PIE_ACTIVE}
                    >
                      {expenseByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={CHART_TOOLTIP_STYLE} />
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
                    <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={CHART_TOOLTIP_STYLE} />
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
                    className="p-4 bg-dark-200/80 rounded-xl border-l-4 border-dark-600"
                    style={{ borderLeftColor: categoryColors[index % categoryColors.length] }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-dark-200">{cat.name}</span>
                      <span className="text-sm text-dark-400">{percentage}%</span>
                    </div>
                    <p className="text-2xl font-bold text-dark-100">{formatCurrency(cat.value)}</p>
                    <div className="mt-2 bg-dark-600 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full opacity-90"
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

export default SummaryReportPage;
