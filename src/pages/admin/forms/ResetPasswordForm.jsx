import { useResetPassword } from '../../../hooks/useUsers';

const ResetPasswordForm = ({
  user,
  onSuccess,
  onCancel,
}) => {
  const resetPasswordMutation = useResetPassword();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.target);
    const password = formData.get('password');

    try {
      await resetPasswordMutation.mutateAsync({
        id: user.id,
        password: password,
      });
      
      onSuccess?.();
      e.target.reset();
    } catch (error) {
      // Error is handled by the mutation hook
      console.error('Error resetting password:', error);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8 text-dark-400">
        No user selected
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-4">
        <p className="text-sm text-dark-300">
          Reset password for <span className="font-semibold text-dark-50">{user.name}</span>
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-2">
          New Password
        </label>
        <input
          type="password"
          name="password"
          className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 text-dark-50 rounded-lg focus:bg-dark-600 focus:border-primary-500 outline-none transition-colors"
          placeholder="Enter new password"
          required
          minLength={6}
        />
        <p className="text-xs text-dark-400 mt-1">
          Password must be at least 6 characters long
        </p>
      </div>
      
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 btn-primary"
          disabled={resetPasswordMutation.isPending}
        >
          {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
        </button>
      </div>
    </form>
  );
};

export default ResetPasswordForm;
