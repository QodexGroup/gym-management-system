import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import DataTable from '../../components/DataTable';
import { Avatar, Badge } from '../../components/common';
import StatCard from '../../components/common/StatCard';
import { Users, CalendarDays } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboardService';
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
        const data = await dashboardService.getUpcomingSessions(10);
        if (!cancelled) {
          setSessions(data?.sessions || []);
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
              <p className="font-medium text-dark-800">{row.name}</p>
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
          <p className="text-dark-600 mb-4">{statsError}</p>
          <button type="button" onClick={() => window.location.reload()} className="btn-primary">
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Dashboard" subtitle={subtitle}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Assigned PT clients"
          value={ptLoading ? '—' : ptError ? '—' : ptPayload.total}
          icon={Users}
          color="primary"
          subtitle="Active PT packages with you"
        />
        <StatCard
          title="Sessions today"
          value={sessionsLoading ? '—' : sessionsTodayCount}
          icon={CalendarDays}
          color="accent"
          subtitle="Your schedule"
        />
        <StatCard
          title="Upcoming (list)"
          value={sessionsLoading ? '—' : sessions.length}
          icon={CalendarDays}
          color="success"
          subtitle="Next on your calendar"
        />
      </div>

      <div className="mb-8">
        <DashboardUpcomingSessions
          sessions={sessions}
          loading={sessionsLoading}
          error={sessionsError}
        />
      </div>

      <div className="card mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-dark-800">Assigned PT clients</h3>
        </div>
        {ptLoading ? (
          <p className="text-center text-dark-500 py-8">Loading clients…</p>
        ) : ptError ? (
          <div className="text-center py-8">
            <p className="text-danger-500 mb-4">{ptError}</p>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setPtRefresh((n) => n + 1)}
            >
              Retry
            </button>
          </div>
        ) : ptPayload.members.length === 0 ? (
          <p className="text-center text-dark-500 py-8">No PT clients assigned</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ptPayload.members.map((member) => (
                <button
                  type="button"
                  key={member.id}
                  onClick={() => navigate(`/members/${member.id}`)}
                  className="flex items-center gap-4 p-4 bg-dark-50 rounded-xl hover:bg-dark-100 transition-colors text-left w-full border border-transparent hover:border-primary-200"
                >
                  <Avatar src={member.photo} name={member.name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dark-800 truncate">{member.name}</p>
                    <p className="text-sm text-dark-500">{member.membership}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        size="sm"
                        variant={
                          member.membershipStatus === 'active'
                            ? 'success'
                            : member.membershipStatus === 'expiring'
                              ? 'warning'
                              : 'danger'
                        }
                      >
                        {member.membershipStatus}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {ptPayload.total > 10 && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => navigate('/members?assignedPtCoach=self')}
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {stats && (
        <div className="card">
          <DataTable
            title="Memberships expiring soon"
            actionButton={
              <button
                type="button"
                onClick={() => navigate('/members')}
                className="text-sm text-primary-500 hover:text-primary-600 font-medium cursor-pointer"
              >
                View all members →
              </button>
            }
            columns={expiringColumns}
            data={stats.expiringMembersList || []}
            onRowClick={(member) => navigate(`/members/${member.id}`)}
            emptyMessage="No memberships expiring in the next 7 days"
          />
        </div>
      )}
    </Layout>
  );
};

export default TrainerDashboard;
