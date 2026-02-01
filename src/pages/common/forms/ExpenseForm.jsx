import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Modal } from '../../../components/common';
import { useCreateExpense, useUpdateExpense } from '../../../hooks/useExpenses';
import { getInitialExpenseFormData, mapExpenseToFormData } from '../../../models/expenseModel';
import { EXPENSE_STATUS } from '../../../constants/expenseConstants';

const ExpenseForm = ({
  selectedExpense,
  isOpen,
  onClose,
  onSuccess,
  categories = [],
}) => {
  const [formData, setFormData] = useState(getInitialExpenseFormData());
  
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();

  // Load form data when selectedExpense changes
  useEffect(() => {
    if (selectedExpense && isOpen) {
      const mappedData = mapExpenseToFormData(selectedExpense);
      setFormData(mappedData);
    } else if (!selectedExpense && isOpen) {
      setFormData(getInitialExpenseFormData());
    }
  }, [selectedExpense, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!selectedExpense;

    try {
      // Normalize all fields
      const normalizedExpenseData = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => {
          if (key === 'categoryId') return [key, value ? parseInt(value) : null];
          if (key === 'amount') return [key, value ? parseFloat(value) : null];
          if (key === 'expenseDate') return [key, value || null];
          if (typeof value === 'string') return [key, value.trim() || null];
          return [key, value ?? null];
        })
      );

      const expenseData = {
        ...normalizedExpenseData,
        status: EXPENSE_STATUS.UNPOSTED, // Always create as UNPOSTED
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: selectedExpense.id, data: expenseData });
      } else {
        await createMutation.mutateAsync(expenseData);
      }

      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={selectedExpense ? 'Edit Expense' : 'Add New Expense'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Category</label>
          <select
            className="input"
            value={formData.categoryId}
            onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
            required
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Description</label>
          <input
            type="text"
            className="input"
            placeholder="e.g., Monthly gym rent"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Amount (₱)</label>
            <input
              type="number"
              className="input"
              placeholder="0.00"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Date</label>
            <DatePicker
              selected={formData.expenseDate ? new Date(formData.expenseDate) : null}
              onChange={(date) => {
                const dateString = date ? date.toISOString().split('T')[0] : '';
                setFormData(prev => ({ ...prev, expenseDate: dateString }));
              }}
              dateFormat="yyyy-MM-dd"
              placeholderText="Click to select date"
              className="input w-full"
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
              maxDate={new Date()}
              isClearable
              onKeyDown={(e) => {
                if (e && e.key && e.key !== 'Tab' && e.key !== 'Escape') {
                  e.preventDefault();
                }
              }}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Saving...'
              : selectedExpense
              ? 'Save Changes'
              : 'Add Expense'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ExpenseForm;
