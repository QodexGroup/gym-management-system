import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import Layout from '../../components/layout/Layout';
import { Badge } from '../../components/common';
import {
  ReportFilterCard,
  ReportStatCards,
  ReportTooLargeCard,
  ReportTable,
  ReportPrintArea,
} from '../../components/reports';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
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

  const filterExtra = (
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
  );

  const stats = [
    { label: 'Total Collected', value: formatCurrency(totalCollected), icon: DollarSign, gradient: 'from-success-500 to-success-600', textBg: 'text-success-100', iconBg: 'text-success-200' },
    { label: 'Transactions', value: totalTransactions, icon: CreditCard, gradient: 'from-primary-500 to-primary-600', textBg: 'text-primary-100', iconBg: 'text-primary-200' },
    { label: 'Average Transaction', value: formatCurrency(averageTransaction), icon: TrendingUp, gradient: 'from-accent-500 to-accent-600', textBg: 'text-accent-100', iconBg: 'text-accent-200' },
    { label: "Today's Revenue", value: formatCurrency(todayRevenue), icon: Banknote, gradient: 'from-warning-500 to-warning-600', textBg: 'text-warning-100', iconBg: 'text-warning-200' },
  ];

  return (
    <Layout title="Collection Report" subtitle="Comprehensive revenue and payment analytics">
      <ReportPrintArea
        ref={printRef}
        businessName="Kaizen Gym"
        title="Collection Report"
        periodLabel={periodLabel}
        generatedAt={generatedAt}
        summaryRows={summaryRows}
      >
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
      </ReportPrintArea>

      <ReportFilterCard
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        inputDateFrom={inputDateFrom}
        inputDateTo={inputDateTo}
        onCustomDateFromChange={(v) => { setInputDateFrom(v); applyCustomFrom(v); }}
        onCustomDateToChange={(v) => { setInputDateTo(v); applyCustomTo(v); }}
        extraFilters={filterExtra}
        reportTooLarge={reportTooLarge}
        onEmailReport={handleEmailReport}
        onPrint={handlePrint}
        onExportPdf={handleExportPdf}
        onExportExcel={handleExportExcel}
      />

      {reportTooLarge ? (
        <ReportTooLargeCard
          totalRows={totalRows}
          maxRows={MAX_REPORT_ROWS}
          onEmailReport={handleEmailReport}
        />
      ) : (
          <>
        <ReportStatCards stats={stats} />

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

        <ReportTable
          title="Transactions"
          actionButton={
            <button
              type="button"
              onClick={() => navigate('/members')}
              className="text-primary-600 text-sm font-medium cursor-pointer"
            >
              View All →
            </button>
          }
          headers={['Date', 'Member', 'Type', 'Amount', 'Status']}
          rows={filteredTransactions}
          keyField="id"
          emptyMessage="No transactions in selected period"
          renderRow={(payment) => [
            formatDate(payment.billDate),
            <span className="font-medium">{payment.customerName}</span>,
            payment.billType || 'N/A',
            <span className="font-semibold text-dark-800">{formatCurrency(payment.paidAmount)}</span>,
            <Badge variant={BILL_STATUS_VARIANTS[payment.billStatus] || 'success'}>
              {BILL_STATUS_LABELS[payment.billStatus] || payment.billStatus}
            </Badge>,
          ]}
        />
          </>
        )}
    </Layout>
  );
};

export default CollectionReport;
