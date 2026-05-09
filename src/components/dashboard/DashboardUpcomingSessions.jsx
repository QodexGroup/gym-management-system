import { format, parseISO, isToday } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../common';
import { CalendarDays } from 'lucide-react';
import { CLASS_SCHEDULE_TYPE } from '../../constants/classScheduleConstants';

/**
 * @param {Object} props
 * @param {Array} props.sessions
 * @param {boolean} props.loading
 * @param {string|null} props.error
 */
const DashboardUpcomingSessions = ({ sessions = [], loading, error }) => {
  const navigate = useNavigate();
  const titleCls = 'text-dark-50';
  const mutedCls = 'text-dark-400';
  const rowSurfaceCls = 'bg-dark-700/50 border border-dark-600';

  if (loading) {
    return (
      <div className="card">
        <div className={`flex items-center justify-between mb-6`}>
          <h3 className={`text-lg font-semibold ${titleCls}`}>Today&apos;s schedule & upcoming</h3>
        </div>
        <div className={`text-center py-8 ${mutedCls}`}>Loading sessions…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className={`flex items-center justify-between mb-6`}>
          <h3 className={`text-lg font-semibold ${titleCls}`}>Today&apos;s schedule & upcoming</h3>
        </div>
        <p className="text-danger-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary-400 shrink-0" />
          <h3 className={`text-lg font-semibold ${titleCls}`}>Today&apos;s schedule & upcoming</h3>
        </div>
        <button
          type="button"
          onClick={() => navigate('/sessions')}
          className="text-sm text-primary-500 hover:text-primary-600 font-medium cursor-pointer"
        >
          Open calendar →
        </button>
      </div>

      {sessions.length === 0 ? (
        <p className={`text-center py-8 ${mutedCls}`}>No upcoming group or PT sessions</p>
      ) : (
        <div className="space-y-4">
          {sessions.map((s, idx) => {
            const start = s.startTime ? parseISO(s.startTime) : null;
            const prev = idx > 0 ? sessions[idx - 1] : null;
            const prevStart = prev?.startTime ? parseISO(prev.startTime) : null;
            const bucket = start && isToday(start) ? 'today' : 'upcoming';
            const prevBucket = prevStart && isToday(prevStart) ? 'today' : 'upcoming';
            const showHeading = idx === 0 || bucket !== prevBucket;

            const typeLabel =
              s.classType === CLASS_SCHEDULE_TYPE.PERSONAL_TRAINING ? 'PT' : 'Group';
            const typeVariant = s.classType === CLASS_SCHEDULE_TYPE.PERSONAL_TRAINING ? 'accent' : 'primary';

            const participantLine =
              (s.participants && s.participants.length > 0)
                ? s.participants.map((p) => p.name).join(', ')
                : '—';

            return (
              <div key={s.id}>
                {showHeading && (
                  <h4 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${mutedCls}`}>
                    {bucket === 'today' ? 'Today' : 'Upcoming'}
                  </h4>
                )}
                <div
                  className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-4 rounded-xl border ${rowSurfaceCls}`}
                >
                  <div className="flex gap-4 min-w-0">
                    <div className="text-center shrink-0 w-16">
                      {start ? (
                        <>
                          <p className="text-sm font-bold text-primary-400">
                            {format(start, 'h:mm a')}
                          </p>
                          <p className={`text-xs ${mutedCls}`}>{format(start, 'MMM d')}</p>
                        </>
                      ) : (
                        <span className={mutedCls}>—</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className={`font-medium truncate ${titleCls}`}>{s.className || 'Session'}</p>
                        <Badge size="sm" variant={typeVariant}>
                          {typeLabel}
                        </Badge>
                      </div>
                      <p className={`text-sm ${mutedCls}`}>
                        Coach: {s.coach?.fullName || '—'}
                      </p>
                      <p className={`text-sm mt-1 text-dark-300`}>
                        <span className="font-medium text-dark-200">Clients: </span>
                        {participantLine}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DashboardUpcomingSessions;
