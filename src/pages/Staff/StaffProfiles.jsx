import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, CardBody, Chip } from '@heroui/react'
import dayjs from 'dayjs'
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Briefcase,
  CalendarDays,
  ExternalLink,
  Eye,
  EyeOff,
  FileSignature,
  FileText,
  IdCard,
  KeyRound,
  Mail,
  Phone,
  RefreshCw,
  Search,
  UserRound,
  Users,
} from 'lucide-react'
import { getStaff, listStaff } from '../../api/domain.js'

/* ── Helpers ─────────────────────────────────────────────────────── */

const STATUS_COLOR = {
  active: 'success',
  on_leave: 'warning',
  inactive: 'default',
  terminated: 'danger',
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  draft: 'default',
  expired: 'danger',
  renewed: 'primary',
}

const STATUS_DOT = {
  active: 'bg-emerald-500',
  on_leave: 'bg-amber-500',
  inactive: 'bg-slate-300',
  terminated: 'bg-rose-500',
}

const humanize = (v) => (v ? String(v).replace(/_/g, ' ') : '—')

const fmtDate = (v) => (v ? dayjs(v).format('D MMM YYYY') : '—')

function tenure(hireDate) {
  if (!hireDate) return null
  const start = dayjs(hireDate)
  if (!start.isValid() || start.isAfter(dayjs())) return null
  const months = dayjs().diff(start, 'month')
  const y = Math.floor(months / 12)
  const m = months % 12
  if (y === 0 && m === 0) return 'Joined this month'
  return [y ? `${y} yr${y > 1 ? 's' : ''}` : null, m ? `${m} mo${m > 1 ? 's' : ''}` : null]
    .filter(Boolean)
    .join(' ')
}

