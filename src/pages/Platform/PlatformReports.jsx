import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, RefreshCw } from 'lucide-react'
import EChart from '../../components/Charts/EChart.jsx'
import DataTable from '../../components/Tables/DataTable.jsx'
import {
  FormButton,
  FormField,
  FormInput,
  FormSelect,
} from '../../components/Form'
import {
  platformReportAudit,
  platformReportGrowth,
  platformReportOverview,
  platformReportRevenue,
  platformReportSchools,
  platformReportSubscriptions,
  platformReportUsers,
} from '../../api/domain.js'
import { formatMoney } from '../../utils/money.js'
import { exportCsv, stampFilename } from '../../utils/exportCsv.js'
import {
  BRAND,
  multiLineOption,
  sparkLineOption,
} from './reportChartOptions.js'
import { toastSuccess, toastError } from '../../components/Toast'
import { SectionSkeleton } from '../../components/Loading'

/** Compact metric tile — no chart (Subscriptions & dense KPIs). */
function StatCard({ label, value, hint, accent }) {
  return (
    <div className="min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2.5">
      <div className="flex items-center gap-2">
        {accent ? (
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: accent }}
          />
        ) : null}
        <p className="truncate text-[10px] font-medium uppercase tracking-wide text-zinc-400">
          {label}
        </p>
      </div>
      <p className="mt-1 text-xl font-semibold tabular-nums leading-none text-zinc-900">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 truncate text-[11px] text-zinc-500">{hint}</p>
      ) : null}
    </div>
  )
}

/** Compact card with mini line chart underneath the value. */
function SparkCard({ title, value, hint, option, height = 52 }) {
  return (
    <div className="flex min-w-0 flex-col rounded-lg border border-zinc-200 bg-white px-3 py-2.5">
      <p className="truncate text-[10px] font-medium uppercase tracking-wide text-zinc-400">
        {title}
      </p>
      <p className="mt-1 text-lg font-semibold tabular-nums leading-none text-zinc-900">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 truncate text-[10px] text-zinc-500">{hint}</p>
      ) : null}
      {option ? (
        <div className="mt-1.5 -mx-1">
          <EChart option={option} height={height} />
        </div>
      ) : null}
    </div>
  )
}

/** Equal-height chart panel for pair grids. */
function ChartPanel({ title, children, className = '' }) {
  return (
    <div
      className={`flex min-h-0 min-w-0 flex-col rounded-lg border border-zinc-200 bg-white ${className}`}
    >
      <div className="flex h-9 shrink-0 items-center border-b border-zinc-100 px-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          {title}
        </p>
      </div>
      <div className="min-h-0 flex-1 p-2.5">{children}</div>
    </div>
  )
}

function ReportShell({ children }) {
  return <div className="flex w-full flex-col gap-3">{children}</div>
}

function ReportToolbar({
  title,
  subtitle,
  onRefresh,
  refreshing,
  onExport,
  exportLabel = 'Export CSV',
  filters,
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-zinc-900">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-0.5 text-[12px] text-zinc-500">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {onExport ? (
            <FormButton type="button" appearance="bordered" onPress={onExport}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              {exportLabel}
            </FormButton>
          ) : null}
          {onRefresh ? (
            <FormButton
              type="button"
              appearance="bordered"
              isDisabled={refreshing}
              onPress={onRefresh}
            >
              <RefreshCw
                className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </FormButton>
          ) : null}
        </div>
      </div>
      {filters ? (
        <div className="grid items-end gap-2 rounded-lg border border-zinc-200 bg-white p-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {filters}
        </div>
      ) : null}
    </div>
  )
}

function TablePanel({ title, children, count }) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="flex h-9 items-center justify-between border-b border-zinc-100 px-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          {title}
        </p>
        {count != null ? (
          <span className="text-[11px] tabular-nums text-zinc-400">
            {Number(count).toLocaleString()} rows
          </span>
        ) : null}
      </div>
      <div className="p-0 [&_.mrt-compact]:border-0">{children}</div>
    </div>
  )
}

function LoadingBlock() {
  return (
    <SectionSkeleton label="Loading report" />
  )
}

function ErrorBlock({ message }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
      {message || 'Failed to load report'}
    </div>
  )
}

const TABLE_MAX = 'min(48vh, 420px)'

