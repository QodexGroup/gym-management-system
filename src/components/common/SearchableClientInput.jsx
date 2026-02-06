import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useSearchCustomers } from '../../hooks/useCustomers';

/**
 * SearchableClientInput - A reusable searchable input component for selecting clients/customers
 * Uses backend search when user types, shows first page when search is empty
 * 
 * @param {Array} customers - Array of customer objects (optional, for pre-loaded data)
 * @param {string} value - Selected customer ID
 * @param {Function} onChange - Callback function when customer is selected (receives customerId)
 * @param {Function} onSelect - Optional callback function when customer is selected (receives customer object)
 *   If provided, this takes precedence over onChange. Useful for custom behavior like navigation.
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
  onSelect,
  label = 'Client',
  required = false,
  placeholder = 'Search client by name',
  className = '',
  disabled = false,
}) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Debounce search input
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300); // 300ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [search]);

  // Use backend search when there's a search term, otherwise use first page
  const { data: searchResults, isLoading: isSearching } = useSearchCustomers(
    debouncedSearch.trim(),
    1,
    10
  );

  // Determine which customers to show
  const displayCustomers = useMemo(() => {
    // If search is empty, use first page from backend (or provided customers if available)
    if (!debouncedSearch.trim()) {
      return searchResults?.data || customers;
    }
    // If searching, use search results
    return searchResults?.data || [];
  }, [debouncedSearch, searchResults, customers]);

  // Get selected customer
  const selectedCustomer = useMemo(() => {
    if (!value) return null;
    // First check in displayCustomers, then in provided customers
    return displayCustomers.find(c => c.id.toString() === value.toString()) ||
           customers.find(c => c.id.toString() === value.toString());
  }, [displayCustomers, customers, value]);

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
  }, [selectedCustomer, value]);

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
    // If onSelect is provided, use it (for custom behavior like navigation)
    if (onSelect) {
      onSelect(customer);
      setShowDropdown(false);
      setSearch('');
      return;
    }

    // Default behavior: call onChange with customer ID
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
    setDebouncedSearch('');
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
      {showDropdown && (
        <>
          {isSearching && (
            <div
              ref={dropdownRef}
              className="absolute z-50 w-full mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-lg p-4"
            >
              <p className="text-sm text-dark-400 text-center">Searching...</p>
            </div>
          )}
          {!isSearching && displayCustomers.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-50 w-full mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              {displayCustomers.map((customer) => {
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
          {!isSearching && search && displayCustomers.length === 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-50 w-full mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-lg p-4"
            >
              <p className="text-sm text-dark-400 text-center">No clients found</p>
            </div>
          )}
        </>
      )}
      {value && (
        <input type="hidden" value={value} required={required} />
      )}
    </div>
  );
};

export default SearchableClientInput;
