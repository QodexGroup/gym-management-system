import Layout from '../../components/layout/Layout';
import { Badge } from '../../components/common';
import {
  DollarSign,
  TrendingUp,
  Target,
  Calendar,
  Users,
  Award,
  ArrowUpRight,
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

const MyCollection = () => {
  // Mock trainer-specific data
  const trainerStats = {
    totalEarnings: 2500,
    sessionsCompleted: 45,
    ptPackagesSold: 3,
    averageSessionRate: 55.56,
    monthlyTarget: 3000,
    targetProgress: 83.3,
  };

  const weeklyEarnings = [
    { week: 'Week 1', sessions: 12, earnings: 580 },
    { week: 'Week 2', sessions: 14, earnings: 720 },
    { week: 'Week 3', sessions: 11, earnings: 650 },
    { week: 'Week 4', sessions: 8, earnings: 550 },
  ];

  const earningsBreakdown = [
    { name: 'PT Sessions', value: 1800, color: '#0ea5e9' },
    { name: 'Package Sales', value: 500, color: '#22c55e' },
    { name: 'Assessments', value: 200, color: '#8b5cf6' },
  ];

  const monthlyProgress = [
    { month: 'Jul', earnings: 2200, target: 2500 },
    { month: 'Aug', earnings: 2400, target: 2500 },
    { month: 'Sep', earnings: 2800, target: 2800 },
    { month: 'Oct', earnings: 2600, target: 3000 },
    { month: 'Nov', earnings: 2900, target: 3000 },
    { month: 'Dec', earnings: 2500, target: 3000 },
  ];

  const recentSessions = [
    { id: 1, member: 'John Smith', type: 'PT Session', date: '2024-12-09', amount: 60 },
    { id: 2, member: 'Jennifer Martinez', type: 'PT Session', date: '2024-12-08', amount: 60 },
    { id: 3, member: 'Michael Brown', type: 'Assessment', date: '2024-12-07', amount: 40 },
    { id: 4, member: 'Emily Davis', type: 'PT Session', date: '2024-12-06', amount: 60 },
    { id: 5, member: 'Sarah Williams', type: 'PT Session', date: '2024-12-05', amount: 60 },
  ];

  return (
    <Layout title="My Collection" subtitle="Track your earnings and performance">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card bg-gradient-to-br from-success-500 to-success-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-success-100 text-sm">Total Earnings</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(trainerStats.totalEarnings)}
              </p>
              <p className="text-success-100 text-xs mt-2 flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4" />
                +12% vs last month
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-success-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Sessions Completed</p>
              <p className="text-3xl font-bold mt-1">{trainerStats.sessionsCompleted}</p>
              <p className="text-primary-100 text-xs mt-2">This month</p>
            </div>
            <Calendar className="w-12 h-12 text-primary-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-accent-500 to-accent-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-accent-100 text-sm">PT Packages Sold</p>
              <p className="text-3xl font-bold mt-1">{trainerStats.ptPackagesSold}</p>
              <p className="text-accent-100 text-xs mt-2">This month</p>
            </div>
            <Award className="w-12 h-12 text-accent-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-warning-500 to-warning-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-warning-100 text-sm">Target Progress</p>
              <p className="text-3xl font-bold mt-1">{trainerStats.targetProgress}%</p>
              <p className="text-warning-100 text-xs mt-2">
                {formatCurrency(trainerStats.monthlyTarget - trainerStats.totalEarnings)} to go
              </p>
            </div>
            <Target className="w-12 h-12 text-warning-200" />
          </div>
        </div>
      </div>

      {/* Target Progress Bar */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-dark-800">Monthly Target Progress</h3>
          <span className="text-sm text-dark-500">
            {formatCurrency(trainerStats.totalEarnings)} / {formatCurrency(trainerStats.monthlyTarget)}
          </span>
        </div>
        <div className="h-4 bg-dark-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-success-500 rounded-full transition-all duration-500"
            style={{ width: `${trainerStats.targetProgress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-sm text-dark-500">
          <span>$0</span>
          <span className="text-success-600 font-medium">
            {trainerStats.targetProgress}% achieved
          </span>
          <span>{formatCurrency(trainerStats.monthlyTarget)}</span>
        </div>
      </div>

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
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="earnings"
                  name="Earnings ($)"
                  fill="#0ea5e9"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="sessions"
                  name="Sessions"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
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
                >
                  {earningsBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
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

      {/* Monthly Progress Chart */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-dark-800 mb-4">
          Monthly Earnings vs Target
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyProgress}>
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
              <Line
                type="monotone"
                dataKey="earnings"
                name="Earnings"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ fill: '#0ea5e9', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="target"
                name="Target"
                stroke="#8b5cf6"
                strokeDasharray="5 5"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-dark-800 mb-4">Recent Sessions</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-50">
                <th className="table-header">Date</th>
                <th className="table-header">Member</th>
                <th className="table-header">Type</th>
                <th className="table-header">Earnings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {recentSessions.map((session) => (
                <tr key={session.id} className="hover:bg-dark-50">
                  <td className="table-cell">{session.date}</td>
                  <td className="table-cell font-medium">{session.member}</td>
                  <td className="table-cell">
                    <Badge variant="primary">{session.type}</Badge>
                  </td>
                  <td className="table-cell font-semibold text-success-600">
                    +{formatCurrency(session.amount)}
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

export default MyCollection;
