import { Fragment } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format, isSameDay, isSameMonth, addMonths, subMonths,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays,
} from 'date-fns';
import CalendarEventChip from './CalendarEventChip';
import CalendarDayDrawer from './CalendarDayDrawer';
import { KIND_TOKENS } from './calendarTokens';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** How many chips a cell shows before it collapses to "+N more" (xl and up only). */
const MAX_CHIPS = 3;

/** Dots shown instead of chips below xl, before the cell falls back to a count. */
const MAX_DOTS = 4;

/*
 * Why chips only appear at xl: the grid is seven equal columns inside `main` (p-6) and
 * `.card` (p-6) with 6px gaps — 132px of chrome before the cells get anything. With the
 * sidebar expanded that leaves ~91px per cell at 1024px and ~127px at 1280px. Ninety-one
 * pixels is about five characters of name after the time and the dot, which is how
 * "HIIT Blast" became "H". Below xl the cells show dots and the day drawer carries the
 * detail.
 */

/**
 * Build the 42 cells of a month grid (six weeks, Sunday-first).
 * @param {Date} calendarDate - Any date inside the month being shown
 * @returns {Array<Date>}
 */
const buildMonthDays = (calendarDate) => {
  const start = startOfWeek(startOfMonth(calendarDate));
  const end = endOfWeek(endOfMonth(calendarDate));
  const days = [];
  for (let day = start; day <= end; day = addDays(day, 1)) days.push(day);
  return days;
};

/**
 * Month grid with an inline day drawer.
 *
 * The drawer is rendered as a full-width child of the same grid, injected after the
 * seventh cell of the week that contains the open day — so the detail appears attached
 * to the row you clicked rather than in a separate card.
 *
 * Cells are a fixed height and never grow: at most MAX_CHIPS chips, then "+N more".
 * A day with no entries is inert — it does not open, and clicking it dismisses whatever
 * drawer is showing.
 *
 * @param {{
 *   calendarDate: Date,
 *   onCalendarDateChange: (date: Date) => void,
 *   eventsByDate: Map<string, Array<Object>>,
 *   openDay: string|null,
 *   onOpenDayChange: (dayKey: string|null) => void,
 *   expandedIds?: Set<string>,
 *   onToggleExpand?: (id: string) => void,
 *   groupDrawerRows?: boolean,
 *   RosterSlot?: Function|null,
 * }} props
 * @returns {JSX.Element}
 */
