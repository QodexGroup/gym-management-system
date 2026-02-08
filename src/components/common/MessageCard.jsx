/**
 * Reusable card: message + optional description + one action button.
 * Use for "report too large", empty states, or single-action prompts.
 */
const MessageCard = ({
  message,
  description,
  actionLabel,
  onAction,
  icon: Icon,
  className = '',
}) => {
  return (
    <div className={`card no-print text-center py-12 ${className}`}>
      {Icon && <Icon className="w-12 h-12 text-dark-400 mx-auto mb-3" />}
      <p className="text-dark-200 text-lg mb-2">{message}</p>
      {description && <p className="text-dark-400 mb-4">{description}</p>}
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="btn-primary flex items-center gap-2 mx-auto">
          {Icon && <Icon className="w-4 h-4" />}
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default MessageCard;
