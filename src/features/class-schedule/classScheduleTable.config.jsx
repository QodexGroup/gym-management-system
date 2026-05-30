import { Badge } from '../../components/common';
import { createActionColumn } from '../../components/DataTable';
import { Calendar, Clock, Users, UserCog, Edit, Trash } from 'lucide-react';
import {
  SCHEDULE_TYPE_LABELS,
  RECURRING_INTERVAL_LABELS,
  getCapacityStatus,
  CLASS_SCHEDULE_TYPE,
  CLASS_SCHEDULE_TYPE_LABELS,
} from '../../shared/constants/classScheduleConstants';
import { formatDate, formatTimeFromDate } from '../../shared/utils/formatters';

export const getClassScheduleActionItems = ({ schedule, onEdit, onDelete, isTrainer, userId }) => {
  // PT sessions have no actions
  if (schedule.classType === CLASS_SCHEDULE_TYPE.PERSONAL_TRAINING) return [];
  // Trainers can only act on their own schedules
  if (isTrainer && schedule.coachId !== userId) return [];

  return [
    {
      key: 'edit',
      label: 'Edit',
      icon: Edit,
      onClick: () => onEdit?.(schedule),
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash,
      variant: 'danger',
      onClick: () => onDelete?.(schedule.id),
    },
  ];
};

export const classScheduleTableColumns = ({ onEdit, onDelete, isTrainer, userId }) => [
  createActionColumn(
    (schedule) =>
      getClassScheduleActionItems({ schedule, onEdit, onDelete, isTrainer, userId }),
    { menuPosition: 'bottom-left' }
  ),
  {
    key: 'className',
    label: 'Class',
    render: (schedule) => (
      <div>
        <p className="font-medium text-dark-50">{schedule.className}</p>
        {schedule.description && (
          <p className="text-xs text-dark-400 mt-0.5 line-clamp-1">{schedule.description}</p>
        )}
      </div>
    ),
  },
  {
    key: 'coach',
    label: 'Coach',
    render: (schedule) => {
      const coach = schedule.coach;
      if (!coach) return <span className="text-dark-400">—</span>;
      return (
        <div className="flex items-center gap-1.5 text-sm text-dark-200">
          <UserCog className="w-4 h-4 text-dark-400 flex-shrink-0" />
          {coach.firstname} {coach.lastname}
        </div>
      );
    },
  },
  {
    key: 'schedule',
    label: 'Schedule',
    render: (schedule) => {
      if (!schedule.startDate) return <span className="text-dark-400">—</span>;
      return (
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1 text-sm text-dark-200">
            <Calendar className="w-3.5 h-3.5 text-dark-400" />
            {formatDate(schedule.startDate)}
          </span>
          <span className="flex items-center gap-1 text-sm text-dark-200">
            <Clock className="w-3.5 h-3.5 text-dark-400" />
            {formatTimeFromDate(schedule.startDate)}
          </span>
        </div>
      );
    },
  },
  {
    key: 'capacity',
    label: 'Enrolled',
    render: (schedule) => {
      const enrolled = schedule.attendanceCount || 0;
      const capacity = schedule.capacity || 0;
      const status = getCapacityStatus(enrolled, capacity);
      return (
        <div className="flex items-center gap-1.5 text-sm">
          <Users className="w-4 h-4 text-dark-400 flex-shrink-0" />
          <span className="text-dark-200">{enrolled}/{capacity}</span>
          <Badge variant={status.color}>{status.text}</Badge>
        </div>
      );
    },
  },
  {
    key: 'type',
    label: 'Type',
    render: (schedule) => {
      const isPT = schedule.classType === CLASS_SCHEDULE_TYPE.PERSONAL_TRAINING;
      const scheduleTypeLabel = SCHEDULE_TYPE_LABELS[schedule.scheduleType] || 'One-time';
      const recurringInterval =
        schedule.scheduleType === 2 && schedule.recurringInterval
          ? RECURRING_INTERVAL_LABELS[schedule.recurringInterval]
          : null;

      return (
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap gap-1">
            {isPT && (
              <Badge variant="primary">
                {CLASS_SCHEDULE_TYPE_LABELS[CLASS_SCHEDULE_TYPE.PERSONAL_TRAINING]}
              </Badge>
            )}
            <Badge variant="default">{scheduleTypeLabel}</Badge>
          </div>
          {recurringInterval && (
            <p className="text-xs text-dark-400">
              Repeats: {recurringInterval}
              {schedule.numberOfSessions ? ` (${schedule.numberOfSessions} sessions)` : ''}
            </p>
          )}
        </div>
      );
    },
  },
];
