import { useState, useMemo, useCallback } from 'react';
import Layout from '../../components/layout/Layout';
import { SearchAndFilter, Pagination } from '../../components/common';
import DataTable from '../../components/DataTable';
import { Plus, DollarSign } from 'lucide-react';
import { Alert } from '../../utils/alert';
import { EXPENSE_STATUS } from '../../constants/expenseConstants';
import { 
  useExpenses, 
  useExpenseCategories, 
  usePostExpense,
  useDeleteExpense 
} from '../../hooks/useExpenses';
import { useAuth } from '../../context/AuthContext';
import { isAdminRole } from '../../constants/userRoles';
import { usePermissions } from '../../hooks/usePermissions';
import { usePagination } from '../../hooks/usePagination';
import { mapExpensesData } from '../../models/expenseModel';
import { expenseTableColumns } from './tables/expenseTable.config';
import ExpenseForm from './forms/ExpenseForm';

const Expenses = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const isAdmin = isAdminRole(user?.role);
  const { currentPage, setCurrentPage, goToPrev, goToNext } = usePagination(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

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


  // React Query hooks
  const { data: expensesData, isLoading: loading } = useExpenses(expenseOptions);
  const { data: categoriesData } = useExpenseCategories({});
  const postMutation = usePostExpense();
  const deleteMutation = useDeleteExpense();

  // Extract paginated data
  const expenses = expensesData?.data || [];
  const pagination = expensesData?.pagination;
  const categories = categoriesData?.data || [];

  // Transform API data to component format
  const transformedExpenses = useMemo(() => {
    return mapExpensesData(expenses, categories);
  }, [expenses, categories]);

  /* ------------------------------- handlers ------------------------------- */
  // Reset to page 1 when search or filter changes
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (value) => {
    setFilterCategory(value);
    setCurrentPage(1);
  };
  
  const handleOpenModal = (expense = null) => {
    if (expense) {
      // Edit mode - check if expense is POSTED
      if (expense.status === EXPENSE_STATUS.POSTED) {
        Alert.warning('Cannot Edit', 'Posted expenses cannot be edited.');
        return;
      }
      setSelectedExpense(expense);
    } else {
      // Create mode
      setSelectedExpense(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedExpense(null);
  };

  const handleFormSuccess = () => {
    handleCloseModal();
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

  // Prepare filter options for SearchAndFilter
  const filterOptions = useMemo(() => {
    return categories.map((cat) => ({
      id: cat.name,
      name: cat.name,
      label: cat.name,
    }));
  }, [categories]);

  // Table columns
  const columns = useMemo(
    () => expenseTableColumns({
      isAdmin,
      hasUpdatePermission: hasPermission('expense_update'),
      hasDeletePermission: hasPermission('expense_delete'),
      onEdit: handleOpenModal,
      onPost: handlePostExpense,
      onVoid: handleVoidExpense,
      onDelete: handleDeleteExpense,
    }),
    [isAdmin, hasPermission, handleOpenModal, handlePostExpense, handleVoidExpense, handleDeleteExpense]
  );

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
        <div className="mb-6">
          <SearchAndFilter
            searchValue={searchQuery}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search expenses..."
            filterValue={filterCategory}
            onFilterChange={handleCategoryFilterChange}
            filterOptions={filterOptions}
            filterLabel="All Categories"
            onAddClick={hasPermission('expense_create') ? () => handleOpenModal() : undefined}
            addButtonLabel="Add Expense"
            addButtonIcon={Plus}
          />
        </div>

        <DataTable
          columns={columns}
          data={transformedExpenses}
          loading={loading}
          emptyMessage="No expenses found matching your criteria"
        />

        {pagination?.lastPage > 1 && (
          <Pagination
            currentPage={currentPage}
            lastPage={pagination?.lastPage}
            from={pagination?.from}
            to={pagination?.to}
            total={pagination?.total}
            onPrev={goToPrev}
            onNext={() => goToNext(pagination?.lastPage)}
          />
        )}
      </div>

      {/* Expense Form Modal */}
      <ExpenseForm
        selectedExpense={selectedExpense}
        isOpen={showModal}
        onClose={handleCloseModal}
        onSuccess={handleFormSuccess}
        categories={categories}
      />
    </Layout>
  );
};

export default Expenses;

