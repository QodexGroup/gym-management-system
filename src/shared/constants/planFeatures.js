/**
 * Static, display-only feature lists for the subscription plans.
 *
 * These are shown in the UI only — the backend still enforces any real limits via the
 * `subscription_plans` table. All paid plans (Monthly, Quarterly, Yearly) currently
 * include the same feature set; there is no separate Premium/Enterprise tier.
 */

export const PAID_PLAN_FEATURES = [
  'Unlimited clients / members',
  'Unlimited staff & coach accounts',
  'Walk-in QR check-in & check-out',
  '5 GB file storage (member photos, scans, receipts)',
  'Membership plans & automated billing',
  'Personal training packages & session scheduling',
  'Class schedules & group bookings',
  'Body scans & progress tracking',
  'Expense tracking & categories',
  'Reports & analytics (collection, expense, summary)',
  'Calendar & appointment management',
  'Automated email notifications',
  'QR member cards & kiosk mode',
];

export const TRIAL_PLAN_FEATURES = [
  'Full access to every feature',
  'No charge during your 7-day trial',
];

/**
 * Get the static feature list to display for a plan.
 * @param {Object} plan - plan object (expects an `isTrial` flag)
 * @returns {string[]}
 */
export const getPlanFeatures = (plan) =>
  plan?.isTrial ? TRIAL_PLAN_FEATURES : PAID_PLAN_FEATURES;
