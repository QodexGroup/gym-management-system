const DataTable = ({
  columns,
  data,
  keyField = 'id',
  loading,
  emptyMessage = 'No records found',
  onRowClick,
  renderActions,
  title,
  actionButton,
  wrapperClassName = '',
}) => {
  if (loading && (!data || data.length === 0)) {
    return <div className="text-center py-12 text-dark-400">Loading...</div>;
  }

  if (!loading && data.length === 0) {
    const emptyContent = (
      <>
        {(title || actionButton) && (
          <div className="flex items-center justify-between mb-4">
            {title && <h3 className="text-lg font-semibold text-dark-800">{title}</h3>}
            {actionButton}
          </div>
        )}
        <div className="text-center py-12 text-dark-400">{emptyMessage}</div>
      </>
    );
    return wrapperClassName ? <div className={wrapperClassName}>{emptyContent}</div> : emptyContent;
  }

  const tableContent = (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-dark-50">
            {columns.map((col) => (
              <th key={col.key} className="table-header">
                {col.label}
              </th>
            ))}
            {renderActions && (
              <th key="actions" className="table-header">
                Actions
              </th>
            )}
          </tr>
        </thead>

        <tbody className="divide-y divide-dark-100">
          {data.map((row) => (
            <tr
              key={row[keyField]}
              onClick={() => onRowClick?.(row)}
              className={`transition-colors ${
                onRowClick ? 'hover:bg-dark-700 cursor-pointer' : ''
              }`}
            >
              {columns.map((col) => (
                <td key={col.key} className="table-cell">
                  {col.render ? col.render(row) : row[col.key] ?? '-'}
                </td>
              ))}

              {renderActions && (
                <td
                  key="actions"
                  className="table-cell"
                  onClick={(e) => e.stopPropagation()}
                >
                  {renderActions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const content = (
    <>
      {(title || actionButton) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-lg font-semibold text-dark-800">{title}</h3>}
          {actionButton}
        </div>
      )}
      {tableContent}
    </>
  );

  if (wrapperClassName) {
    return <div className={wrapperClassName}>{content}</div>;
  }
  return content;
};

export default DataTable;
