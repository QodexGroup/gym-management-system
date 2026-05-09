import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import DataTable from '../../components/DataTable';
import { Avatar, Badge } from '../../components/common';
import StatCard from '../../components/common/StatCard';
import { Users, CalendarDays, ChevronRight } from 'lucide-react';
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
        const data = await dashboardService.getUpcomingSessions(50);
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

      <div className="mb-5">
        <DashboardUpcomingSessions
          sessions={sessions}
          loading={sessionsLoading}
          error={sessionsError}
        />
      </div>

      <div className="card !p-3 sm:!p-4 mb-8">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-dark-50 sm:text-base">Assigned PT clients</h3>
            <p className="mt-0.5 truncate text-[11px] text-dark-500">
              Tap a row to open the member profile
            </p>
          </div>
        </div>
        {ptLoading ? (
          <p className="py-5 text-center text-xs text-dark-400">Loading clients…</p>
        ) : ptError ? (
          <div className="py-6 text-center">
            <p className="mb-3 text-danger-500 text-sm">{ptError}</p>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setPtRefresh((n) => n + 1)}
            >
              Retry
            </button>
          </div>
        ) : ptPayload.members.length === 0 ? (
          <p className="py-5 text-center text-xs text-dark-400">No PT clients assigned</p>
        ) : (
          <>
            <ul
              role="list"
              className="overflow-hidden rounded-md border border-dark-600/70 bg-dark-900/20"
            >
              {ptPayload.members.map((member) => (
                <li key={member.id} className="border-b border-dark-700/50 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => navigate(`/members/${member.id}`)}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-2 px-2 py-1 text-left transition-colors hover:bg-dark-700/40 sm:gap-3 sm:px-2.5 sm:py-1"
                  >
                    <Avatar src={member.photo} name={member.name} size="xs" />
                    <div className="min-w-0 py-px">
                      <p className="truncate text-[13px] font-medium leading-tight text-dark-50">{member.name}</p>
                      <p className="truncate text-[11px] leading-tight text-dark-400">{member.membership}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Badge
                        size="sm"
                        className="!px-1.5 !py-px text-[10px]"
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
                      <ChevronRight
                        className="size-3.5 text-dark-500 opacity-0 transition-opacity group-hover:opacity-80"
                        aria-hidden
                      />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            {ptPayload.total > 10 && (
              <div className="mt-4 flex justify-center">
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
