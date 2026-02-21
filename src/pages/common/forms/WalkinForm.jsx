import { useState } from 'react';
import { useCreateWalkin } from '../../../hooks/useWalkins';
import { Calendar } from 'lucide-react';

const WalkinForm = ({ onSuccess, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createWalkinMutation = useCreateWalkin();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const walkinData = {
        // Empty data - backend will set date, account_id, created_by automatically
      };
      const result = await createWalkinMutation.mutateAsync(walkinData);
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      // Error is handled by the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div className="text-center py-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
            <Calendar className="w-10 h-10 text-primary-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-dark-800 mb-2">Create Today's Walkin</h3>
            <p className="text-dark-500 mb-6">
              Start tracking attendance by creating a walkin session for today.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="w-full max-w-md">
            <div className="flex gap-3">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="flex-1 btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Walkin'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WalkinForm;
