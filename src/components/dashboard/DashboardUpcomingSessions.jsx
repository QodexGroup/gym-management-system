import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import DataTable from '../DataTable';
import { Badge } from '../common';
import { CalendarDays, Users, Dumbbell } from 'lucide-react';
import { CLASS_SCHEDULE_TYPE } from '../../shared/constants/classScheduleConstants';

/* ─── helpers ─── */
const fmtTime = (iso) => {
  try { return format(parseISO(iso), 'h:mm a'); } catch { return '—'; }
};
const fmtDate = (iso) => {
  try { return format(parseISO(iso), 'MMM d'); } catch { return '—'; }
};

/* ─── resolve coach name from API shape: fullname | firstname + lastname ─── */
const coachName = (coach) =>
  coach?.fullname ||
  `${coach?.firstname || ''} ${coach?.lastname || ''}`.trim() ||
  '—';

/* ─── shared "Date & Time" column ─── */
const dateTimeCol = {
  key: 'startTime',
  label: 'Date & Time',
  render: (s) => (
    <div>
      <p className="font-medium text-dark-50 text-sm">{fmtTime(s.startTime)}</p>
      <p className="text-xs text-dark-400 mt-0.5">{fmtDate(s.startTime)}</p>
    </div>
  ),
};

/* ─── Group Schedule columns ─── */
const groupColumns = [
  dateTimeCol,
  {
    key: 'className',
    label: 'Class',
    render: (s) => (
      <span className="font-medium text-dark-50 text-sm">{s.className || '—'}</span>
    ),
  },
  {
    key: 'coach',
    label: 'Coach',
    render: (s) => (
      <span className="text-sm text-dark-200">{coachName(s.coach)}</span>
    ),
  },
  {
    key: 'participants',
    label: 'Clients',
    render: (s) => {
      const count = s.participants?.length ?? 0;
      return (
        <Badge variant={count > 0 ? 'primary' : 'default'}>
          {count} enrolled
        </Badge>
      );
    },
  },
];

/* ─── PT Training columns ─── */
const ptColumns = [
  dateTimeCol,
  {
    key: 'client',
    label: 'Client',
    render: (s) => {
      const names = s.participants?.map((p) => p.name).join(', ') || '—';
      return <span className="text-sm text-dark-50">{names}</span>;
    },
  },
  {
    key: 'coach',
    label: 'Coach',
    render: (s) => (
      <span className="text-sm text-dark-200">{coachName(s.coach)}</span>
    ),
  },
];

/* ─── Sub-panel heading ─── */
const PanelHeading = ({ icon: Icon, label, count }) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon className="w-4 h-4 text-primary-400 flex-shrink-0" />
    <h4 className="text-sm font-semibold text-dark-50">{label}</h4>
    {count != null && (
      <Badge variant="default" size="sm">{count}</Badge>
    )}
  </div>
);

/* ─── Main component ─── */
const DashboardUpcomingSessions = ({ sessions = [], loading, error }) => {
  const navigate = useNavigate();

  const { groupSessions, ptSessions } = useMemo(() => ({
    groupSessions: sessions.filter(
      (s) => s.classType !== CLASS_SCHEDULE_TYPE.PERSONAL_TRAINING
    ),
    ptSessions: sessions.filter(
      (s) => s.classType === CLASS_SCHEDULE_TYPE.PERSONAL_TRAINING
    ),
  }), [sessions]);

  return (
    <div className="card">
      {/* Card header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary-400" />
          <h3 className="text-base font-semibold text-dark-50">Upcoming Schedule</h3>
        </div>
        <button
          type="button"
          onClick={() => navigate('/sessions')}
          className="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors"
        >
          View Calendar →
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-10 text-dark-400 text-sm">Loading sessions…</div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="text-center py-10 text-danger-500 text-sm">{error}</div>
      )}

      {/* Two-column split */}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-dark-700">

          {/* ── Group Schedule ── */}
          <div className="pb-6 lg:pb-0 lg:pr-6">
            <PanelHeading
              icon={Users}
              label="Group Schedule"
              count={groupSessions.length}
            />
            <div className="card !p-0 overflow-hidden">
              <DataTable
                columns={groupColumns}
                data={groupSessions}
                loading={false}
                emptyMessage="No upcoming group classes"
              />
            </div>
          </div>

          {/* ── PT Training ── */}
          <div className="pt-6 lg:pt-0 lg:pl-6">
            <PanelHeading
              icon={Dumbbell}
              label="PT Training"
              count={ptSessions.length}
            />
            <div className="card !p-0 overflow-hidden">
              <DataTable
                columns={ptColumns}
                data={ptSessions}
                loading={false}
                emptyMessage="No upcoming PT sessions"
              />
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default DashboardUpcomingSessions;
