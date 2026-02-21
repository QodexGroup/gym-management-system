/**
 * StatsList Component
 * A vertical list of statistics cards with icon, label, and value
 * 
 * @param {Object} props
 * @param {Array} props.stats - Array of stat objects with { icon, label, value, color }
 * @param {string} props.title - Optional title for the stats list
 * @param {string} props.className - Additional CSS classes
 */
const StatsList = ({ stats = [], title, className = '' }) => {
  if (!Array.isArray(stats) || stats.length === 0) {
    return null;
  }

  const colorClasses = {
    primary: {
      bg: 'bg-dark-800 border-l-primary-500',
      icon: 'text-primary-400',
      label: 'text-dark-300',
      value: 'text-dark-50',
    },
    success: {
      bg: 'bg-dark-800 border-l-success-500',
      icon: 'text-success-400',
      label: 'text-dark-300',
      value: 'text-dark-50',
    },
    warning: {
      bg: 'bg-dark-800 border-l-warning-500',
      icon: 'text-warning-400',
      label: 'text-dark-300',
      value: 'text-dark-50',
    },
    danger: {
      bg: 'bg-dark-800 border-l-danger-500',
      icon: 'text-danger-400',
      label: 'text-dark-300',
      value: 'text-dark-50',
    },
    dark: {
      bg: 'bg-dark-800 border-l-dark-500',
      icon: 'text-dark-400',
      label: 'text-dark-300',
      value: 'text-dark-50',
    },
    default: {
      bg: 'bg-dark-800 border-l-dark-500',
      icon: 'text-dark-400',
      label: 'text-dark-300',
      value: 'text-dark-50',
    },
  };

  return (
    <div className={`card ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-dark-50 mb-4">{title}</h3>
      )}
      <div className="space-y-4">
        {stats.map((stat, index) => {
          if (!stat) return null;
          
          const Icon = stat.icon;
          const color = stat.color || 'default';
          const colors = colorClasses[color] || colorClasses.default;
          const key = stat.key || stat.label || index;

          return (
            <div
              key={key}
              className={`flex items-center justify-between p-3 ${colors.bg} border-l-4 rounded-lg`}
            >
              <div className="flex items-center gap-3">
                {Icon && <Icon className={`w-5 h-5 ${colors.icon}`} />}
                <span className={colors.label}>{stat.label}</span>
              </div>
              <span className={`text-xl font-bold ${colors.value}`}>
                {stat.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatsList;
