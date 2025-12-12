import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseService } from '../services/expenseService';
import { expenseCategoryService } from '../services/expenseCategoryService';
import { Toast } from '../utils/alert';

/**
 * Query keys for expenses
 */
export const expenseKeys = {
  all: ['expenses'],
  lists: () => [...expenseKeys.all, 'list'],
  list: () => [...expenseKeys.lists()],
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
 * Hook to fetch all expenses
 * Uses global default staleTime: 1 hour
 */
export const useExpenses = () => {
  return useQuery({
    queryKey: expenseKeys.list(),
    queryFn: async () => {
      return await expenseService.getAll();
    },
  });
};

/**
 * Hook to fetch all expense categories
 * Uses global default staleTime: 1 hour
 */
export const useExpenseCategories = () => {
  return useQuery({
    queryKey: expenseCategoryKeys.list(),
    queryFn: async () => {
      return await expenseCategoryService.getAll();
    },
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

