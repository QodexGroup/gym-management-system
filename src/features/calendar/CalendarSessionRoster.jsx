import { Badge } from '../../components/common';
import { useClassSessionBookings } from '../../shared/hooks/useClassSessionBookings';
import {
  BOOKING_STATUS,
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_VARIANTS,
} from '../../shared/constants/classSessionBookingConstants';
import { initialsOf } from './calendarViewModel';

/**
 * The roster revealed when a session row in the day drawer is expanded.
 *
 * It is loaded lazily, one session at a time, which is the whole reason the Coach
 * Schedule perspective can skip fetching every booking in the month up front. The
 * Calendar components receive this as a slot component so the data fetch stays in the
 * feature layer and `components/Calendar` remains presentational.
 *
 * @param {{ event: Object }} props - `event` is a calendar view model row
 * @returns {JSX.Element}
 */
const CalendarSessionRoster = ({ event }) => {
  const { data, isLoading, isError } = useClassSessionBookings(event.sessionId, {
    enabled: Boolean(event.sessionId),
  });

  const bookings = (data || []).filter((booking) => booking.status !== BOOKING_STATUS.CANCELLED);

  if (isLoading) {
    return <p className="py-1 text-xs text-dark-400">Loading roster…</p>;
  }
  if (isError) {
    return <p className="py-1 text-xs text-danger-500">Could not load the roster.</p>;
  }
  if (!bookings.length) {
    return <p className="py-1 text-xs text-dark-400">No one has booked this session yet.</p>;
  }

  return (
    <>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-dark-400">
        Booked members · {bookings.length}
      </p>
      {bookings.map((booking) => {
        const customer = booking.customer || {};
        const name =
          `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown member';
        return (
          <div key={booking.id} className="flex items-center gap-2 py-0.5 text-xs text-dark-200">
            <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-dark-700 text-[9px] font-bold text-dark-200">
              {initialsOf(name)}
            </span>
            <span className="truncate">{name}</span>
            <span className="ml-auto flex-none">
              <Badge size="sm" variant={BOOKING_STATUS_VARIANTS[booking.status] || 'default'}>
                {BOOKING_STATUS_LABELS[booking.status] || booking.status}
              </Badge>
            </span>
          </div>
        );
      })}
    </>
  );
};

export default CalendarSessionRoster;
