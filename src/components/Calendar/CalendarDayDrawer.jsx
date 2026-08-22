import { format } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import { Badge } from '../common/index';
import DataTableActions from '../DataTable/DataTableActions';
import { kindTokens, tonePill } from './calendarTokens';


/** Time-of-day buckets used to break a long day into scannable sections. */
const DAY_PARTS = [
  { label: 'Morning', from: 0, to: 720 },
  { label: 'Afternoon', from: 720, to: 1020 },
  { label: 'Evening', from: 1020, to: 1440 },
];

/**
 * Minutes since midnight for an event's start, used only for bucketing.
 * @param {Object} event
 * @returns {number}
 */
const minutesOfDay = (event) =>
  event.start ? event.start.getHours() * 60 + event.start.getMinutes() : 0;

/**
 * One session row in the coach perspective. Clicking it reveals the roster inline
 * rather than opening a second surface.
 *
 * @param {{ event: Object, isExpanded: boolean, onToggle: (id: string) => void }} props
 * @returns {JSX.Element}
 */
const SessionRow = ({ event, isExpanded, onToggle, RosterSlot }) => {
  const tokens = kindTokens(event.kind);
  const hasRoster = Boolean(RosterSlot && event.expandable);

  return (
    <div className="min-w-0">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={() => hasRoster && onToggle(event.id)}
        onKeyDown={(e) => {
          if (!hasRoster || (e.key !== 'Enter' && e.key !== ' ')) return;
          e.preventDefault();
          onToggle(event.id);
        }}
        className={`flex items-center gap-2.5 rounded-lg border border-transparent p-2 hover:bg-dark-800 hover:border-dark-700 ${
          hasRoster ? 'cursor-pointer' : ''
        }`}
      >
        <span className={`w-0.5 self-stretch rounded-full flex-none ${tokens.rail}`} />
        <div className="w-14 flex-none text-xs font-bold tabular-nums text-dark-200">
          {event.timeLabel}
          {event.endLabel && <span className="block font-medium text-dark-400">{event.endLabel}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-dark-50">{event.title}</p>
          {event.subtitle && <p className="truncate text-xs text-dark-400">{event.subtitle}</p>}
        </div>
        <div className="flex flex-none items-center gap-1.5">
          {event.capacity && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tonePill(event.capacity.tone)}`}>
              {event.capacity.label}
            </span>
          )}
          {event.status && (
            <Badge size="sm" variant={event.status.variant}>
              {event.status.label}
            </Badge>
          )}
          {hasRoster && (
            <ChevronRight
              className={`h-3.5 w-3.5 text-dark-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          )}
          {event.actions?.length > 0 && (
            <DataTableActions items={event.actions} menuPosition="bottom-left" />
          )}
        </div>
      </div>

      {isExpanded && hasRoster && (
        <div className="mb-1.5 ml-4 border-l-2 border-dark-700 py-1 pl-3 sm:ml-[4.5rem]">
          <RosterSlot event={event} />
        </div>
      )}
    </div>
  );
};

/**
 * One person row in the member perspective.
 *
 * @param {{ event: Object }} props
 * @returns {JSX.Element}
 */
