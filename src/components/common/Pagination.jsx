// components/common/Pagination.jsx
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, lastPage, from, to, total, onPrev, onNext }) => {
  if (!lastPage || lastPage <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-6 pt-6 border-t border-dark-200">
      <div className="text-sm text-dark-300">
        Showing {from} to {to} of {total} items
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-dark-600 hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-dark-300"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-4 py-2 text-sm text-dark-300">
          Page {currentPage} of {lastPage}
        </span>
        <button
          onClick={onNext}
          disabled={currentPage === lastPage}
          className="p-2 rounded-lg border border-dark-600 hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-dark-300"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
