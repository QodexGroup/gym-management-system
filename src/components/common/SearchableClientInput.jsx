import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

/**
 * SearchableClientInput - A reusable searchable input component for selecting clients/customers
 * 
 * @param {Array} customers - Array of customer objects
 * @param {string} value - Selected customer ID
 * @param {Function} onChange - Callback function when customer is selected (receives customerId)
 * @param {string} label - Label text for the input
 * @param {boolean} required - Whether the field is required
 * @param {string} placeholder - Placeholder text for the input
 * @param {string} className - Additional CSS classes
 * @param {boolean} disabled - Whether the input is disabled
 */
const SearchableClientInput = ({
  customers = [],
  value = '',
  onChange,
  label = 'Client',
  required = false,
  placeholder = 'Search client by name',
  className = '',
  disabled = false,
}) => {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Get selected customer
  const selectedCustomer = useMemo(() => {
    if (!value) return null;
    return customers.find(c => c.id.toString() === value.toString());
  }, [customers, value]);

  // Initialize search with selected customer name
  useEffect(() => {
    if (selectedCustomer && !search) {
      const customerName = selectedCustomer.name || 
        (selectedCustomer.firstName && selectedCustomer.lastName 
          ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` 
          : selectedCustomer.firstName || '');
      setSearch(customerName);
    } else if (!value && search) {
      setSearch('');
    }
  }, [selectedCustomer, value]); // Only update when selection changes externally

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (!search.trim()) {
      return customers;
    }
    const searchLower = search.toLowerCase();
    return customers.filter(customer => {
      const customerName = customer.name || 
        (customer.firstName && customer.lastName ? `${customer.firstName} ${customer.lastName}` : 
        customer.firstName || '');
      return customerName.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.phoneNumber?.includes(searchLower);
    });
  }, [customers, search]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current &&
        dropdownRef.current &&
        !inputRef.current.contains(event.target) &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectCustomer = (customer) => {
    const customerName = customer.name || 
      (customer.firstName && customer.lastName ? `${customer.firstName} ${customer.lastName}` : 
      customer.firstName || '');
    setSearch(customerName);
    setShowDropdown(false);
    if (onChange) {
      onChange(customer.id.toString());
    }
  };

  const handleClear = () => {
    setSearch('');
    setShowDropdown(false);
    if (onChange) {
      onChange('');
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearch(newValue);
    setShowDropdown(true);
    if (!newValue && onChange) {
      onChange('');
    }
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  return (
    <div className={`relative ${className}`} ref={inputRef}>
      {label && (
        <label className="label">
          {label} {required && '*'}
        </label>
      )}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
        <input
          type="text"
          className="input pl-10 pr-10"
          placeholder={placeholder}
          value={search}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          required={required}
          disabled={disabled}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200 transition-colors"
            disabled={disabled}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {showDropdown && filteredCustomers.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredCustomers.map((customer) => {
            const customerName = customer.name || 
              (customer.firstName && customer.lastName ? `${customer.firstName} ${customer.lastName}` : 
              customer.firstName || 'Unknown');
            return (
              <button
                key={customer.id}
                type="button"
                onClick={() => handleSelectCustomer(customer)}
                className="w-full text-left px-4 py-2 hover:bg-dark-700 text-dark-50 transition-colors"
              >
                <div className="font-medium">{customerName}</div>
                {(customer.email || customer.phoneNumber) && (
                  <div className="text-xs text-dark-400">
                    {customer.email && customer.phoneNumber 
                      ? `${customer.email} • ${customer.phoneNumber}`
                      : customer.email || customer.phoneNumber}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
      {showDropdown && search && filteredCustomers.length === 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-lg p-4"
        >
          <p className="text-sm text-dark-400 text-center">No clients found</p>
        </div>
      )}
      {value && (
        <input type="hidden" value={value} required={required} />
      )}
    </div>
  );
};

export default SearchableClientInput;
