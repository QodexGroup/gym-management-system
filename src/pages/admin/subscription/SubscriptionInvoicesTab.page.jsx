import { useState } from 'react';
import DataTable from '../../../components/DataTable';
import { Pagination } from '../../../components/common';
import { useSubscriptionRequests } from '../../../hooks/useSubscriptionRequests';
import { subscriptionInvoiceColumns } from '../tables/subscriptionInvoiceTable.config';
import { getFileUrl } from '../../../services/firebaseUrlService';
import { Toast } from '../../../utils/alert';
import { formatCurrency } from '../../../utils/formatters';
import {
  getSubscriptionInvoiceStatusBadgeClass,
  getSubscriptionInvoiceStatusLabel,
} from '../../../constants/subscriptionConstants';

const PAGE_SIZE = 20;

const SubscriptionInvoicesTab = () => {
  const [invoicePage, setInvoicePage] = useState(1);

  const openReceipt = async (receiptUrl) => {
    if (!receiptUrl) return;
    try {
      const fileUrl = await getFileUrl(receiptUrl);
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      Toast.error(err.message || 'Failed to open receipt');
    }
  };

  const invoiceColumns = subscriptionInvoiceColumns({
    formatMoney: (value) => formatCurrency(value || 0),
    formatStatusLabel: getSubscriptionInvoiceStatusLabel,
    getStatusBadgeClass: getSubscriptionInvoiceStatusBadgeClass,
    onOpenReceipt: openReceipt,
  });

  const { data: requestData, isLoading } = useSubscriptionRequests({
    page: invoicePage,
    pagelimit: PAGE_SIZE,
  });

  const invoiceRows = requestData?.data || [];
  const pagination = requestData?.pagination;

  return (
    <div>
      <h3 className="text-lg font-semibold text-dark-50 mb-4">Invoices</h3>

        <DataTable
          columns={invoiceColumns}
          data={invoiceRows}
          loading={isLoading}
          emptyMessage="No invoices yet."
        />
        {pagination && pagination.lastPage > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-dark-400">
              Showing {pagination.from}-{pagination.to} of {pagination.total}
            </p>
            <Pagination
              currentPage={invoicePage}
              lastPage={pagination.lastPage}
              from={pagination.from}
              to={pagination.to}
              total={pagination.total}
              onPrev={() => setInvoicePage((prev) => Math.max(1, prev - 1))}
              onNext={() => setInvoicePage((prev) => Math.min(prev + 1, pagination.lastPage))}
            />
          </div>
        )}
    </div>
  );
};

export default SubscriptionInvoicesTab;