const BookingRow = ({ event }) => {
  const tokens = kindTokens(event.kind);
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-transparent p-2 hover:bg-dark-800 hover:border-dark-700">
      <span className={`w-0.5 self-stretch rounded-full flex-none ${tokens.rail}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-dark-50">{event.title}</p>
        {event.subtitle && <p className="truncate text-xs text-dark-400">{event.subtitle}</p>}
      </div>
      <div className="flex flex-none items-center gap-1.5">
        {event.status && (
          <Badge size="sm" variant={event.status.variant}>
            {event.status.label}
          </Badge>
        )}
        {event.actions?.length > 0 && (
          <DataTableActions items={event.actions} menuPosition="bottom-left" />
        )}
      </div>
    </div>
  );
};

/**
 * The inline day detail that opens underneath a week row in the month grid.
 *
 * It is a reveal, not a panel: the header is read-only (date + count) with no add
 * button and no close button. It is dismissed by clicking the same date again, another
 * date, or by changing perspective or view — all of which the parent owns.
 *
 * @param {{
 *   date: Date,
 *   events: Array<Object>,
 *   groupRows?: boolean,
 *   caretColumn?: number,
 *   expandedIds?: Set<string>,
 *   onToggleExpand?: (id: string) => void,
 *   RosterSlot?: Function|null,
 * }} props
 * @returns {JSX.Element}
 */
const CalendarDayDrawer = ({
  date,
  events,
  groupRows = false,
  caretColumn = 0,
  expandedIds = new Set(),
  onToggleExpand = () => {},
  RosterSlot = null,
}) => {
  /* Centre the caret on the clicked cell: cells are 1/7 of the row plus the 6px gap. */
  const caretLeft = `calc(${caretColumn} * (100% + 0.375rem) / 7 + (100% + 0.375rem) / 14 - 0.375rem)`;

  /** Member perspective: bucket the person-rows under the session they belong to. */
  const groups = [];
  if (groupRows) {
    const byGroup = new Map();
    events.forEach((e) => {
      if (!byGroup.has(e.groupKey)) byGroup.set(e.groupKey, []);
      byGroup.get(e.groupKey).push(e);
    });
    byGroup.forEach((rows, groupKey) => groups.push({ groupKey, rows }));
  }

  return (
    <div className="col-span-7 relative my-0.5 rounded-xl border border-dark-700 bg-dark-800/60">
      <span
        className="absolute -top-[7px] h-3 w-3 rotate-45 border-l border-t border-dark-700 bg-dark-800"
        style={{ left: caretLeft }}
      />

      <div className="flex flex-wrap items-center gap-2.5 border-b border-dark-700/60 px-4 py-3">
        <h3 className="text-sm font-bold text-dark-50">{format(date, 'EEEE, MMMM d')}</h3>
        <Badge variant="default" size="sm">
          {events.length} {events.length === 1 ? 'entry' : 'entries'}
        </Badge>
        <span className="ml-auto hidden text-xs text-dark-400 sm:inline">
          Click the date again or pick another to dismiss
        </span>
      </div>

      <div className="max-h-[60vh] overflow-y-auto px-2 pb-3 pt-1 sm:max-h-[19rem]">
        <div className="grid items-start gap-x-5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,20rem),1fr))]">
          {groupRows
            ? groups.map(({ groupKey, rows }) => (
                <div key={groupKey} className="col-span-full">
                  <div
                    className={`mx-1.5 mb-0.5 mt-2 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-bold ${
                      kindTokens(rows[0].kind).chip
                    }`}
                  >
                    <span className="truncate">{rows[0].groupLabel}</span>
                    <span className="ml-auto flex-none text-[10px] opacity-75">
                      {rows.length} {rows.length === 1 ? 'booking' : 'bookings'}
                    </span>
                  </div>
                  <div className="grid items-start gap-x-5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,20rem),1fr))]">
                    {rows.map((e) => (
                      <BookingRow key={e.id} event={e} />
                    ))}
                  </div>
                </div>
              ))
            : DAY_PARTS.map(({ label, from, to }) => {
                const part = events.filter((e) => {
                  const m = minutesOfDay(e);
                  return m >= from && m < to;
                });
                if (!part.length) return null;
                return (
                  <div key={label} className="contents">
                    <p className="col-span-full px-1.5 pb-1 pt-2.5 text-[10px] font-bold uppercase tracking-wider text-dark-400">
                      {label} · {part.length}
                    </p>
                    {part.map((e) => (
                      <SessionRow
                        key={e.id}
                        event={e}
                        isExpanded={expandedIds.has(e.id)}
                        onToggle={onToggleExpand}
                        RosterSlot={RosterSlot}
                      />
                    ))}
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
};

export default CalendarDayDrawer;
