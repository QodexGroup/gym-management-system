import Layout from '../../components/layout/Layout';
import { StatsCards } from '../../components/common';
import DataTable from '../../components/DataTable/DataTable';
import {
  DollarSign,
  CreditCard,
  Award,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
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
} from 'recharts';
import { useMyCollection } from '../../hooks/useMyCollection';
import { CHART_TOOLTIP_STYLE, CHART_CURSOR, CHART_PIE_ACTIVE } from '../../constants/reportConstants';
import { recentPaymentsTableColumns } from './tables/recentPaymentsTable.config';

const MyCollectionPage = () => {
  const { data, isLoading, isError, error } = useMyCollection();

  const trainerStats = data?.trainerStats ?? {
    totalEarnings: 0,
    totalPayments: 0,
    ptPackagesSold: 0,
    averagePayment: 0,
  };
  const weeklyEarnings = data?.weeklyEarnings ?? [];
  const earningsBreakdown = data?.earningsBreakdown ?? [{ name: 'PT Package Sales', value: 0, color: '#0ea5e9' }];
  const monthlyProgress = data?.monthlyProgress ?? [];
  const recentPayments = data?.recentPayments ?? [];

  if (isLoading) {
    return (
      <Layout title="My Collection" subtitle="Track your earnings and performance">
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout title="My Collection" subtitle="Track your earnings and performance">
        <div className="card border-danger-200 bg-danger-50 text-danger-800">
          {error?.message ?? 'Failed to load My Collection data.'}
        </div>
      </Layout>
    );
  }

  // Prepare stats array for StatsCards component
  const stats = [
    {
      label: 'Total Earnings',
      value: formatCurrency(trainerStats.totalEarnings),
      icon: DollarSign,
      gradient: 'from-success-500 to-success-600',
      textBg: 'text-success-100',
      iconBg: 'text-success-200',
      subtitle: 'This month',
      variant: 'gradient',
    },
    {
      label: 'Total Payments',
      value: trainerStats.totalPayments,
      icon: CreditCard,
      gradient: 'from-primary-500 to-primary-600',
      textBg: 'text-primary-100',
      iconBg: 'text-primary-200',
      subtitle: 'This month',
      variant: 'gradient',
    },
    {
      label: 'PT Packages Sold',
      value: trainerStats.ptPackagesSold,
      icon: Award,
      gradient: 'from-accent-500 to-accent-600',
      textBg: 'text-accent-100',
      iconBg: 'text-accent-200',
      subtitle: 'This month',
      variant: 'gradient',
    },
    {
      label: 'Average Payment',
      value: formatCurrency(trainerStats.averagePayment),
      icon: TrendingUp,
      gradient: 'from-warning-500 to-warning-600',
      textBg: 'text-warning-100',
      iconBg: 'text-warning-200',
      subtitle: 'Per payment',
      variant: 'gradient',
    },
  ];

  return (
    <Layout title="My Collection" subtitle="Track your earnings and performance">
      {/* Summary Stats */}
      <StatsCards stats={stats} variant="gradient" columns={4} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Weekly Earnings */}
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-800 mb-4">Weekly Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyEarnings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" stroke="#64748b" fontSize={12} />
                <YAxis yAxisId="left" stroke="#64748b" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar
                  yAxisId="left"
                  dataKey="earnings"
                  name="Earnings ($)"
                  fill="#0ea5e9"
                  radius={[4, 4, 0, 0]}
                  cursor={CHART_CURSOR}
                />
                <Bar
                  yAxisId="right"
                  dataKey="payments"
                  name="Payments"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                  cursor={CHART_CURSOR}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Earnings Breakdown */}
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-800 mb-4">Earnings Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={earningsBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  activeShape={CHART_PIE_ACTIVE}
                >
                  {earningsBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={CHART_TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {earningsBreakdown.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-dark-600">{item.name}</span>
                <span className="text-sm font-medium text-dark-800">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Earnings Trend */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-dark-800 mb-4">
          Monthly Earnings Trend
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={CHART_TOOLTIP_STYLE} />
              <Line
                type="monotone"
                dataKey="earnings"
                name="Earnings"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ fill: '#0ea5e9', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="card">
        <DataTable
          columns={recentPaymentsTableColumns}
          data={recentPayments}
          title="Recent Payments"
          emptyMessage="No payments found"
          loading={isLoading}
        />
      </div>
    </Layout>
  );
};

export default MyCollectionPage;
