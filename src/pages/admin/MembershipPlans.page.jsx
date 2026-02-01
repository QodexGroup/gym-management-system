import { useMemo, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { Plus, Eye, Edit, Trash, Award, Users, PhilippinePeso, Star } from 'lucide-react';

import {
  useMembershipPlans,
  useCreateMembershipPlan,
  useUpdateMembershipPlan,
  useDeleteMembershipPlan,
} from '../../hooks/useMembershipPlans';

import { transformMembershipPlan } from '../../models/membershipPlanModel';
import { Alert } from '../../utils/alert';

import StatsCards from '../../components/common/StatsCards';
import { Badge } from '../../components/common';
import MembershipPlanForm from './forms/MembershipPlanForm';
import MembershipPlanDetail from './forms/MembershipPlanDetail';
import { formatCurrency } from '../../utils/formatters';
import { GridDesign, GridDesignOne } from '../../components/Grid';

/* --------------------------------------------------
   PAGE
-------------------------------------------------- */
const MembershipPlans = () => {
  const { data = [], isLoading } = useMembershipPlans();
  const createMutation = useCreateMembershipPlan();
  const updateMutation = useUpdateMembershipPlan();
  const deleteMutation = useDeleteMembershipPlan();

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [detailsPlan, setDetailsPlan] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const plans = useMemo(
    () => data.map(transformMembershipPlan),
    [data]
  );

  /* --------------------------------------------------
     TOP STATS (REPLACES useMembershipPlanStats)
  -------------------------------------------------- */
  const stats = useMemo(() => {
    const totalActiveMembers = plans.reduce(
      (sum, p) => sum + (p.activeMembers || 0),
      0
    );
    
    const totalMonthlyRevenue = plans.reduce(
      (sum, p) => sum + (p.monthlyRevenue || 0),
      0
    );
    
    const mostPopularPlan = plans.length > 0
      ? plans.reduce((a, b) => (a.activeMembers || 0) > (b.activeMembers || 0) ? a : b)
      : null;
    
    return [
      {
        title: 'Total Plans',
        value: plans.length,
        color: 'primary',
        icon: Award
      },
      {
        title: 'Active Members',
        value: totalActiveMembers,
        color: 'success',
        icon: Users
      },
      {
        title: 'Est. Monthly Revenue',
        value: formatCurrency(totalMonthlyRevenue),
        color: 'accent',
        icon: PhilippinePeso
      },
      {
        title: 'Most Popular Plan',
        value: mostPopularPlan?.name || 'N/A',
        color: 'warning',
        icon: Star
      },
    ];
  }, [plans]);

  /* --------------------------------------------------
     HANDLERS
  -------------------------------------------------- */
  const handleSave = async (payload) => {
    if (selectedPlan) {
      await updateMutation.mutateAsync({
        id: selectedPlan.id,
        data: payload,
      });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setShowForm(false);
    setSelectedPlan(null);
  };

  const handleDelete = async (id) => {
    const result = await Alert.confirmDelete();
    if (!result.isConfirmed) return;
    await deleteMutation.mutateAsync(id);
  };

  const handleViewDetails = (plan) => {
    setDetailsPlan(plan);
    setShowDetails(true);
  };

  if (isLoading) {
    return (
      <Layout title="Membership Plans">
        <p className="text-center py-20 text-dark-500">Loading...</p>
      </Layout>
    );
  }

  return (
    <Layout title="Membership Plans" subtitle="Manage gym membership packages and pricing">
      {/* Stats Cards */}
      <StatsCards stats={stats} columns={4} dark={true} />

      {/* Add Plan Button */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => { setSelectedPlan(null); setShowForm(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Plan
        </button>
      </div>

      {/* Plans Grid using GridDesign */}
      <GridDesign
        items={plans}
        columns={3}
        renderCard={(plan) => ({
          title: plan.name,
          subtitle: `${formatCurrency(plan.price)} / ${plan.duration} ${plan.durationUnit}${plan.duration > 1 ? 's' : ''}`,
          list: Array.isArray(plan.features) ? plan.features : [],
          highlightBadge: plan.popular ? 'Popular' : null,
          footer: [
            { icon: Users, label: `${plan.activeMembers || 0} active members` },
          ],
          actions: {
            onEdit: () => { setSelectedPlan(plan); setShowForm(true); },
            onDelete: () => handleDelete(plan.id),
            onView: () => handleViewDetails(plan),
          },
        })}
      />

      {/* Membership Plan Form Modal */}
      <MembershipPlanForm
        isOpen={showForm}
        selectedPlan={selectedPlan}
        onClose={() => setShowForm(false)}
        onSubmit={handleSave}
        isSubmitting={createMutation.isLoading || updateMutation.isLoading}
      />

      {/* Membership Plan Details Modal */}
      <MembershipPlanDetail
        isOpen={showDetails}
        plan={detailsPlan}
        onClose={() => setShowDetails(false)}
        onEdit={() => {
          setShowDetails(false);
          setSelectedPlan(detailsPlan);
          setShowForm(true);
        }}
      />
    </Layout>
  );
};

export default MembershipPlans;
