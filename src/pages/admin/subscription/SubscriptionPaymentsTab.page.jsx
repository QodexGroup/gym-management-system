import { useState } from 'react';
import DataTable from '../../../components/DataTable';
import { Pagination } from '../../../components/common';
import { useAuth } from '../../../context/AuthContext';
import { subscriptionPaymentColumns } from '../tables/subscriptionPaymentTable.config.jsx';
import { getFileUrl } from '../../../services/firebaseUrlService';
import { Toast } from '../../../utils/alert';
import { useSubscriptionRequests } from '../../../hooks/useSubscriptionRequests';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import {
  getSubscriptionPaymentStatusBadgeClass,
  getSubscriptionPaymentStatusLabel,
} from '../../../constants/subscriptionConstants';

const PAGE_SIZE = 20;

const SubscriptionPaymentsTab = () => {
  const { fetchUserData } = useAuth();
  const [paymentPage, setPaymentPage] = useState(1);

  const openReceipt = async (receiptUrl) => {
    if (!receiptUrl) return;
    try {
      const fileUrl = await getFileUrl(receiptUrl);
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      Toast.error(err.message || 'Failed to open receipt');
    }
  };

  const paymentColumns = subscriptionPaymentColumns({
    formatMoney: (value) => formatCurrency(value || 0),
    formatDate: (value) => formatDate(value),
    formatStatusLabel: getSubscriptionPaymentStatusLabel,
    getStatusBadgeClass: getSubscriptionPaymentStatusBadgeClass,
    onOpenReceipt: openReceipt,
  });

  const { data: requestData, isLoading } = useSubscriptionRequests({
    page: paymentPage,
    pagelimit: PAGE_SIZE,
  });
  const paymentRows = requestData?.data || [];
  const pagination = requestData?.pagination;

  return (
  <div>
    <h3 className="text-lg font-semibold text-dark-50 mb-4">Payment History</h3>
    <DataTable
      columns={paymentColumns}
      data={paymentRows}
      loading={isLoading}
      emptyMessage="No payment history yet."
    />
    {pagination && pagination.lastPage > 1 && (
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-dark-400">
          Showing {pagination.from}-{pagination.to} of {pagination.total}
        </p>
        <Pagination
          currentPage={paymentPage}
          lastPage={pagination.lastPage}
          from={pagination.from}
          to={pagination.to}
          total={pagination.total}
          onPrev={() => setPaymentPage((prev) => Math.max(1, prev - 1))}
          onNext={() => setPaymentPage((prev) => Math.min(prev + 1, pagination.lastPage))}
        />
      </div>
    )}
  </div>
  );
};

export default SubscriptionPaymentsTab;

