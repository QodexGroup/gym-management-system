import { useRef, useState } from 'react';
import { Edit } from 'lucide-react';
import { Avatar } from '../../components/common';
import { sanitizePhoneInput, validatePhPhone, PH_PHONE_INPUT_MAX } from '../../shared/utils/validators/phone';
import { useAuth } from '../../shared/context/AuthContext';
import { uploadUserAvatar, getFileUrl } from '../../shared/services/storageService';
import { userService } from '../../shared/services/userService';
import { useInvalidateStorageUsage } from '../../shared/hooks/useStorage';
import { Toast } from '../../shared/utils/alert';

const MyAccountProfileForm = ({
  user,
  formData,
  onChange,
  onSubmit,
  isSubmitting,
  onCancel,
}) => {
  const { account, fetchUserData } = useAuth();
  const invalidateStorageUsage = useInvalidateStorageUsage();
  const fileInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  if (!user) return null;

  const accountId = account?.id ?? user.accountId;
  const phoneError = validatePhPhone(formData.phone);

  const handlePhoneChange = (e) => {
    onChange({ target: { name: 'phone', value: sanitizePhoneInput(e.target.value) } });
  };

  /**
   * Upload a newly picked avatar to R2, save it on the user, then refresh
   * auth state + storage usage.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e
   * @returns {Promise<void>}
   */
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!accountId) {
      Toast.error('Account not loaded — cannot upload avatar.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const res = await uploadUserAvatar(file, accountId);
      await userService.uploadAvatar(user.id, { path: res.fileUrl, sizeKb: res.fileSize });
      invalidateStorageUsage();
      await fetchUserData();
      Toast.success('Avatar updated');
    } catch (err) {
      if (import.meta.env.DEV) console.error('Avatar upload failed:', err);
      Toast.error(err.message || 'Failed to update avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex justify-center mb-4">
        <div className="relative">
          <Avatar src={user.avatar ? getFileUrl(user.avatar) : null} name={user.fullname} size="xl" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            title="Change avatar"
            className="absolute bottom-0 right-0 p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors disabled:opacity-60"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">First Name *</label>
          <input
            type="text"
            name="firstname"
            className="input"
            value={formData.firstname}
            onChange={onChange}
            required
          />
        </div>
        <div>
          <label className="label">Last Name *</label>
          <input
            type="text"
            name="lastname"
            className="input"
            value={formData.lastname}
            onChange={onChange}
            required
          />
        </div>
      </div>

      <div>
        <label className="label">Email *</label>
        <input
          type="email"
          name="email"
          className="input"
          value={formData.email}
          onChange={onChange}
          required
        />
      </div>

      <div>
        <label className="label">Phone</label>
        <input
          type="tel"
          name="phone"
          maxLength={PH_PHONE_INPUT_MAX}
          className={`input ${phoneError ? 'border-danger-500 focus:border-danger-500' : ''}`}
          value={formData.phone}
          onChange={handlePhoneChange}
          placeholder="09171234567"
        />
        {phoneError && <p className="text-danger-600 text-xs mt-1">{phoneError}</p>}
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
          disabled={isSubmitting || !!phoneError}
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default MyAccountProfileForm;
