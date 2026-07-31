import { useState } from 'react';
import { FileText } from 'lucide-react';
import { getFileUrl } from '../../shared/services/storageService';
import ImageLightbox from './ImageLightbox';

/**
 * Whether a resolved file URL points at a PDF (which the image lightbox can't render).
 *
 * @param {string} url
 * @returns {boolean}
 */
const isPdfUrl = (url) => /\.pdf(\?|$)/i.test(url || '');

/**
 * Preview for a single stored file path (an R2 object path or a full URL) —
 * typically a receipt, scan, or uploaded attachment. Resolves the path with
 * getFileUrl and renders one of:
 *   - image  → a clickable thumbnail that opens a fullscreen lightbox
 *   - PDF    → a "View PDF" link that opens in a new browser tab
 *   - empty  → a muted placeholder
 *
 * By default the component owns its own lightbox, so it is drop-in reusable in
 * any table cell or card without extra wiring. Pass `onView` to control preview
 * externally instead (e.g. to share a single lightbox across many rows); when
 * provided, clicking an image calls `onView(resolvedUrl)` and no internal
 * lightbox is rendered.
 *
 * @param {{
 *   path?: string | null,
 *   onView?: (url: string) => void,
 *   size?: string,
 *   alt?: string,
 *   pdfLabel?: string,
 *   emptyLabel?: string,
 * }} props
 * @returns {JSX.Element}
 */
const FilePreview = ({
  path,
  onView,
  size = 'w-10 h-10',
  alt = 'Attachment',
  pdfLabel = 'View PDF',
  emptyLabel = '—',
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!path) {
    return <span className="text-dark-500">{emptyLabel}</span>;
  }

  const url = getFileUrl(path);

  // PDFs can't render in the image lightbox — open them in a new tab instead.
  if (isPdfUrl(url)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-primary-400 hover:text-primary-300 text-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <FileText className="w-4 h-4" />
        {pdfLabel}
      </a>
    );
  }

  /**
   * Open the image — via the parent handler when controlled, otherwise the
   * component's own lightbox.
   *
   * @param {React.MouseEvent} e
   * @returns {void}
   */
  const handleClick = (e) => {
    e.stopPropagation();
    if (onView) onView(url);
    else setLightboxOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title={alt}
        className={`block ${size} rounded-lg overflow-hidden border border-dark-200 hover:ring-2 hover:ring-primary-500 transition`}
      >
        <img src={url} alt={alt} className="w-full h-full object-cover" />
      </button>

      {!onView && lightboxOpen && (
        <ImageLightbox image={url} onClose={() => setLightboxOpen(false)} />
      )}
    </>
  );
};

export default FilePreview;
