import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Modal } from '../../components/common';
import { Toast } from '../../utils/alert';
import { useCreateCustomer, useUpdateCustomer } from '../../hooks/useCustomers';
import { useMembershipPlans } from '../../hooks/useMembershipPlans';
import { useTrainers } from '../../hooks/useTrainers';

const CustomerForm = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  selectedCustomer,
  onSaveSuccess,
}) => {
  const [errors, setErrors] = useState({});
  
  // React Query mutations and queries
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const { data: membershipPlans = [] } = useMembershipPlans();
  const { data: trainers = [] } = useTrainers();
  
  const isSubmitting = createMutation.isLoading || updateMutation.isLoading;

  // Validation functions
  const validateEmail = (email) => {
    if (!email || !email.trim()) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const validateRequiredField = (value, fieldName) => {
    // Handle both string and date values
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return '';
  };

  const validateForm = () => {
    const newErrors = {};

    // Required field validations - check for empty strings and whitespace
    const firstNameError = validateRequiredField(formData.firstName, 'First name');
    if (firstNameError) newErrors.firstName = firstNameError;

    const lastNameError = validateRequiredField(formData.lastName, 'Last name');
    if (lastNameError) newErrors.lastName = lastNameError;

    const phoneNumberError = validateRequiredField(formData.phoneNumber, 'Phone number');
    if (phoneNumberError) newErrors.phoneNumber = phoneNumberError;

    const dateOfBirthError = validateRequiredField(formData.dateOfBirth, 'Date of birth');
    if (dateOfBirthError) newErrors.dateOfBirth = dateOfBirthError;

    // Email validation
    if (formData.email && formData.email.trim() && !validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      Toast.error('Please fix the errors in the form');
      return;
    }

    const customerData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      gender: formData.gender || 'Male',
      dateOfBirth: formData.dateOfBirth,
      photo: formData.photo || null,
      phoneNumber: formData.phoneNumber,
      email: formData.email || null,
      address: formData.address || null,
      medicalNotes: formData.medicalNotes || null,
      emergencyContactName: formData.emergencyContactName || null,
      emergencyContactPhone: formData.emergencyContactPhone || null,
      bloodType: formData.bloodType || null,
      allergies: formData.allergies || null,
      currentMedications: formData.currentMedications || null,
      medicalConditions: formData.medicalConditions || null,
      doctorName: formData.doctorName || null,
      doctorPhone: formData.doctorPhone || null,
      insuranceProvider: formData.insuranceProvider || null,
      insurancePolicyNumber: formData.insurancePolicyNumber || null,
      emergencyContactRelationship: formData.emergencyContactRelationship || null,
      emergencyContactAddress: formData.emergencyContactAddress || null,
      // Only include membership and trainer when creating new customer
      ...(selectedCustomer ? {} : {
        membershipPlanId: formData.membershipPlanId,
        currentTrainerId: formData.currentTrainerId,
      }),
    };

    try {
      if (selectedCustomer) {
        // Update existing customer
        await updateMutation.mutateAsync({ id: selectedCustomer.id, data: customerData });
      } else {
        // Create new customer
        await createMutation.mutateAsync(customerData);
      }

      onClose();
      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (error) {
      // Error already handled in mutation hooks
      console.error('Error saving customer:', error);
    }
  };
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
      size="full"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="border-b border-dark-200 pb-6">
          <h3 className="text-lg font-semibold text-dark-800 mb-4">Personal Information</h3>
          <div className="grid grid-cols-6 gap-6">
            {/* Photo Area */}
            {/* <div className="col-span-1">
              <label className="label mb-2 block">Photo</label>
              <div 
                className="w-32 h-32 border-2 border-dashed border-dark-300 rounded-lg flex items-center justify-center bg-dark-50 hover:border-primary-500 transition-colors cursor-pointer relative overflow-hidden"
                onClick={() => document.getElementById('photo-upload').click()}
              >
                {formData.photo ? (
                  <>
                    <img
                      src={formData.photo}
                      alt="Customer photo"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-dark-100 bg-opacity-75 opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-xs text-dark-600">Change</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-2">
                    <div className="text-dark-400 mb-1">
                      <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-xs text-dark-500">Upload</p>
                  </div>
                )}
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData({ ...formData, photo: reader.result });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
            </div> */}
            
            {/* Form Fields */}
            <div className="col-span-5 grid grid-cols-2 gap-4">
              <div>
                <label className="label">
                  First Name <span className="text-danger-600">*</span>
                </label>
                <input
                  type="text"
                  className={`input ${errors.firstName ? 'border-danger-500 focus:border-danger-500' : ''}`}
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => {
                    setFormData({ ...formData, firstName: e.target.value });
                    if (errors.firstName) {
                      setErrors({ ...errors, firstName: '' });
                    }
                  }}
                  onBlur={(e) => {
                    const error = validateRequiredField(e.target.value, 'First name');
                    if (error) {
                      setErrors({ ...errors, firstName: error });
                    }
                  }}
                  required
                />
                {errors.firstName && (
                  <p className="text-danger-600 text-xs mt-1">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label className="label">
                  Last Name <span className="text-danger-600">*</span>
                </label>
                <input
                  type="text"
                  className={`input ${errors.lastName ? 'border-danger-500 focus:border-danger-500' : ''}`}
                  placeholder="Smith"
                  value={formData.lastName}
                  onChange={(e) => {
                    setFormData({ ...formData, lastName: e.target.value });
                    if (errors.lastName) {
                      setErrors({ ...errors, lastName: '' });
                    }
                  }}
                  onBlur={(e) => {
                    const error = validateRequiredField(e.target.value, 'Last name');
                    if (error) {
                      setErrors({ ...errors, lastName: error });
                    }
                  }}
                  required
                />
                {errors.lastName && (
                  <p className="text-danger-600 text-xs mt-1">{errors.lastName}</p>
                )}
              </div>
              <div>
                <label className="label">Gender</label>
                <select
                  className="input"
                  value={formData.gender || 'Male'}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">
                  Date of Birth <span className="text-danger-600">*</span>
                </label>
                <DatePicker
                  selected={formData.dateOfBirth ? new Date(formData.dateOfBirth) : null}
                  onChange={(date) => {
                    const dateString = date ? date.toISOString().split('T')[0] : '';
                    setFormData({ ...formData, dateOfBirth: dateString });
                    // Clear error when date is selected
                    if (errors.dateOfBirth) {
                      setErrors({ ...errors, dateOfBirth: '' });
                    }
                  }}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Click to select date"
                  className={`input w-full ${errors.dateOfBirth ? 'border-danger-500 focus:border-danger-500' : ''}`}
                  showYearDropdown
                  showMonthDropdown
                  dropdownMode="select"
                  maxDate={new Date()}
                  isClearable
                  onKeyDown={(e) => {
                    if (e && e.key && e.key !== 'Tab' && e.key !== 'Escape') {
                      e.preventDefault();
                    }
                  }}
                  onBlur={() => {
                    const error = validateRequiredField(formData.dateOfBirth, 'Date of birth');
                    if (error) {
                      setErrors({ ...errors, dateOfBirth: error });
                    }
                  }}
                />
                {errors.dateOfBirth && (
                  <p className="text-danger-600 text-xs mt-1">{errors.dateOfBirth}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="border-b border-dark-200 pb-6">
          <h3 className="text-lg font-semibold text-dark-800 mb-4">Contact Information</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">
                Phone Number <span className="text-danger-600">*</span>
              </label>
              <input
                type="tel"
                className={`input ${errors.phoneNumber ? 'border-danger-500 focus:border-danger-500' : ''}`}
                placeholder="09123456789"
                value={formData.phoneNumber}
                onChange={(e) => {
                  setFormData({ ...formData, phoneNumber: e.target.value });
                  if (errors.phoneNumber) {
                    setErrors({ ...errors, phoneNumber: '' });
                  }
                }}
                onBlur={(e) => {
                  const error = validateRequiredField(e.target.value, 'Phone number');
                  if (error) {
                    setErrors({ ...errors, phoneNumber: error });
                  }
                }}
                required
              />
              {errors.phoneNumber && (
                <p className="text-danger-600 text-xs mt-1">{errors.phoneNumber}</p>
              )}
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className={`input ${errors.email ? 'border-danger-500 focus:border-danger-500' : ''}`}
                placeholder="john@email.com"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) {
                    setErrors({ ...errors, email: '' });
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value && !validateEmail(e.target.value)) {
                    setErrors({ ...errors, email: 'Please enter a valid email address' });
                  }
                }}
              />
              {errors.email && (
                <p className="text-danger-600 text-xs mt-1">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="label">Address</label>
              <input
                type="text"
                className="input"
                placeholder="City, Province"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Membership - Only show when creating new customer */}
        {!selectedCustomer && (
          <div className="border-b border-dark-200 pb-6">
            <h3 className="text-lg font-semibold text-dark-800 mb-4">Membership & Trainer</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Membership Plan</label>
                <select
                  className="input"
                  value={formData.membershipPlanId}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      membershipPlanId: e.target.value,
                    });
                  }}
                >
                  <option value="">No membership plan</option>
                  {membershipPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.planName} - ₱{parseFloat(plan.price).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="label">Trainer</label>
                <select
                  className="input"
                  value={formData.currentTrainerId}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      currentTrainerId: e.target.value,
                    });
                  }}
                >
                  <option value="">No trainer</option>
                  {trainers.map((trainer) => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
        {/* Health & Emergency */}
        <div>
          <h3 className="text-lg font-semibold text-dark-800 mb-4">Health & Emergency</h3>
          
          {/* Medical Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Medical Notes</label>
                <textarea
                  className="input"
                  rows="3"
                  placeholder="e.g., Asthma, previous injuries, etc."
                  value={formData.medicalNotes}
                  onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Allergies</label>
                <textarea
                  className="input"
                  rows="3"
                  placeholder="e.g., Peanuts, Latex, Penicillin"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="label">Blood Type</label>
                <select
                  className="input"
                  value={formData.bloodType}
                  onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                >
                  <option value="">Select blood type</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div>
                <label className="label">Medical Conditions</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., Diabetes, Hypertension"
                  value={formData.medicalConditions}
                  onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Doctor Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Primary care physician name"
                  value={formData.doctorName}
                  onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Doctor Phone</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="+1 234 567 8901"
                  value={formData.doctorPhone}
                  onChange={(e) => setFormData({ ...formData, doctorPhone: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Current Medications</label>
                <textarea
                  className="input"
                  rows="2"
                  placeholder="List current medications and dosages"
                  value={formData.currentMedications}
                  onChange={(e) => setFormData({ ...formData, currentMedications: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Insurance Provider</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Insurance company name"
                    value={formData.insuranceProvider}
                    onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Policy Number</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Insurance policy number"
                    value={formData.insurancePolicyNumber}
                    onChange={(e) => setFormData({ ...formData, insurancePolicyNumber: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Emergency Contact */}
          <div className="border-t border-dark-200 pt-4 mt-4">
            <h4 className="text-md font-semibold text-dark-700 mb-3">Emergency Contact</h4>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="label">Emergency Contact Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Emergency contact name"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Relationship</label>
                <select
                  className="input"
                  value={formData.emergencyContactRelationship}
                  onChange={(e) => setFormData({ ...formData, emergencyContactRelationship: e.target.value })}
                >
                  <option value="">Select relationship</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Child">Child</option>
                  <option value="Friend">Friend</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Emergency Contact Phone</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="+1 234 567 8901"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Emergency Contact Address</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Emergency contact address"
                  value={formData.emergencyContactAddress}
                  onChange={(e) => setFormData({ ...formData, emergencyContactAddress: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Saving...'
              : selectedCustomer
              ? 'Save Changes'
              : 'Add Customer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CustomerForm;

