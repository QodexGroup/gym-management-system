import { intervalMap } from '../constants/membershipPlanConstants';

export function transformMembershipPlan(apiPlan) {
  const price = Number(apiPlan.price);
  const activeMembers = apiPlan.activeMembersCount ?? 0;
  const interval = intervalMap[apiPlan.planInterval] ?? apiPlan.planInterval;
  
  // Calculate monthly revenue based on plan interval
  let monthlyRevenue = 0;
  if (interval === intervalMap.months) {
    monthlyRevenue = price * activeMembers;
  } else if (interval === intervalMap.years) {
    monthlyRevenue = (price / 12) * activeMembers;
  } else if (interval === intervalMap.weeks) {
    monthlyRevenue = (price * 4) * activeMembers;
  } else if (interval === intervalMap.days) {
    monthlyRevenue = (price * 30) * activeMembers;
  } else {
    monthlyRevenue = price * activeMembers; // Default to monthly
  }
    
    return {
      id: apiPlan.id,
      name: apiPlan.planName,
      price: price,
      formattedPrice: `₱${price.toLocaleString('fil-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      duration: apiPlan.planPeriod,
      durationUnit: interval,
      features: Array.isArray(apiPlan.features) ? apiPlan.features : [],
      activeMembers: activeMembers,
      monthlyRevenue: monthlyRevenue,
      description: apiPlan.description || '',
      popular: false,
    };
  }