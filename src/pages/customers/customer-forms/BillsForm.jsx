import { useState, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useMembershipPlans } from '../../../hooks/useMembershipPlans';
import { useCustomerPaymentsByBill, useDeleteCustomerPayment } from '../../../hooks/useCustomerPayments';
import { BILL_TYPE, BILL_TYPE_OPTIONS } from '../../../constants/billConstants';
import { Alert } from '../../../utils/alert';
import { Info } from 'lucide-react';
import DataTable from '../../../components/DataTable';
import { paymentHistoryTableColumns } from '../tables/paymentHistoryTable.config';

const BillsForm = ({ customerId, currentMembership, onSubmit, onCancel, onCustomerUpdate, initialData = null }) => {
  const { data: membershipPlans = [] } = useMembershipPlans();
  const isEditMode = !!initialData;
  const isPaidBill = isEditMode && initialData?.billStatus === 'paid';

  const activeMembershipPlan = currentMembership?.membershipPlan || null;

  // Initialize form state
  const [formData, setFormData] = useState({
    billDate: initialData?.billDate ? new Date(initialData.billDate) : new Date(),
    billType: initialData?.billType || BILL_TYPE.MEMBERSHIP_SUBSCRIPTION,
    membershipPlanId: initialData?.membershipPlanId || activeMembershipPlan?.id || '',
    customService: initialData?.customService || '',
    grossAmount: initialData?.grossAmount || activeMembershipPlan?.price || 0,
    discountPercentage: initialData?.discountPercentage || 0,
    paidAmount: initialData?.paidAmount || 0,
    billStatus: initialData?.billStatus || 'active',
  });

  const billId = initialData?.id || null;
  const { data: payments = [] } = useCustomerPaymentsByBill(billId);
  const deletePaymentMutation = useDeleteCustomerPayment();

  // Selected membership plan
  const selectedPlan = useMemo(() => {
    return membershipPlans.find(plan => plan.id === parseInt(formData.membershipPlanId));
  }, [formData.membershipPlanId, membershipPlans]);

  // Net amount calculation
  const netAmount = useMemo(() => {
    const gross = parseFloat(formData.grossAmount) || 0;
    const discount = (gross * (parseFloat(formData.discountPercentage) || 0)) / 100;
    return gross - discount;
  }, [formData.grossAmount, formData.discountPercentage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.billType === BILL_TYPE.MEMBERSHIP_SUBSCRIPTION && !activeMembershipPlan) return;

    const formattedDate = formData.billDate instanceof Date
      ? formData.billDate.toISOString().split('T')[0]
      : formData.billDate;

    const payload = {
      customerId: parseInt(customerId),
      billDate: formattedDate,
      billType: formData.billType,
      membershipPlanId: formData.billType === BILL_TYPE.MEMBERSHIP_SUBSCRIPTION ? parseInt(formData.membershipPlanId) : null,
      customService: formData.billType === BILL_TYPE.CUSTOM_AMOUNT ? formData.customService : null,
      grossAmount: parseFloat(formData.grossAmount),
      discountPercentage: parseFloat(formData.discountPercentage) || 0,
      netAmount,
      paidAmount: parseFloat(formData.paidAmount) || 0,
      billStatus: formData.billStatus,
    };

    onSubmit(payload);
  };

  const handleDeletePayment = async (payment) => {
    const result = await Alert.confirmDelete();
    if (!result.isConfirmed) return;

    try {
      await deletePaymentMutation.mutateAsync({
        paymentId: payment.id,
        customerId: parseInt(customerId),
        billId,
      });
      // onCustomerUpdate is not needed here as the mutation's onSuccess already handles query invalidation
    } catch (error) {
      console.error('Failed to delete payment:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isPaidBill && (
        <div className="p-3 bg-blue-500/10 border-2 border-blue-400 rounded-lg text-sm text-blue-300 font-medium">
          <strong className="text-blue-200">This bill is already paid.</strong>
        </div>
      )}

      {/* Bill Date & Type */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Bill Date</label>
          <DatePicker
            selected={formData.billDate}
            onChange={(date) => setFormData(prev => ({ ...prev, billDate: date || new Date() }))}
            dateFormat="yyyy-MM-dd"
            className="input w-full"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
          />
        </div>
        <div>
          <label className="label">Bill Type</label>
          <select
            name="billType"
            value={formData.billType}
            onChange={handleChange}
            className="input"
            disabled={isEditMode}
          >
            {BILL_TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {isEditMode && <p className="text-xs text-primary-500 mt-1 flex items-center gap-1"><Info className="w-3 h-3" /> Bill type cannot be changed</p>}
        </div>
      </div>

      {/* Conditional Fields by Bill Type */}
      {formData.billType === BILL_TYPE.MEMBERSHIP_SUBSCRIPTION && activeMembershipPlan && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Membership Plan</label>
            <input type="text" className="input bg-dark-50 cursor-not-allowed" value={activeMembershipPlan.planName} disabled />
          </div>
          <div>
            <label className="label">Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">₱</span>
              <input type="number" className="input pl-8 bg-dark-50 cursor-not-allowed" value={formData.grossAmount} readOnly disabled />
            </div>
          </div>
        </div>
      )}

      {formData.billType === BILL_TYPE.CUSTOM_AMOUNT && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Custom Service</label>
            <input type="text" name="customService" value={formData.customService} onChange={handleChange} className="input" required />
          </div>
          <div>
            <label className="label">Unit Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">₱</span>
              <input type="number" name="grossAmount" value={formData.grossAmount} onChange={handleChange} className="input pl-8" required step="0.01" />
            </div>
          </div>
        </div>
      )}

      {/* Discount & Net Amount */}
      <div className="grid grid-cols-2 gap-4">
        <div></div>
        <div>
          <label className="label">Discount %</label>
          <div className="relative">
            <input type="number" name="discountPercentage" value={formData.discountPercentage} onChange={handleChange} className="input pr-10" min="0" max="100" step="0.01" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400">%</span>
          </div>
          <label className="label mt-2">Net Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">₱</span>
            <input type="number" className="input pl-8" value={netAmount} readOnly />
          </div>
        </div>
      </div>

      {/* Payments History */}
      {billId && payments.length > 0 && (
        <div className="pt-4 border-t border-dark-100">
          <h4 className="text-sm font-semibold text-dark-800 mb-2">Payment History</h4>
          <DataTable
            data={payments}
            columns={paymentHistoryTableColumns(handleDeletePayment)}
            pageSize={5}
            noPagination={payments.length <= 5}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onCancel} className="flex-1 btn-secondary">Cancel</button>
        <button type="submit" className="flex-1 btn-primary" disabled={formData.billType === BILL_TYPE.MEMBERSHIP_SUBSCRIPTION && !activeMembershipPlan}>
          {isEditMode ? 'Update Bill' : 'Generate Bill'}
        </button>
      </div>
    </form>
  );
};

export default BillsForm;
