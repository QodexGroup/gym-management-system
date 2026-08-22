import { Modal } from '../../components/common';
import PtSessionForm from '../personal-training/PtSessionForm';
import PtAttendanceForm from '../personal-training/PtAttendanceForm';
import ClassAttendanceForm from '../class-schedule/ClassAttendanceForm';
import GroupClassBookingForm from '../class-schedule/GroupClassBookingForm';
import ClassScheduleSessionForm from '../class-schedule/ClassScheduleSessionForm';

/**
 * Every modal the calendar page opens.
 *
 * @param {{
 *   modals: Object, selected: Object, onClose: Object,
 *   data: Object, handlers: Object, isPending: Object
 * }} props
 * @returns {JSX.Element}
 */
const CalendarModals = ({ modals, selected, onClose, data, handlers, isPending }) => {
  const {
    showPtForm, showClassAttendance, showGroupClassBooking,
    showClassSessionEdit, showPtAttendance,
  } = modals;
  const { ptSession, classSession, booking, ptAttendanceSession } = selected;
  const { customers, classSessions } = data;

  /**
   * Title for the PT attendance modal — the client's name where we have it.
   * @returns {string}
   */
  const ptAttendanceTitle = () => {
    const customer = ptAttendanceSession?.customer;
    const name = customer
      ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
      : '';
    return `Mark Attendance - ${ptAttendanceSession?.className || name || 'PT Session'}`;
  };

  return (
    <>
      <Modal
        isOpen={showPtForm}
        onClose={onClose.closePtForm}
        title={ptSession ? 'Edit PT Session' : 'Book PT Session'}
        size="md"
      >
        <PtSessionForm
          session={ptSession}
          customers={customers}
          onSubmit={handlers.onPtSessionSubmit}
          onCancel={onClose.closePtForm}
          isSubmitting={isPending.createPt || isPending.updatePt}
        />
      </Modal>

      <Modal
        isOpen={showClassAttendance}
        onClose={onClose.closeClassAttendance}
        title={`Mark Attendance - ${classSession?.className || 'Class'}`}
        size="lg"
      >
        <ClassAttendanceForm
          classSession={classSession}
          onCancel={onClose.closeClassAttendance}
          onSubmit={onClose.closeClassAttendance}
          isSubmitting={false}
        />
      </Modal>

      <Modal
        isOpen={showGroupClassBooking}
        onClose={onClose.closeGroupClassBooking}
        title={booking ? 'Edit Group Class Booking' : 'Book Group Class Session'}
        size="lg"
      >
        <GroupClassBookingForm
          booking={booking}
          customers={customers}
          classSessions={classSessions}
          onSubmit={onClose.closeGroupClassBooking}
          onCancel={onClose.closeGroupClassBooking}
          isSubmitting={false}
        />
      </Modal>

      <Modal
        isOpen={showClassSessionEdit}
        onClose={onClose.closeClassSessionEdit}
        title={`Edit Session - ${classSession?.className || 'Class'}`}
        size="md"
      >
        <ClassScheduleSessionForm
          session={classSession}
          onSubmit={onClose.closeClassSessionEdit}
          onCancel={onClose.closeClassSessionEdit}
          isSubmitting={false}
        />
      </Modal>

      <Modal
        isOpen={showPtAttendance}
        onClose={onClose.closePtAttendance}
        title={ptAttendanceTitle()}
        size="lg"
      >
        <PtAttendanceForm
          ptSession={ptAttendanceSession}
          onCancel={onClose.closePtAttendance}
          onSubmit={onClose.closePtAttendance}
          isSubmitting={false}
        />
      </Modal>
    </>
  );
};

export default CalendarModals;
