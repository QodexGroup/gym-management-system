import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../layout/Layout';
import DataTable from '../../components/DataTable';
import { Avatar, Badge } from '../../components/common';
import StatCard from '../../components/common/StatCard';
import { Users, CalendarDays } from 'lucide-react';
import { useAuth } from '../../shared/context/AuthContext';
import { dashboardService } from '../../shared/services/dashboardService';
import DashboardUpcomingSessions from '../../components/dashboard/DashboardUpcomingSessions';
import { isToday, parseISO } from 'date-fns';

const TrainerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  const [ptPayload, setPtPayload] = useState({ members: [], total: 0 });
  const [ptLoading, setPtLoading] = useState(true);
  const [ptError, setPtError] = useState(null);
  const [ptRefresh, setPtRefresh] = useState(0);

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setStatsLoading(true);
        const data = await dashboardService.getDashboardStats();
        if (!cancelled) {
          setStats(data);
          setStatsError(null);
        }
      } catch (e) {
        if (!cancelled) setStatsError(e.message || 'Failed to load dashboard');
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadPt = async () => {
      try {
        setPtLoading(true);
        setPtError(null);
        const data = await dashboardService.getCoachPtClients(10);
        if (!cancelled) {
          setPtPayload({ members: data?.members || [], total: data?.total ?? 0 });
          setPtError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setPtError(e.message || 'Failed to load PT clients');
          setPtPayload({ members: [], total: 0 });
        }
      } finally {
        if (!cancelled) setPtLoading(false);
      }
    };
    loadPt();
    return () => {
      cancelled = true;
    };
  }, [ptRefresh]);

  useEffect(() => {
    let cancelled = false;
    const loadSessions = async () => {
      try {
        setSessionsLoading(true);
        const data = await dashboardService.getUpcomingSessions(50);
        if (!cancelled) {
          const group = data?.groupSessions?.sessions || [];
          const pt = data?.ptSessions?.sessions || [];
          setSessions([...group, ...pt]);
          setSessionsError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setSessionsError(e.message || 'Failed to load sessions');
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

  const sessionsTodayCount = useMemo(() => {
    return sessions.filter((s) => {
      if (!s.startTime) return false;
      return isToday(parseISO(s.startTime));
    }).length;
  }, [sessions]);

  const subtitle = user?.fullname
    ? `Welcome back, ${user.fullname}! Here's your overview.`
    : "Welcome back! Here's your overview.";

  const expiringColumns = useMemo(
    () => [
      {
        key: 'member',
        label: 'Member',
        render: (row) => (
          <div className="flex items-center gap-3">
            <Avatar src={row.avatar} name={row.name} size="sm" />
            <div>
              <p className="font-medium text-dark-50">{row.name}</p>
              <p className="text-xs text-dark-500">{row.email}</p>
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
    ],
    []
  );

  if (statsLoading && !stats && !statsError) {
    return (
      <Layout title="My Dashboard" subtitle={subtitle}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (statsError && !stats) {
    return (
      <Layout title="My Dashboard" subtitle={subtitle}>
        <div className="card text-center py-12">
          <p className="text-dark-200 mb-4">{statsError}</p>
          <button type="button" onClick={() => window.location.reload()} className="btn-primary">
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Dashboard" subtitle={subtitle}>
      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        <StatCard
          title="Assigned PT clients"
          value={ptLoading ? '—' : ptError ? '—' : ptPayload.total}
          icon={Users}
          color="primary"
          subtitle="Active PT packages with you"
          dark
          size="sm"
        />
        <StatCard
          title="Sessions today"
          value={sessionsLoading ? '—' : sessionsTodayCount}
          icon={CalendarDays}
          color="accent"
          subtitle="Your schedule"
          dark
          size="sm"
        />
        <StatCard
          title="Upcoming (list)"
          value={sessionsLoading ? '—' : sessions.length}
          icon={CalendarDays}
          color="success"
          subtitle="Next on your calendar"
          dark
          size="sm"
        />
      </div>

      <div className="mb-6">
        <DashboardUpcomingSessions
          sessions={sessions}
          loading={sessionsLoading}
          error={sessionsError}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Assigned PT Clients */}
        <div className="card">
          <DataTable
            title="Assigned PT Clients"
            actionButton={
              ptPayload.total > 10 ? (
                <button
                  type="button"
                  onClick={() => navigate('/members?assignedPtCoach=self')}
                  className="text-sm text-primary-500 hover:text-primary-400 font-medium cursor-pointer"
                >
                  View all →
                </button>
              ) : null
            }
            columns={[
              {
                key: 'member',
                label: 'Member',
                render: (row) => (
                  <div className="flex items-center gap-3">
                    <Avatar src={row.photo} name={row.name} size="sm" />
                    <div>
                      <p className="font-medium text-dark-50">{row.name}</p>
                      <p className="text-xs text-dark-400">{row.membership}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: 'membershipStatus',
                label: 'Status',
                render: (row) => (
                  <Badge
                    variant={
                      row.membershipStatus === 'active'
                        ? 'success'
                        : row.membershipStatus === 'expiring'
                          ? 'warning'
                          : 'danger'
                    }
                  >
                    {row.membershipStatus}
                  </Badge>
                ),
              },
            ]}
            data={ptPayload.members}
            loading={ptLoading}
            onRowClick={(row) => navigate(`/members/${row.id}`)}
            emptyMessage="No PT clients assigned"
          />
        </div>

        {/* Memberships Expiring Soon */}
        <div className="card">
          <DataTable
            title="Memberships Expiring Soon"
            actionButton={
              <button
                type="button"
                onClick={() => navigate('/members')}
                className="text-sm text-primary-500 hover:text-primary-400 font-medium cursor-pointer"
              >
                View all members →
              </button>
            }
            columns={expiringColumns}
            data={stats?.expiringMembersList || []}
            loading={!stats && statsLoading}
            onRowClick={(member) => navigate(`/members/${member.id}`)}
            emptyMessage="No memberships expiring in the next 7 days"
          />
        </div>
      </div>
    </Layout>
  );
};

export default TrainerDashboard;
