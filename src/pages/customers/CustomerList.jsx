import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { Avatar, Badge, Modal } from '../../components/common';
import {
  Search,
  Plus,
  Filter,
  Download,
  Mail,
  Phone,
  Calendar,
  UserPlus,
  ChevronRight,
} from 'lucide-react';
import { mockMembers, mockTrainers, mockMembershipPlans } from '../../data/mockData';

const CustomerList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Filter members
  const filteredMembers = mockMembers.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone.includes(searchQuery);
    const matchesStatus =
      filterStatus === 'all' || member.membershipStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleViewCustomer = (memberId) => {
    navigate(`/customers/${memberId}`);
  };

  return (
    <Layout title="Customer Management" subtitle="Manage all gym members and their information">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <p className="text-primary-100 text-sm">Total Members</p>
          <p className="text-3xl font-bold mt-1">{mockMembers.length}</p>
        </div>
        <div className="card bg-gradient-to-br from-success-500 to-success-600 text-white">
          <p className="text-success-100 text-sm">Active</p>
          <p className="text-3xl font-bold mt-1">
            {mockMembers.filter((m) => m.membershipStatus === 'active').length}
          </p>
        </div>
        <div className="card bg-gradient-to-br from-warning-500 to-warning-600 text-white">
          <p className="text-warning-100 text-sm">Expiring Soon</p>
          <p className="text-3xl font-bold mt-1">
            {mockMembers.filter((m) => m.membershipStatus === 'expiring').length}
          </p>
        </div>
        <div className="card bg-gradient-to-br from-danger-500 to-danger-600 text-white">
          <p className="text-danger-100 text-sm">Expired</p>
          <p className="text-3xl font-bold mt-1">
            {mockMembers.filter((m) => m.membershipStatus === 'expired').length}
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-dark-50 border border-dark-200 rounded-lg focus:bg-white focus:border-primary-500 outline-none transition-colors"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 bg-dark-50 border border-dark-200 rounded-lg focus:border-primary-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expiring">Expiring</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add Member
            </button>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-50">
                <th className="table-header">Member</th>
                <th className="table-header">Contact</th>
                <th className="table-header">Membership</th>
                <th className="table-header">Trainer</th>
                <th className="table-header">Status</th>
                <th className="table-header">Balance</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {filteredMembers.map((member) => (
                <tr
                  key={member.id}
                  onClick={() => handleViewCustomer(member.id)}
                  className="hover:bg-dark-50 cursor-pointer transition-colors"
                >
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={member.avatar}
                        name={member.name}
                        size="md"
                        status={member.membershipStatus === 'active' ? 'online' : 'offline'}
                      />
                      <div>
                        <p className="font-semibold text-dark-800">{member.name}</p>
                        <p className="text-xs text-dark-400">
                          Joined: {member.joinDate}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-dark-600">
                        <Mail className="w-3.5 h-3.5 text-dark-400" />
                        {member.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-dark-600">
                        <Phone className="w-3.5 h-3.5 text-dark-400" />
                        {member.phone}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div>
                      <p className="font-medium text-dark-800">{member.membership}</p>
                      <p className="text-xs text-dark-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Expires: {member.membershipExpiry}
                      </p>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="text-dark-600">{member.trainer || '-'}</span>
                  </td>
                  <td className="table-cell">
                    <Badge
                      variant={
                        member.membershipStatus === 'active'
                          ? 'success'
                          : member.membershipStatus === 'expiring'
                          ? 'warning'
                          : 'danger'
                      }
                    >
                      {member.membershipStatus}
                    </Badge>
                  </td>
                  <td className="table-cell">
                    {member.balance > 0 ? (
                      <span className="font-semibold text-danger-600">
                        ${member.balance}
                      </span>
                    ) : (
                      <span className="text-success-600">Paid</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <ChevronRight className="w-5 h-5 text-dark-400" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-dark-400">No customers found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Member"
        size="lg"
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name</label>
              <input type="text" className="input" placeholder="John" />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input type="text" className="input" placeholder="Smith" />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="john@email.com" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input type="tel" className="input" placeholder="+1 234 567 8901" />
          </div>
          <div>
            <label className="label">Membership Plan</label>
            <select className="input">
              <option value="">Select a plan</option>
              {mockMembershipPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - ${plan.price}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Assign Trainer (Optional)</label>
            <select className="input">
              <option value="">No trainer</option>
              {mockTrainers.map((trainer) => (
                <option key={trainer.id} value={trainer.id}>
                  {trainer.name} - {trainer.specialization}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary">
              Add Member
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default CustomerList;
