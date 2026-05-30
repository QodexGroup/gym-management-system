import DataTableActions from './DataTableActions';

export const createActionColumn = (
  getItems,
  { menuPosition = 'bottom-left', label = 'Actions', sticky = 'left' } = {}
) => ({
  key: 'actions',
  label,
  sticky,
  headerClassName: 'table-header--actions',
  cellClassName: 'table-cell--actions',
  render: (row) => (
    <DataTableActions
      items={getItems(row) || []}
      menuPosition={menuPosition}
    />
  ),
});
