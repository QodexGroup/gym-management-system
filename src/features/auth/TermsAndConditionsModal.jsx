import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, FileText } from 'lucide-react';
import { TERMS_INTRO, TERMS_SECTIONS } from './termsAndConditions.content';
import LegalDocumentSections from './LegalDocumentSections';

const SCROLL_THRESHOLD = 24;

const TermsAndConditionsModal = ({ isOpen, onAccept, onDecline }) => {
  const scrollRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasReadAll, setHasReadAll] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  const updateScrollState = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const maxScroll = scrollHeight - clientHeight;
    const progress = maxScroll <= 0 ? 100 : Math.min(100, (scrollTop / maxScroll) * 100);
    const reachedBottom = maxScroll <= SCROLL_THRESHOLD || scrollTop + clientHeight >= scrollHeight - SCROLL_THRESHOLD;

    setScrollProgress(progress);
    setHasReadAll(reachedBottom);

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
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    setScrollProgress(0);
    setHasReadAll(false);
    setActiveSection(0);

    const frame = requestAnimationFrame(updateScrollState);
    return () => cancelAnimationFrame(frame);
  }, [isOpen, updateScrollState]);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflowY = document.body.style.overflowY;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflowY = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflowY = originalOverflowY || 'unset';
      document.body.style.paddingRight = originalPaddingRight || 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      <div className="fixed inset-0 bg-dark-900/70 backdrop-blur-sm" />

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-dark-800 rounded-2xl shadow-2xl border border-dark-700 max-w-2xl w-full max-h-[90vh] flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="terms-modal-title"
        >
          <div className="px-6 pt-5 pb-4 border-b border-dark-700 flex-shrink-0">
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
              className="h-full max-h-[52vh] overflow-y-auto px-6 py-4 scroll-smooth"
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

          <div className="px-6 py-4 border-t border-dark-700 flex-shrink-0 space-y-3">
            {!hasReadAll && (
              <p className="text-xs text-center text-dark-400">
                The accept button unlocks after you reach the end of the document.
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onDecline}
                className="w-1/3 bg-dark-700 text-dark-50 py-2.5 rounded-lg font-semibold hover:bg-dark-600 transition"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={onAccept}
                disabled={!hasReadAll}
                className={`w-2/3 py-2.5 rounded-lg font-semibold transition ${
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
