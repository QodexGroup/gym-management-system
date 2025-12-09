import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { Avatar, Badge, Modal } from '../../components/common';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Activity,
  CalendarDays,
  User,
  Edit,
  Clock,
  DollarSign,
  Plus,
  Scale,
  Ruler,
  TrendingUp,
  TrendingDown,
  Camera,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Receipt,
  Banknote,
  Send,
  UserCheck,
  Target,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  mockMembers,
  mockPayments,
  mockProgressLogs,
  mockAppointments,
  mockTrainers,
  mockMembershipPlans,
  appointmentTypes,
} from '../../data/mockData';

const CustomerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('progress');
  const [member, setMember] = useState(null);
  
  // Modals
  const [showAddProgressModal, setShowAddProgressModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const foundMember = mockMembers.find((m) => m.id === parseInt(id));
    if (foundMember) {
      setMember(foundMember);
    }
  }, [id]);

  if (!member) {
    return (
      <Layout title="Customer Not Found">
        <div className="card text-center py-12">
          <User className="w-16 h-16 text-dark-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-dark-600">Customer not found</h3>
          <button onClick={() => navigate('/customers')} className="btn-primary mt-4">
            Back to Customers
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
    { key: 'bills', label: 'Bills & Payment', icon: CreditCard },
    { key: 'appointments', label: 'Appointments', icon: CalendarDays },
  ];

  return (
    <Layout
      title={member.name}
      subtitle="Customer Profile"
    >
      {/* Back Button */}
      <button
        onClick={() => navigate('/customers')}
        className="flex items-center gap-2 text-dark-500 hover:text-dark-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Customers
      </button>

      {/* Profile Header */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Avatar src={member.avatar} name={member.name} size="xl" />
            <div>
              <h2 className="text-2xl font-bold text-dark-800">{member.name}</h2>
              <p className="text-dark-500">{member.membership}</p>
              <div className="flex items-center gap-3 mt-2">
                <Badge
                  variant={
                    member.membershipStatus === 'active'
                      ? 'success'
                      : member.membershipStatus === 'expiring'
                      ? 'warning'
                      : 'danger'
                  }
                  size="lg"
                >
                  {member.membershipStatus}
                </Badge>
                {member.trainer && (
                  <span className="text-sm text-dark-500">
                    Trainer: {member.trainer}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowEditModal(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Contact Info & Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-dark-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Mail className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-dark-400">Email</p>
              <p className="text-sm font-medium text-dark-700">{member.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success-100 rounded-lg">
              <Phone className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="text-xs text-dark-400">Phone</p>
              <p className="text-sm font-medium text-dark-700">{member.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning-100 rounded-lg">
              <Calendar className="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <p className="text-xs text-dark-400">Member Since</p>
              <p className="text-sm font-medium text-dark-700">{member.joinDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-100 rounded-lg">
              <Clock className="w-5 h-5 text-accent-600" />
            </div>
            <div>
              <p className="text-xs text-dark-400">Expires</p>
              <p className="text-sm font-medium text-dark-700">{member.membershipExpiry}</p>
            </div>
          </div>
        </div>

        {/* Balance Alert */}
        {member.balance > 0 && (
          <div className="mt-6 p-4 bg-danger-50 rounded-xl border border-danger-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-danger-500" />
              <div>
                <p className="font-medium text-danger-700">Outstanding Balance</p>
                <p className="text-sm text-danger-600">${member.balance} payment due</p>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveTab('bills');
                setShowPaymentModal(true);
              }}
              className="btn-danger"
            >
              Record Payment
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-dark-200 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
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
          onAddProgress={() => setShowAddProgressModal(true)}
        />
      )}

      {activeTab === 'bills' && (
        <BillsTab
          member={member}
          payments={memberPayments}
          onRecordPayment={() => setShowPaymentModal(true)}
          onGenerateInvoice={() => setShowInvoiceModal(true)}
        />
      )}

      {activeTab === 'appointments' && (
        <AppointmentsTab
          member={member}
          appointments={memberAppointments}
          onNewAppointment={() => setShowAppointmentModal(true)}
        />
      )}

      {/* Add Progress Modal */}
      <Modal
        isOpen={showAddProgressModal}
        onClose={() => setShowAddProgressModal(false)}
        title="Add Progress Log"
        size="lg"
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Weight (kg)</label>
              <input type="number" step="0.1" className="input" placeholder="82.5" />
            </div>
            <div>
              <label className="label">Body Fat %</label>
              <input type="number" step="0.1" className="input" placeholder="18.5" />
            </div>
          </div>
          <div>
            <label className="label">Body Measurements (cm)</label>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <input type="number" className="input" placeholder="Chest" />
                <p className="text-xs text-dark-400 mt-1">Chest</p>
              </div>
              <div>
                <input type="number" className="input" placeholder="Waist" />
                <p className="text-xs text-dark-400 mt-1">Waist</p>
              </div>
              <div>
                <input type="number" className="input" placeholder="Arms" />
                <p className="text-xs text-dark-400 mt-1">Arms</p>
              </div>
              <div>
                <input type="number" className="input" placeholder="Thighs" />
                <p className="text-xs text-dark-400 mt-1">Thighs</p>
              </div>
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={3} placeholder="Add notes about progress..." />
          </div>
          <div>
            <label className="label">Upload Photos (Optional)</label>
            <div className="border-2 border-dashed border-dark-200 rounded-xl p-8 text-center hover:border-primary-500 transition-colors cursor-pointer">
              <Camera className="w-12 h-12 text-dark-300 mx-auto mb-3" />
              <p className="text-dark-500">Click to upload progress photos</p>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowAddProgressModal(false)} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary">
              Save Progress
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Record Payment"
        size="md"
      >
        <form className="space-y-4">
          <div className="p-4 bg-dark-50 rounded-xl flex items-center gap-4">
            <Avatar src={member.avatar} name={member.name} size="md" />
            <div>
              <p className="font-semibold text-dark-800">{member.name}</p>
              <p className="text-sm text-dark-500">{member.membership}</p>
            </div>
          </div>
          <div>
            <label className="label">Amount</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input type="number" className="input pl-10" placeholder="0.00" defaultValue={member.balance > 0 ? member.balance : ''} />
            </div>
          </div>
          <div>
            <label className="label">Payment Type</label>
            <select className="input">
              <option>Membership Renewal</option>
              <option>Monthly Subscription</option>
              <option>PT Package</option>
              <option>Outstanding Balance</option>
            </select>
          </div>
          <div>
            <label className="label">Payment Method</label>
            <div className="grid grid-cols-3 gap-3">
              <label className="flex items-center justify-center gap-2 p-3 border border-dark-200 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors [&:has(input:checked)]:border-primary-500 [&:has(input:checked)]:bg-primary-50">
                <input type="radio" name="method" value="cash" className="hidden" />
                <Banknote className="w-5 h-5" />
                <span>Cash</span>
              </label>
              <label className="flex items-center justify-center gap-2 p-3 border border-dark-200 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors [&:has(input:checked)]:border-primary-500 [&:has(input:checked)]:bg-primary-50">
                <input type="radio" name="method" value="card" className="hidden" defaultChecked />
                <CreditCard className="w-5 h-5" />
                <span>Card</span>
              </label>
              <label className="flex items-center justify-center gap-2 p-3 border border-dark-200 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors [&:has(input:checked)]:border-primary-500 [&:has(input:checked)]:bg-primary-50">
                <input type="radio" name="method" value="transfer" className="hidden" />
                <Receipt className="w-5 h-5" />
                <span>Transfer</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-success">
              Record Payment
            </button>
          </div>
        </form>
      </Modal>

      {/* Generate Invoice Modal */}
      <Modal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        title="Generate Invoice"
        size="md"
      >
        <form className="space-y-4">
          <div>
            <label className="label">Invoice For</label>
            <select className="input">
              <option>Membership Renewal</option>
              <option>Personal Training Package</option>
              <option>Outstanding Balance</option>
              <option>Custom Amount</option>
            </select>
          </div>
          <div>
            <label className="label">Membership Plan</label>
            <select className="input">
              {mockMembershipPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - ${plan.price}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Discount (Optional)</label>
            <div className="relative">
              <input type="number" className="input pr-10" placeholder="0" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400">%</span>
            </div>
          </div>
          <div>
            <label className="label">Due Date</label>
            <input type="date" className="input" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="sendEmail" className="w-4 h-4" />
            <label htmlFor="sendEmail" className="text-sm text-dark-600">Send invoice via email</label>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowInvoiceModal(false)} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary">
              Generate Invoice
            </button>
          </div>
        </form>
      </Modal>

      {/* New Appointment Modal */}
      <Modal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        title="Schedule Appointment"
        size="lg"
      >
        <form className="space-y-4">
          <div className="p-4 bg-dark-50 rounded-xl flex items-center gap-4">
            <Avatar src={member.avatar} name={member.name} size="md" />
            <div>
              <p className="font-semibold text-dark-800">{member.name}</p>
              <p className="text-sm text-dark-500">{member.membership}</p>
            </div>
          </div>
          <div>
            <label className="label">Appointment Type</label>
            <select className="input">
              {appointmentTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Assign Trainer</label>
            <select className="input">
              <option value="">Select a trainer</option>
              {mockTrainers.map((trainer) => (
                <option key={trainer.id} value={trainer.id}>
                  {trainer.name} - {trainer.specialization}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" />
            </div>
            <div>
              <label className="label">Time</label>
              <input type="time" className="input" />
            </div>
          </div>
          <div>
            <label className="label">Duration</label>
            <select className="input">
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
            </select>
          </div>
          <div>
            <label className="label">Notes (Optional)</label>
            <textarea className="input" rows={2} placeholder="Add notes..." />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowAppointmentModal(false)} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary">
              Schedule Appointment
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Customer Profile"
        size="lg"
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name</label>
              <input type="text" className="input" defaultValue={member.name.split(' ')[0]} />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input type="text" className="input" defaultValue={member.name.split(' ')[1]} />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" defaultValue={member.email} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input type="tel" className="input" defaultValue={member.phone} />
          </div>
          <div>
            <label className="label">Membership Plan</label>
            <select className="input" defaultValue={member.membership}>
              {mockMembershipPlans.map((plan) => (
                <option key={plan.id} value={plan.name}>{plan.name} - ${plan.price}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Assigned Trainer</label>
            <select className="input" defaultValue={member.trainer || ''}>
              <option value="">No trainer assigned</option>
              {mockTrainers.map((trainer) => (
                <option key={trainer.id} value={trainer.name}>{trainer.name}</option>
              ))}
            </select>
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
    </Layout>
  );
};

// Progress Tab Component
const ProgressTab = ({ member, progressLogs, onAddProgress }) => {
  const weightData = progressLogs.map((log) => ({
    date: log.date,
    weight: log.weight,
    bodyFat: log.bodyFat,
  }));

  const latestLog = progressLogs[0];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card border-l-4 border-l-primary-500">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-100 rounded-xl">
              <Scale className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-dark-500">Current Weight</p>
              <p className="text-2xl font-bold text-dark-800">{latestLog?.weight || '--'} kg</p>
              {progressLogs.length > 1 && latestLog && (
                <div className="flex items-center gap-1 mt-1">
                  {latestLog.weight < progressLogs[1].weight ? (
                    <>
                      <TrendingDown className="w-4 h-4 text-success-500" />
                      <span className="text-xs text-success-600">
                        -{(progressLogs[1].weight - latestLog.weight).toFixed(1)} kg
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 text-warning-500" />
                      <span className="text-xs text-warning-600">
                        +{(latestLog.weight - progressLogs[1].weight).toFixed(1)} kg
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-l-accent-500">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent-100 rounded-xl">
              <Activity className="w-6 h-6 text-accent-600" />
            </div>
            <div>
              <p className="text-sm text-dark-500">Body Fat</p>
              <p className="text-2xl font-bold text-dark-800">{latestLog?.bodyFat || '--'}%</p>
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-l-success-500">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-success-100 rounded-xl">
              <Target className="w-6 h-6 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-dark-500">Total Visits</p>
              <p className="text-2xl font-bold text-dark-800">{member.totalVisits}</p>
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-l-warning-500">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-warning-100 rounded-xl">
              <Calendar className="w-6 h-6 text-warning-600" />
            </div>
            <div>
              <p className="text-sm text-dark-500">Last Update</p>
              <p className="text-lg font-bold text-dark-800">{latestLog?.date || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-dark-800">Weight Progress</h3>
            <button onClick={onAddProgress} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Log
            </button>
          </div>
          <div className="h-64">
            {weightData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} domain={['auto', 'auto']} />
                  <Tooltip />
                  <Area type="monotone" dataKey="weight" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.2} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-dark-400">
                No progress data yet
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-dark-800 mb-4">Body Fat Progress</h3>
          <div className="h-64">
            {weightData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} domain={['auto', 'auto']} />
                  <Tooltip />
                  <Line type="monotone" dataKey="bodyFat" stroke="#d946ef" strokeWidth={2} dot={{ fill: '#d946ef' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-dark-400">
                No progress data yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Measurements */}
      {latestLog?.measurements && (
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-800 mb-4">Body Measurements</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-dark-50 rounded-xl text-center">
              <Ruler className="w-6 h-6 text-primary-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-dark-800">{latestLog.measurements.chest} cm</p>
              <p className="text-sm text-dark-500">Chest</p>
            </div>
            <div className="p-4 bg-dark-50 rounded-xl text-center">
              <Ruler className="w-6 h-6 text-accent-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-dark-800">{latestLog.measurements.waist} cm</p>
              <p className="text-sm text-dark-500">Waist</p>
            </div>
            <div className="p-4 bg-dark-50 rounded-xl text-center">
              <Ruler className="w-6 h-6 text-success-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-dark-800">{latestLog.measurements.arms} cm</p>
              <p className="text-sm text-dark-500">Arms</p>
            </div>
            <div className="p-4 bg-dark-50 rounded-xl text-center">
              <Ruler className="w-6 h-6 text-warning-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-dark-800">{latestLog.measurements.thighs} cm</p>
              <p className="text-sm text-dark-500">Thighs</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress History */}
      <div className="card">
        <h3 className="text-lg font-semibold text-dark-800 mb-4">Progress History</h3>
        {progressLogs.length > 0 ? (
          <div className="space-y-3">
            {progressLogs.map((log) => (
              <div key={log.id} className="p-4 bg-dark-50 rounded-xl border-l-4 border-primary-500">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-dark-400" />
                      <span className="font-medium text-dark-800">{log.date}</span>
                      <span className="text-sm text-dark-400">by {log.trainer}</span>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <span><strong>Weight:</strong> {log.weight} kg</span>
                      <span><strong>Body Fat:</strong> {log.bodyFat}%</span>
                    </div>
                    {log.notes && (
                      <p className="text-sm text-dark-500 mt-2 flex items-start gap-2">
                        <FileText className="w-4 h-4 mt-0.5" />
                        {log.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-dark-400 text-center py-8">No progress logs recorded yet</p>
        )}
      </div>
    </div>
  );
};

// Bills Tab Component
const BillsTab = ({ member, payments, onRecordPayment, onGenerateInvoice }) => {
  const totalPaid = payments.filter((p) => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = payments.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-success-500 to-success-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-success-100 text-sm">Total Paid</p>
              <p className="text-3xl font-bold mt-1">${totalPaid.toLocaleString()}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-success-200" />
          </div>
        </div>
        <div className="card bg-gradient-to-br from-warning-500 to-warning-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-warning-100 text-sm">Pending</p>
              <p className="text-3xl font-bold mt-1">${pendingAmount.toLocaleString()}</p>
            </div>
            <Clock className="w-10 h-10 text-warning-200" />
          </div>
        </div>
        <div className="card bg-gradient-to-br from-danger-500 to-danger-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-danger-100 text-sm">Balance Due</p>
              <p className="text-3xl font-bold mt-1">${member.balance.toLocaleString()}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-danger-200" />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={onGenerateInvoice} className="btn-secondary flex items-center gap-2">
          <Receipt className="w-4 h-4" />
          Generate Invoice
        </button>
        <button onClick={onRecordPayment} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      {/* Payment History */}
      <div className="card">
        <h3 className="text-lg font-semibold text-dark-800 mb-4">Payment History</h3>
        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-50">
                  <th className="table-header">Date</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Method</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-dark-50">
                    <td className="table-cell">{payment.date}</td>
                    <td className="table-cell">{payment.type}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        {payment.method === 'Credit Card' && <CreditCard className="w-4 h-4 text-dark-400" />}
                        {payment.method === 'Cash' && <Banknote className="w-4 h-4 text-dark-400" />}
                        {payment.method}
                      </div>
                    </td>
                    <td className="table-cell font-semibold text-dark-800">${payment.amount.toFixed(2)}</td>
                    <td className="table-cell">
                      <Badge variant={payment.status === 'completed' ? 'success' : 'warning'}>
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                          <Receipt className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-dark-400 text-center py-8">No payment history</p>
        )}
      </div>
    </div>
  );
};

// Appointments Tab Component
const AppointmentsTab = ({ member, appointments, onNewAppointment }) => {
  const upcomingAppointments = appointments.filter((a) => a.status === 'confirmed' || a.status === 'pending');
  const pastAppointments = appointments.filter((a) => a.status === 'completed' || a.status === 'cancelled');

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-5 h-5 text-success-500" />;
      case 'pending': return <AlertCircle className="w-5 h-5 text-warning-500" />;
      case 'cancelled': return <XCircle className="w-5 h-5 text-danger-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Total Appointments</p>
              <p className="text-3xl font-bold mt-1">{appointments.length}</p>
            </div>
            <CalendarDays className="w-10 h-10 text-primary-200" />
          </div>
        </div>
        <div className="card bg-gradient-to-br from-success-500 to-success-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-success-100 text-sm">Upcoming</p>
              <p className="text-3xl font-bold mt-1">{upcomingAppointments.length}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-success-200" />
          </div>
        </div>
        <div className="card bg-gradient-to-br from-accent-500 to-accent-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-accent-100 text-sm">Walk-in Check-ins</p>
              <p className="text-3xl font-bold mt-1">{member.totalVisits}</p>
            </div>
            <UserCheck className="w-10 h-10 text-accent-200" />
          </div>
        </div>
      </div>

      {/* Action */}
      <button onClick={onNewAppointment} className="btn-primary flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Schedule Appointment
      </button>

      {/* Upcoming Appointments */}
      <div className="card">
        <h3 className="text-lg font-semibold text-dark-800 mb-4">Upcoming Appointments</h3>
        {upcomingAppointments.length > 0 ? (
          <div className="space-y-3">
            {upcomingAppointments.map((apt) => (
              <div key={apt.id} className="flex items-center justify-between p-4 bg-dark-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="text-center px-4 py-2 bg-primary-100 rounded-lg min-w-[80px]">
                    <p className="text-lg font-bold text-primary-600">{apt.time}</p>
                    <p className="text-xs text-primary-500">{apt.duration} min</p>
                  </div>
                  <div>
                    <p className="font-semibold text-dark-800">{apt.type}</p>
                    <p className="text-sm text-dark-500">{apt.date} • with {apt.trainer}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusIcon(apt.status)}
                  <Badge variant={apt.status === 'confirmed' ? 'success' : 'warning'}>
                    {apt.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-dark-400 text-center py-8">No upcoming appointments</p>
        )}
      </div>

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-800 mb-4">Past Appointments</h3>
          <div className="space-y-3">
            {pastAppointments.map((apt) => (
              <div key={apt.id} className="flex items-center justify-between p-4 bg-dark-50 rounded-xl opacity-75">
                <div className="flex items-center gap-4">
                  <div className="text-center px-4 py-2 bg-dark-200 rounded-lg min-w-[80px]">
                    <p className="text-lg font-bold text-dark-600">{apt.time}</p>
                    <p className="text-xs text-dark-400">{apt.duration} min</p>
                  </div>
                  <div>
                    <p className="font-semibold text-dark-700">{apt.type}</p>
                    <p className="text-sm text-dark-500">{apt.date} • with {apt.trainer}</p>
                  </div>
                </div>
                <Badge variant="default">{apt.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerProfile;
