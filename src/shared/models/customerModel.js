/**
 * Customer Form Model
 * Defines the structure and initial state for customer form data
 */

import { calculateAge, formatDate, formatDateForInput } from '../utils/formatters';

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
    membershipPlanId: null,
    currentTrainerId: null,
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
    membershipPlanId: customer.currentMembership?.membershipPlanId || null,
    currentTrainerId: customer.currentTrainer?.id || null,
  };
};

export const mapCustomerToUI = (customer) => {
  if (!customer) return null;

  const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
  const age = calculateAge(customer.dateOfBirth);
  const membershipExpiry = customer.currentMembership?.membershipEndDate
    ? formatDate(customer.currentMembership.membershipEndDate)
    : 'N/A';
  const membership = customer.currentMembership?.membershipPlan?.planName || 'N/A';
  const membershipStatus = customer.currentMembership?.status || 'N/A';
  const birthDate = customer.dateOfBirth ? formatDate(customer.dateOfBirth) : 'N/A';

  return {
    ...customer,
    id: customer.id,
    name: fullName || 'N/A',
    avatar: customer.photo, 
    age,
    membership,
    membershipExpiry,
    membershipStatus,
    balance: customer.balance || 0,
    trainer: customer.currentTrainer?.name || null,
    email: customer.email || 'N/A',
    phone: customer.phoneNumber || 'N/A',
    birthDate: birthDate,
  };
};

