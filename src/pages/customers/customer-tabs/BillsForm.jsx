import { useState, useEffect, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useMembershipPlans } from '../../../hooks/useMembershipPlans';
import { useCustomerPaymentsByBill, useDeleteCustomerPayment } from '../../../hooks/useCustomerPayments';
import { BILL_TYPE, BILL_TYPE_OPTIONS } from '../../../constants/billConstants';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { Alert } from '../../../utils/alert';
import { Trash2, Info } from 'lucide-react';

const BillsForm = ({ customerId, currentMembership, onSubmit, onCancel, onCustomerUpdate, initialData = null }) => {
  const { data: membershipPlans = [], isLoading: loadingPlans } = useMembershipPlans();
  
  // Check if editing and original bill type was membership subscription
  const isEditMode = !!initialData;
  const isBillTypeLocked = isEditMode;
  const isPaidBill = isEditMode && initialData?.billStatus === 'paid';

  // Get active membership plan ID and details
  const activeMembershipPlanId = currentMembership?.membershipPlanId || null;
  const activeMembershipPlan = currentMembership?.membershipPlan || null;
  const billId = initialData?.id || null;

  const { data: payments = [], isLoading: loadingPayments } = useCustomerPaymentsByBill(billId);
  const deletePaymentMutation = useDeleteCustomerPayment();

  const [formData, setFormData] = useState({
    billDate: initialData?.billDate 
      ? new Date(initialData.billDate) 
      : new Date(),
    billType: initialData?.billType || BILL_TYPE.MEMBERSHIP_SUBSCRIPTION,
    membershipPlanId: initialData?.membershipPlanId || (activeMembershipPlanId ? String(activeMembershipPlanId) : ''),
    customService: initialData?.customService || '',
    grossAmount: initialData?.grossAmount || (activeMembershipPlan?.price || ''),
    discountPercentage: initialData?.discountPercentage || 0,
    netAmount: initialData?.netAmount || '',
    paidAmount: initialData?.paidAmount || 0,
    billStatus: initialData?.billStatus || 'active',
  });

  // Get selected plan for membership subscription
  const selectedPlan = useMemo(() => {
    if (formData.billType === BILL_TYPE.MEMBERSHIP_SUBSCRIPTION && formData.membershipPlanId) {
      return membershipPlans.find((plan) => plan.id === parseInt(formData.membershipPlanId));
    }
    return null;
  }, [formData.billType, formData.membershipPlanId, membershipPlans]);

  // Calculate net/total amount
  const calculatedNetAmount = useMemo(() => {
    const gross = parseFloat(formData.grossAmount) || 0;
    const discountPercentage = parseFloat(formData.discountPercentage) || 0;
    const discount = (gross * discountPercentage) / 100;
    return gross - discount;
  }, [formData.grossAmount, formData.discountPercentage]);

  // Update net amount when calculation changes
  useEffect(() => {
    setFormData((prev) => ({ ...prev, netAmount: calculatedNetAmount }));
  }, [calculatedNetAmount]);

  // Update gross amount when membership plan is selected or when bill type changes to membership subscription
  useEffect(() => {
    if (formData.billType === BILL_TYPE.MEMBERSHIP_SUBSCRIPTION) {
      if (selectedPlan) {
        setFormData((prev) => ({
          ...prev,
          grossAmount: selectedPlan.price,
        }));
      } else if (activeMembershipPlan && !initialData) {
        // For new bills, use active membership plan
        setFormData((prev) => ({
          ...prev,
          membershipPlanId: String(activeMembershipPlanId),
          grossAmount: activeMembershipPlan.price,
        }));
      }
    }
  }, [selectedPlan, formData.billType, activeMembershipPlan, activeMembershipPlanId, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate membership subscription has active membership
    if (formData.billType === BILL_TYPE.MEMBERSHIP_SUBSCRIPTION && !activeMembershipPlan) {
      return; // Prevent submission if no active membership
    }
    
    // Ensure netAmount is calculated
    const finalNetAmount = calculatedNetAmount || 0;
    
    // Format date to yyyy-MM-dd for API
    const formattedDate = formData.billDate instanceof Date
      ? formData.billDate.toISOString().split('T')[0]
      : formData.billDate;
    
    const submitData = {
      customerId: parseInt(customerId),
      billDate: formattedDate,
      billType: formData.billType,
      membershipPlanId: formData.billType === BILL_TYPE.MEMBERSHIP_SUBSCRIPTION 
        ? (parseInt(formData.membershipPlanId) || activeMembershipPlanId)
        : null,
      customService: formData.billType === BILL_TYPE.CUSTOM_AMOUNT ? formData.customService : null,
      grossAmount: parseFloat(formData.grossAmount),
      discountPercentage: parseFloat(formData.discountPercentage) || 0,
      netAmount: finalNetAmount,
      paidAmount: parseFloat(formData.paidAmount) || 0,
      billStatus: formData.billStatus,
    };

    onSubmit(submitData);
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

      // Also trigger a customer refetch in the parent, if provided
      if (onCustomerUpdate) {
        setTimeout(() => {
          onCustomerUpdate();
        }, 500);
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Warning for paid bills */}
      {isPaidBill && (
        <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg text-sm text-warning-800">
          This bill is already <strong>paid</strong>. Make sure you know what you are doing before updating this bill.
        </div>
      )}

      {/* Row 1: Bill Date + Bill Type */}
      <div className="grid grid-cols-2 gap-4">
        {/* Bill Date */}
        <div>
          <label className="label">Bill Date</label>
          <DatePicker
            selected={formData.billDate}
            onChange={(date) => setFormData(prev => ({ ...prev, billDate: date || new Date() }))}
            dateFormat="yyyy-MM-dd"
            className="input w-full"
            showYearDropdown
            showMonthDropdown
            dropdownMode="select"
            onKeyDown={(e) => {
              if (e && e.key && e.key !== 'Tab' && e.key !== 'Escape') {
                e.preventDefault();
              }
            }}
          />
        </div>

        {/* Bill Type */}
        <div>
          <label className="label">Bill Type</label>
          <select
            name="billType"
            value={formData.billType}
            onChange={handleChange}
            className="input"
            required
            disabled={isBillTypeLocked}
          >
            {BILL_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {isBillTypeLocked && (
            <p className="flex items-center gap-1 text-xs text-primary-500 mt-1">
              <Info className="w-3 h-3" />
              <span>Bill type cannot be updated once created</span>
            </p>
          )}
        </div>
      </div>

      {/* Row 2: Membership Plan + Price OR Custom Service + Unit Amount */}
      {formData.billType === BILL_TYPE.MEMBERSHIP_SUBSCRIPTION && (
        <div className="grid grid-cols-2 gap-4">
          {/* Membership Plan (left) */}
          <div>
            <label className="label">Membership Plan</label>
            {activeMembershipPlan ? (
              <input
                type="text"
                value={activeMembershipPlan.planName || 'N/A'}
                className="input bg-dark-50 cursor-not-allowed"
                disabled
                readOnly
              />
            ) : (
              <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
                <p className="text-sm text-warning-800">
                  No active membership plan found. Please add a membership plan first.
                </p>
              </div>
            )}
          </div>

          {/* Membership Price (right) */}
          <div>
            <label className="label">Membership Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">₱</span>
              <input
                type="number"
                value={formData.grossAmount}
                className="input pl-8 bg-dark-50 cursor-not-allowed"
                placeholder="0.00"
                step="0.01"
                readOnly
                disabled
              />
            </div>
          </div>
        </div>
      )}

      {formData.billType === BILL_TYPE.CUSTOM_AMOUNT && (
        <div className="grid grid-cols-2 gap-4">
          {/* Custom Service (left) */}
          <div>
            <label className="label">Custom Service</label>
            <input
              type="text"
              name="customService"
              value={formData.customService}
              onChange={handleChange}
              className="input"
              placeholder="Enter service name"
              required
            />
          </div>

          {/* Unit Amount (right) */}
          <div>
            <label className="label">Unit Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">₱</span>
              <input
                type="number"
                name="grossAmount"
                value={formData.grossAmount}
                onChange={handleChange}
                className="input pl-8"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>
        </div>
      )}

      {/* Row 3: Discount Percentage (right side) */}
      <div className="grid grid-cols-2 gap-4">
        <div></div>
        {/* Discount Percentage (right) */}
        <div>
          <label className="label">Discount Percentage (Optional)</label>
          <div className="relative">
            <input
              type="number"
              name="discountPercentage"
              value={formData.discountPercentage}
              onChange={handleChange}
              className="input pr-10"
              placeholder="0"
              step="0.01"
              min="0"
              max="100"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400">%</span>
          </div>
        </div>
      </div>
      
      {/* Row 4: Net Amount (right side) */}
      <div className="grid grid-cols-2 gap-4">
        <div></div>
        {/* Net Amount (right) */}
        <div>
          <label className="label">
            {formData.billType === BILL_TYPE.MEMBERSHIP_SUBSCRIPTION ? 'Total Amount' : 'Net Amount'}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">₱</span>
            <input
              type="number"
              name="netAmount"
              value={calculatedNetAmount}
              onChange={handleChange}
              className="input pl-8"
              placeholder="0.00"
              step="0.01"
              readOnly
            />
          </div>
        </div>
      </div>

      {/* Payment History - only for existing bills */}
      {billId && (
        <div className="pt-4 border-t border-dark-100 space-y-2">
          <h4 className="text-sm font-semibold text-dark-800">Payment History</h4>
          {loadingPayments ? (
            <p className="text-sm text-dark-500">Loading payments...</p>
          ) : payments.length === 0 ? (
            <p className="text-sm text-dark-400">No payments recorded for this bill yet.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto text-xs text-dark-600">
              {/* Header */}
              <div className="grid grid-cols-[1.2fr,1fr,1.4fr,auto] gap-3 px-2 py-1 text-[11px] font-semibold text-dark-500 uppercase tracking-wide">
                <div>Date</div>
                <div>Paid Amount</div>
                <div>Method &amp; Ref #</div>
                <div className="text-right">Actions</div>
              </div>

              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="grid grid-cols-[1.2fr,1fr,1.4fr,auto] gap-3 items-center px-2 py-2 border border-dark-100 rounded-lg bg-dark-50"
                >
                  {/* Date */}
                  <div className="text-dark-700">
                    {payment.paymentDate ? formatDate(payment.paymentDate) : 'N/A'}
                  </div>

                  {/* Paid Amount */}
                  <div className="font-semibold text-dark-900">
                    {formatCurrency(payment.amount)}
                  </div>

                  {/* Method & Ref # */}
                  <div className="space-y-0.5">
                    <div className="capitalize text-dark-700">{payment.paymentMethod}</div>
                    {payment.referenceNumber && (
                      <div className="text-dark-500 text-[11px]">Ref #: {payment.referenceNumber}</div>
                    )}
                  </div>

                  {/* Delete icon */}
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => handleDeletePayment(payment)}
                      className="inline-flex items-center justify-center p-1.5 rounded-full text-danger-600 hover:bg-danger-50 hover:text-danger-700 transition-colors"
                      aria-label="Delete payment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onCancel} className="flex-1 btn-secondary">
          Cancel
        </button>
        <button 
          type="submit" 
          className="flex-1 btn-primary"
          disabled={formData.billType === BILL_TYPE.MEMBERSHIP_SUBSCRIPTION && !activeMembershipPlan}
        >
          {initialData ? 'Update Bill' : 'Generate Bill'}
        </button>
      </div>
    </form>
  );
};

export default BillsForm;

