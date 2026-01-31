import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { Avatar, Badge } from '../../components/common';
import { ArrowLeft, Activity, FileText, CreditCard, CalendarDays, UserCheck } from 'lucide-react';

import CustomerForm from './customer-forms/CustomerForm';
import { useCustomer } from '../../hooks/useCustomers';
import { mapCustomerToUI } from '../../models/customerModel';
import { formatCurrency } from '../../utils/formatters';
import { CUSTOMER_MEMBERSHIP_STATUS } from '../../constants/customerMembership';

import ProgressTab from './customer-tabs/ProgressTab.page';
import BillsTab from './customer-tabs/BillsTab.page';
import ScansTab from './customer-tabs/ScansTab.page';
import PtSessionsTab from './customer-tabs/PtSessionsTab';
import ClassAttendanceTab from './customer-tabs/ClassAttendanceTab';

/* --------------------------- Tab Config --------------------------- */
const customerTabs = [
  { key: 'progress', label: 'Progress Tracking', icon: Activity, component: ProgressTab },
  { key: 'scans', label: 'Scans', icon: FileText, component: ScansTab },
  { key: 'bills', label: 'Plans & Billing', icon: CreditCard, component: BillsTab },
  { key: 'pt-sessions', label: 'PT Sessions', icon: CalendarDays, component: PtSessionsTab },
  { key: 'class-attendance', label: 'Class Attendance', icon: UserCheck, component: ClassAttendanceTab },
];

/* --------------------------- Profile Header --------------------------- */
const ProfileHeader = ({ member, onEdit }) => (
  <div className="card mb-4">
    <div className="flex items-center justify-between gap-6">
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
                  : 'danger'}
              size="sm"
            >
              {member.membershipStatus}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-dark-500 flex-wrap">
            {member.gender && <span>Gender: {member.gender}</span>}
            {member.age && <span>• Age: {member.age} years old</span>}
            {member.medicalConditions && <span>• Medical Conditions: <span className="text-danger-600 font-medium">{member.medicalConditions}</span></span>}
            {member.allergies && <span>• Allergies: <span className="text-warning-600 font-medium">{member.allergies}</span></span>}
            {member.membership && <span>• Membership: <span className="text-success-600 font-medium">{member.membership}</span></span>}
            {member.trainer && <span>• Trainer: {member.trainer}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="text-xs text-dark-400 mb-1">Balance</div>
          <div className="text-lg font-semibold text-danger-600">{formatCurrency(member.balance)}</div>
        </div>
        <button onClick={onEdit} className="btn-secondary flex items-center gap-2 text-sm py-2 px-4">
          Edit
        </button>
      </div>
    </div>
  </div>
);

/* --------------------------- Profile Stats --------------------------- */
const ProfileStats = ({ member }) => (
  <div className="card mb-6">
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <div>
        <p className="text-xs text-dark-400 mb-0.5">Email</p>
        <p className="text-sm text-dark-200">{member.email}</p>
      </div>
      <div>
        <p className="text-xs text-dark-400 mb-0.5">Phone</p>
        <p className="text-sm text-dark-700">{member.phone}</p>
      </div>
      {member.birthDate && (
        <div>
          <p className="text-xs text-dark-400 mb-0.5">Birthday</p>
          <p className="text-sm text-dark-700">{member.birthDate}</p>
        </div>
      )}
      <div>
        <p className="text-xs text-dark-400 mb-0.5">Membership Expires</p>
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
);

/* --------------------------- Main Page --------------------------- */
const CustomerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'progress';

  const [showEditModal, setShowEditModal] = useState(false);

  const { data: customer, isLoading: loading, refetch: refetchCustomer } = useCustomer(id);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (customer) setFormData(mapCustomerToUI(customer));
  }, [customer]);

  const member = useMemo(() => mapCustomerToUI(customer), [customer]);

  if (loading) return (
    <Layout title="Loading...">
      <div className="card text-center py-12">
        Loading Member profile...
      </div>
    </Layout>
  );

  if (!member) return (
    <Layout title="Customer Not Found">
      <div className="card text-center py-12">
        Member not found
        <button onClick={() => navigate('/members')} className="btn-primary mt-4">Back to Members</button>
      </div>
    </Layout>
  );

  const ActiveTabComponent = customerTabs.find(t => t.key === activeTab)?.component;

  return (
    <Layout title={member.name} subtitle="Member Profile">
      {/* Back Button */}
      <button onClick={() => navigate('/members')} className="flex items-center gap-2 text-dark-500 hover:text-dark-700 mb-4 transition-colors">
        <ArrowLeft className="w-5 h-5" /> Back to Members
      </button>

      <ProfileHeader member={member} onEdit={() => setShowEditModal(true)} />
      <ProfileStats member={member} />

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-dark-200 pb-2">
        {customerTabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setSearchParams({ tab: tab.key })}
              className={`flex items-center gap-2 px-4 py-3 rounded-t-lg font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-primary-500 text-white'
                  : 'text-dark-500 hover:bg-dark-100'
              }`}
            >
              <Icon className="w-5 h-5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      {ActiveTabComponent && (
        <ActiveTabComponent 
          member={member} 
          onCustomerUpdate={async () => {
            await refetchCustomer();
          }}
        />
      )}

      {/* Edit Modal */}
      {formData && (
        <CustomerForm
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          formData={formData}
          setFormData={setFormData}
          selectedCustomer={customer}
          onSaveSuccess={async () => {
            setShowEditModal(false);
            setFormData(mapCustomerToUI(customer));
            await refetchCustomer();
          }}
        />
      )}
    </Layout>
  );
};

export default CustomerProfile;
