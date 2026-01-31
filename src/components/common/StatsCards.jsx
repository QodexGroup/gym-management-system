import StatCard from './StatCard';

const StatsCards = ({ stats = [], dark = false, size = 'md', iconPosition = 'right', iconColor = 'light', columns = 4 }) => {
  if (!Array.isArray(stats) || stats.length === 0) return null;

  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  }[columns] || 'md:grid-cols-4';

  return (
    <div className={`grid grid-cols-1 ${gridColsClass} gap-6 mb-6`}>
      {stats.map((stat) => {
        if (!stat) return null;
        const Icon = stat.icon || null;
        return (
          <StatCard
            key={stat.title}
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
