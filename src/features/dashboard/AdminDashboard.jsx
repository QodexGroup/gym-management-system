import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../layout/Layout';
import StatsCards from '../../components/common/StatsCards';
import DataTable from '../../components/DataTable';
import { Avatar, Badge } from '../../components/common';
import {
  Users,
  UserPlus,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency } from '../../shared/utils/formatters';
import { dashboardService } from '../../shared/services/dashboardService';
import DashboardUpcomingSessions from '../../components/dashboard/DashboardUpcomingSessions';
import { useAuth } from '../../shared/context/AuthContext';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isStaff } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState(null);

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

  useEffect(() => {
    let cancelled = false;
    const loadSessions = async () => {
      try {
        setSessionsLoading(true);
        const data = await dashboardService.getUpcomingSessions(50);
        if (!cancelled) {
          setSessions(data?.sessions || []);
          setSessionsError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setSessionsError(err.message || 'Failed to load sessions');
          setSessions([]);
        }
      } finally {
        if (!cancelled) setSessionsLoading(false);
      }
    };
    loadSessions();
    return () => {
      cancelled = true;
    };
  }, []);

  const pageTitle = isStaff ? 'Staff dashboard' : 'Dashboard';
  const pageSubtitle =
    isStaff && user?.fullname
      ? `Welcome, ${user.fullname}. Account overview and today's activity.`
      : isStaff
        ? `Welcome back. Account overview and today's activity.`
        : "Welcome back! Here's what's happening today.";

  if (loading) {
    return (
      <Layout title={pageTitle} subtitle={pageSubtitle}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title={pageTitle} subtitle={pageSubtitle}>
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

  const dashboardStats = [
    {
      title: 'Total Clients',
      value: stats.totalMembers,
      icon: Users,
      trend: 'up',
      trendValue: '+12%',
      color: 'primary',
      subtitle: `${stats.activeMembers} active`,
    },
    {
      title: 'New Registrations',
      value: stats.newRegistrations,
      icon: UserPlus,
      trend: 'up',
      trendValue: '+8%',
      color: 'success',
      subtitle: 'This month',
    },
    {
      title: "Today's Revenue",
      value: formatCurrency(stats.todayRevenue),
      icon: DollarSign,
      color: 'success',
    },
    {
      title: 'Expiring Soon',
      value: stats.expiringMemberships,
      icon: AlertTriangle,
      color: 'warning',
      subtitle: 'Next 7 days',
    },
  ];

  return (
    <Layout title={pageTitle} subtitle={pageSubtitle}>
      <StatsCards stats={dashboardStats} columns={4} dark iconColor="light" />

      <div className="mb-8">
        <DashboardUpcomingSessions
          sessions={sessions}
          loading={sessionsLoading}
          error={sessionsError}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
        {/* Memberships Expiring Soon */}
        <div className="card md:col-span-8">
          <DataTable
            title="Memberships Expiring Soon"
            actionButton={
              <button
                onClick={() => navigate('/members')}
                className="text-sm text-primary-500 hover:text-primary-600 font-medium cursor-pointer"
              >
                View All Members →
              </button>
            }
            columns={[
              {
                key: 'member',
                label: 'Member',
                render: (row) => (
                  <div className="flex items-center gap-3">
                    <Avatar src={row.avatar} name={row.name} size="sm" />
                    <div>
                      <p className="font-medium text-dark-50">{row.name}</p>
                      <p className="text-xs text-dark-400">{row.email}</p>
                    </div>
                  </div>
                ),
              },
              { key: 'membership', label: 'Membership' },
              { key: 'membershipExpiry', label: 'Expiry Date' },
              {
                key: 'membershipStatus',
                label: 'Status',
                render: (row) => (
                  <Badge
                    variant={
                      row.membershipStatus === 'expiring'
                        ? 'warning'
                        : row.membershipStatus === 'expired'
                          ? 'danger'
                          : 'success'
                    }
                  >
                    {row.membershipStatus}
                  </Badge>
                ),
              },
            ]}
            data={stats.expiringMembersList || []}
            onRowClick={(member) => navigate(`/members/${member.id}`)}
            emptyMessage="No memberships expiring in the next 7 days"
          />
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
    </Layout>
  );
};

export default AdminDashboard;