const CalendarMonthView = ({
  calendarDate,
  onCalendarDateChange,
  eventsByDate,
  openDay,
  onOpenDayChange,
  expandedIds = new Set(),
  onToggleExpand = () => {},
  groupDrawerRows = false,
  RosterSlot = null,
}) => {
  const days = buildMonthDays(calendarDate);
  const today = new Date();

  /**
   * Toggle a day open. An empty day never opens — it only dismisses.
   * @param {string} dayKey
   * @param {number} count
   * @returns {void}
   */
  const handleDayClick = (dayKey, count) => {
    if (count === 0) {
      if (openDay) onOpenDayChange(null);
      return;
    }
    onOpenDayChange(openDay === dayKey ? null : dayKey);
  };

  return (
    <div className="card p-3 sm:p-4 xl:p-6">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onCalendarDateChange(subMonths(calendarDate, 1))}
          className="flex-shrink-0 rounded-lg p-2 hover:bg-dark-700"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5 text-dark-300" />
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-lg font-semibold text-dark-50 sm:text-xl">
            {format(calendarDate, 'MMMM yyyy')}
          </h2>
          <button
            type="button"
            onClick={() => onCalendarDateChange(new Date())}
            className="mt-0.5 text-xs font-medium text-primary-500 transition-colors hover:text-primary-400 sm:text-sm"
          >
            Today
          </button>
        </div>
        <button
          type="button"
          onClick={() => onCalendarDateChange(addMonths(calendarDate, 1))}
          className="flex-shrink-0 rounded-lg p-2 hover:bg-dark-700"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5 text-dark-300" />
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7">
        {WEEK_DAYS.map((day) => (
          <div key={day} className="py-2 text-center text-xs font-semibold text-dark-400 sm:text-sm">
            <span className="sm:hidden">{day[0]}</span>
            <span className="hidden sm:inline">{day}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, index) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const events = eventsByDate.get(dayKey) || [];
          const isEmpty = events.length === 0;
          const isOpen = dayKey === openDay;
          const inMonth = isSameMonth(day, calendarDate);
          const isToday = isSameDay(day, today);

          /* The drawer belongs to the week row that holds the open day. */
          const isRowEnd = index % 7 === 6;
          let drawer = null;
          if (isRowEnd && openDay) {
            const rowStart = index - 6;
            const openIndex = days.findIndex(
              (d, i) => i >= rowStart && i <= index && format(d, 'yyyy-MM-dd') === openDay
            );
            const openEvents = eventsByDate.get(openDay) || [];
            if (openIndex !== -1 && openEvents.length > 0) {
              drawer = (
                <CalendarDayDrawer
                  date={days[openIndex]}
                  events={openEvents}
                  groupRows={groupDrawerRows}
                  caretColumn={openIndex - rowStart}
                  expandedIds={expandedIds}
                  onToggleExpand={onToggleExpand}
                  RosterSlot={RosterSlot}
                />
              );
            }
          }

          return (
            <Fragment key={dayKey}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => handleDayClick(dayKey, events.length)}
                className={`flex h-16 flex-col gap-1 overflow-hidden rounded-lg border p-1.5 text-left transition-colors sm:h-20 xl:h-[7.25rem] ${
                  isOpen
                    ? 'border-primary-500 bg-primary-500/10 ring-2 ring-primary-500/30'
                    : inMonth
                    ? 'border-dark-700 bg-dark-800'
                    : 'border-dark-700 bg-dark-900 opacity-60'
                } ${isEmpty ? 'cursor-default' : 'cursor-pointer hover:border-dark-600 hover:bg-dark-700/60'}`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span
                    className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-xs font-semibold sm:h-6 sm:w-6 ${
                      isToday
                        ? 'bg-primary-500 text-white'
                        : inMonth && !isEmpty
                        ? 'text-dark-50'
                        : 'text-dark-400'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {events.length > MAX_CHIPS && (
                    <span className="hidden flex-none rounded bg-dark-700 px-1.5 text-[10px] font-bold text-dark-300 xl:inline-block">
                      {events.length}
                    </span>
                  )}
                </div>

                {/* xl and up: a cell is ~127px or wider, which fits time + name. */}
                <div className="hidden flex-col gap-1 xl:flex">
                  {events.slice(0, MAX_CHIPS).map((event) => (
                    <CalendarEventChip key={event.id} event={event} />
                  ))}
                  {events.length > MAX_CHIPS && (
                    <span className="self-start rounded bg-dark-700 px-1.5 text-[11px] font-semibold text-dark-300">
                      +{events.length - MAX_CHIPS} more
                    </span>
                  )}
                </div>

                {/* Below xl a cell is 82-116px, which cannot hold a legible name. Dots
                    carry the density and the drawer carries the detail. */}
                {!isEmpty && (
                  <div className="flex flex-1 flex-wrap items-center justify-center gap-1 xl:hidden">
                    {events.length > MAX_DOTS ? (
                      <span className="rounded-full bg-dark-700 px-1.5 py-0.5 text-[10px] font-bold text-dark-200">
                        {events.length}
                      </span>
                    ) : (
                      events.map((event) => (
                        <span
                          key={event.id}
                          className={`h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2 ${
                            (KIND_TOKENS[event.kind] || KIND_TOKENS.class).rail
                          }`}
                        />
                      ))
                    )}
                  </div>
                )}
              </button>
              {drawer}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarMonthView;
