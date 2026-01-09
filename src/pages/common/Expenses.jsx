import { useState, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Layout from '../../components/layout/Layout';
import { Badge, Modal } from '../../components/common';
import {
  Plus,
  Search,
  Download,
  Edit,
  Trash,
  XCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  DollarSign,
  // Receipt,
  // Upload,
} from 'lucide-react';
import { Alert } from '../../utils/alert';
import { EXPENSE_STATUS, EXPENSE_STATUS_LABELS, EXPENSE_STATUS_VARIANTS } from '../../constants/expenseConstants';
import { 
  useExpenses, 
  useExpenseCategories, 
  useCreateExpense, 
  useUpdateExpense, 
  usePostExpense,
  useDeleteExpense 
} from '../../hooks/useExpenses';
import { formatDate, formatDateForInput, formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { isAdminRole } from '../../constants/userRoles';
import { usePermissions } from '../../hooks/usePermissions';

const Expenses = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const isAdmin = isAdminRole(user?.role);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    categoryId: '',
    description: '',
    amount: '',
    expenseDate: '',
  });

  // Build query options
  const expenseOptions = useMemo(() => {
    const filters = {};
    if (searchQuery) {
      filters.description = searchQuery;
    }
    if (filterCategory !== 'all') {
      filters.category = filterCategory;
    }
    
    return {
      page: currentPage,
      pagelimit: 10,
      relations: 'category',
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    };
  }, [currentPage, searchQuery, filterCategory]);

  // Reset to page 1 when search or filter changes
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (value) => {
    setFilterCategory(value);
    setCurrentPage(1);
  };

  // React Query hooks
  const { data: expensesData, isLoading: loading } = useExpenses(expenseOptions);
  const { data: categoriesData } = useExpenseCategories({});
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const postMutation = usePostExpense();
  const deleteMutation = useDeleteExpense();

  const isSubmitting = createMutation.isLoading || updateMutation.isLoading;

  // Extract paginated data
  const expenses = expensesData?.data || [];
  const pagination = expensesData ? {
    current_page: expensesData.current_page,
    last_page: expensesData.last_page,
    per_page: expensesData.per_page,
    total: expensesData.total,
    from: expensesData.from,
    to: expensesData.to,
  } : null;
  const categories = categoriesData?.data || [];

  // Transform API data to component format
  const transformedExpenses = useMemo(() => {
    return expenses.map((apiExpense) => {
      // Find category name from API response first, then from categories list
      let categoryName = apiExpense.category?.name;
      if (!categoryName && apiExpense.categoryId && categories.length > 0) {
        const foundCategory = categories.find(cat => cat.id === apiExpense.categoryId);
        categoryName = foundCategory?.name;
      }
      // If still no category name found, show Unknown
      if (!categoryName) {
        categoryName = 'Unknown';
      }

      return {
        id: apiExpense.id,
        category: categoryName,
        categoryId: apiExpense.categoryId,
        description: apiExpense.description,
        amount: parseFloat(apiExpense.amount),
        date: apiExpense.expenseDate,
        formattedDate: formatDate(apiExpense.expenseDate),
        status: apiExpense.status, // POSTED or UNPOSTED
        receipt: false, // Receipt functionality not implemented yet
      };
    });
  }, [expenses, categories]);

  // No need for client-side filtering since we're using server-side filters
  const filteredExpenses = transformedExpenses;

  const handleOpenModal = (expense = null) => {
    if (expense) {
      // Edit mode - check if expense is POSTED
      if (expense.status === EXPENSE_STATUS.POSTED) {
        Alert.warning('Cannot Edit', 'Posted expenses cannot be edited.');
        return;
      }
      setSelectedExpense(expense);
      setFormData({
        categoryId: expense.categoryId?.toString() || '',
        description: expense.description,
        amount: expense.amount.toString(),
        expenseDate: formatDateForInput(expense.date),
      });
    } else {
      // Create mode
      setSelectedExpense(null);
      setFormData({
        categoryId: '',
        description: '',
        amount: '',
        expenseDate: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedExpense(null);
    setFormData({
      categoryId: '',
      description: '',
      amount: '',
      expenseDate: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const expenseData = {
      categoryId: parseInt(formData.categoryId),
      description: formData.description,
      amount: parseFloat(formData.amount),
      expenseDate: formData.expenseDate,
      status: EXPENSE_STATUS.UNPOSTED, // Always create as UNPOSTED
    };

    try {
      if (selectedExpense) {
        // Update existing expense
        await updateMutation.mutateAsync({ id: selectedExpense.id, data: expenseData });
      } else {
        // Create new expense
        await createMutation.mutateAsync(expenseData);
      }

      handleCloseModal();
    } catch (error) {
      // Error already handled in mutation hooks
      console.error('Error saving expense:', error);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    const result = await Alert.confirmDelete();

    if (!result.isConfirmed) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(expenseId);
      Alert.success('Deleted!', 'Expense has been deleted.', {
        timer: 2000,
        showConfirmButton: false
      });
      // React Query automatically invalidates and refetches
    } catch (error) {
      // Error already handled in mutation hook
      console.error('Error deleting expense:', error);
    }
  };

  const handlePostExpense = async (expenseId) => {
    const result = await Alert.confirm({
      title: 'Post Expense?',
      text: 'Are you sure you want to post this expense? This action cannot be undone.',
      icon: 'question',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, post it!',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await postMutation.mutateAsync(expenseId);
    } catch (error) {
      // Error already handled in mutation hook
      console.error('Error posting expense:', error);
    }
  };

  const handleVoidExpense = async (expenseId) => {
    const result = await Alert.confirm({
      title: 'Void Expense?',
      text: 'Are you sure you want to void this posted expense? This action cannot be undone.',
      icon: 'warning',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, void it!',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(expenseId);
      Alert.success('Voided!', 'Expense has been voided.', {
        timer: 2000,
        showConfirmButton: false
      });
      // React Query automatically invalidates and refetches
    } catch (error) {
      // Error already handled in mutation hook
      console.error('Error voiding expense:', error);
    }
  };

  // TODO: Uncomment when receipt storage is implemented
  // const handleUploadReceipt = (expenseId) => {
  //   // Handle receipt upload logic here
  //   console.log('Upload receipt for expense:', expenseId);
  // };

  // Check if user can view expenses
  const canViewExpenses = hasPermission('expense_view');

  if (loading) {
    return (
      <Layout title="Expense List" subtitle="Track and manage gym expenses">
        <div className="flex items-center justify-center h-64">
          <p className="text-dark-500">Loading expenses...</p>
        </div>
      </Layout>
    );
  }

  // If user doesn't have view permission, show message
  if (!canViewExpenses) {
    return (
      <Layout title="Expense List" subtitle="Track and manage gym expenses">
        <div className="card">
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-dark-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-dark-50 mb-2">Access Restricted</h3>
            <p className="text-dark-400 mb-1">
              You have no permission to view expenses.
            </p>
            <p className="text-sm text-dark-500">
              Please contact admin for the <strong>View Expense</strong> permission.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Expense List" subtitle="Track and manage gym expenses">
      {/* Expense Table */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-dark-600 text-dark-50 placeholder-dark-400 rounded-lg focus:bg-dark-600 focus:border-primary-500 outline-none transition-colors"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => handleCategoryFilterChange(e.target.value)}
              className="px-4 py-2.5 bg-dark-700 border border-dark-600 text-dark-50 rounded-lg focus:border-primary-500 outline-none"
            >
              <option value="all" className="bg-dark-700 text-dark-50">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name} className="bg-dark-700 text-dark-50">
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            {hasPermission('expense_create') && (
              <button
                onClick={() => handleOpenModal()}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Expense
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-50">
                <th className="table-header">Date</th>
                <th className="table-header">Category</th>
                <th className="table-header">Description</th>
                <th className="table-header">Amount</th>
                <th className="table-header">Status</th>
                {/* TODO: Uncomment when receipt storage is implemented */}
                {/* <th className="table-header">Receipt</th> */}
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {filteredExpenses.map((expense) => {
                const isPosted = expense.status === EXPENSE_STATUS.POSTED;
                return (
                  <tr key={expense.id} className="hover:bg-dark-700">
                    <td className="table-cell">{expense.formattedDate}</td>
                    <td className="table-cell">
                      <Badge variant="default">{expense.category}</Badge>
                    </td>
                    <td className="table-cell font-medium">{expense.description}</td>
                    <td className="table-cell">
                      <span className="font-semibold text-dark-800">
                        {formatCurrency(expense.amount)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <Badge
                        variant={EXPENSE_STATUS_VARIANTS[expense.status] || 'default'}
                      >
                        {EXPENSE_STATUS_LABELS[expense.status] || expense.status}
                      </Badge>
                    </td>
                    {/* TODO: Uncomment when receipt storage is implemented */}
                    {/* <td className="table-cell">
                      {expense.receipt ? (
                        <button className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm">
                          <Receipt className="w-4 h-4" />
                          View
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUploadReceipt(expense.id)}
                          className="flex items-center gap-1 text-dark-400 hover:text-dark-600 text-sm"
                        >
                          <Upload className="w-4 h-4" />
                          Upload
                        </button>
                      )}
                    </td> */}
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        {!isPosted && hasPermission('expense_update') && (
                          <button
                            onClick={() => handleOpenModal(expense)}
                            className="p-2 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Edit expense"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {isPosted ? (
                          isAdmin && (
                            <button
                              onClick={() => handleVoidExpense(expense.id)}
                              className="p-2 text-dark-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                              title="Void expense"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )
                        ) : (
                          <>
                            {isAdmin && (
                              <button
                                onClick={() => handlePostExpense(expense.id)}
                                className="p-2 text-dark-400 hover:text-success-600 hover:bg-success-50 rounded-lg transition-colors"
                                title="Post expense"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {hasPermission('expense_delete') && (
                              <button
                                onClick={() => handleDeleteExpense(expense.id)}
                                className="p-2 text-dark-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                                title="Delete expense"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredExpenses.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-dark-400">No expenses found matching your criteria</p>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-dark-200">
            <div className="text-sm text-dark-300">
              Showing {pagination.from} to {pagination.to} of {pagination.total} expenses
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-dark-200 hover:bg-dark-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-dark-400"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 text-sm text-dark-300">
                Page {pagination.current_page} of {pagination.last_page}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))}
                disabled={currentPage === pagination.last_page}
                className="p-2 rounded-lg border border-dark-200 hover:bg-dark-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-dark-400"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Combined Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={selectedExpense ? 'Edit Expense' : 'Add New Expense'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Date</label>
              <DatePicker
                selected={formData.expenseDate ? new Date(formData.expenseDate) : null}
                onChange={(date) => {
                  const dateString = date ? date.toISOString().split('T')[0] : '';
                  setFormData({ ...formData, expenseDate: dateString });
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

          {/* TODO: Uncomment when receipt storage is implemented */}
          {/* <div>
            <label className="label">Upload Receipt (Optional)</label>
            <div className="border-2 border-dashed border-dark-200 rounded-xl p-6 text-center hover:border-primary-500 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-dark-300 mx-auto mb-2" />
              <p className="text-sm text-dark-500">Click to upload receipt</p>
              <p className="text-xs text-dark-400 mt-1">PNG, JPG, PDF up to 10MB</p>
            </div>
          </div> */}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
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
    </Layout>
  );
};

export default Expenses;

