import { useMemo, useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import Layout from '../../layout/Layout';
import DataTable from '../../components/DataTable';
import StatsCards from '../../components/common/StatsCards';
import { Pagination, SearchAndFilter } from '../../components/common';
import { UserPlus, Users, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

import { Alert } from '../../shared/utils/alert';
import { getInitialCustomerFormData, mapCustomerToFormData } from '../../shared/models/customerModel';
import CustomerForm from './CustomerForm';

import { useCustomers, useCustomerStats, useDeleteCustomer } from '../../shared/hooks/useCustomers';
import { usePermissions } from '../../shared/hooks/usePermissions';
import { useDebouncedValue } from '../../shared/hooks/useDebouncedValue';
import { useAuth } from '../../shared/context/AuthContext';
import { customerTableColumns } from './customerTable.config';
import { usePagination } from '../../shared/hooks/usePagination';
import {
  CUSTOMER_MEMBERSHIP_STATUS,
  CUSTOMER_STATUS_FILTER_OPTIONS,
  CUSTOMER_STATUS_FILTER_VALUES,
} from '../../shared/constants/customerMembership';

const ALL_STATUSES = 'all';

const CustomerList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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

  // The list is server-paginated, so searching and status filtering both have to
  // happen on the API - filtering the loaded page would silently hide matches
  // that live on another page.
  const debouncedSearch = useDebouncedValue(searchQuery.trim(), 300);

  // Status filter lives in the URL so it survives a refresh, the back button,
  // and returning from a client profile.
  const statusParam = searchParams.get('status');
  const statusFilter = CUSTOMER_STATUS_FILTER_VALUES.includes(statusParam) ? statusParam : ALL_STATUSES;

  const assignedPtCoachIdNumeric = useMemo(() => {
    if (assignedPtCoachIdParam == null || assignedPtCoachIdParam === '') return null;
    const n = Number.parseInt(assignedPtCoachIdParam, 10);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  }, [assignedPtCoachIdParam]);

  // Filters shared by the list and the stat cards, so both describe the same
  // set of clients. The status filter itself is added for the list only.
  const baseFilters = useMemo(() => {
    const filters = {};
    if (debouncedSearch) filters.search = debouncedSearch;
    if (assignedPtCoach === 'self') {
      filters.assignedPtCoachId = 'self';
    } else if (assignedPtCoachIdNumeric != null) {
      filters.assignedPtCoachId = String(assignedPtCoachIdNumeric);
    }
    return filters;
  }, [debouncedSearch, assignedPtCoach, assignedPtCoachIdNumeric]);

  // Memoize customer query options to prevent unnecessary refetches
  const customerQueryOptions = useMemo(() => {
    const filters = { ...baseFilters };
    if (statusFilter !== ALL_STATUSES) filters.membershipStatus = statusFilter;

    return {
      pagelimit: pageSize,
      sorts: [{ field: 'first_name', direction: 'asc' }],
      ...(Object.keys(filters).length > 0 ? { filters } : {}),
    };
  }, [pageSize, baseFilters, statusFilter]);

  // Counts deliberately ignore the status filter so every card stays visible
  // (and clickable) while one of them is selected.
  const statsQueryOptions = useMemo(
    () => (Object.keys(baseFilters).length > 0 ? { filters: baseFilters } : {}),
    [baseFilters]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [assignedPtCoach, assignedPtCoachIdParam, debouncedSearch, statusFilter, setCurrentPage]);

  // Fetch customers
  const { data, isLoading } = useCustomers(currentPage, customerQueryOptions);
  const { data: statusCounts, isLoading: isLoadingStats, isError: isStatsError } = useCustomerStats(statsQueryOptions);
  const deleteCustomerMutation = useDeleteCustomer();

  // Ensure customers is always an array
  const customers = Array.isArray(data?.data) ? data.data : [];
  const pagination = data?.pagination;

  const isFiltered = statusFilter !== ALL_STATUSES || Boolean(debouncedSearch);

  /* -------------------------------- filters -------------------------------- */

  const handleStatusChange = useCallback(
    (nextStatus) => {
      const params = new URLSearchParams(searchParams);
      if (!nextStatus || nextStatus === ALL_STATUSES) {
        params.delete('status');
      } else {
        params.set('status', nextStatus);
      }
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Clicking the card that is already applied clears the filter.
  const toggleStatus = useCallback(
    (status) => handleStatusChange(statusFilter === status ? ALL_STATUSES : status),
    [handleStatusChange, statusFilter]
  );

  /* --------------------------------- stats --------------------------------- */

  const stats = useMemo(() => {
    const hasCounts = statusCounts != null;
    const value = (count) => (hasCounts ? count ?? 0 : (isLoadingStats || isStatsError) ? '—' : 0);

    return [
      {
        title: 'Total Clients',
        value: value(statusCounts?.total),
        color: 'primary',
        icon: Users,
        onClick: () => handleStatusChange(ALL_STATUSES),
        active: statusFilter === ALL_STATUSES,
      },
      {
        title: 'Active',
        value: value(statusCounts?.active),
        color: 'success',
        icon: CheckCircle,
        onClick: () => toggleStatus(CUSTOMER_MEMBERSHIP_STATUS.ACTIVE),
        active: statusFilter === CUSTOMER_MEMBERSHIP_STATUS.ACTIVE,
      },
      {
        title: 'Expiring Soon',
        value: value(statusCounts?.expiringSoon),
        color: 'warning',
        icon: AlertTriangle,
        onClick: () => toggleStatus(CUSTOMER_MEMBERSHIP_STATUS.EXPIRING),
        active: statusFilter === CUSTOMER_MEMBERSHIP_STATUS.EXPIRING,
      },
      {
        title: 'Expired',
        value: value(statusCounts?.expired),
        color: 'danger',
        icon: XCircle,
        onClick: () => toggleStatus(CUSTOMER_MEMBERSHIP_STATUS.EXPIRED),
        active: statusFilter === CUSTOMER_MEMBERSHIP_STATUS.EXPIRED,
      },
    ];
  }, [statusCounts, isLoadingStats, isStatsError, statusFilter, handleStatusChange, toggleStatus]);

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
      {/* Stats Cards - account-wide counts, also act as status filters */}
      <StatsCards stats={stats} />

      {/* Action bar */}
      <div className="card mb-6">
        <SearchAndFilter
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search by name, email, or phone..."
          filterValue={statusFilter}
          onFilterChange={handleStatusChange}
          filterOptions={CUSTOMER_STATUS_FILTER_OPTIONS}
          filterLabel="All Statuses"
          onAddClick={hasPermission('members_list_add') ? () => handleOpenModal() : undefined}
          addButtonLabel="Add Client"
          addButtonIcon={UserPlus}
        />
      </div>

      {/* Customers Table */}
      <div className="card">
        <DataTable
          columns={columns}
          data={customers}
          loading={isLoading}
          onRowClick={(c) => handleViewCustomer(c.id)}
        />
      </div>

      {/* Empty state */}
      {!isLoading && customers.length === 0 && (
        <div className="text-center py-12 text-dark-400">
          {isFiltered ? (
            <>
              <p>No clients match these filters</p>
              <button
                type="button"
                className="mt-2 text-primary-400 hover:text-primary-300 font-medium"
                onClick={() => {
                  setSearchQuery('');
                  handleStatusChange(ALL_STATUSES);
                }}
              >
                Clear filters
              </button>
            </>
          ) : (
            'No customers found matching your criteria'
          )}
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
