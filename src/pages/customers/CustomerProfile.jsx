import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { Avatar, Badge } from '../../components/common';
import {
  ArrowLeft,
  Activity,
  CalendarDays,
  User,
  Edit,
  CreditCard,
  FileText,
  FolderOpen,
} from 'lucide-react';
import {
  mockPayments,
  mockProgressLogs,
  mockAppointments,
} from '../../data/mockData';
import { useCustomer } from '../../hooks/useCustomers';
import CustomerForm from './CustomerForm';
import { getInitialCustomerFormData, mapCustomerToFormData } from '../../models/customerModel';
import { calculateAge, formatDate, formatCurrency } from '../../utils/formatters';
import ProgressTab from './customer-tabs/ProgressTab';
import BillsTab from './customer-tabs/BillsTab';
import AppointmentsTab from './customer-tabs/AppointmentsTab';
import ScansTab from './customer-tabs/ScansTab';
import FilesTab from './customer-tabs/FilesTab';
import { CUSTOMER_MEMBERSHIP_STATUS } from '../../constants/customerMembership';

const CustomerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'progress';
  
  const [showEditModal, setShowEditModal] = useState(false);

  // React Query hook
  const { data: customer, isLoading: loading, error, refetch: refetchCustomer } = useCustomer(id);
  const [formData, setFormData] = useState(getInitialCustomerFormData());
  
  // Update form data when customer is loaded or modal is opened
  useEffect(() => {
    if (customer && showEditModal) {
      setFormData(mapCustomerToFormData(customer));
    }
  }, [customer, showEditModal]);

  // Initialize tab from URL if not present
  useEffect(() => {
    if (!searchParams.get('tab')) {
      setSearchParams({ tab: 'progress' }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Transform customer data to match expected format
  const member = useMemo(() => {
    if (!customer) return null;
    
    return {
      id: customer.id,
      name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email || 'N/A',
      phone: customer.phoneNumber || 'N/A',
      avatar: customer.photo,
      gender: customer.gender,
      dateOfBirth: customer.dateOfBirth,
      age: calculateAge(customer.dateOfBirth),
      address: customer.address,
      membership: customer.currentMembership?.membershipPlan?.planName || 'N/A',
      membershipStatus: customer.currentMembership?.status || 'N/A',
      membershipExpiry: customer.currentMembership?.membershipEndDate 
        ? formatDate(customer.currentMembership.membershipEndDate) 
        : 'N/A',
      joinDate: customer.createdAt ? formatDate(customer.createdAt) : 'N/A',
      trainer: customer.currentTrainer?.name || null,
      balance: customer.balance || 0,
      totalVisits: 0, // Will be added when check-in system is integrated
      // Include all customer fields
      ...customer,
    };
  }, [customer]);

  if (loading) {
    return (
      <Layout title="Loading...">
        <div className="card text-center py-12">
          <p className="text-dark-500">Loading Member profile...</p>
        </div>
      </Layout>
    );
  }

  if (!member) {
    return (
      <Layout title="Customer Not Found">
        <div className="card text-center py-12">
          <User className="w-16 h-16 text-dark-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-dark-300">Member not found</h3>
          <button onClick={() => navigate('/customers')} className="btn-primary mt-4">
            Back to Members
          </button>
        </div>
      </Layout>
    );
  }

  // Get member-specific data
  const memberPayments = mockPayments.filter((p) => p.memberId === member.id);
  const memberProgress = mockProgressLogs.filter((p) => p.memberId === member.id);
  const memberAppointments = mockAppointments.filter((a) => a.memberId === member.id);

  const tabs = [
    { key: 'progress', label: 'Progress Tracking', icon: Activity },
    { key: 'scans', label: 'Scans', icon: FileText },
    { key: 'bills', label: 'Membership Plan & Payments', icon: CreditCard },
    // { key: 'appointments', label: 'Appointments', icon: CalendarDays },
    // { key: 'files', label: 'Files', icon: FolderOpen },
  ];

  return (
    <Layout
      title={member.name}
      subtitle="Member Profile"
    >
      {/* Back Button */}
      <button
        onClick={() => navigate('/customers')}
        className="flex items-center gap-2 text-dark-500 hover:text-dark-700 mb-4 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Members
      </button>

      {/* Profile Header */}
      <div className="card mb-4">
        <div className="flex items-center justify-between gap-6">
          {/* Left Side: Avatar & Customer Info */}
          <div className="flex items-center gap-4 flex-1">
            <Avatar src={member.avatar} name={member.name} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-dark-50">{member.name}</h2>
                <Badge
                  variant={
                    member.membershipStatus === CUSTOMER_MEMBERSHIP_STATUS.ACTIVE
                      ? 'success'
                      : member.membershipStatus === CUSTOMER_MEMBERSHIP_STATUS.EXPIRED
                      ? 'warning'
                      : 'danger'
                  }
                  size="sm"
                >
                  {member.membershipStatus}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-sm text-dark-500 flex-wrap">
                {member.gender && <span>Gender: {member.gender}</span>}
                {member.age && <span>• Age: {member.age} years old</span>}
                {member.medicalConditions && (
                  <span>• Medical Conditions: 
                    <span className="text-danger-600 font-medium"> {member.medicalConditions}</span>
                  </span>
                )}
                {member.allergies && (
                  <span>• Allergies: 
                    <span className="text-warning-600 font-medium"> {member.allergies}</span>
                  </span>
                )}
                {member.membership && (
                  <span>
                    • Membership:{' '}
                    <span className="text-success-600 font-medium"> {member.membership}</span>
                  </span>
                )}
                {member.trainer && <span>• Trainer: {member.trainer}</span>}
              </div>
            </div>
          </div>

          {/* Right Side: Quick Info & Actions */}
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-xs text-dark-400 mb-1">Balance</div>
              <div className="text-lg font-semibold text-danger-600">
                {formatCurrency(member.balance)}
              </div>
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="btn-secondary flex items-center gap-2 text-sm py-2 px-4"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          </div>
        </div>

        {/* Contact Info - Simplified */}
        <div className="mt-4 pt-4 border-t border-dark-100">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-dark-400 mb-0.5">Email</p>
              <p className="text-sm text-dark-200">{member.email}</p>
            </div>
            <div>
              <p className="text-xs text-dark-400 mb-0.5">Phone</p>
              <p className="text-sm text-dark-700">{member.phone}</p>
            </div>
            {member.dateOfBirth && (
              <div>
                <p className="text-xs text-dark-400 mb-0.5">Birthday</p>
                <p className="text-sm text-dark-700">{formatDate(member.dateOfBirth)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-dark-400 mb-0.5">Expires</p>
              <p className="text-sm text-dark-700">{member.membershipExpiry}</p>
            </div>
            {member.address && (
              <div>
                <p className="text-xs text-dark-400 mb-0.5">Address</p>
                <p className="text-sm text-dark-700 truncate">{member.address}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-dark-200 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSearchParams({ tab: tab.key })}
            className={`flex items-center gap-2 px-4 py-3 rounded-t-lg font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-primary-500 text-white'
                : 'text-dark-500 hover:bg-dark-100'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'progress' && (
        <ProgressTab
          member={member}
          progressLogs={memberProgress}
        />
      )}

      {activeTab === 'bills' && (
        <BillsTab
          member={member}
          payments={memberPayments}
          onCustomerUpdate={() => {
            // Only refetch if bills tab is active
            if (activeTab === 'bills') {
              refetchCustomer();
            }
          }}
        />
      )}

      {activeTab === 'scans' && (
        <ScansTab
          member={member}
        />
      )}

      {/* {activeTab === 'appointments' && (
        <AppointmentsTab
          member={member}
          appointments={memberAppointments}
        />
      )}

      {activeTab === 'files' && (
        <FilesTab
          member={member}
        />
      )} */}

      {/* Edit Profile Modal */}
      <CustomerForm
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setFormData(getInitialCustomerFormData());
        }}
        formData={formData}
        setFormData={setFormData}
        selectedCustomer={customer}
        onSaveSuccess={async () => {
          setShowEditModal(false);
          setFormData(getInitialCustomerFormData());
          // Force refetch to ensure UI updates
          await refetchCustomer();
        }}
      />
    </Layout>
  );
};

export default CustomerProfile;
