import { Modal } from '../../components/common';
import PtSessionForm from './PtSessionForm';
import PtAttendanceForm from './PtAttendanceForm';
import ClassAttendanceForm from '../class-schedule/ClassAttendanceForm';
import GroupClassBookingForm from '../class-schedule/GroupClassBookingForm';
import ClassScheduleSessionForm from '../class-schedule/ClassScheduleSessionForm';
import { SESSION_TYPES, SESSION_TYPE_LABELS } from '../../shared/constants/sessionSchedulingConstants';

/**
 * SessionModals
 *
 * Renders all modal dialogs used by the SessionScheduling page.
 *
 * Props:
 *   modals      — object with boolean flags: showModal, showAttendanceModal,
 *                 showGroupClassModal, showGroupClassEditModal, showPtAttendanceModal
 *   selected    — object with the currently-selected data items:
 *                 session, classSession, booking, ptSession
 *   onClose     — object of close/clear handlers keyed by modal name
 *   data        — extra data the modal forms need: customers, classScheduleSessions
 *   handlers    — submit/form handlers: onPtSessionSubmit
 *   isPending   — object of mutation pending flags: createPt, updatePt
 */
const SessionModals = ({ modals, selected, onClose, data, handlers, isPending }) => {
  const {
    showModal,
    showAttendanceModal,
    showGroupClassModal,
    showGroupClassEditModal,
    showPtAttendanceModal,
  } = modals;

  const { session, classSession, booking, ptSession } = selected;
  const { customers, classScheduleSessions } = data;

  return (
    <>
      {/* Book / Edit PT Session */}
      <Modal
        isOpen={showModal}
        onClose={onClose.closeModal}
        title={session ? 'Edit PT Session' : 'Book PT Session'}
        size="md"
      >
        <PtSessionForm
          session={session}
          customers={customers}
          onSubmit={handlers.onPtSessionSubmit}
          onCancel={onClose.closeModal}
          isSubmitting={isPending.createPt || isPending.updatePt}
        />
      </Modal>

      {/* Class Attendance */}
      <Modal
        isOpen={showAttendanceModal}
        onClose={onClose.closeAttendanceModal}
        title={`Mark Attendance - ${classSession?.className || 'Class'}`}
        size="lg"
      >
        <ClassAttendanceForm
          classSession={classSession}
          onCancel={onClose.closeAttendanceModal}
          onSubmit={onClose.closeAttendanceModal}
          isSubmitting={false}
        />
      </Modal>

      {/* Book / Edit Group Class */}
      <Modal
        isOpen={showGroupClassModal}
        onClose={onClose.closeGroupClassModal}
        title={booking ? 'Edit Group Class Booking' : 'Book Group Class Session'}
        size="lg"
      >
        <GroupClassBookingForm
          booking={booking}
          customers={customers}
          classSessions={classScheduleSessions}
          onSubmit={onClose.closeGroupClassModal}
          onCancel={onClose.closeGroupClassModal}
          isSubmitting={false}
        />
      </Modal>

      {/* Edit Group Class Session */}
      <Modal
        isOpen={showGroupClassEditModal}
        onClose={onClose.closeGroupClassEditModal}
        title={`Edit Session - ${classSession?.className || 'Class'}`}
        size="md"
      >
        <ClassScheduleSessionForm
          session={classSession}
          onSubmit={onClose.closeGroupClassEditModal}
          onCancel={onClose.closeGroupClassEditModal}
          isSubmitting={false}
        />
      </Modal>

      {/* PT Attendance */}
      <Modal
        isOpen={showPtAttendanceModal}
        onClose={onClose.closePtAttendanceModal}
        title={`Mark Attendance - ${
          ptSession?.className ||
          (ptSession?.customer
            ? `${ptSession.customer.firstName || ''} ${ptSession.customer.lastName || ''}`.trim()
            : SESSION_TYPE_LABELS[SESSION_TYPES.COACH_PT]?.replace(' Schedule', '') || 'PT Session')
        }`}
        size="lg"
      >
        <PtAttendanceForm
          ptSession={ptSession}
          onCancel={onClose.closePtAttendanceModal}
          onSubmit={onClose.closePtAttendanceModal}
          isSubmitting={false}
        />
      </Modal>
    </>
  );
};

export default SessionModals;
