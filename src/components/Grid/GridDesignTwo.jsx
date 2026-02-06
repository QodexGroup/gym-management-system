import React from 'react';
import { Edit, Trash } from 'lucide-react';
import { Badge } from '../../components/common';

const GridDesignTwo = ({
  title,
  badge,
  text,
  labels = [],
  footer,
  actions = {},
  listLimit = 4,
  dark = true,
}) => {
  return (
    <div
      className={`card relative p-6 flex flex-col border rounded-lg ${
        dark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
      }`}
    >
      {/* Edit and Delete icons in top right */}
      {(actions.onEdit || actions.onDelete) && (
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {actions.onEdit && (
            <button
              onClick={actions.onEdit}
              className="p-2 text-dark-400 hover:text-dark-200 hover:bg-dark-700 rounded-lg transition-colors"
              aria-label="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {actions.onDelete && (
            <button
              onClick={actions.onDelete}
              className="p-2 text-dark-400 hover:text-danger-500 hover:bg-dark-700 rounded-lg transition-colors"
              aria-label="Delete"
            >
              <Trash className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Title */}
      {title && (
        <h3 className={`text-lg font-bold mb-2 pr-20 ${dark ? 'text-dark-50' : 'text-gray-800'}`}>
          {title}
        </h3>
      )}

      {/* Badge */}
      {badge && (
        <div className="mb-3">
          <Badge variant="default" size="sm">
            {badge}
          </Badge>
        </div>
      )}

      {/* Text/Body */}
      {text && (
        <p className={`text-sm mb-4 line-clamp-2 ${dark ? 'text-dark-300' : 'text-gray-600'}`}>
          {text}
        </p>
      )}

      {/* Labels/List items with icons */}
      {Array.isArray(labels) && labels.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {labels.slice(0, listLimit).map((item, idx) => {
            // Handle object format { icon, label }
            if (typeof item === 'object' && item !== null && item.label) {
              return (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  {item.icon && (
                    <item.icon className={`w-4 h-4 ${dark ? 'text-primary-400' : 'text-primary-500'}`} />
                  )}
                  <span className={dark ? 'text-dark-200' : 'text-gray-700'}>{item.label}</span>
                </div>
              );
            }
            // Handle string format
            if (typeof item === 'string') {
              return (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <span className={dark ? 'text-dark-200' : 'text-gray-700'}>{item}</span>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Footer text at bottom - large and bold */}
      {footer && (
        <div className="mt-auto pt-4 border-t border-dark-100">
          <p className={`text-2xl font-bold ${dark ? 'text-dark-50' : 'text-gray-800'}`}>
            {footer}
          </p>
        </div>
      )}
    </div>
  );
};

export default GridDesignTwo;
