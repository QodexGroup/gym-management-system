import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Modal } from '../../components/common';
import { useCreateExpense, useUpdateExpense } from '../../shared/hooks/useExpenses';
import { getInitialExpenseFormData, mapExpenseToFormData } from '../../shared/models/expenseModel';
import { EXPENSE_STATUS } from '../../shared/constants/expenseConstants';
import { Toast } from '../../shared/utils/alert';
import { useAuth } from '../../shared/context/AuthContext';
import { uploadExpenseReceipt, getFileUrl } from '../../shared/services/storageService';
import { useInvalidateStorageUsage } from '../../shared/hooks/useStorage';

const ExpenseForm = ({
  selectedExpense,
  isOpen,
  onClose,
  onSuccess,
  categories = [],
}) => {
  const [formData, setFormData] = useState(getInitialExpenseFormData());

  const { account, user } = useAuth();
  const accountId = account?.id ?? user?.accountId;
  const [receiptFile, setReceiptFile] = useState(null);
  const [existingReceiptUrl, setExistingReceiptUrl] = useState(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const invalidateStorageUsage = useInvalidateStorageUsage();

  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();

  // Load form data when selectedExpense changes
  useEffect(() => {
    if (selectedExpense && isOpen) {
      const mappedData = mapExpenseToFormData(selectedExpense);
      setFormData(mappedData);
      setExistingReceiptUrl(selectedExpense.receiptUrl || null);
      setReceiptFile(null);
    } else if (!selectedExpense && isOpen) {
      setFormData(getInitialExpenseFormData());
      setExistingReceiptUrl(null);
      setReceiptFile(null);
    }
  }, [selectedExpense, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!selectedExpense;

    if (!formData.expenseDate) {
      Toast.error('Please select a date');
      return;
    }

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

      // Upload a newly selected receipt first (blocks on storage quota at presign).
      let receiptUrl = existingReceiptUrl;
      let receiptSizeKb = 0;
      if (receiptFile) {
        if (!accountId) {
          Toast.error('Account not loaded — cannot upload receipt.');
          return;
        }
        setUploadingReceipt(true);
        try {
          const res = await uploadExpenseReceipt(receiptFile, accountId);
          receiptUrl = res.fileUrl;
          receiptSizeKb = res.fileSize;
        } catch (uploadErr) {
          Toast.error(uploadErr.message || 'Failed to upload receipt');
          return;
        } finally {
          setUploadingReceipt(false);
        }
      }

      const expenseData = {
        ...normalizedExpenseData,
        status: EXPENSE_STATUS.UNPOSTED, // Always create as UNPOSTED
        receiptUrl: receiptUrl ?? null,
        receiptSizeKb,
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: selectedExpense.id, data: expenseData });
      } else {
        await createMutation.mutateAsync(expenseData);
      }

      invalidateStorageUsage();
      onSuccess?.();
      onClose?.();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error saving expense:', error);
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

        <div>
          <label className="label">Receipt (optional)</label>
          {existingReceiptUrl && !receiptFile && (
            <div className="flex items-center justify-between mb-2 text-sm">
              <a
                href={getFileUrl(existingReceiptUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 underline"
              >
                View current receipt
              </a>
              <button
                type="button"
                className="text-red-400 hover:text-red-300"
                onClick={() => setExistingReceiptUrl(null)}
              >
                Remove
              </button>
            </div>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="input"
            onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
            disabled={uploadingReceipt || isSubmitting}
          />
          {receiptFile && <p className="text-xs text-dark-400 mt-1">{receiptFile.name}</p>}
        </div>

        <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 btn-secondary"
            disabled={isSubmitting || uploadingReceipt}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 btn-primary"
            disabled={isSubmitting || uploadingReceipt}
          >
            {uploadingReceipt
              ? 'Uploading receipt...'
              : isSubmitting
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
