/**
 * Class Schedule Constants
 */

export const SCHEDULE_TYPE = {
  ONE_TIME: 1,
  RECURRING: 2,
};

export const SCHEDULE_TYPE_LABELS = {
  [SCHEDULE_TYPE.ONE_TIME]: 'One-time',
  [SCHEDULE_TYPE.RECURRING]: 'Recurring',
};

export const RECURRING_INTERVAL = {
  WEEKLY: 'WEEKLY',
  BI_WEEKLY: 'BI-WEEKLY',
  MONTHLY: 'MONTHLY',
};

export const RECURRING_INTERVAL_LABELS = {
  [RECURRING_INTERVAL.WEEKLY]: 'Weekly',
  [RECURRING_INTERVAL.BI_WEEKLY]: 'Bi-weekly',
  [RECURRING_INTERVAL.MONTHLY]: 'Monthly',
};

export const CLASS_DURATION_OPTIONS = [
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '1.5 hours', value: 90 },
  { label: '2 hours', value: 120 },
  { label: '3 hours', value: 180 },
];

export const CAPACITY_STATUS = {
  FULL: 'full',
  LOW: 'low',
  AVAILABLE: 'available',
};

export const CAPACITY_STATUS_CONFIG = {
  [CAPACITY_STATUS.FULL]: { color: 'danger', text: 'Full' },
  [CAPACITY_STATUS.LOW]: { color: 'warning', text: null }, // text will be dynamic: `${remaining} spots`
  [CAPACITY_STATUS.AVAILABLE]: { color: 'success', text: null }, // text will be dynamic: `${remaining} spots`
};

/**
 * Get capacity status based on enrolled and capacity
 * @param {number} enrolled - Number of enrolled members
 * @param {number} capacity - Total capacity
 * @returns {Object} - { status, color, text }
 */
export const getCapacityStatus = (enrolled = 0, capacity = 0) => {
  const remaining = capacity - enrolled;

  if (remaining === 0) {
    return { 
      status: CAPACITY_STATUS.FULL, 
      ...CAPACITY_STATUS_CONFIG[CAPACITY_STATUS.FULL] 
    };
  }
  
  if (remaining <= 3) {
    return { 
      status: CAPACITY_STATUS.LOW, 
      color: CAPACITY_STATUS_CONFIG[CAPACITY_STATUS.LOW].color,
      text: `${remaining} spots`
    };
  }
  
  return { 
    status: CAPACITY_STATUS.AVAILABLE, 
    color: CAPACITY_STATUS_CONFIG[CAPACITY_STATUS.AVAILABLE].color,
    text: `${remaining} spots`
  };
};