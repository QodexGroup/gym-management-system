const Avatar = ({ src, name, size = 'md', status }) => {
  const sizeClasses = {
    xs: 'w-7 h-7',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const statusClasses = {
    online: 'bg-success-500',
    offline: 'bg-dark-400',
    away: 'bg-warning-500',
    busy: 'bg-danger-500',
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative inline-block shrink-0">
      {src ? (
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden shrink-0`}>
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-primary-100 text-primary-600 font-semibold flex items-center justify-center ${size === 'xs' ? 'text-[10px]' : ''}`}
        >
          {getInitials(name)}
        </div>
      )}
      {status && (
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 ${statusClasses[status]} border-2 border-white rounded-full`}
        />
      )}
    </div>
  );
};

export default Avatar;
