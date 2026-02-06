/**
 * Class Session Booking Status Constants
 */

export const BOOKING_STATUS = {
  BOOKED: 'BOOKED',
  ATTENDED: 'ATTENDED',
  NO_SHOW: 'NO_SHOW',
  CANCELLED: 'CANCELLED',
};

export const BOOKING_STATUS_LABELS = {
  [BOOKING_STATUS.BOOKED]: 'Booked',
  [BOOKING_STATUS.ATTENDED]: 'Attended',
  [BOOKING_STATUS.NO_SHOW]: 'No Show',
  [BOOKING_STATUS.CANCELLED]: 'Cancelled',
};

export const BOOKING_STATUS_VARIANTS = {
  [BOOKING_STATUS.BOOKED]: 'default',
  [BOOKING_STATUS.ATTENDED]: 'success',
  [BOOKING_STATUS.NO_SHOW]: 'warning',
  [BOOKING_STATUS.CANCELLED]: 'danger',
};
