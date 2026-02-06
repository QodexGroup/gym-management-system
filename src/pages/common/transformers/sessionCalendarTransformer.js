/**
 * Session Calendar Configuration
 * Transforms session data for CalendarView and CalendarListView display
 */

import { User, Users } from 'lucide-react';
import { SESSION_TYPES, SESSION_TYPE_LABELS } from '../../../constants/sessionSchedulingConstants';

/**
 * Transform sessions for CalendarView and CalendarListView
 * @param {Array} sessions - Array of filtered session objects
 * @param {Object} handlers - Object containing handler functions
 * @param {Function} handlers.onSessionClick - Handler for session click
 * @param {Function} handlers.onEditGroupClassSession - Handler for editing group class session
 * @param {Function} handlers.onEditPtSession - Handler for editing PT session
 * @param {Function} handlers.onCancelSession - Handler for canceling session
 * @param {Function} handlers.onCancelBooking - Handler for canceling booking
 * @returns {Array} Transformed array of sessions with title, subtitle, meta, actions, and status
 */
export const transformSessionsForCalendar = (sessions, handlers) => {
  const {
    onSessionClick,
    onEditGroupClassSession,
    onEditPtSession,
    onCancelSession,
    onCancelBooking,
    allowMemberAttendance = false,
  } = handlers;

  return sessions.map((session) => {
    const isCoachGroupClass = session.type === SESSION_TYPES.COACH_GROUP_CLASS;
    const isMemberGroupClass = session.type === SESSION_TYPES.MEMBER_GROUP_CLASS;
    const isCoachPT = session.type === SESSION_TYPES.COACH_PT;
    const isMemberPT = session.type === SESSION_TYPES.MEMBER_PT;
    
    let title = '';
    let subtitle = '';
    const meta = [];

    if (isCoachGroupClass) {
      // Coach Group Class: Show class name as title, coach and enrollment in meta
      title = session.className || SESSION_TYPE_LABELS[SESSION_TYPES.COACH_GROUP_CLASS]?.replace(' Schedule', '') || 'Group Class';
      if (session.coach) {
        const coachName = session.coach.fullname || `${session.coach.firstname || ''} ${session.coach.lastname || ''}`.trim();
        meta.push({
          icon: User,
          label: `Coach: ${coachName}`,
        });
      }
      if (session.attendanceCount !== undefined && session.capacity !== undefined) {
        meta.push({
          icon: Users,
          label: `${session.attendanceCount}/${session.capacity} enrolled`,
        });
      }
    } else if (isMemberGroupClass) {
      // Member Group Class Booking: Show client name as title, class name as subtitle, coach only (no enrollment)
      if (session.customer) {
        title = `${session.customer.firstName || ''} ${session.customer.lastName || ''}`.trim() || 'Member';
      } else {
        title = 'Member Booking';
      }
      subtitle = session.className || SESSION_TYPE_LABELS[SESSION_TYPES.COACH_GROUP_CLASS]?.replace(' Schedule', '') || 'Group Class';
      if (session.coach) {
        const coachName = session.coach.fullname || `${session.coach.firstname || ''} ${session.coach.lastname || ''}`.trim();
        meta.push({
          icon: User,
          label: `Coach: ${coachName}`,
        });
      }
    } else if (isCoachPT) {
      // Coach PT: Can be from class schedule OR from PT booking
      // If it has sessionId, it's from class schedule - show like group class (className, coach, enrollment)
      // If it has customer, it's from PT booking - show customer name
      if (session.sessionId) {
        // This is a class schedule PT session - display like group class
        title = session.className || SESSION_TYPE_LABELS[SESSION_TYPES.COACH_PT]?.replace(' Schedule', '') || 'PT Session';
        if (session.coach) {
          const coachName = session.coach.fullname || `${session.coach.firstname || ''} ${session.coach.lastname || ''}`.trim();
          meta.push({
            icon: User,
            label: `Coach: ${coachName}`,
          });
        }
        if (session.attendanceCount !== undefined && session.capacity !== undefined) {
          meta.push({
            icon: Users,
            label: `${session.attendanceCount}/${session.capacity} enrolled`,
          });
        }
      } else if (session.customer) {
        // This is a PT booking - show customer name as title, coach as subtitle
        title = `${session.customer.firstName || ''} ${session.customer.lastName || ''}`.trim() || SESSION_TYPE_LABELS[SESSION_TYPES.MEMBER_PT]?.replace(' Schedule', '') || 'PT Session';
        if (session.coach) {
          const coachName = session.coach.fullname || `${session.coach.firstname || ''} ${session.coach.lastname || ''}`.trim();
          subtitle = coachName;
        }
      } else {
        // Fallback
        title = SESSION_TYPE_LABELS[SESSION_TYPES.COACH_PT]?.replace(' Schedule', '') || 'PT Session';
        if (session.coach) {
          const coachName = session.coach.fullname || `${session.coach.firstname || ''} ${session.coach.lastname || ''}`.trim();
          subtitle = coachName;
        }
      }
    } else if (isMemberPT) {
      // Member PT: Show customer name as title, coach as subtitle
      if (session.customer) {
        title = `${session.customer.firstName || ''} ${session.customer.lastName || ''}`.trim() || SESSION_TYPE_LABELS[SESSION_TYPES.MEMBER_PT]?.replace(' Schedule', '') || 'PT Session';
      } else {
        title = SESSION_TYPE_LABELS[SESSION_TYPES.MEMBER_PT]?.replace(' Schedule', '') || 'PT Session';
      }
      if (session.coach) {
        const coachName = session.coach.fullname || `${session.coach.firstname || ''} ${session.coach.lastname || ''}`.trim();
        subtitle = coachName;
      }
    }

    const actions = {};

    if (!isMemberGroupClass && !isMemberPT) {
      actions.onClick = () => onSessionClick?.(session);
    } else if (allowMemberAttendance) {
      actions.onClick = () => onSessionClick?.(session);
    }

    if (isCoachGroupClass) {
      actions.onEdit = () => onEditGroupClassSession?.(session);
      actions.onMarkAttendance = () => onSessionClick?.(session);
      actions.onCancel = () => onCancelSession?.(session.sessionId);
    } else if (isMemberGroupClass) {
      actions.onEdit = () => onEditGroupClassSession?.(session);
      if (allowMemberAttendance) {
        actions.onMarkAttendance = () => onSessionClick?.(session);
      }
      if (session.bookingId) {
        actions.onCancel = () => onCancelBooking?.(session.bookingId);
      }
    } else if (isCoachPT) {
      // For Coach PT sessions from class schedules (has sessionId), treat like group class
      if (session.sessionId) {
        actions.onEdit = () => onEditGroupClassSession?.(session);
        actions.onMarkAttendance = () => onSessionClick?.(session);
        actions.onCancel = () => onCancelSession?.(session.sessionId);
      } else {
        // For PT bookings, use PT-specific handlers
        actions.onEdit = () => onEditPtSession?.(session);
        actions.onMarkAttendance = () => onSessionClick?.(session);
        actions.onCancel = () => onCancelSession?.(session.id);
      }
    } else if (isMemberPT) {
      // For Member PT sessions (bookings)
      actions.onEdit = () => onEditPtSession?.(session);
      if (allowMemberAttendance) {
        actions.onMarkAttendance = () => onSessionClick?.(session);
      }
      actions.onCancel = () => onCancelSession?.(session.id);
    }

    return {
      ...session,
      title,
      subtitle,
      meta,
      actions,
      status: session.bookingStatus || session.status,
    };
  });
};
