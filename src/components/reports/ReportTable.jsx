/**
 * Reusable report data table. Headers + rows, optional empty message and custom cell render.
 * headers: string[]
 * rows: array of objects (keys should match header keys or use renderRow)
 * renderRow(row): optional - return array of cell content for the row
 * emptyMessage: string
 */
const ReportTable = ({
  headers = [],
  rows = [],
  keyField = 'id',
  renderRow,
  emptyMessage = 'No records',
  title,
  actionButton,
  className = '',
}) => {
  return (
    <div className={`card no-print ${className}`}>
      {(title || actionButton) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-lg font-semibold text-dark-800">{title}</h3>}
          {actionButton}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-dark-50">
              {headers.map((h) => (
                <th key={h} className="table-header">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-100">
            {rows.map((row) => {
              const cells = renderRow ? renderRow(row) : headers.map((key) => row[key] ?? '-');
              const key = typeof row === 'object' && row[keyField] != null ? row[keyField] : Math.random();
              return (
                <tr key={key} className="hover:bg-dark-50">
                  {cells.map((cell, i) => (
                    <td key={i} className="table-cell">
                      {cell}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="text-dark-400 text-center py-8">{emptyMessage}</p>
        )}
      </div>
    </div>
  );
};

export default ReportTable;
