const MyAccountChangePasswordForm = ({
  passwordData,
  onChange,
  onSubmit,
  isSubmitting,
  onCancel,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label">Current Password *</label>
        <input
          type="password"
          name="currentPassword"
          className="input"
          placeholder="Enter current password"
          value={passwordData.currentPassword}
          onChange={onChange}
          required
        />
      </div>
      <div>
        <label className="label">New Password *</label>
        <input
          type="password"
          name="newPassword"
          className="input"
          placeholder="Enter new password (min 6 characters)"
          value={passwordData.newPassword}
          onChange={onChange}
          required
          minLength={6}
        />
      </div>
      <div>
        <label className="label">Confirm New Password *</label>
        <input
          type="password"
          name="confirmPassword"
          className="input"
          placeholder="Confirm new password"
          value={passwordData.confirmPassword}
          onChange={onChange}
          required
        />
      </div>
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 btn-secondary"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </form>
  );
};

export default MyAccountChangePasswordForm;

