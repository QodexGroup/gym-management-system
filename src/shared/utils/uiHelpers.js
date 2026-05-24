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
    manual: 'bg-dark-700 text-dark-200',
    inbody: 'bg-primary-500 text-white',
    styku: 'bg-accent-500 text-white',
  };
  return styles[source] || styles.manual;
};

