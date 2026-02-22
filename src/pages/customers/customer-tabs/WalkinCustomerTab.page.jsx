import { useState, useMemo } from 'react';
import { Pagination, CardList } from '../../../components/common';
import {
  Calendar,
  Clock,
  LogIn,
  LogOut,
} from 'lucide-react';
import {
  WALKIN_CUSTOMER_STATUS,
  WALKIN_CUSTOMER_STATUS_LABELS,
} from '../../../constants/walkinConstant';
import { formatDate, formatTimeFromDate } from '../../../utils/formatters';
import { useWalkinsByCustomer } from '../../../hooks/useWalkins';

const WalkinCustomerTab = ({ member }) => {
  const [historyPage, setHistoryPage] = useState(1);
  const historyPageSize = 50;

  // Fetch paginated walkin history for customer
  const {
    data: historyData,
    isLoading: isLoadingHistory,
  } = useWalkinsByCustomer(member?.id, {
    page: historyPage,
    pagelimit: historyPageSize,
    relations: ['walkin'],
    sorts: [{ field: 'check_in_time', direction: 'desc' }],
  });

  const historyWalkins = historyData?.data || [];
  const historyPagination = historyData ? {
    currentPage: historyData.currentPage,
    lastPage: historyData.lastPage,
    from: historyData.from,
    to: historyData.to,
    total: historyData.total,
  } : {};

  // Sort history walkins by check-in time (descending)
  const walkinHistory = useMemo(() => {
    return [...historyWalkins].sort((a, b) => {
      if (!a.checkInTime || !b.checkInTime) return 0;
      const dateA = new Date(a.checkInTime);
      const dateB = new Date(b.checkInTime);
      return dateB - dateA;
    });
  }, [historyWalkins]);

  const handleHistoryPageChange = (newPage) => {
    setHistoryPage(newPage);
  };

  /* ---------------- Helpers ---------------- */
  const getStatusBadge = (status) => {
    const statusKey = status?.toUpperCase() || WALKIN_CUSTOMER_STATUS.INSIDE;
    const label = WALKIN_CUSTOMER_STATUS_LABELS[statusKey] || status;
    const variantMap = {
      [WALKIN_CUSTOMER_STATUS.INSIDE]: 'success',
      [WALKIN_CUSTOMER_STATUS.OUTSIDE]: 'default',
      [WALKIN_CUSTOMER_STATUS.CANCELLED]: 'danger',
    };
    const variant = variantMap[statusKey] || 'default';
    return { label, variant };
  };

  const getWalkinDate = (walkinCustomer) => {
    if (!walkinCustomer.checkInTime) return null;
    return new Date(walkinCustomer.checkInTime).toISOString().split('T')[0];
  };

  const getCheckInTime = (walkinCustomer) => {
    if (!walkinCustomer.checkInTime) return null;
    return formatTimeFromDate(walkinCustomer.checkInTime);
  };

  const getCheckOutTime = (walkinCustomer) => {
    if (!walkinCustomer.checkOutTime) return null;
    return formatTimeFromDate(walkinCustomer.checkOutTime);
  };

  /* ---------------- Render ---------------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-dark-50">Walk-In Attendance</h3>
      </div>

      {/* Walkin History */}
      {isLoadingHistory ? (
        <div className="text-center py-8 text-dark-400">Loading attendance records...</div>
      ) : (
        <div>
          <CardList
            cards={walkinHistory}
            renderTitle={(walkinCustomer) => {
              const walkin = walkinCustomer.walkin;
              const walkinDate = walkin?.date;
              return walkinDate ? formatDate(walkinDate) : 'Walk-In Session';
            }}
            renderContent={(walkinCustomer) => {
              const checkInTime = getCheckInTime(walkinCustomer);
              const checkOutTime = getCheckOutTime(walkinCustomer);
              
              return (
                <div className="flex items-center gap-4">
                  {checkInTime && (
                    <div className="flex items-center gap-1">
                      <LogIn className="w-4 h-4" />
                      {checkInTime}
                    </div>
                  )}
                  {checkOutTime && (
                    <div className="flex items-center gap-1">
                      <LogOut className="w-4 h-4" />
                      {checkOutTime}
                    </div>
                  )}
                  {!checkOutTime && checkInTime && (
                    <span className="text-sm text-dark-400">Still inside</span>
                  )}
                </div>
              );
            }}
            showFooter={false}
            badges={[
              {
                label: '',
                getValue: (walkinCustomer) => {
                  const walkinDate = getWalkinDate(walkinCustomer);
                  return walkinDate ? formatDate(walkinDate) : '';
                },
                variant: 'default',
              },
              {
                label: '',
                getValue: (walkinCustomer) => {
                  const statusInfo = getStatusBadge(walkinCustomer.status);
                  return statusInfo.label;
                },
                getVariant: (walkinCustomer) => {
                  const statusInfo = getStatusBadge(walkinCustomer.status);
                  return statusInfo.variant;
                },
              },
            ]}
            showActions={false}
            emptyStateMessage="No walk-in attendance records found"
            emptyStateIcon={Calendar}
          />

          {/* Pagination */}
          {historyPagination.lastPage > 1 && (
            <Pagination
              currentPage={historyPage}
              lastPage={historyPagination.lastPage}
              from={historyPagination.from}
              to={historyPagination.to}
              total={historyPagination.total}
              onPrev={() => handleHistoryPageChange(Math.max(historyPage - 1, 1))}
              onNext={() => handleHistoryPageChange(Math.min(historyPage + 1, historyPagination.lastPage || 1))}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default WalkinCustomerTab;
