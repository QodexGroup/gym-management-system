/**
 * Progress Form Model
 * Defines the structure and initial state for progress form data
 */

import { formatDateForInput } from '../utils/formatters';

/**
 * Get initial progress form data
 * @returns {Object} Initial form state
 */
export const getInitialProgressFormData = () => ({
  recordedDate: new Date(),
  dataSource: 'manual',
  customerScanId: null,
  weight: '',
  height: '',
  bodyFatPercentage: '',
  bmi: null,
  skeletalMuscleMass: '',
  bodyFatMass: null,
  totalBodyWater: '',
  visceralFatLevel: '',
  basalMetabolicRate: '',
  protein: '',
  minerals: '',
  chest: '',
  waist: '',
  hips: '',
  leftArm: '',
  rightArm: '',
  leftThigh: '',
  rightThigh: '',
  leftCalf: '',
  rightCalf: '',
  notes: '',
});

/**
 * Map progress data from API to form data
 * @param {Object} progress - Progress object from API
 * @returns {Object} Form data object
 */
export const mapProgressToFormData = (progress) => {
  if (!progress) return getInitialProgressFormData();
  
  return {
    recordedDate: progress.recordedDate ? new Date(progress.recordedDate) : new Date(),
    dataSource: progress.dataSource || 'manual',
    customerScanId: progress.customerScanId || null,
    weight: progress.weight || '',
    height: progress.height || '',
    bodyFatPercentage: progress.bodyFatPercentage || '',
    bmi: progress.bmi || null,
    skeletalMuscleMass: progress.skeletalMuscleMass || '',
    bodyFatMass: progress.bodyFatMass || null,
    totalBodyWater: progress.totalBodyWater || '',
    visceralFatLevel: progress.visceralFatLevel || '',
    basalMetabolicRate: progress.basalMetabolicRate || '',
    protein: progress.protein || '',
    minerals: progress.minerals || '',
    chest: progress.chest || '',
    waist: progress.waist || '',
    hips: progress.hips || '',
    leftArm: progress.leftArm || '',
    rightArm: progress.rightArm || '',
    leftThigh: progress.leftThigh || '',
    rightThigh: progress.rightThigh || '',
    leftCalf: progress.leftCalf || '',
    rightCalf: progress.rightCalf || '',
    notes: progress.notes || '',
  };
};

