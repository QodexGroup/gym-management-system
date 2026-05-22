import { useMemo } from 'react';

export function useMembershipPlanStats(plans) {
  return useMemo(() => {
    const totalActiveMembers = plans.reduce(
      (sum, p) => sum + p.activeMembers,
      0
    );

    const monthlyRevenue = plans.reduce(
      (sum, p) => sum + p.price * p.activeMembers,
      0
    );

    const mostPopularPlan =
      plans.length > 0
        ? plans.reduce((a, b) =>
            a.activeMembers > b.activeMembers ? a : b
          )
        : null;

    return {
      totalPlans: plans.length,
      totalActiveMembers,
      monthlyRevenue,
      mostPopularPlan,
    };
  }, [plans]);
}
