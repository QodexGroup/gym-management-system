import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { expenseService } from '../services/expenseService';
import { expenseCategoryService } from '../services/expenseCategoryService';
import { Toast } from '../utils/alert';

/**
 * Query keys for expenses
 */
export const expenseKeys = {
  all: ['expenses'],
  lists: () => [...expenseKeys.all, 'list'],
  list: (options) => [...expenseKeys.lists(), options],
  details: () => [...expenseKeys.all, 'detail'],
  detail: (id) => [...expenseKeys.details(), id],
};

/**
 * Query keys for expense categories
 */
export const expenseCategoryKeys = {
  all: ['expenseCategories'],
  lists: () => [...expenseCategoryKeys.all, 'list'],
  list: () => [...expenseCategoryKeys.lists()],
};

/**
 * Hook to fetch all expenses with pagination
 * @param {Object} options - Query options (page, pagelimit, sort, filters, relations)
 */
export const useExpenses = (options = {}) => {
  return useQuery({
    queryKey: expenseKeys.list(options),
    queryFn: async () => {
      return await expenseService.getAll(options);
    },
    placeholderData: keepPreviousData, // Keep previous page data while loading new page
  });
};

/**
 * Hook to fetch all expense categories with pagination
 * @param {Object} options - Query options (page, pagelimit, sort, filters, relations)
 */
export const useExpenseCategories = (options = {}) => {
  return useQuery({
    queryKey: expenseCategoryKeys.list(options),
    queryFn: async () => {
      return await expenseCategoryService.getAll(options);
    },
    placeholderData: keepPreviousData, // Keep previous page data while loading new page
  });
};

/**
 * Hook to create a new expense
 */
export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expenseData) => {
      return await expenseService.create(expenseData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      Toast.success('Expense created successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to create expense');
    },
  });
};

/**
 * Hook to update an expense
 */
export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      return await expenseService.update(id, data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(variables.id) });
      Toast.success('Expense updated successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to update expense');
    },
  });
};

/**
 * Hook to post an expense
 */
export const usePostExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      return await expenseService.post(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      Toast.success('Expense posted successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to post expense');
    },
  });
};

/**
 * Hook to delete an expense
 */
export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      return await expenseService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to delete expense');
    },
  });
};

