import { useState } from 'react';
import { CheckCircle, Clock, AlertCircle, Receipt, Plus, CreditCard, Banknote, Send } from 'lucide-react';
import { Badge, Modal, Avatar } from '../../../components/common';
import { mockMembershipPlans } from '../../../data/mockData';
import { formatCurrency } from '../../../utils/formatters';

const BillsTab = ({ member, payments }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const totalPaid = payments.filter((p) => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = payments.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-success-500 to-success-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-success-100 text-sm">Total Paid</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(totalPaid)}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-success-200" />
          </div>
        </div>
        <div className="card bg-gradient-to-br from-warning-500 to-warning-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-warning-100 text-sm">Pending</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(pendingAmount)}</p>
            </div>
            <Clock className="w-10 h-10 text-warning-200" />
          </div>
        </div>
        <div className="card bg-gradient-to-br from-danger-500 to-danger-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-danger-100 text-sm">Balance Due</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(member.balance)}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-danger-200" />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => setShowInvoiceModal(true)} className="btn-secondary flex items-center gap-2">
          <Receipt className="w-4 h-4" />
          Generate Invoice
        </button>
        <button onClick={() => setShowPaymentModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      {/* Payment History */}
      <div className="card">
        <h3 className="text-lg font-semibold text-dark-800 mb-4">Payment History</h3>
        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-50">
                  <th className="table-header">Date</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Method</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-dark-50">
                    <td className="table-cell">{payment.date}</td>
                    <td className="table-cell">{payment.type}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        {payment.method === 'Credit Card' && <CreditCard className="w-4 h-4 text-dark-400" />}
                        {payment.method === 'Cash' && <Banknote className="w-4 h-4 text-dark-400" />}
                        {payment.method}
                      </div>
                    </td>
                    <td className="table-cell font-semibold text-dark-800">{formatCurrency(payment.amount)}</td>
                    <td className="table-cell">
                      <Badge variant={payment.status === 'completed' ? 'success' : 'warning'}>
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                          <Receipt className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-dark-400 text-center py-8">No payment history</p>
        )}
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Record Payment"
        size="md"
      >
        <form className="space-y-4">
          <div className="p-4 bg-dark-50 rounded-xl flex items-center gap-4">
            <Avatar src={member.avatar} name={member.name} size="md" />
            <div>
              <p className="font-semibold text-dark-800">{member.name}</p>
              <p className="text-sm text-dark-500">{member.membership}</p>
            </div>
          </div>
          <div>
            <label className="label">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">₱</span>
              <input type="number" className="input pl-8" placeholder="0.00" defaultValue={member.balance > 0 ? member.balance : ''} />
            </div>
          </div>
          <div>
            <label className="label">Payment Type</label>
            <select className="input">
              <option>Membership Renewal</option>
              <option>Monthly Subscription</option>
              <option>PT Package</option>
              <option>Outstanding Balance</option>
            </select>
          </div>
          <div>
            <label className="label">Payment Method</label>
            <div className="grid grid-cols-3 gap-3">
              <label className="flex items-center justify-center gap-2 p-3 border border-dark-200 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors [&:has(input:checked)]:border-primary-500 [&:has(input:checked)]:bg-primary-50">
                <input type="radio" name="method" value="cash" className="hidden" />
                <Banknote className="w-5 h-5" />
                <span>Cash</span>
              </label>
              <label className="flex items-center justify-center gap-2 p-3 border border-dark-200 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors [&:has(input:checked)]:border-primary-500 [&:has(input:checked)]:bg-primary-50">
                <input type="radio" name="method" value="card" className="hidden" defaultChecked />
                <CreditCard className="w-5 h-5" />
                <span>Card</span>
              </label>
              <label className="flex items-center justify-center gap-2 p-3 border border-dark-200 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors [&:has(input:checked)]:border-primary-500 [&:has(input:checked)]:bg-primary-50">
                <input type="radio" name="method" value="transfer" className="hidden" />
                <Receipt className="w-5 h-5" />
                <span>Transfer</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-success">
              Record Payment
            </button>
          </div>
        </form>
      </Modal>

      {/* Generate Invoice Modal */}
      <Modal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        title="Generate Invoice"
        size="md"
      >
        <form className="space-y-4">
          <div>
            <label className="label">Invoice For</label>
            <select className="input">
              <option>Membership Renewal</option>
              <option>Personal Training Package</option>
              <option>Outstanding Balance</option>
              <option>Custom Amount</option>
            </select>
          </div>
          <div>
            <label className="label">Membership Plan</label>
            <select className="input">
              {mockMembershipPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - {formatCurrency(plan.price)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Discount (Optional)</label>
            <div className="relative">
              <input type="number" className="input pr-10" placeholder="0" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400">%</span>
            </div>
          </div>
          <div>
            <label className="label">Due Date</label>
            <input type="date" className="input" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="sendEmail" className="w-4 h-4" />
            <label htmlFor="sendEmail" className="text-sm text-dark-600">Send invoice via email</label>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowInvoiceModal(false)} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary">
              Generate Invoice
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BillsTab;

