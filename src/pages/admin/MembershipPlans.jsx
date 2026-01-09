import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { Badge, Modal } from '../../components/common';
import {
  Plus,
  Edit,
  Trash,
  Check,
  Star,
  Users,
  PhilippinePeso,
  Award,
  Eye,
} from 'lucide-react';
import { Alert } from '../../utils/alert';
import { 
  useMembershipPlans, 
  useCreateMembershipPlan, 
  useUpdateMembershipPlan, 
  useDeleteMembershipPlan 
} from '../../hooks/useMembershipPlans';
import { formatCurrency } from '../../utils/formatters';

const MembershipPlans = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [detailsPlan, setDetailsPlan] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    planName: '',
    price: '',
    planPeriod: '',
    planInterval: 'days',
    features: '',
  });

  // React Query hooks
  const { data: plans = [], isLoading: loading } = useMembershipPlans();
  const createMutation = useCreateMembershipPlan();
  const updateMutation = useUpdateMembershipPlan();
  const deleteMutation = useDeleteMembershipPlan();

  const isSubmitting = createMutation.isLoading || updateMutation.isLoading;

  // Transform API data to component format
  const transformPlan = (apiPlan) => {
    // Map planInterval to durationUnit
    const intervalMap = {
      days: 'day',
      weeks: 'week',
      months: 'month',
      years: 'year',
    };

    return {
      id: apiPlan.id,
      name: apiPlan.planName,
      price: parseFloat(apiPlan.price),
      duration: apiPlan.planPeriod,
      durationUnit: intervalMap[apiPlan.planInterval] || apiPlan.planInterval,
      features: Array.isArray(apiPlan.features) ? apiPlan.features : [],
      popular: false, // This field doesn't exist in API, can be added later
      activeMembers: apiPlan.activeMembersCount || 0, // Real data from API
    };
  };

  const transformedPlans = plans.map(transformPlan);

  const totalActiveMembers = transformedPlans.reduce((sum, plan) => sum + plan.activeMembers, 0);
  const monthlyRevenue = transformedPlans.reduce(
    (sum, plan) => sum + plan.price * plan.activeMembers,
    0
  );
  
  // Find the most popular plan (plan with the most active members)
  const mostPopularPlan = transformedPlans.length > 0
    ? transformedPlans.reduce((prev, current) => 
        (prev.activeMembers > current.activeMembers) ? prev : current
      )
    : null;

  const handleOpenModal = (plan = null) => {
    if (plan) {
      // Edit mode
      setSelectedPlan(plan);
      setFormData({
        planName: plan.name,
        price: plan.price.toString(),
        planPeriod: plan.duration.toString(),
        planInterval: plan.durationUnit === 'month' ? 'months' : 
                      plan.durationUnit === 'year' ? 'years' : 
                      plan.durationUnit === 'day' ? 'days' : 'weeks',
        features: Array.isArray(plan.features) ? plan.features.join('\n') : '',
      });
    } else {
      // Create mode
      setSelectedPlan(null);
      setFormData({
        planName: '',
        price: '',
        planPeriod: '',
        planInterval: 'days',
        features: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPlan(null);
    setFormData({
      planName: '',
      price: '',
      planPeriod: '',
      planInterval: 'days',
      features: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Convert features string to array, ensure it's always an array (even if empty)
    const featuresArray = formData.features
      ? formData.features
          .split('\n')
          .map(f => f.trim())
          .filter(f => f.length > 0)
      : [];

    const planData = {
      planName: formData.planName,
      price: parseFloat(formData.price),
      planPeriod: parseInt(formData.planPeriod),
      planInterval: formData.planInterval,
      features: featuresArray.length > 0 ? featuresArray : [], // Always send as array, even if empty
    };

    try {
      if (selectedPlan) {
        // Update existing plan
        await updateMutation.mutateAsync({ id: selectedPlan.id, data: planData });
      } else {
        // Create new plan
        await createMutation.mutateAsync(planData);
      }

      handleCloseModal();
      // React Query automatically invalidates and refetches
    } catch (error) {
      // Error already handled in mutation hooks
      console.error('Error saving plan:', error);
    }
  };

  const handleDelete = async (planId) => {
    const result = await Alert.confirmDelete();

    if (!result.isConfirmed) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(planId);
      Alert.success('Deleted!', 'Membership plan has been deleted.', {
        timer: 2000,
        showConfirmButton: false
      });
      // React Query automatically invalidates and refetches
    } catch (error) {
      // Error already handled in mutation hook
      console.error('Error deleting plan:', error);
    }
  };

  const handleViewDetails = (plan) => {
    setDetailsPlan(plan);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setDetailsPlan(null);
  };

  if (loading) {
    return (
      <Layout title="Membership Plans" subtitle="Manage gym membership packages and pricing">
        <div className="flex items-center justify-center h-64">
          <p className="text-dark-500">Loading membership plans...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Membership Plans"
      subtitle="Manage gym membership packages and pricing"
    >
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Total Plans</p>
              <p className="text-3xl font-bold mt-1">{transformedPlans.length}</p>
            </div>
            <Award className="w-10 h-10 text-primary-200" />
          </div>
        </div>
        <div className="card bg-gradient-to-br from-success-500 to-success-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-success-100 text-sm">Active Members</p>
              <p className="text-3xl font-bold mt-1">{totalActiveMembers}</p>
            </div>
            <Users className="w-10 h-10 text-success-200" />
          </div>
        </div>
        <div className="card bg-gradient-to-br from-accent-500 to-accent-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-accent-100 text-sm">Est. Monthly Revenue</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(monthlyRevenue)}
              </p>
            </div>
            <PhilippinePeso className="w-10 h-10 text-accent-200" />
          </div>
        </div>
        <div className="card bg-gradient-to-br from-warning-500 to-warning-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-warning-100 text-sm">Most Popular</p>
              <p className="text-xl font-bold mt-1">
                {mostPopularPlan && mostPopularPlan.activeMembers > 0
                  ? `${mostPopularPlan.name}`
                  : 'N/A'}
              </p>
            </div>
            <Star className="w-10 h-10 text-warning-200" />
          </div>
        </div>
      </div>

      {/* Add Plan Button */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Plan
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {transformedPlans.map((plan) => (
          <div
            key={plan.id}
            className={`card relative overflow-hidden flex flex-col ${
              plan.popular ? 'ring-2 ring-primary-500' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute top-4 right-4">
                <Badge variant="primary">Popular</Badge>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-xl font-bold text-dark-50">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-bold text-primary-600">
                  {formatCurrency(plan.price)}
                </span>
                <span className="text-dark-500">
                  / {plan.duration} {plan.durationUnit}{plan.duration > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-6 flex-1">
              {(plan.features.length >= 5 ? plan.features.slice(0, 4) : plan.features).map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-success-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm text-dark-200">{feature}</span>
                </div>
              ))}
              {plan.features.length >= 5 && (
                <button
                  onClick={() => handleViewDetails(plan)}
                  className="w-full mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-1 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View More Details ({plan.features.length - 4} more)
                </button>
              )}
            </div>

            <div className="pt-4 border-t border-dark-100 mt-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-dark-500">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">{plan.activeMembers} active members</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(plan)}
                  className="flex-1 btn-secondary flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                >
                  <Trash className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Combined Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={selectedPlan ? 'Edit Membership Plan' : 'Add New Membership Plan'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Plan Name</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Premium Monthly"
              value={formData.planName}
              onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Price (₱)</label>
              <input
                type="number"
                className="input"
                placeholder="99.99"
                step="0.01"
                min="1"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Duration</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  className="input flex-1"
                  placeholder="1"
                  min="1"
                  value={formData.planPeriod}
                  onChange={(e) => setFormData({ ...formData, planPeriod: e.target.value })}
                  required
                />
                <select
                  className="input w-32"
                  value={formData.planInterval}
                  onChange={(e) => setFormData({ ...formData, planInterval: e.target.value })}
                  required
                >
                  <option value="days">Day(s)</option>
                  <option value="weeks">Week(s)</option>
                  <option value="months">Month(s)</option>
                  <option value="years">Year(s)</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="label">Features (one per line)</label>
            <textarea
              className="input"
              rows={5}
              placeholder="Gym Access&#10;Locker Room&#10;All Equipment&#10;Group Classes"
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-4 pb-2">
            <button
              type="button"
              onClick={handleCloseModal}
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
                : selectedPlan
                ? 'Save Changes'
                : 'Create Plan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Plan Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={handleCloseDetailsModal}
        title={detailsPlan ? detailsPlan.name : 'Membership Plan Details'}
        size="lg"
      >
        {detailsPlan && (
          <div className="space-y-6">
            {/* Plan Header */}
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-6">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold text-primary-600">
                  {formatCurrency(detailsPlan.price)}
                </span>
                <span className="text-dark-500 text-lg">
                  / {detailsPlan.duration} {detailsPlan.durationUnit}
                  {detailsPlan.duration > 1 ? 's' : ''}
                </span>
              </div>
              {detailsPlan.popular && (
                <Badge variant="primary" className="mt-2">Popular Plan</Badge>
              )}
            </div>

            {/* Plan Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dark-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-dark-500 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">Active Members</span>
                </div>
                <p className="text-2xl font-bold text-dark-50">{detailsPlan.activeMembers}</p>
              </div>
              <div className="bg-dark-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-dark-500 mb-1">
                  <PhilippinePeso className="w-4 h-4" />
                  <span className="text-sm font-medium">Est. Revenue</span>
                </div>
                <p className="text-2xl font-bold text-dark-50">
                  {formatCurrency(detailsPlan.price * detailsPlan.activeMembers)}
                </p>
              </div>
            </div>

            {/* All Features */}
            <div>
              <h3 className="text-lg font-semibold text-dark-50 mb-4">All Features</h3>
              <div className="space-y-3">
                {detailsPlan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-success-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-dark-200">{feature}</span>
                  </div>
                ))}
                {detailsPlan.features.length === 0 && (
                  <p className="text-dark-500 italic">No features listed for this plan.</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-dark-100">
              <button
                onClick={() => {
                  handleCloseDetailsModal();
                  handleOpenModal(detailsPlan);
                }}
                className="flex-1 btn-secondary flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Plan
              </button>
              <button
                onClick={handleCloseDetailsModal}
                className="flex-1 btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default MembershipPlans;

