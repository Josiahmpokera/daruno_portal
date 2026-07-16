import { useMemo, useState } from 'react'
import { Card, CardBody, CardHeader, Chip, Spinner, Tabs, Tab } from '@heroui/react'
import {
  School,
  CheckCircle2,
  XCircle,
  Sparkles,
  Users,
  UserCheck,
  Heart,
  UserCircle,
  DollarSign,
  CalendarDays,
  TrendingUp,
  Receipt,
  Percent,
  Timer,
  Activity,
  Wifi,
  Smartphone,
  LogIn,
} from 'lucide-react'
import EChart from '../../components/Charts/EChart.jsx'
import {
  revenueTrendOption,
  revenueByRegionLineOption,
  collectionRateOption,
  schoolsByPlanLineOption,
  renewalsChurnOption,
  regionGrowthLineOption,
  usageMultiAxisOption,
  mostUsedModulesLineOption,
  newSchoolsPerMonthOption,
  loginTrendsOption,
} from './platformOverviewCharts.js'

const DEMO = {
  schools: {
    total: 185,
    active: 172,
    inactive: 5,
    trial: 8,
    newThisMonth: 18,
    expired: 5,
  },
  people: {
    students: 128_400,
    teachers: 9_850,
    parents: 96_200,
    users: 142_100,
  },
  revenue: {
    mrr: 89_200,
    arr: 1_070_400,
    today: 2_450,
    thisMonth: 84_600,
    lastMonth: 79_800,
    outstanding: 12_400,
    collectionRate: 91.2,
    arps: 482,
  },
  subscriptions: {
    trial: 8,
    basic: 62,
    professional: 54,
    enterprise: 18,
    renewalsThisMonth: 22,
    renewalsNextMonth: 31,
    expired: 5,
    cancelled: 3,
    churnRate: 1.5,
    avgDurationMonths: 14.2,
  },
  usage: {
    dailyActiveSchools: 148,
    weeklyActiveSchools: 169,
    monthlyActiveSchools: 178,
    todaysLogins: 3_240,
    onlineNow: 186,
    avgSessionMin: 24,
    apiRequestsToday: 1_245_000,
    mobileUsers: 4_820,
  },
}

function MiniStat({ label, value, icon: Icon, hint, tone = 'bg-zinc-100 text-zinc-700' }) {
  return (
    <Card className="border border-zinc-200 shadow-none">
      <CardBody className="flex flex-row items-center gap-2.5 p-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone}`}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            {label}
          </p>
          <p className="text-[15px] font-semibold tabular-nums text-zinc-900">{value}</p>
          {hint ? <p className="truncate text-[10px] text-zinc-400">{hint}</p> : null}
        </div>
      </CardBody>
    </Card>
  )
}

function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <Card className={`border border-zinc-200 shadow-none ${className}`}>
      <CardHeader className="flex flex-col items-start gap-0.5 px-4 pb-0 pt-3">
        <h3 className="text-sm font-medium text-zinc-800">{title}</h3>
        {subtitle ? <p className="text-[11px] text-zinc-400">{subtitle}</p> : null}
      </CardHeader>
      <CardBody className="px-2 pb-3 pt-1">{children}</CardBody>
    </Card>
  )
}

