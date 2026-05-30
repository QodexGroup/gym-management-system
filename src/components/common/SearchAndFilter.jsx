import { Search, Plus } from 'lucide-react';

const SearchAndFilter = ({
  // Search props
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',

  // Filter props
  filterValue = 'all',
  onFilterChange,
  filterOptions = [],
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
  const inputClass = dark
    ? 'bg-dark-700 border-dark-600 text-dark-50 placeholder-dark-400 focus:bg-dark-600'
    : 'bg-dark-800 border-dark-600 text-dark-50 placeholder-dark-400 focus:bg-dark-700';

  const selectClass = dark
    ? 'bg-dark-700 border-dark-600 text-dark-50'
    : 'bg-dark-800 border-dark-600 text-dark-50';

  const hasFilter = onFilterChange && filterOptions.length > 0;

  return (
    /*
     * Mobile  → flex-col: search, filter, button each full-width stacked
     * Desktop → flex-row justify-between: [search + filter group] … [button]
     */
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      {/* Left group: search + filter sit together on desktop */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        {onSearchChange && (
          <div className="relative sm:w-64 lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:border-primary-500 outline-none transition-colors ${inputClass}`}
            />
          </div>
        )}

        {hasFilter && (
          <select
            value={filterValue}
            onChange={(e) => onFilterChange(e.target.value)}
            className={`w-full sm:w-auto px-4 py-2.5 border rounded-lg focus:border-primary-500 outline-none ${selectClass}`}
          >
            <option value="all" className="bg-dark-700 text-dark-50">
              {filterLabel}
            </option>
            {filterOptions.map((option) => {
              const value = option.id || option.value || option;
              const label =
                option.label || option.name || option.categoryName || String(option);
              return (
                <option key={value} value={value} className="bg-dark-700 text-dark-50">
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
          className="w-full sm:w-auto shrink-0 whitespace-nowrap btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <AddIcon className="w-4 h-4" />
          {addButtonLabel}
        </button>
      )}
    </div>
  );
};

export default SearchAndFilter;
