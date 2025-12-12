import { useState } from 'react';
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
  ComposedChart,
} from 'recharts';
import { mockExpenses, mockRevenueData, mockPayments, expenseCategories } from '../../data/mockData';

const SummaryReport = () => {
  const [dateRange, setDateRange] = useState('month');
  const [category, setCategory] = useState('all');

  // Calculate totals
  const totalExpenses = mockExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalRevenue = mockRevenueData[mockRevenueData.length - 1].revenue;
  const totalCollected = mockPayments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = ((netProfit / totalRevenue) * 100).toFixed(1);

  // Expense by category
  const expenseByCategory = expenseCategories.map((cat) => ({
    name: cat,
    value: mockExpenses
      .filter((exp) => exp.category === cat)
      .reduce((sum, exp) => sum + exp.amount, 0),
  })).filter((cat) => cat.value > 0);

  const categoryColors = [
    '#ef4444', '#f59e0b', '#22c55e', '#0ea5e9', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#6366f1'
  ];

  // Monthly expense trend
  const expenseTrendData = [
    { month: 'Jul', expenses: 19500, budget: 20000 },
    { month: 'Aug', expenses: 21000, budget: 20000 },
    { month: 'Sep', expenses: 18500, budget: 20000 },
    { month: 'Oct', expenses: 22000, budget: 22000 },
    { month: 'Nov', expenses: 23000, budget: 22000 },
    { month: 'Dec', expenses: totalExpenses, budget: 24000 },
  ];

  // Profit/Loss data
  const profitLossData = mockRevenueData.map((item) => ({
    month: item.month,
    revenue: item.revenue,
    expenses: item.expenses,
    profit: item.revenue - item.expenses,
  }));

  // Category comparison (current vs previous month)
  const categoryComparison = [
    { category: 'Rent', current: 5000, previous: 5000 },
    { category: 'Salary', current: 12000, previous: 11500 },
    { category: 'Equipment', current: 4500, previous: 2000 },
    { category: 'Utilities', current: 850, previous: 780 },
    { category: 'Marketing', current: 500, previous: 800 },
  ];

  return (
    <Layout title="Summary Report" subtitle="Comprehensive overview of revenue, expenses, and profit">
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
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2 bg-dark-50 border border-dark-200 rounded-lg focus:border-primary-500 outline-none"
            >
              <option value="all">All Categories</option>
              {expenseCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
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
              <p className="text-success-100 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(totalRevenue)}
              </p>
              <p className="text-success-100 text-xs mt-2">This month</p>
            </div>
            <DollarSign className="w-12 h-12 text-success-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-danger-500 to-danger-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-danger-100 text-sm">Total Expenses</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(totalExpenses)}
              </p>
              <p className="text-danger-100 text-xs mt-2 flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4" />
                +8% vs last month
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-danger-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Net Profit</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(netProfit)}
              </p>
              <p className="text-primary-100 text-xs mt-2 flex items-center gap-1">
                {netProfit > 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {profitMargin}% margin
              </p>
            </div>
            <BarChart3 className="w-12 h-12 text-primary-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-warning-500 to-warning-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-warning-100 text-sm">Budget Status</p>
              <p className="text-3xl font-bold mt-1">98%</p>
              <p className="text-warning-100 text-xs mt-2">$480 remaining</p>
            </div>
            <PieChartIcon className="w-12 h-12 text-warning-200" />
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Profit/Loss Trend */}
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-800 mb-4">
            Profit/Loss Overview
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={profitLossData}>
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
                <Legend />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="expenses"
                  name="Expenses"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  name="Profit"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={{ fill: '#0ea5e9', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense by Category */}
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-800 mb-4">
            Expense Distribution
          </h3>
          <div className="h-72">
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
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {expenseByCategory.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={categoryColors[index % categoryColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Expense vs Budget Trend */}
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-800 mb-4">
            Expense vs Budget Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={expenseTrendData}>
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
                <Legend />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Actual"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="budget"
                  name="Budget"
                  stroke="#8b5cf6"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Comparison */}
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-800 mb-4">
            Category Comparison (vs Last Month)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryComparison} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis
                  dataKey="category"
                  type="category"
                  stroke="#64748b"
                  fontSize={11}
                  width={80}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar
                  dataKey="current"
                  name="This Month"
                  fill="#0ea5e9"
                  radius={[0, 4, 4, 0]}
                />
                <Bar
                  dataKey="previous"
                  name="Last Month"
                  fill="#94a3b8"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="card">
        <h3 className="text-lg font-semibold text-dark-800 mb-4">
          Expense Breakdown by Category
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {expenseByCategory.map((cat, index) => {
            const percentage = ((cat.value / totalExpenses) * 100).toFixed(1);
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
                <p className="text-2xl font-bold text-dark-800">
                  {formatCurrency(cat.value)}
                </p>
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
      </div>
    </Layout>
  );
};

export default SummaryReport;

