import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { MantineReactTable, useMantineReactTable } from 'mantine-react-table'
import { RefreshCw, Search, SearchX, X } from 'lucide-react'

/* ── Search / filter helpers ─────────────────────────────────────── */

/** Keys never worth searching (ids, timestamps). */
const SKIP_SEARCH_KEY = /(^id$|_id$|^created_at$|^updated_at$|^deleted_at$)/

/** Flatten a row's primitive values (2 levels deep) into one lowercase string. */
function rowText(row, depth = 0) {
  if (row === null || row === undefined) return ''
  if (typeof row !== 'object') return String(row)
  if (depth > 2) return ''
  const parts = []
  for (const [k, v] of Object.entries(row)) {
    if (SKIP_SEARCH_KEY.test(k) || v === null || v === undefined) continue
    if (typeof v === 'object') parts.push(rowText(v, depth + 1))
    else parts.push(String(v))
  }
  return parts.join(' ')
}

const getPath = (row, path) =>
  String(path)
    .split('.')
    .reduce((acc, k) => (acc === null || acc === undefined ? acc : acc[k]), row)

const humanize = (v) => {
  const s = String(v).replace(/_/g, ' ').trim()
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

const valueKey = (v) => (typeof v === 'boolean' ? (v ? 'true' : 'false') : String(v))

/** Filterable value of a cell: primitives as-is, objects by their name / label / title. */
function filterValueOf(v) {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'string' || typeof v === 'boolean') return v
  if (typeof v === 'number') return null
  if (typeof v === 'object' && !Array.isArray(v)) {
    const named = v.name ?? v.label ?? v.title
    return typeof named === 'string' && named !== '' ? named : null
  }
  return null
}

/** Columns whose values are identifiers / free text — never auto-filtered. */
const SKIP_FILTER_KEY =
  /(^id$|_id$|name|email|phone|date|_at$|amount|total|balance|price|salary|code|number|reference|title|description|notes|address|remark|reason|url|isbn|count|score|percent|mark)/i

/**
 * Build filters automatically from columns that hold a small set of
 * repeating values (status, type, gender, level…).
 */
