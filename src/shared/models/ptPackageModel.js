/**
 * PT Package Form Model
 * Defines the structure and initial state for PT package form data
 */

/**
 * Get initial PT package form data
 * @returns {Object} Initial form state
 */
export const getInitialPtPackageFormData = () => ({
  packageName: '',
  description: '',
  categoryId: '',
  numberOfSessions: '',
  durationPerSession: '30',
  price: '',
  features: '',
});

/**
 * Map PT package data from API to form data
 * @param {Object} pkg - PT package object from API
 * @returns {Object} Form data object
 */
export const mapPtPackageToFormData = (pkg) => {
  if (!pkg) return getInitialPtPackageFormData();
  
  return {
    packageName: pkg.packageName || '',
    description: pkg.description || '',
    categoryId: pkg.categoryId || pkg.category?.id || '',
    numberOfSessions: pkg.numberOfSessions?.toString() || '',
    durationPerSession: pkg.durationPerSession?.toString() || '',
    price: pkg.price?.toString() || '',
    features: Array.isArray(pkg.features) 
      ? pkg.features.join('\n') 
      : '',
  };
};
