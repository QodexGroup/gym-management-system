/**
 * Session Scheduling Constants
 */

export const SESSION_TYPES = {
  COACH_GROUP_CLASS: 'coach_group_class',
  MEMBER_GROUP_CLASS: 'member_group_class',
  COACH_PT: 'coach_pt',
  MEMBER_PT: 'member_pt',
};

export const SESSION_TYPE_LABELS = {
  [SESSION_TYPES.COACH_GROUP_CLASS]: 'Coach Group Class Schedule',
  [SESSION_TYPES.MEMBER_GROUP_CLASS]: 'Member Group Class Schedule',
  [SESSION_TYPES.COACH_PT]: 'Coach PT Schedule',
  [SESSION_TYPES.MEMBER_PT]: 'Member PT Schedule',
};

export const VIEW_MODE = {
  CALENDAR: 'calendar',
  LIST: 'list',
};

/**
 * Get filter button color classes based on session type and active state
 * @param {string} sessionType - The session type key
 * @param {boolean} isActive - Whether the filter is active/selected
 * @returns {string} - Tailwind CSS classes for the button
 */
export const getFilterButtonColor = (sessionType, isActive) => {
  if (isActive) {
    switch (sessionType) {
      case SESSION_TYPES.COACH_GROUP_CLASS:
        return 'bg-blue-500 text-white shadow-md';
      case SESSION_TYPES.MEMBER_GROUP_CLASS:
        return 'bg-purple-500 text-white shadow-md';
      case SESSION_TYPES.COACH_PT:
        return 'bg-primary-500 text-white shadow-md';
      case SESSION_TYPES.MEMBER_PT:
        return 'bg-orange-500 text-white shadow-md';
      default:
        return 'bg-primary-500 text-white shadow-md';
    }
  } else {
    switch (sessionType) {
      case SESSION_TYPES.COACH_GROUP_CLASS:
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30';
      case SESSION_TYPES.MEMBER_GROUP_CLASS:
        return 'bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30';
      case SESSION_TYPES.COACH_PT:
        return 'bg-primary-500/20 text-primary-400 border border-primary-500/30 hover:bg-primary-500/30';
      case SESSION_TYPES.MEMBER_PT:
        return 'bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30';
      default:
        return 'bg-dark-700 text-dark-400 hover:bg-dark-600';
    }
  }
};

/**
 * Get session style classes based on session type and status
 * @param {Object} session - The session object with type and status
 * @param {string} session.type - The session type
 * @param {string} session.status - The session status (for PT sessions)
 * @param {Object} SESSION_STATUS - Session status constants (imported from ptConstants)
 * @returns {string} - Tailwind CSS classes for the session
 */
export const getSessionStyle = (session, SESSION_STATUS) => {
  switch (session.type) {
    case SESSION_TYPES.COACH_GROUP_CLASS:
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case SESSION_TYPES.MEMBER_GROUP_CLASS:
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case SESSION_TYPES.COACH_PT:
      if (session.status === SESSION_STATUS.SCHEDULED) {
        return 'bg-primary-500/20 text-primary-400';
      } else if (session.status === SESSION_STATUS.COMPLETED) {
        return 'bg-success-500/20 text-success-400';
      }
      return 'bg-dark-700 text-dark-300';
    case SESSION_TYPES.MEMBER_PT:
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    default:
      return 'bg-dark-700 text-dark-300';
  }
};
