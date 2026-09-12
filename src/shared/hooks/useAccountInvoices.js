import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { subscriptionPaymentService } from '../services/subscriptionPaymentService';

export const accountInvoiceKeys = {
  all: ['accountInvoices'],
  list: (params) => [...accountInvoiceKeys.all, 'list', params],
};

/**
 * The signed-in account's own subscription invoices.
 *
 * Reads /accounts/invoices — the invoices themselves, not the payment requests
 * submitted against them, so an unpaid invoice appears the moment it is issued.
 *
 * @param {{page?: number, pagelimit?: number}} params
 * @returns {object} React Query result.
 */
export const useAccountInvoices = (params = {}) => {
  return useQuery({
    queryKey: accountInvoiceKeys.list(params),
    queryFn: async () => {
      return await subscriptionPaymentService.getAccountInvoices(params);
    },
    placeholderData: keepPreviousData,
  });
};
