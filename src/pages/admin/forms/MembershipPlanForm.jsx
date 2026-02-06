import { useEffect, useState } from 'react';
import { Modal } from '../../../components/common';

const emptyForm = {
  planName: '',
  price: '',
  planPeriod: '',
  planInterval: 'days',
  features: '',
};

const MembershipPlanForm = ({
  isOpen,
  onClose,
  onSubmit,
  selectedPlan,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (!selectedPlan) {
      setFormData(emptyForm);
      return;
    }

    setFormData({
      planName: selectedPlan.name,
      price: String(selectedPlan.price),
      planPeriod: String(selectedPlan.duration),
      planInterval: `${selectedPlan.durationUnit}s`,
      features: selectedPlan.features.join('\n'),
    });
  }, [selectedPlan]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      planName: formData.planName,
      price: Number(formData.price),
      planPeriod: Number(formData.planPeriod),
      planInterval: formData.planInterval,
      features: formData.features
        .split('\n')
        .map(f => f.trim())
        .filter(Boolean),
    };

    onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={selectedPlan ? 'Edit Membership Plan' : 'Add Membership Plan'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Plan Name</label>
          <input
            className="input"
            value={formData.planName}
            onChange={e => setFormData({ ...formData, planName: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Price</label>
            <input
              type="number"
              className="input"
              value={formData.price}
              onChange={e => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Duration</label>
            <div className="flex gap-2">
              <input
                type="number"
                className="input flex-1"
                value={formData.planPeriod}
                onChange={e =>
                  setFormData({ ...formData, planPeriod: e.target.value })
                }
                required
              />
              <select
                className="input w-32"
                value={formData.planInterval}
                onChange={e =>
                  setFormData({ ...formData, planInterval: e.target.value })
                }
              >
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
                <option value="years">Years</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="label">Features (one per line)</label>
          <textarea
            className="input"
            rows={5}
            value={formData.features}
            onChange={e =>
              setFormData({ ...formData, features: e.target.value })
            }
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex-1"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default MembershipPlanForm;
