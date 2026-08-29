import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { useBodyScrollLock } from '../../shared/hooks/useBodyScrollLock';
import { isTopOverlayLayer, OVERLAY_LAYER_ATTR } from '../../shared/utils/overlayLayers';

/** Elements that can receive focus, used to keep Tab cycling inside the dialog. */
const FOCUSABLE =
  'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable]';

/**
 * Responsive modal shell.
 *
 * Layout: on phones (< 640px) the dialog is a full-bleed sheet — edge to edge,
 * square corners, sticky header — so narrow screens keep every pixel of width.
 * From `sm` up it becomes the familiar centred, rounded card capped by `size`.
 *
 * Height is `h-full` capped by `max-h-[100dvh]`: `dvh` measures the *visible*
 * viewport on iOS/Android, where the collapsing URL bar makes the fixed layer
 * taller than the screen and pushes form action rows out of reach. Browsers
 * without `dvh` simply ignore the cap and keep the previous behaviour.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {React.ReactNode} props.title
 * @param {React.ReactNode} props.children
 * @param {'sm'|'md'|'lg'|'xl'|'full'} [props.size='md']
 * @param {boolean} [props.closable=true] - When false, hides the X and ignores backdrop/Escape.
 * @returns {JSX.Element|null}
 */
const Modal = ({ isOpen, onClose, title, children, size = 'md', closable = true }) => {
  const panelRef = useRef(null);
  const titleId = useId();

  useBodyScrollLock(isOpen);

  // Escape to dismiss, and Tab kept inside the dialog so focus cannot wander
  // behind the backdrop (tablet keyboards and screen readers rely on this).
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event) => {
      // Several overlays can be open at once (a modal that opens the image
      // lightbox, or a modal stacked on a modal). Only the top-most layer may
      // act on the keyboard, otherwise one Escape closes the whole stack and
      // the traps fight over focus.
      if (!isTopOverlayLayer(panelRef.current)) return;

      if (event.key === 'Escape' && closable) {
        event.stopPropagation();
        onClose?.();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = Array.from(panelRef.current.querySelectorAll(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (focusable.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, closable, onClose]);

  // Move focus to the panel itself — never to the first field, which would pop
  // the soft keyboard on every phone the moment a modal opens — and hand focus
  // back to the trigger on close.
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement;
    panelRef.current?.focus?.({ preventScroll: true });

    return () => {
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus?.({ preventScroll: true });
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Caps apply from `sm` up only; below that the sheet is intentionally full width.
  const sizeClasses = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-5xl',
    full: 'sm:max-w-7xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-dark-900/50 backdrop-blur-sm transition-opacity"
        onClick={closable ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Positioning frame: full-bleed sheet on phones, centred card from sm up */}
      <div className="flex h-full max-h-[100dvh] items-stretch justify-center p-0 sm:items-center sm:p-4">
        <div
          ref={panelRef}
          {...{ [OVERLAY_LAYER_ATTR]: 'modal' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          tabIndex={-1}
          className={`relative flex h-full min-h-0 w-full transform flex-col border-0 bg-dark-800 shadow-xl outline-none transition-all sm:h-auto sm:max-h-[90dvh] sm:rounded-2xl sm:border sm:border-dark-700 ${sizeClasses[size]}`}
        >
          {/* Header */}
          <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-dark-700 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 sm:px-6 sm:pt-4">
            <h2 id={titleId} className="min-w-0 flex-1 truncate text-base font-semibold text-dark-50 sm:text-lg">
              {title}
            </h2>
            {closable && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="-mr-1 inline-flex h-11 w-11 flex-none items-center justify-center rounded-lg text-dark-400 transition-colors hover:bg-dark-700 hover:text-dark-200 sm:-mr-2 sm:h-10 sm:w-10"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Content — the single scroll region */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
