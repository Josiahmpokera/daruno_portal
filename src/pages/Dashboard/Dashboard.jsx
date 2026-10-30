import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardBody, Chip } from '@heroui/react'
import { TableSkeleton } from '../../components/Loading'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  UserCheck,
  Banknote,
  ClipboardCheck,
  BookOpen,
  AlertTriangle,
  GraduationCap,
  Building2,
  X,
  ArrowRight,
} from 'lucide-react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import PageHeader from '../../components/Layout/PageHeader.jsx'
import EChart from '../../components/Charts/EChart.jsx'
import FisheyeLineChart from '../../components/Charts/FisheyeLineChart.jsx'
import { useAuth } from '../../auth'
import { getFinanceSetupStatus, studentHeadcountByLevel } from '../../api/domain.js'
import { formatStagesSummary } from '../../config/educationStages.js'
import {
  feePaymentVsExpensesOption,
  feeCollectionDoughnutOption,
  schoolPerformanceFisheyeOption,
  negativeValueBarOption,
} from './dashboardChartOptions.js'

/** Chart heights chosen so the left chart card lines up with the two stacked cards. */
const STACKED_CHART_HEIGHT = 150
const LEFT_CHART_HEIGHT = 368

const FEE_SETUP_DISMISS_KEY = 'shengena.dashboard.feeSetupBanner.dismissed'

function FeeSetupBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(FEE_SETUP_DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

  const { can } = useAuth()
  const setupQ = useQuery({
    queryKey: ['finance', 'setup-status'],
    queryFn: getFinanceSetupStatus,
    enabled: can('finance'),
    staleTime: 60_000,
    retry: 1,
  })

  const data = setupQ.data
  if (dismissed || setupQ.isLoading || setupQ.isError || !data || data.complete) {
    return null
  }

  const summary = data.summary || {}
  const yearName = data.academic_year?.name
  const pct = summary.coverage_percent ?? 0
  const missing = summary.missing_pairs_count ?? 0
  const blockers = Array.isArray(data.blockers) ? data.blockers : []
  const cta = data.cta_path || '/finance/structures'

  const detail =
    summary.total_pairs > 0
      ? `${summary.covered_pairs ?? 0}/${summary.total_pairs} class×term covered${
          missing > 0 ? ` · ${missing} remaining` : ''
        }`
      : blockers.slice(0, 2).join(' · ') || 'Fee structures incomplete'

  const dismiss = () => {
    try {
      sessionStorage.setItem(FEE_SETUP_DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  return (
    <div
      role="status"
      className="flex flex-wrap items-start gap-x-2.5 gap-y-2 rounded-lg border border-amber-200/90 bg-amber-50/90 px-3 py-2.5 text-amber-950 shadow-none sm:flex-nowrap sm:items-center"
    >
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-800 sm:mt-0">
        <Banknote className="h-3.5 w-3.5" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1 leading-snug">
        <p className="text-[12px] font-medium text-amber-950">
          Complete fee structure setup
          {yearName ? (
            <span className="font-normal text-amber-800/90"> · {yearName}</span>
          ) : null}
          {summary.total_pairs > 0 ? (
            <span className="ml-1.5 inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-amber-900">
              {pct}%
            </span>
          ) : null}
        </p>
        <p className="mt-0.5 text-[11px] text-amber-900/80">
          {data.message ||
            'Set fee amounts for every class and term so student fees can be tracked accurately.'}
          {detail ? (
            <span className="text-amber-800/70"> — {detail}</span>
          ) : null}
        </p>
      </div>
      <div className="flex w-full shrink-0 items-center gap-1 pl-[2.375rem] sm:w-auto sm:pl-0">
        <Link
          to={cta}
          className="inline-flex items-center gap-1 rounded-md bg-[#12544f] px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-[#12544f]/90"
        >
          Set up fees
          <ArrowRight className="h-3 w-3" />
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss fee setup reminder"
          className="rounded-md p-1 text-amber-800/70 transition-colors hover:bg-amber-100 hover:text-amber-950"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

/** Compact dummy KPIs */
const KPIS = [
  {
    label: 'Students',
    value: '968',
    hint: '+18 MoM',
    icon: Users,
    tone: 'bg-[#12544f]/10 text-[#12544f]',
  },
  {
    label: 'Teachers',
    value: '54',
    hint: '48 full-time',
    icon: UserCheck,
    tone: 'bg-sky-50 text-sky-700',
  },
  {
    label: 'Attendance',
    value: '92.4%',
    hint: 'Today',
    icon: ClipboardCheck,
    tone: 'bg-amber-50 text-amber-700',
  },
  {
    label: 'Fees YTD',
    value: '11.2M',
    hint: 'TZS collected',
    icon: Banknote,
    tone: 'bg-emerald-50 text-emerald-800',
  },
  {
    label: 'Classes',
    value: '28',
    hint: '8 streams',
    icon: Building2,
    tone: 'bg-violet-50 text-violet-700',
  },
  {
    label: 'Subjects',
    value: '16',
    hint: 'Core + elective',
    icon: BookOpen,
    tone: 'bg-orange-50 text-orange-700',
  },
  {
    label: 'At risk',
    value: '37',
    hint: 'Low attendance',
    icon: AlertTriangle,
    tone: 'bg-rose-50 text-rose-700',
  },
  {
    label: 'Graduates',
    value: '142',
    hint: 'Last cohort',
    icon: GraduationCap,
    tone: 'bg-teal-50 text-teal-800',
  },
]

const TOP_CLASSES = [
  { name: 'Form 4A', students: 99, att: '94%', avg: 78.2 },
  { name: 'Form 3B', students: 98, att: '91%', avg: 76.5 },
  { name: 'Form 2A', students: 101, att: '93%', avg: 74.1 },
  { name: 'Form 1B', students: 104, att: '90%', avg: 72.8 },
  { name: 'Form 4B', students: 99, att: '89%', avg: 71.4 },
]

const FEE_ARREARS = [
  { name: 'J. Mwangi', class: 'F3A', balance: '185,000', days: 42 },
  { name: 'A. Hassan', class: 'F2B', balance: '120,000', days: 28 },
  { name: 'P. Kimaro', class: 'F4A', balance: '95,000', days: 21 },
  { name: 'S. Juma', class: 'F1A', balance: '75,000', days: 14 },
  { name: 'L. Nyerere', class: 'F3B', balance: '60,000', days: 10 },
]

const RECENT_EXAMS = [
  { subject: 'Mathematics', paper: 'Mid-term', mean: 72.4, pass: '81%' },
  { subject: 'English', paper: 'Mid-term', mean: 78.1, pass: '88%' },
  { subject: 'Physics', paper: 'CA Test 2', mean: 69.5, pass: '74%' },
  { subject: 'Biology', paper: 'Practical', mean: 75.2, pass: '86%' },
  { subject: 'History', paper: 'Essay', mean: 80.0, pass: '91%' },
]

const STAFF_LOAD = [
  { teacher: 'Mrs. Jones', subjects: 3, periods: 24, load: 'High' },
  { teacher: 'Mr. Smith', subjects: 2, periods: 18, load: 'Normal' },
  { teacher: 'Ms. White', subjects: 4, periods: 26, load: 'High' },
  { teacher: 'Mr. Okello', subjects: 2, periods: 16, load: 'Normal' },
  { teacher: 'Mrs. Dotto', subjects: 3, periods: 20, load: 'Normal' },
]

function MiniTable({ columns, rows, keyField = 'id' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[240px] text-left text-[11px]">
        <thead>
          <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-wide text-zinc-400">
            {columns.map((c) => (
              <th key={c.key} className="px-2 py-1.5 font-normal">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row[keyField] ?? i}
              className="border-b border-zinc-50 text-zinc-700 last:border-0"
            >
              {columns.map((c) => (
                <td key={c.key} className="px-2 py-1.5 whitespace-nowrap">
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatCard({ label, value, hint, icon: Icon, tone }) {
  return (
    <Card className="h-full rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
      <CardBody className="flex h-full flex-row items-center gap-3 p-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[10px] font-medium uppercase tracking-wide text-zinc-400" title={label}>
            {label}
          </p>
          <p className="mt-0.5 truncate text-base font-semibold tabular-nums text-zinc-900">{value}</p>
          <p className="truncate text-[11px] text-zinc-400" title={hint}>{hint}</p>
        </div>
      </CardBody>
    </Card>
  )
}

function Dashboard() {
  const { session, school: authSchool, can } = useAuth()
  const school = authSchool || session?.user?.school || session?.school || null

  const headcountQ = useQuery({
    queryKey: ['students', 'headcount-by-level'],
    queryFn: studentHeadcountByLevel,
    enabled: can('students'),
  })

  const headcountRows = headcountQ.data?.by_level || []
  const headcountTotals = headcountQ.data?.totals || {
    boys: 0,
    girls: 0,
    other: 0,
    total: 0,
  }
  const stageSummary = formatStagesSummary(
    headcountQ.data?.school_education_stages || school?.education_stages || [],
  )

  const feePayVsExpOpt = useMemo(() => feePaymentVsExpensesOption(), [])
  const feeDoughnutOpt = useMemo(() => feeCollectionDoughnutOption(), [])
  const performanceFisheyeOpt = useMemo(
    () => schoolPerformanceFisheyeOption(),
    [],
  )
  const negativeBarOpt = useMemo(() => negativeValueBarOption(), [])

  return (
    <DashboardLayout>
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4">
        <PageHeader
          title="Overview"
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Overview' },
          ]}
          description={`${school?.name || 'School portal'}${school?.code ? ` · ${school.code}` : ''} — enrollment, attendance, fees & academic performance`}
          actions={
            <Chip size="sm" variant="flat" className="text-[10px]">
              Analytics · sample data
            </Chip>
          }
        />

        <FeeSetupBanner />

        {/* Compact stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 2xl:grid-cols-8 [&>*]:min-w-0">
          {KPIS.map((k) => (
            <StatCard key={k.label} {...k} />
          ))}
        </div>

        {/* Three charts: fee vs expenses (left) · doughnut + fisheye performance (right) */}
        <div className="grid gap-3 lg:grid-cols-2 [&>*]:min-w-0">
          {/* Left — keep full size */}
          <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
            <CardHeader className="flex flex-col items-start gap-0.5 px-3 py-2.5 pb-0">
              <h2 className="text-sm font-medium text-zinc-900">
                Fee payment trend vs Expenses
              </h2>
              <p className="text-[11px] text-zinc-400">
                Monthly fee collections against school expenses (M TZS)
              </p>
            </CardHeader>
            <CardBody className="px-2 pb-2 pt-1">
              <EChart option={feePayVsExpOpt} height={LEFT_CHART_HEIGHT} />
            </CardBody>
          </Card>

          {/* Right — two stacked charts */}
          <div className="flex min-h-0 min-w-0 flex-col gap-3">
            <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
              <CardHeader className="flex flex-col items-start gap-0.5 px-3 py-2 pb-0">
                <h2 className="text-sm font-medium text-zinc-900">
                  Fee collection breakdown
                </h2>
                <p className="text-[11px] text-zinc-400">
                  Share by fee category · doughnut with rounded segments
                </p>
              </CardHeader>
              <CardBody className="px-2 pb-2 pt-0">
                <EChart option={feeDoughnutOpt} height={STACKED_CHART_HEIGHT} />
              </CardBody>
            </Card>

            <Card className="min-h-0 flex-1 rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
              <CardHeader className="flex flex-col items-start gap-0.5 px-3 py-2 pb-0">
                <h2 className="text-sm font-medium text-zinc-900">
                  School performance
                </h2>
                <p className="text-[11px] text-zinc-400">
                  Hover for fisheye lens on the line · index, attendance &amp;
                  academics
                </p>
              </CardHeader>
              <CardBody className="px-2 pb-2 pt-0">
                <FisheyeLineChart
                  option={performanceFisheyeOpt}
                  height={STACKED_CHART_HEIGHT}
                />
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Budget + headcount */}
        <div className="grid gap-3 md:grid-cols-2 [&>*]:min-w-0">
          <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
            <CardHeader className="flex flex-col items-start gap-0.5 px-3 py-2.5 pb-0">
              <h2 className="text-sm font-medium text-zinc-900">
                Budget variance
              </h2>
              <p className="text-[11px] text-zinc-400">
                Surplus (+) vs shortfall (−) by cost center (k TZS)
              </p>
            </CardHeader>
            <CardBody className="px-2 pb-2 pt-1">
              <EChart option={negativeBarOpt} height={280} />
            </CardBody>
          </Card>

          <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
            <CardHeader className="flex flex-col items-start gap-0.5 px-3 py-2.5 pb-1">
              <h2 className="text-sm font-medium text-zinc-900">
                Headcount by education level
              </h2>
              <p className="text-[11px] text-zinc-400">
                Boys & girls for levels this school operates
                {stageSummary ? ` · ${stageSummary}` : ''}
              </p>
            </CardHeader>
            <CardBody className="px-1 pb-2 pt-0">
              {headcountQ.isLoading ? (
                <TableSkeleton columns={4} rows={5} label="Loading headcount" className="h-[200px]" />
              ) : headcountQ.isError ? (
                <p className="px-3 py-8 text-center text-[12px] text-rose-600">
                  {headcountQ.error?.message || 'Could not load headcount'}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[260px] text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-wide text-zinc-400">
                        <th className="px-2 py-1.5 font-normal">Level</th>
                        <th className="px-2 py-1.5 text-right font-normal">
                          Boys
                        </th>
                        <th className="px-2 py-1.5 text-right font-normal">
                          Girls
                        </th>
                        <th className="px-2 py-1.5 text-right font-normal">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {headcountRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-2 py-8 text-center text-zinc-400"
                          >
                            No learners yet for your education levels.
                          </td>
                        </tr>
                      ) : (
                        headcountRows.map((row) => (
                          <tr
                            key={
                              row.education_level_id ||
                              row.stage ||
                              row.name
                            }
                            className="border-b border-zinc-50 text-zinc-700 last:border-0"
                          >
                            <td className="px-2 py-1.5 font-medium text-zinc-900">
                              {row.name}
                              {row.code ? (
                                <span className="ml-1 text-[10px] font-normal text-zinc-400">
                                  {row.code}
                                </span>
                              ) : null}
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums">
                              {row.boys}
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums">
                              {row.girls}
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums font-medium text-zinc-900">
                              {row.total}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {headcountRows.length > 0 ? (
                      <tfoot>
                        <tr className="border-t border-zinc-200 bg-zinc-50/80 text-zinc-900">
                          <td className="px-2 py-1.5 font-semibold">Total</td>
                          <td className="px-2 py-1.5 text-right font-semibold tabular-nums">
                            {headcountTotals.boys}
                          </td>
                          <td className="px-2 py-1.5 text-right font-semibold tabular-nums">
                            {headcountTotals.girls}
                          </td>
                          <td className="px-2 py-1.5 text-right font-semibold tabular-nums">
                            {headcountTotals.total}
                          </td>
                        </tr>
                      </tfoot>
                    ) : null}
                  </table>
                  {headcountTotals.other > 0 ? (
                    <p className="mt-1 px-2 text-[10px] text-zinc-400">
                      {headcountTotals.other} learner(s) without Male/Female
                      sex recorded.
                    </p>
                  ) : null}
                </div>
              )}
            </CardBody>
          </Card>

        </div>

        {/* Data tables grid */}
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4 [&>*]:min-w-0">
          <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
            <CardHeader className="px-3 py-2.5 pb-1">
              <h2 className="text-sm font-medium text-zinc-900">
                Top classes by size
              </h2>
              <p className="text-[11px] text-zinc-400">Headcount & performance</p>
            </CardHeader>
            <CardBody className="px-1 pb-2 pt-0">
              <MiniTable
                columns={[
                  { key: 'name', label: 'Class' },
                  { key: 'students', label: 'N' },
                  { key: 'att', label: 'Att.' },
                  { key: 'avg', label: 'Avg' },
                ]}
                rows={TOP_CLASSES}
                keyField="name"
              />
            </CardBody>
          </Card>

          <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
            <CardHeader className="px-3 py-2.5 pb-1">
              <h2 className="text-sm font-medium text-zinc-900">Fee arrears</h2>
              <p className="text-[11px] text-zinc-400">Highest outstanding balances</p>
            </CardHeader>
            <CardBody className="px-1 pb-2 pt-0">
              <MiniTable
                columns={[
                  { key: 'name', label: 'Student' },
                  { key: 'class', label: 'Class' },
                  { key: 'balance', label: 'Balance' },
                  {
                    key: 'days',
                    label: 'Days',
                    render: (r) => (
                      <span className={r.days > 30 ? 'text-rose-600' : ''}>
                        {r.days}
                      </span>
                    ),
                  },
                ]}
                rows={FEE_ARREARS}
                keyField="name"
              />
            </CardBody>
          </Card>

          <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
            <CardHeader className="px-3 py-2.5 pb-1">
              <h2 className="text-sm font-medium text-zinc-900">
                Recent assessments
              </h2>
              <p className="text-[11px] text-zinc-400">Mean score & pass rate</p>
            </CardHeader>
            <CardBody className="px-1 pb-2 pt-0">
              <MiniTable
                columns={[
                  { key: 'subject', label: 'Subject' },
                  { key: 'paper', label: 'Paper' },
                  { key: 'mean', label: 'Mean' },
                  { key: 'pass', label: 'Pass' },
                ]}
                rows={RECENT_EXAMS}
                keyField="subject"
              />
            </CardBody>
          </Card>

          <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
            <CardHeader className="px-3 py-2.5 pb-1">
              <h2 className="text-sm font-medium text-zinc-900">
                Teacher workload
              </h2>
              <p className="text-[11px] text-zinc-400">Periods per week (sample)</p>
            </CardHeader>
            <CardBody className="px-1 pb-2 pt-0">
              <MiniTable
                columns={[
                  { key: 'teacher', label: 'Teacher' },
                  { key: 'subjects', label: 'Subj.' },
                  { key: 'periods', label: 'Per.' },
                  {
                    key: 'load',
                    label: 'Load',
                    render: (r) => (
                      <span
                        className={
                          r.load === 'High'
                            ? 'text-amber-700'
                            : 'text-zinc-600'
                        }
                      >
                        {r.load}
                      </span>
                    ),
                  },
                ]}
                rows={STAFF_LOAD}
                keyField="teacher"
              />
            </CardBody>
          </Card>
        </div>

        {/* Summary strip */}
        <div className="grid gap-3 sm:grid-cols-3 [&>*]:min-w-0">
          <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
            <CardBody className="p-3">
              <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                Collection rate
              </p>
              <p className="text-lg font-semibold text-zinc-900">84.2%</p>
              <p className="text-[11px] text-zinc-400">
                Of invoiced fees this academic year
              </p>
            </CardBody>
          </Card>
          <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
            <CardBody className="p-3">
              <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                Div. I–II rate
              </p>
              <p className="text-lg font-semibold text-zinc-900">61%</p>
              <p className="text-[11px] text-zinc-400">
                Last mock exam (demo cohort)
              </p>
            </CardBody>
          </Card>
          <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
            <CardBody className="p-3">
              <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                Open support tickets
              </p>
              <p className="text-lg font-semibold text-zinc-900">6</p>
              <p className="text-[11px] text-zinc-400">
                2 high priority (sample)
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Dashboard
