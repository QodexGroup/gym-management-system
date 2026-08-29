import { useCallback, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { isTopOverlayLayer, OVERLAY_LAYER_ATTR } from '../../shared/utils/overlayLayers';

/** Horizontal travel (px) that counts as a swipe rather than a tap. */
const SWIPE_THRESHOLD = 50;

/**
 * Full-screen image viewer.
 *
 * On phones the chrome is laid out in a column — a top bar and a bottom nav bar
 * sandwich the image — so the controls never sit on top of the picture the way
 * absolutely-positioned arrows do on a narrow screen. From `sm` up the arrows
 * move back to the sides. Swiping left/right also pages through the set.
 *
 * @param {Object} props
 * @param {string} props.image - Source of the currently shown image.
 * @param {string[]} [props.images=[]] - Full set, used for counter and paging.
 * @param {number} [props.currentIndex=0]
 * @param {() => void} props.onClose
 * @param {() => void} [props.onPrevious]
 * @param {() => void} [props.onNext]
 * @returns {JSX.Element|null}
 */
const ImageLightbox = ({
  image,
  images = [],
  currentIndex = 0,
  onClose,
  onPrevious,
  onNext
}) => {
  const rootRef = useRef(null);
  const touchStartX = useRef(null);

  const hasMultipleImages = images.length > 1;
  const canGoPrevious = hasMultipleImages && currentIndex > 0;
  const canGoNext = hasMultipleImages && currentIndex < images.length - 1;

  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches?.[0]?.clientX ?? null;
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      if (touchStartX.current === null) return;
      const endX = e.changedTouches?.[0]?.clientX ?? touchStartX.current;
      const delta = endX - touchStartX.current;
      touchStartX.current = null;

      if (Math.abs(delta) < SWIPE_THRESHOLD) return;
      if (delta > 0 && canGoPrevious) onPrevious?.();
      if (delta < 0 && canGoNext) onNext?.();
    },
    [canGoPrevious, canGoNext, onPrevious, onNext]
  );

  useEffect(() => {
    if (!image) return;

    const onKeyDown = (event) => {
      // The lightbox usually opens from inside a modal; only the top-most layer
      // may act, so one Escape does not also close the modal underneath.
      if (!isTopOverlayLayer(rootRef.current)) return;

      if (event.key === 'Escape') onClose?.();
      if (event.key === 'ArrowLeft' && canGoPrevious) onPrevious?.();
      if (event.key === 'ArrowRight' && canGoNext) onNext?.();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [image, onClose, onPrevious, onNext, canGoPrevious, canGoNext]);

  if (!image) return null;

  const navButtonClass =
    'inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 hover:text-gray-300 disabled:opacity-30';

  return (
    <div
      ref={rootRef}
      {...{ [OVERLAY_LAYER_ATTR]: 'lightbox' }}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      className="fixed inset-0 z-50 flex flex-col bg-black/90"
      onClick={onClose}
    >
      {/* Top bar: counter and close, clear of the image on every screen size */}
      <div className="flex flex-none items-center justify-between gap-2 px-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 sm:px-4">
        {hasMultipleImages ? (
          <span className="min-w-0 truncate rounded-full bg-black/60 px-3 py-1 text-xs text-white sm:text-sm">
            {currentIndex + 1} / {images.length}
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close image viewer"
          className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 hover:text-gray-300"
        >
          <X className="h-6 w-6 sm:h-8 sm:w-8" />
        </button>
      </div>

      {/* Image stage */}
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={image}
          alt="Image"
          className="max-h-full max-w-full rounded-lg object-contain"
        />

        {/* Side arrows from sm up, where there is room beside the image */}
        {canGoPrevious && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrevious?.();
            }}
            aria-label="Previous image"
            className={`absolute left-2 top-1/2 hidden -translate-y-1/2 sm:inline-flex ${navButtonClass}`}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {canGoNext && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext?.();
            }}
            aria-label="Next image"
            className={`absolute right-2 top-1/2 hidden -translate-y-1/2 sm:inline-flex ${navButtonClass}`}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Bottom nav on phones, where side arrows would cover the image */}
      {hasMultipleImages && (
        <div
          className="flex flex-none items-center justify-center gap-8 px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onPrevious}
            disabled={!canGoPrevious}
            aria-label="Previous image"
            className={navButtonClass}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!canGoNext}
            aria-label="Next image"
            className={navButtonClass}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageLightbox;
