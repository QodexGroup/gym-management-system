import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { Avatar, Badge } from '../../components/common';
import {
  Search,
  Plus,
  Edit,
  Trash,
  Mail,
  Phone,
  Calendar,
  UserPlus,
  ChevronRight,
  ChevronLeft,
  Download,
} from 'lucide-react';
import { Alert } from '../../utils/alert';
import { getInitialCustomerFormData, mapCustomerToFormData } from '../../models/customerModel';
import CustomerForm from './CustomerForm';
import { useCustomers, useDeleteCustomer } from '../../hooks/useCustomers';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { usePermissions } from '../../hooks/usePermissions';

const CustomerList = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState(getInitialCustomerFormData());

  // React Query hooks
  const { data, isLoading, error } = useCustomers(currentPage);
  const deleteCustomerMutation = useDeleteCustomer();

  const customers = data?.data || [];
  const pagination = data?.pagination || null;
  const loading = isLoading;

  // Calculate membership stats
  const membershipStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const fifteenDaysFromNow = new Date();
    fifteenDaysFromNow.setDate(today.getDate() + 15);
    fifteenDaysFromNow.setHours(23, 59, 59, 999);

    let active = 0;
    let expiringSoon = 0;
    let expired = 0;

    customers.forEach((customer) => {
      const membership = customer.currentMembership;
      
      if (!membership) return;

      const endDate = new Date(membership.membershipEndDate);
      endDate.setHours(0, 0, 0, 0);
      
      const isActive = membership.status === 'active' && endDate >= today;
      const isExpired = endDate < today || membership.status === 'expired';
      const isExpiringSoon = isActive && endDate <= fifteenDaysFromNow && endDate >= today;

      if (isActive) {
        active++;
        if (isExpiringSoon) {
          expiringSoon++;
        }
      } else if (isExpired) {
        expired++;
      }
    });

    return { active, expiringSoon, expired };
  }, [customers]);

  // Filter customers (client-side filtering for search)
  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    
    const query = searchQuery.toLowerCase();
    return customers.filter((customer) => {
      const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.toLowerCase();
      const email = (customer.email || '').toLowerCase();
      const phone = (customer.phoneNumber || '').toLowerCase();
      
      return (
        fullName.includes(query) ||
        email.includes(query) ||
        phone.includes(query)
      );
    });
  }, [customers, searchQuery]);

  const handleOpenModal = (customer = null) => {
    if (customer) {
      // Edit mode
      setSelectedCustomer(customer);
      setFormData(mapCustomerToFormData(customer));
    } else {
      // Create mode
      setSelectedCustomer(null);
      setFormData(getInitialCustomerFormData());
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCustomer(null);
    setFormData(getInitialCustomerFormData());
  };

  const handleSaveSuccess = () => {
    // React Query automatically invalidates and refetches
    // No manual refresh needed!
  };

  const handleDeleteCustomer = async (customerId) => {
    const result = await Alert.confirmDelete();

    if (!result.isConfirmed) {
      return;
    }

    try {
      await deleteCustomerMutation.mutateAsync(customerId);
      Alert.success('Deleted!', 'Member has been deleted.', {
        timer: 2000,
        showConfirmButton: false
      });
      // React Query automatically invalidates and refetches
    } catch (error) {
      // Error already handled in mutation
      console.error('Error deleting customer:', error);
    }
  };

  const handleViewCustomer = (customerId) => {
    navigate(`/members/${customerId}`);
  };

  if (loading && customers.length === 0) {
    return (
      <Layout title="Member Management" subtitle="Manage all gym members and their information">
        <div className="flex items-center justify-center h-64">
          <p className="text-dark-500">Loading customers...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Member Management" subtitle="Manage all gym members and their information">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <p className="text-primary-100 text-sm">Total Members</p>
          <p className="text-3xl font-bold mt-1">{pagination?.total || customers.length || 0}</p>
        </div>
        <div className="card bg-gradient-to-br from-success-500 to-success-600 text-white">
          <p className="text-success-100 text-sm">Active</p>
          <p className="text-3xl font-bold mt-1">{membershipStats.active}</p>
        </div>
        <div className="card bg-gradient-to-br from-warning-500 to-warning-600 text-white">
          <p className="text-warning-100 text-sm">Expiring Soon</p>
          <p className="text-3xl font-bold mt-1">{membershipStats.expiringSoon}</p>
        </div>
        <div className="card bg-gradient-to-br from-danger-500 to-danger-600 text-white">
          <p className="text-danger-100 text-sm">Expired</p>
          <p className="text-3xl font-bold mt-1">{membershipStats.expired}</p>
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
                className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-dark-600 text-dark-50 placeholder-dark-400 rounded-lg focus:bg-dark-600 focus:border-primary-500 outline-none transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* <button className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button> */}
            {hasPermission('members_list_add') && (
              <button
                onClick={() => handleOpenModal()}
                className="btn-primary flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Add Member
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Customers List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-50">
                <th className="table-header">Member</th>
                <th className="table-header">Contact</th>
                <th className="table-header">Address</th>
                <th className="table-header">Membership</th>
                <th className="table-header">Trainer</th>
                <th className="table-header">Balance</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {filteredCustomers.map((customer) => {
                const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
                return (
                  <tr 
                    key={customer.id} 
                    onClick={() => handleViewCustomer(customer.id)}
                    className="hover:bg-dark-700 cursor-pointer transition-colors"
                  >
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <Avatar
                          src={customer.photo}
                          name={fullName}
                        size="md"
                      />
                      <div>
                          <p className="font-semibold text-dark-50 hover:text-primary-400 transition-colors">{fullName || 'N/A'}</p>
                          {customer.email && (
                            <p className="text-xs text-dark-400">{customer.email}</p>
                          )}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="space-y-1">
                        {customer.phoneNumber && (
                          <div className="flex items-center gap-2 text-sm text-dark-300">
                            <Phone className="w-3.5 h-3.5 text-dark-400" />
                            {customer.phoneNumber}
                          </div>
                        )}
                        {customer.email && (
                      <div className="flex items-center gap-2 text-sm text-dark-300">
                        <Mail className="w-3.5 h-3.5 text-dark-400" />
                            {customer.email}
                      </div>
                        )}
                    </div>
                  </td>
                  <td className="table-cell">
                      <span className="text-sm text-dark-300">
                        {customer.address || '-'}
                      </span>
                  </td>
                  <td className="table-cell">
                      {customer.currentMembership?.membershipPlan ? (
                        <div className="space-y-1">
                          <span className="text-sm font-medium text-dark-50">
                            {customer.currentMembership.membershipPlan.planName}
                          </span>
                          <p className="text-xs text-dark-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Expires: {formatDate(customer.currentMembership.membershipEndDate)}
                          </p>
                          <div>
                            <Badge variant={customer.currentMembership.status === 'active' ? 'success' : 'default'}>
                              {customer.currentMembership.status?.charAt(0).toUpperCase() + customer.currentMembership.status?.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <span className="text-dark-400">-</span>
                      )}
                  </td>
                  <td className="table-cell">
                      {customer.currentTrainer ? (
                        <span className="text-sm text-dark-300">
                          {customer.currentTrainer.fullname || `${customer.currentTrainer.firstname || ''} ${customer.currentTrainer.lastname || ''}`.trim()}
                        </span>
                      ) : (
                        <span className="text-dark-400">-</span>
                      )}
                  </td>
                  <td className="table-cell">
                      <span className="text-sm text-dark-300">
                        {formatCurrency(customer.balance)}
                      </span>
                  </td>
                  <td className="table-cell">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleViewCustomer(customer.id)}
                          className="p-2 text-dark-400 hover:text-primary-400 hover:bg-dark-700 rounded-lg transition-colors"
                          title="View customer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        {hasPermission('members_list_update') && (
                          <button
                            onClick={() => handleOpenModal(customer)}
                            className="p-2 text-dark-400 hover:text-primary-400 hover:bg-dark-700 rounded-lg transition-colors"
                            title="Edit customer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {hasPermission('members_list_delete') && (
                          <button
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="p-2 text-dark-400 hover:text-danger-400 hover:bg-dark-700 rounded-lg transition-colors"
                            title="Delete customer"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-dark-400">No customers found matching your criteria</p>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.lastPage > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-dark-200">
            <div className="text-sm text-dark-300">
              Showing {pagination.from} to {pagination.to} of {pagination.total} customers
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-dark-600 hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-dark-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 text-sm text-dark-300">
                Page {pagination.currentPage} of {pagination.lastPage}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(pagination.lastPage, prev + 1))}
                disabled={currentPage === pagination.lastPage}
                className="p-2 rounded-lg border border-dark-600 hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-dark-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <CustomerForm
        isOpen={showModal}
        onClose={handleCloseModal}
        formData={formData}
        setFormData={setFormData}
        selectedCustomer={selectedCustomer}
        onSaveSuccess={handleSaveSuccess}
      />
    </Layout>
  );
};

export default CustomerList;
