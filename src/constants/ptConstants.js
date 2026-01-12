/**
 * PT Package Constants
 */

export const PT_TRAINING_STYLES = {
  STRENGTH: 'strength',
  CARDIO: 'cardio',
  WEIGHT_LOSS: 'weight_loss',
  HIIT: 'hiit',
  FLEXIBILITY: 'flexibility',
  CROSSFIT: 'crossfit',
  YOGA: 'yoga',
  PILATES: 'pilates',
};

export const PT_TRAINING_STYLE_LABELS = {
  [PT_TRAINING_STYLES.STRENGTH]: 'Strength & Conditioning',
  [PT_TRAINING_STYLES.CARDIO]: 'Cardio & Endurance',
  [PT_TRAINING_STYLES.WEIGHT_LOSS]: 'Weight Loss Program',
  [PT_TRAINING_STYLES.HIIT]: 'HIIT Training',
  [PT_TRAINING_STYLES.FLEXIBILITY]: 'Flexibility & Mobility',
  [PT_TRAINING_STYLES.CROSSFIT]: 'CrossFit',
  [PT_TRAINING_STYLES.YOGA]: 'Yoga',
  [PT_TRAINING_STYLES.PILATES]: 'Pilates',
};

export const PT_PACKAGE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

export const PT_PACKAGE_STATUS_LABELS = {
  [PT_PACKAGE_STATUS.ACTIVE]: 'Active',
  [PT_PACKAGE_STATUS.INACTIVE]: 'Inactive',
};

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

