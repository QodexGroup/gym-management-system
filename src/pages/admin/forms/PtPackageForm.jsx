import { useState, useEffect } from 'react';
import { PT_DURATION_OPTIONS } from '../../../constants/ptConstants';
import { usePtCategories } from '../../../hooks/usePtCategories';
import {
  useCreatePtPackage,
  useUpdatePtPackage,
} from '../../../hooks/usePtPackages';
import {
  getInitialPtPackageFormData,
  mapPtPackageToFormData,
} from '../../../models/ptPackageModel';

const PtPackageForm = ({ package: pkg, onSubmit, onCancel }) => {
  const { data: categories = [], isLoading: loadingCategories } = usePtCategories({ pagelimit: 0 });
  const createMutation = useCreatePtPackage();
  const updateMutation = useUpdatePtPackage();

  const [formData, setFormData] = useState(getInitialPtPackageFormData());

  useEffect(() => {
    setFormData(mapPtPackageToFormData(pkg));
  }, [pkg]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Convert features string to array
    const featuresArray = formData.features
      ? formData.features
          .split('\n')
          .map(f => f.trim())
          .filter(f => f.length > 0)
      : [];

    const packageData = {
      packageName: formData.packageName,
      description: formData.description || null,
      categoryId: parseInt(formData.categoryId),
      numberOfSessions: parseInt(formData.numberOfSessions),
      durationPerSession: parseInt(formData.durationPerSession),
      price: parseFloat(formData.price),
      features: featuresArray.length > 0 ? featuresArray : [],
    };

    try {
      if (pkg) {
        await updateMutation.mutateAsync({ id: pkg.id, data: packageData });
      } else {
        await createMutation.mutateAsync(packageData);
      }
      onSubmit();
    } catch (error) {
      console.error('Error saving package:', error);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (loadingCategories) {
    return <div className="text-center py-4">Loading categories...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Package Name *</label>
        <input
          type="text"
          className="input"
          placeholder="e.g., Strength Training Package"
          value={formData.packageName}
          onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          className="input"
          rows="3"
          placeholder="Enter package description..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Category *</label>
          <select
            className="input"
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            required
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.categoryName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Number of Sessions *</label>
          <input
            type="number"
            className="input"
            placeholder="e.g., 10"
            min="1"
            value={formData.numberOfSessions}
            onChange={(e) => setFormData({ ...formData, numberOfSessions: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Duration per Session *</label>
          <select
            className="input"
            value={formData.durationPerSession}
            onChange={(e) => setFormData({ ...formData, durationPerSession: e.target.value })}
            required
          >
            <option value="">Select duration</option>
            {PT_DURATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Price (₱) *</label>
          <input
            type="number"
            className="input"
            placeholder="0.00"
            step="0.01"
            min="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <label className="label">Features (one per line)</label>
        <textarea
          className="input"
          rows={5}
          placeholder="Nutrition Guide&#10;Progress Reports&#10;Custom Workout Plan&#10;Body Composition Analysis"
          value={formData.features}
          onChange={(e) => setFormData({ ...formData, features: e.target.value })}
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
          {isSubmitting
            ? 'Saving...'
            : pkg
            ? 'Save Changes'
            : 'Create Package'}
        </button>
      </div>
    </form>
  );
};

export default PtPackageForm;