function reportTableProps(extra = {}) {
  const { tableOptions: extraTableOptions, ...rest } = extra
  return {
    enableRowSelection: false,
    // Search inside the table card; report-level filters above drive charts + table
    filters: false,
    searchPlaceholder: 'Search this report…',
    maxHeight: TABLE_MAX,
    initialState: { density: 'xs', pagination: { pageSize: 25, pageIndex: 0 } },
    tableOptions: {
      mantinePaperProps: {
        shadow: 'none',
        withBorder: false,
        radius: 0,
        style: { border: 'none' },
      },
      ...extraTableOptions,
    },
    ...rest,
  }
}

function seriesFromMonthly(rows = [], key = 'total') {
  const cats = rows.map((r) => r.month || r.day || '')
  const vals = rows.map((r) => Number(r[key]) || 0)
  return { cats, vals }
}

// ── Growth & adoption ────────────────────────────────────────────

function GrowthReport() {
  const [months, setMonths] = useState('12')

  const growthQ = useQuery({
    queryKey: ['platform', 'reports', 'growth', months],
    queryFn: () => platformReportGrowth({ months: Number(months) || 12 }),
  })
  const overviewQ = useQuery({
    queryKey: ['platform', 'reports', 'overview'],
    queryFn: platformReportOverview,
  })

  const growth = growthQ.data || {}
  const kpis = overviewQ.data?.kpis || {}
  const loading = growthQ.isLoading || overviewQ.isLoading
  const error = growthQ.isError
    ? growthQ.error?.message
    : overviewQ.isError
      ? overviewQ.error?.message
      : null

  const schoolsSeries = seriesFromMonthly(growth.schools_by_month || [])
  const subsSeries = seriesFromMonthly(growth.subscriptions_by_month || [])
  const usersSeries = seriesFromMonthly(growth.users_by_month || [])

  const combinedOption = useMemo(() => {
    const monthsSet = new Set([
      ...schoolsSeries.cats,
      ...subsSeries.cats,
      ...usersSeries.cats,
    ])
    const categories = Array.from(monthsSet).sort()
    const mapSeries = (cats, vals) => {
      const m = Object.fromEntries(cats.map((c, i) => [c, vals[i]]))
      return categories.map((c) => m[c] ?? 0)
    }
    return multiLineOption(categories, [
      {
        name: 'Schools',
        data: mapSeries(schoolsSeries.cats, schoolsSeries.vals),
        color: BRAND.primary,
      },
      {
        name: 'Subscriptions',
        data: mapSeries(subsSeries.cats, subsSeries.vals),
        color: BRAND.sky,
      },
      {
        name: 'Users',
        data: mapSeries(usersSeries.cats, usersSeries.vals),
        color: BRAND.amber,
      },
    ])
  }, [schoolsSeries, subsSeries, usersSeries])

  const handleExport = () => {
    try {
      const monthsSet = new Set([
        ...(growth.schools_by_month || []).map((r) => r.month),
        ...(growth.subscriptions_by_month || []).map((r) => r.month),
        ...(growth.users_by_month || []).map((r) => r.month),
      ])
      const monthsSorted = Array.from(monthsSet).filter(Boolean).sort()
      const sMap = Object.fromEntries(
        (growth.schools_by_month || []).map((r) => [r.month, r.total]),
      )
      const subMap = Object.fromEntries(
        (growth.subscriptions_by_month || []).map((r) => [r.month, r.total]),
      )
      const uMap = Object.fromEntries(
        (growth.users_by_month || []).map((r) => [r.month, r.total]),
      )
      exportCsv(
        stampFilename('growth_adoption'),
        ['month', 'schools', 'subscriptions', 'users'],
        monthsSorted.map((m) => [m, sMap[m] ?? 0, subMap[m] ?? 0, uMap[m] ?? 0]),
      )
      toastSuccess('Export ready', 'Growth report CSV downloaded')
    } catch (e) {
      toastError('Export failed', e?.message || 'Could not export')
    }
  }

  return (
    <ReportShell>
      <ReportToolbar
        title="Growth & adoption"
        subtitle="Platform insights — trends for schools, subscriptions, and users"
        onRefresh={() => {
          growthQ.refetch()
          overviewQ.refetch()
        }}
        refreshing={growthQ.isFetching || overviewQ.isFetching}
        onExport={handleExport}
        filters={
          <FormField label="Period">
            <FormSelect
              placeholder="Months"
              value={months}
              onChange={setMonths}
              options={[
                { value: '3', label: 'Last 3 months' },
                { value: '6', label: 'Last 6 months' },
                { value: '12', label: 'Last 12 months' },
                { value: '24', label: 'Last 24 months' },
              ]}
            />
          </FormField>
        }
      />

      {error ? <ErrorBlock message={error} /> : null}
      {loading ? (
        <LoadingBlock />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <SparkCard
              title="Schools"
              value={(
                kpis.schools_total ?? growth.totals?.schools ?? 0
              ).toLocaleString()}
              hint={`${kpis.schools_active ?? 0} active`}
              option={sparkLineOption(schoolsSeries.cats, schoolsSeries.vals, {
                color: BRAND.primary,
              })}
            />
            <SparkCard
              title="Subscriptions"
              value={(
                kpis.subscriptions_total ?? growth.totals?.subscriptions ?? 0
              ).toLocaleString()}
              hint={`${kpis.subscriptions_active ?? 0} active`}
              option={sparkLineOption(subsSeries.cats, subsSeries.vals, {
                color: BRAND.sky,
              })}
            />
            <SparkCard
              title="Users"
              value={(
                kpis.users_total ?? growth.totals?.users ?? 0
              ).toLocaleString()}
              hint={`${kpis.platform_users ?? 0} platform`}
              option={sparkLineOption(usersSeries.cats, usersSeries.vals, {
                color: BRAND.amber,
              })}
            />
            <SparkCard
              title="Paid revenue"
              value={formatMoney(kpis.revenue_paid ?? 0, 'USD')}
              hint={`${formatMoney(kpis.revenue_unpaid ?? 0, 'USD')} unpaid`}
              option={sparkLineOption(
                schoolsSeries.cats,
                schoolsSeries.vals.map((_, i) =>
                  Math.round(
                    ((kpis.revenue_paid || 0) * (i + 1)) /
                      Math.max(schoolsSeries.vals.length, 1),
                  ),
                ),
                { color: BRAND.accent },
              )}
            />
          </div>

          <ChartPanel title="Monthly growth">
            <EChart option={combinedOption} height={200} />
          </ChartPanel>
        </>
      )}
    </ReportShell>
  )
}

