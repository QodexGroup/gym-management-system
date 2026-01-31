import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import Layout from '../../components/layout/Layout';
import { Badge } from '../../components/common';
import {
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
  Printer,
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
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useReportCollection } from '../../hooks/useReportCollection';
import { reportService } from '../../services/reportService';
import { exportReportToPdf, exportReportToExcel } from '../../utils/reportPrintExport';
import { BILL_STATUS_LABELS, BILL_STATUS_VARIANTS } from '../../constants/billConstants';
import { REPORT_DATE_RANGE_OPTIONS, getReportDateRange, MAX_REPORT_ROWS } from '../../constants/reportConstants';
import { Alert, Toast } from '../../utils/alert';

const PAYMENT_METHOD_OPTIONS = ['all', 'cash', 'card', 'transfer'];
const CUSTOM_DATE_DEBOUNCE_MS = 5000;

const CollectionReport = () => {
  const navigate = useNavigate();
  const printRef = useRef(null);
  const [dateRange, setDateRange] = useState('this_month');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [inputDateFrom, setInputDateFrom] = useState('');
  const [inputDateTo, setInputDateTo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const debounceFromRef = useRef(null);
  const debounceToRef = useRef(null);

  const { data: reportData, isLoading, isError, error } = useReportCollection({
    dateRange,
    customDateFrom: dateRange === 'custom' ? customDateFrom : undefined,
    customDateTo: dateRange === 'custom' ? customDateTo : undefined,
  });

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

  const todayRevenue = reportData?.todayRevenue ?? 0;
  const membershipDistribution = reportData?.membershipDistribution ?? [];
  const recentTransactions = reportData?.recentTransactions ?? [];
  const totalCollectedFromBills = reportData?.totalCollectedFromBills ?? 0;
  const reportTooLarge = reportData?.reportTooLarge ?? false;
  const totalRows = reportData?.totalRows ?? 0;

  const totalCollected = totalCollectedFromBills;
  const filteredTransactions = useMemo(() => {
    let list = recentTransactions;
    if (paymentMethod !== 'all') {
      list = list.filter((t) => (t.paymentMethod || '').toLowerCase().includes(paymentMethod));
    }
    return list;
  }, [recentTransactions, paymentMethod]);

  const totalTransactions = filteredTransactions.length;
  const averageTransaction = totalTransactions > 0 ? totalCollected / totalTransactions : 0;
  const paymentMethodData = [
    { name: 'Cash', value: totalCollected * 0.5, color: '#22c55e' },
    { name: 'Card', value: totalCollected * 0.3, color: '#0ea5e9' },
    { name: 'Transfer', value: totalCollected * 0.2, color: '#8b5cf6' },
  ].filter((d) => d.value > 0);
  const membershipTypeData = membershipDistribution.map((item) => ({
    name: item.name,
    revenue: (item.value || 0) * 50,
    members: item.value || 0,
  }));
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Collection Report',
  });

  const resolvedDates = getReportDateRange(dateRange, customDateFrom, customDateTo);
  const periodLabel =
    dateRange === 'custom' && customDateFrom && customDateTo
      ? `${customDateFrom} – ${customDateTo}`
      : REPORT_DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label || dateRange;

  const handleEmailReport = async () => {
    try {
      const { start: dateFrom, end: dateTo } = resolvedDates;
      const res = await reportService.emailReport({ reportType: 'collection', dateRange, dateFrom, dateTo });
      Toast.success(res.message || 'Report request submitted. You will receive it by email.');
    } catch (err) {
      Toast.error(err.message || 'Failed to request report');
    }
  };
  const generatedAt = new Date().toLocaleString();
  const summaryRows = [
    ['Total Collected', formatCurrency(totalCollected)],
    ['Transactions', String(totalTransactions)],
    ['Average Transaction', formatCurrency(averageTransaction)],
    ["Today's Revenue", formatCurrency(todayRevenue)],
  ];

  const doExportPdf = () => {
    const headers = ['Date', 'Member', 'Bill Type', 'Paid Amount', 'Status'];
    const rows = filteredTransactions.map((t) => [
      formatDate(t.billDate),
      t.customerName || 'N/A',
      t.billType || 'N/A',
      formatCurrency(t.paidAmount),
      BILL_STATUS_LABELS[t.billStatus] || t.billStatus,
    ]);
    exportReportToPdf({
      title: 'Collection Report',
      periodLabel,
      generatedAt,
      summaryRows,
      headers,
      rows,
      filename: `collection-report-${dateRange}.pdf`,
    });
  };

  const doExportExcel = () => {
    const headers = ['Date', 'Member', 'Bill Type', 'Paid Amount', 'Status'];
    const rows = filteredTransactions.map((t) => [
      formatDate(t.billDate),
      t.customerName || 'N/A',
      t.billType || 'N/A',
      parseFloat(t.paidAmount) || 0,
      BILL_STATUS_LABELS[t.billStatus] || t.billStatus,
    ]);
    exportReportToExcel({
      sheetName: 'Collection',
      title: 'Collection Report',
      periodLabel,
      generatedAt,
      summaryRows,
      headers,
      rows,
      filename: `collection-report-${dateRange}.xlsx`,
    });
  };

  const handleExportPdf = async () => {
    try {
      const { start: dateFrom, end: dateTo } = resolvedDates;
      const res = await reportService.checkExportSize({ reportType: 'collection', dateFrom, dateTo });
      if (res.tooLarge) {
        await Alert.warning(
          'Data is too large',
          'We will send the report to your email (PDF). The full report will be delivered via email.',
          { confirmButtonText: 'OK' }
        );
        await reportService.emailReport({ reportType: 'collection', dateRange, dateFrom, dateTo, format: 'pdf' });
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
      const { start: dateFrom, end: dateTo } = resolvedDates;
      const res = await reportService.checkExportSize({ reportType: 'collection', dateFrom, dateTo });
      if (res.tooLarge) {
        await Alert.warning(
          'Data is too large',
          'We will send the report to your email (Excel). The full report will be delivered via email.',
          { confirmButtonText: 'OK' }
        );
        await reportService.emailReport({ reportType: 'collection', dateRange, dateFrom, dateTo, format: 'excel' });
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
      <Layout title="Collection Report" subtitle="Comprehensive revenue and payment analytics">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout title="Collection Report" subtitle="Comprehensive revenue and payment analytics">
        <div className="card text-center py-12 text-danger-600">{error?.message || 'Failed to load report'}</div>
      </Layout>
    );
  }

  return (
    <Layout title="Collection Report" subtitle="Comprehensive revenue and payment analytics">
      {/* Receipt-style content for print only */}
      <div ref={printRef} className="report-print-only report-print-area p-6">
        <div className="text-center mb-4">
          <p className="font-bold text-lg">Kaizen Gym</p>
          <p className="font-semibold text-base uppercase">Collection Report</p>
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
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="table-header text-left p-2 border border-slate-300">Date</th>
              <th className="table-header text-left p-2 border border-slate-300">Member</th>
              <th className="table-header text-left p-2 border border-slate-300">Bill Type</th>
              <th className="table-header text-left p-2 border border-slate-300">Paid Amount</th>
              <th className="table-header text-left p-2 border border-slate-300">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((payment) => (
              <tr key={payment.id}>
                <td className="p-2 border border-slate-300">{formatDate(payment.billDate)}</td>
                <td className="p-2 border border-slate-300">{payment.customerName || 'N/A'}</td>
                <td className="p-2 border border-slate-300">{payment.billType || 'N/A'}</td>
                <td className="p-2 border border-slate-300">{formatCurrency(payment.paidAmount)}</td>
                <td className="p-2 border border-slate-300">{BILL_STATUS_LABELS[payment.billStatus] || payment.billStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTransactions.length === 0 && (
          <p className="text-center py-4 text-slate-500">No transactions in selected period</p>
        )}
        <p className="text-xs mt-4 text-slate-500">Generated: {generatedAt}</p>
      </div>

      <div className="card mb-6 no-print">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-wrap items-center justify-between gap-4"
        >
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
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="px-4 py-2 bg-transparent border border-dark-200 rounded-lg focus:border-primary-500 outline-none"
                >
                  <option value="all">All Payment Methods</option>
                  <option value="card">Credit Card</option>
                  <option value="cash">Cash</option>
                  <option value="transfer">Bank Transfer</option>
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
        </form>
        </div>

        {reportTooLarge ? (
          <div className="card no-print text-center py-12">
            <p className="text-dark-200 text-lg mb-2">This report has more than {MAX_REPORT_ROWS} rows ({totalRows} total).</p>
            <p className="text-dark-400 mb-4">We will email you the full PDF or Excel report instead.</p>
            <button type="button" onClick={handleEmailReport} className="btn-primary flex items-center gap-2 mx-auto">
              <Mail className="w-4 h-4" /> Email Report (PDF / Excel)
            </button>
          </div>
        ) : (
          <>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 no-print">
          <div className="card bg-gradient-to-br from-success-500 to-success-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-success-100 text-sm">Total Collected</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(totalCollected)}</p>
              </div>
              <DollarSign className="w-12 h-12 text-success-200" />
            </div>
          </div>
          <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 text-sm">Transactions</p>
                <p className="text-3xl font-bold mt-1">{totalTransactions}</p>
              </div>
              <CreditCard className="w-12 h-12 text-primary-200" />
            </div>
          </div>
          <div className="card bg-gradient-to-br from-accent-500 to-accent-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-accent-100 text-sm">Average Transaction</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(averageTransaction)}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-accent-200" />
            </div>
          </div>
          <div className="card bg-gradient-to-br from-warning-500 to-warning-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-warning-100 text-sm">Today&apos;s Revenue</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(todayRevenue)}</p>
              </div>
              <Banknote className="w-12 h-12 text-warning-200" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 no-print">
          <div className="card">
            <h3 className="text-lg font-semibold text-dark-800 mb-4">Payment Method Breakdown</h3>
            <div className="h-72">
              {paymentMethodData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {paymentMethodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-dark-400">No payment data</div>
              )}
            </div>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold text-dark-800 mb-4">Revenue by Membership Type</h3>
            <div className="h-72">
              {membershipTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={membershipTypeData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#64748b" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={100} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-dark-400">No membership data</div>
              )}
            </div>
          </div>
        </div>

        <div className="card no-print">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-dark-800">Transactions</h3>
            <button
              type="button"
              onClick={() => navigate('/members')}
              className="text-primary-600 text-sm font-medium cursor-pointer"
            >
              View All →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-50">
                  <th className="table-header">Date</th>
                  <th className="table-header">Member</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {filteredTransactions.map((payment) => (
                  <tr key={payment.id} className="hover:bg-dark-50">
                    <td className="table-cell">{formatDate(payment.billDate)}</td>
                    <td className="table-cell font-medium">{payment.customerName}</td>
                    <td className="table-cell">{payment.billType || 'N/A'}</td>
                    <td className="table-cell font-semibold text-dark-800">
                      {formatCurrency(payment.paidAmount)}
                    </td>
                    <td className="table-cell">
                      <Badge variant={BILL_STATUS_VARIANTS[payment.billStatus] || 'success'}>
                        {BILL_STATUS_LABELS[payment.billStatus] || payment.billStatus}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTransactions.length === 0 && (
              <p className="text-dark-400 text-center py-8">No transactions in selected period</p>
            )}
          </div>
        </div>
          </>
        )}
    </Layout>
  );
};

export default CollectionReport;
