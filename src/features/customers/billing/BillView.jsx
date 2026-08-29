import DataTable from '../../../components/DataTable';
import { Badge, InfoField } from '../../../components/common';
import { formatCurrency, formatDate } from '../../../shared/utils/formatters';
import { BILL_TYPE, BILL_STATUS_LABELS, BILL_STATUS_VARIANTS } from '../../../shared/constants/billConstants';
import { useCustomerPaymentsByBill } from '../../../shared/hooks/useCustomerPayments';
import { paymentHistoryTableColumns } from './paymentHistoryTable.config';

/**
 * Read-only detail view of a customer bill. Unlike BillsForm (which uses
 * inputs for editing), this presents the bill as labelled values so it can't
 * be mistaken for an editable form. Shows the bill's payment history — with
 * receipts — below, and no destructive actions.
 *
 * @param {{
 *   bill: Object,
 *   currentMembership?: Object,
 *   onClose: () => void,
 * }} props
 * @returns {JSX.Element|null}
 */
const BillView = ({ bill, currentMembership, onClose }) => {
  const { data: payments = [], isLoading: isLoadingPayments } = useCustomerPaymentsByBill(bill?.id || null);

  if (!bill) return null;

  const gross = Number(bill.grossAmount ?? 0);
  const discount = Number(bill.discountPercentage ?? 0);
  const net = Number(bill.netAmount ?? 0);
  const paid = Number(bill.paidAmount ?? 0);
  const remaining = Math.max(net - paid, 0);

  const planName =
    bill.membershipPlan?.planName || currentMembership?.membershipPlan?.planName || null;

  // Secondary detail shown next to the bill type (plan name or custom service).
  const billTypeDetail =
    bill.billType === BILL_TYPE.CUSTOM_AMOUNT
      ? bill.customService
      : bill.billType === BILL_TYPE.MEMBERSHIP_SUBSCRIPTION
      ? planName
      : null;

  return (
    <div className="space-y-6">
      {/* Header: bill type + status */}
      <div className="flex items-center justify-between p-4 bg-dark-700 border border-dark-600 rounded-xl">
        <div>
          <p className="text-sm text-dark-400">Bill Type</p>
          <p className="font-semibold text-dark-50">
            {bill.billType}
            {billTypeDetail && <span className="font-normal text-dark-300"> — {billTypeDetail}</span>}
          </p>
        </div>
        <Badge variant={BILL_STATUS_VARIANTS[bill.billStatus] || 'warning'}>
          {BILL_STATUS_LABELS[bill.billStatus] || bill.billStatus}
        </Badge>
      </div>

      {/* Detail fields */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <InfoField label="Bill Date" value={formatDate(bill.billDate)} valueClassName="text-dark-50 font-medium" />
        <InfoField label="Price" value={formatCurrency(gross)} valueClassName="text-dark-50 font-medium" />
        <InfoField label="Discount" value={`${discount}%`} valueClassName="text-dark-50 font-medium" />
        {planName && (
          <InfoField label="Membership Plan" value={planName} valueClassName="text-dark-50 font-medium" />
        )}
        {bill.billType === BILL_TYPE.CUSTOM_AMOUNT && bill.customService && (
          <InfoField label="Custom Service" value={bill.customService} valueClassName="text-dark-50 font-medium" />
        )}
      </div>

      {/* Amount summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-xl">
          <p className="text-xs text-dark-300 mb-1">Net Amount</p>
          <p className="text-lg font-bold text-primary-300">{formatCurrency(net)}</p>
        </div>
        <div className="p-3 bg-success-500/10 border border-success-500/20 rounded-xl">
          <p className="text-xs text-dark-300 mb-1">Paid</p>
          <p className="text-lg font-bold text-success-300">{formatCurrency(paid)}</p>
        </div>
        <div className="p-3 bg-warning-500/10 border border-warning-500/20 rounded-xl">
          <p className="text-xs text-dark-300 mb-1">Remaining</p>
          <p className="text-lg font-bold text-warning-300">{formatCurrency(remaining)}</p>
        </div>
      </div>

      {/* Payment history (read-only — no delete action) */}
      <div className="pt-4 border-t border-dark-100">
        <h4 className="text-sm font-semibold text-dark-50 mb-2">Payment History</h4>
        {isLoadingPayments ? (
          <div className="text-sm text-dark-400 py-4">Loading payment history...</div>
        ) : payments && payments.length > 0 ? (
          <DataTable
            data={payments}
            columns={paymentHistoryTableColumns(undefined, { readOnly: true })}
            noPagination={true}
          />
        ) : (
          <div className="text-sm text-dark-400 py-4">No payments recorded for this bill.</div>
        )}
      </div>

      <div className="flex pt-4">
        <button type="button" onClick={onClose} className="flex-1 btn-secondary">Close</button>
      </div>
    </div>
  );
};

export default BillView;
