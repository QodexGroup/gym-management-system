/**
 * UI helper functions for styling and display
 */

/**
 * Get data source badge styling classes
 * @param {string} source - Data source ('manual', 'inbody', 'styku')
 * @returns {string} - CSS classes for the badge
 */
export const getDataSourceBadge = (source) => {
  const styles = {
    manual: 'bg-dark-100 text-dark-700',
    inbody: 'bg-primary-100 text-primary-700',
    styku: 'bg-accent-100 text-accent-700',
  };
  return styles[source] || styles.manual;
};

