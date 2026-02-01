import { useState, useCallback } from 'react';

export const usePagination = (initialPage = 1) => {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const goToNext = useCallback((lastPage) => {
    setCurrentPage((prev) => Math.min(prev + 1, lastPage));
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  return { currentPage, setCurrentPage, goToNext, goToPrev };
};
