import { format, parseISO, isToday } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../common';
import { CalendarDays } from 'lucide-react';
import { CLASS_SCHEDULE_TYPE } from '../../shared/constants/classScheduleConstants';

/**
 * Compact dashboard list: dense rows, minimal chrome, scan-friendly hierarchy.
 *
 * @param {Object} props
 * @param {Array} props.sessions
 * @param {boolean} props.loading
 * @param {string|null} props.error
 */
const DashboardUpcomingSessions = ({ sessions = [], loading, error }) => {
  const navigate = useNavigate();

  const shellCls = 'card !p-3 sm:!p-4';

  const header = (
    <div className="flex items-start justify-between gap-3 mb-2 sm:items-center">
      <div className="flex min-w-0 items-center gap-2">
        <CalendarDays className="size-4 shrink-0 text-primary-400 sm:size-[1.125rem]" aria-hidden />
        <h3 className="text-sm font-semibold leading-tight text-dark-50 sm:text-base">
          Today&apos;s schedule & upcoming
        </h3>
      </div>
      <button
        type="button"
        onClick={() => navigate('/sessions')}
        className="shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-primary-400 underline-offset-2 hover:bg-dark-700/60 hover:text-primary-300 hover:underline sm:text-xs"
      >
        Calendar →
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className={shellCls}>
        {header}
        <p className="py-6 text-center text-xs text-dark-400">Loading sessions…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={shellCls}>
        {header}
        <p className="text-danger-500 text-xs">{error}</p>
      </div>
    );
  }

  return (
    <div className={shellCls}>
      {header}

      {sessions.length === 0 ? (
        <p className="py-5 text-center text-xs text-dark-400">No upcoming group or PT sessions</p>
      ) : (
        <div
          role="list"
          aria-label={`Upcoming sessions, ${sessions.length} total — scroll to see more`}
          className="min-h-0 max-h-[min(24rem,calc(100vh-13rem))] overflow-y-auto overflow-x-hidden scroll-smooth rounded-md border border-dark-600/70 bg-dark-900/20 [scrollbar-color:rgb(71_85_105)_rgb(15_23_42)] [scrollbar-width:thin]"
        >
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
              s.participants && s.participants.length > 0
                ? s.participants.map((p) => p.name).join(', ')
                : '—';
            const coachName = s.coach?.fullName || '—';

            return (
              <div key={s.id} role="listitem" className="border-b border-dark-700/50 last:border-b-0">
                {showHeading && (
                  <div className="sticky top-0 z-[1] border-b border-dark-700/60 bg-dark-800/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-dark-400 backdrop-blur-sm">
                    {bucket === 'today' ? 'Today' : 'Upcoming'}
                  </div>
                )}
                <div className="grid grid-cols-[3rem_minmax(0,1fr)] items-start gap-x-2 px-2 py-1 sm:grid-cols-[4.75rem_minmax(0,1fr)_auto] sm:items-center sm:gap-x-3 sm:px-2.5 sm:py-1">
                  {/* Time */}
                  <div className="pt-px tabular-nums sm:pt-0">
                    {start ? (
                      <div className="leading-none">
                        <span className="block text-[11px] font-bold tracking-tight text-primary-400 sm:text-xs">
                          {format(start, 'h:mm a')}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-dark-500">{format(start, 'MMM d')}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-dark-400">—</span>
                    )}
                  </div>

                  {/* Title + meta (stacked keeps rows short on mobile) */}
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                      <span className="truncate text-[13px] font-medium leading-snug text-dark-50 sm:text-sm">
                        {s.className || 'Session'}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-[11px] leading-snug text-dark-400">
                      <span className="text-dark-500">Coach</span>{' '}
                      <span className="font-medium text-dark-200">{coachName}</span>
                      <span className="text-dark-600" aria-hidden>
                        {' · '}
                      </span>
                      <span className="text-dark-500">Clients</span>{' '}
                      <span className="font-medium text-dark-100">{participantLine}</span>
                    </div>
                  </div>

                  {/* Badge: own column on sm+ to avoid widening the title block */}
                  <div className="col-span-2 flex justify-start pl-[calc(3rem+0.5rem)] sm:col-span-1 sm:justify-self-end sm:pl-0">
                    <Badge size="sm" variant={typeVariant} className="!px-1.5 !py-px text-[10px]">
                      {typeLabel}
                    </Badge>
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
