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
        return 'bg-blue-300 text-blue-600 shadow-md';
      case SESSION_TYPES.MEMBER_GROUP_CLASS:
        return 'bg-purple-200 text-purple-600 shadow-md';
      case SESSION_TYPES.COACH_PT:
        return 'bg-primary-200 text-primary-600 shadow-md';
      case SESSION_TYPES.MEMBER_PT:
        return 'bg-orange-200 text-orange-600 shadow-md';
      default:
        return 'bg-primary-200 text-white shadow-md';
    }
  } else {
    switch (sessionType) {
      case SESSION_TYPES.COACH_GROUP_CLASS:
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30';
      case SESSION_TYPES.MEMBER_GROUP_CLASS:
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30';
      case SESSION_TYPES.COACH_PT:
        return 'bg-primary-500/10 text-primary-400 border border-primary-500/30 hover:bg-primary-500/30';
      case SESSION_TYPES.MEMBER_PT:
        return 'bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30';
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
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    case SESSION_TYPES.MEMBER_GROUP_CLASS:
      return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    case SESSION_TYPES.COACH_PT:
      if (session.status === SESSION_STATUS.SCHEDULED) {
        return 'bg-primary-500/10 text-primary-400';
      } else if (session.status === SESSION_STATUS.COMPLETED) {
        return 'bg-success-500/10 text-success-400';
      }
      return 'bg-dark-700 text-dark-300';
    case SESSION_TYPES.MEMBER_PT:
      return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
    default:
      return 'bg-dark-700 text-dark-300';
  }
};

/**
 * Get session color classes for calendar/list views based on session type
 * @param {string} sessionType - The session type
 * @returns {Object} - Object with bg, text, border, and badge color classes
 */
export const getSessionTypeColors = (sessionType) => {
  switch (sessionType) {
    case SESSION_TYPES.COACH_GROUP_CLASS:
      return {
        bg: 'bg-blue-500/10',
        bgSolid: 'bg-blue-500',
        text: 'text-blue-400',
        textSolid: 'text-blue-500',
        border: 'border-blue-500/30',
        borderSolid: 'border-blue-500',
        badge: 'bg-blue-500 text-white',
      };
    case SESSION_TYPES.MEMBER_GROUP_CLASS:
      return {
        bg: 'bg-purple-500/10',
        bgSolid: 'bg-purple-500',
        text: 'text-purple-400',
        textSolid: 'text-purple-500',
        border: 'border-purple-500/30',
        borderSolid: 'border-purple-500',
        badge: 'bg-purple-500 text-white',
      };
    case SESSION_TYPES.COACH_PT:
      return {
        bg: 'bg-primary-500/10',
        bgSolid: 'bg-primary-500',
        text: 'text-primary-400',
        textSolid: 'text-primary-500',
        border: 'border-primary-500/30',
        borderSolid: 'border-primary-500',
        badge: 'bg-primary-500 text-white',
      };
    case SESSION_TYPES.MEMBER_PT:
      return {
        bg: 'bg-orange-500/10',
        bgSolid: 'bg-orange-500',
        text: 'text-orange-400',
        textSolid: 'text-orange-500',
        border: 'border-orange-500/30',
        borderSolid: 'border-orange-500',
        badge: 'bg-orange-500 text-white',
      };
    default:
      return {
        bg: 'bg-dark-700/20',
        bgSolid: 'bg-dark-700',
        text: 'text-dark-300',
        textSolid: 'text-dark-400',
        border: 'border-dark-700',
        borderSolid: 'border-dark-700',
        badge: 'bg-dark-700 text-dark-50',
      };
  }
};