// ── Schools ──────────────────────────────────────────────────────

function SchoolsReport() {
  const [status, setStatus] = useState('')
  const [country, setCountry] = useState('')
  const [q, setQ] = useState('')
  const [qApplied, setQApplied] = useState('')

  const params = useMemo(
    () => ({
      per_page: 50,
      status: status && status !== 'all' ? status : undefined,
      country: country.trim() || undefined,
      q: qApplied || undefined,
    }),
    [status, country, qApplied],
  )

  const reportQ = useQuery({
    queryKey: ['platform', 'reports', 'schools', params],
    queryFn: () => platformReportSchools(params),
  })
  const data = reportQ.data || {}

  const statusSeries = useMemo(() => {
    const rows = data.by_status || []
    return {
      cats: rows.map((r) => r.status || 'unknown'),
      vals: rows.map((r) => Number(r.total) || 0),
    }
  }, [data.by_status])

  const regionSeries = useMemo(() => {
    const rows = (data.by_region || []).slice(0, 12)
    return {
      cats: rows.map((r) => r.region),
      vals: rows.map((r) => Number(r.total) || 0),
    }
  }, [data.by_region])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'School',
        size: 220,
        Cell: ({ row }) => (
          <div>
            <div className="font-medium text-zinc-900">{row.original.name}</div>
            <div className="font-mono text-[11px] text-zinc-400">
              {row.original.code}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 100,
        Cell: ({ cell }) => (
          <span className="capitalize text-zinc-700">
            {cell.getValue() || '—'}
          </span>
        ),
      },
      {
        id: 'location',
        header: 'Location',
        size: 180,
        Cell: ({ row }) => {
          const s = row.original
          return (
            <span className="text-[12px] text-zinc-600">
              {[s.district, s.region, s.country].filter(Boolean).join(', ') ||
                '—'}
            </span>
          )
        },
      },
      { accessorKey: 'users_count', header: 'Users', size: 70 },
      {
        id: 'plan',
        header: 'Subscription',
        size: 120,
        Cell: ({ row }) =>
          row.original.current_subscription?.plan?.name || (
            <span className="text-zinc-400">None</span>
          ),
      },
    ],
    [],
  )

  const handleExport = () => {
    try {
      exportCsv(
        stampFilename('schools_report'),
        [
          'name',
          'code',
          'status',
          'region',
          'district',
          'country',
          'users',
          'plan',
        ],
        (data.schools || []).map((s) => [
          s.name,
          s.code,
          s.status,
          s.region,
          s.district,
          s.country,
          s.users_count ?? 0,
          s.current_subscription?.plan?.name || '',
        ]),
      )
      toastSuccess('Export ready', 'Schools report CSV downloaded')
    } catch (e) {
      toastError('Export failed', e?.message)
    }
  }

  return (
    <ReportShell>
      <ReportToolbar
        title="Schools report"
        subtitle="Tenant schools — filter, compact charts, scrollable table"
        onRefresh={() => reportQ.refetch()}
        refreshing={reportQ.isFetching}
        onExport={handleExport}
        filters={
          <>
            <FormField label="Search">
              <FormInput
                value={q}
                onValueChange={setQ}
                placeholder="Name, code, region…"
              />
            </FormField>
            <FormField label="Status">
              <FormSelect
                placeholder="Status"
                value={status || 'all'}
                onChange={(v) => setStatus(v === 'all' ? '' : v)}
                options={[
                  { value: 'all', label: 'All statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'suspended', label: 'Suspended' },
                  { value: 'rejected', label: 'Rejected' },
                ]}
              />
            </FormField>
            <FormField label="Country">
              <FormInput
                value={country}
                onValueChange={setCountry}
                placeholder="e.g. Tanzania"
              />
            </FormField>
            <div className="flex gap-2">
              <FormButton
                type="button"
                className="flex-1"
                onPress={() => setQApplied(q.trim())}
              >
                Apply
              </FormButton>
              <FormButton
                type="button"
                appearance="light"
                onPress={() => {
                  setQ('')
                  setQApplied('')
                  setStatus('')
                  setCountry('')
                }}
              >
                Clear
              </FormButton>
            </div>
          </>
        }
      />

      {reportQ.isError ? (
        <ErrorBlock message={reportQ.error?.message} />
      ) : reportQ.isLoading ? (
        <LoadingBlock />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <SparkCard
              title="Total schools"
              value={(data.summary?.total ?? 0).toLocaleString()}
              option={sparkLineOption(statusSeries.cats, statusSeries.vals, {
                color: BRAND.primary,
              })}
            />
            <SparkCard
              title="With subscription"
              value={(data.summary?.with_subscription ?? 0).toLocaleString()}
              option={sparkLineOption(regionSeries.cats, regionSeries.vals, {
                color: BRAND.sky,
              })}
            />
            <SparkCard
              title="Without subscription"
              value={(data.summary?.without_subscription ?? 0).toLocaleString()}
              option={sparkLineOption(regionSeries.cats, regionSeries.vals, {
                color: BRAND.amber,
              })}
            />
            <SparkCard
              title="Status groups"
              value={(data.by_status || []).length.toLocaleString()}
              option={sparkLineOption(statusSeries.cats, statusSeries.vals, {
                color: BRAND.purple,
                area: false,
              })}
            />
          </div>

          <TablePanel
            title="Schools"
            count={data.meta?.total ?? data.schools?.length}
          >
            <DataTable
              columns={columns}
              data={data.schools || []}
              isLoading={reportQ.isFetching && !reportQ.isLoading}
              emptyMessage="No schools match your filters"
              {...reportTableProps()}
            />
          </TablePanel>
        </>
      )}
    </ReportShell>
  )
}

