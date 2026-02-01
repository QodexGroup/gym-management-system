import { Filter, Calendar, List, User } from 'lucide-react';

/**
 * CalendarToolbar - Reusable toolbar component for calendar views
 * 
 * @param {Object} props
 * @param {Array} props.typeFilters - Array of filter options: [{ key, label, isActive, getColorClass }]
 * @param {Function} props.onTypeFilterToggle - Callback when filter is toggled: (key) => void
 * @param {string} props.typeFilterLabel - Label for the type filter section (default: "Types:")
 * @param {string} props.viewMode - Current view mode ('calendar' | 'list')
 * @param {Function} props.onViewModeToggle - Callback to toggle view mode: () => void
 * @param {Array} props.actionButtons - Array of action button configs: [{ label, icon, onClick, variant }]
 * @param {Object} props.additionalFilters - Additional filter sections: { label, icon, items: [{ id, label, isActive, onClick }] }
 * @param {boolean} props.showViewToggle - Whether to show view mode toggle (default: true)
 */
const CalendarToolbar = ({
  typeFilters = [],
  onTypeFilterToggle,
  typeFilterLabel = 'Types:',
  viewMode,
  onViewModeToggle,
  actionButtons = [],
  additionalFilters,
  showViewToggle = true,
}) => {
  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Type Filters */}
        {typeFilters.length > 0 && onTypeFilterToggle && (
          <div className="flex items-center gap-3 flex-1">
            <span className="text-sm font-medium text-dark-400 flex items-center gap-2 whitespace-nowrap">
              <Filter className="w-4 h-4" />
              {typeFilterLabel}
            </span>
            <div className="flex flex-wrap gap-2">
              {typeFilters.map((filter) => {
                const colorClass = filter.getColorClass
                  ? filter.getColorClass(filter.key, filter.isActive)
                  : filter.isActive
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'bg-dark-700 text-dark-400 hover:bg-dark-600';

                return (
                  <button
                    key={filter.key}
                    onClick={() => onTypeFilterToggle(filter.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${colorClass}`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {showViewToggle && viewMode && onViewModeToggle && (
            <button
              onClick={onViewModeToggle}
              className="btn-secondary flex items-center gap-2"
            >
              {viewMode === 'calendar' ? (
                <>
                  <List className="w-4 h-4" /> List View
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" /> Calendar View
                </>
              )}
            </button>
          )}

          {actionButtons.map((button, index) => {
            const Icon = button.icon;
            const buttonClass =
              button.variant === 'primary'
                ? 'btn-primary'
                : button.variant === 'danger'
                ? 'btn-danger'
                : 'btn-secondary';

            return (
              <button
                key={button.key || index}
                onClick={button.onClick}
                className={`${buttonClass} flex items-center gap-2`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {button.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Additional Filters */}
      {additionalFilters && (
        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-dark-700">
          <span className="text-sm font-medium text-dark-400 flex items-center gap-2 whitespace-nowrap">
            {additionalFilters.icon && <additionalFilters.icon className="w-4 h-4" />}
            {additionalFilters.label}:
          </span>
          <div className="flex flex-wrap gap-2 flex-1">
            {additionalFilters.items?.map((item) => {
              const isActive = item.isActive !== false;
              const activeClass = isActive
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-dark-700 text-dark-400 hover:bg-dark-600';

              return (
                <button
                  key={item.id}
                  onClick={() => item.onClick?.(item.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeClass}`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarToolbar;
