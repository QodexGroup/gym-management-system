import { useRef, useState, useMemo, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import Layout from '../../layout/Layout';
import { DateRangeExportBar, PrintArea, MessageCard, StatsCards } from '../../components/common';
import DataTable from '../../components/DataTable';
import {
  DollarSign,
  CreditCard,
  Award,
  TrendingUp,
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
import { useMyCollection } from '../../shared/hooks/useMyCollection';
import { reportService } from '../../shared/services/reportService';
import { exportReportToPdf, exportReportToExcel } from '../../shared/utils/reportPrintExport';
import { APP_NAME } from '../../shared/constants/appConfig';
import { DEFAULT_REPORT_DATE_FROM, DEFAULT_REPORT_DATE_TO, MAX_REPORT_ROWS, CHART_TOOLTIP_STYLE, CHART_CURSOR, CHART_PIE_ACTIVE } from '../../shared/constants/reportConstants';
import { Alert, Toast } from '../../shared/utils/alert';
import {
  PAYMENT_METHOD_FILTER_OPTIONS,
  PAYMENT_METHOD_LABELS,
  formatPaymentMethod,
  normalizePaymentMethod,
} from '../../shared/constants/paymentConstants';

const PAYMENT_METHOD_CHART_COLORS = {
  Cash: '#22c55e',
  Card: '#0ea5e9',
  GCash: '#0066ff',
  'Bank Transfer': '#8b5cf6',
  Other: '#64748b',
};

const MyCollectionPage = () => {
  const printRef = useRef(null);
  const [dateFrom, setDateFrom] = useState(DEFAULT_REPORT_DATE_FROM);
  const [dateTo, setDateTo] = useState(DEFAULT_REPORT_DATE_TO);
  const [appliedFrom, setAppliedFrom] = useState(DEFAULT_REPORT_DATE_FROM);
  const [appliedTo, setAppliedTo] = useState(DEFAULT_REPORT_DATE_TO);
  const [paymentMethod, setPaymentMethod] = useState('all');

  const { data, isLoading, isError, error } = useMyCollection({
    dateRange: 'custom',
    customDateFrom: appliedFrom,
    customDateTo: appliedTo,
  });

  const handleApply = useCallback(() => {
    setAppliedFrom(dateFrom);
    setAppliedTo(dateTo);
  }, [dateFrom, dateTo]);

  const trainerStats = data?.trainerStats ?? { totalEarnings: 0, totalPayments: 0, ptPackagesSold: 0, averagePayment: 0 };
  const transactions = data?.transactions ?? [];
  const reportTooLarge = data?.reportTooLarge ?? false;
  const totalRows = data?.totalRows ?? 0;

  const filteredTransactions = useMemo(() => {
    if (paymentMethod === 'all') return transactions;
    return transactions.filter((t) => normalizePaymentMethod(t.paymentMethod) === paymentMethod);
  }, [transactions, paymentMethod]);

  const paymentMethodData = useMemo(() => {
    const byMethod = {};
    filteredTransactions.forEach((t) => {
      const method = normalizePaymentMethod(t.paymentMethod);
      const k = PAYMENT_METHOD_LABELS[method] || 'Other';
      byMethod[k] = (byMethod[k] || 0) + (parseFloat(t.amount) || 0);
    });
    return Object.entries(byMethod)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({
        name,
        value,
        color: PAYMENT_METHOD_CHART_COLORS[name] || PAYMENT_METHOD_CHART_COLORS.Other,
      }));
  }, [filteredTransactions]);

  const topMembers = useMemo(() => {
    const byMember = {};
    filteredTransactions.forEach((t) => {
      const key = t.member || 'Unknown';
      byMember[key] = (byMember[key] || 0) + (parseFloat(t.amount) || 0);
    });
    return Object.entries(byMember)
      .map(([name, earnings]) => ({ name, earnings }))
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 8);
  }, [filteredTransactions]);

  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: 'My Collection Report' });

  const periodLabel = `${appliedFrom} – ${appliedTo}`;
  const rangeLabel = `${appliedFrom}_${appliedTo}`;

  const handleEmailReport = async () => {
    try {
      const res = await reportService.emailReport({ reportType: 'my_collection', dateRange: 'custom', dateFrom: appliedFrom, dateTo: appliedTo });
      Toast.success(res.message || 'Report request submitted. You will receive it by email.');
    } catch (err) {
      Toast.error(err.message || 'Failed to request report');
    }
  };

  const generatedAt = new Date().toLocaleString();
  const summaryRows = [
    ['Total Earnings', formatCurrency(trainerStats.totalEarnings)],
    ['Total Payments', String(trainerStats.totalPayments)],
    ['PT Packages Sold', String(trainerStats.ptPackagesSold)],
    ['Average Payment', formatCurrency(trainerStats.averagePayment)],
  ];

  const exportHeaders = ['Date', 'Member', 'Type', 'Amount', 'Payment Method'];
  const buildExportRows = (formatMoney) => filteredTransactions.map((t) => [
    formatDate(t.date),
    t.member || 'N/A',
    t.type || 'N/A',
    formatMoney(t.amount),
    formatPaymentMethod(t.paymentMethod),
  ]);

  const doExportPdf = () => {
    exportReportToPdf({
      title: 'My Collection Report',
      periodLabel,
      generatedAt,
      summaryRows,
      headers: exportHeaders,
      rows: buildExportRows((v) => formatCurrency(v)),
      filename: `my-collection-report-${rangeLabel}.pdf`,
    });
  };

  const doExportExcel = () => {
    exportReportToExcel({
      sheetName: 'My Collection',
      title: 'My Collection Report',
      periodLabel,
      generatedAt,
      summaryRows,
      headers: exportHeaders,
      rows: buildExportRows((v) => parseFloat(v) || 0),
      filename: `my-collection-report-${rangeLabel}.xlsx`,
    });
  };

  const handleExportPdf = async () => {
    try {
      const res = await reportService.checkExportSize({ reportType: 'my_collection', dateFrom: appliedFrom, dateTo: appliedTo });
      if (res.tooLarge) {
        await Alert.warning('Data is too large', 'We will send the report to your email (PDF).', { confirmButtonText: 'OK' });
        await reportService.emailReport({ reportType: 'my_collection', dateRange: 'custom', dateFrom: appliedFrom, dateTo: appliedTo, format: 'pdf' });
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
      const res = await reportService.checkExportSize({ reportType: 'my_collection', dateFrom: appliedFrom, dateTo: appliedTo });
      if (res.tooLarge) {
        await Alert.warning('Data is too large', 'We will send the report to your email (Excel).', { confirmButtonText: 'OK' });
        await reportService.emailReport({ reportType: 'my_collection', dateRange: 'custom', dateFrom: appliedFrom, dateTo: appliedTo, format: 'excel' });
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
      <Layout title="My Collection" subtitle="Track your PT earnings and payments">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout title="My Collection" subtitle="Track your PT earnings and payments">
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
        {PAYMENT_METHOD_FILTER_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );

  const stats = [
    { label: 'Total Earnings', value: formatCurrency(trainerStats.totalEarnings), icon: DollarSign, gradient: 'from-success-500 to-success-600', textBg: 'text-success-100', iconBg: 'text-success-200' },
    { label: 'Total Payments', value: trainerStats.totalPayments, icon: CreditCard, gradient: 'from-primary-500 to-primary-600', textBg: 'text-primary-100', iconBg: 'text-primary-200' },
    { label: 'PT Packages Sold', value: trainerStats.ptPackagesSold, icon: Award, gradient: 'from-accent-500 to-accent-600', textBg: 'text-accent-100', iconBg: 'text-accent-200' },
    { label: 'Average Payment', value: formatCurrency(trainerStats.averagePayment), icon: TrendingUp, gradient: 'from-warning-500 to-warning-600', textBg: 'text-warning-100', iconBg: 'text-warning-200' },
  ];

  const collectionColumns = [
    { key: 'date', label: 'Date', render: (row) => formatDate(row.date) },
    { key: 'member', label: 'Member', render: (row) => <span className="font-medium">{row.member || 'N/A'}</span> },
    { key: 'type', label: 'Type', render: (row) => row.type || 'N/A' },
    { key: 'amount', label: 'Amount', render: (row) => <span className="font-semibold text-dark-50">{formatCurrency(row.amount)}</span> },
    { key: 'paymentMethod', label: 'Payment Method', render: (row) => formatPaymentMethod(row.paymentMethod) },
  ];

  return (
    <Layout title="My Collection" subtitle="Track your PT earnings and payments">
      <PrintArea
        ref={printRef}
        businessName={APP_NAME}
        title="My Collection Report"
        periodLabel={periodLabel}
        generatedAt={generatedAt}
        summaryRows={summaryRows}
      >
        <DataTable
          columns={collectionColumns}
          data={filteredTransactions}
          keyField="id"
          emptyMessage="No payments in selected period"
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
              <h3 className="text-lg font-semibold text-dark-50 mb-4">Top Members by Earnings</h3>
              <div className="h-72">
                {topMembers.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topMembers} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" stroke="#64748b" fontSize={12} />
                      <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={100} />
                      <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={CHART_TOOLTIP_STYLE} />
                      <Bar dataKey="earnings" fill="#0ea5e9" radius={[0, 4, 4, 0]} cursor={CHART_CURSOR} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-dark-400">No member data</div>
                )}
              </div>
            </div>
          </div>

          <DataTable
            columns={collectionColumns}
            data={filteredTransactions}
            keyField="id"
            title="My Collection"
            wrapperClassName="card no-print"
            emptyMessage="No payments in selected period"
          />
        </>
      )}
    </Layout>
  );
};

export default MyCollectionPage;
