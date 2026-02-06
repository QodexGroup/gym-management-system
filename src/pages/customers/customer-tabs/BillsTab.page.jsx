import { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Clock, AlertCircle, Receipt, UserCheck, Plus, Calendar, X, User } from 'lucide-react';
import DataTable from '../../../components/DataTable';
import { Pagination, Modal, Badge } from '../../../components/common';
import StatsCards from '../../../components/common/StatsCards';
import BillsForm from '../customer-forms/BillsForm';
import PaymentForm from '../customer-forms/PaymentForm';
import MembershipPlanForm from '../customer-forms/MembershipPlanForm';
import PtPackageAssignmentForm from '../customer-forms/PtPackageAssignmentForm';
import { useCustomerBills, useCreateCustomerBill, useUpdateCustomerBill, useDeleteCustomerBill, customerBillKeys } from '../../../hooks/useCustomerBills';
import { useCreateCustomerPayment } from '../../../hooks/useCustomerPayments';
import { useCreateOrUpdateCustomerMembership } from '../../../hooks/useCustomerMembership';
import { useCustomerPtPackages, useAssignPtPackage, useCancelPtPackage } from '../../../hooks/useCustomerPtPackages';
import { BILL_STATUS } from '../../../constants/billConstants';
import { CUSTOMER_MEMBERSHIP_STATUS } from '../../../constants/customerMembership';
import { CUSTOMER_PT_PACKAGE_STATUS, CUSTOMER_PT_PACKAGE_STATUS_LABELS, CUSTOMER_PT_PACKAGE_STATUS_VARIANTS } from '../../../constants/ptConstants';
import { usePermissions } from '../../../hooks/usePermissions';
import { Alert, Toast } from '../../../utils/alert';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { billsTableColumns } from '../tables/billsTable.config';

