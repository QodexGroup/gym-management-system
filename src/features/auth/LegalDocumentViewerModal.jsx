import { useCallback, useEffect, useRef, useState } from 'react';
import { FileText, Shield, X } from 'lucide-react';
import LegalDocumentSections from './LegalDocumentSections';
import { OVERLAY_LAYER_ATTR } from '../../shared/utils/overlayLayers';
import { useBodyScrollLock } from '../../shared/hooks/useBodyScrollLock';

const SCROLL_THRESHOLD = 24;

const LegalDocumentViewerModal = ({
  isOpen,
  onClose,
  title,
  subtitle = 'Review our policy details below.',
  intro,
  sections,
  variant = 'terms',
}) => {
  const scrollRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState(0);

  const sectionAttr = 'data-legal-section';
  const Icon = variant === 'privacy' ? Shield : FileText;
  const iconClass =
    variant === 'privacy'
      ? 'bg-emerald-500/15 text-emerald-400'
      : 'bg-primary-500/15 text-primary-400';
  const progressClass = variant === 'privacy' ? 'bg-emerald-500' : 'bg-primary-500';

  const updateScrollState = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const maxScroll = scrollHeight - clientHeight;
    const progress = maxScroll <= 0 ? 100 : Math.min(100, (scrollTop / maxScroll) * 100);
    const reachedBottom = maxScroll <= SCROLL_THRESHOLD || scrollTop + clientHeight >= scrollHeight - SCROLL_THRESHOLD;

    setScrollProgress(progress);

    // Force active indicator to the last index if scrolled completely to the bottom
    if (reachedBottom && sections.length > 0) {
      setActiveSection(sections.length - 1);
    } else {
      const sectionEls = container.querySelectorAll(`[${sectionAttr}]`);
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
  }, [sectionAttr, sections.length]);

  useEffect(() => {
    if (!isOpen) return;

    const frame = requestAnimationFrame(() => {
      setScrollProgress(0);
      setActiveSection(0);
      updateScrollState();
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen, updateScrollState]);


  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      <div
        className="fixed inset-0 bg-dark-900/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="flex h-[100dvh] items-stretch justify-center p-0 sm:items-center sm:p-4">
        <div
          className="relative flex h-full min-h-0 w-full flex-col border-0 bg-dark-800 shadow-2xl sm:h-auto sm:max-h-[90dvh] sm:max-w-2xl sm:rounded-2xl sm:border sm:border-dark-700"
          {...{ [OVERLAY_LAYER_ATTR]: 'legal-viewer' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-viewer-title"
        >
          <div className="flex-shrink-0 border-b border-dark-700 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4 sm:px-6 sm:pt-5">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${iconClass}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <h2 id="legal-viewer-title" className="truncate text-base font-semibold text-dark-50 sm:text-lg">
                  {title}
                </h2>
                <p className="text-xs text-dark-400 mt-1">{subtitle}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-medium text-dark-300 tabular-nums">
                  {Math.round(scrollProgress)}%
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-dark-400 transition-colors hover:bg-dark-700 hover:text-dark-200 sm:h-10 sm:w-10"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="mt-4 h-1.5 rounded-full bg-dark-700 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-150 ${progressClass}`}
                style={{ width: `${scrollProgress}%` }}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {sections.map((section, index) => (
                <span
                  key={section.title}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                    index === activeSection
                      ? variant === 'privacy'
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                        : 'border-primary-500 bg-primary-500/15 text-primary-300'
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

          <div
            ref={scrollRef}
            onScroll={updateScrollState}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 scroll-smooth sm:px-6"
          >
            <p className="text-sm text-dark-200 leading-relaxed mb-6">{intro}</p>
            <LegalDocumentSections
              sections={sections}
              activeSection={activeSection}
              sectionAttr={sectionAttr}
              variant={variant}
            />
          </div>

          <div className="flex-shrink-0 border-t border-dark-700 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-lg font-semibold bg-dark-700 text-dark-50 hover:bg-dark-600 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalDocumentViewerModal;