import { useState } from 'react';
import { Gift, Copy, Check, Users } from 'lucide-react';
import { useReferralSummary } from '../../shared/hooks/useReferral';
import { Toast } from '../../shared/utils/alert';

/**
 * Referral / invitation card shown on the My Account page (account owner only).
 * Owner shares an invite link; when an invitee subscribes to a paid plan and makes their
 * first successful payment, the owner earns a one-time 5% discount on their next invoice.
 */
const ReferralCard = () => {
  const { data: summary, isLoading, isError } = useReferralSummary();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!summary?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(summary.shareUrl);
      setCopied(true);
      Toast.success('Invite link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Copy failed:', error);
      Toast.error('Could not copy link');
    }
  };

  const percent = summary?.discountPercent ?? 5;

  const renderStatus = () => {
    if (summary?.isEligibleNextInvoice) {
      return (
        <p className="text-sm font-medium text-success-600">
          A {percent}% discount will apply to your next invoice.
        </p>
      );
    }
    if ((summary?.totalDiscountsEarned ?? 0) > 0) {
      return (
        <p className="text-sm text-dark-500">
          You&apos;ve earned {summary.totalDiscountsEarned} referral discount
          {summary.totalDiscountsEarned > 1 ? 's' : ''}. Invite another owner to earn {percent}% again.
        </p>
      );
    }
    return (
      <p className="text-sm text-dark-500">
        Invite a gym owner. When they subscribe to a paid plan and make their first payment,
        you get {percent}% off your next invoice. Invite again anytime to earn it again.
      </p>
    );
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary-100 rounded-xl">
          <Gift className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-dark-50">Invite &amp; Earn</h3>
          <p className="text-sm text-dark-400">Share your link to earn {percent}% off an invoice</p>
        </div>
      </div>

      {isLoading && (
        <div className="h-24 animate-pulse rounded-xl bg-dark-100/40" />
      )}

      {isError && !isLoading && (
        <p className="text-sm text-danger-600">Could not load your referral details. Please try again.</p>
      )}

      {summary && !isLoading && (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-dark-400">Your invite link</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={summary.shareUrl}
                onFocus={(e) => e.target.select()}
                className="input flex-1 text-sm"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="btn-secondary flex items-center gap-2 whitespace-nowrap"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="mt-1 text-xs text-dark-400">
              Referral code: <span className="font-semibold text-dark-50">{summary.code}</span>
            </p>
          </div>

          {renderStatus()}

          <div className="flex items-center gap-6 pt-4 border-t border-dark-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-dark-400" />
              <span className="text-sm text-dark-500">
                <span className="font-semibold text-dark-50">{summary.pendingCount ?? 0}</span> pending
              </span>
            </div>
            <div className="text-sm text-dark-500">
              <span className="font-semibold text-dark-50">{summary.qualifiedCount ?? 0}</span> qualified
            </div>
            <div className="text-sm text-dark-500">
              <span className="font-semibold text-dark-50">{summary.totalDiscountsEarned ?? 0}</span> discounts earned
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralCard;
