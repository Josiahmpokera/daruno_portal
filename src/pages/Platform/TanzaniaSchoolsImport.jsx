import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Progress,
  Spinner,
} from '@heroui/react'
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Search,
  Upload,
  XCircle,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { FormButton } from '../../components/Form'
import DataTable from '../../components/Tables/DataTable.jsx'
import { toastError, toastSuccess } from '../../components/Toast'
import {
  platformBulkImportSchools,
  platformSchools,
  platformUpdateSchool,
} from '../../api/domain.js'

const TZ_LIST_KEY = ['platform', 'schools', 'tanzania']

const REQUIRED_COLUMNS = ['region', 'district', 'school_name', 'school_code']
const BATCH_SIZE = 50

const normalizeHeader = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s\-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')

const HEADER_ALIASES = {
  region: ['region', 'region_name', 'mkoa'],
  district: ['district', 'district_name', 'wilaya'],
  school_name: [
    'school_name',
    'school',
    'name',
    'schoolname',
    'jina_la_shule',
  ],
  school_code: [
    'school_code',
    'code',
    'schoolcode',
    'emis_code',
    'emis',
    'namba_ya_shule',
  ],
}

function mapHeaders(rawHeaders) {
  const map = {}
  const normalized = rawHeaders.map((h) => normalizeHeader(h))

  for (const field of REQUIRED_COLUMNS) {
    const aliases = HEADER_ALIASES[field]
    const idx = normalized.findIndex((h) => aliases.includes(h))
    if (idx >= 0) {
      map[field] = idx
    }
  }

  return map
}

function parseSpreadsheet(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) {
          reject(new Error('The workbook has no sheets.'))
          return
        }
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
          raw: false,
        })

        if (!rows.length) {
          reject(new Error('The sheet is empty.'))
          return
        }

        const headerRow = rows[0]
        const headerMap = mapHeaders(headerRow)
        const missing = REQUIRED_COLUMNS.filter((c) => headerMap[c] === undefined)
        if (missing.length) {
          reject(
            new Error(
              `Missing required columns: ${missing.join(', ')}. Expected: region, district, school_name, school_code.`,
            ),
          )
          return
        }

        const schools = []
        const parseErrors = []

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i]
          if (!row || row.every((cell) => String(cell ?? '').trim() === '')) {
            continue
          }

          const region = String(row[headerMap.region] ?? '').trim()
          const district = String(row[headerMap.district] ?? '').trim()
          const school_name = String(row[headerMap.school_name] ?? '').trim()
          const school_code = String(row[headerMap.school_code] ?? '')
            .trim()
            .toUpperCase()

          if (!region && !district && !school_name && !school_code) {
            continue
          }

          if (!region || !district || !school_name || !school_code) {
            parseErrors.push({
              row: i + 1,
              error: 'Incomplete row — all four columns are required.',
            })
            continue
          }

          schools.push({ region, district, school_name, school_code })
        }

        resolve({ schools, parseErrors, sheetName })
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Failed to parse spreadsheet.'))
      }
    }
    reader.onerror = () => reject(new Error('Could not read the selected file.'))
    reader.readAsArrayBuffer(file)
  })
}

function downloadTemplate() {
  const rows = [
    ['region', 'district', 'school_name', 'school_code'],
    ['Dar es Salaam', 'Kinondoni', 'Mikocheni Primary School', 'PS-DSM-001'],
    ['Arusha', 'Arusha City', 'Sombetini Primary School', 'PS-ARU-014'],
    ['Mwanza', 'Ilemela', 'Kirumba Primary School', 'PS-MWZ-022'],
  ]
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 16 }, { wch: 16 }, { wch: 32 }, { wch: 14 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Primary Schools')
  XLSX.writeFile(wb, 'tanzania_primary_schools_template.xlsx')
}

