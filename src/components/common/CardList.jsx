/**
 * CardList - Reusable component for rendering a list of cards with built-in design
 * Similar to SearchAndFilter, handles the UX design internally
 * 
 * @param {Array} cards - Array of card data objects
 * @param {Function} renderTitle - Function to render card title: (card) => ReactNode
 * @param {Function} renderSubtitle - Function to render card subtitle: (card) => ReactNode (optional)
 * @param {Function} renderContent - Function to render card content/metadata: (card) => ReactNode
 * @param {Function} renderFooter - Function to render card footer: (card) => ReactNode (optional)
 * @param {Array} badges - Array of badge configs: [{ variant, label, getValue: (card) => value }] (optional)
 * @param {Object} actions - Object containing action handlers: { onEdit, onDelete, onView, etc. }
 * @param {Function} renderActions - Custom function to render action buttons: (card, actions) => ReactNode (optional)
 * @param {ReactNode} emptyState - Custom empty state component
 * @param {string} emptyStateMessage - Message to show when no cards
 * @param {ReactNode} emptyStateIcon - Icon to show in empty state
 */
import { Edit, Trash, Eye } from 'lucide-react';
import Badge from './Badge';

const CardList = ({ 
  cards = [], 
  renderTitle,
  renderSubtitle,
  renderContent,
  renderFooter,
  badges = [],
  actions = {},
  renderActions,
  emptyState,
  emptyStateMessage = 'No items found',
  emptyStateIcon: EmptyStateIcon = null,
}) => {
  if (!Array.isArray(cards) || cards.length === 0) {
    if (emptyState) {
      return emptyState;
    }
    
    return (
      <div className="text-center py-12">
        {EmptyStateIcon && <EmptyStateIcon className="w-16 h-16 text-dark-400 mx-auto mb-4" />}
        <p className="text-dark-400">{emptyStateMessage}</p>
      </div>
    );
  }

  if (!renderTitle || typeof renderTitle !== 'function') {
    console.warn('CardList: renderTitle prop is required and must be a function');
    return null;
  }

  // Default action buttons renderer
  const defaultRenderActions = (card) => {
    const actionButtons = [];
    
    if (actions.onView) {
      actionButtons.push(
        <button
          key="view"
          onClick={() => actions.onView(card)}
          className="p-2 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          title="View"
        >
          <Eye className="w-4 h-4" />
        </button>
      );
    }
    
    if (actions.onEdit) {
      actionButtons.push(
        <button
          key="edit"
          onClick={() => actions.onEdit(card)}
          className="p-2 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          title="Edit"
        >
          <Edit className="w-4 h-4" />
        </button>
      );
    }
    
    if (actions.onDelete) {
      actionButtons.push(
        <button
          key="delete"
          onClick={() => actions.onDelete(card.id || card.key)}
          className="p-2 text-dark-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
          title="Delete"
        >
          <Trash className="w-4 h-4" />
        </button>
      );
    }
    
    return actionButtons.length > 0 ? <div className="flex items-center gap-2">{actionButtons}</div> : null;
  };

  return (
    <div className="space-y-4">
      {cards.map((card, index) => {
        if (!card) return null;
        
        return (
          <div
            key={card.id || card.key || index}
            className="bg-dark-800 rounded-xl border border-dark-700 p-6 hover:border-primary-500 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                {/* Title and Badges */}
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <div className="font-semibold text-dark-50 text-lg">
                    {renderTitle(card)}
                  </div>
                  {badges.map((badge, badgeIndex) => {
                    const value = badge.getValue ? badge.getValue(card) : badge.value;
                    if (!value && value !== 0) return null;
                    const variant = badge.getVariant 
                      ? badge.getVariant(card) 
                      : (typeof badge.variant === 'function' ? badge.variant(card) : (badge.variant || 'default'));
                    return (
                      <Badge key={badgeIndex} variant={variant}>
                        {badge.label ? `${badge.label}: ${value}` : value}
                      </Badge>
                    );
                  })}
                </div>
                
                {/* Subtitle */}
                {renderSubtitle && (
                  <div className="text-sm text-dark-300 mb-3">
                    {renderSubtitle(card)}
                  </div>
                )}
                
                {/* Content/Metadata */}
                {renderContent && (
                  <div className="text-sm text-dark-300">
                    {renderContent(card)}
                  </div>
                )}
                
                {/* Footer */}
                {renderFooter && (
                  <div className="mt-2">
                    {renderFooter(card)}
                  </div>
                )}
              </div>
              
              {/* Actions */}
              {renderActions ? renderActions(card, actions) : defaultRenderActions(card)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CardList;
