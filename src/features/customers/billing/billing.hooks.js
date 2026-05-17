import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { customerBillService } from '../../../shared/services/customerBillService';
import { customerPaymentService } from '../../../shared/services/customerPaymentService';
import { customerMembershipService } from '../../../shared/services/customerMembershipService';
import { customerPtPackageService } from '../../../shared/services/customerPtPackageService';
import { Toast } from '../../../shared/utils/alert';
import { customerKeys } from '../customers.hooks';

/* ------------------------------------------------------------------ */
/* Bill Keys                                                           */
/* ------------------------------------------------------------------ */

export const customerBillKeys = {
  all: ['customerBills'],
  lists: () => [...customerBillKeys.all, 'list'],
  list: () => [...customerBillKeys.lists()],
  byCustomer: (customerId) => [...customerBillKeys.all, 'customer', customerId],
};

/* ------------------------------------------------------------------ */
/* Bill Hooks                                                          */
/* ------------------------------------------------------------------ */

export const useCustomerBills = (customerId, options = {}) => {
  return useQuery({
    queryKey: [...customerBillKeys.byCustomer(customerId), options],
    queryFn: async () => {
      return await customerBillService.getByCustomerId(customerId, options);
    },
    enabled: !!customerId,
  });
};

export const useCreateCustomerBill = () => {
  const queryClient = useQueryClient();
  const idempotencyKeyRef = useRef(null);

  return useMutation({
    mutationFn: async (billData) => {
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = uuidv4();
      }
      return await customerBillService.create(billData, idempotencyKeyRef.current);
    },
    onSuccess: async (data) => {
      idempotencyKeyRef.current = null;
      const customerId = data?.customerId;
      if (customerId) {
        queryClient.invalidateQueries({ queryKey: customerBillKeys.byCustomer(customerId) });
        const queryKey = customerKeys.detail(customerId);
        queryClient.removeQueries({ queryKey });
        await new Promise(resolve => setTimeout(resolve, 100));
        await queryClient.refetchQueries({ queryKey, type: 'all' });
        queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      }
      queryClient.invalidateQueries({ queryKey: customerBillKeys.lists() });
      Toast.success('Bill created successfully');
    },
    onError: (error) => {
      idempotencyKeyRef.current = null;
      Toast.error(error.message || 'Failed to create bill');
    },
  });
};

export const useUpdateCustomerBill = () => {
  const queryClient = useQueryClient();
  const idempotencyKeyRef = useRef(null);

  return useMutation({
    mutationFn: async ({ id, data }) => {
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = uuidv4();
      }
      return await customerBillService.update(id, data, idempotencyKeyRef.current);
    },
    onSuccess: async (data) => {
      idempotencyKeyRef.current = null;
      const customerId = data?.customerId;
      if (customerId) {
        queryClient.invalidateQueries({ queryKey: customerBillKeys.byCustomer(customerId) });
        const queryKey = customerKeys.detail(customerId);
        queryClient.removeQueries({ queryKey });
        await new Promise(resolve => setTimeout(resolve, 100));
        await queryClient.refetchQueries({ queryKey, type: 'all' });
        queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      }
      queryClient.invalidateQueries({ queryKey: customerBillKeys.lists() });
      Toast.success('Bill updated successfully');
    },
    onError: (error) => {
      idempotencyKeyRef.current = null;
      Toast.error(error.message || 'Failed to update bill');
    },
  });
};

export const useDeleteCustomerBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, customerId }) => {
      await customerBillService.delete(id);
      return { customerId };
    },
    onSuccess: async (data) => {
      const customerId = data?.customerId;
      if (customerId) {
        queryClient.invalidateQueries({ queryKey: customerBillKeys.byCustomer(customerId) });
        const queryKey = customerKeys.detail(customerId);
        queryClient.removeQueries({ queryKey });
        await new Promise(resolve => setTimeout(resolve, 100));
        await queryClient.refetchQueries({ queryKey, type: 'all' });
        queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      }
      queryClient.invalidateQueries({ queryKey: customerBillKeys.all });
      Toast.success('Bill deleted successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to delete bill');
    },
  });
};

/* ------------------------------------------------------------------ */
/* Payment Hooks                                                       */
/* ------------------------------------------------------------------ */

export const useCustomerPaymentsByBill = (billId, options = {}) => {
  return useQuery({
    queryKey: ['customerPayments', 'bill', billId, options],
    queryFn: async () => {
      const result = await customerPaymentService.getByBillId(billId, options);
      if (result && typeof result === 'object' && Array.isArray(result.data)) return result.data;
      if (Array.isArray(result)) return result;
      if (result && result.data && Array.isArray(result.data)) return result.data;
      return [];
    },
    enabled: !!billId,
    refetchOnMount: true,
    staleTime: 0,
  });
};

