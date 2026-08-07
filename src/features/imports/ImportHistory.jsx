import { useMemo } from 'react';
import DataTable from '../../components/DataTable';
import { Pagination } from '../../components/common';
import { useImportHistory } from '../../shared/hooks/useImports';
import { usePagination } from '../../shared/hooks/usePagination';
import { importService } from '../../shared/services/importService';
import { Toast } from '../../shared/utils/alert';
import { importHistoryColumns } from './importHistoryTable.config';

/**
 * Past imports for the account, with a link to re-download each error report.
 * @returns {JSX.Element}
 */
const ImportHistory = () => {
  const { currentPage, goToPrev, goToNext } = usePagination(1);
  const pageSize = 15;

  const options = useMemo(() => ({ page: currentPage, pagelimit: pageSize }), [currentPage]);
  const { data, isLoading } = useImportHistory(options);

  const jobs = Array.isArray(data?.data) ? data.data : [];
  const pagination = data?.pagination;

  /** Download the error report for a history row. */
  const handleDownload = (job) => {
    importService
      .downloadResult(job.id, 'import-errors.csv')
      .catch((e) => Toast.error(e.message || 'Could not download the error report'));
  };

  const columns = useMemo(() => importHistoryColumns({ onDownload: handleDownload }), []);

  return (
    <div className="space-y-4">
      <div className="card">
        <DataTable columns={columns} data={jobs} loading={isLoading} />
      </div>

      {!isLoading && jobs.length === 0 && (
        <div className="text-center py-12 text-dark-400">No imports yet.</div>
      )}

      {pagination && pagination.lastPage > 1 && (
        <Pagination
          currentPage={currentPage}
          lastPage={pagination.lastPage}
          from={pagination.from}
          to={pagination.to}
          total={pagination.total}
          onPrev={goToPrev}
          onNext={() => goToNext(pagination.lastPage)}
        />
      )}
    </div>
  );
};

export default ImportHistory;