// ── Subscriptions — small stat cards + sticky scroll table ───────

function SubscriptionsReport() {
  const [status, setStatus] = useState('')

  const params = useMemo(
    () => ({
      per_page: 100,
      status: status && status !== 'all' ? status : undefined,
    }),
    [status],
  )

  const q = useQuery({
    queryKey: ['platform', 'reports', 'subscriptions', params],
    queryFn: () => platformReportSubscriptions(params),
  })
  const data = q.data || {}
  const summary = data.summary || {}

  const statusSeries = useMemo(() => {
    const rows = data.by_status || []
    return {
      cats: rows.map((r) => r.status),
      vals: rows.map((r) => Number(r.total) || 0),
    }
  }, [data.by_status])

  const planSeries = useMemo(() => {
    const rows = data.by_plan || []
    return {
      cats: rows.map((r) => r.plan_name),
      vals: rows.map((r) => Number(r.total) || 0),
    }
  }, [data.by_plan])

  const columns = useMemo(
    () => [
      {
        id: 'school',
        header: 'School',
        size: 220,
        Cell: ({ row }) => (
          <div>
            <div className="font-medium text-zinc-900">
              {row.original.school?.name || '—'}
            </div>
            <div className="font-mono text-[11px] text-zinc-400">
              {row.original.school?.code}
            </div>
          </div>
        ),
      },
      {
        id: 'plan',
        header: 'Plan',
        size: 140,
        Cell: ({ row }) => row.original.plan?.name || '—',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 100,
        Cell: ({ cell }) => (
          <span className="capitalize">{cell.getValue()}</span>
        ),
      },
      {
        accessorKey: 'starts_on',
        header: 'Starts',
        size: 110,
        Cell: ({ cell }) => cell.getValue() || '—',
      },
      {
        accessorKey: 'ends_on',
        header: 'Ends',
        size: 110,
        Cell: ({ cell }) => cell.getValue() || '—',
      },
      {
        id: 'renew',
        header: 'Renew',
        size: 80,
        Cell: ({ row }) => (row.original.auto_renew ? 'Yes' : 'No'),
      },
    ],
    [],
  )

  const handleExport = () => {
    try {
      exportCsv(
        stampFilename('subscriptions_report'),
        [
          'school',
          'code',
          'plan',
          'status',
          'starts_on',
          'ends_on',
          'auto_renew',
        ],
        (data.subscriptions || []).map((s) => [
          s.school?.name,
          s.school?.code,
          s.plan?.name,
          s.status,
          s.starts_on,
          s.ends_on,
          s.auto_renew ? 'yes' : 'no',
        ]),
      )
      toastSuccess('Export ready', 'Subscriptions CSV downloaded')
    } catch (e) {
      toastError('Export failed', e?.message)
    }
  }

  const stats = [
    {
      label: 'Total',
      value: summary.total ?? 0,
      hint: 'Real subscriptions',
      accent: BRAND.primary,
    },
    {
      label: 'Active',
      value: summary.active ?? 0,
      hint: 'Paying / live',
      accent: BRAND.accent,
    },
    {
      label: 'Trial',
      value: summary.trial ?? 0,
      hint: 'Onboarding',
      accent: BRAND.sky,
    },
    {
      label: 'Cancelled',
      value: summary.cancelled ?? 0,
      hint: 'Ended by admin',
      accent: BRAND.slate,
    },
    {
      label: 'Expired',
      value: summary.expired ?? 0,
      hint: 'Past end date',
      accent: BRAND.rose,
    },
  ]

  return (
    <ReportShell>
      <ReportToolbar
        title="Subscriptions report"
        subtitle="Onboarded tenants only — registry free trials excluded"
        onRefresh={() => q.refetch()}
        refreshing={q.isFetching}
        onExport={handleExport}
        filters={
          <FormField label="Status">
            <FormSelect
              placeholder="Status"
              value={status || 'all'}
              onChange={(v) => setStatus(v === 'all' ? '' : v)}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'active', label: 'Active' },
                { value: 'trial', label: 'Trial' },
                { value: 'past_due', label: 'Past due' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'expired', label: 'Expired' },
              ]}
            />
          </FormField>
        }
      />

      {q.isError ? (
        <ErrorBlock message={q.error?.message} />
      ) : q.isLoading ? (
        <LoadingBlock />
      ) : (
        <>
          {/* Small statistic cards — no mini charts */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {stats.map((s) => (
              <StatCard
                key={s.label}
                label={s.label}
                value={Number(s.value).toLocaleString()}
                hint={s.hint}
                accent={s.accent}
              />
            ))}
          </div>

          <div className="grid gap-2 lg:grid-cols-2">
            <ChartPanel title="By status">
              <EChart
                option={multiLineOption(statusSeries.cats, [
                  {
                    name: 'Subs',
                    data: statusSeries.vals,
                    color: BRAND.primary,
                  },
                ])}
                height={140}
              />
            </ChartPanel>
            <ChartPanel title="By plan">
              <EChart
                option={multiLineOption(planSeries.cats, [
                  { name: 'Subs', data: planSeries.vals, color: BRAND.sky },
                ])}
                height={140}
              />
            </ChartPanel>
          </div>

          <TablePanel
            title="Subscriptions"
            count={data.meta?.total ?? data.subscriptions?.length}
          >
            <DataTable
              columns={columns}
              data={data.subscriptions || []}
              isLoading={q.isFetching && !q.isLoading}
              emptyMessage="No subscriptions match your filter"
              {...reportTableProps()}
            />
          </TablePanel>
        </>
      )}
    </ReportShell>
  )
}

