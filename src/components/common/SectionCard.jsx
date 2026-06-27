const SectionCard = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  children,
  className = '',
  headerClassName = '',
  noPadding = false,
}) => {
  const hasHeader = title || actions || Icon || subtitle;

  return (
    <div className={`card ${className}`}>
      {hasHeader && (
        <div className={`flex items-center justify-between mb-4 ${headerClassName}`}>
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400 shrink-0">
                <Icon className="w-5 h-5" />
              </div>
            )}
            {(title || subtitle) && (
              <div className="min-w-0">
                {title && (
                  typeof title === 'string'
                    ? <h3 className="text-lg font-semibold text-dark-50">{title}</h3>
                    : title
                )}
                {subtitle && <p className="text-sm text-dark-400">{subtitle}</p>}
              </div>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={noPadding ? '-mx-6 -mb-6' : ''}>{children}</div>
    </div>
  );
};

export default SectionCard;