function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return ((parts[0][0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

const positionOf = (s) => s?.staff_position?.name || s?.position || null

function useDebounced(value, ms = 250) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

/* ── Small building blocks ───────────────────────────────────────── */

function StatusBadge({ value }) {
  return (
    <Chip
      size="sm"
      variant="flat"
      color={STATUS_COLOR[value] || 'default'}
      className="h-5 shrink-0 px-1 text-[10px] font-medium capitalize"
    >
      {humanize(value)}
    </Chip>
  )
}

function Avatar({ name, size = 'md' }) {
  const cls =
    size === 'lg'
      ? 'h-14 w-14 text-lg'
      : size === 'sm'
        ? 'h-9 w-9 text-xs'
        : 'h-10 w-10 text-sm'
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#12544f] font-semibold text-white ${cls}`}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  )
}

function SectionCard({ title, icon, children, action = null }) {
  const Icon = icon
  return (
    <Card className="h-full rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
      <CardBody className="p-0">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          </div>
          {action}
        </div>
        <div className="px-4 py-3">{children}</div>
      </CardBody>
    </Card>
  )
}

/** Label / value rows with a fixed label column so values line up. */
function InfoList({ rows }) {
  return (
    <dl className="divide-y divide-slate-100">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="grid grid-cols-[minmax(7rem,38%)_1fr] items-baseline gap-3 py-2 text-[13px]"
        >
          <dt className="text-slate-500">{label}</dt>
          <dd className="min-w-0 break-words font-medium text-slate-900">
            {value === null || value === undefined || value === '' ? (
              <span className="font-normal text-slate-400">—</span>
            ) : (
              value
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function EmptyState({ icon, title, hint, actionLabel, onAction }) {
  const Icon = icon
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
        <Icon className="h-5 w-5 text-slate-400" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-medium text-slate-900">{title}</p>
      {hint ? <p className="mt-1 max-w-sm text-xs text-slate-500">{hint}</p> : null}
      {actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-[#12544f]/40 hover:text-[#12544f]"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}

/** Compact data table used in the tabs (consistent paddings + alignment). */
function MiniTable({ columns, rows, rowKey = 'id' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-[13px]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] uppercase tracking-wide text-slate-500">
            {columns.map((c) => (
              <th
                key={c.key}
                className={`px-4 py-2.5 font-medium ${c.align === 'right' ? 'text-right' : ''}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row[rowKey]} className="text-slate-700 hover:bg-slate-50/60">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`px-4 py-2.5 align-middle ${c.align === 'right' ? 'text-right tabular-nums' : ''}`}
                >
                  {c.render ? c.render(row) : row[c.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function maskAccount(value) {
  const v = String(value || '')
  if (v.length <= 4) return v
  return `•••• ${v.slice(-4)}`
}

function documentExpiry(expiresAt) {
  if (!expiresAt) return null
  const days = dayjs(expiresAt).startOf('day').diff(dayjs().startOf('day'), 'day')
  if (days < 0) return { tone: 'danger', label: 'Expired' }
  if (days <= 30) return { tone: 'warning', label: `Expires in ${days}d` }
  return null
}

/* ── Staff list (master) ─────────────────────────────────────────── */

function StaffList({ selectedId, onSelect, className = '' }) {
  const [search, setSearch] = useState('')
  const q = useDebounced(search.trim())

  const listQ = useQuery({
    queryKey: ['staff', 'profiles-list', q],
    queryFn: () => listStaff({ q: q || undefined, per_page: 100 }),
    placeholderData: (prev) => prev,
  })
  const staff = listQ.data?.staff || []
  const total = listQ.data?.meta?.total ?? staff.length

  return (
    <Card className={`flex min-h-0 flex-col border border-slate-200 shadow-none ${className}`}>
      <div className="border-b border-slate-100 p-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            strokeWidth={1.75}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, code, email…"
            aria-label="Search staff"
            className="h-9 w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 text-[13px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#12544f] focus:ring-2 focus:ring-[#12544f]/10"
          />
        </div>
        <p className="mt-2 px-0.5 text-[11px] text-slate-500">
          {listQ.isLoading ? 'Loading staff…' : `${total} staff member${total === 1 ? '' : 's'}`}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto" role="listbox" aria-label="Staff members">
        {listQ.isLoading ? (
          <ul className="space-y-1 p-2" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 rounded-lg px-2.5 py-2">
                <div className="h-9 w-9 animate-pulse rounded-full bg-slate-100" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
                  <div className="h-2.5 w-1/2 animate-pulse rounded bg-slate-100" />
                </div>
              </li>
            ))}
          </ul>
        ) : listQ.isError ? (
          <EmptyState
            icon={AlertTriangle}
            title="Couldn’t load staff"
            hint={listQ.error?.message}
            actionLabel="Try again"
            onAction={() => listQ.refetch()}
          />
        ) : staff.length === 0 ? (
          <EmptyState
            icon={Users}
            title={q ? 'No matches' : 'No staff yet'}
            hint={q ? `Nothing matches “${q}”.` : 'Onboard staff to see their profiles here.'}
          />
        ) : (
          <ul className="space-y-0.5 p-2">
            {staff.map((s) => {
              const active = String(s.id) === String(selectedId)
              const position = positionOf(s)
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => onSelect(String(s.id))}
                    className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#12544f]/30 ${
                      active ? 'bg-[#12544f]/[0.07]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="relative">
                      <Avatar name={s.full_name} size="sm" />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                          STATUS_DOT[s.status] || 'bg-slate-300'
                        }`}
                        title={humanize(s.status)}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-[13px] font-medium ${
                          active ? 'text-[#12544f]' : 'text-slate-900'
                        }`}
                      >
                        {s.full_name}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">
                        {[position, s.employee_code].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Card>
  )
}

/* ── Profile (detail) ────────────────────────────────────────────── */

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'contracts', label: 'Contracts', countKey: 'contracts' },
  { key: 'documents', label: 'Documents', countKey: 'documents' },
  { key: 'leave', label: 'Leave', countKey: 'leave_requests' },
]

function ProfileHeader({ s, onBack }) {
  const navigate = useNavigate()
  const position = positionOf(s)
  const facts = [
    { icon: CalendarDays, label: 'Joined', value: fmtDate(s.hire_date), hint: tenure(s.hire_date) },
    { icon: Briefcase, label: 'Employment', value: s.employment_type || '—' },
    {
      icon: FileSignature,
      label: 'Contract ends',
      value: s.contract_end_date ? fmtDate(s.contract_end_date) : 'Open-ended',
    },
    {
      icon: KeyRound,
      label: 'Portal login',
      value: s.has_portal_user ? 'Enabled' : 'No login',
      hint: s.has_portal_user ? s.user?.email : null,
    },
  ]

  return (
    <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
      <CardBody className="p-0">
        <div className="flex flex-col gap-4 p-4 @xl:flex-row @xl:items-center @xl:justify-between">
          <div className="flex min-w-0 items-center gap-3.5">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="-ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 lg:hidden"
                aria-label="Back to staff list"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : null}
            <Avatar name={s.full_name} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-semibold tracking-tight text-slate-900">
                  {s.full_name}
                </h2>
                <StatusBadge value={s.status} />
              </div>
              <p className="mt-0.5 truncate text-[13px] text-slate-600">
                {[position, s.department?.name].filter(Boolean).join(' · ') || 'No position assigned'}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {s.employee_code ? `Employee code ${s.employee_code}` : 'No employee code'}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => navigate('/staff/contracts')}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-700 transition-colors hover:border-[#12544f]/40 hover:text-[#12544f]"
            >
              <FileSignature className="h-3.5 w-3.5" />
              Contracts
            </button>
            <button
              type="button"
              onClick={() => navigate('/staff/documents')}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#12544f] px-3 text-xs font-medium text-white transition-colors hover:bg-[#0f4743]"
            >
              <FileText className="h-3.5 w-3.5" />
              Documents
            </button>
          </div>
        </div>

        <dl className="grid grid-cols-2 border-t border-slate-100 @3xl:grid-cols-4">
          {facts.map((f, i) => (
            <div
              key={f.label}
              className={`flex min-w-0 items-start gap-2.5 px-4 py-3 ${
                i % 2 === 1 ? 'border-l border-slate-100' : ''
              } ${i >= 2 ? 'border-t border-slate-100 @3xl:border-t-0' : ''} ${
                i === 2 ? '@3xl:border-l' : ''
              }`}
            >
              <f.icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
              <div className="min-w-0">
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">{f.label}</dt>
                <dd className="truncate text-[13px] font-semibold text-slate-900">{f.value}</dd>
                {f.hint ? (
                  <dd className="truncate text-[11px] text-slate-500" title={f.hint}>
                    {f.hint}
                  </dd>
                ) : null}
              </div>
            </div>
          ))}
        </dl>
      </CardBody>
    </Card>
  )
}

function OverviewTab({ s }) {
  const [showAccount, setShowAccount] = useState(false)
  return (
    <div className="grid gap-4 @4xl:grid-cols-2 [&>*]:min-w-0">
      <SectionCard title="Employment" icon={Briefcase}>
        <InfoList
          rows={[
            ['Department', s.department?.name],
            ['Position', positionOf(s)],
            ['Employment type', s.employment_type],
            ['Hire date', s.hire_date ? fmtDate(s.hire_date) : null],
            ['Contract end', s.contract_end_date ? fmtDate(s.contract_end_date) : 'Open-ended'],
            ['Onboarding', <span key="o" className="capitalize">{humanize(s.onboarding_status)}</span>],
            ...(s.terminated_at ? [['Terminated', fmtDate(s.terminated_at)]] : []),
          ]}
        />
      </SectionCard>

      <SectionCard title="Contact" icon={Mail}>
        <InfoList
          rows={[
            [
              'Email',
              s.email ? (
                <a href={`mailto:${s.email}`} className="text-[#12544f] hover:underline">
                  {s.email}
                </a>
              ) : null,
            ],
            [
              'Phone',
              s.phone ? (
                <a href={`tel:${s.phone}`} className="tabular-nums text-[#12544f] hover:underline">
                  {s.phone}
                </a>
              ) : null,
            ],
            ['Address', s.address],
            ['Emergency contact', s.emergency_contact_name],
            ['Emergency phone', s.emergency_contact_phone],
          ]}
        />
      </SectionCard>

      <SectionCard title="Personal" icon={UserRound}>
        <InfoList
          rows={[
            ['Gender', s.gender ? <span key="g" className="capitalize">{s.gender}</span> : null],
            ['Date of birth', s.date_of_birth ? fmtDate(s.date_of_birth) : null],
            ['National ID (NIDA)', s.national_id ? <span key="n" className="tabular-nums">{s.national_id}</span> : null],
          ]}
        />
      </SectionCard>

      <SectionCard
        title="Payroll & bank"
        icon={Banknote}
        action={
          s.bank_account ? (
            <button
              type="button"
              onClick={() => setShowAccount((v) => !v)}
              className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              aria-pressed={showAccount}
            >
              {showAccount ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showAccount ? 'Hide' : 'Show'} account
            </button>
          ) : null
        }
      >
        <InfoList
          rows={[
            ['Bank', s.bank_name],
            [
              'Account number',
              s.bank_account ? (
                <span className="tabular-nums">
                  {showAccount ? s.bank_account : maskAccount(s.bank_account)}
                </span>
              ) : null,
            ],
            ['Branch', s.bank_branch],
          ]}
        />
      </SectionCard>

      {s.notes ? (
        <div className="@4xl:col-span-2">
          <SectionCard title="Notes" icon={FileText}>
            <p className="whitespace-pre-line text-[13px] leading-relaxed text-slate-700">{s.notes}</p>
          </SectionCard>
        </div>
      ) : null}
    </div>
  )
}

function ContractsTab({ contracts }) {
  const navigate = useNavigate()
  if (!contracts.length) {
    return (
      <EmptyState
        icon={FileSignature}
        title="No contracts on file"
        hint="Add an employment contract to track terms, salary and renewal dates."
        actionLabel="Go to Contracts"
        onAction={() => navigate('/staff/contracts')}
      />
    )
  }
  return (
    <MiniTable
      rows={contracts}
      columns={[
        {
          key: 'title',
          label: 'Contract',
          render: (c) => (
            <div className="min-w-0">
              <p className="font-medium text-slate-900">{c.title || 'Employment contract'}</p>
              {c.contract_number ? <p className="text-[11px] text-slate-500">{c.contract_number}</p> : null}
            </div>
          ),
        },
        { key: 'employment_type', label: 'Type' },
        {
          key: 'period',
          label: 'Period',
          render: (c) => (
            <span className="whitespace-nowrap">
              {fmtDate(c.start_date)} – {c.end_date ? fmtDate(c.end_date) : 'Open-ended'}
            </span>
          ),
        },
        {
          key: 'basic_salary',
          label: 'Basic salary',
          align: 'right',
          render: (c) =>
            c.basic_salary != null ? (
              <span className="whitespace-nowrap">
                {Number(c.basic_salary).toLocaleString()} <span className="text-slate-400">{c.currency}</span>
              </span>
            ) : (
              '—'
            ),
        },
        { key: 'status', label: 'Status', render: (c) => <StatusBadge value={c.status} /> },
      ]}
    />
  )
}

function DocumentsTab({ documents }) {
  const navigate = useNavigate()
  if (!documents.length) {
    return (
      <EmptyState
        icon={FileText}
        title="No documents yet"
        hint="Store IDs, certificates and other HR files for this staff member."
        actionLabel="Go to Documents"
        onAction={() => navigate('/staff/documents')}
      />
    )
  }
  return (
    <MiniTable
      rows={documents}
      columns={[
        {
          key: 'title',
          label: 'Document',
          render: (d) => (
            <div className="flex min-w-0 items-center gap-2">
              <FileText className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
              <span className="truncate font-medium text-slate-900">{d.title}</span>
            </div>
          ),
        },
        { key: 'doc_type', label: 'Type', render: (d) => <span className="capitalize">{humanize(d.doc_type)}</span> },
        { key: 'issued_at', label: 'Issued', render: (d) => fmtDate(d.issued_at) },
        {
          key: 'expires_at',
          label: 'Expires',
          render: (d) => {
            const exp = documentExpiry(d.expires_at)
            return (
              <div className="flex items-center gap-2 whitespace-nowrap">
                {fmtDate(d.expires_at)}
                {exp ? (
                  <Chip size="sm" variant="flat" color={exp.tone} className="h-5 px-1 text-[10px]">
                    {exp.label}
                  </Chip>
                ) : null}
              </div>
            )
          },
        },
        {
          key: 'open',
          label: '',
          align: 'right',
          render: (d) =>
            d.external_url ? (
              <a
                href={d.external_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#12544f] hover:underline"
              >
                Open <ExternalLink className="h-3 w-3" />
              </a>
            ) : null,
        },
      ]}
    />
  )
}

function LeaveTab({ leave }) {
  const navigate = useNavigate()
  if (!leave.length) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No leave requests"
        hint="Leave requests and approvals for this staff member will appear here."
        actionLabel="Go to Leave"
        onAction={() => navigate('/staff/leave')}
      />
    )
  }
  return (
    <MiniTable
      rows={leave}
      columns={[
        { key: 'leave_type', label: 'Type', render: (l) => <span className="capitalize">{humanize(l.leave_type)}</span> },
        {
          key: 'dates',
          label: 'Dates',
          render: (l) => (
            <span className="whitespace-nowrap">
              {fmtDate(l.start_date)} – {fmtDate(l.end_date)}
            </span>
          ),
        },
        { key: 'days', label: 'Days', align: 'right' },
        {
          key: 'reason',
          label: 'Reason',
          render: (l) => <span className="line-clamp-1 text-slate-600">{l.reason || '—'}</span>,
        },
        { key: 'status', label: 'Status', render: (l) => <StatusBadge value={l.status} /> },
      ]}
    />
  )
}

function ProfileDetail({ staffId, onBack }) {
  const [tab, setTab] = useState('overview')
  const detailQ = useQuery({
    queryKey: ['staff', 'detail', staffId],
    queryFn: () => getStaff(staffId),
    enabled: Boolean(staffId),
  })
  const s = detailQ.data?.staff

  if (!staffId) {
    return (
      <Card className="border border-dashed border-slate-300 shadow-none">
        <EmptyState
          icon={UserRound}
          title="Select a staff member"
          hint="Choose someone from the list to see their employment profile, contracts, documents and leave."
        />
      </Card>
    )
  }

  if (detailQ.isLoading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading profile">
        <div className="h-[168px] animate-pulse rounded-xl border border-slate-200 bg-white" />
        <div className="h-10 w-80 max-w-full animate-pulse rounded-lg bg-slate-100" />
        <div className="grid gap-4 @4xl:grid-cols-2">
          <div className="h-56 animate-pulse rounded-xl border border-slate-200 bg-white" />
          <div className="h-56 animate-pulse rounded-xl border border-slate-200 bg-white" />
        </div>
      </div>
    )
  }

  if (detailQ.isError || !s) {
    return (
      <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
        <EmptyState
          icon={AlertTriangle}
          title="Couldn’t load this profile"
          hint={detailQ.error?.message || 'The staff member may have been removed.'}
          actionLabel="Try again"
          onAction={() => detailQ.refetch()}
        />
      </Card>
    )
  }

  const counts = {
    contracts: s.contracts_count ?? s.contracts?.length ?? 0,
    documents: s.documents_count ?? s.documents?.length ?? 0,
    leave_requests: s.leave_requests_count ?? s.leave_requests?.length ?? 0,
  }

  return (
    <div className="space-y-4">
      <ProfileHeader s={s} onBack={onBack} />

      <div className="flex items-center justify-between gap-3 border-b border-slate-200">
        <div
          className="-mb-px flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Profile sections"
        >
          {TABS.map((t) => {
            const active = tab === t.key
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors ${
                  active
                    ? 'border-[#12544f] text-[#12544f]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.label}
                {t.countKey ? (
                  <span
                    className={`rounded-full px-1.5 py-px text-[10px] tabular-nums ${
                      active ? 'bg-[#12544f]/10 text-[#12544f]' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {counts[t.countKey]}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => detailQ.refetch()}
          className="hidden shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-100 hover:text-slate-800 sm:inline-flex"
          title="Refresh profile"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${detailQ.isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div role="tabpanel">
        {tab === 'overview' ? (
          <OverviewTab s={s} />
        ) : (
          <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
            <CardBody className="p-0">
              {tab === 'contracts' ? <ContractsTab contracts={s.contracts || []} /> : null}
              {tab === 'documents' ? <DocumentsTab documents={s.documents || []} /> : null}
              {tab === 'leave' ? <LeaveTab leave={s.leave_requests || []} /> : null}
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  )
}

/* ── Page section ────────────────────────────────────────────────── */

export default function StaffProfiles() {
  const location = useLocation()
  const navigate = useNavigate()
  const selectedId = useMemo(
    () => new URLSearchParams(location.search).get('id') || '',
    [location.search],
  )

  // Keep the selection in the URL (?id=) so profiles can be linked and survive refresh
  const select = (id) => {
    const params = new URLSearchParams(location.search)
    if (id) params.set('id', id)
    else params.delete('id')
    const qs = params.toString()
    navigate(`${location.pathname}${qs ? `?${qs}` : ''}`, { replace: true })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
      <StaffList
        selectedId={selectedId}
        onSelect={select}
        className={`lg:sticky lg:top-0 lg:max-h-[calc(100vh-9.5rem)] ${
          selectedId ? 'hidden lg:flex' : 'max-h-[70vh]'
        }`}
      />
      <div className={`@container min-w-0 ${selectedId ? '' : 'hidden lg:block'}`}>
        {/* key: a new person starts fresh on the Overview tab */}
        <ProfileDetail key={selectedId} staffId={selectedId} onBack={() => select('')} />
      </div>
    </div>
  )
}