// ── Revenue ──────────────────────────────────────────────────────

function RevenueReport() {
  const q = useQuery({
    queryKey: ['platform', 'reports', 'revenue'],
    queryFn: () => platformReportRevenue({ per_page: 50 }),
  })
  const data = q.data || {}
  const monthly = data.monthly || []
  const months = monthly.map((r) => r.month)
  const paidSeries = monthly.map((r) => Number(r.paid) || 0)
  const unpaidSeries = monthly.map((r) => Number(r.unpaid) || 0)

  const columns = useMemo(
    () => [
      {
        accessorKey: 'reference',
        header: 'Reference',
        size: 140,
        Cell: ({ cell }) => (
          <span className="font-mono text-[11px]">{cell.getValue()}</span>
        ),
      },
      {
        id: 'school',
        header: 'School',
        size: 180,
        Cell: ({ row }) => row.original.school?.name || '—',
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        size: 120,
        Cell: ({ row }) =>
          formatMoney(row.original.amount, row.original.currency || 'USD'),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 100,
        Cell: ({ cell }) => (
          <span className="capitalize">{cell.getValue()}</span>
        ),
      },
      {
        accessorKey: 'issue_date',
        header: 'Issued',
        size: 110,
        Cell: ({ cell }) => cell.getValue() || '—',
      },
    ],
    [],
  )

  const handleExport = () => {
    try {
      exportCsv(
        stampFilename('revenue_report'),
        [
          'reference',
          'school',
          'amount',
          'currency',
          'status',
          'issue_date',
          'due_date',
          'paid_at',
        ],
        (data.invoices || []).map((inv) => [
          inv.reference,
          inv.school?.name,
          inv.amount,
          inv.currency,
          inv.status,
          inv.issue_date,
          inv.due_date,
          inv.paid_at,
        ]),
      )
      toastSuccess('Export ready', 'Revenue CSV downloaded')
    } catch (e) {
      toastError('Export failed', e?.message)
    }
  }

  return (
    <ReportShell>
      <ReportToolbar
        title="Revenue & billing"
        subtitle="Platform invoices with paid / unpaid trends"
        onRefresh={() => q.refetch()}
        refreshing={q.isFetching}
        onExport={handleExport}
      />

      {q.isError ? (
        <ErrorBlock message={q.error?.message} />
      ) : q.isLoading ? (
        <LoadingBlock />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <SparkCard
              title="Paid"
              value={formatMoney(data.summary?.paid ?? 0, 'USD')}
              option={sparkLineOption(months, paidSeries, {
                color: BRAND.primary,
              })}
            />
            <SparkCard
              title="Unpaid"
              value={formatMoney(data.summary?.unpaid ?? 0, 'USD')}
              option={sparkLineOption(months, unpaidSeries, {
                color: BRAND.amber,
              })}
            />
            <SparkCard
              title="Failed"
              value={formatMoney(data.summary?.failed ?? 0, 'USD')}
              option={sparkLineOption(months, unpaidSeries, {
                color: BRAND.rose,
              })}
            />
            <SparkCard
              title="Invoices"
              value={(data.summary?.invoice_count ?? 0).toLocaleString()}
              option={sparkLineOption(
                months,
                monthly.map((r) => Number(r.invoices) || 0),
                { color: BRAND.sky },
              )}
            />
          </div>

          <ChartPanel title="Monthly revenue">
            <EChart
              option={multiLineOption(months, [
                { name: 'Paid', data: paidSeries, color: BRAND.primary },
                { name: 'Unpaid', data: unpaidSeries, color: BRAND.amber },
              ])}
              height={180}
            />
          </ChartPanel>

          <TablePanel
            title="Invoices"
            count={data.meta?.total ?? data.invoices?.length}
          >
            <DataTable
              columns={columns}
              data={data.invoices || []}
              emptyMessage="No invoices yet"
              {...reportTableProps()}
            />
          </TablePanel>
        </>
      )}
    </ReportShell>
  )
}

