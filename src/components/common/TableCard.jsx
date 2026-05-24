import DataTable from '../DataTable';
import Pagination from './Pagination';
import SectionCard from './SectionCard';

const TableCard = ({
  // SectionCard props
  title,
  actions,
  className = '',
  // DataTable props
  columns,
  data,
  loading,
  emptyMessage,
  onRowClick,
  keyField,
  // Pagination props
  pagination,
  currentPage,
  onPrevPage,
  onNextPage,
  showPaginationInfo = true,
}) => {
  return (
    <SectionCard title={title} actions={actions} className={className} noPadding={false}>
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyMessage={emptyMessage}
        onRowClick={onRowClick}
        keyField={keyField}
      />
      {pagination && pagination.lastPage > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            lastPage={pagination.lastPage}
            from={showPaginationInfo ? pagination.from : undefined}
            to={showPaginationInfo ? pagination.to : undefined}
            total={showPaginationInfo ? pagination.total : undefined}
            onPrev={onPrevPage}
            onNext={() => onNextPage(pagination.lastPage)}
          />
        </div>
      )}
    </SectionCard>
  );
};

export default TableCard;
