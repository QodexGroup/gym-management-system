import { useState } from 'react';
import { CheckCircle, Clock, AlertCircle, Receipt, Plus, Edit, Trash2, Banknote, CreditCard, Calendar, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge, Modal, Avatar } from '../../../components/common';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import BillsForm from '../customer-forms/BillsForm';
import MembershipPlanForm from '../customer-forms/MembershipPlanForm';
import PaymentForm from '../customer-forms/PaymentForm';
import { useCustomerBills, useCreateCustomerBill, useUpdateCustomerBill, useDeleteCustomerBill } from '../../../hooks/useCustomerBills';
import { useCreateOrUpdateCustomerMembership } from '../../../hooks/useCustomerMembership';
import { useCreateCustomerPayment } from '../../../hooks/useCustomerPayments';
import { BILL_STATUS, BILL_STATUS_LABELS, BILL_STATUS_VARIANTS, BILL_TYPE } from '../../../constants/billConstants';
import { Alert } from '../../../utils/alert';
import { CUSTOMER_MEMBERSHIP_STATUS } from '../../../constants/customerMembership';
import { usePermissions } from '../../../hooks/usePermissions';

const BillsTab = ({ member, onCustomerUpdate }) => {
  const { hasPermission } = usePermissions();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentBill, setPaymentBill] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading, isError, error } = useCustomerBills(member?.id, { page: currentPage, pagelimit: 50 });
  const createBillMutation = useCreateCustomerBill();
  const updateBillMutation = useUpdateCustomerBill();
  const deleteBillMutation = useDeleteCustomerBill();
  const membershipMutation = useCreateOrUpdateCustomerMembership();
  const createPaymentMutation = useCreateCustomerPayment();
  
  const currentMembership = member?.currentMembership;
  const hasActiveMembership = currentMembership && currentMembership.status === CUSTOMER_MEMBERSHIP_STATUS.ACTIVE;
  
  // Extract bills and pagination from response
  const bills = data?.data || [];
  const pagination = data ? {
    current_page: data.current_page,
    last_page: data.last_page,
    per_page: data.per_page,
    total: data.total,
    from: data.from,
    to: data.to,
  } : null;
  
  // Calculate stats from bills
  const totalPaid = bills
    .filter((b) => b.billStatus === BILL_STATUS.PAID)
    .reduce((sum, b) => sum + (parseFloat(b.paidAmount) || 0), 0);

  // Number of open bills (active or partial)
  const openBillsCount = bills.filter(
    (b) => b.billStatus === BILL_STATUS.ACTIVE || b.billStatus === BILL_STATUS.PARTIAL
  ).length;

  // Total outstanding balance (all non‑paid bills)
  const balanceDue = bills
    .filter((b) => b.billStatus !== BILL_STATUS.PAID)
    .reduce((sum, b) => sum + (parseFloat(b.netAmount) || 0) - (parseFloat(b.paidAmount) || 0), 0);

  const handleCreateBill = async (billData) => {
    try {
      if (selectedBill) {
        // Update existing bill
        await updateBillMutation.mutateAsync({ id: selectedBill.id, data: billData });
      } else {
        // Create new bill
        await createBillMutation.mutateAsync(billData);
      }
      setShowInvoiceModal(false);
      setSelectedBill(null);
      // Trigger customer update callback if provided - wait a bit for backend to process
      if (onCustomerUpdate) {
        setTimeout(() => {
          onCustomerUpdate();
        }, 500);
      }
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const handleEdit = (bill) => {
    setSelectedBill(bill);
    setShowInvoiceModal(true);
  };

  const handleDelete = async (id) => {
    const result = await Alert.confirmDelete();

    if (!result.isConfirmed) {
      return;
    }

    try {
      await deleteBillMutation.mutateAsync({ id, customerId: member?.id });
      Alert.success('Deleted!', 'Bill has been deleted.', {
        timer: 2000,
        showConfirmButton: false
      });
      // Trigger customer update callback if provided - wait a bit for backend to process
      if (onCustomerUpdate) {
        setTimeout(() => {
          onCustomerUpdate();
        }, 500);
      }
    } catch (error) {
      // Error already handled in mutation
      console.error('Error deleting bill:', error);
    }
  };

  const handleOpenPayment = (bill) => {
    setPaymentBill(bill);
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (paymentData) => {
    if (!paymentBill) return;

    try {
      await createPaymentMutation.mutateAsync({
        billId: paymentBill.id,
        customerId: member.id,
        paymentData,
      });

      setShowPaymentModal(false);
      setPaymentBill(null);

      if (onCustomerUpdate) {
        setTimeout(() => {
          onCustomerUpdate();
        }, 500);
      }
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const handleMembershipSubmit = async (membershipData) => {
    try {
      await membershipMutation.mutateAsync({ 
        customerId: member?.id, 
        membershipData 
      });
      setShowMembershipModal(false);
      // Trigger customer update callback if provided - wait a bit for backend to process
      if (onCustomerUpdate) {
        setTimeout(() => {
          onCustomerUpdate();
        }, 500);
      }
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  return (
    <div className="space-y-6">
      {/* Membership Plan Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-dark-50">Membership Plan</h3>
          {hasPermission('membership_plan_update') && (
            <button 
              onClick={() => setShowMembershipModal(true)} 
              className={`flex items-center gap-2 ${hasActiveMembership ? 'btn-primary' : 'btn-success'}`}
            >
              <UserCheck className="w-4 h-4" />
              {hasActiveMembership ? 'Update Membership Plan' : 'Add Membership Plan'}
            </button>
          )}
        </div>
        
        {hasActiveMembership ? (
          <div className="p-4 bg-dark-700 border border-dark-600 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-lg font-semibold text-dark-50">
                    {currentMembership.membershipPlan?.planName || 'N/A'}
                  </h4>
                  <Badge variant="success">Active</Badge>
                </div>
                {currentMembership.membershipPlan && (
                  <p className="text-sm text-dark-300 mb-2">
                    Price: {formatCurrency(currentMembership.membershipPlan.price)} | 
                    Duration: {currentMembership.membershipPlan.planPeriod} {currentMembership.membershipPlan.planInterval}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-dark-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Started: {currentMembership.membershipStartDate ? formatDate(currentMembership.membershipStartDate) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      Expires: {currentMembership.membershipEndDate ? formatDate(currentMembership.membershipEndDate) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-dark-700 border border-dark-600 rounded-lg text-center">
            <p className="text-dark-300">No active membership plan</p>
            <p className="text-sm text-dark-400 mt-1">Click "Add Membership Plan" to assign a membership to this customer</p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Paid */}
        <div className="card bg-gradient-to-br from-success-500 to-success-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-success-100 text-sm">Total Paid</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(totalPaid)}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-success-200" />
          </div>
        </div>

        {/* Open Bills Count */}
        <div className="card bg-gradient-to-br from-warning-500 to-warning-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-warning-100 text-sm">Open Bills</p>
              <p className="text-3xl font-bold mt-1">{openBillsCount}</p>
            </div>
            <Clock className="w-10 h-10 text-warning-200" />
          </div>
        </div>

        {/* Total Balance Due */}
        <div className="card bg-gradient-to-br from-danger-500 to-danger-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-danger-100 text-sm">Balance Due</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(balanceDue)}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-danger-200" />
          </div>
        </div>
      </div>

      {/* Actions */}
      {hasPermission('bill_create') && (
        <div className="flex justify-end">
          <button onClick={() => setShowInvoiceModal(true)} className="btn-primary flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Create Bill
          </button>
        </div>
      )}

      {/* Bills List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-dark-50">Bills and Payments</h3>
            <p className="text-sm text-dark-500">{pagination?.total || bills.length} {pagination?.total === 1 ? 'record' : 'records'}</p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-dark-500">Loading bills...</p>
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <div className="text-center py-12">
            <p className="text-danger-500">Error: {error?.message || 'Failed to load bills'}</p>
          </div>
        )}

        {/* Bills Table */}
        {!isLoading && !isError && bills.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-800">
                  <th className="table-header">Bill Date</th>
                  <th className="table-header">Bill Type</th>
                  <th className="table-header">Created By</th>
                  <th className="table-header">Net Amount</th>
                  <th className="table-header">Paid Amount</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {bills.map((bill) => {
                  // Format bill type display
                  const billTypeDisplay = bill.billType === BILL_TYPE.CUSTOM_AMOUNT && bill.customService
                    ? `${bill.billType} - ${bill.customService}`
                    : bill.billType;

                  return (
                    <tr key={bill.id} className="hover:bg-dark-700">
                      <td className="table-cell">{formatDate(bill.billDate)}</td>
                      <td className="table-cell">{billTypeDisplay}</td>
                      <td className="table-cell text-dark-300">Jomilen Dela Torre</td>
                      <td className="table-cell font-semibold text-dark-50">
                        {formatCurrency(bill.netAmount)}
                      </td>
                      <td className="table-cell font-semibold text-dark-50">
                        {formatCurrency(bill.paidAmount)}
                      </td>
                      <td className="table-cell">
                        <Badge variant={BILL_STATUS_VARIANTS[bill.billStatus] || 'warning'}>
                          {BILL_STATUS_LABELS[bill.billStatus] || bill.billStatus}
                        </Badge>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          {hasPermission('payment_create') && (
                            <button
                              onClick={() => handleOpenPayment(bill)}
                              className="p-2 text-dark-400 hover:text-success-600 hover:bg-success-50 rounded-lg transition-colors"
                              title="Add Payment"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission('bill_update') && (
                            <button
                              onClick={() => handleEdit(bill)}
                              className="p-2 text-dark-400 hover:text-primary-400 hover:bg-dark-700 rounded-lg transition-colors"
                              title="Edit Bill"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission('bill_delete') && (
                            <button
                              onClick={() => {
                                if (bill.billStatus !== BILL_STATUS.PAID) {
                                  handleDelete(bill.id);
                                }
                              }}
                              className={`p-2 rounded-lg transition-colors ${
                                bill.billStatus === BILL_STATUS.PAID
                                  ? 'text-dark-300 cursor-not-allowed'
                                  : 'text-dark-400 hover:text-danger-600 hover:bg-danger-50'
                              }`}
                              title={bill.billStatus === BILL_STATUS.PAID ? 'Cannot delete a fully paid bill' : 'Delete Bill'}
                              disabled={bill.billStatus === BILL_STATUS.PAID}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : !isLoading && !isError ? (
          <p className="text-dark-400 text-center py-8">No bills found</p>
        ) : null}

        {/* Pagination Controls */}
        {pagination && pagination.last_page > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-dark-200 pt-4">
            <div className="text-sm text-dark-400">
              Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total || 0} bills
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-dark-600 text-dark-300 hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-dark-300 px-4">
                Page {pagination.current_page || currentPage} of {pagination.last_page}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))}
                disabled={currentPage === pagination.last_page}
                className="p-2 rounded-lg border border-dark-600 text-dark-300 hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Payment Modal */}
      <Modal
        isOpen={showPaymentModal && !!paymentBill}
        onClose={() => {
          setShowPaymentModal(false);
          setPaymentBill(null);
        }}
        title="Add Payment"
        size="md"
      >
        {paymentBill && (
          <PaymentForm
            bill={paymentBill}
            member={member}
            onSubmit={handlePaymentSubmit}
            onCancel={() => {
              setShowPaymentModal(false);
              setPaymentBill(null);
            }}
          />
        )}
      </Modal>

      {/* Create/Edit Bill Modal */}
      <Modal
        isOpen={showInvoiceModal}
        onClose={() => {
          setShowInvoiceModal(false);
          setSelectedBill(null);
        }}
        title={selectedBill ? 'Edit Bill' : 'Create Bill'}
        size="lg"
      >
        <BillsForm
          customerId={member.id}
          currentMembership={currentMembership}
          onSubmit={handleCreateBill}
          onCancel={() => {
            setShowInvoiceModal(false);
            setSelectedBill(null);
          }}
          onCustomerUpdate={onCustomerUpdate}
          initialData={selectedBill}
        />
      </Modal>

      {/* Add/Update Membership Plan Modal */}
      <Modal
        isOpen={showMembershipModal}
        onClose={() => setShowMembershipModal(false)}
        title={hasActiveMembership ? 'Update Membership Plan' : 'Add Membership Plan'}
        size="md"
      >
        <MembershipPlanForm
          customerId={member.id}
          currentMembership={currentMembership}
          onSubmit={handleMembershipSubmit}
          onCancel={() => setShowMembershipModal(false)}
        />
      </Modal>
    </div>
  );
};

export default BillsTab;

