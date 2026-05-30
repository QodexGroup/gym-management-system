import { useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import Layout from '../../layout/Layout';
import { DateRangeExportBar, PrintArea, MessageCard, StatsCards } from '../../components/common';
import DataTable from '../../components/DataTable';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
  Mail,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../shared/utils/formatters';
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
import { useReportCollection } from '../../shared/hooks/useReportCollection';
import { reportService } from '../../shared/services/reportService';
import { exportReportToPdf, exportReportToExcel } from '../../shared/utils/reportPrintExport';
import { APP_NAME } from '../../shared/constants/appConfig';
import { DEFAULT_REPORT_DATE_FROM, DEFAULT_REPORT_DATE_TO, MAX_REPORT_ROWS, CHART_TOOLTIP_STYLE, CHART_CURSOR, CHART_PIE_ACTIVE } from '../../shared/constants/reportConstants';
import { Alert, Toast } from '../../shared/utils/alert';

const PAYMENT_METHOD_OPTIONS = ['all', 'cash', 'card', 'transfer'];

const CollectionReportPage = () => {
  const navigate = useNavigate();
  const printRef = useRef(null);
  const [dateFrom, setDateFrom] = useState(DEFAULT_REPORT_DATE_FROM);
  const [dateTo, setDateTo] = useState(DEFAULT_REPORT_DATE_TO);
  const [appliedFrom, setAppliedFrom] = useState(DEFAULT_REPORT_DATE_FROM);
  const [appliedTo, setAppliedTo] = useState(DEFAULT_REPORT_DATE_TO);
  const [paymentMethod, setPaymentMethod] = useState('all');

  const { data: reportData, isLoading, isError, error } = useReportCollection({
    dateRange: 'custom',
    customDateFrom: appliedFrom,
    customDateTo: appliedTo,
  });

  const handleApply = useCallback(() => {
    setAppliedFrom(dateFrom);
    setAppliedTo(dateTo);
  }, [dateFrom, dateTo]);

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
  const paymentMethodData = useMemo(() => {
    const byMethod = {};
    filteredTransactions.forEach((t) => {
      const key = (t.paymentMethod || 'other').toLowerCase();
      const k = key.includes('cash') ? 'Cash' : key.includes('card') ? 'Card' : key.includes('transfer') ? 'Transfer' : 'Other';
      byMethod[k] = (byMethod[k] || 0) + (parseFloat(t.amount) || 0);
    });
    const colors = { Cash: '#22c55e', Card: '#0ea5e9', Transfer: '#8b5cf6', Other: '#64748b' };
    return Object.entries(byMethod)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value, color: colors[name] || colors.Other }));
  }, [filteredTransactions]);
  const membershipTypeData = membershipDistribution.map((item) => ({
    name: item.name,
    revenue: (item.value || 0) * 50,
    members: item.value || 0,
  }));
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Collection Report',
  });

  const periodLabel = `${appliedFrom} – ${appliedTo}`;

  const handleEmailReport = async () => {
    try {
      const res = await reportService.emailReport({ reportType: 'collection', dateRange: 'custom', dateFrom: appliedFrom, dateTo: appliedTo });
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
    const headers = ['Date', 'Member', 'Type', 'Amount', 'Payment Method'];
    const rows = filteredTransactions.map((t) => [
      formatDate(t.paymentDate),
      t.customerName || 'N/A',
      t.billType || 'N/A',
      formatCurrency(t.amount),
      (t.paymentMethod && String(t.paymentMethod)) || 'N/A',
    ]);
    exportReportToPdf({
      title: 'Collection Report',
      periodLabel,
      generatedAt,
      summaryRows,
      headers,
      rows,
      filename: `collection-report-${appliedDateRange}.pdf`,
    });
  };

  const doExportExcel = () => {
    const headers = ['Date', 'Member', 'Type', 'Amount', 'Payment Method'];
    const rows = filteredTransactions.map((t) => [
      formatDate(t.paymentDate),
      t.customerName || 'N/A',
      t.billType || 'N/A',
      parseFloat(t.amount) || 0,
      (t.paymentMethod && String(t.paymentMethod)) || 'N/A',
    ]);
    exportReportToExcel({
      sheetName: 'Collection',
      title: 'Collection Report',
      periodLabel,
      generatedAt,
      summaryRows,
      headers,
      rows,
      filename: `collection-report-${appliedDateRange}.xlsx`,
    });
  };

  const handleExportPdf = async () => {
    try {
      const res = await reportService.checkExportSize({ reportType: 'collection', dateFrom: appliedFrom, dateTo: appliedTo });
      if (res.tooLarge) {
        await Alert.warning('Data is too large', 'We will send the report to your email (PDF).', { confirmButtonText: 'OK' });
        await reportService.emailReport({ reportType: 'collection', dateRange: 'custom', dateFrom: appliedFrom, dateTo: appliedTo, format: 'pdf' });
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
      const res = await reportService.checkExportSize({ reportType: 'collection', dateFrom: appliedFrom, dateTo: appliedTo });
      if (res.tooLarge) {
        await Alert.warning('Data is too large', 'We will send the report to your email (Excel).', { confirmButtonText: 'OK' });
        await reportService.emailReport({ reportType: 'collection', dateRange: 'custom', dateFrom: appliedFrom, dateTo: appliedTo, format: 'excel' });
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
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-dark-400 uppercase tracking-wide">Payment Method</label>
      <select
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value)}
        className="px-4 py-2.5 bg-dark-700 border border-dark-600 text-dark-50 rounded-lg focus:border-primary-500 outline-none"
      >
        <option value="all">All Payment Methods</option>
        <option value="card">Credit Card</option>
        <option value="cash">Cash</option>
        <option value="transfer">Bank Transfer</option>
      </select>
    </div>
  );

  const stats = [
    { label: 'Total Collected', value: formatCurrency(totalCollected), icon: DollarSign, gradient: 'from-success-500 to-success-600', textBg: 'text-success-100', iconBg: 'text-success-200' },
    { label: 'Transactions', value: totalTransactions, icon: CreditCard, gradient: 'from-primary-500 to-primary-600', textBg: 'text-primary-100', iconBg: 'text-primary-200' },
    { label: 'Average Transaction', value: formatCurrency(averageTransaction), icon: TrendingUp, gradient: 'from-accent-500 to-accent-600', textBg: 'text-accent-100', iconBg: 'text-accent-200' },
    { label: "Today's Revenue", value: formatCurrency(todayRevenue), icon: Banknote, gradient: 'from-warning-500 to-warning-600', textBg: 'text-warning-100', iconBg: 'text-warning-200' },
  ];

  const collectionColumns = [
    { key: 'paymentDate', label: 'Date', render: (row) => formatDate(row.paymentDate) },
    { key: 'customerName', label: 'Member', render: (row) => <span className="font-medium">{row.customerName || 'N/A'}</span> },
    { key: 'billType', label: 'Type', render: (row) => row.billType || 'N/A' },
    { key: 'amount', label: 'Amount', render: (row) => <span className="font-semibold text-dark-50">{formatCurrency(row.amount)}</span> },
    { key: 'paymentMethod', label: 'Payment Method', render: (row) => row.paymentMethod ? String(row.paymentMethod) : 'N/A' },
  ];

  return (
    <Layout title="Collection Report" subtitle="Comprehensive revenue and payment analytics">
      <PrintArea
        ref={printRef}
        businessName={APP_NAME}
        title="Collection Report"
        periodLabel={periodLabel}
        generatedAt={generatedAt}
        summaryRows={summaryRows}
      >
        <DataTable
          columns={collectionColumns}
          data={filteredTransactions}
          keyField="id"
          emptyMessage="No transactions in selected period"
        />
      </PrintArea>

      <DateRangeExportBar
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onApply={handleApply}
        extraFilters={filterExtra}
        reportTooLarge={reportTooLarge}
        onEmailReport={handleEmailReport}
        onPrint={handlePrint}
        onExportPdf={handleExportPdf}
        onExportExcel={handleExportExcel}
      />

      {reportTooLarge ? (
        <MessageCard
          message={`This report has more than ${MAX_REPORT_ROWS} rows (${totalRows} total).`}
          description="We will email you the full PDF or Excel report instead."
          actionLabel="Email Report (PDF / Excel)"
          onAction={handleEmailReport}
          icon={Mail}
        />
      ) : (
          <>
        <StatsCards stats={stats} variant="gradient" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 no-print">
          <div className="card">
            <h3 className="text-lg font-semibold text-dark-50 mb-4">Payment Method Breakdown</h3>
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
                      activeShape={CHART_PIE_ACTIVE}
                    >
                      {paymentMethodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={CHART_TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-dark-400">No payment data</div>
              )}
            </div>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold text-dark-50 mb-4">Revenue by Membership Type</h3>
            <div className="h-72">
              {membershipTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={membershipTypeData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#64748b" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={100} />
                    <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={CHART_TOOLTIP_STYLE} />
                    <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} cursor={CHART_CURSOR} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-dark-400">No membership data</div>
              )}
            </div>
          </div>
        </div>

        <DataTable
          columns={collectionColumns}
          data={filteredTransactions}
          keyField="id"
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
          wrapperClassName="card no-print"
          emptyMessage="No transactions in selected period"
        />
          </>
        )}
    </Layout>
  );
};

export default CollectionReportPage;
