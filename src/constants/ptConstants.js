/**
 * PT Package Constants
 */

export const CUSTOMER_PT_PACKAGE_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
};

export const CUSTOMER_PT_PACKAGE_STATUS_LABELS = {
  [CUSTOMER_PT_PACKAGE_STATUS.ACTIVE]: 'Active',
  [CUSTOMER_PT_PACKAGE_STATUS.COMPLETED]: 'Completed',
  [CUSTOMER_PT_PACKAGE_STATUS.EXPIRED]: 'Expired',
  [CUSTOMER_PT_PACKAGE_STATUS.CANCELLED]: 'Cancelled',
};

export const CUSTOMER_PT_PACKAGE_STATUS_VARIANTS = {
  [CUSTOMER_PT_PACKAGE_STATUS.ACTIVE]: 'success',
  [CUSTOMER_PT_PACKAGE_STATUS.COMPLETED]: 'primary',
  [CUSTOMER_PT_PACKAGE_STATUS.EXPIRED]: 'default',
  [CUSTOMER_PT_PACKAGE_STATUS.CANCELLED]: 'danger',
};

export const SESSION_STATUS = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
};

export const SESSION_STATUS_LABELS = {
  [SESSION_STATUS.SCHEDULED]: 'Scheduled',
  [SESSION_STATUS.COMPLETED]: 'Completed',
  [SESSION_STATUS.CANCELLED]: 'Cancelled',
  [SESSION_STATUS.NO_SHOW]: 'No Show',
};

export const CLASS_TYPE = {
  GROUP: 'group',
  INDIVIDUAL: 'individual',
};

export const CLASS_TYPE_LABELS = {
  [CLASS_TYPE.GROUP]: 'Group Class',
  [CLASS_TYPE.INDIVIDUAL]: 'Individual Session',
};

export const CLASS_STATUS = {
  ACTIVE: 'active',
  FULL: 'full',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

export const CLASS_STATUS_LABELS = {
  [CLASS_STATUS.ACTIVE]: 'Active',
  [CLASS_STATUS.FULL]: 'Full',
  [CLASS_STATUS.CANCELLED]: 'Cancelled',
  [CLASS_STATUS.COMPLETED]: 'Completed',
};

export const ATTENDANCE_STATUS = {
  ATTENDED: 'attended',
  NO_SHOW: 'no_show',
  ABSENT: 'absent',
};

export const ATTENDANCE_STATUS_LABELS = {
  [ATTENDANCE_STATUS.ATTENDED]: 'Attended',
  [ATTENDANCE_STATUS.NO_SHOW]: 'No Show',
  [ATTENDANCE_STATUS.ABSENT]: 'Absent',
};

export const ATTENDANCE_STATUS_VARIANTS = {
  [ATTENDANCE_STATUS.ATTENDED]: 'success',
  [ATTENDANCE_STATUS.NO_SHOW]: 'warning',
  [ATTENDANCE_STATUS.ABSENT]: 'danger',
};

export const PT_DURATION_OPTIONS = [
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '1.5 hours', value: 90 },
  { label: '2 hours', value: 120 },
  { label: '3 hours', value: 180 },
];