function chunkArray(items, size) {
  const chunks = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

const statusColor = {
  active: 'success',
  trial: 'primary',
  pending: 'warning',
  suspended: 'danger',
  rejected: 'danger',
}

function StatusChip({ value }) {
  if (!value) return <span className="text-zinc-400">—</span>
  return (
    <Chip
      size="sm"
      variant="flat"
      color={statusColor[value] || 'default'}
      className="capitalize"
    >
      {value}
    </Chip>
  )
}

/** Full table skeleton — used instead of MRT shimmer-on-data. */
function TableSkeleton({ rows = 8 }) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200">
      <div className="grid grid-cols-6 gap-2 border-b border-zinc-100 bg-zinc-50 px-3 py-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`h-${i}`}
            className="h-2.5 animate-pulse rounded bg-zinc-200"
          />
        ))}
      </div>
      <div className="divide-y divide-zinc-100 bg-white">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={`r-${r}`}
            className="grid grid-cols-6 items-center gap-2 px-3 py-3"
          >
            <div className="col-span-2 space-y-1.5">
              <div className="h-3 w-4/5 max-w-[12rem] animate-pulse rounded bg-zinc-200" />
              <div className="h-2 w-16 animate-pulse rounded bg-zinc-100" />
            </div>
            <div className="h-3 w-20 animate-pulse rounded bg-zinc-100" />
            <div className="h-3 w-20 animate-pulse rounded bg-zinc-100" />
            <div className="h-3 w-14 animate-pulse rounded bg-zinc-100" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-zinc-100" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 border-t border-zinc-100 bg-zinc-50/80 py-3 text-[12px] text-zinc-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#12544f]" />
        Loading schools…
      </div>
    </div>
  )
}

/**
 * Super Admin Settings — bulk import + list Tanzania primary schools.
 */
