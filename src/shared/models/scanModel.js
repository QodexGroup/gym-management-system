/**
 * Scan Form Model
 * Defines the structure and initial state for scan form data
 */

/**
 * Get initial scan form data
 * @returns {Object} Initial form state
 */
export const getInitialScanFormData = () => ({
  scanDate: new Date(),
  scanType: '',
  notes: '',
});

/**
 * Map scan data from API to form data
 * @param {Object} scan - Scan object from API
 * @returns {Object} Form data object
 */
export const mapScanToFormData = (scan) => {
  if (!scan) return getInitialScanFormData();
  
  return {
    scanDate: scan.scanDate ? new Date(scan.scanDate) : new Date(),
    scanType: scan.scanType || '',
    notes: scan.notes || '',
  };
};

