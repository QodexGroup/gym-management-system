/**
 * Customer Form Model
 * Defines the structure and initial state for customer form data
 */

import { formatDateForInput } from '../utils/formatters';

/**
 * Get initial customer form data
 * @returns {Object} Initial form state
 */
export const getInitialCustomerFormData = () => ({
  firstName: '',
  lastName: '',
  gender: 'Male',
  dateOfBirth: '',
  photo: '',
  phoneNumber: '',
  email: '',
  address: '',
  medicalNotes: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  bloodType: '',
  allergies: '',
  currentMedications: '',
  medicalConditions: '',
  doctorName: '',
  doctorPhone: '',
  insuranceProvider: '',
  insurancePolicyNumber: '',
  emergencyContactRelationship: '',
  emergencyContactAddress: '',
  membershipPlanId: '',
  currentTrainerId: '',
});

/**
 * Map customer data from API to form data
 * @param {Object} customer - Customer object from API
 * @returns {Object} Form data object
 */
export const mapCustomerToFormData = (customer) => {
  if (!customer) return getInitialCustomerFormData();
  
  return {
    firstName: customer.firstName || '',
    lastName: customer.lastName || '',
    gender: customer.gender || '',
    dateOfBirth: formatDateForInput(customer.dateOfBirth),
    photo: customer.photo || '',
    phoneNumber: customer.phoneNumber || '',
    email: customer.email || '',
    address: customer.address || '',
    medicalNotes: customer.medicalNotes || '',
    emergencyContactName: customer.emergencyContactName || '',
    emergencyContactPhone: customer.emergencyContactPhone || '',
    bloodType: customer.bloodType || '',
    allergies: customer.allergies || '',
    currentMedications: customer.currentMedications || '',
    medicalConditions: customer.medicalConditions || '',
    doctorName: customer.doctorName || '',
    doctorPhone: customer.doctorPhone || '',
    insuranceProvider: customer.insuranceProvider || '',
    insurancePolicyNumber: customer.insurancePolicyNumber || '',
    emergencyContactRelationship: customer.emergencyContactRelationship || '',
    emergencyContactAddress: customer.emergencyContactAddress || '',
    membershipPlanId: customer.currentMembership?.membershipPlanId?.toString() || '',
    currentTrainerId: customer.currentTrainer?.id?.toString() || '',
  };
};

