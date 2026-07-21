import { useMemo, useState } from 'react'
import { MantineReactTable, useMantineReactTable } from 'mantine-react-table'

/**
 * Shared Mantine React Table — compact density, small type & padding.
 * Row checkboxes enabled by default for bulk actions.
 */
function DataTable({
  columns,
  data = [],
  isLoading = false,
  emptyMessage = 'No records',
  enableRowActions = false,
  renderRowActions,
  /** Enable multi-select checkboxes (default true) */
  enableRowSelection = true,
  /** Optional controlled selection map: { [rowId]: true } */
  rowSelection: controlledSelection,
  onRowSelectionChange,
  /** (selectedRows: object[]) => ReactNode — toolbar when rows selected */
  renderBulkActions,
  getRowId = (row) => String(row.id ?? row.uuid ?? ''),
  initialState,
  tableOptions = {},
  /** Sticky header + scrollable body max height (e.g. 420 or 'min(50vh, 420px)') */
  maxHeight = null,
  /** Hide top toolbar (useful on report pages) */
  hideTopToolbar = false,
}) {
  const memoColumns = useMemo(() => columns, [columns])
  const memoData = useMemo(() => data, [data])

  const [internalSelection, setInternalSelection] = useState({})
  const isControlled = controlledSelection !== undefined
  const rowSelection = isControlled ? controlledSelection : internalSelection

  const setRowSelection = (updater) => {
    const next =
      typeof updater === 'function' ? updater(rowSelection) : updater
    if (!isControlled) setInternalSelection(next)
    onRowSelectionChange?.(next)
  }

  const selectedRows = useMemo(() => {
    const ids = Object.keys(rowSelection || {}).filter((k) => rowSelection[k])
    if (!ids.length) return []
    return memoData.filter((row) => ids.includes(getRowId(row)))
  }, [rowSelection, memoData, getRowId])

  const selectedCount = selectedRows.length

  const containerStyle = maxHeight
    ? {
        maxHeight:
          typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
        overflow: 'auto',
      }
    : undefined

  const {
    mantineTableContainerProps: userContainerProps,
    state: userState,
    initialState: userInitialState,
    ...restTableOptions
  } = tableOptions

  const table = useMantineReactTable({
    columns: memoColumns,
    data: memoData,
    getRowId: (row) => getRowId(row),
    enableColumnActions: false,
    enableColumnFilters: false,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    enableHiding: false,
    enableStickyHeader: true,
    enableTopToolbar:
      !hideTopToolbar &&
      (enableRowSelection || Boolean(renderBulkActions)),
    enableRowSelection,
    enableMultiRowSelection: enableRowSelection,
    enableSelectAll: enableRowSelection,
    onRowSelectionChange: setRowSelection,
    enableRowActions,
    positionActionsColumn: 'last',
    renderRowActions: enableRowActions ? renderRowActions : undefined,
    localization: {
      noRecordsToDisplay: emptyMessage,
    },
    initialState: {
      density: 'xs',
      pagination: { pageSize: 15, pageIndex: 0 },
      ...initialState,
      ...userInitialState,
    },
    state: {
      isLoading,
      rowSelection,
      ...userState,
    },
    renderTopToolbarCustomActions: ({ table: t }) => {
      if (!enableRowSelection) {
        return renderBulkActions?.([], t) ?? null
      }
      if (!selectedCount) {
        return (
          <span className="pl-1 text-[11px] text-zinc-400">
            Select rows for bulk actions
          </span>
        )
      }
      return (
        <div className="flex flex-wrap items-center gap-2 py-0.5">
          <span className="text-[11px] font-medium text-zinc-700">
            {selectedCount} selected
          </span>
          {renderBulkActions ? (
            renderBulkActions(selectedRows, {
              clearSelection: () => setRowSelection({}),
              table: t,
            })
          ) : (
            <button
              type="button"
              className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] text-zinc-600 hover:bg-zinc-50"
              onClick={() => setRowSelection({})}
            >
              Clear selection
            </button>
          )}
        </div>
      )
    },
    mantinePaperProps: {
      shadow: 'none',
      withBorder: true,
      radius: 'md',
      style: {
        borderColor: '#e4e4e7',
      },
    },
    mantineTableContainerProps: {
      ...userContainerProps,
      style: {
        ...(userContainerProps?.style || {}),
        ...containerStyle,
      },
    },
    mantineTableProps: {
      highlightOnHover: true,
      withColumnBorders: false,
      fontSize: 'xs',
      verticalSpacing: 4,
      horizontalSpacing: 8,
      style: {
        fontSize: 11,
      },
    },
    mantineTableHeadCellProps: {
      style: {
        backgroundColor: '#f8fafc',
        color: '#64748b',
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        paddingTop: 8,
        paddingBottom: 8,
        paddingLeft: 10,
        paddingRight: 10,
        lineHeight: 1.25,
        position: 'sticky',
        top: 0,
        zIndex: 2,
        boxShadow: 'inset 0 -1px 0 #e4e4e7',
      },
    },
    mantineTableBodyCellProps: {
      style: {
        fontSize: 11,
        color: '#27272a',
        paddingTop: 6,
        paddingBottom: 6,
        paddingLeft: 10,
        paddingRight: 10,
        lineHeight: 1.35,
      },
    },
    mantineSelectCheckboxProps: {
      size: 'xs',
    },
    mantineSelectAllCheckboxProps: {
      size: 'xs',
    },
    mantineTopToolbarProps: {
      style: {
        backgroundColor: '#fff',
        minHeight: 36,
        paddingTop: 4,
        paddingBottom: 4,
      },
    },
    mantineBottomToolbarProps: {
      style: {
        backgroundColor: '#fff',
        minHeight: 36,
        fontSize: 11,
      },
    },
    mantinePaginationProps: {
      size: 'xs',
      radius: 'md',
    },
    mantineProgressProps: {
      color: 'brand',
      size: 'xs',
    },
    displayColumnDefOptions: {
      'mrt-row-actions': {
        header: 'Actions',
        size: 88,
      },
      'mrt-row-select': {
        size: 40,
        enableResizing: false,
      },
    },
    ...restTableOptions,
  })

  return (
    <div className="mrt-compact text-[11px] [&_.mantine-Text-root]:text-[11px] [&_button]:text-[11px]">
      <MantineReactTable table={table} />
    </div>
  )
}

export default DataTable
