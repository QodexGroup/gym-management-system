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
  const header = (title || actionButton) && (
    <div className="flex items-center justify-between mb-4">
      {title && <h3 className="text-lg font-semibold text-dark-50">{title}</h3>}
      {actionButton}
    </div>
  );

  const tableContent = (
    <div className="relative min-h-[120px]">
      {loading ? (
        /* ── Loading (initial or refetch): spinner only, no stale rows ── */
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-dark-800/60 backdrop-blur-[1px]">
          <div className="w-8 h-8 animate-spin rounded-full border-[3px] border-primary-500 border-t-transparent" />
        </div>
      ) : !data || data.length === 0 ? (
        /* ── Empty ── */
        <div className="flex items-center justify-center h-[120px] text-dark-400">
          {emptyMessage}
        </div>
      ) : (
        /* ── Data ── */
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-50">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={[
                      'table-header',
                      col.headerClassName,
                      col.sticky === 'left' && 'table-header--sticky-left',
                      col.sticky === 'right' && 'table-header--sticky-right',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {col.label}
                  </th>
                ))}
                {renderActions && (
                  <th key="actions" className="table-header table-header--actions table-header--sticky-right">
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
                    <td
                      key={col.key}
                      className={[
                        'table-cell',
                        col.cellClassName,
                        col.sticky === 'left' && 'table-cell--sticky-left',
                        col.sticky === 'right' && 'table-cell--sticky-right',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {col.render ? col.render(row) : row[col.key] ?? '-'}
                    </td>
                  ))}

                  {renderActions && (
                    <td
                      key="actions"
                      className="table-cell table-cell--actions table-cell--sticky-right"
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
      )}
    </div>
  );

  const content = (
    <>
      {header}
      {tableContent}
    </>
  );

  if (wrapperClassName) {
    return <div className={wrapperClassName}>{content}</div>;
  }
  return content;
};

export default DataTable;
