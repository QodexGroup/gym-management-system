import { Mail, Phone } from 'lucide-react';
import { Avatar } from '../../../components/common';
import { formatDate } from '../../../shared/utils/formatters';

/**
 * Columns for the "registered through the public link" table on the Kiosk
 * Registration tab of System Settings.
 *
 * Intentionally lean: this is a review list, not the full member table. Staff
 * click through to the member profile for anything more.
 *
 * @returns {Array<{key: string, label: string, render: (row: Object) => React.ReactNode}>}
 */
export const getKioskRegistrationColumns = () => [
  {
    key: 'member',
    label: 'Member',
    render: (customer) => {
      const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
      return (
        <div className="flex items-center gap-3">
          <Avatar name={fullName} size="md" />
          <p className="font-semibold text-dark-50">{fullName || 'N/A'}</p>
        </div>
      );
    },
  },
  {
    key: 'contact',
    label: 'Contact',
    render: (customer) => (
      <div className="space-y-1">
        {customer.phoneNumber && (
          <div className="flex items-center gap-2 text-sm text-dark-300">
            <Phone className="w-3.5 h-3.5" />
            {customer.phoneNumber}
          </div>
        )}
        {customer.email && (
          <div className="flex items-center gap-2 text-sm text-dark-300">
            <Mail className="w-3.5 h-3.5" />
            {customer.email}
          </div>
        )}
        {!customer.phoneNumber && !customer.email && '-'}
      </div>
    ),
  },
  {
    key: 'registeredAt',
    label: 'Registered',
    render: (customer) => formatDate(customer.createdAt) || '-',
  },
];
