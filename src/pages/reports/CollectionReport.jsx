import { useState } from 'react';
import Layout from '../../components/layout/Layout';
import { Badge } from '../../components/common';
import {
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  Banknote,
  Filter,
  Printer,
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
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { mockPayments, mockRevenueData, mockMembershipDistribution } from '../../data/mockData';

const CollectionReport = () => {
  const [dateRange, setDateRange] = useState('month');
  const [paymentMethod, setPaymentMethod] = useState('all');

  // Calculate totals
  const totalCollected = mockPayments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalTransactions = mockPayments.filter((p) => p.status === 'completed').length;
  const averageTransaction = totalCollected / totalTransactions || 0;
  const pendingAmount = mockPayments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  // Payment method breakdown
  const paymentMethodData = [
    {
      name: 'Credit Card',
      value: mockPayments
        .filter((p) => p.method === 'Credit Card' && p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0),
      color: '#0ea5e9',
    },
    {
      name: 'Cash',
      value: mockPayments
        .filter((p) => p.method === 'Cash' && p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0),
      color: '#22c55e',
    },
    {
      name: 'Transfer',
      value: 1500,
      color: '#8b5cf6',
    },
  ];

  // Daily collection data (mock)
  const dailyData = [
    { day: 'Mon', amount: 450 },
    { day: 'Tue', amount: 320 },
    { day: 'Wed', amount: 580 },
    { day: 'Thu', amount: 290 },
    { day: 'Fri', amount: 430 },
    { day: 'Sat', amount: 680 },
    { day: 'Sun', amount: 250 },
  ];

  // Collection by membership type
  const membershipTypeData = mockMembershipDistribution.map((item) => ({
    name: item.name,
    revenue: item.value * 50, // Mock calculation
    members: item.value,
  }));

  return (
    <Layout title="Collection Report" subtitle="Comprehensive revenue and payment analytics">
      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-dark-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 bg-dark-50 border border-dark-200 rounded-lg focus:border-primary-500 outline-none"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="px-4 py-2 bg-dark-50 border border-dark-200 rounded-lg focus:border-primary-500 outline-none"
            >
              <option value="all">All Payment Methods</option>
              <option value="card">Credit Card</option>
              <option value="cash">Cash</option>
              <option value="transfer">Bank Transfer</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button className="btn-primary flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card bg-gradient-to-br from-success-500 to-success-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-success-100 text-sm">Total Collected</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(totalCollected)}
              </p>
              <p className="text-success-100 text-xs mt-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +15% vs last month
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-success-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Transactions</p>
              <p className="text-3xl font-bold mt-1">{totalTransactions}</p>
              <p className="text-primary-100 text-xs mt-2">Completed payments</p>
            </div>
            <CreditCard className="w-12 h-12 text-primary-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-accent-500 to-accent-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-accent-100 text-sm">Average Transaction</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(averageTransaction)}
              </p>
              <p className="text-accent-100 text-xs mt-2">Per payment</p>
            </div>
            <TrendingUp className="w-12 h-12 text-accent-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-warning-500 to-warning-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-warning-100 text-sm">Pending Amount</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(pendingAmount)}
              </p>
              <p className="text-warning-100 text-xs mt-2">Awaiting confirmation</p>
            </div>
            <Banknote className="w-12 h-12 text-warning-200" />
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Revenue Trend */}
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-800 mb-4">
            Monthly Revenue Trend
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0ea5e9"
                  fill="#0ea5e9"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-800 mb-4">
            Payment Method Breakdown
          </h3>
          <div className="h-72">
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
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {paymentMethodData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-dark-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Daily Collection */}
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-800 mb-4">
            Daily Collection (This Week)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="amount" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Membership Type */}
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-800 mb-4">
            Revenue by Membership Type
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={membershipTypeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#64748b"
                  fontSize={11}
                  width={100}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-dark-800">
            Recent Transactions
          </h3>
          <a href="/customers/bills" className="text-primary-600 text-sm font-medium">
            View All →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-50">
                <th className="table-header">Date</th>
                <th className="table-header">Member</th>
                <th className="table-header">Type</th>
                <th className="table-header">Method</th>
                <th className="table-header">Amount</th>
                <th className="table-header">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {mockPayments.slice(0, 5).map((payment) => (
                <tr key={payment.id} className="hover:bg-dark-50">
                  <td className="table-cell">{payment.date}</td>
                  <td className="table-cell font-medium">{payment.member}</td>
                  <td className="table-cell">{payment.type}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      {payment.method === 'Credit Card' && (
                        <CreditCard className="w-4 h-4 text-dark-400" />
                      )}
                      {payment.method === 'Cash' && (
                        <Banknote className="w-4 h-4 text-dark-400" />
                      )}
                      {payment.method}
                    </div>
                  </td>
                  <td className="table-cell font-semibold text-dark-800">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="table-cell">
                    <Badge
                      variant={
                        payment.status === 'completed' ? 'success' : 'warning'
                      }
                    >
                      {payment.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default CollectionReport;
