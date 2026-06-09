import { useMemo, useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import Layout from '../../layout/Layout';
import DataTable from '../../components/DataTable';
import StatsCards from '../../components/common/StatsCards';
import { Pagination } from '../../components/common';
import { Search, UserPlus, Users, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

import { Alert } from '../../shared/utils/alert';
import { getInitialCustomerFormData, mapCustomerToFormData } from '../../shared/models/customerModel';
import CustomerForm from './CustomerForm';

import { useCustomers, useDeleteCustomer } from '../../shared/hooks/useCustomers';
import { useCustomerSearch } from '../../shared/hooks/useCustomerSearch';
import { usePermissions } from '../../shared/hooks/usePermissions';
import { useAuth } from '../../shared/context/AuthContext';
import { customerTableColumns } from './customerTable.config';
import { usePagination } from '../../shared/hooks/usePagination';

const CustomerList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assignedPtCoach = searchParams.get('assignedPtCoach');
  const assignedPtCoachIdParam = searchParams.get('assignedPtCoachId');
  const { fetchUserData } = useAuth();
  const { hasPermission } = usePermissions();

  // Pagination state
  const { currentPage, setCurrentPage, goToPrev, goToNext } = usePagination(1);
  const pageSize = 50;

  // Search & modal state
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState(getInitialCustomerFormData());

  const assignedPtCoachIdNumeric = useMemo(() => {
    if (assignedPtCoachIdParam == null || assignedPtCoachIdParam === '') return null;
    const n = Number.parseInt(assignedPtCoachIdParam, 10);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  }, [assignedPtCoachIdParam]);

  // Memoize customer query options to prevent unnecessary refetches
  const customerQueryOptions = useMemo(() => {
    const opts = {
      pagelimit: pageSize,
      sorts: [{ field: 'first_name', direction: 'asc' }],
    };
    if (assignedPtCoach === 'self') {
      opts.filters = { assignedPtCoachId: 'self' };
    } else if (assignedPtCoachIdNumeric != null) {
      opts.filters = { assignedPtCoachId: String(assignedPtCoachIdNumeric) };
    }
    return opts;
  }, [pageSize, assignedPtCoach, assignedPtCoachIdNumeric]);

  useEffect(() => {
    setCurrentPage(1);
  }, [assignedPtCoach, assignedPtCoachIdParam, setCurrentPage]);

  // Fetch customers
  const { data, isLoading } = useCustomers(currentPage, customerQueryOptions);
  const deleteCustomerMutation = useDeleteCustomer();

  // Ensure customers is always an array
  const customers = Array.isArray(data?.data) ? data.data : [];
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
      { title: 'Total Clients', value: pagination?.total || customers.length || 0, color: 'primary', icon: Users },
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
      onView: handleViewCustomer,
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
    await fetchUserData();
    Alert.success('Deleted!', 'Client has been deleted.', { timer: 2000, showConfirmButton: false });
  }

  /* ------------------------------- render ------------------------------- */
  return (
    <Layout title="Clients Management" subtitle="Manage all clients with their membership details">
      {(assignedPtCoach === 'self' || assignedPtCoachIdNumeric != null) && (
        <div className="mb-4 rounded-lg border border-primary-500/40 bg-primary-500/10 px-4 py-3 text-sm text-dark-200">
          Showing clients with an active PT package assigned
          {assignedPtCoach === 'self' ? ' to you' : ' to the selected coach'}.
          <button
            type="button"
            className="ml-3 text-primary-400 hover:text-primary-300 font-medium"
            onClick={() => navigate('/members')}
          >
            Clear filter
          </button>
        </div>
      )}
      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Action bar */}
      <div className="card mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-dark-50 placeholder-dark-400"
            />
          </div>

          {hasPermission('members_list_add') && (
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => handleOpenModal()}
                className="shrink-0 whitespace-nowrap btn-primary flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Add Client
              </button>
            </div>
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
      {pagination && pagination.lastPage > 1 && (
        <Pagination
          currentPage={currentPage}
          lastPage={pagination.lastPage}
          from={pagination.from}
          to={pagination.to}
          total={pagination.total}
          onPrev={goToPrev}
          onNext={() => goToNext(pagination.lastPage)}
        />
      )}

      {/* Customer Form Modal */}
      <CustomerForm
        isOpen={showModal}
        onClose={handleCloseModal}
        formData={formData}
        setFormData={setFormData}
        selectedCustomer={selectedCustomer}
        onSaveSuccess={fetchUserData}
      />
    </Layout>
  );
};

export default CustomerList;
