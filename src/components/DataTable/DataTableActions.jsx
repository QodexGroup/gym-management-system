import { useState, useEffect, useRef } from 'react';
import { MoreVertical } from 'lucide-react';

const DataTableActions = ({
  items = [],
  onItemClick,
  menuPosition = 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const button = buttonRef.current;
      const rect = button.getBoundingClientRect();
      
      // Calculate position based on menuPosition prop
      let top = 0;
      let right = 0;
      
      if (menuPosition.includes('bottom')) {
        top = rect.bottom + 4;
      } else {
        top = rect.top - 4;
      }
      
      if (menuPosition.includes('right')) {
        right = window.innerWidth - rect.right;
      } else {
        right = window.innerWidth - rect.left;
      }
      
      setPosition({ top, right });
    }
  }, [isOpen, menuPosition]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && menuRef.current && buttonRef.current) {
        const isClickInsideMenu = menuRef.current.contains(event.target);
        const isClickOnButton = buttonRef.current.contains(event.target);
        
        if (!isClickInsideMenu && !isClickOnButton) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleItemClick = (item, event) => {
    event?.stopPropagation();
    if (item.onClick) {
      item.onClick();
    } else {
      onItemClick?.(item);
    }
    setIsOpen(false);
  };

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-2 text-dark-400 hover:bg-dark-100 rounded-lg transition-colors"
        aria-label="Actions"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
      
      {isOpen && (
        <div
          ref={menuRef}
          className="fixed w-48 bg-dark-800 rounded-lg shadow-xl border border-dark-700 py-1 z-[100]"
          style={{
            top: `${position.top}px`,
            right: `${position.right}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item, index) => {
            // Handle divider
            if (item.divider) {
              return <hr key={`divider-${index}`} className="my-1 border-dark-700" />;
            }
            
            // Handle disabled items
            if (item.disabled) {
              return (
                <button
                  key={item.key || index}
                  disabled
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-dark-500 cursor-not-allowed opacity-50"
                >
                  {item.icon && <item.icon className="w-4 h-4" />}
                  {item.label}
                </button>
              );
            }
            
            // Regular menu item
            return (
              <button
                key={item.key || index}
                onClick={(e) => handleItemClick(item, e)}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                  item.variant === 'danger'
                    ? 'text-danger-500 hover:bg-danger-500/10'
                    : item.variant === 'warning'
                    ? 'text-warning-500 hover:bg-warning-500/10'
                    : item.variant === 'success'
                    ? 'text-success-500 hover:bg-success-500/10'
                    : 'text-dark-100 hover:bg-dark-700'
                }`}
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DataTableActions;