// ── Users ────────────────────────────────────────────────────────

function UsersReport() {
  const [scope, setScope] = useState('all')

  const q = useQuery({
    queryKey: ['platform', 'reports', 'users'],
    queryFn: () => platformReportUsers({ per_page: 50 }),
  })
  const data = q.data || {}

  const roleSeries = useMemo(() => {
    const rows = data.by_role || []
    return {
      cats: rows.map((r) => r.label || r.role),
      vals: rows.map((r) => Number(r.total) || 0),
    }
  }, [data.by_role])

  const filteredUsers = useMemo(() => {
    const list = data.users || []
    if (scope === 'platform') return list.filter((u) => !u.school_id)
    if (scope === 'school') return list.filter((u) => u.school_id)
    return list
  }, [data.users, scope])

  const columns = useMemo(
    () => [
      { accessorKey: 'name', header: 'Name', size: 160 },
      { accessorKey: 'email', header: 'Email', size: 220 },
      {
        id: 'role',
        header: 'Role',
        size: 140,
        Cell: ({ row }) =>
          row.original.role?.label || row.original.role?.name || '—',
      },
      {
        id: 'school',
        header: 'School',
        size: 160,
        Cell: ({ row }) => row.original.school?.name || 'Platform',
      },
    ],
    [],
  )

  const handleExport = () => {
    try {
      exportCsv(
        stampFilename('users_report'),
        ['name', 'email', 'role', 'school'],
        filteredUsers.map((u) => [
          u.name,
          u.email,
          u.role?.label || u.role?.name,
          u.school?.name || 'Platform',
        ]),
      )
      toastSuccess('Export ready', 'Users CSV downloaded')
    } catch (e) {
      toastError('Export failed', e?.message)
    }
  }

  return (
    <ReportShell>
      <ReportToolbar
        title="Users & access"
        subtitle="Platform operators and school users"
        onRefresh={() => q.refetch()}
        refreshing={q.isFetching}
        onExport={handleExport}
        filters={
          <FormField label="Scope">
            <FormSelect
              placeholder="Scope"
              value={scope}
              onChange={setScope}
              options={[
                { value: 'all', label: 'All users' },
                { value: 'platform', label: 'Platform only' },
                { value: 'school', label: 'School users only' },
              ]}
            />
          </FormField>
        }
      />

      {q.isError ? (
        <ErrorBlock message={q.error?.message} />
      ) : q.isLoading ? (
        <LoadingBlock />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <SparkCard
              title="Total users"
              value={(data.summary?.total ?? 0).toLocaleString()}
              option={sparkLineOption(roleSeries.cats, roleSeries.vals, {
                color: BRAND.primary,
              })}
            />
            <SparkCard
              title="Platform"
              value={(data.summary?.platform_users ?? 0).toLocaleString()}
              option={sparkLineOption(roleSeries.cats, roleSeries.vals, {
                color: BRAND.sky,
              })}
            />
            <SparkCard
              title="School users"
              value={(data.summary?.school_users ?? 0).toLocaleString()}
              option={sparkLineOption(roleSeries.cats, roleSeries.vals, {
                color: BRAND.amber,
              })}
            />
          </div>

          <TablePanel title="Users" count={filteredUsers.length}>
            <DataTable
              columns={columns}
              data={filteredUsers}
              emptyMessage="No users match your filter"
              {...reportTableProps()}
            />
          </TablePanel>
        </>
      )}
    </ReportShell>
  )
}

