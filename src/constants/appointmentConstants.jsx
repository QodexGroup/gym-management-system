import React from 'react';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

/**
 * Appointment Status Constants
 */
export const APPOINTMENT_STATUS = {
  CONFIRMED: 'confirmed',
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
};

/**
 * Appointment Status Labels
 */
export const APPOINTMENT_STATUS_LABELS = {
  [APPOINTMENT_STATUS.CONFIRMED]: 'Confirmed',
  [APPOINTMENT_STATUS.PENDING]: 'Pending',
  [APPOINTMENT_STATUS.COMPLETED]: 'Completed',
  [APPOINTMENT_STATUS.CANCELLED]: 'Cancelled',
  [APPOINTMENT_STATUS.NO_SHOW]: 'No Show',
};

/**
 * Appointment Duration Options (value in minutes)
 */
export const APPOINTMENT_DURATION_OPTIONS = [
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2hrs' },
  { value: 240, label: '4hrs' },
];

/**
 * Get duration label by value
 * @param {number} minutes - Duration in minutes
 * @returns {string} Duration label
 */
export const getDurationLabel = (minutes) => {
  const option = APPOINTMENT_DURATION_OPTIONS.find(opt => opt.value === minutes);
  return option ? option.label : `${minutes} minutes`;
};

/**
 * Get status icon component for appointment status
 * @param {string} status - Appointment status
 * @returns {JSX.Element|null} Status icon component
 */
export const getStatusIcon = (status) => {
  switch (status) {
    case APPOINTMENT_STATUS.CONFIRMED: 
      return <CheckCircle className="w-5 h-5 text-success-500" />;
    case APPOINTMENT_STATUS.PENDING: 
      return <AlertCircle className="w-5 h-5 text-warning-500" />;
    case APPOINTMENT_STATUS.CANCELLED: 
      return <XCircle className="w-5 h-5 text-danger-500" />;
    case APPOINTMENT_STATUS.COMPLETED: 
      return <CheckCircle className="w-5 h-5 text-success-500" />;
    case APPOINTMENT_STATUS.NO_SHOW: 
      return <XCircle className="w-5 h-5 text-danger-500" />;
    default: 
      return null;
  }
};