function MiniTable({ columns, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[12px]">
        <thead>
          <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-wide text-zinc-400">
            {columns.map((c) => (
              <th key={c.key} className="px-3 py-2 font-medium">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id ?? row.name ?? row.level ?? i}
              className="border-b border-zinc-50 text-zinc-700 last:border-0"
            >
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-2 whitespace-nowrap tabular-nums">
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

function money(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`
  return `$${Number(n).toLocaleString()}`
}

function PlatformOverview({ liveStats, planMix = [], loading }) {
  const [tab, setTab] = useState('revenue')
  const s = DEMO.schools
  const live = liveStats || {}
  const mix = Array.isArray(planMix) ? planMix : []

  const charts = useMemo(
    () => ({
      revTrend: revenueTrendOption(),
      revRegion: revenueByRegionLineOption(),
      collection: collectionRateOption(),
      planLines: schoolsByPlanLineOption(mix),
      renewals: renewalsChurnOption(),
      regionGrowth: regionGrowthLineOption(),
      usage: usageMultiAxisOption(),
      modules: mostUsedModulesLineOption(),
      newSchools: newSchoolsPerMonthOption(),
      logins: loginTrendsOption(),
    }),
    [mix],
  )

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner color="primary" />
      </div>
    )
  }

  const liveMrr = live.estimated_mrr != null ? Number(live.estimated_mrr) : null
  const liveArr = live.estimated_arr != null ? Number(live.estimated_arr) : null
  const paidRevenue = live.paid_revenue != null ? Number(live.paid_revenue) : null

  const revenueCards = [
    {
      label: 'MRR',
      value: money(liveMrr ?? DEMO.revenue.mrr),
      hint: liveMrr != null ? 'From active plans (live)' : 'Monthly recurring',
      icon: DollarSign,
      tone: 'bg-[#0B3D2E]/10 text-[#0B3D2E]',
    },
    {
      label: 'ARR',
      value: money(liveArr ?? DEMO.revenue.arr),
      hint: liveArr != null ? 'MRR × 12 (live)' : 'Annualized',
      icon: TrendingUp,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: "Today",
      value: money(DEMO.revenue.today),
      hint: 'Collected today',
      icon: CalendarDays,
    },
    {
      label: 'This month',
      value: money(DEMO.revenue.thisMonth),
      hint: 'MTD',
      icon: DollarSign,
    },
    {
      label: 'Last month',
      value: money(DEMO.revenue.lastMonth),
      hint: 'Previous period',
      icon: DollarSign,
    },
    {
      label: 'Outstanding',
      value: money(live.unpaid_amount ?? DEMO.revenue.outstanding),
      hint: 'Open invoices',
      icon: Receipt,
      tone: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Collection',
      value: `${DEMO.revenue.collectionRate}%`,
      hint: 'Invoiced vs paid',
      icon: Percent,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'ARPS',
      value: money(DEMO.revenue.arps),
      hint: 'Avg / school',
      icon: School,
      tone: 'bg-sky-50 text-sky-700',
    },
  ]

  const planTones = [
    'bg-sky-50 text-sky-700',
    'bg-violet-50 text-violet-700',
    'bg-[#0B3D2E]/10 text-[#0B3D2E]',
    'bg-amber-50 text-amber-700',
    'bg-teal-50 text-teal-800',
    'bg-zinc-100 text-zinc-700',
  ]

  const livePlanCards =
    mix.length > 0
      ? mix.map((p, i) => ({
          label: p.name,
          value: p.active_subscriptions_count ?? 0,
          hint: `$${Number(p.price).toLocaleString()}/${p.billing_cycle === 'annual' ? 'yr' : 'mo'} · ${p.subscriptions_count ?? 0} total`,
          icon: School,
          tone: planTones[i % planTones.length],
        }))
      : []

  const subCards = [
    {
      label: 'Trial',
      value: live.trial_subscriptions ?? s.trial,
      hint: live.trial_subscriptions != null ? 'Live trials' : 'Onboarding',
      icon: Timer,
      tone: 'bg-sky-50 text-sky-700',
    },
    ...(livePlanCards.length
      ? livePlanCards
      : [
          {
            label: 'Basic',
            value: DEMO.subscriptions.basic,
            hint: 'Active plan',
            icon: School,
          },
          {
            label: 'Professional',
            value: DEMO.subscriptions.professional,
            hint: 'Active plan',
            icon: School,
            tone: 'bg-violet-50 text-violet-700',
          },
          {
            label: 'Enterprise',
            value: DEMO.subscriptions.enterprise,
            hint: 'Active plan',
            icon: School,
            tone: 'bg-[#0B3D2E]/10 text-[#0B3D2E]',
          },
        ]),
    {
      label: 'Active subs',
      value: live.active_subscriptions ?? DEMO.subscriptions.renewalsThisMonth,
      hint: 'Active + trial',
      icon: CheckCircle2,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Plans',
      value: live.plans_count ?? mix.length ?? DEMO.subscriptions.renewalsNextMonth,
      hint: 'Catalog size',
      icon: Receipt,
      tone: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Ended',
      value: live.ended_subscriptions ?? DEMO.subscriptions.expired,
      hint: 'Expired / cancelled',
      icon: XCircle,
      tone: 'bg-rose-50 text-rose-700',
    },
    {
      label: 'Churn',
      value: `${DEMO.subscriptions.churnRate}%`,
      hint: 'Sample rate',
      icon: Percent,
      tone: 'bg-orange-50 text-orange-700',
    },
  ]

  const growthCards = [
    {
      label: 'New this month',
      value: s.newThisMonth,
      hint: 'New tenants',
      icon: Sparkles,
      tone: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Active schools',
      value: live.active_schools ?? s.active,
      hint: 'Paying / trial',
      icon: CheckCircle2,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Total schools',
      value: live.schools ?? s.total,
      hint: 'Registered',
      icon: School,
      tone: 'bg-[#0B3D2E]/10 text-[#0B3D2E]',
    },
    {
      label: 'Inactive',
      value: s.inactive,
      hint: 'Suspended',
      icon: XCircle,
      tone: 'bg-rose-50 text-rose-700',
    },
  ]

  const usageCards = [
    {
      label: 'Daily active',
      value: DEMO.usage.dailyActiveSchools,
      hint: 'Schools today',
      icon: Activity,
      tone: 'bg-[#0B3D2E]/10 text-[#0B3D2E]',
    },
    {
      label: 'Weekly active',
      value: DEMO.usage.weeklyActiveSchools,
      hint: 'Last 7 days',
      icon: Activity,
      tone: 'bg-sky-50 text-sky-700',
    },
    {
      label: 'Monthly active',
      value: DEMO.usage.monthlyActiveSchools,
      hint: 'Last 30 days',
      icon: Activity,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: "Today's logins",
      value: DEMO.usage.todaysLogins.toLocaleString(),
      hint: 'All users',
      icon: LogIn,
    },
    {
      label: 'Online now',
      value: DEMO.usage.onlineNow,
      hint: 'Live sessions',
      icon: Wifi,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Avg session',
      value: `${DEMO.usage.avgSessionMin} min`,
      hint: 'Duration',
      icon: Timer,
    },
    {
      label: 'API today',
      value: `${(DEMO.usage.apiRequestsToday / 1_000_000).toFixed(2)}M`,
      hint: 'Requests',
      icon: Activity,
      tone: 'bg-violet-50 text-violet-700',
    },
    {
      label: 'Mobile users',
      value: DEMO.usage.mobileUsers.toLocaleString(),
      hint: 'App accounts',
      icon: Smartphone,
      tone: 'bg-sky-50 text-sky-700',
    },
  ]

  const schoolCards = [
    {
      label: 'Total schools',
      value: live.schools ?? s.total,
      hint: 'Registered',
      icon: School,
      tone: 'bg-[#0B3D2E]/10 text-[#0B3D2E]',
    },
    {
      label: 'Active',
      value: live.active_schools ?? s.active,
      hint: 'With subscription',
      icon: CheckCircle2,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Inactive',
      value: s.inactive,
      hint: 'Suspended / expired',
      icon: XCircle,
      tone: 'bg-rose-50 text-rose-700',
    },
    {
      label: 'On trial',
      value: s.trial,
      hint: 'Evaluating',
      icon: Timer,
      tone: 'bg-sky-50 text-sky-700',
    },
    {
      label: 'Students',
      value: DEMO.people.students.toLocaleString(),
      hint: 'All tenants',
      icon: Users,
      tone: 'bg-sky-50 text-sky-700',
    },
    {
      label: 'Teachers',
      value: DEMO.people.teachers.toLocaleString(),
      hint: 'All tenants',
      icon: UserCheck,
      tone: 'bg-violet-50 text-violet-700',
    },
    {
      label: 'Parents',
      value: DEMO.people.parents.toLocaleString(),
      hint: 'All tenants',
      icon: Heart,
      tone: 'bg-pink-50 text-pink-700',
    },
    {
      label: 'Users',
      value: (live.users ?? DEMO.people.users).toLocaleString(),
      hint: 'Every account',
      icon: UserCircle,
      tone: 'bg-teal-50 text-teal-800',
    },
  ]

  const darLevels = [
    { level: 'Primary', count: 58 },
    { level: 'Secondary', count: 41 },
    { level: 'College', count: 6 },
    { level: 'Nursery', count: 12 },
  ]

  const topRegions = [
    { name: 'Dar es Salaam', schools: 117, share: '63%' },
    { name: 'Arusha', schools: 22, share: '12%' },
    { name: 'Kilimanjaro', schools: 18, share: '10%' },
    { name: 'Mwanza', schools: 15, share: '8%' },
    { name: 'Dodoma', schools: 13, share: '7%' },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Snapshot strip — always visible (live when API available) */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            MRR {liveMrr != null ? '(live)' : ''}
          </p>
          <p className="text-lg font-semibold tabular-nums text-[#0B3D2E]">
            {money(liveMrr ?? DEMO.revenue.mrr)}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            Active schools
          </p>
          <p className="text-lg font-semibold tabular-nums text-zinc-900">
            {live.active_schools ?? s.active}
            <span className="ml-1 text-xs font-normal text-zinc-400">
              / {live.schools ?? s.total}
            </span>
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            Active subs
          </p>
          <p className="text-lg font-semibold tabular-nums text-zinc-900">
            {live.active_subscriptions ?? '—'}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            Paid revenue
          </p>
          <p className="text-lg font-semibold tabular-nums text-emerald-700">
            {paidRevenue != null ? money(paidRevenue) : money(DEMO.revenue.thisMonth)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Chip size="sm" variant="flat" className="text-[10px]">
          Super Admin · SaaS analytics
        </Chip>
        <Chip size="sm" variant="flat" color="primary" className="text-[10px]">
          Sample + live blend
        </Chip>
      </div>

      <Tabs
        selectedKey={tab}
        onSelectionChange={setTab}
        aria-label="Platform overview sections"
        color="primary"
        variant="underlined"
        classNames={{
          base: 'w-fit max-w-full',
          tabList:
            'gap-1 w-fit max-w-full flex-wrap border-b border-zinc-200 pb-0',
          cursor: 'bg-[#0B3D2E]',
          tab: 'px-2.5 h-9 w-fit min-w-0',
          tabContent:
            'group-data-[selected=true]:text-[#0B3D2E] group-data-[selected=true]:font-medium text-xs sm:text-sm text-zinc-500',
          panel: 'w-full pt-0',
        }}
      >
        {/* 1. Revenue */}
        <Tab key="revenue" title="Revenue">
          <div className="mt-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
              {revenueCards.map((c) => (
                <MiniStat
                  key={c.label}
                  {...c}
                  tone={c.tone || 'bg-zinc-100 text-zinc-700'}
                />
              ))}
            </div>

            <ChartCard
              title="Revenue trend"
              subtitle="MRR, collected payments, and outstanding balances"
            >
              <EChart option={charts.revTrend} height={320} />
            </ChartCard>

            <div className="grid gap-4 lg:grid-cols-5">
              <ChartCard
                className="lg:col-span-3"
                title="Revenue by region"
                subtitle="Monthly contribution by region"
              >
                <EChart option={charts.revRegion} height={280} />
              </ChartCard>
              <ChartCard
                className="lg:col-span-2"
                title="Collection rate"
                subtitle="Invoiced vs paid (target 90%)"
              >
                <EChart option={charts.collection} height={280} />
              </ChartCard>
            </div>
          </div>
        </Tab>

        {/* 2. Subscriptions */}
        <Tab key="subscriptions" title="Subscriptions">
          <div className="mt-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {subCards.map((c) => (
                <MiniStat
                  key={c.label}
                  {...c}
                  tone={c.tone || 'bg-zinc-100 text-zinc-700'}
                />
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard
                title="Plan mix"
                subtitle={
                  mix.length
                    ? 'Live active + all-time subscribers by plan'
                    : 'Schools on each plan over the year (sample)'
                }
              >
                <EChart option={charts.planLines} height={300} />
              </ChartCard>
              <ChartCard
                title="Renewals & churn"
                subtitle="Monthly renewals versus schools that churned"
              >
                <EChart option={charts.renewals} height={300} />
              </ChartCard>
            </div>
          </div>
        </Tab>

        {/* 3. Growth */}
        <Tab key="growth" title="Growth">
          <div className="mt-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {growthCards.map((c) => (
                <MiniStat key={c.label} {...c} />
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard
                title="New schools"
                subtitle="Acquisitions per month"
              >
                <EChart option={charts.newSchools} height={280} />
              </ChartCard>
              <ChartCard
                title="Net growth by region"
                subtitle="Positive and negative net school change"
              >
                <EChart option={charts.regionGrowth} height={280} />
              </ChartCard>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border border-zinc-200 shadow-none">
                <CardHeader className="px-4 pb-1 pt-3">
                  <h3 className="text-sm font-medium text-zinc-800">
                    Dar es Salaam by level
                  </h3>
                </CardHeader>
                <CardBody className="px-1 pb-3 pt-0">
                  <MiniTable
                    columns={[
                      { key: 'level', label: 'Level' },
                      { key: 'count', label: 'Schools' },
                    ]}
                    rows={darLevels}
                  />
                  <p className="mt-2 px-3 text-[11px] text-zinc-400">
                    Total Dar: {darLevels.reduce((a, b) => a + b.count, 0)} schools
                  </p>
                </CardBody>
              </Card>
              <Card className="border border-zinc-200 shadow-none">
                <CardHeader className="px-4 pb-1 pt-3">
                  <h3 className="text-sm font-medium text-zinc-800">Top regions</h3>
                </CardHeader>
                <CardBody className="px-1 pb-3 pt-0">
                  <MiniTable
                    columns={[
                      { key: 'name', label: 'Region' },
                      { key: 'schools', label: 'Schools' },
                      { key: 'share', label: 'Share' },
                    ]}
                    rows={topRegions}
                  />
                </CardBody>
              </Card>
            </div>
          </div>
        </Tab>

        {/* 4. Usage */}
        <Tab key="usage" title="Usage">
          <div className="mt-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
              {usageCards.map((c) => (
                <MiniStat
                  key={c.label}
                  {...c}
                  tone={c.tone || 'bg-zinc-100 text-zinc-700'}
                />
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard
                title="Platform activity"
                subtitle="Daily & weekly active schools with API volume"
              >
                <EChart option={charts.usage} height={280} />
              </ChartCard>
              <ChartCard
                title="Login trends"
                subtitle="Web vs mobile logins"
              >
                <EChart option={charts.logins} height={280} />
              </ChartCard>
            </div>

            <ChartCard
              title="Most used modules"
              subtitle="Session volume by module over the last 8 weeks"
            >
              <EChart option={charts.modules} height={300} />
            </ChartCard>
          </div>
        </Tab>

        {/* 5. Schools */}
        <Tab key="schools" title="Schools">
          <div className="mt-4 flex flex-col gap-4">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-2.5 text-[12px] text-zinc-600">
              <span className="font-medium text-zinc-800">Tenant snapshot</span>
              <span className="mx-2 text-zinc-300">·</span>
              Total: <strong className="tabular-nums">{live.schools ?? s.total}</strong>
              <span className="mx-2 text-zinc-300">·</span>
              Active:{' '}
              <strong className="tabular-nums text-emerald-700">
                {live.active_schools ?? s.active}
              </strong>
              <span className="mx-2 text-zinc-300">·</span>
              Trial: <strong className="tabular-nums text-sky-700">{s.trial}</strong>
              <span className="mx-2 text-zinc-300">·</span>
              Expired: <strong className="tabular-nums text-rose-600">{s.expired}</strong>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
              {schoolCards.map((c) => (
                <MiniStat key={c.label} {...c} />
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border border-zinc-200 shadow-none">
                <CardHeader className="px-4 pb-1 pt-3">
                  <h3 className="text-sm font-medium text-zinc-800">
                    Dar es Salaam by level
                  </h3>
                </CardHeader>
                <CardBody className="px-1 pb-3 pt-0">
                  <MiniTable
                    columns={[
                      { key: 'level', label: 'Level' },
                      { key: 'count', label: 'Schools' },
                    ]}
                    rows={darLevels}
                  />
                </CardBody>
              </Card>
              <Card className="border border-zinc-200 shadow-none">
                <CardHeader className="px-4 pb-1 pt-3">
                  <h3 className="text-sm font-medium text-zinc-800">Top regions</h3>
                </CardHeader>
                <CardBody className="px-1 pb-3 pt-0">
                  <MiniTable
                    columns={[
                      { key: 'name', label: 'Region' },
                      { key: 'schools', label: 'Schools' },
                      { key: 'share', label: 'Share' },
                    ]}
                    rows={topRegions}
                  />
                </CardBody>
              </Card>
            </div>
          </div>
        </Tab>
      </Tabs>
    </div>
  )
}

export default PlatformOverview
