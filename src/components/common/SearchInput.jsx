import { Search, X } from 'lucide-react';

const sizeClasses = {
  sm: 'py-1.5 text-sm',
  md: 'py-2.5 text-sm',
  lg: 'py-3 text-base',
};

const SearchInput = ({
  value = '',
  onChange,
  onClear,
  size = 'md',
  dark = true,
  placeholder = 'Search...',
  autoFocus = false,
  className = '',
  inputClassName = '',
}) => {
  const base = dark
    ? 'bg-dark-700 border-dark-600 text-dark-50 placeholder-dark-400 focus:bg-dark-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100';

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={`w-full pl-9 ${onClear && value ? 'pr-9' : 'pr-4'} ${sizeClasses[size] || sizeClasses.md} border rounded-xl outline-none transition-all ${base} ${inputClassName}`}
      />
      {onClear && value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
