import React, { useState } from 'react';
import { Check, Eye, Edit, Trash } from 'lucide-react';
import { Badge } from '../../components/common';

const GridDesignOne = ({
  title,
  subtitle,
  list = [],
  actions = {},
  listLimit = 4,
  color = 'primary',
  highlightBadge,       // optional badge text
  footer = [],          // array of { icon: IconComponent, label: string }
}) => {
  const [showAll, setShowAll] = useState(false);
  const visibleList = showAll ? list : list.slice(0, listLimit);

  return (
    <div
      className={`card relative overflow-hidden flex flex-col p-6 border rounded-lg ${
        highlightBadge ? 'ring-2 ring-primary-500' : ''
      }`}
    >
      {/* Badge */}
      {highlightBadge && (
        <div className="absolute top-4 right-4">
          <Badge variant="primary">{highlightBadge}</Badge>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-dark-50">{title}</h3>
        <div className="flex items-baseline gap-1 mt-2">
            {subtitle && <p className="text-2xl font-bold text-primary-600">{subtitle}</p>}
        </div>
        
      </div>

      {/* List */}
      {list.length > 0 && (
        <div className="space-y-2 mb-4 flex-1">
          {visibleList.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="w-5 h-5 bg-success-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm text-dark-200">{item}</span>
            </div>
          ))}

          {list.length > listLimit && !showAll && actions.onView && (
            <button
              className="w-full mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-1 transition-colors"
              onClick={() => {
                setShowAll(true);
                actions.onView?.();
              }}
            >
              <Eye className="w-4 h-4" /> View More Details ({list.length - listLimit} more)
            </button>
          )}
        </div>
      )}

      {/* Footer */}
      {(footer.length > 0 || actions.onEdit || actions.onDelete) && (
        <div className="pt-4 border-t border-dark-100 mt-auto">
          {footer.length > 0 && (
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              {footer.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-dark-500 text-sm">
                  {item.icon && <item.icon className="w-4 h-4" />}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          )}

          {(actions.onEdit || actions.onDelete) && (
            <div className="flex gap-2">
              {actions.onEdit && (
                <button
                  onClick={actions.onEdit}
                  className="flex-1 btn-secondary flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" /> Edit
                </button>
              )}
              {actions.onDelete && (
                <button
                  onClick={actions.onDelete}
                  className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                >
                  <Trash className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GridDesignOne;
