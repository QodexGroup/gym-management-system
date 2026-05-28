import { useState, useEffect, useRef, useMemo } from 'react';
import { MoreVertical } from 'lucide-react';

const DEFAULT_MAX_INLINE_ACTIONS = 3;
const MENU_GAP = 4;
const VIEWPORT_PADDING = 8;
const MENU_WIDTH_FALLBACK = 192;

const computeMenuPosition = (triggerRect, menuPosition, menuEl) => {
  const menuWidth = menuEl?.offsetWidth ?? MENU_WIDTH_FALLBACK;
  const menuHeight = menuEl?.offsetHeight ?? 0;

  let top = menuPosition.includes('bottom')
    ? triggerRect.bottom + MENU_GAP
    : triggerRect.top - menuHeight - MENU_GAP;

  let left = menuPosition.includes('right')
    ? triggerRect.right - menuWidth
    : triggerRect.left;

  left = Math.max(
    VIEWPORT_PADDING,
    Math.min(left, window.innerWidth - menuWidth - VIEWPORT_PADDING)
  );
  top = Math.max(
    VIEWPORT_PADDING,
    Math.min(top, window.innerHeight - menuHeight - VIEWPORT_PADDING)
  );

  return { top, left };
};

const INLINE_VARIANT_CLASS = {
  danger: 'table-action-btn--danger',
  warning: 'table-action-btn--warning',
  success: 'table-action-btn--success',
};

const MENU_VARIANT_CLASS = {
  danger: 'table-action-menu-item--danger',
  warning: 'table-action-menu-item--warning',
  success: 'table-action-menu-item--success',
};

const getInlineButtonClass = (variant) =>
  ['table-action-btn', INLINE_VARIANT_CLASS[variant] || 'table-action-btn--default'].join(' ');

const getMenuItemClass = (variant, disabled) => {
  if (disabled) return 'table-action-menu-item table-action-menu-item--disabled';
  const variantClass = MENU_VARIANT_CLASS[variant];
  return variantClass
    ? `table-action-menu-item ${variantClass}`
    : 'table-action-menu-item';
};

const DataTableActions = ({
  items = [],
  onItemClick,
  menuPosition = 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
  maxInlineActions = DEFAULT_MAX_INLINE_ACTIONS,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const actionableItems = useMemo(
    () => items.filter((item) => !item.divider),
    [items]
  );

  const useInlineButtons = actionableItems.length <= maxInlineActions;

  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const updatePosition = () => {
      if (!buttonRef.current) return;
      setPosition(
        computeMenuPosition(
          buttonRef.current.getBoundingClientRect(),
          menuPosition,
          menuRef.current
        )
      );
    };

    updatePosition();

    // Re-measure once the menu mounts so height is accurate for top-* positions.
    const rafId = requestAnimationFrame(updatePosition);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, menuPosition, items]);

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

  if (!actionableItems.length) {
    return null;
  }

  if (useInlineButtons) {
    return (
      <div className="table-action-group" onClick={(e) => e.stopPropagation()}>
        {actionableItems.map((item, index) => {
          const Icon = item.icon;

          if (item.disabled) {
            return (
              <button
                key={item.key || index}
                disabled
                className="table-action-btn table-action-btn--disabled"
                title={item.label}
              >
                {Icon && <Icon className="w-4 h-4" />}
              </button>
            );
          }

          return (
            <button
              key={item.key || index}
              onClick={(e) => handleItemClick(item, e)}
              className={getInlineButtonClass(item.variant)}
              title={item.label}
            >
              {Icon && <Icon className="w-4 h-4" />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="table-action-menu-trigger"
        aria-label="Actions"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="table-action-menu"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item, index) => {
            if (item.divider) {
              return <hr key={`divider-${index}`} className="table-action-menu-divider" />;
            }

            const Icon = item.icon;

            return (
              <button
                key={item.key || index}
                disabled={item.disabled}
                onClick={(e) => !item.disabled && handleItemClick(item, e)}
                className={getMenuItemClass(item.variant, item.disabled)}
              >
                {Icon && <Icon className="w-4 h-4" />}
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
