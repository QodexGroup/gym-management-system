import { useMemo } from 'react';

export const useCustomerSearch = (customers, searchQuery) => {
  return useMemo(() => {
    if (!searchQuery) return customers;

    const query = searchQuery.toLowerCase();

    return customers.filter((c) => {
      const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
      const email = (c.email || '').toLowerCase();
      const phone = (c.phoneNumber || '').toLowerCase();

      return fullName.includes(query) || email.includes(query) || phone.includes(query);
    });
  }, [customers, searchQuery]);
};
