import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy, Download, Link2, ShieldAlert } from 'lucide-react';
import { SectionCard } from '../../../components/common';
import { Toast } from '../../../shared/utils/alert';
import { buildPublicRegistrationUrl } from '../../../shared/constants/accountSystemSettings';

/** Rendered QR size, and the export size for the downloadable PNG. */
const QR_DISPLAY_SIZE = 176;
const QR_EXPORT_SIZE = 1024;

/**
 * The gym's permanent public registration link, with a copyable URL and a
 * printable QR code.
 *
 * The link is deliberately immutable — gyms print the QR on tarpaulins and
 * posters, so there is no regenerate action anywhere in this UI. The enable
 * toggle is the only way to switch it off, which the copy here says plainly.
 *
 * @param {{ publicCode: string, isEnabled: boolean, gymName?: string }} props
 * @returns {JSX.Element}
 */
const PublicLinkCard = ({ publicCode, isEnabled, gymName = 'gym' }) => {
  const qrWrapperRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const url = buildPublicRegistrationUrl(publicCode);

  /**
   * Copy the registration URL to the clipboard.
   *
   * @returns {Promise<void>}
   */
  const handleCopy = async () => {
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      Toast.success('Registration link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Clipboard write failed:', error);
      Toast.error('Could not copy. Please select the link and copy it manually.');
    }
  };

  /**
   * Rasterise the inline QR SVG and download it as a high-resolution PNG,
   * large enough to survive being printed on signage.
   *
   * @returns {void}
   */
  const handleDownloadQr = () => {
    const svg = qrWrapperRef.current?.querySelector('svg');
    if (!svg) return;

    const serialized = new XMLSerializer().serializeToString(svg);
    const svgUrl = `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(serialized)))}`;
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = QR_EXPORT_SIZE;
      canvas.height = QR_EXPORT_SIZE;

      const context = canvas.getContext('2d');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, QR_EXPORT_SIZE, QR_EXPORT_SIZE);
      context.drawImage(image, 0, 0, QR_EXPORT_SIZE, QR_EXPORT_SIZE);

      const link = document.createElement('a');
      link.download = `${gymName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-registration-qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    image.onerror = () => Toast.error('Could not generate the QR image.');
    image.src = svgUrl;
  };

  if (!publicCode) {
    return (
      <SectionCard title="Public registration link" icon={Link2}>
        <p className="text-sm text-dark-400">
          This account does not have a registration code yet. Run the pending database
          migrations, then reload this page.
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Public registration link"
      subtitle="Share this link, or print the QR code, so new members can register themselves."
      icon={Link2}
    >
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0 space-y-4">
          <div>
            <label className="label" htmlFor="public-registration-url">Registration URL</label>
            <div className="flex gap-2">
              <input
                id="public-registration-url"
                type="text"
                readOnly
                value={url}
                onFocus={(event) => event.target.select()}
                className="input flex-1 font-mono text-sm"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="btn-secondary flex items-center gap-2 shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-success-500" /> : <Copy className="w-4 h-4" />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-warning-500/40 bg-warning-500/10 p-4">
            <div className="flex gap-3">
              <ShieldAlert className="w-5 h-5 text-warning-600 shrink-0 mt-0.5" />
              <div className="text-sm text-dark-200">
                <p className="font-semibold text-dark-100">This link is permanent.</p>
                <p className="mt-1 text-dark-300">
                  It never changes, so a printed QR code keeps working. That also means it
                  cannot be revoked — if it is ever shared too widely, switching
                  <span className="font-medium text-dark-100"> Enable public registration </span>
                  off is the only way to stop it.
                </p>
              </div>
            </div>
          </div>

          {!isEnabled && (
            <p className="text-sm text-dark-400">
              Registration is currently switched off, so this link shows a
              &ldquo;not available&rdquo; page to anyone who opens it.
            </p>
          )}
        </div>

        <div className="flex flex-col items-center gap-3 shrink-0">
          <div ref={qrWrapperRef} className="rounded-xl bg-white p-3">
            <QRCodeSVG value={url} size={QR_DISPLAY_SIZE} level="M" />
          </div>
          <button
            type="button"
            onClick={handleDownloadQr}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            Download QR
          </button>
        </div>
      </div>
    </SectionCard>
  );
};

export default PublicLinkCard;
