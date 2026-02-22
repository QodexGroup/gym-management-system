import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { Avatar, Badge, StatsList } from '../../components/common';
import DataTable from '../../components/DataTable';
import { Pagination } from '../../components/common';
import {
  Search,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  QrCode,
  AlertCircle,
} from 'lucide-react';
import { useTodayWalkin, useWalkinCustomers, useCreateWalkinCustomer, useCheckOutWalkinCustomer, useCancelWalkinCustomer } from '../../hooks/useWalkins';
import { useCustomers, useSearchCustomers } from '../../hooks/useCustomers';
import { useCustomerSearch } from '../../hooks/useCustomerSearch';
import { usePagination } from '../../hooks/usePagination';
import WalkinForm from './forms/WalkinForm';
import CheckInModal from './forms/CheckInModal';
import { walkinCustomerTableColumns } from './tables/walkinCustomerTable.config';
import { Alert } from '../../utils/alert';
import { WALKIN_CUSTOMER_STATUS } from '../../constants/walkinConstant';

const CheckIn = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const debounceTimerRef = useRef(null);

  // Pagination for walkin customers
  const { currentPage, setCurrentPage, goToPrev, goToNext } = usePagination(1);
  const pageSize = 50;

  // Fetch today's walkin
  const { data: todayWalkin, isLoading: isLoadingWalkin, refetch: refetchWalkin } = useTodayWalkin();

  // Memoize walkin customers query options to prevent unnecessary refetches
  const walkinCustomersOptions = useMemo(() => ({
    pagelimit: pageSize,
    relations: ['customer'],
    sorts: [{ field: 'check_in_time', direction: 'desc' }],
  }), [pageSize]);

  // Fetch walkin customers if walkin exists
  const { data: walkinCustomersData, isLoading: isLoadingCustomers } = useWalkinCustomers(
    todayWalkin?.id,
    currentPage,
    walkinCustomersOptions
  );

  // Extract walkin customers data - handle various response structures
  const walkinCustomers = useMemo(() => {
    if (!walkinCustomersData) return [];
    if (Array.isArray(walkinCustomersData.data)) return walkinCustomersData.data;
    if (Array.isArray(walkinCustomersData)) return walkinCustomersData;
    return [];
  }, [walkinCustomersData]);
  
  const pagination = walkinCustomersData?.pagination;

  // Memoize customer query options to prevent unnecessary refetches
  // Note: We include relations for membership data needed in CheckIn page
  // This creates a separate cache entry from CustomerList, but prevents refetches within CheckIn
  const customerQueryOptions = useMemo(() => ({
    pagelimit: 50,
    relations: ['currentMembership', 'currentMembership.membershipPlan'],
    sorts: [{ field: 'first_name', direction: 'asc' }],
  }), []);

  // Fetch default customer list - cached by React Query
  const { data: defaultCustomersData, isLoading: isLoadingDefaultCustomers } = useCustomers(1, customerQueryOptions);
  const defaultCustomers = Array.isArray(defaultCustomersData?.data) ? defaultCustomersData.data : [];

  // Debounce search query to minimize backend calls
  useEffect(() => {
    // Clear search when modal opens
    if (showCheckInModal) {
      setSearchQuery('');
      setDebouncedSearchQuery('');
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      return;
    }

    // Debounce the search query
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms debounce delay

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, showCheckInModal]);

  // First, try local search on default customers
  const locallyFilteredCustomers = useCustomerSearch(defaultCustomers, debouncedSearchQuery);
  
  // Only search backend if local search returns no results and there's a search query
  const shouldSearchBackend = debouncedSearchQuery && debouncedSearchQuery.trim().length > 0 && locallyFilteredCustomers.length === 0;
  const { data: backendSearchResult, isLoading: isSearchingBackend } = useSearchCustomers(
    shouldSearchBackend ? debouncedSearchQuery : '',
    1,
    20
  );
  const backendSearchCustomers = shouldSearchBackend && Array.isArray(backendSearchResult?.data) ? backendSearchResult.data : [];

  // Determine which customers to display - only show when actively searching
  const displayCustomers = useMemo(() => {
    // If no search query, don't show any customers
    if (!debouncedSearchQuery || debouncedSearchQuery.trim().length === 0) {
      return [];
    }
    
    // If local search has results, use those
    if (locallyFilteredCustomers.length > 0) {
      return locallyFilteredCustomers;
    }
    
    // Otherwise, use backend search results
    return backendSearchCustomers;
  }, [debouncedSearchQuery, locallyFilteredCustomers, backendSearchCustomers]);

  const isSearching = isSearchingBackend && shouldSearchBackend;

  // Mutations
  const createWalkinCustomerMutation = useCreateWalkinCustomer();
  const checkOutMutation = useCheckOutWalkinCustomer();
  const cancelMutation = useCancelWalkinCustomer();

  // Handlers
  const handleWalkinCreated = useCallback(async (walkin) => {
    // Refetch the walkin query to get the updated data
    await refetchWalkin();
  }, [refetchWalkin]);

  const handleCheckOut = useCallback(async (walkinCustomerId) => {
    const result = await Alert.confirm({
      title: 'Check Out Customer',
      text: 'Are you sure you want to check out this customer?',
      icon: 'question',
    });
    if (!result.isConfirmed) return;

    try {
      await checkOutMutation.mutateAsync({
        id: walkinCustomerId,
        walkinId: todayWalkin?.id,
      });
    } catch (error) {
      // Error is handled by the hook
    }
  }, [checkOutMutation, todayWalkin?.id]);

  const handleCancel = useCallback(async (walkinCustomerId) => {
    const result = await Alert.confirm({
      title: 'Cancel Check-In',
      text: 'Are you sure you want to cancel this check-in?',
      icon: 'question',
    });
    if (!result.isConfirmed) return;

    try {
      await cancelMutation.mutateAsync({
        id: walkinCustomerId,
        walkinId: todayWalkin?.id,
      });
    } catch (error) {
      // Error is handled by the hook
    }
  }, [cancelMutation, todayWalkin?.id]);

  const handleQuickCheckIn = useCallback((customer) => {
    if (!todayWalkin) {
      Alert.error('No walkin session', 'Please create a walkin session first');
      return;
    }

    // Check if customer is already checked in
    const alreadyCheckedIn = walkinCustomers.find(
      (wc) => wc.customer?.id === customer.id && wc.status === WALKIN_CUSTOMER_STATUS.INSIDE
    );

    if (alreadyCheckedIn) {
      Alert.warning('Already checked in', 'This customer is already checked in');
      return;
    }

    // Clear search query before opening modal
    setSearchQuery('');
    setSelectedCustomer(customer);
    setShowCheckInModal(true);
  }, [todayWalkin, walkinCustomers]);

  const confirmCheckIn = useCallback(async () => {
    if (!selectedCustomer || !todayWalkin) return;

    try {
      await createWalkinCustomerMutation.mutateAsync({
        walkinId: todayWalkin.id,
        customerData: {
          customerId: selectedCustomer.id,
        },
      });
      setShowCheckInModal(false);
      setSelectedCustomer(null);
    } catch (error) {
      // Error is handled by the hook
    }
  }, [selectedCustomer, todayWalkin, createWalkinCustomerMutation]);

  const handleRefresh = useCallback(() => {
    refetchWalkin();
  }, [refetchWalkin]);

  const handleRowClick = useCallback((walkinCustomer) => {
    // Navigate to customer profile page
    if (walkinCustomer.customer?.id) {
      navigate(`/members/${walkinCustomer.customer.id}`);
    }
  }, [navigate]);

  // Stats
  const stats = useMemo(() => {
    const inside = walkinCustomers.filter((wc) => wc.status === WALKIN_CUSTOMER_STATUS.INSIDE).length;
    const outside = walkinCustomers.filter((wc) => wc.status === WALKIN_CUSTOMER_STATUS.OUTSIDE).length;
    const cancelled = walkinCustomers.filter((wc) => wc.status === WALKIN_CUSTOMER_STATUS.CANCELLED).length;

    return {
      inside,
      outside,
      cancelled,
      total: walkinCustomers.length,
    };
  }, [walkinCustomers]);

  // Stats list for StatsList component
  const statsList = useMemo(() => {
    return [
      {key: 'inside',icon: CheckCircle,label: 'Inside',value: stats.inside,color: 'success'},
      {key: 'outside',icon: XCircle,label: 'Checked Out',value: stats.outside,color: 'dark'},
      {key: 'cancelled',icon: AlertCircle,label: 'Cancelled',value: stats.cancelled,color: 'danger'},
      {key: 'total',icon: UserCheck,label: 'Total',value: stats.total,color: 'primary'},
    ];
  }, [stats]);

  // Table columns
  const columns = useMemo(
    () =>
      walkinCustomerTableColumns({
        onCheckOut: handleCheckOut,
        onCancel: handleCancel,
      }),
    [handleCheckOut, handleCancel]
  );

  // Show loading state
  if (isLoadingWalkin) {
    return (
      <Layout title="Walkin Client" subtitle="Manage walk-in attendance">
        <div className="card">
          <div className="text-center py-12 text-dark-400">Loading...</div>
        </div>
      </Layout>
    );
  }

  // Show empty state if no walkin exists (only after loading is complete)
  if (!todayWalkin || !todayWalkin.id) {
    return (
      <Layout title="Walkin Client" subtitle="Manage walk-in attendance">
        <div className="mb-4 flex justify-end">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 text-sm text-dark-600 hover:bg-dark-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
        <WalkinForm onSuccess={handleWalkinCreated} />
      </Layout>
    );
  }

  return (
    <Layout title="Check-In System" subtitle="Manage walk-in attendance">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Check-In Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search Member */}
          <div className="card">
            <h3 className="text-lg font-semibold text-dark-50 mb-4">Quick Check-In</h3>
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                placeholder="Search member by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-dark-700 border border-dark-600 text-dark-50 placeholder-dark-400 rounded-xl focus:bg-dark-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all outline-none"
              />
            </div>

            {/* Customer List / Search Results */}
            {!searchQuery ? (
              <div className="flex flex-col items-center justify-center py-12 text-dark-400">
                <QrCode className="w-16 h-16 mb-4 text-dark-400" />
                <p className="text-lg font-medium text-dark-300">Search for a member to check in</p>
                <p className="text-sm text-dark-400">Or scan their membership QR code</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {isSearching ? (
                  <p className="text-center text-dark-400 py-8">Searching...</p>
                ) : displayCustomers.length === 0 ? (
                  <p className="text-center text-dark-400 py-8">No members found</p>
                ) : (
                  displayCustomers.map((customer) => {
                    const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
                    const membership = customer.currentMembership;
                    const membershipStatus = membership?.status || 'none';
                    const isExpired = membershipStatus === 'expired' || !membership;

                    // Check if already checked in
                    const alreadyCheckedIn = walkinCustomers.find(
                      (wc) => wc.customer?.id === customer.id && wc.status === WALKIN_CUSTOMER_STATUS.INSIDE
                    );

                    return (
                      <div
                        key={customer.id}
                        className="flex items-center justify-between p-4 bg-dark-700 rounded-xl hover:bg-dark-600 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar
                            src={customer.photo}
                            name={fullName}
                            size="lg"
                            status={membershipStatus === 'active' ? 'online' : 'offline'}
                          />
                          <div>
                            <p className="font-semibold text-dark-50">{fullName}</p>
                            {membership?.membershipPlan && (
                              <p className="text-sm text-dark-300">{membership.membershipPlan.planName}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant={
                                  membershipStatus === 'active'
                                    ? 'success'
                                    : membershipStatus === 'expiring'
                                    ? 'warning'
                                    : 'danger'
                                }
                              >
                                {membershipStatus}
                              </Badge>
                              {alreadyCheckedIn && (
                                <Badge variant="success">Checked In</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleQuickCheckIn(customer)}
                          disabled={isExpired || alreadyCheckedIn}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                            isExpired || alreadyCheckedIn
                              ? 'bg-dark-600 text-dark-400 cursor-not-allowed'
                              : 'bg-success-500 text-white hover:bg-success-600'
                          }`}
                        >
                          <UserCheck className="w-5 h-5" />
                          {alreadyCheckedIn ? 'Already In' : 'Check In'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Today's Check-In History */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark-800">Today's Check-In History</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-dark-600 hover:bg-dark-100 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>

            <DataTable
              columns={columns}
              data={walkinCustomers || []}
              loading={isLoadingCustomers}
              emptyMessage="No check-ins yet today"
              onRowClick={handleRowClick}
            />

            {/* Pagination */}
            {pagination && pagination.lastPage > 1 && (
              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  lastPage={pagination.lastPage}
                  from={pagination.from}
                  to={pagination.to}
                  total={pagination.total}
                  onPrev={goToPrev}
                  onNext={() => goToNext(pagination.lastPage)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Stats */}
        <div className="space-y-6">
          <StatsList title="Today's Summary" stats={statsList} />
        </div>
      </div>

      {/* Check-In Modal */}
      <CheckInModal
        isOpen={showCheckInModal}
        onClose={() => {
          setShowCheckInModal(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        onConfirm={confirmCheckIn}
        isSubmitting={createWalkinCustomerMutation.isPending}
      />
    </Layout>
  );
};

export default CheckIn;
