import { Modal } from '../../../components/common';

const TrialUpgradeModal = ({
  isOpen,
  onSubmit,
  onFileChange,
  receiptFile,
  uploading,
  isSubmitting,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title="Trial Upgrade – Upload Receipt"
      size="md"
      disableOutsideClick
      hideCloseButton
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <p className="text-sm text-dark-300">
          Upload your payment receipt for the trial upgrade. An admin will review and approve it before your paid plan starts.
        </p>

        <div>
          <label className="block text-sm font-medium text-dark-200 mb-2">
            Upload payment receipt
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={onFileChange}
            disabled={uploading || isSubmitting}
            className="block w-full text-sm text-dark-100 file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700 cursor-pointer"
          />
        </div>

        <button
          type="submit"
          disabled={uploading || isSubmitting || !receiptFile}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading || isSubmitting ? 'Submitting...' : 'Submit Upgrade Payment'}
        </button>
      </form>
    </Modal>
  );
};

export default TrialUpgradeModal;

