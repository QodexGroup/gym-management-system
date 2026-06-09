import { useCallback, useEffect, useRef, useState } from 'react';
import { FileText, Shield, X } from 'lucide-react';
import LegalDocumentSections from './LegalDocumentSections';

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

    setScrollProgress(0);
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
      <div
        className="fixed inset-0 bg-dark-900/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-dark-800 rounded-2xl shadow-2xl border border-dark-700 max-w-2xl w-full max-h-[90vh] flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-viewer-title"
        >
          <div className="px-6 pt-5 pb-4 border-b border-dark-700 flex-shrink-0">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${iconClass}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <h2 id="legal-viewer-title" className="text-lg font-semibold text-dark-50">
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
                  className="p-2 text-dark-400 hover:text-dark-200 hover:bg-dark-700 rounded-lg transition-colors"
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
            className="flex-1 min-h-0 max-h-[58vh] overflow-y-auto px-6 py-4 scroll-smooth"
          >
            <p className="text-sm text-dark-200 leading-relaxed mb-6">{intro}</p>
            <LegalDocumentSections
              sections={sections}
              activeSection={activeSection}
              sectionAttr={sectionAttr}
              variant={variant}
            />
          </div>

          <div className="px-6 py-4 border-t border-dark-700 flex-shrink-0">
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