/**
 * Reusable 4-card stats grid for reports (gradient style).
 * stats: Array<{ label: string, value: string|number, icon: LucideIcon, gradient: string }>
 * gradient: e.g. 'from-success-500 to-success-600', 'from-primary-500 to-primary-600'
 */
const ReportStatCards = ({ stats = [], columns = 4, className = '' }) => {
  if (!Array.isArray(stats) || stats.length === 0) return null;

  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  }[columns] || 'md:grid-cols-4';

  return (
    <div className={`grid grid-cols-1 ${gridCols} gap-6 mb-6 no-print ${className}`}>
      {stats.map((stat) => {
        const Icon = stat.icon || null;
        const gradient = stat.gradient || 'from-primary-500 to-primary-600';
        const textBg = stat.textBg || 'text-primary-100';
        const iconBg = stat.iconBg || 'text-primary-200';
        return (
          <div
            key={stat.label}
            className={`card bg-gradient-to-br ${gradient} text-white`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`${textBg} text-sm`}>{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              {Icon && <Icon className={`w-12 h-12 ${iconBg}`} />}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReportStatCards;
