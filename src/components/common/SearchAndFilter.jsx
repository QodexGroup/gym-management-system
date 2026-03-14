import { Search, Plus } from 'lucide-react';

const SearchAndFilter = ({
  // Search props
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  
  // Filter props
  filterValue = 'all',
  onFilterChange,
  filterOptions = [], // Array of { id, label } or { value, label }
  filterLabel = 'All',
  filterPlaceholder,
  
  // Add button props (optional)
  onAddClick,
  addButtonLabel = 'Add',
  addButtonIcon: AddIcon = Plus,
  addButtonDisabled = false,
  
  // Styling
  dark = true,
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-4 flex-1">
        {/* Search Input */}
        {onSearchChange && (
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:border-primary-500 outline-none transition-colors ${
                dark
                  ? 'bg-dark-700 border-dark-600 text-dark-50 placeholder-dark-400 focus:bg-dark-600'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:bg-gray-50'
              }`}
            />
          </div>
        )}

        {/* Filter Dropdown */}
        {onFilterChange && filterOptions.length > 0 && (
          <select
            value={filterValue}
            onChange={(e) => onFilterChange(e.target.value)}
            className={`px-4 py-2.5 border rounded-lg focus:border-primary-500 outline-none ${
              dark
                ? 'bg-dark-700 border-dark-600 text-dark-50'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="all" className={dark ? 'bg-dark-700 text-dark-50' : 'bg-white text-gray-900'}>
              {filterLabel}
            </option>
            {filterOptions.map((option) => {
              const value = option.id || option.value || option;
              const label = option.label || option.name || option.categoryName || String(option);
              
              return (
                <option
                  key={value}
                  value={value}
                  className={dark ? 'bg-dark-700 text-dark-50' : 'bg-white text-gray-900'}
                >
                  {label}
                </option>
              );
            })}
          </select>
        )}
      </div>

      {/* Add Button */}
      {onAddClick && (
        <button
          onClick={onAddClick}
          disabled={addButtonDisabled}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <AddIcon className="w-4 h-4" />
          {addButtonLabel}
        </button>
      )}
    </div>
  );
};

export default SearchAndFilter;
