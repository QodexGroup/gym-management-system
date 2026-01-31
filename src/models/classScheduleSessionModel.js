/**
 * Class Schedule Session Model
 * Defines the structure and transformation for class schedule session data
 */

import { format } from 'date-fns';
import { SESSION_TYPES } from '../constants/sessionSchedulingConstants';
import { formatTimeFromDate } from '../utils/formatters';

/**
 * Map class schedule session data from API to component format
 * @param {Object} session - Class schedule session object from API
 * @returns {Object} Transformed session object for component use
 */
export const mapClassScheduleSessionToComponent = (session) => {
  if (!session) return null;
  
  const schedule = session.classSchedule || {};
  
  return {
    id: session.id,
    type: SESSION_TYPES.COACH_GROUP_CLASS,
    startTime: session.startTime,
    endTime: session.endTime,
    sessionDate: session.startTime ? format(new Date(session.startTime), 'yyyy-MM-dd') : '',
    sessionTime: session.startTime ? formatTimeFromDate(session.startTime) : '',
    className: schedule.className,
    coach: schedule.coach,
    coachId: schedule.coachId,
    capacity: schedule.capacity,
    attendanceCount: session.attendanceCount || 0,
    scheduleId: schedule.id,
    sessionId: session.id,
  };
};

/**
 * Map array of class schedule sessions from API to component format
 * @param {Array} sessions - Array of class schedule session objects from API
 * @returns {Array} Array of transformed session objects
 */
export const mapClassScheduleSessionsToComponent = (sessions) => {
  if (!Array.isArray(sessions)) return [];
  
  return sessions
    .map(mapClassScheduleSessionToComponent)
    .filter(session => session !== null);
};