// ── Audit ────────────────────────────────────────────────────────

function AuditReport() {
  const [days, setDays] = useState('30')
  const [actionQ, setActionQ] = useState('')

  const q = useQuery({
    queryKey: ['platform', 'reports', 'audit', days],
    queryFn: () =>
      platformReportAudit({ per_page: 50, days: Number(days) || 30 }),
  })
  const data = q.data || {}

  const daily = data.daily || []
  const dayCats = daily.map((r) => r.day)
  const dayVals = daily.map((r) => Number(r.total) || 0)

  const actionSeries = useMemo(() => {
    const rows = (data.by_action || []).slice(0, 12)
    return {
      cats: rows.map((r) => r.action),
      vals: rows.map((r) => Number(r.total) || 0),
    }
  }, [data.by_action])

  const filteredLogs = useMemo(() => {
    const list = data.logs || []
    if (!actionQ.trim()) return list
    const needle = actionQ.trim().toLowerCase()
    return list.filter((log) =>
      String(log.action || '')
        .toLowerCase()
        .includes(needle),
    )
  }, [data.logs, actionQ])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'created_at',
        header: 'When',
        size: 160,
        Cell: ({ cell }) => (
          <span className="text-[11px]">
            {cell.getValue()
              ? new Date(cell.getValue()).toLocaleString()
              : '—'}
          </span>
        ),
      },
      {
        id: 'user',
        header: 'User',
        size: 180,
        Cell: ({ row }) => row.original.user?.email || '—',
      },
      {
        accessorKey: 'action',
        header: 'Action',
        size: 180,
        Cell: ({ cell }) => (
          <span className="font-mono text-[11px]">{cell.getValue()}</span>
        ),
      },
      {
        id: 'entity',
        header: 'Entity',
        size: 140,
        Cell: ({ row }) =>
          `${row.original.entity_type || '—'}${
            row.original.entity_id ? ` #${row.original.entity_id}` : ''
          }`,
      },
    ],
    [],
  )

  const handleExport = () => {
    try {
      exportCsv(
        stampFilename('audit_report'),
        ['when', 'user', 'action', 'entity_type', 'entity_id', 'ip'],
        filteredLogs.map((log) => [
          log.created_at,
          log.user?.email,
          log.action,
          log.entity_type,
          log.entity_id,
          log.ip_address,
        ]),
      )
      toastSuccess('Export ready', 'Audit CSV downloaded')
    } catch (e) {
      toastError('Export failed', e?.message)
    }
  }

  return (
    <ReportShell>
      <ReportToolbar
        title="Audit activity"
        subtitle="Platform actions with daily trend and export"
        onRefresh={() => q.refetch()}
        refreshing={q.isFetching}
        onExport={handleExport}
        filters={
          <>
            <FormField label="Window">
              <FormSelect
                placeholder="Days"
                value={days}
                onChange={setDays}
                options={[
                  { value: '7', label: 'Last 7 days' },
                  { value: '30', label: 'Last 30 days' },
                  { value: '90', label: 'Last 90 days' },
                ]}
              />
            </FormField>
            <FormField label="Filter action">
              <FormInput
                value={actionQ}
                onValueChange={setActionQ}
                placeholder="e.g. school.created"
              />
            </FormField>
          </>
        }
      />

      {q.isError ? (
        <ErrorBlock message={q.error?.message} />
      ) : q.isLoading ? (
        <LoadingBlock />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <SparkCard
              title="All time"
              value={(data.summary?.total ?? 0).toLocaleString()}
              option={sparkLineOption(dayCats, dayVals, {
                color: BRAND.primary,
              })}
            />
            <SparkCard
              title="Last 7 days"
              value={(data.summary?.last_7_days ?? 0).toLocaleString()}
              option={sparkLineOption(dayCats.slice(-7), dayVals.slice(-7), {
                color: BRAND.sky,
              })}
            />
            <SparkCard
              title="Last 30 days"
              value={(data.summary?.last_30_days ?? 0).toLocaleString()}
              option={sparkLineOption(dayCats, dayVals, {
                color: BRAND.amber,
              })}
            />
          </div>

          <div className="grid gap-2 lg:grid-cols-2">
            <ChartPanel title="Daily activity">
              <EChart
                option={multiLineOption(dayCats, [
                  { name: 'Events', data: dayVals, color: BRAND.primary },
                ])}
                height={150}
              />
            </ChartPanel>
            <ChartPanel title="Top actions">
              <EChart
                option={multiLineOption(actionSeries.cats, [
                  {
                    name: 'Count',
                    data: actionSeries.vals,
                    color: BRAND.purple,
                  },
                ])}
                height={150}
              />
            </ChartPanel>
          </div>

          <TablePanel title="Audit log" count={filteredLogs.length}>
            <DataTable
              columns={columns}
              data={filteredLogs}
              emptyMessage="No audit events match your filter"
              {...reportTableProps()}
            />
          </TablePanel>
        </>
      )}
    </ReportShell>
  )
}

export default function PlatformReports({ section = 'reports-growth' }) {
  switch (section) {
    case 'reports-schools':
      return <SchoolsReport />
    case 'reports-subscriptions':
      return <SubscriptionsReport />
    case 'reports-revenue':
      return <RevenueReport />
    case 'reports-users':
      return <UsersReport />
    case 'reports-audit':
      return <AuditReport />
    case 'reports':
    case 'reports-growth':
    default:
      return <GrowthReport />
  }
}
