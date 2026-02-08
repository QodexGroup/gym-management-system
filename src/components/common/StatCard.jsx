import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = (
  { title,
    label, // alias for gradient variant
    value,
    icon: Icon,
    color = 'primary',
    subtitle, trend,
    trendValue,
    dark = false,
    size = 'md',
    iconPosition = 'right',
    iconColor = 'light',
    variant = 'default', // 'default' | 'gradient'
    gradient = 'from-primary-500 to-primary-600',
    textBg = 'text-primary-100',
    iconBg = 'text-primary-200',
  }) => {
  const displayTitle = title ?? label;
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const valueSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const iconSizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const iconPaddingClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  };

  const colorClasses = dark
    ? {
        primary: 'border-l-primary-500 bg-dark-800',
        success: 'border-l-success-500 bg-dark-800',
        warning: 'border-l-warning-500 bg-dark-800',
        danger: 'border-l-danger-500 bg-dark-800',
        accent: 'border-l-accent-500 bg-dark-800',
      }
    : {
        primary: 'border-l-primary-500 bg-primary-50',
        success: 'border-l-success-500 bg-success-50',
        warning: 'border-l-warning-500 bg-warning-50',
        danger: 'border-l-danger-500 bg-danger-50',
        accent: 'border-l-accent-500 bg-accent-50',
      };

  const iconBgClasses = dark
    ? iconColor === 'light'
      ? {
          primary: 'bg-primary-500/20 text-primary-400',
          success: 'bg-success-500/20 text-success-400',
          warning: 'bg-warning-500/20 text-warning-400',
          danger: 'bg-danger-500/20 text-danger-400',
          accent: 'bg-accent-500/20 text-accent-400',
        }
      : {
          primary: 'bg-primary-500/30 text-primary-500',
          success: 'bg-success-500/30 text-success-500',
          warning: 'bg-warning-500/30 text-warning-500',
          danger: 'bg-danger-500/30 text-danger-500',
          accent: 'bg-accent-500/30 text-accent-500',
        }
    : iconColor === 'light'
    ? {
        primary: 'bg-primary-50 text-primary-500',
        success: 'bg-success-50 text-success-500',
        warning: 'bg-warning-50 text-warning-500',
        danger: 'bg-danger-50 text-danger-500',
        accent: 'bg-accent-50 text-accent-500',
      }
    : {
        primary: 'bg-primary-200 text-primary-600',
        success: 'bg-success-200 text-success-600',
        warning: 'bg-warning-200 text-warning-600',
        danger: 'bg-danger-200 text-danger-600',
        accent: 'bg-accent-200 text-accent-600',
      };

  const textClasses = dark
    ? {
        title: 'text-xs font-medium text-dark-300',
        value: `${valueSizeClasses[size]} font-bold text-dark-50 mt-1`,
        subtitle: 'text-xs text-dark-400 mt-1',
      }
    : {
        title: 'text-sm font-medium text-dark-500',
        value: `${valueSizeClasses[size]} font-bold text-dark-800 mt-1`,
        subtitle: 'text-xs text-dark-400 mt-1',
      };

  const iconElement = Icon && variant === 'gradient' ? (
    <Icon className={`w-12 h-12 ${iconBg}`} />
  ) : Icon ? (
    <div className={`${iconPaddingClasses[size]} rounded-xl ${iconBgClasses[color]} flex-shrink-0`}>
      <Icon className={iconSizeClasses[size]} />
    </div>
  ) : null;

  if (variant === 'gradient') {
    return (
      <div className={`card bg-gradient-to-br ${gradient} text-white ${sizeClasses[size]} no-print`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`${textBg} text-sm`}>{displayTitle}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          {iconElement}
        </div>
      </div>
    );
  }

  return (
    <div className={`stat-card ${colorClasses[color]} ${sizeClasses[size]}`}>
      <div className={`flex items-start ${iconPosition === 'left' ? 'gap-3' : 'justify-between'}`}>
        {iconPosition === 'left' && iconElement}
        <div className="flex-1">
          <p className={textClasses.title}>{displayTitle}</p>
          <p className={textClasses.value}>{value}</p>
          {subtitle && <p className={textClasses.subtitle}>{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-success-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-danger-500" />
              )}
              <span className={`text-xs font-medium ${trend === 'up' ? 'text-success-600' : 'text-danger-600'}`}>
                {trendValue}
              </span>
              <span className="text-xs text-dark-400">vs last month</span>
            </div>
          )}
        </div>
        {iconPosition === 'right' && iconElement}
      </div>
    </div>
  );
};

export default StatCard;
