import { Avatar } from '../../../components/common';
import { Edit } from 'lucide-react';

const MyAccountProfileForm = ({
  user,
  formData,
  onChange,
  onSubmit,
  isSubmitting,
  onCancel,
}) => {
  if (!user) return null;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex justify-center mb-4">
        <div className="relative">
          <Avatar src={user.avatar} name={user.fullname} size="xl" />
          <button
            type="button"
            className="absolute bottom-0 right-0 p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors"
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
          className="input"
          value={formData.phone}
          onChange={onChange}
          placeholder="+1 234 567 8900"
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
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default MyAccountProfileForm;

