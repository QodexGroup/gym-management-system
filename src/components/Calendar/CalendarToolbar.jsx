import { Filter, Calendar, List, Lock } from 'lucide-react';
import { KIND_TOKENS } from './calendarTokens';

/**
 * Toolbar for the calendar page.
 *
 * Everything here is driven by props — it holds no domain knowledge. The perspective
 * switch is the primary control: the feature layer decides whether to pass it at all
 * (permission-gated) and swaps the filter props to match the active perspective.
 *
 * @param {{
 *   perspective?: { value: string, options: Array<{key,label,icon}>, onChange: Function }|null,
 *   typeFilterLabel?: string,
 *   typeFilters?: Array<{key,label,shortLabel,kind,isActive}>,
 *   onTypeFilterToggle?: (key: string) => void,
 *   statusFilterLabel?: string,
 *   statusFilters?: Array<{key,label,isActive}>,
 *   onStatusFilterToggle?: (key: string) => void,
 *   scope?: { locked: boolean, lockedLabel?: string, value?: string, options?: Array<{value,label}>, onChange?: Function }|null,
 *   viewMode?: string,
 *   onViewModeToggle?: () => void,
 *   actionButtons?: Array<{key,label,icon,onClick,variant}>,
 * }} props
 * @returns {JSX.Element}
 */
const CalendarToolbar = ({
  perspective = null,
  typeFilterLabel = 'Type',
  typeFilters = [],
  onTypeFilterToggle,
  statusFilterLabel = 'Status',
  statusFilters = [],
  onStatusFilterToggle,
  scope = null,
  viewMode,
  onViewModeToggle,
  actionButtons = [],
}) => (
  <div className="card space-y-3">
    {/* ── Row 1: perspective switch, view toggle, primary actions ── */}
    <div className="flex flex-wrap items-center gap-2">
      {perspective && (
        <div className="flex w-full gap-0.5 rounded-xl border border-dark-700 bg-dark-900 p-1 xl:inline-flex xl:w-auto">
          {perspective.options.map((option) => {
            const Icon = option.icon;
            const isActive = perspective.value === option.key;
            return (
              <button
                key={option.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => perspective.onChange(option.key)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors xl:flex-none xl:justify-start ${
                  isActive ? 'bg-primary-500 text-white shadow' : 'text-dark-400 hover:text-dark-200'
                }`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span className="hidden sm:inline">{option.label}</span>
                <span className="sm:hidden">{option.shortLabel || option.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex w-full items-center justify-center gap-2 xl:ml-auto xl:w-auto xl:justify-start">
        {viewMode && onViewModeToggle && (
          <button type="button" onClick={onViewModeToggle} className="btn-secondary flex items-center justify-center gap-2 sm:flex-1 xl:flex-none">
            {viewMode === 'calendar' ? (
              <><List className="h-4 w-4" /><span className="hidden sm:inline">List View</span></>
            ) : (
              <><Calendar className="h-4 w-4" /><span className="hidden sm:inline">Calendar View</span></>
            )}
          </button>
        )}
        {actionButtons.map((button) => {
          const Icon = button.icon;
          const cls =
            button.variant === 'primary' ? 'btn-primary'
            : button.variant === 'danger' ? 'btn-danger'
            : 'btn-secondary';
          return (
            <button key={button.key} type="button" onClick={button.onClick} className={`${cls} flex items-center justify-center gap-2 sm:flex-1 xl:flex-none`} title={button.label}>
              {Icon && <Icon className="h-4 w-4" />}
              <span className="hidden sm:inline">{button.label}</span>
            </button>
          );
        })}
      </div>
    </div>

    {/* ── Row 2: contextual filters for the active perspective ── */}
    <div className="flex flex-wrap items-center gap-2 border-t border-dark-700 pt-3">
      {typeFilters.length > 0 && (
        <>
          <span className="hidden items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-dark-400 sm:flex">
            <Filter className="h-3.5 w-3.5" />
            {typeFilterLabel}
          </span>
          {typeFilters.map((filter) => {
            const tokens = KIND_TOKENS[filter.kind] || KIND_TOKENS.class;
            return (
              <button
                key={filter.key}
                type="button"
                aria-pressed={filter.isActive}
                onClick={() => onTypeFilterToggle?.(filter.key)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                  filter.isActive ? tokens.filterOn : tokens.filterOff
                }`}
              >
                <span className="sm:hidden">{filter.shortLabel || filter.label}</span>
                <span className="hidden sm:inline">{filter.label}</span>
              </button>
            );
          })}
        </>
      )}

      {statusFilters.length > 0 && (
        <>
          <span className="ml-1 hidden text-xs font-semibold uppercase tracking-wide text-dark-400 sm:inline">
            {statusFilterLabel}
          </span>
          {statusFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              aria-pressed={filter.isActive}
              onClick={() => onStatusFilterToggle?.(filter.key)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                filter.isActive
                  ? 'border-primary-500 bg-primary-500 text-white'
                  : 'border-dark-700 bg-dark-800 text-dark-400 hover:bg-dark-700'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </>
      )}

      {scope && (
        scope.locked ? (
          <span className="flex items-center gap-1.5 rounded-full border border-dark-700 bg-dark-800 px-3 py-1 text-xs font-semibold text-dark-300">
            <Lock className="h-3 w-3 opacity-60" />
            {scope.lockedLabel}
          </span>
        ) : (
          <select
            value={scope.value}
            onChange={(e) => scope.onChange?.(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-dark-700 bg-dark-800 px-2.5 py-1.5 text-xs font-semibold text-dark-200 sm:flex-none"
          >
            {scope.options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        )
      )}

    </div>
  </div>
);

export default CalendarToolbar;