function autoFilters(columns, data) {
  if (!Array.isArray(data) || data.length < 3) return []
  const out = []
  for (const col of columns) {
    const fn = typeof col.accessorFn === 'function' ? col.accessorFn : null
    const key = typeof col.accessorKey === 'string' ? col.accessorKey : fn ? col.id : null
    if (!key || typeof key !== 'string' || SKIP_FILTER_KEY.test(key)) continue
    if (col.enableColumnFilter === false || col.meta?.filter === false) continue
    const label = typeof col.header === 'string' ? col.header : humanize(key)
    if (!label) continue
    const seen = new Map()
    let ok = true
    for (const [i, row] of data.entries()) {
      const raw = fn ? fn(row, i) : getPath(row, key)
      if (raw === null || raw === undefined || raw === '' || raw === '—' || raw === '-') continue
      const v = filterValueOf(raw)
      if (v === null) {
        ok = false
        break
      }
      seen.set(valueKey(v), v)
      if (seen.size > 10) {
        ok = false
        break
      }
    }
    if (!ok || seen.size < 2) continue
    out.push({
      key,
      label,
      accessor: fn ? (row) => filterValueOf(fn(row, 0)) : key,
      options: [...seen.entries()]
        .map(([value, raw]) => ({
          value,
          label: typeof raw === 'boolean' ? (raw ? 'Yes' : 'No') : humanize(raw),
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    })
    if (out.length >= 4) break
  }
  return out
}

/* ── Toolbar pieces ──────────────────────────────────────────────── */

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="relative w-full sm:w-64">
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400"
        strokeWidth={2}
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-8 w-full rounded-md border border-zinc-200 bg-white pl-8 pr-7 text-[12px] text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-[#12544f] focus:ring-2 focus:ring-[#12544f]/10 [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-1.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          aria-label="Clear search"
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </div>
  )
}

/** Compact "Label: value ▾" filter pill (native select — keyboard + mobile friendly). */
function FilterPill({ filter, value, onChange }) {
  const active = value !== '' && value !== undefined && value !== null
  return (
    <label
      className={`relative inline-flex h-8 shrink-0 items-center gap-1 rounded-md border pl-2.5 pr-6 text-[12px] transition-colors ${
        active
          ? 'border-[#12544f]/40 bg-[#12544f]/[0.06] text-[#12544f]'
          : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
      }`}
    >
      <span className="whitespace-nowrap">{filter.label}:</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`Filter by ${filter.label}`}
        className="max-w-[10rem] cursor-pointer appearance-none truncate bg-transparent font-medium outline-none"
      >
        <option value="">{filter.allLabel || 'All'}</option>
        {filter.options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2 h-3 w-3 opacity-60"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
      >
        <path d="M3 4.5 6 7.5 9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </label>
  )
}

/**
 * Shared Mantine React Table — compact density, small type & padding.
 *
 * Search and filters live INSIDE the table card (top toolbar):
 * - `searchable` (default true): client-side search across every field of the row.
 *   Pass `search` + `onSearchChange` for server-side search instead.
 * - `filters`: omitted → auto-built from low-cardinality columns (status, type…);
 *   `false` → none; or an array of
 *   `{ key, label, options: [{value,label}], accessor?, value?, onChange?, allLabel? }`
 *   (with `value`/`onChange` the filter is controlled, e.g. server-side).
 * - `toolbarActions`: extra controls on the right of the toolbar (buttons, export…).
 * - `onRefresh`: shows a refresh button in the toolbar.
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
  /** Hide top toolbar entirely (search, filters, bulk bar) */
  hideTopToolbar = false,
  searchable = true,
  searchPlaceholder = 'Search…',
  search: controlledSearch,
  onSearchChange,
  filters: filtersProp,
  toolbarActions = null,
  onRefresh,
  isRefreshing = false,
}) {
  const memoColumns = useMemo(() => columns, [columns])
  const rawData = useMemo(() => (Array.isArray(data) ? data : []), [data])

  /* ── Search ── */
  const serverSearch = typeof onSearchChange === 'function'
  const [searchInput, setSearchInput] = useState(controlledSearch ?? '')
  const deferredSearch = useDeferredValue(searchInput)
  const onSearchChangeRef = useRef(onSearchChange)
  onSearchChangeRef.current = onSearchChange

  // Server-side search: debounce before notifying the page
  useEffect(() => {
    if (!serverSearch) return undefined
    const t = setTimeout(() => onSearchChangeRef.current?.(searchInput.trim()), 300)
    return () => clearTimeout(t)
  }, [searchInput, serverSearch])

  /* ── Filters ── */
  const filterDefs = useMemo(() => {
    if (filtersProp === false) return []
    if (Array.isArray(filtersProp)) return filtersProp.filter((f) => f && f.options?.length)
    return autoFilters(memoColumns, rawData)
  }, [filtersProp, memoColumns, rawData])

  const [clientFilterValues, setClientFilterValues] = useState({})
  const filterValue = (f) =>
    typeof f.onChange === 'function' ? (f.value ?? '') : (clientFilterValues[f.key] ?? '')
  const setFilterValue = (f, v) => {
    if (typeof f.onChange === 'function') f.onChange(v)
    else setClientFilterValues((prev) => ({ ...prev, [f.key]: v }))
  }

  const activeFilterCount = filterDefs.filter((f) => filterValue(f) !== '').length
  const hasQuery = searchInput.trim() !== '' || activeFilterCount > 0

  const clearAll = () => {
    setSearchInput('')
    filterDefs.forEach((f) => {
      if (filterValue(f) !== '') setFilterValue(f, '')
    })
  }

  /* ── Client-side filtering pipeline ── */
  const visibleData = useMemo(() => {
    let rows = rawData
    for (const f of filterDefs) {
      if (typeof f.onChange === 'function') continue // controlled → page/server filters
      const v = clientFilterValues[f.key]
      if (v === undefined || v === '') continue
      const accessor = f.accessor ?? f.key
      rows = rows.filter((row) => {
        const raw = typeof accessor === 'function' ? accessor(row) : getPath(row, accessor)
        const val = typeof accessor === 'function' ? raw : filterValueOf(raw)
        return val !== null && val !== undefined && valueKey(val) === v
      })
    }
    const q = serverSearch ? '' : deferredSearch.trim().toLowerCase()
    if (q) {
      const terms = q.split(/\s+/).filter(Boolean)
      rows = rows.filter((row) => {
        const text = rowText(row).toLowerCase()
        return terms.every((t) => text.includes(t))
      })
    }
    return rows
  }, [rawData, filterDefs, clientFilterValues, deferredSearch, serverSearch])

  /* ── Selection ── */
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
    return rawData.filter((row) => ids.includes(getRowId(row)))
  }, [rowSelection, rawData, getRowId])

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

  const showSearch = searchable
  const showToolbar =
    !hideTopToolbar &&
    (showSearch ||
      filterDefs.length > 0 ||
      Boolean(toolbarActions) ||
      Boolean(onRefresh) ||
      enableRowSelection ||
      Boolean(renderBulkActions))

  const renderToolbar = () => {
    if (selectedCount > 0 && enableRowSelection) {
      return (
        <div className="flex min-h-[48px] flex-wrap items-center gap-2 border-b border-zinc-200 bg-[#12544f]/[0.04] px-3 py-2">
          <span className="text-[12px] font-medium text-zinc-800">
            {selectedCount} selected
          </span>
          {renderBulkActions ? (
            renderBulkActions(selectedRows, {
              clearSelection: () => setRowSelection({}),
              table,
            })
          ) : null}
          <button
            type="button"
            className="ml-auto rounded-md px-2 py-1 text-[12px] text-zinc-600 hover:bg-white hover:text-zinc-900"
            onClick={() => setRowSelection({})}
          >
            Clear selection
          </button>
        </div>
      )
    }

    const total = rawData.length
    const shown = visibleData.length

    return (
      <div className="flex min-h-[48px] flex-wrap items-center gap-2 border-b border-zinc-200 bg-white px-3 py-2">
        {showSearch ? (
          <SearchBox value={searchInput} onChange={setSearchInput} placeholder={searchPlaceholder} />
        ) : null}
        {filterDefs.map((f) => (
          <FilterPill key={f.key} filter={f} value={filterValue(f)} onChange={(v) => setFilterValue(f, v)} />
        ))}
        {hasQuery ? (
          <button
            type="button"
            onClick={clearAll}
            className="h-8 rounded-md px-2 text-[12px] font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
          >
            Clear
          </button>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          {hasQuery && !serverSearch && !isLoading ? (
            <span className="whitespace-nowrap text-[11px] tabular-nums text-zinc-500">
              {shown} of {total}
            </span>
          ) : null}
          {toolbarActions}
          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-800"
              aria-label="Refresh"
              title="Refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          ) : null}
        </div>
      </div>
    )
  }

  const table = useMantineReactTable({
    columns: memoColumns,
    data: visibleData,
    // Loading skeleton rows (and rows without an id) must still get unique keys,
    // otherwise React keeps stale skeleton rows on screen after data arrives.
    getRowId: (row, index) => {
      const id = row ? getRowId(row) : ''
      return id && id !== 'undefined' && id !== 'null' ? id : `__row-${index}`
    },
    enableColumnActions: false,
    enableColumnFilters: false,
    enableGlobalFilter: false,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    enableHiding: false,
    enableStickyHeader: true,
    enableTopToolbar: showToolbar,
    renderTopToolbar: showToolbar ? renderToolbar : undefined,
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
    renderEmptyRowsFallback: () =>
      hasQuery && rawData.length > 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
          <SearchX className="h-5 w-5 text-zinc-300" />
          <p className="text-[12px] font-medium text-zinc-700">No matching records</p>
          <p className="text-[11px] text-zinc-500">Try a different search or clear the filters.</p>
          <button
            type="button"
            onClick={clearAll}
            className="mt-1 rounded-md border border-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-700 hover:border-zinc-300"
          >
            Clear search &amp; filters
          </button>
        </div>
      ) : (
        <p className="px-4 py-10 text-center text-[12px] text-zinc-500">{emptyMessage}</p>
      ),
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
    mantinePaperProps: {
      shadow: 'none',
      withBorder: true,
      radius: 'md',
      style: {
        borderColor: 'var(--sh-rule)',
        overflow: 'hidden',
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
      fontSize: 'sm',
      verticalSpacing: 6,
      horizontalSpacing: 10,
      style: {
        // The desk's list text size; 11px was below comfortable reading size
        fontSize: 13,
      },
    },
    // Flat header: no drop shadow, no translucency — just a hairline divider
    mantineTableHeadProps: {
      sx: { opacity: 1 },
    },
    mantineTableHeadRowProps: {
      sx: { boxShadow: 'none' },
    },
    mantineTableHeadCellProps: {
      style: {
        backgroundColor: '#f8f8f8',
        color: 'var(--sh-muted)',
        fontSize: 12,
        fontWeight: 500,
        paddingTop: 8,
        paddingBottom: 8,
        paddingLeft: 10,
        paddingRight: 10,
        lineHeight: 1.25,
        position: 'sticky',
        top: 0,
        zIndex: 2,
        boxShadow: 'none',
        borderBottom: '1px solid var(--sh-rule)',
      },
    },
    mantineTableBodyCellProps: {
      style: {
        fontSize: 13,
        color: 'var(--sh-ink)',
        paddingTop: 8,
        paddingBottom: 8,
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
    mantineBottomToolbarProps: {
      sx: { boxShadow: 'none' },
      style: {
        backgroundColor: '#fff',
        minHeight: 40,
        fontSize: 12,
        borderTop: '1px solid var(--sh-rule)',
      },
    },
    mantinePaginationProps: {
      size: 'xs',
      radius: 'md',
    },
    // Placeholder rows show the loading; no spinner on top of them
    mantineLoadingOverlayProps: { visible: false },
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
    <div className="mrt-compact text-[12px] [&_.mantine-Text-root]:text-[12px] [&_button]:text-[12px]">
      <MantineReactTable table={table} />
    </div>
  )
}

export default DataTable