export const useCreateCustomerPayment = () => {
  const queryClient = useQueryClient();
  const idempotencyKeyRef = useRef(null);

  return useMutation({
    mutationFn: async ({ billId, customerId, paymentData }) => {
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = uuidv4();
      }
      await customerPaymentService.create(billId, { ...paymentData, customerId }, idempotencyKeyRef.current);
      return { billId, customerId };
    },
    onSuccess: async (data) => {
      idempotencyKeyRef.current = null;
      const customerId = data?.customerId;
      const billId = data?.billId;
      if (billId) {
        queryClient.invalidateQueries({ queryKey: ['customerPayments', 'bill', billId] });
      }
      if (customerId) {
        queryClient.invalidateQueries({ queryKey: customerBillKeys.byCustomer(customerId) });
        const queryKey = customerKeys.detail(customerId);
        queryClient.removeQueries({ queryKey });
        await new Promise((resolve) => setTimeout(resolve, 100));
        await queryClient.refetchQueries({ queryKey, type: 'all' });
        queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      }
      Toast.success('Payment recorded successfully');
    },
    onError: (error) => {
      idempotencyKeyRef.current = null;
      Toast.error(error.message || 'Failed to record payment');
    },
  });
};

export const useDeleteCustomerPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paymentId, customerId, billId }) => {
      await customerPaymentService.delete(paymentId);
      return { customerId, billId };
    },
    onSuccess: async (data) => {
      const customerId = data?.customerId;
      const billId = data?.billId;
      if (billId) {
        await queryClient.invalidateQueries({ queryKey: ['customerPayments', 'bill', billId] });
      }
      if (customerId) {
        queryClient.invalidateQueries({ queryKey: customerBillKeys.byCustomer(customerId) });
        const queryKey = customerKeys.detail(customerId);
        queryClient.removeQueries({ queryKey });
        await new Promise((resolve) => setTimeout(resolve, 100));
        await queryClient.refetchQueries({ queryKey, type: 'all' });
        queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      }
      Toast.success('Payment deleted successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to delete payment');
    },
  });
};

/* ------------------------------------------------------------------ */
/* Membership Hook                                                     */
/* ------------------------------------------------------------------ */

export const useCreateOrUpdateCustomerMembership = () => {
  const queryClient = useQueryClient();
  const idempotencyKeyRef = useRef(null);

  return useMutation({
    mutationFn: async ({ customerId, membershipData }) => {
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = uuidv4();
      }
      return await customerMembershipService.createOrUpdate(customerId, membershipData, idempotencyKeyRef.current);
    },
    onSuccess: async (data, variables) => {
      idempotencyKeyRef.current = null;
      const customerId = variables.customerId;
      const queryKey = customerKeys.detail(customerId);
      queryClient.removeQueries({ queryKey });
      await new Promise(resolve => setTimeout(resolve, 100));
      await queryClient.refetchQueries({ queryKey, type: 'all' });
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerBillKeys.byCustomer(customerId) });
      Toast.success('Membership plan updated successfully');
    },
    onError: (error) => {
      idempotencyKeyRef.current = null;
      Toast.error(error.message || 'Failed to update membership plan');
    },
  });
};

/* ------------------------------------------------------------------ */
/* PT Package Keys & Hooks                                            */
/* ------------------------------------------------------------------ */

export const customerPtPackageKeys = {
  all: ['customerPtPackages'],
  lists: () => [...customerPtPackageKeys.all, 'list'],
  list: (customerId, options) => [...customerPtPackageKeys.lists(), customerId, options],
  details: () => [...customerPtPackageKeys.all, 'detail'],
  detail: (id) => [...customerPtPackageKeys.details(), id],
};

export const useCustomerPtPackages = (customerId, options = {}) => {
  return useQuery({
    queryKey: customerPtPackageKeys.list(customerId, options),
    queryFn: async () => {
      return await customerPtPackageService.getByCustomerId(customerId, options);
    },
    enabled: !!customerId,
  });
};

export const useAssignPtPackage = () => {
  const queryClient = useQueryClient();
  const idempotencyKeyRef = useRef(null);

  return useMutation({
    mutationFn: async ({ customerId, packageData }) => {
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = uuidv4();
      }
      return await customerPtPackageService.assign(customerId, packageData, idempotencyKeyRef.current);
    },
    onSuccess: () => {
      idempotencyKeyRef.current = null;
      queryClient.invalidateQueries({ queryKey: customerPtPackageKeys.lists() });
      Toast.success('PT Package assigned successfully');
    },
    onError: (error) => {
      idempotencyKeyRef.current = null;
      Toast.error(error.message || 'Failed to assign PT package');
    },
  });
};

export const useCancelPtPackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, packageId }) => {
      return await customerPtPackageService.cancel(customerId, packageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerPtPackageKeys.lists() });
      Toast.success('PT Package cancelled successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to cancel PT package');
    },
  });
};
