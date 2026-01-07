import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { StatCard, Avatar, Badge } from '../../components/common';
import {
  Users,
  UserPlus,
  Clock,
  DollarSign,
  Calendar,
  TrendingUp,
  Activity,
  CreditCard,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { dashboardService } from '../../services/dashboardService';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getDashboardStats();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <Layout title="Dashboard" subtitle="Welcome back! Here's what's happening today.">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Dashboard" subtitle="Welcome back! Here's what's happening today.">
        <div className="card text-center py-12">
          <AlertTriangle className="w-16 h-16 text-danger-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-dark-50 mb-2">Failed to Load Dashboard</h3>
          <p className="text-dark-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Layout title="Dashboard" subtitle="Welcome back! Here's what's happening today.">
      {/* Stats Grid - First Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Members"
          value={stats.totalMembers}
          icon={Users}
          trend="up"
          trendValue="+12%"
          color="primary"
          subtitle={`${stats.activeMembers} active`}
        />
        <StatCard
          title="New Registrations"
          value={stats.newRegistrations}
          icon={UserPlus}
          trend="up"
          trendValue="+8%"
          color="success"
          subtitle="This month"
        />
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(stats.todayRevenue)}
          icon={DollarSign}
          color="success"
        />
        <StatCard
          title="Expiring Soon"
          value={stats.expiringMemberships}
          icon={AlertTriangle}
          color="warning"
          subtitle="Next 30 days"
        />
        {/* Today's Check-ins - Commented out for future use */}
        {/* <StatCard
          title="Today's Check-ins"
          value={stats.todayCheckIns}
          icon={Clock}
          color="accent"
          subtitle="47 members checked in"
        /> */}
      </div>

      {/* Revenue Stats - Commented out for future use */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(stats.todayRevenue)}
          icon={DollarSign}
          color="success"
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats.monthlyRevenue)}
          icon={TrendingUp}
          trend="up"
          trendValue="+15%"
          color="primary"
        />
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(stats.monthlyExpenses)}
          icon={CreditCard}
          color="danger"
        />
      </div> */}

      {/* Charts Row - Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
        {/* Revenue Overview - Commented out for future use */}
        {/* <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-dark-50">Revenue Overview</h3>
              <p className="text-sm text-dark-400">Monthly revenue vs expenses</p>
            </div>
            <select className="px-3 py-2 text-sm bg-dark-700 border border-dark-600 text-dark-50 rounded-lg focus:border-primary-500 outline-none">
              <option>This Year</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div> */}

        {/* Memberships Expiring Soon */}
        <div className="card md:col-span-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-dark-50">Memberships Expiring Soon</h3>
            <a href="/customers" className="text-sm text-primary-500 hover:text-primary-600 font-medium">
              View All Members →
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-800">
                  <th className="table-header">Member</th>
                  <th className="table-header">Membership</th>
                  <th className="table-header">Expiry Date</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {(stats.expiringMembersList || []).map((member) => (
                  <tr key={member.id} className="hover:bg-dark-700">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <Avatar src={member.avatar} name={member.name} size="sm" />
                        <div>
                          <p className="font-medium text-dark-50">{member.name}</p>
                          <p className="text-xs text-dark-400">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">{member.membership}</td>
                    <td className="table-cell">{member.membershipExpiry}</td>
                    <td className="table-cell">
                      <Badge
                        variant={
                          member.membershipStatus === 'expiring' ? 'warning' : member.membershipStatus === 'expired' ? 'danger' : 'success'
                        }
                      >
                        {member.membershipStatus}
                      </Badge>
                    </td>
                    <td className="table-cell">
                      <button className="btn-primary text-sm py-1.5 px-3">
                        Send Reminder
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Membership Distribution */}
        <div className="card md:col-span-4">
          <h3 className="text-lg font-semibold text-dark-50 mb-6">Membership Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.membershipDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(stats.membershipDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {(stats.membershipDistribution || []).map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-dark-300">{item.name}</span>
                </div>
                <span className="font-medium text-dark-50">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section - Commented out for future use */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Check-ins */}
      {/* <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-dark-50">Today's Check-ins</h3>
            <a href="/check-in" className="text-sm text-primary-500 hover:text-primary-600 font-medium">
              View All →
            </a>
          </div>
          <div className="space-y-4">
            {mockCheckIns.slice(0, 5).map((checkIn) => {
              const member = mockMembers.find((m) => m.id === checkIn.memberId);
              return (
                <div
                  key={checkIn.id}
                  className="flex items-center justify-between p-3 bg-dark-700 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={member?.avatar}
                      name={checkIn.member}
                      size="md"
                      status={checkIn.status === 'checked-in' ? 'online' : 'offline'}
                    />
                    <div>
                      <p className="font-medium text-dark-50">{checkIn.member}</p>
                      <p className="text-xs text-dark-400">{checkIn.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        checkIn.status === 'checked-in'
                          ? 'success'
                          : checkIn.status === 'expected'
                          ? 'primary'
                          : 'default'
                      }
                    >
                      {checkIn.status}
                    </Badge>
                    <Badge variant={checkIn.type === 'appointment' ? 'accent' : 'default'}>
                      {checkIn.type}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div> */}

      {/* Today's Appointments */}
      {/* <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-dark-50">Today's Appointments</h3>
            <a href="/calendar" className="text-sm text-primary-500 hover:text-primary-600 font-medium">
              View Calendar →
            </a>
          </div>
          <div className="space-y-4">
            {mockAppointments
              .filter((apt) => apt.date === '2024-12-09')
              .slice(0, 5)
              .map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-3 bg-dark-700 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-500 rounded-xl flex flex-col items-center justify-center">
                      <span className="text-xs text-white font-medium">
                        {appointment.time}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-dark-50">{appointment.member}</p>
                      <p className="text-xs text-dark-400">
                        {appointment.type} with {appointment.trainer}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      appointment.status === 'confirmed'
                        ? 'success'
                        : appointment.status === 'pending'
                        ? 'warning'
                        : 'default'
                    }
                  >
                    {appointment.status}
                  </Badge>
                </div>
              ))}
          </div>
        </div> */}
      {/* </div> */}
    </Layout>
  );
};

export default AdminDashboard;