export default function TanzaniaSchoolsImport() {
  const qc = useQueryClient()
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [parseError, setParseError] = useState('')
  const [parsing, setParsing] = useState(false)
  const [dragging, setDragging] = useState(false)

  const [uploadOpen, setUploadOpen] = useState(false)
  const [phase, setPhase] = useState('idle') // idle | uploading | done | error
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('')
  const [result, setResult] = useState(null)

  // List filters
  const [q, setQ] = useState('')
  const [qDebounced, setQDebounced] = useState('')
  const [region, setRegion] = useState('')
  const [district, setDistrict] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    setPage(1)
  }, [qDebounced, region, district, status])

  useEffect(() => {
    setDistrict('')
  }, [region])

  const listParams = useMemo(
    () => ({
      country: 'Tanzania',
      level: 'primary',
      include_filters: 1,
      q: qDebounced || undefined,
      region: region && region !== 'all' ? region : undefined,
      district: district && district !== 'all' ? district : undefined,
      status: status && status !== 'all' ? status : undefined,
      sort: 'region',
      dir: 'asc',
      page,
      per_page: perPage,
    }),
    [qDebounced, region, district, status, page, perPage],
  )

  const listQ = useQuery({
    queryKey: [...TZ_LIST_KEY, listParams],
    queryFn: () => platformSchools(listParams),
    // Keep the previous page visible (dimmed with the "Updating…" overlay) while a
    // new search / filter loads, so the table and its search box stay mounted.
    placeholderData: (prev) => prev,
  })

  // Pending for this key (first load or filter/page change) vs soft refresh.
  const isListPending = listQ.isPending || listQ.isLoading
  const isListRefreshing = listQ.isFetching && !isListPending && !!listQ.data
  const hasListData = !!listQ.data

  // Only bind table rows when this query settled — never mix shimmer with rows.
  const schools = !isListPending && hasListData ? listQ.data?.schools || [] : []
  const meta = !isListPending && hasListData ? listQ.data?.meta || {} : {}
  const total = !isListPending && hasListData ? (meta.total ?? 0) : null
  const lastPage = meta.last_page ?? 1

  // Keep last filter option lists so dropdowns don't empty while reloading.
  const [cachedFilters, setCachedFilters] = useState({
    regions: [],
    districts: [],
    statuses: [],
  })
  useEffect(() => {
    const f = listQ.data?.filters
    if (!f) return
    setCachedFilters((prev) => ({
      regions: f.regions?.length ? f.regions : prev.regions,
      districts: f.districts?.length ? f.districts : prev.districts,
      statuses: f.statuses?.length ? f.statuses : prev.statuses,
    }))
  }, [listQ.data?.filters])

  const filterOptions = listQ.data?.filters || cachedFilters

  const regionOptions = useMemo(
    () => [
      { value: 'all', label: 'All regions' },
      ...(filterOptions.regions || []).map((r) => ({ value: r, label: r })),
    ],
    [filterOptions.regions],
  )

  const districtOptions = useMemo(
    () => [
      { value: 'all', label: 'All districts' },
      ...(filterOptions.districts || []).map((d) => ({ value: d, label: d })),
    ],
    [filterOptions.districts],
  )

  const statusOptions = useMemo(
    () => [
      { value: 'all', label: 'All statuses' },
      ...(filterOptions.statuses || []).map((s) => ({
        value: s,
        label: s.charAt(0).toUpperCase() + s.slice(1),
      })),
    ],
    [filterOptions.statuses],
  )

  const refreshList = useCallback(() => {
    qc.invalidateQueries({ queryKey: TZ_LIST_KEY })
    qc.invalidateQueries({ queryKey: ['platform', 'schools'] })
    qc.invalidateQueries({ queryKey: ['platform', 'dashboard'] })
  }, [qc])

  const setSchoolStatus = async (id, nextStatus) => {
    try {
      await platformUpdateSchool(id, { status: nextStatus })
      toastSuccess(`School ${nextStatus}`)
      refreshList()
    } catch (err) {
      toastError(err?.message || 'Could not update school')
    }
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'School',
        size: 260,
        Cell: ({ row }) => (
          <div>
            <div className="font-medium text-zinc-900">{row.original.name}</div>
            <div className="font-mono text-[11px] text-zinc-400">
              {row.original.code || '—'}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'region',
        header: 'Region',
        size: 140,
        Cell: ({ cell }) => (
          <span className="text-zinc-700">{cell.getValue() || '—'}</span>
        ),
      },
      {
        accessorKey: 'district',
        header: 'District',
        size: 140,
        Cell: ({ cell }) => (
          <span className="text-zinc-700">{cell.getValue() || '—'}</span>
        ),
      },
      {
        id: 'level',
        header: 'Level',
        size: 100,
        accessorFn: (r) =>
          r.education_level ||
          (Array.isArray(r.education_stages) && r.education_stages[0]
            ? String(r.education_stages[0]).replaceAll('_', ' ')
            : 'Primary'),
        Cell: ({ cell }) => (
          <span className="capitalize text-zinc-600">{cell.getValue()}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 110,
        Cell: ({ cell }) => <StatusChip value={cell.getValue()} />,
      },
      {
        accessorKey: 'country',
        header: 'Country',
        size: 100,
        Cell: ({ cell }) => (
          <span className="text-zinc-600">{cell.getValue() || 'Tanzania'}</span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 200,
        enableSorting: false,
        Cell: ({ row }) => {
          const s = row.original
          return (
            <div className="flex flex-wrap gap-1">
              {s.status !== 'active' && (
                <button
                  type="button"
                  className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 hover:bg-emerald-100"
                  onClick={() => setSchoolStatus(s.id, 'active')}
                >
                  Activate
                </button>
              )}
              {s.status === 'active' && (
                <button
                  type="button"
                  className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 hover:bg-amber-100"
                  onClick={() => setSchoolStatus(s.id, 'suspended')}
                >
                  Suspend
                </button>
              )}
              {s.status === 'pending' && (
                <button
                  type="button"
                  className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 hover:bg-red-100"
                  onClick={() => setSchoolStatus(s.id, 'rejected')}
                >
                  Reject
                </button>
              )}
            </div>
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const resetFile = () => {
    setFile(null)
    setPreview(null)
    setParseError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleFile = useCallback(async (selected) => {
    if (!selected) return

    const name = selected.name.toLowerCase()
    const okExt =
      name.endsWith('.xlsx') ||
      name.endsWith('.xls') ||
      name.endsWith('.csv')
    if (!okExt) {
      setParseError('Please upload an Excel (.xlsx, .xls) or CSV file.')
      setFile(null)
      setPreview(null)
      return
    }

    setParsing(true)
    setParseError('')
    setFile(selected)
    setPreview(null)

    try {
      const parsed = await parseSpreadsheet(selected)
      if (!parsed.schools.length) {
        setParseError(
          parsed.parseErrors.length
            ? 'No valid school rows found. Check required columns and data.'
            : 'No data rows found in the sheet.',
        )
        setPreview(null)
      } else {
        setPreview(parsed)
      }
    } catch (err) {
      setParseError(err?.message || 'Failed to parse file.')
      setPreview(null)
    } finally {
      setParsing(false)
    }
  }, [])

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer?.files?.[0]
    if (f) handleFile(f)
  }

  const startUpload = async () => {
    if (!preview?.schools?.length) return

    setUploadOpen(true)
    setPhase('uploading')
    setProgress(0)
    setStatusText('Preparing import…')
    setResult(null)

    const rows = preview.schools
    const chunks = chunkArray(rows, BATCH_SIZE)
    const totals = {
      total: rows.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [...(preview.parseErrors || [])],
      error_count: (preview.parseErrors || []).length,
    }

    try {
      for (let i = 0; i < chunks.length; i++) {
        const batch = chunks[i]
        const from = i * BATCH_SIZE + 1
        const to = Math.min((i + 1) * BATCH_SIZE, rows.length)
        setStatusText(`Uploading schools ${from}–${to} of ${rows.length}…`)

        const base = Math.round((i / chunks.length) * 100)
        setProgress(Math.min(99, base + 2))

        const batchResult = await platformBulkImportSchools({
          schools: batch,
          level: 'primary',
          status: 'pending',
          update_existing: true,
        })

        totals.created += batchResult?.created || 0
        totals.updated += batchResult?.updated || 0
        totals.skipped += batchResult?.skipped || 0
        totals.error_count += batchResult?.error_count || 0
        if (Array.isArray(batchResult?.errors)) {
          totals.errors = totals.errors.concat(batchResult.errors).slice(0, 80)
        }

        setProgress(Math.round(((i + 1) / chunks.length) * 100))
      }

      setProgress(100)
      setStatusText('Import complete')
      setPhase('done')
      setResult(totals)
      refreshList()
      toastSuccess(
        `Imported ${totals.created} new · updated ${totals.updated} · skipped ${totals.skipped}`,
      )
    } catch (err) {
      setPhase('error')
      setStatusText(err?.message || 'Upload failed')
      setResult(totals)
      toastError(err?.message || 'Bulk import failed')
    }
  }

  const closeUploadModal = () => {
    if (phase === 'uploading') return
    setUploadOpen(false)
    if (phase === 'done') {
      resetFile()
    }
    setPhase('idle')
    setProgress(0)
    setStatusText('')
  }

  const sampleRows = useMemo(
    () => (preview?.schools || []).slice(0, 5),
    [preview],
  )

  const hasFilters = Boolean(q || region || district || status)

  return (
    <div className="space-y-4">
      {/* Registry table */}
      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-zinc-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-900">
              Uploaded Tanzania schools
            </p>
            <p className="mt-0.5 text-[12px] text-zinc-500">
              Primary schools registered in Tanzania
              {isListPending ? (
                <span className="ml-1 inline-block h-3 w-16 animate-pulse rounded bg-zinc-200 align-middle" />
              ) : typeof total === 'number' ? (
                <>
                  {' '}
                  ·{' '}
                  <span className="font-medium text-zinc-700">
                    {total.toLocaleString()}
                  </span>{' '}
                  total
                </>
              ) : null}
            </p>
          </div>
          <FormButton
            type="button"
            appearance="bordered"
            isDisabled={listQ.isFetching}
            onPress={() => listQ.refetch()}
          >
            <RefreshCw
              className={`mr-1.5 h-3.5 w-3.5 ${listQ.isFetching ? 'animate-spin' : ''}`}
            />
            Refresh
          </FormButton>
        </div>

        {/* Thin progress bar while fetching (pending or soft refresh) */}
        {(isListPending || isListRefreshing) && (
          <div className="h-0.5 w-full overflow-hidden bg-zinc-100">
            <div className="h-full w-1/3 animate-[tz-progress_1.1s_ease-in-out_infinite] rounded-full bg-[#12544f]" />
          </div>
        )}

        <div className="relative p-2 sm:p-3">
          {listQ.isError && !isListPending ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-[13px] text-red-700">
              {listQ.error?.message || 'Failed to load schools.'}
              <button
                type="button"
                className="ml-2 font-medium text-red-800 underline"
                onClick={() => listQ.refetch()}
              >
                Retry
              </button>
            </div>
          ) : isListPending ? (
            <TableSkeleton rows={8} />
          ) : (
            <div
              className={
                isListRefreshing
                  ? 'pointer-events-none opacity-50 transition-opacity'
                  : 'transition-opacity'
              }
            >
              <DataTable
                columns={columns}
                data={schools}
                isLoading={false}
                emptyMessage={
                  hasFilters
                    ? 'No schools match your filters.'
                    : 'No Tanzania primary schools yet. Upload an Excel file below.'
                }
                enableRowSelection={false}
                getRowId={(row) => String(row.id)}
                searchPlaceholder="Search name, code, region, district…"
                search={q}
                onSearchChange={setQ}
                filters={[
                  { key: 'region', label: 'Region', value: region, onChange: setRegion, options: regionOptions.filter((o) => o.value !== 'all') },
                  { key: 'district', label: 'District', value: district, onChange: setDistrict, options: districtOptions.filter((o) => o.value !== 'all') },
                  { key: 'status', label: 'Status', value: status, onChange: setStatus, options: statusOptions.filter((o) => o.value !== 'all') },
                ]}
                initialState={{
                  density: 'xs',
                  pagination: { pageSize: perPage, pageIndex: 0 },
                }}
                tableOptions={{
                  enablePagination: false,
                  enableBottomToolbar: false,
                  mantineTableContainerProps: {
                    style: { maxHeight: 'min(60vh, 560px)' },
                  },
                }}
              />
            </div>
          )}

          {isListRefreshing && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
              <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin text-[#12544f]" />
                <span className="text-[12px] font-medium text-zinc-700">
                  Updating…
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 px-4 py-3 text-[12px] text-zinc-500">
          <span>
            {isListPending ? (
              <span className="inline-block h-3 w-40 animate-pulse rounded bg-zinc-200" />
            ) : total > 0 ? (
              <>
                Showing{' '}
                <span className="font-medium text-zinc-700">
                  {((page - 1) * perPage + 1).toLocaleString()}–
                  {Math.min(page * perPage, total).toLocaleString()}
                </span>{' '}
                of{' '}
                <span className="font-medium text-zinc-700">
                  {total.toLocaleString()}
                </span>
              </>
            ) : (
              'No schools'
            )}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-[12px] text-zinc-500">
              Rows
              <select
                className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-[12px] text-zinc-700 disabled:opacity-50"
                value={perPage}
                disabled={isListPending}
                onChange={(e) => {
                  setPerPage(Number(e.target.value) || 25)
                  setPage(1)
                }}
              >
                {[25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <FormButton
              type="button"
              appearance="bordered"
              isDisabled={page <= 1 || listQ.isFetching || isListPending}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </FormButton>
            <span className="min-w-[5.5rem] text-center tabular-nums">
              {isListPending || !hasListData
                ? '—'
                : lastPage
                  ? `${page} / ${lastPage}`
                  : '—'}
            </span>
            <FormButton
              type="button"
              appearance="bordered"
              isDisabled={
                isListPending ||
                page >= lastPage ||
                listQ.isFetching ||
                !total
              }
              onPress={() => setPage((p) => Math.min(lastPage, p + 1))}
            >
              Next
            </FormButton>
          </div>
        </div>
      </div>

      {/* Bulk upload */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-900">
              Bulk upload from Excel
            </p>
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-zinc-500">
              Load government primary school registry data. Required columns:{' '}
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[12px] text-zinc-700">
                region
              </code>
              ,{' '}
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[12px] text-zinc-700">
                district
              </code>
              ,{' '}
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[12px] text-zinc-700">
                school_name
              </code>
              ,{' '}
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[12px] text-zinc-700">
                school_code
              </code>
              . Schools are created as Primary (Std I–VII), country Tanzania.
              Existing codes are updated.
            </p>
          </div>
          <FormButton
            type="button"
            appearance="bordered"
            className="shrink-0"
            onPress={downloadTemplate}
          >
            <Download className="mr-1.5 h-4 w-4" />
            Download template
          </FormButton>
        </div>

        <div
          className={[
            'mt-5 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors',
            dragging
              ? 'border-[#12544f] bg-emerald-50/60'
              : 'border-zinc-200 bg-zinc-50/50 hover:border-zinc-300',
          ].join(' ')}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-zinc-200">
            {parsing ? (
              <Loader2 className="h-5 w-5 animate-spin text-[#12544f]" />
            ) : (
              <FileSpreadsheet className="h-5 w-5 text-[#12544f]" />
            )}
          </div>
          <p className="mt-3 text-sm font-medium text-zinc-800">
            {parsing
              ? 'Reading spreadsheet…'
              : 'Drop Excel file here, or browse'}
          </p>
          <p className="mt-1 text-[12px] text-zinc-500">
            Supports .xlsx, .xls, and .csv
          </p>
          <div className="mt-4 flex justify-center">
            <FormButton
              type="button"
              appearance="bordered"
              isDisabled={parsing}
              onPress={() => inputRef.current?.click()}
            >
              <Upload className="mr-1.5 h-4 w-4" />
              Choose file
            </FormButton>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>
          {file && (
            <p className="mt-3 text-[12px] text-zinc-600">
              Selected:{' '}
              <span className="font-medium text-zinc-800">{file.name}</span>
              {file.size ? (
                <span className="text-zinc-400">
                  {' '}
                  · {(file.size / 1024).toFixed(1)} KB
                </span>
              ) : null}
            </p>
          )}
        </div>

        {parseError && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{parseError}</span>
          </div>
        )}

        {preview && (
          <div className="mt-5 space-y-3">
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              <p className="text-[13px] text-emerald-900">
                <span className="font-semibold">{preview.schools.length}</span>{' '}
                valid school
                {preview.schools.length === 1 ? '' : 's'} ready
                {preview.parseErrors?.length
                  ? ` · ${preview.parseErrors.length} row(s) skipped while parsing`
                  : ''}
                {preview.sheetName ? ` · sheet “${preview.sheetName}”` : ''}
              </p>
            </div>

            <div className="overflow-hidden rounded-lg border border-zinc-200">
              <table className="min-w-full text-left text-[12px]">
                <thead className="bg-zinc-50 text-[10px] uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Region</th>
                    <th className="px-3 py-2 font-medium">District</th>
                    <th className="px-3 py-2 font-medium">School name</th>
                    <th className="px-3 py-2 font-medium">Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white">
                  {sampleRows.map((row) => (
                    <tr key={`${row.school_code}-${row.school_name}`}>
                      <td className="px-3 py-2 text-zinc-700">{row.region}</td>
                      <td className="px-3 py-2 text-zinc-700">{row.district}</td>
                      <td className="px-3 py-2 font-medium text-zinc-900">
                        {row.school_name}
                      </td>
                      <td className="px-3 py-2 font-mono text-zinc-600">
                        {row.school_code}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.schools.length > 5 && (
                <p className="border-t border-zinc-100 bg-zinc-50 px-3 py-2 text-[11px] text-zinc-500">
                  Showing 5 of {preview.schools.length} rows
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <FormButton type="button" onPress={startUpload}>
                <Upload className="mr-1.5 h-4 w-4" />
                Import {preview.schools.length} primary school
                {preview.schools.length === 1 ? '' : 's'}
              </FormButton>
              <FormButton type="button" appearance="light" onPress={resetFile}>
                Clear
              </FormButton>
            </div>
          </div>
        )}
      </div>

      {/* Upload progress modal */}
      <Modal
        isOpen={uploadOpen}
        onOpenChange={(open) => {
          if (!open) closeUploadModal()
        }}
        isDismissable={phase !== 'uploading'}
        hideCloseButton={phase === 'uploading'}
        placement="center"
        size="md"
        classNames={{
          backdrop: 'bg-black/50 backdrop-blur-[2px]',
          base: 'border border-zinc-200 shadow-xl',
        }}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1 border-b border-zinc-100 pb-3">
                {phase === 'uploading' && 'Uploading schools'}
                {phase === 'done' && 'Import complete'}
                {phase === 'error' && 'Import interrupted'}
              </ModalHeader>
              <ModalBody className="py-6">
                <div className="flex flex-col items-center text-center">
                  {phase === 'uploading' && (
                    <div className="relative mb-4 flex h-16 w-16 items-center justify-center">
                      <div className="absolute inset-0 animate-ping rounded-full bg-emerald-200/50" />
                      <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 ring-2 ring-emerald-200">
                        <Loader2 className="h-7 w-7 animate-spin text-[#12544f]" />
                      </div>
                    </div>
                  )}
                  {phase === 'done' && (
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 ring-2 ring-emerald-200">
                      <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                    </div>
                  )}
                  {phase === 'error' && (
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 ring-2 ring-red-200">
                      <XCircle className="h-7 w-7 text-red-600" />
                    </div>
                  )}

                  <p className="text-3xl font-semibold tracking-tight text-zinc-900 tabular-nums">
                    {progress}
                    <span className="text-lg font-medium text-zinc-400">%</span>
                  </p>
                  <p className="mt-1 text-[13px] text-zinc-500">{statusText}</p>

                  <div className="mt-5 w-full">
                    <Progress
                      aria-label="Upload progress"
                      value={progress}
                      className="max-w-full"
                      classNames={{
                        track: 'h-2.5 bg-zinc-100',
                        indicator:
                          phase === 'error'
                            ? 'bg-red-500 transition-all duration-500 ease-out'
                            : 'bg-gradient-to-r from-[#12544f] to-emerald-500 transition-all duration-500 ease-out',
                      }}
                    />
                  </div>

                  {phase === 'uploading' && (
                    <div className="mt-4 flex items-center gap-2 text-[12px] text-zinc-400">
                      <Spinner size="sm" color="success" />
                      <span>Please keep this window open…</span>
                    </div>
                  )}

                  {result && phase !== 'uploading' && (
                    <div className="mt-5 grid w-full grid-cols-3 gap-2 text-left">
                      <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                          Created
                        </p>
                        <p className="text-lg font-semibold text-emerald-700">
                          {result.created}
                        </p>
                      </div>
                      <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                          Updated
                        </p>
                        <p className="text-lg font-semibold text-sky-700">
                          {result.updated}
                        </p>
                      </div>
                      <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                          Skipped
                        </p>
                        <p className="text-lg font-semibold text-zinc-600">
                          {result.skipped}
                        </p>
                      </div>
                    </div>
                  )}

                  {result?.errors?.length > 0 && phase !== 'uploading' && (
                    <div className="mt-3 max-h-28 w-full overflow-y-auto rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left text-[11px] text-amber-900">
                      {result.errors.slice(0, 8).map((err, i) => (
                        <p key={`${err.row}-${i}`}>
                          Row {err.row}
                          {err.school_code ? ` (${err.school_code})` : ''}:{' '}
                          {err.error}
                        </p>
                      ))}
                      {result.errors.length > 8 && (
                        <p className="mt-1 text-amber-700">
                          +{result.errors.length - 8} more…
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </ModalBody>
              {phase !== 'uploading' && (
                <ModalFooter className="border-t border-zinc-100">
                  <FormButton type="button" onPress={closeUploadModal}>
                    Close
                  </FormButton>
                </ModalFooter>
              )}
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}
