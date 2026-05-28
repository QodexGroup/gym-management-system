import DataTableActions from './DataTableActions';

export const createActionColumn = (
  getItems,
  { menuPosition = 'bottom-left', label = 'Actions' } = {}
) => ({
  key: 'actions',
  label,
  align: 'right',
  render: (row) => (
    <DataTableActions
      items={getItems(row) || []}
      menuPosition={menuPosition}
    />
  ),
});
