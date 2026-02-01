/**
 * Expense Model
 * Defines the structure and initial state for expense form data and data transformations
 */

import { formatDate } from '../utils/formatters';

/**
 * Get initial expense form data
 * @returns {Object} Initial form state
 */
export const getInitialExpenseFormData = () => ({
  categoryId: '',
  description: '',
  amount: '',
  expenseDate: '',
});

/**
 * Map expense data from API to form data
 * @param {Object} expense - Expense object from API
 * @returns {Object} Form data object
 */
export const mapExpenseToFormData = (expense) => {
  if (!expense) return getInitialExpenseFormData();
  
  return {
    categoryId: expense.categoryId?.toString() || '',
    description: expense.description || '',
    amount: expense.amount?.toString() || '',
    expenseDate: expense.date || expense.expenseDate || '',
  };
};

/**
 * Map expenses data from API to UI format
 * @param {Array} expensesData - Array of expense objects from API
 * @param {Array} categories - Array of category objects
 * @returns {Array} Transformed array of expense objects for UI
 */
export const mapExpensesData = (expensesData = [], categories = []) => {
  return expensesData.map((apiExpense) => {
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
};
