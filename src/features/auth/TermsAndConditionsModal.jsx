import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, FileText } from 'lucide-react';
import { TERMS_INTRO, TERMS_SECTIONS } from './termsAndConditions.content';
import LegalDocumentSections from './LegalDocumentSections';
import { OVERLAY_LAYER_ATTR } from '../../shared/utils/overlayLayers';
import { useBodyScrollLock } from '../../shared/hooks/useBodyScrollLock';

const SCROLL_THRESHOLD = 24;

const TermsAndConditionsModal = ({ isOpen, onAccept, onDecline }) => {
  const scrollRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasReadAll, setHasReadAll] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  useBodyScrollLock(isOpen);

  const updateScrollState = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const maxScroll = scrollHeight - clientHeight;
    const progress = maxScroll <= 0 ? 100 : Math.min(100, (scrollTop / maxScroll) * 100);
    const reachedBottom = maxScroll <= SCROLL_THRESHOLD || scrollTop + clientHeight >= scrollHeight - SCROLL_THRESHOLD;

    setScrollProgress(progress);
    setHasReadAll(reachedBottom);

    // If the user hit the absolute bottom, force the active bubble indicator to the last index
    if (reachedBottom) {
      setActiveSection(TERMS_SECTIONS.length - 1);
    } else {
      const sectionEls = container.querySelectorAll('[data-terms-section]');
      let current = 0;
      sectionEls.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        if (rect.top <= containerRect.top + containerRect.height * 0.35) {
          current = index;
        }
      });
      setActiveSection(current);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const frame = requestAnimationFrame(() => {
      setScrollProgress(0);
      setHasReadAll(false);
      setActiveSection(0);
      updateScrollState();
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen, updateScrollState]);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      <div className="fixed inset-0 bg-dark-900/70 backdrop-blur-sm" />

      <div className="flex h-[100dvh] items-stretch justify-center p-0 sm:items-center sm:p-4">
        <div
          className="relative flex h-full min-h-0 w-full flex-col border-0 bg-dark-800 shadow-2xl sm:h-auto sm:max-h-[90dvh] sm:max-w-2xl sm:rounded-2xl sm:border sm:border-dark-700"
          {...{ [OVERLAY_LAYER_ATTR]: 'terms' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="terms-modal-title"
        >
          <div className="flex-shrink-0 border-b border-dark-700 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4 sm:px-6 sm:pt-5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary-500/15 text-primary-400">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 id="terms-modal-title" className="text-lg font-semibold text-dark-50">
                  Terms and Conditions
                </h2>
                <p className="text-xs text-dark-400 mt-1">
                  Please read through all sections before accepting.
                </p>
              </div>
              <span className="text-xs font-medium text-dark-300 tabular-nums">
                {Math.round(scrollProgress)}%
              </span>
            </div>

            <div className="mt-4 h-1.5 rounded-full bg-dark-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary-500 transition-all duration-150"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {TERMS_SECTIONS.map((section, index) => (
                <span
                  key={section.title}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                    index === activeSection
                      ? 'border-primary-500 bg-primary-500/15 text-primary-300'
                      : index < activeSection
                        ? 'border-dark-600 bg-dark-700 text-dark-300'
                        : 'border-dark-700 bg-dark-800 text-dark-500'
                  }`}
                >
                  {index + 1}
                </span>
              ))}
            </div>
          </div>

          <div className="relative flex-1 min-h-0">
            <div
              ref={scrollRef}
              onScroll={updateScrollState}
              className="h-full overflow-y-auto overscroll-contain px-4 py-4 scroll-smooth sm:px-6"
            >
              <p className="text-sm text-dark-200 leading-relaxed mb-6">{TERMS_INTRO}</p>

              <LegalDocumentSections
                sections={TERMS_SECTIONS}
                activeSection={activeSection}
                sectionAttr="data-terms-section"
              />
            </div>

            {!hasReadAll && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-dark-800 via-dark-800/90 to-transparent flex flex-col items-center justify-end pb-3">
                <div className="flex items-center gap-1.5 text-xs text-primary-300 animate-bounce">
                  <ChevronDown className="w-4 h-4" />
                  <span>Scroll down to read all terms</span>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 space-y-3 border-t border-dark-700 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-4">
            {!hasReadAll && (
              <p className="text-xs text-center text-dark-400">
                The accept button unlocks after you reach the end of the document.
              </p>
            )}
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onDecline}
                className="w-full rounded-lg bg-dark-700 py-2.5 font-semibold text-dark-50 transition hover:bg-dark-600 sm:w-auto sm:flex-1"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={onAccept}
                disabled={!hasReadAll}
                className={`w-full rounded-lg py-2.5 font-semibold transition sm:w-auto sm:flex-[2] ${
                  hasReadAll
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'bg-dark-700 text-dark-500 cursor-not-allowed'
                }`}
              >
                I Accept Terms and Conditions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditionsModal;