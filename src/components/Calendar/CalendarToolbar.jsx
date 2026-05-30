import { Filter, Calendar, List, Zap } from 'lucide-react';

/**
 * CalendarToolbar - Reusable toolbar component for calendar views
 *
 * @param {Array}    typeFilters        - [{ key, label, shortLabel, isActive, getColorClass }]
 * @param {Function} onTypeFilterToggle - (key) => void
 * @param {string}   typeFilterLabel    - Label for the filter section (default: "Types:")
 * @param {string}   viewMode           - 'calendar' | 'list'
 * @param {Function} onViewModeToggle   - () => void
 * @param {Array}    actionButtons      - [{ key, label, icon, onClick, variant }]
 * @param {Object}   additionalFilters  - { label, icon, items: [{ id, label, isActive, onClick }] }
 * @param {boolean}  showViewToggle     - Whether to show the view-mode toggle (default: true)
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
  const hasActions = (showViewToggle && viewMode && onViewModeToggle) || actionButtons.length > 0;

  return (
    <div className="card space-y-3">

      {/* ── Row 1 ──
          Mobile : filters row + actions row stacked
          sm+    : filters (left) and actions (right) on one line */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

        {/* Type filter pills */}
        {typeFilters.length > 0 && onTypeFilterToggle && (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* sm+: label text */}
            <span className="hidden sm:flex items-center gap-2 text-sm font-medium text-dark-400 whitespace-nowrap flex-shrink-0">
              <Filter className="w-4 h-4" />
              {typeFilterLabel}
            </span>
            {/* mobile: icon only */}
            <Filter className="sm:hidden w-4 h-4 text-dark-400 flex-shrink-0" />

            {/* mobile: horizontal scroll  /  sm+: wrap */}
            <div className="flex gap-1.5 overflow-x-auto sm:flex-wrap scrollbar-hide pb-0.5 sm:pb-0">
              {typeFilters.map((filter) => {
                const colorClass = filter.getColorClass
                  ? filter.getColorClass(filter.key, filter.isActive)
                  : filter.isActive
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-700 text-dark-400 hover:bg-dark-600';

                return (
                  <button
                    key={filter.key}
                    onClick={() => onTypeFilterToggle(filter.key)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${colorClass}`}
                  >
                    <span className="sm:hidden">{filter.shortLabel || filter.label}</span>
                    <span className="hidden sm:inline">{filter.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {hasActions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* mobile: leading icon to match filter/coaches row pattern */}
            <Zap className="sm:hidden w-4 h-4 text-dark-400 flex-shrink-0" />
            {/* View toggle */}
            {showViewToggle && viewMode && onViewModeToggle && (
              <div className="relative group">
                <button
                  onClick={onViewModeToggle}
                  className="btn-secondary flex items-center gap-2"
                >
                  {viewMode === 'calendar' ? (
                    <><List className="w-4 h-4" /><span className="hidden sm:inline">List View</span></>
                  ) : (
                    <><Calendar className="w-4 h-4" /><span className="hidden sm:inline">Calendar View</span></>
                  )}
                </button>
                <span className="sm:hidden absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-dark-600 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                  {viewMode === 'calendar' ? 'List View' : 'Calendar View'}
                </span>
              </div>
            )}

            {/* Custom action buttons */}
            {actionButtons.map((button, index) => {
              const Icon = button.icon;
              const buttonClass =
                button.variant === 'primary' ? 'btn-primary' :
                button.variant === 'danger'  ? 'btn-danger'  : 'btn-secondary';
              return (
                <div key={button.key || index} className="relative group">
                  <button
                    onClick={button.onClick}
                    className={`${buttonClass} flex items-center gap-2`}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    <span className="hidden sm:inline">{button.label}</span>
                  </button>
                  {/* Tooltip visible only on mobile where label text is hidden */}
                  <span className="sm:hidden absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-dark-600 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                    {button.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Row 2: Additional filters (e.g. Coaches) ── */}
      {additionalFilters && (
        <div className="flex items-center gap-2 pt-3 border-t border-dark-700">
          {/* sm+: label text  /  mobile: icon only */}
          <span className="hidden sm:flex items-center gap-2 text-sm font-medium text-dark-400 whitespace-nowrap flex-shrink-0">
            {additionalFilters.icon && <additionalFilters.icon className="w-4 h-4" />}
            {additionalFilters.label}:
          </span>
          {additionalFilters.icon && (
            <additionalFilters.icon className="sm:hidden w-4 h-4 text-dark-400 flex-shrink-0" />
          )}

          <div className="flex gap-1.5 overflow-x-auto sm:flex-wrap scrollbar-hide pb-0.5 sm:pb-0 flex-1">
            {additionalFilters.items?.map((item) => {
              const isActive = item.isActive !== false;
              return (
                <button
                  key={item.id}
                  onClick={() => item.onClick?.(item.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                    isActive ? 'bg-primary-500 text-white' : 'bg-dark-700 text-dark-400 hover:bg-dark-600'
                  }`}
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
