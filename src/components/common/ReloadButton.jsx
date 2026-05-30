import { RefreshCw, Loader2 } from 'lucide-react';

/**
 * Reload / Reloading button for tab pages.
 * Shows a spinner + "Reloading..." while the query is refetching,
 * then reverts to the clickable "Reload" button once data is fresh.
 */
const ReloadButton = ({ onReload, isReloading = false }) => {
  if (isReloading) {
    return (
      <button
        disabled
        className="btn-secondary flex items-center gap-2 opacity-60 cursor-not-allowed"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Reloading...
      </button>
    );
  }

  return (
    <button
      onClick={onReload}
      className="btn-secondary flex items-center gap-2"
      title="Reload"
    >
      <RefreshCw className="w-4 h-4" />
      Reload
    </button>
  );
};

export default ReloadButton;
