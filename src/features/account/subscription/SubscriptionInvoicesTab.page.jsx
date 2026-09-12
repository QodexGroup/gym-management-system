import { useState } from 'react';
import DataTable from '../../../components/DataTable';
import { Pagination } from '../../../components/common';
import { useAccountInvoices } from '../../../shared/hooks/useAccountInvoices';
import { subscriptionInvoiceColumns } from '../subscriptionInvoiceTable.config.jsx';
import { getFileUrl } from '../../../shared/services/storageService';
import { Toast } from '../../../shared/utils/alert';
import { formatCurrency, formatDate } from '../../../shared/utils/formatters';
import {
  getSubscriptionInvoiceStatusBadgeClass,
  getSubscriptionInvoiceStatusLabel,
} from '../../../shared/constants/subscriptionConstants';
import InvoicePaymentModal from '../InvoicePaymentModal';

const PAGE_SIZE = 20;

const SubscriptionInvoicesTab = () => {
  const [invoicePage, setInvoicePage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const openReceipt = async (receiptUrl) => {
    if (!receiptUrl) return;
    try {
      const fileUrl = await getFileUrl(receiptUrl);
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      Toast.error(err.message || 'Failed to open receipt');
    }
  };

  const handlePayInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setIsPaymentModalOpen(true);
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedInvoice(null);
  };

  const invoiceColumns = subscriptionInvoiceColumns({
    formatMoney: (value) => formatCurrency(value || 0),
    formatDate: (value) => formatDate(value),
    formatStatusLabel: getSubscriptionInvoiceStatusLabel,
    getStatusBadgeClass: getSubscriptionInvoiceStatusBadgeClass,
    onOpenReceipt: openReceipt,
    onPayInvoice: handlePayInvoice,
  });

  // Reads the invoices themselves. This previously read payment REQUESTS and
  // filtered to invoice-linked ones, which meant a freshly issued invoice with
  // no receipt yet never appeared — and since paying one needs an invoice id
  // taken from this list, an unpaid invoice could never be paid.
  const { data: invoiceData, isLoading, error } = useAccountInvoices({
    page: invoicePage,
    pagelimit: PAGE_SIZE,
  });

  const invoiceRows = invoiceData?.data || [];
  const pagination = invoiceData?.pagination;

  return (
    <div>
      <h3 className="text-lg font-semibold text-dark-50 mb-4">Invoices</h3>

        {/* A failed request must not render as "No invoices yet." — that reads
            as "you owe nothing", which is the opposite of what a billing screen
            should say when it does not know. */}
        {error ? (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3">
            <p className="text-sm font-medium text-red-300">Could not load your invoices</p>
            <p className="text-sm text-red-200/80">{error.message}</p>
          </div>
        ) : null}

        <DataTable
          columns={invoiceColumns}
          data={invoiceRows}
          loading={isLoading}
          emptyMessage={error ? 'Invoices could not be loaded.' : 'No invoices yet.'}
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

      {/* Invoice Payment Modal */}
      <InvoicePaymentModal
        invoice={selectedInvoice}
        isOpen={isPaymentModalOpen}
        onClose={handleClosePaymentModal}
      />
    </div>
  );
};

export default SubscriptionInvoicesTab;
