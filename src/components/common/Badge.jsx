const Badge = ({ children, variant = 'default', size = 'md', className = '' }) => {
  const variantClasses = {
    default:  'bg-dark-700 text-dark-200',
    // Using -100/-700 pairs: always high contrast regardless of mode or theme,
    // because palette shades don't invert with color-mode (only the surface scale does).
    primary: 'bg-primary-100 text-primary-700',
    success:  'bg-success-100 text-success-700',
    warning:  'bg-warning-100 text-warning-700',
    danger:   'bg-danger-100 text-danger-700',
    accent:   'bg-accent-100 text-accent-700',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
