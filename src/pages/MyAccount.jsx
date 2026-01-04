import { useState } from 'react';
import Layout from '../components/layout/Layout';
import { Avatar, Badge, Modal } from '../components/common';
import {
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Edit,
  CreditCard,
  Calendar,
  Check,
  Star,
  Download,
  ArrowUpRight,
  Shield,
  Key,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MyAccount = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Mock account data
  const accountData = {
    gym: {
      name: 'FitPro Gym',
      email: 'admin@fitprogym.com',
      phone: '+1 234 567 8900',
      address: '123 Fitness Street, Gym City, GC 12345',
      website: 'www.fitprogym.com',
    },
    subscription: {
      plan: 'Professional',
      status: 'active',
      price: 99,
      billingCycle: 'monthly',
      nextBilling: '2025-01-09',
      startDate: '2024-01-09',
      features: [
        'Unlimited Members',
        'Up to 10 Staff Accounts',
        'Advanced Reports',
        'Email Notifications',
        'Priority Support',
        'Custom Branding',
      ],
    },
    paymentMethod: {
      type: 'card',
      brand: 'Visa',
      last4: '4242',
      expiry: '12/26',
    },
    invoices: [
      { id: 1, date: '2024-12-09', amount: 99, status: 'paid', invoice: 'INV-2024-012' },
      { id: 2, date: '2024-11-09', amount: 99, status: 'paid', invoice: 'INV-2024-011' },
      { id: 3, date: '2024-10-09', amount: 99, status: 'paid', invoice: 'INV-2024-010' },
      { id: 4, date: '2024-09-09', amount: 99, status: 'paid', invoice: 'INV-2024-009' },
      { id: 5, date: '2024-08-09', amount: 99, status: 'paid', invoice: 'INV-2024-008' },
    ],
  };

  const plans = [
    {
      name: 'Starter',
      price: 49,
      features: ['Up to 100 Members', '2 Staff Accounts', 'Basic Reports', 'Email Support'],
      current: false,
    },
    {
      name: 'Professional',
      price: 99,
      features: ['Unlimited Members', '10 Staff Accounts', 'Advanced Reports', 'Priority Support', 'Custom Branding'],
      current: true,
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 199,
      features: ['Unlimited Everything', 'Unlimited Staff', 'White Label', 'API Access', 'Dedicated Support', 'Custom Integrations'],
      current: false,
    },
  ];

  // Define tabs based on role - Admin sees subscription/billing, Trainer only sees profile
  // Commented out subscription and billing tabs for future use
  // const adminTabs = [
  //   { key: 'profile', label: 'Profile & Security', icon: User },
  //   { key: 'subscription', label: 'Subscription', icon: CreditCard },
  //   { key: 'billing', label: 'Billing History', icon: Calendar },
  // ];

  // const trainerTabs = [
  //   { key: 'profile', label: 'Profile & Security', icon: User },
  // ];

  // const tabs = isAdmin ? adminTabs : trainerTabs;

  // Only show Profile & Security tab for now
  // Commented out tabs since there's only one tab
  // const tabs = [
  //   { key: 'profile', label: 'Profile & Security', icon: User },
  // ];

  return (
    <Layout title="My Account" subtitle="Manage your account settings">
      {/* Tabs - Commented out since there's only one tab */}
      {/* <div className="flex gap-2 mb-6 border-b border-dark-200 pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 rounded-t-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-primary-500 text-white'
                : 'text-dark-500 hover:bg-dark-100'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div> */}

      {/* Profile & Security Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Account Owner Info */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-dark-50">My Profile</h3>
              <button
                onClick={() => setShowEditModal(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
            </div>
            <div className="flex items-center gap-6">
              <Avatar src={user.avatar} name={user.fullname} size="xl" />
              <div className="flex-1">
                <h4 className="text-xl font-bold text-dark-50">{user.fullname}</h4>
                <p className="text-dark-500">{user.email}</p>
                <Badge variant="primary" size="lg">
                  {user.role}
                </Badge>
              </div>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-dark-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-100 rounded-xl">
                  <Mail className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-dark-400">Email</p>
                  <p className="font-semibold text-dark-50">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success-100 rounded-xl">
                  <Phone className="w-6 h-6 text-success-600" />
                </div>
                <div>
                  <p className="text-sm text-dark-400">Phone</p>
                  <p className="font-semibold text-dark-50">+1 234 567 8900</p>
                </div>
              </div>
            </div>
          </div>

          {/* Business Info - Admin Only */}
          {isAdmin && (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-dark-50">Business Information</h3>
                <button className="btn-secondary flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary-100 rounded-xl">
                    <Building className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-dark-400">Business Name</p>
                    <p className="font-semibold text-dark-50">{accountData.gym.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-success-100 rounded-xl">
                    <Mail className="w-6 h-6 text-success-600" />
                  </div>
                  <div>
                    <p className="text-sm text-dark-400">Business Email</p>
                    <p className="font-semibold text-dark-50">{accountData.gym.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-accent-100 rounded-xl">
                    <Phone className="w-6 h-6 text-accent-600" />
                  </div>
                  <div>
                    <p className="text-sm text-dark-400">Business Phone</p>
                    <p className="font-semibold text-dark-50">{accountData.gym.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-warning-100 rounded-xl">
                    <MapPin className="w-6 h-6 text-warning-600" />
                  </div>
                  <div>
                    <p className="text-sm text-dark-400">Address</p>
                    <p className="font-semibold text-dark-50">{accountData.gym.address}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Section */}
          <div className="card">
            <h3 className="text-lg font-semibold text-dark-50 mb-6">Security</h3>
            
            <div className="space-y-4">
              {/* Password */}
              <div className="flex items-center justify-between p-4 bg-dark-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary-100 rounded-xl">
                    <Key className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-dark-50">Password</h4>
                    <p className="text-sm text-dark-500">Last changed 30 days ago</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPasswordModal(true)}
                  className="btn-secondary"
                >
                  Change Password
                </button>
              </div>

              {/* Two-Factor Authentication - Commented out for future use */}
              {/* <div className="flex items-center justify-between p-4 bg-dark-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-success-100 rounded-xl">
                    <Shield className="w-6 h-6 text-success-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-dark-50">Two-Factor Authentication</h4>
                    <p className="text-sm text-dark-500">Add an extra layer of security</p>
                  </div>
                </div>
                <button className="btn-primary">Enable 2FA</button>
              </div> */}
            </div>
          </div>

          {/* Active Sessions - Commented out for future use */}
          {/* <div className="card">
            <h3 className="text-lg font-semibold text-dark-800 mb-4">Active Sessions</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-dark-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-success-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-success-600" />
                  </div>
                  <div>
                    <p className="font-medium text-dark-800">Current Session</p>
                    <p className="text-sm text-dark-500">Chrome on Windows • IP: 192.168.1.1</p>
                  </div>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-dark-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-dark-200 rounded-lg">
                    <Clock className="w-5 h-5 text-dark-500" />
                  </div>
                  <div>
                    <p className="font-medium text-dark-800">Mobile App</p>
                    <p className="text-sm text-dark-500">iOS • Last active 2 hours ago</p>
                  </div>
                </div>
                <button className="text-danger-600 hover:text-danger-700 text-sm font-medium">
                  Revoke
                </button>
              </div>
            </div>
          </div> */}
        </div>
      )}

      {/* Subscription Tab - Admin Only */}
      {activeTab === 'subscription' && isAdmin && (
        <div className="space-y-6">
          {/* Current Plan */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-dark-50">Current Plan</h3>
              <Badge variant="success" size="lg">
                {accountData.subscription.status}
              </Badge>
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl text-white">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-6 h-6 text-warning-300" />
                  <span className="text-2xl font-bold">{accountData.subscription.plan}</span>
                </div>
                <p className="text-primary-100">
                  ${accountData.subscription.price}/{accountData.subscription.billingCycle}
                </p>
              </div>
              <div className="text-right">
                <p className="text-primary-100 text-sm">Next billing date</p>
                <p className="text-xl font-semibold">{accountData.subscription.nextBilling}</p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-semibold text-dark-50 mb-4">Plan Features</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {accountData.subscription.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-success-500" />
                    <span className="text-dark-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-dark-100 flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <ArrowUpRight className="w-4 h-4" />
                Upgrade Plan
              </button>
              <button className="btn-secondary">Cancel Subscription</button>
            </div>
          </div>

          {/* Payment Method */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-dark-50">Payment Method</h3>
              <button
                onClick={() => setShowPaymentMethodModal(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Update
              </button>
            </div>
            <div className="flex items-center gap-4 p-4 bg-dark-50 rounded-xl">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <CreditCard className="w-8 h-8 text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-dark-50">
                  {accountData.paymentMethod.brand} •••• {accountData.paymentMethod.last4}
                </p>
                <p className="text-sm text-dark-500">
                  Expires {accountData.paymentMethod.expiry}
                </p>
              </div>
            </div>
          </div>

          {/* Available Plans */}
          <div className="card">
            <h3 className="text-lg font-semibold text-dark-50 mb-6">Available Plans</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative p-6 rounded-xl border-2 ${
                    plan.current
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-dark-200 hover:border-primary-300'
                  } transition-colors`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="primary">Most Popular</Badge>
                    </div>
                  )}
                  {plan.current && (
                    <div className="absolute -top-3 right-4">
                      <Badge variant="success">Current</Badge>
                    </div>
                  )}
                  <h4 className="text-xl font-bold text-dark-50">{plan.name}</h4>
                  <div className="flex items-baseline gap-1 mt-2 mb-4">
                    <span className="text-3xl font-bold text-primary-600">${plan.price}</span>
                    <span className="text-dark-500">/month</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-dark-600">
                        <Check className="w-4 h-4 text-success-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {plan.current ? (
                    <button className="w-full btn-secondary" disabled>
                      Current Plan
                    </button>
                  ) : (
                    <button className="w-full btn-primary">
                      {plan.price > accountData.subscription.price ? 'Upgrade' : 'Downgrade'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Billing History Tab - Admin Only */}
      {activeTab === 'billing' && isAdmin && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-dark-50">Payment History</h3>
            <button className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-50">
                  <th className="table-header">Invoice</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {accountData.invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-dark-700">
                    <td className="table-cell font-medium text-dark-50">
                      {invoice.invoice}
                    </td>
                    <td className="table-cell">{invoice.date}</td>
                    <td className="table-cell font-semibold">${invoice.amount}</td>
                    <td className="table-cell">
                      <Badge variant="success">{invoice.status}</Badge>
                    </td>
                    <td className="table-cell">
                      <button className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium">
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Profile"
        size="md"
      >
        <form className="space-y-4">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Avatar src={user.avatar} name={user.fullname} size="xl" />
              <button type="button" className="absolute bottom-0 right-0 p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors">
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name</label>
              <input type="text" className="input" defaultValue={user.firstname || ''} />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input type="text" className="input" defaultValue={user.lastname || ''} />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" defaultValue={user.email} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input type="tel" className="input" defaultValue="+1 234 567 8900" />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
        size="md"
      >
        <form className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" placeholder="Enter current password" />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" placeholder="Enter new password" />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" className="input" placeholder="Confirm new password" />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary">
              Update Password
            </button>
          </div>
        </form>
      </Modal>

      {/* Upgrade Plan Modal - Admin Only */}
      {isAdmin && (
        <Modal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          title="Upgrade Your Plan"
          size="lg"
        >
          <div className="space-y-6">
            <p className="text-dark-500">
              Choose a plan that best fits your gym's needs. You can upgrade or downgrade at any time.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.filter((p) => !p.current).map((plan) => (
                <div
                  key={plan.name}
                  className="p-4 border border-dark-200 rounded-xl hover:border-primary-500 transition-colors cursor-pointer"
                >
                  <h4 className="font-bold text-dark-800">{plan.name}</h4>
                  <p className="text-2xl font-bold text-primary-600 mt-2">${plan.price}/mo</p>
                  <ul className="mt-4 space-y-2">
                    {plan.features.slice(0, 4).map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-dark-600">
                        <Check className="w-4 h-4 text-success-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button className="w-full btn-primary mt-4">Select Plan</button>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Update Payment Method Modal - Admin Only */}
      {isAdmin && (
        <Modal
          isOpen={showPaymentMethodModal}
          onClose={() => setShowPaymentMethodModal(false)}
          title="Update Payment Method"
          size="md"
        >
          <form className="space-y-4">
            <div>
              <label className="label">Card Number</label>
              <input type="text" className="input" placeholder="1234 5678 9012 3456" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Expiry Date</label>
                <input type="text" className="input" placeholder="MM/YY" />
              </div>
              <div>
                <label className="label">CVC</label>
                <input type="text" className="input" placeholder="123" />
              </div>
            </div>
            <div>
              <label className="label">Name on Card</label>
              <input type="text" className="input" placeholder="John Doe" />
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setShowPaymentMethodModal(false)} className="flex-1 btn-secondary">
                Cancel
              </button>
              <button type="submit" className="flex-1 btn-primary">
                Update Card
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
};

export default MyAccount;
