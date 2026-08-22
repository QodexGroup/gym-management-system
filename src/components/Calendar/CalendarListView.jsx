import DataTable from '../DataTable';

/**
 * List view for the calendar. Purely a DataTable wrapper — the columns arrive from the
 * feature layer (`calendarTable.config.jsx`) so this component holds no domain
 * knowledge and the column config lives where the project's conventions expect it.
 *
 * @param {{ columns: Array<Object>, rows: Array<Object>, title?: string, loading?: boolean, emptyMessage?: string }} props
 * @returns {JSX.Element}
 */
const CalendarListView = ({
  columns,
  rows = [],
  title = 'Sessions',
  loading = false,
  emptyMessage = 'Nothing scheduled for this period',
}) => (
  <DataTable
    columns={columns}
    data={rows}
    keyField="id"
    title={title}
    loading={loading}
    wrapperClassName="card"
    emptyMessage={emptyMessage}
  />
);

export default CalendarListView;
