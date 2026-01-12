import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { Badge, Avatar, Modal } from '../../components/common';
import {
  Search,
  User,
  Dumbbell,
  TrendingUp,
  Eye,
  Calendar,
  Image as ImageIcon,
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { useCustomerPtPackages } from '../../hooks/useCustomerPtPackages';
import { useCustomers } from '../../hooks/useCustomers';
import { useAuth } from '../../context/AuthContext';

const PtMembers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);

  // Get all customers
  const { data: customersData } = useCustomers(1);
  const customers = customersData?.data || [];

  // Filter customers with PT packages assigned to this trainer
  const ptMembers = customers.filter((customer) => {
    // This would ideally come from an API endpoint that filters by trainer
    // For now, we'll show all customers and filter client-side
    return true; // Placeholder - would filter by trainerId
  });

  // Filter by search query
  const filteredMembers = ptMembers.filter((member) => {
    const fullName = `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  const handleViewProgress = (member) => {
    setSelectedMember(member);
    setShowProgressModal(true);
  };

  const handleCloseProgressModal = () => {
    setShowProgressModal(false);
    setSelectedMember(null);
  };

  return (
    <Layout title="My PT Members" subtitle="View and track progress of assigned members">
      <div className="card">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-dark-600 text-dark-50 placeholder-dark-400 rounded-lg focus:bg-dark-600 focus:border-primary-500 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Members Grid */}
        {filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-dark-400 mx-auto mb-4" />
            <p className="text-dark-400">No PT members found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => {
              // Get PT packages for this member
              // This would come from useCustomerPtPackages hook
              const memberName = `${member.firstName || ''} ${member.lastName || ''}`.trim();

              return (
                <div
                  key={member.id}
                  className="bg-dark-800 rounded-xl border border-dark-700 p-6 hover:border-primary-500 transition-colors"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar
                      src={member.photo}
                      name={memberName}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-dark-50 mb-1 truncate">
                        {memberName}
                      </h3>
                      <p className="text-sm text-dark-300 truncate">
                        {member.email || 'No email'}
                      </p>
                    </div>
                  </div>

                  {/* PT Package Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-dark-300">
                      <Dumbbell className="w-4 h-4 text-primary-500" />
                      <span>Active PT Packages: 0</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-dark-300">
                      <TrendingUp className="w-4 h-4 text-success-500" />
                      <span>Progress: N/A</span>
                    </div>
                  </div>

                  {/* Progress Bar Placeholder */}
                  <div className="mb-4">
                    <div className="w-full bg-dark-700 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all"
                        style={{ width: '0%' }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-dark-400 mt-1">
                      <span>0/0 sessions</span>
                      <span>0% complete</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-dark-700">
                    <button
                      onClick={() => navigate(`/members/${member.id}?tab=pt-packages`)}
                      className="flex-1 btn-secondary text-sm py-2"
                    >
                      <Eye className="w-4 h-4 inline mr-1" />
                      View Profile
                    </button>
                    <button
                      onClick={() => handleViewProgress(member)}
                      className="flex-1 btn-primary text-sm py-2"
                    >
                      <TrendingUp className="w-4 h-4 inline mr-1" />
                      Progress
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Progress Modal */}
      <Modal
        isOpen={showProgressModal}
        onClose={handleCloseProgressModal}
        title={`${selectedMember?.firstName} ${selectedMember?.lastName} - PT Progress`}
        size="lg"
      >
        <div className="space-y-6">
          {/* Before/After Comparison Placeholder */}
          <div className="bg-dark-800 rounded-lg p-6">
            <h4 className="text-md font-semibold text-dark-50 mb-4">Before/After Comparison</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="w-full h-48 bg-dark-700 rounded-lg flex items-center justify-center mb-2">
                  <ImageIcon className="w-12 h-12 text-dark-400" />
                </div>
                <p className="text-sm text-dark-300">Before</p>
                <p className="text-xs text-dark-400">Date: N/A</p>
              </div>
              <div className="text-center">
                <div className="w-full h-48 bg-dark-700 rounded-lg flex items-center justify-center mb-2">
                  <ImageIcon className="w-12 h-12 text-dark-400" />
                </div>
                <p className="text-sm text-dark-300">After</p>
                <p className="text-xs text-dark-400">Date: N/A</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-dark-700">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-dark-400">Weight</p>
                  <p className="text-sm font-semibold text-dark-50">N/A</p>
                </div>
                <div>
                  <p className="text-xs text-dark-400">Body Fat</p>
                  <p className="text-sm font-semibold text-dark-50">N/A</p>
                </div>
                <div>
                  <p className="text-xs text-dark-400">Muscle Mass</p>
                  <p className="text-sm font-semibold text-dark-50">N/A</p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Charts Placeholder */}
          <div className="bg-dark-800 rounded-lg p-6">
            <h4 className="text-md font-semibold text-dark-50 mb-4">Progress Charts</h4>
            <div className="space-y-4">
              <div className="h-32 bg-dark-700 rounded-lg flex items-center justify-center">
                <p className="text-sm text-dark-400">Weight Trend Chart</p>
              </div>
              <div className="h-32 bg-dark-700 rounded-lg flex items-center justify-center">
                <p className="text-sm text-dark-400">Body Fat Trend Chart</p>
              </div>
              <div className="h-32 bg-dark-700 rounded-lg flex items-center justify-center">
                <p className="text-sm text-dark-400">Strength Progress Chart</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleCloseProgressModal}
              className="btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default PtMembers;

