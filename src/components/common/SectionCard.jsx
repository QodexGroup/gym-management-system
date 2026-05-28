const SectionCard = ({
  title,
  actions,
  children,
  className = '',
  headerClassName = '',
  noPadding = false,
}) => {
  const hasHeader = title || actions;

  return (
    <div className={`card ${className}`}>
      {hasHeader && (
        <div className={`flex items-center justify-between mb-4 ${headerClassName}`}>
          {title && (
            typeof title === 'string'
              ? <h3 className="text-lg font-semibold text-dark-50">{title}</h3>
              : title
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={noPadding ? '-mx-6 -mb-6' : ''}>{children}</div>
    </div>
  );
};

export default SectionCard;
