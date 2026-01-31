/**
 * Class Schedule Session Form Model
 * Defines the structure and initial state for class schedule session form data
 */

import { formatDateForInput } from '../utils/formatters';

/**
 * Get initial class schedule session form data
 * @returns {Object} Initial form state
 */
export const getInitialClassScheduleSessionFormData = () => ({
  startDate: '',
  startTime: '',
  duration: '',
});

/**
 * Map class schedule session data from API to form data
 * @param {Object} session - Class schedule session object
 * @returns {Object} Form data object
 */
export const mapClassScheduleSessionToFormData = (session) => {
  if (!session) return getInitialClassScheduleSessionFormData();
  
  // Parse startTime from session
  const startDate = session.startTime ? new Date(session.startTime) : new Date();
  
  // Format date for input (YYYY-MM-DD)
  const dateStr = formatDateForInput(startDate);
  
  // Format time for input (HH:mm) - extract from Date object
  const hours = String(startDate.getHours()).padStart(2, '0');
  const minutes = String(startDate.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;
  
  // Calculate duration in minutes
  const duration = session.startTime && session.endTime
    ? Math.round((new Date(session.endTime) - new Date(session.startTime)) / (1000 * 60))
    : 60;

  return {
    startDate: dateStr,
    startTime: timeStr,
    duration: duration.toString(),
  };
};
