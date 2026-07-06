import { useRef, useState, useMemo, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import Layout from '../../layout/Layout';
import { DateRangeExportBar, PrintArea, MessageCard, StatsCards } from '../../components/common';
import DataTable from '../../components/DataTable';
import {
  DollarSign,
  TrendingUp,
  FileText,
  Wallet,
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
import { useMyRevenue } from '../../shared/hooks/useMyRevenue';
import { reportService } from '../../shared/services/reportService';
import { exportReportToPdf, exportReportToExcel } from '../../shared/utils/reportPrintExport';
import { APP_NAME } from '../../shared/constants/appConfig';
import { DEFAULT_REPORT_DATE_FROM, DEFAULT_REPORT_DATE_TO, MAX_REPORT_ROWS, CHART_TOOLTIP_STYLE, CHART_CURSOR, CHART_PIE_ACTIVE } from '../../shared/constants/reportConstants';
import { Alert, Toast } from '../../shared/utils/alert';

const STATUS_COLORS = ['#22c55e', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

const MyRevenuePage = () => {
  const printRef = useRef(null);
  const [dateFrom, setDateFrom] = useState(DEFAULT_REPORT_DATE_FROM);
  const [dateTo, setDateTo] = useState(DEFAULT_REPORT_DATE_TO);
  const [appliedFrom, setAppliedFrom] = useState(DEFAULT_REPORT_DATE_FROM);
  const [appliedTo, setAppliedTo] = useState(DEFAULT_REPORT_DATE_TO);
  const [status, setStatus] = useState('all');

  const { data, isLoading, isError, error } = useMyRevenue({
    dateRange: 'custom',
    customDateFrom: appliedFrom,
    customDateTo: appliedTo,
  });

  const handleApply = useCallback(() => {
    setAppliedFrom(dateFrom);
    setAppliedTo(dateTo);
  }, [dateFrom, dateTo]);

  const trainerStats = data?.trainerStats ?? { totalRevenue: 0, totalBills: 0, ptPackagesSold: 0, averageBill: 0, totalCollected: 0, totalOutstanding: 0 };
  const bills = data?.bills ?? [];
  const reportTooLarge = data?.reportTooLarge ?? false;
  const totalRows = data?.totalRows ?? 0;

  const statusOptions = useMemo(() => {
    const set = new Set(bills.map((b) => b.status).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [bills]);

  const filteredBills = useMemo(() => {
    if (status === 'all') return bills;
    return bills.filter((b) => b.status === status);
  }, [bills, status]);

  const revenueByStatus = useMemo(() => {
    const byStatus = {};
    filteredBills.forEach((b) => {
      const key = (b.status || 'active');
      const label = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
      byStatus[label] = (byStatus[label] || 0) + (parseFloat(b.net) || 0);
    });
    return Object.entries(byStatus)
      .filter(([, v]) => v > 0)
      .map(([name, value], i) => ({ name, value, color: STATUS_COLORS[i % STATUS_COLORS.length] }));
  }, [filteredBills]);

  const topMembers = useMemo(() => {
    const byMember = {};
    filteredBills.forEach((b) => {
      const key = b.member || 'Unknown';
      byMember[key] = (byMember[key] || 0) + (parseFloat(b.net) || 0);
    });
    return Object.entries(byMember)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [filteredBills]);

  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: 'My Revenue Report' });

  const periodLabel = `${appliedFrom} – ${appliedTo}`;
  const rangeLabel = `${appliedFrom}_${appliedTo}`;

  const handleEmailReport = async () => {
    try {
      const res = await reportService.emailReport({ reportType: 'my_revenue', dateRange: 'custom', dateFrom: appliedFrom, dateTo: appliedTo });
      Toast.success(res.message || 'Report request submitted. You will receive it by email.');
    } catch (err) {
      Toast.error(err.message || 'Failed to request report');
    }
  };

  const generatedAt = new Date().toLocaleString();
  const summaryRows = [
    ['Total Revenue (Billed)', formatCurrency(trainerStats.totalRevenue)],
    ['Total Collected', formatCurrency(trainerStats.totalCollected)],
    ['Outstanding Balance', formatCurrency(trainerStats.totalOutstanding)],
    ['Bills', String(trainerStats.totalBills)],
    ['PT Packages Sold', String(trainerStats.ptPackagesSold)],
  ];

  const exportHeaders = ['Date', 'Member', 'Type', 'Gross', 'Discount', 'Net (Revenue)', 'Paid', 'Balance', 'Status'];
  const buildExportRows = (formatMoney) => filteredBills.map((b) => [
    formatDate(b.date),
    b.member || 'N/A',
    b.type || 'N/A',
    formatMoney(b.gross),
    formatMoney(b.discount),
    formatMoney(b.net),
    formatMoney(b.paid),
    formatMoney(b.balance),
    b.status || 'N/A',
  ]);

  const doExportPdf = () => {
    exportReportToPdf({
      title: 'My Revenue Report',
      periodLabel,
      generatedAt,
      summaryRows,
      headers: exportHeaders,
      rows: buildExportRows((v) => formatCurrency(v)),
      filename: `my-revenue-report-${rangeLabel}.pdf`,
    });
  };

  const doExportExcel = () => {
    exportReportToExcel({
      sheetName: 'My Revenue',
      title: 'My Revenue Report',
      periodLabel,
      generatedAt,
      summaryRows,
      headers: exportHeaders,
      rows: buildExportRows((v) => parseFloat(v) || 0),
      filename: `my-revenue-report-${rangeLabel}.xlsx`,
    });
  };

  const handleExportPdf = async () => {
    try {
      const res = await reportService.checkExportSize({ reportType: 'my_revenue', dateFrom: appliedFrom, dateTo: appliedTo });
      if (res.tooLarge) {
        await Alert.warning('Data is too large', 'We will send the report to your email (PDF).', { confirmButtonText: 'OK' });
        await reportService.emailReport({ reportType: 'my_revenue', dateRange: 'custom', dateFrom: appliedFrom, dateTo: appliedTo, format: 'pdf' });
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
      const res = await reportService.checkExportSize({ reportType: 'my_revenue', dateFrom: appliedFrom, dateTo: appliedTo });
      if (res.tooLarge) {
        await Alert.warning('Data is too large', 'We will send the report to your email (Excel).', { confirmButtonText: 'OK' });
        await reportService.emailReport({ reportType: 'my_revenue', dateRange: 'custom', dateFrom: appliedFrom, dateTo: appliedTo, format: 'excel' });
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
      <Layout title="My Revenue" subtitle="Track your billed PT revenue and balance">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout title="My Revenue" subtitle="Track your billed PT revenue and balance">
        <div className="card text-center py-12 text-danger-600">{error?.message || 'Failed to load report'}</div>
      </Layout>
    );
  }

  const filterExtra = (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-dark-400 uppercase tracking-wide">Status</label>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="px-4 py-2.5 bg-dark-700 border border-dark-600 text-dark-50 rounded-lg focus:border-primary-500 outline-none"
      >
        {statusOptions.map((s) => (
          <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</option>
        ))}
      </select>
    </div>
  );

  const stats = [
    { label: 'Total Revenue (Billed)', value: formatCurrency(trainerStats.totalRevenue), icon: TrendingUp, gradient: 'from-accent-500 to-accent-600', textBg: 'text-accent-100', iconBg: 'text-accent-200' },
    { label: 'Total Collected', value: formatCurrency(trainerStats.totalCollected), icon: DollarSign, gradient: 'from-success-500 to-success-600', textBg: 'text-success-100', iconBg: 'text-success-200' },
    { label: 'Outstanding Balance', value: formatCurrency(trainerStats.totalOutstanding), icon: Wallet, gradient: 'from-warning-500 to-warning-600', textBg: 'text-warning-100', iconBg: 'text-warning-200' },
    { label: 'Bills', value: trainerStats.totalBills, icon: FileText, gradient: 'from-primary-500 to-primary-600', textBg: 'text-primary-100', iconBg: 'text-primary-200' },
  ];

  const revenueColumns = [
    { key: 'date', label: 'Date', render: (row) => formatDate(row.date) },
    { key: 'member', label: 'Member', render: (row) => <span className="font-medium">{row.member || 'N/A'}</span> },
    { key: 'type', label: 'Type', render: (row) => row.type || 'N/A' },
    { key: 'gross', label: 'Gross', render: (row) => formatCurrency(row.gross) },
    { key: 'discount', label: 'Discount', render: (row) => formatCurrency(row.discount) },
    { key: 'net', label: 'Net (Revenue)', render: (row) => <span className="font-semibold text-dark-50">{formatCurrency(row.net)}</span> },
    { key: 'paid', label: 'Paid', render: (row) => formatCurrency(row.paid) },
    { key: 'balance', label: 'Balance', render: (row) => formatCurrency(row.balance) },
    { key: 'status', label: 'Status', render: (row) => row.status || 'N/A' },
  ];

  return (
    <Layout title="My Revenue" subtitle="Track your billed PT revenue and balance">
      <PrintArea
        ref={printRef}
        businessName={APP_NAME}
        title="My Revenue Report"
        periodLabel={periodLabel}
        generatedAt={generatedAt}
        summaryRows={summaryRows}
      >
        <DataTable
          columns={revenueColumns}
          data={filteredBills}
          keyField="id"
          emptyMessage="No bills in selected period"
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
              <h3 className="text-lg font-semibold text-dark-50 mb-4">Revenue by Bill Status</h3>
              <div className="h-72">
                {revenueByStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenueByStatus}
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
                        {revenueByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={CHART_TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-dark-400">No revenue data</div>
                )}
              </div>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold text-dark-50 mb-4">Top Members by Revenue</h3>
              <div className="h-72">
                {topMembers.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topMembers} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" stroke="#64748b" fontSize={12} />
                      <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={100} />
                      <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={CHART_TOOLTIP_STYLE} />
                      <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} cursor={CHART_CURSOR} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-dark-400">No member data</div>
                )}
              </div>
            </div>
          </div>

          <DataTable
            columns={revenueColumns}
            data={filteredBills}
            keyField="id"
            title="My Revenue"
            wrapperClassName="card no-print"
            emptyMessage="No bills in selected period"
          />
        </>
      )}
    </Layout>
  );
};

export default MyRevenuePage;
