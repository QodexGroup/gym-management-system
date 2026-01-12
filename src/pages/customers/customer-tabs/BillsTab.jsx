import { useState } from 'react';
import { CheckCircle, Clock, AlertCircle, Receipt, Plus, Edit, Trash2, Banknote, CreditCard, Calendar, UserCheck, ChevronLeft, ChevronRight, Dumbbell, X, UserCog } from 'lucide-react';
import { Badge, Modal, Avatar } from '../../../components/common';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import BillsForm from '../customer-forms/BillsForm';
import MembershipPlanForm from '../customer-forms/MembershipPlanForm';
import PaymentForm from '../customer-forms/PaymentForm';
import { useCustomerBills, useCreateCustomerBill, useUpdateCustomerBill, useDeleteCustomerBill } from '../../../hooks/useCustomerBills';
import { useCreateOrUpdateCustomerMembership } from '../../../hooks/useCustomerMembership';
import { useCreateCustomerPayment } from '../../../hooks/useCustomerPayments';
import { BILL_STATUS, BILL_STATUS_LABELS, BILL_STATUS_VARIANTS, BILL_TYPE } from '../../../constants/billConstants';
import { Alert, Toast } from '../../../utils/alert';
import { CUSTOMER_MEMBERSHIP_STATUS } from '../../../constants/customerMembership';
import { usePermissions } from '../../../hooks/usePermissions';
import { mockCustomerPtPackages, mockPtPackages, mockTrainers } from '../../../data/mockData';
import { CUSTOMER_PT_PACKAGE_STATUS, CUSTOMER_PT_PACKAGE_STATUS_LABELS, CUSTOMER_PT_PACKAGE_STATUS_VARIANTS } from '../../../constants/ptConstants';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const BillsTab = ({ member, onCustomerUpdate }) => {
  const { hasPermission } = usePermissions();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [showPtPackageModal, setShowPtPackageModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentBill, setPaymentBill] = useState(null);
  const [ptPackageFormData, setPtPackageFormData] = useState({
    ptPackageId: '',
    trainerId: '',
    startDate: '',
  });
  
  // PT Packages state (using mock data)
  const [customerPackagesList, setCustomerPackagesList] = useState(
    mockCustomerPtPackages.filter(pkg => pkg.customerId === member?.id)
  );
  const packages = mockPtPackages;
  const coaches = mockTrainers.map(t => ({
    id: t.id,
    firstname: t.name.split(' ')[0],
    lastname: t.name.split(' ').slice(1).join(' '),
    email: t.email,
  }));
  
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

  const handleOpenPtPackageModal = () => {
    setPtPackageFormData({
      ptPackageId: '',
      trainerId: '',
      startDate: '',
    });
    setShowPtPackageModal(true);
  };

  const handleClosePtPackageModal = () => {
    setShowPtPackageModal(false);
    setPtPackageFormData({
      ptPackageId: '',
      trainerId: '',
      startDate: '',
    });
  };

  const handleAssignPtPackage = async (e) => {
    e.preventDefault();

    const ptPackage = packages.find(p => p.id === parseInt(ptPackageFormData.ptPackageId));
    const trainer = coaches.find(c => c.id === parseInt(ptPackageFormData.trainerId));

    // Create PT Package assignment
    const packageData = {
      id: customerPackagesList.length + 1,
      customerId: member.id,
      ptPackageId: parseInt(ptPackageFormData.ptPackageId),
      trainerId: parseInt(ptPackageFormData.trainerId) || null,
      startDate: ptPackageFormData.startDate,
      classesTotal: ptPackage?.numberOfSessions || 0,
      classesCompleted: 0,
      classesRemaining: ptPackage?.numberOfSessions || 0,
      status: 'active',
      ptPackage: ptPackage,
      trainer: trainer,
    };

    setCustomerPackagesList(prev => [...prev, packageData]);

    // Automatically create a bill for the PT package
    try {
      await createBillMutation.mutateAsync({
        customerId: member.id,
        billType: BILL_TYPE.CUSTOM_AMOUNT,
        billDate: ptPackageFormData.startDate,
        netAmount: ptPackage?.price || 0,
        paidAmount: 0,
        billStatus: BILL_STATUS.ACTIVE,
        customService: `PT Package: ${ptPackage?.packageName || 'PT Package'}`,
        description: `PT Package: ${ptPackage?.packageName} - ${ptPackage?.numberOfSessions} sessions`,
      });
      
      Toast.success('PT Package assigned and bill created successfully');
      
      // Trigger customer update callback
      if (onCustomerUpdate) {
        setTimeout(() => {
          onCustomerUpdate();
        }, 500);
      }
    } catch (error) {
      Toast.success('PT Package assigned successfully');
      // Bill creation failed but package was assigned
    }

    handleClosePtPackageModal();
  };

  const handleCancelPtPackage = async (packageId) => {
    const result = await Alert.confirm({
      title: 'Cancel PT Package?',
      text: 'Are you sure you want to cancel this PT package?',
      icon: 'warning',
      confirmButtonText: 'Yes, cancel it',
      cancelButtonText: 'No',
    });

    if (!result.isConfirmed) {
      return;
    }

    setCustomerPackagesList(prev => prev.filter(pkg => pkg.id !== packageId));
    Toast.success('PT Package cancelled successfully');
  };

  // Separate active and completed PT packages
  const activePtPackages = customerPackagesList.filter(
    (pkg) => pkg.status === CUSTOMER_PT_PACKAGE_STATUS.ACTIVE
  );
  const completedPtPackages = customerPackagesList.filter(
    (pkg) => pkg.status === CUSTOMER_PT_PACKAGE_STATUS.COMPLETED
  );

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
              {activePtPackages.length > 0 && (
                <Badge variant="success" size="sm">{activePtPackages.length} Active</Badge>
              )}
            </div>
            {activePtPackages.length > 0 ? (
              <div className="space-y-2">
                {activePtPackages.slice(0, 2).map((customerPackage) => {
                  const ptPackage = customerPackage.ptPackage;
                  const sessionsRemaining = customerPackage.classesRemaining || 0;
                  const sessionsTotal = customerPackage.classesTotal || ptPackage?.numberOfSessions || 0;
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
                        <span>•</span>
                        <span>{formatCurrency(ptPackage?.price || 0)}</span>
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
                {activePtPackages.length > 2 && (
                  <p className="text-xs text-dark-400 pt-1">+{activePtPackages.length - 2} more package(s)</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-dark-400">No active packages</p>
            )}
          </div>
        </div>
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

      {/* Assign PT Package Modal */}
      <Modal
        isOpen={showPtPackageModal}
        onClose={handleClosePtPackageModal}
        title="Assign PT Package"
        size="md"
      >
        <form onSubmit={handleAssignPtPackage} className="space-y-4">
          <div>
            <label className="label">PT Package *</label>
            <select
              className="input"
              value={ptPackageFormData.ptPackageId}
              onChange={(e) => setPtPackageFormData({ ...ptPackageFormData, ptPackageId: e.target.value })}
              required
            >
              <option value="">Select PT package</option>
              {packages
                .filter((pkg) => pkg.status === 'active')
                .map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.packageName} - {formatCurrency(pkg.price)} ({pkg.numberOfSessions} sessions)
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="label">Trainer (Optional)</label>
            <select
              className="input"
              value={ptPackageFormData.trainerId}
              onChange={(e) => setPtPackageFormData({ ...ptPackageFormData, trainerId: e.target.value })}
            >
              <option value="">No trainer assigned</option>
              {coaches.map((coach) => (
                <option key={coach.id} value={coach.id}>
                  {coach.firstname} {coach.lastname}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Start Date *</label>
            <DatePicker
              selected={ptPackageFormData.startDate ? new Date(ptPackageFormData.startDate) : null}
              onChange={(date) => {
                const dateString = date ? date.toISOString().split('T')[0] : '';
                setPtPackageFormData({ ...ptPackageFormData, startDate: dateString });
              }}
              dateFormat="yyyy-MM-dd"
              placeholderText="Select start date"
              className="input w-full"
              minDate={new Date()}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClosePtPackageModal}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
            >
              Assign Package
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BillsTab;

