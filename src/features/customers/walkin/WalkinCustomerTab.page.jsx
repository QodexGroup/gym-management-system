import { useState, useMemo } from 'react';
import { Pagination, Badge, ReloadButton } from '../../../components/common';
import DataTable from '../../../components/DataTable';
import { Calendar, LogIn, LogOut } from 'lucide-react';
import {
  WALKIN_CUSTOMER_STATUS,
  WALKIN_CUSTOMER_STATUS_LABELS,
} from '../../../shared/constants/walkinConstant';
import { formatDate, formatTimeFromDate } from '../../../shared/utils/formatters';
import { useWalkinsByCustomer } from '../../../shared/hooks/useWalkins';

const WalkinCustomerTab = ({ member }) => {
  const [historyPage, setHistoryPage] = useState(1);
  const historyPageSize = 50;

  // Fetch paginated walkin history for customer
  const {
    data: historyData,
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
    isRefetching: isRefetchingHistory,
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
      return new Date(b.checkInTime) - new Date(a.checkInTime);
    });
  }, [historyWalkins]);

  const handleHistoryPageChange = (newPage) => setHistoryPage(newPage);

  /* ---------------- Helpers ---------------- */
  const getStatusBadge = (status) => {
    const statusKey = status?.toUpperCase() || WALKIN_CUSTOMER_STATUS.INSIDE;
    const variantMap = {
      [WALKIN_CUSTOMER_STATUS.INSIDE]: 'success',
      [WALKIN_CUSTOMER_STATUS.OUTSIDE]: 'default',
      [WALKIN_CUSTOMER_STATUS.CANCELLED]: 'danger',
    };
    return {
      label: WALKIN_CUSTOMER_STATUS_LABELS[statusKey] || status,
      variant: variantMap[statusKey] || 'default',
    };
  };

  /* ---------------- Columns ---------------- */
  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (walkinCustomer) => {
        const walkinDate = walkinCustomer.checkInTime;
        return walkinDate
          ? <span className="font-medium text-dark-50">{formatDate(walkinDate)}</span>
          : <span className="text-dark-400">—</span>;
      },
    },
    {
      key: 'checkIn',
      label: 'Check-in',
      render: (walkinCustomer) => {
        const t = walkinCustomer.checkInTime ? formatTimeFromDate(walkinCustomer.checkInTime) : null;
        if (!t) return <span className="text-dark-400">—</span>;
        return (
          <span className="flex items-center gap-1 text-sm text-dark-200">
            <LogIn className="w-3.5 h-3.5 text-dark-400" />
            {t}
          </span>
        );
      },
    },
    {
      key: 'checkOut',
      label: 'Check-out',
      render: (walkinCustomer) => {
        const t = walkinCustomer.checkOutTime ? formatTimeFromDate(walkinCustomer.checkOutTime) : null;
        if (!t) {
          return walkinCustomer.checkInTime
            ? <span className="text-sm text-dark-400">Still inside</span>
            : <span className="text-dark-400">—</span>;
        }
        return (
          <span className="flex items-center gap-1 text-sm text-dark-200">
            <LogOut className="w-3.5 h-3.5 text-dark-400" />
            {t}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (walkinCustomer) => {
        const { label, variant } = getStatusBadge(walkinCustomer.status);
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
  ];

  /* ---------------- Render ---------------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-dark-50">Walk-In Attendance</h3>
        <ReloadButton onReload={refetchHistory} isReloading={isRefetchingHistory} />
      </div>

      {/* Walkin History */}
      <div className="card">
        <DataTable
          columns={columns}
          data={walkinHistory}
          loading={isLoadingHistory || isRefetchingHistory}
          emptyMessage="No walk-in attendance records found"
        />
      </div>

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
  );
};

export default WalkinCustomerTab;
