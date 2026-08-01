import { HardDrive, AlertTriangle } from 'lucide-react';
import { useStorageUsage } from '../../shared/hooks/useStorage';
import SkeletonLoader from './SkeletonLoader';

/**
 * Account storage usage card — progress bar + labels, with near-limit/full
 * warnings. Self-fetches via useStorageUsage; pass `usage` to render from
 * existing data instead of fetching.
 *
 * @param {{ usage?: StorageUsage|null, className?: string }} props
 * @returns {JSX.Element|null}
 */
const StorageUsageCard = ({ usage: usageProp = null, className = '' }) => {
  const { data: fetched, isLoading } = useStorageUsage({ enabled: !usageProp });
  const usage = usageProp || fetched;

  if (!usageProp && isLoading) {
    return (
      <div className={`bg-dark-800 border border-dark-700 rounded-xl shadow-soft p-5 ${className}`}>
        <SkeletonLoader type="lines" />
      </div>
    );
  }

  if (!usage) return null;

  const percent = Math.min(100, Number(usage.usedPercent) || 0);
  const isFull = usage.isFull;
  const isNearLimit = usage.isNearLimit;

  // green (healthy) → amber (near limit) → red (full)
  const barColor = isFull ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-primary-500';
  const percentColor = isFull ? 'text-red-400' : isNearLimit ? 'text-amber-400' : 'text-dark-300';

  return (
    <div className={`bg-dark-800 border border-dark-700 rounded-xl shadow-soft p-5 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-primary-400" />
          <h3 className="text-sm font-semibold text-dark-50">Storage</h3>
        </div>
        <span className={`text-sm font-medium ${percentColor}`}>{percent}%</span>
      </div>

      <div className="w-full h-2.5 bg-dark-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-2 text-xs text-dark-400">
        <span>{usage.usedLabel} used</span>
        <span>{usage.limitLabel} total</span>
      </div>

      {(isFull || isNearLimit) && (
        <div
          className={`flex items-start gap-2 mt-3 text-xs rounded-lg p-2.5 ${
            isFull ? 'bg-red-500/10 text-red-300' : 'bg-amber-500/10 text-amber-300'
          }`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {isFull
              ? `You've reached your ${usage.limitLabel} limit. Delete files to free up space before uploading more.`
              : `You're running low on storage — ${usage.remainingLabel} left of ${usage.limitLabel}.`}
          </span>
        </div>
      )}
    </div>
  );
};

export default StorageUsageCard;
