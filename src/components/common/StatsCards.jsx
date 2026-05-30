import StatCard from './StatCard';

const StatsCards = ({ stats = [], dark = true, size = 'md', iconPosition = 'right', iconColor = 'light', columns = 4, variant = 'default' }) => {
  if (!Array.isArray(stats) || stats.length === 0) return null;

  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
    5: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
  }[columns] || 'sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div className={`grid grid-cols-1 ${gridColsClass} gap-6 mb-6 ${variant === 'gradient' ? 'no-print' : ''}`}>
      {stats.map((stat) => {
        if (!stat) return null;
        const Icon = stat.icon || null;
        const key = stat.title ?? stat.label ?? stat.value;
        if (variant === 'gradient' || stat.variant === 'gradient') {
          return (
            <StatCard
              key={key}
              variant="gradient"
              label={stat.label ?? stat.title}
              value={stat.value}
              icon={Icon}
              gradient={stat.gradient || 'from-primary-500 to-primary-600'}
              textBg={stat.textBg || 'text-primary-100'}
              iconBg={stat.iconBg || 'text-primary-200'}
              size={stat.size || size}
              subtitle={stat.subtitle}
            />
          );
        }
        return (
          <StatCard
            key={key}
            title={stat.title}
            value={stat.value}
            color={stat.color}
            icon={Icon}
            subtitle={stat.subtitle}
            trend={stat.trend}
            trendValue={stat.trendValue}
            dark={dark}
            size={stat.size || size}
            iconPosition={stat.iconPosition || iconPosition}
            iconColor={stat.iconColor || iconColor}
          />
        );
      })}
    </div>
  );
};

export default StatsCards;
