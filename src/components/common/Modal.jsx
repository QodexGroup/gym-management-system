import { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) {
      // Store original overflow values
      const originalOverflowY = document.body.style.overflowY;
      const originalPaddingRight = document.body.style.paddingRight;
      
      // Calculate scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Prevent body scrolling but allow horizontal scrolling for tables
      document.body.style.overflowY = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      
      return () => {
        document.body.style.overflowY = originalOverflowY || 'unset';
        document.body.style.paddingRight = originalPaddingRight || 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-5xl',
    full: 'max-w-7xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-dark-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative bg-dark-800 rounded-2xl shadow-xl border border-dark-700 ${sizeClasses[size]} w-full max-h-[90vh] flex flex-col transform transition-all`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700 flex-shrink-0">
            <h2 className="text-lg font-semibold text-dark-50">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 text-dark-400 hover:text-dark-200 hover:bg-dark-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content - Scrollable if needed */}
          <div className="px-6 py-4 overflow-y-auto flex-1 min-h-0">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
