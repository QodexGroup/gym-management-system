import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Layout from '../../components/layout/Layout';
import DataTable from '../../components/DataTable';
import StatsCards from '../../components/common/StatsCards';
import { Pagination } from '../../components/common';
import { Search, UserPlus, Users, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

import { Alert } from '../../utils/alert';
import { getInitialCustomerFormData, mapCustomerToFormData } from '../../models/customerModel';
import CustomerForm from './customer-forms/CustomerForm';

import { useCustomers, useDeleteCustomer } from '../../hooks/useCustomers';
import { usePermissions } from '../../hooks/usePermissions';
import { customerTableColumns } from './tables/customerTable.config';
import { useCustomerSearch } from '../../hooks/useCustomerSearch';
import { usePagination } from '../../hooks/usePagination';

const CustomerList = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  // Pagination state
  const { currentPage, setCurrentPage, goToPrev, goToNext } = usePagination(1);

  // Search & modal state
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState(getInitialCustomerFormData());
  const sort = 'first_name:desc';
  // Fetch customers
  const { data, isLoading } = useCustomers(currentPage, sort);
  const deleteCustomerMutation = useDeleteCustomer();

  const customers = data?.data || [];
  const pagination = data?.pagination;

  // Filter customers using custom hook
  const filteredCustomers = useCustomerSearch(customers, searchQuery);

  // Compute membership stats
  const membershipStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fifteenDaysFromNow = new Date();
    fifteenDaysFromNow.setDate(today.getDate() + 15);
    fifteenDaysFromNow.setHours(23, 59, 59, 999);

    let active = 0, expiringSoon = 0, expired = 0;

    customers.forEach((c) => {
      const m = c.currentMembership;
      if (!m) return;

      const end = new Date(m.membershipEndDate);
      end.setHours(0, 0, 0, 0);

      const isActive = m.status === 'active' && end >= today;
      const isExpired = end < today || m.status === 'expired';
      const isExpiringSoon = isActive && end <= fifteenDaysFromNow && end >= today;

      if (isActive) { active++; if (isExpiringSoon) expiringSoon++; }
      else if (isExpired) expired++;
    });

    return { active, expiringSoon, expired };
  }, [customers]);

  // Prepare stats array safely
  const stats = useMemo(() => {
    if (!data) return [];

    return [
      { title: 'Total Members', value: pagination?.total || customers.length || 0, color: 'primary', icon: Users },
      { title: 'Active', value: membershipStats?.active || 0, color: 'success', icon: CheckCircle },
      { title: 'Expiring Soon', value: membershipStats?.expiringSoon || 0, color: 'warning', icon: AlertTriangle },
      { title: 'Expired', value: membershipStats?.expired || 0, color: 'danger', icon: XCircle },
    ];
  }, [data, pagination, customers, membershipStats]);

  // Table columns
  const columns = useMemo(
    () => customerTableColumns({
      canEdit: hasPermission('members_list_update'),
      canDelete: hasPermission('members_list_delete'),
      onEdit: handleOpenModal,
      onDelete: handleDeleteCustomer,
    }),
    [hasPermission]
  );

  /* ------------------------------- handlers ------------------------------- */

  function handleViewCustomer(id) {
    navigate(`/members/${id}`);
  }

  function handleOpenModal(customer = null) {
    if (customer) {
      setSelectedCustomer(customer);
      setFormData(mapCustomerToFormData(customer));
    } else {
      setSelectedCustomer(null);
      setFormData(getInitialCustomerFormData());
    }
    setShowModal(true);
  }

  function handleCloseModal() {
    setShowModal(false);
    setSelectedCustomer(null);
    setFormData(getInitialCustomerFormData());
  }

  async function handleDeleteCustomer(id) {
    const result = await Alert.confirmDelete();
    if (!result.isConfirmed) return;

    await deleteCustomerMutation.mutateAsync(id);
    Alert.success('Deleted!', 'Member has been deleted.', { timer: 2000, showConfirmButton: false });
  }

  /* ------------------------------- render ------------------------------- */
  return (
    <Layout title="Member Management" subtitle="Manage all gym members">
      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Action bar */}
      <div className="card mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-dark-50 placeholder-dark-400"
            />
          </div>

          {hasPermission('members_list_add') && (
            <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Add Member
            </button>
          )}
        </div>
      </div>

      {/* Customers Table */}
      <div className="card">
        <DataTable
          columns={columns}
          data={filteredCustomers}
          loading={isLoading}
          onRowClick={(c) => handleViewCustomer(c.id)}
        />
      </div>

      {/* Empty state */}
      {!isLoading && filteredCustomers.length === 0 && (
        <div className="text-center py-12 text-dark-400">
          No customers found matching your criteria
        </div>
      )}

      {/* Pagination */}
      {pagination?.lastPage > 1 && (
        <Pagination
          currentPage={currentPage}
          lastPage={pagination?.lastPage}
          from={pagination?.from}
          to={pagination?.to}
          total={pagination?.total}
          onPrev={goToPrev}
          onNext={() => goToNext(pagination?.lastPage)}
        />
      )}

      {/* Customer Form Modal */}
      <CustomerForm
        isOpen={showModal}
        onClose={handleCloseModal}
        formData={formData}
        setFormData={setFormData}
        selectedCustomer={selectedCustomer}
      />
    </Layout>
  );
};

export default CustomerList;