const BillsTab = ({ member, onCustomerUpdate }) => {
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [paymentBill, setPaymentBill] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [showPtPackageModal, setShowPtPackageModal] = useState(false);

  // React Query hooks
  const { data, isLoading, refetch: refetchBills } = useCustomerBills(member?.id, { page: currentPage, pagelimit: 50 });
  const createBillMutation = useCreateCustomerBill();
  const updateBillMutation = useUpdateCustomerBill();
  const deleteBillMutation = useDeleteCustomerBill();
  const createPaymentMutation = useCreateCustomerPayment();
  const membershipMutation = useCreateOrUpdateCustomerMembership();
  const { data: customerPtPackagesData, isLoading: loadingPtPackages } = useCustomerPtPackages(member?.id, {
    relations: 'ptPackage,coach',
  });
  const assignPtPackageMutation = useAssignPtPackage();
  const cancelPtPackageMutation = useCancelPtPackage();

  const bills = data?.data || [];
  const pagination = data?.pagination;

  const currentMembership = member?.currentMembership;
  const hasActiveMembership = currentMembership?.status === CUSTOMER_MEMBERSHIP_STATUS.ACTIVE;
  
  // The service returns data.data directly, so customerPtPackagesData is already the array
  // Backend already filters for active packages
  const customerPtPackages = customerPtPackagesData || [];

  /* ---------------- Stats ---------------- */
  const stats = useMemo(() => {
    const totalPaid = bills.filter(b => b?.billStatus === BILL_STATUS.PAID)
                      .reduce((sum, b) => sum + (parseFloat(b?.paidAmount) || 0), 0);
    const openBills = bills.filter(b => b?.billStatus === BILL_STATUS.ACTIVE || b?.billStatus === BILL_STATUS.PARTIAL).length;
    const balanceDue = bills.filter(b => b?.billStatus !== BILL_STATUS.PAID && b?.billStatus !== BILL_STATUS.VOIDED)
                       .reduce((sum, b) => sum + (parseFloat(b?.netAmount) || 0) - (parseFloat(b?.paidAmount) || 0), 0);

    return [
      {
        title: 'Total Paid',
        value: formatCurrency(totalPaid),
        color: 'success',
        icon: CheckCircle
      },
      {
        title: 'Open Bills',
        value: openBills,
        color: 'warning',
        icon: Clock
      },
      {
        title: 'Balance Due',
        value: formatCurrency(balanceDue),
        color: 'danger',
        icon: AlertCircle
      },
    ];
  }, [bills]);

  /* ---------------- Handlers ---------------- */
  const handleEdit = useCallback((bill) => {
    setSelectedBill(bill);
    setShowBillModal(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    const result = await Alert.confirmDelete();
    if (!result.isConfirmed) return;

    try {
      await deleteBillMutation.mutateAsync({ id, customerId: member?.id });
      Toast.success('Bill deleted successfully');
      onCustomerUpdate?.();
    } catch (error) {
      console.error(error);
      Toast.error(error?.message || 'Failed to delete bill');
    }
  }, [deleteBillMutation, member?.id, onCustomerUpdate]);

  const handleOpenPayment = useCallback((bill) => {
    setPaymentBill(bill);
    setShowPaymentModal(true);
  }, []);

  const handlePaymentSubmit = useCallback(async (paymentData) => {
    if (!paymentBill) return;
    try {
      await createPaymentMutation.mutateAsync({
        billId: paymentBill.id,
        customerId: member.id,
        paymentData
      });
      // Invalidate queries to trigger automatic refetch (removes duplicate queries)
      queryClient.invalidateQueries({ queryKey: customerBillKeys.byCustomer(member.id) });
      setShowPaymentModal(false);
      setPaymentBill(null);
      onCustomerUpdate?.();
    } catch (error) {
      console.error(error);
    }
  }, [paymentBill, createPaymentMutation, member.id, onCustomerUpdate, queryClient]);

  const handleBillSubmit = useCallback(async (billData) => {
    try {
      if (selectedBill) {
        await updateBillMutation.mutateAsync({ id: selectedBill.id, data: billData });
      } else {
        await createBillMutation.mutateAsync(billData);
      }
      setShowBillModal(false);
      setSelectedBill(null);
      onCustomerUpdate?.();
    } catch (error) {
      console.error(error);
    }
  }, [selectedBill, createBillMutation, updateBillMutation, onCustomerUpdate]);

  const handleMembershipSubmit = useCallback(async (membershipData) => {
    try {
      await membershipMutation.mutateAsync({ customerId: member.id, membershipData });
      setShowMembershipModal(false);
      onCustomerUpdate?.();
    } catch (error) {
      console.error(error);
    }
  }, [membershipMutation, member.id, onCustomerUpdate]);

  const handleOpenPtPackageModal = useCallback(() => {
    setShowPtPackageModal(true);
  }, []);

  const handleAssignPtPackage = useCallback(async (packageData) => {
    try {
      await assignPtPackageMutation.mutateAsync({
        customerId: member.id,
        packageData,
      });
      setShowPtPackageModal(false);
      // Invalidate queries to trigger automatic refetch (removes duplicate queries)
      queryClient.invalidateQueries({ queryKey: customerBillKeys.byCustomer(member.id) });
      onCustomerUpdate?.();
    } catch (error) {
      console.error(error);
    }
  }, [assignPtPackageMutation, member.id, onCustomerUpdate, queryClient]);

  const handleCancelPtPackage = useCallback(async (packageId) => {
    const result = await Alert.confirm({
      title: 'Cancel PT Package?',
      text: 'Are you sure you want to cancel this PT package?',
      html: `<p>This action will void the bill and the PT package will be removed from the customer.</p>`,
      icon: 'warning',
      confirmButtonText: 'Yes, cancel it',
      cancelButtonText: 'No',
    });

    if (!result.isConfirmed) return;

    try {
      await cancelPtPackageMutation.mutateAsync({
        customerId: member.id,
        packageId,
      });
      // Invalidate queries to trigger automatic refetch (removes duplicate queries)
      queryClient.invalidateQueries({ queryKey: customerBillKeys.byCustomer(member.id) });
      onCustomerUpdate?.();
    } catch (error) {
      console.error(error);
    }
  }, [cancelPtPackageMutation, member.id, onCustomerUpdate, queryClient]);

  /* ---------------- Columns ---------------- */
  const columns = useMemo(() => billsTableColumns({
    canEdit: hasPermission('bill_update'),
    canDelete: hasPermission('bill_delete'),
    canAddPayment: hasPermission('payment_create'),
    onEdit: handleEdit,
    onDelete: handleDelete,
    onAddPayment: handleOpenPayment
  }), [hasPermission, handleEdit, handleDelete, handleOpenPayment]);

  return (
    <div className="space-y-6">
      {/* Plans Section - Compact Grid */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-dark-50">Plans</h3>
          <div className="flex items-center gap-2">
            {hasPermission('membership_plan_update') && (
              <button 
                onClick={() => setShowMembershipModal(true)} 
                className={`flex items-center gap-2 text-sm py-1.5 px-3 ${hasActiveMembership ? 'btn-primary' : 'btn-success'}`}
              >
                <UserCheck className="w-4 h-4" />
                {hasActiveMembership ? 'Update' : 'Add'} Membership
              </button>
            )}
            <button
              onClick={handleOpenPtPackageModal}
              className="btn-primary flex items-center gap-2 text-sm py-1.5 px-3"
            >
              <Plus className="w-4 h-4" />
              Assign PT Package
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Membership Plan - Compact */}
          <div className="bg-dark-700 border border-dark-600 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-dark-50">Membership Plan</h4>
                {hasActiveMembership && <Badge variant="success" size="sm">Active</Badge>}
              </div>
            </div>
            {hasActiveMembership ? (
              <div className="space-y-1.5 text-xs text-dark-300">
                <div className="font-medium text-dark-50">
                  {currentMembership.membershipPlan?.planName || 'N/A'}
                </div>
                {currentMembership.membershipPlan && (
                  <div>
                    {formatCurrency(currentMembership.membershipPlan.price)} • {currentMembership.membershipPlan.planPeriod} {currentMembership.membershipPlan.planInterval}
                  </div>
                )}
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{currentMembership.membershipStartDate ? formatDate(currentMembership.membershipStartDate) : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{currentMembership.membershipEndDate ? formatDate(currentMembership.membershipEndDate) : 'N/A'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-dark-400">No active membership</p>
            )}
          </div>

          {/* Active PT Packages Summary - Compact */}
          <div className="bg-dark-700 border border-dark-600 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-dark-50">PT Packages</h4>
              {customerPtPackages.length > 0 && (
                <Badge variant="success" size="sm">{customerPtPackages.length} Active</Badge>
              )}
            </div>
            {customerPtPackages.length > 0 ? (
              <div className="space-y-2">
                {customerPtPackages.slice(0, 2).map((customerPackage) => {
                  const ptPackage = customerPackage.ptPackage;
                  const sessionsRemaining = customerPackage.numberOfSessionsRemaining || customerPackage.classesRemaining || 0;
                  const sessionsTotal = ptPackage?.numberOfSessions || customerPackage.classesTotal || 0;
                  const progressPercentage = sessionsTotal > 0 ? ((sessionsTotal - sessionsRemaining) / sessionsTotal) * 100 : 0;

                  return (
                    <div key={customerPackage.id} className="border-b border-dark-600 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-dark-50 truncate flex-1">
                          {ptPackage?.packageName || 'Unknown'}
                        </span>
                        <button
                          onClick={() => handleCancelPtPackage(customerPackage.id)}
                          className="p-1 text-dark-400 hover:text-danger-600 rounded transition-colors ml-2"
                          title="Cancel"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-dark-400">
                        <span>{sessionsRemaining}/{sessionsTotal} sessions</span>
                        <span>{formatCurrency(ptPackage?.price || 0)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {customerPackage.coach?.firstname} {customerPackage.coach?.lastname}
                        </span>
                      </div>  
                      <div className="w-full bg-dark-600 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-primary-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {customerPtPackages.length > 2 && (
                  <p className="text-xs text-dark-400 pt-1">+{customerPtPackages.length - 2} more package(s)</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-dark-400">No active packages</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} size="lg" iconPosition="right" iconColor="light" columns={3} />

      {/* Create Bill Button */}
      {hasPermission('bill_create') && (
        <div className="flex justify-end">
          <button
            onClick={() => { setSelectedBill(null); setShowBillModal(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Receipt className="w-4 h-4" />
            Create Bill
          </button>
        </div>
      )}

      {/* Bills Table */}
      <div className="card">
        <DataTable columns={columns} data={bills} loading={isLoading} />
      </div>

      {/* Pagination */}
      {pagination && pagination.lastPage > 1 && (
        <Pagination
          currentPage={currentPage}
          lastPage={pagination.lastPage}
          from={pagination.from}
          to={pagination.to}
          total={pagination.total}
          onPrev={() => setCurrentPage(p => Math.max(p - 1, 1))}
          onNext={() => setCurrentPage(p => Math.min(p + 1, pagination.lastPage))}
        />
      )}

      {/* Modals */}
      <Modal
        isOpen={showBillModal}
        onClose={() => { setShowBillModal(false); setSelectedBill(null); }}
        title={selectedBill ? 'Edit Bill' : 'Create Bill'}
        size="lg"
      >
        <BillsForm
          customerId={member.id}
          initialData={selectedBill}
          currentMembership={currentMembership}
          onSubmit={handleBillSubmit}
          onCancel={() => { setShowBillModal(false); setSelectedBill(null); }}
          onCustomerUpdate={onCustomerUpdate}
        />
      </Modal>

      <Modal
        isOpen={showPaymentModal && !!paymentBill}
        onClose={() => { setShowPaymentModal(false); setPaymentBill(null); }}
        title="Add Payment"
        size="md"
      >
        {paymentBill && (
          <PaymentForm
            bill={paymentBill}
            member={member}
            onSubmit={handlePaymentSubmit}
            onCancel={() => { setShowPaymentModal(false); setPaymentBill(null); }}
          />
        )}
      </Modal>

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

      <Modal
        isOpen={showPtPackageModal}
        onClose={() => setShowPtPackageModal(false)}
        title="Assign PT Package"
        size="md"
      >
        <PtPackageAssignmentForm
          customerId={member.id}
          onSubmit={handleAssignPtPackage}
          onCancel={() => setShowPtPackageModal(false)}
        />
      </Modal>
    </div>
  );
};

export default BillsTab;
