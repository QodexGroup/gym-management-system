/**
 * Class Schedule Form Model
 * Defines the structure and initial state for class schedule form data
 */

import { SCHEDULE_TYPE, RECURRING_INTERVAL } from '../constants/classScheduleConstants';

/**
 * Get initial class schedule form data
 * @returns {Object} Initial form state
 */
export const getInitialClassScheduleFormData = () => ({
  className: '',
  description: '',
  coachId: '',
  capacity: '',
  duration: '',
  startDate: '',
  startTime: '',
  scheduleType: SCHEDULE_TYPE.ONE_TIME,
  recurringInterval: RECURRING_INTERVAL.WEEKLY,
  numberOfSessions: '',
});

/**
 * Map class schedule data from API to form data
 * @param {Object} schedule - Class schedule object from API
 * @returns {Object} Form data object
 */
export const mapClassScheduleToFormData = (schedule) => {
  if (!schedule) return getInitialClassScheduleFormData();
  
  const startDate = schedule.startDate ? new Date(schedule.startDate) : null;
  
  return {
    className: schedule.className || '',
    description: schedule.description || '',
    coachId: schedule.coachId?.toString() || '',
    capacity: schedule.capacity?.toString() || '',
    duration: schedule.duration?.toString() || '',
    startDate: startDate ? startDate.toISOString().split('T')[0] : '',
    startTime: startDate ? startDate.toTimeString().slice(0, 5) : '',
    scheduleType: schedule.scheduleType || SCHEDULE_TYPE.ONE_TIME,
    recurringInterval: schedule.recurringInterval || RECURRING_INTERVAL.WEEKLY,
    numberOfSessions: schedule.numberOfSessions?.toString() || '',
  };
};
