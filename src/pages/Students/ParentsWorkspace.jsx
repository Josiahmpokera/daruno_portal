import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardBody, Chip, useDisclosure } from '@heroui/react'
import {
  BookOpen,
  ClipboardList,
  Plus,
  Search,
  Users,
  UsersRound,
  Wallet,
} from 'lucide-react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import PageHeader from '../../components/Layout/PageHeader.jsx'
import SideSheet from '../../components/Layout/SideSheet.jsx'
import DataTable from '../../components/Tables/DataTable.jsx'
import RowActionsMenu from '../../components/Tables/RowActionsMenu.jsx'
import {
  FormButton,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
} from '../../components/Form'
import { toastError, toastSuccess } from '../../components/Toast'
import {
  createGuardian,
  deleteGuardian,
  listAssignments,
  listGuardians,
  listOutstandingFees,
  listStudents,
  studentStatusSummary,
  updateGuardian,
} from '../../api/domain.js'
import { SectionSkeleton, ValueSkeleton } from '../../components/Loading'

const META = {
  '/parents': {
    title: 'Parents',
    section: 'overview',
    desc: 'Guardian accounts linked to learners (school admin)',
  },
  '/parents/accounts': {
    title: 'Parent Accounts',
    section: 'accounts',
    desc: 'Parents and guardians directory with contacts',
  },
  '/parents/children': {
    title: 'Multiple Children',
    section: 'children',
    desc: 'Guardians linked to more than one learner',
  },
  '/parents/performance': {
    title: 'Student Performance',
    section: 'performance',
    desc: 'Fee and academic snapshot for linked children',
  },
  '/parents/attendance': {
    title: 'Attendance View',
    section: 'attendance',
    desc: 'Open daily attendance for classes of linked students',
  },
  '/parents/homework': {
    title: 'Homework',
    section: 'homework',
    desc: 'Published homework parents can follow up on',
  },
  '/parents/reports': {
    title: 'Download Reports',
    section: 'reports',
    desc: 'Report cards and statements for children',
  },
  '/parents/fees': {
    title: 'Fee Balance',
    section: 'fees',
    desc: 'Outstanding fee balances for guardian-linked students',
  },
  '/parents/announcements': {
    title: 'Announcements',
    section: 'announcements',
    desc: 'School notices for parents and guardians',
  },
  '/parents/messages': {
    title: 'Message Teachers',
    section: 'messages',
    desc: 'Parent–teacher contact channels',
  },
}

const studentLabel = (s) =>
  s
    ? `${s.full_name || [s.first_name, s.last_name].filter(Boolean).join(' ')}${
        s.admission_number ? ` (${s.admission_number})` : ''
      }`
    : '—'

function Stat({ label, value, icon: Icon, tone, onPress }) {
  return (
    <Card
      isPressable={Boolean(onPress)}
      className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]"
      onPress={onPress}
    >
      <CardBody className="flex flex-row items-center gap-2.5 p-2.5">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
          <p className="text-base font-semibold tabular-nums">{value}</p>
        </div>
      </CardBody>
    </Card>
  )
}

function useGuardians(q) {
  return useQuery({
    queryKey: ['guardians', 'parents-ws', q],
    queryFn: () => listGuardians({ q: q || undefined, per_page: 100 }),
    placeholderData: (prev) => prev,
  })
}

function AccountsSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [q, setQ] = useState('')
  const studentsQ = useQuery({
    queryKey: ['students', 'parents-options'],
    queryFn: () => listStudents({ per_page: 100, status: 'active' }),
    staleTime: 60_000,
  })
  const listQ = useGuardians(q)
  const [form, setForm] = useState({
    id: null,
    student_id: '',
    relationship: 'father',
    full_name: '',
    phone: '',
    email: '',
    occupation: '',
    nida_number: '',
    address: '',
    is_primary: true,
  })

  const saveMut = useMutation({
    mutationFn: (payload) =>
      payload.id ? updateGuardian(payload.id, payload) : createGuardian(payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['guardians'] })
      toastSuccess(vars.id ? 'Guardian updated' : 'Guardian added')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Save failed'),
  })
  const delMut = useMutation({
    mutationFn: deleteGuardian,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guardians'] })
      toastSuccess('Guardian removed')
    },
    onError: (e) => toastError(e?.message || 'Delete failed'),
  })

  const columns = useMemo(
    () => [
      { accessorKey: 'full_name', header: 'Guardian' },
      {
        accessorKey: 'relationship',
        header: 'Relation',
        Cell: ({ row }) => (
          <span className="capitalize">{row.original.relationship || '—'}</span>
        ),
      },
      {
        accessorKey: 'student',
        header: 'Student',
        Cell: ({ row }) => studentLabel(row.original.student),
      },
      { accessorKey: 'phone', header: 'Phone', Cell: ({ row }) => row.original.phone || '—' },
      { accessorKey: 'email', header: 'Email', Cell: ({ row }) => row.original.email || '—' },
      {
        accessorKey: 'is_primary',
        header: 'Primary',
        Cell: ({ row }) =>
          row.original.is_primary ? (
            <Chip size="sm" color="success" variant="flat">
              Primary
            </Chip>
          ) : (
            '—'
          ),
      },
      {
        id: 'actions',
        header: '',
        Cell: ({ row }) => (
          <RowActionsMenu
            items={[
              {
                key: 'edit',
                label: 'Edit',
                onPress: () => {
                  const g = row.original
                  setForm({
                    id: g.id,
                    student_id: g.student_id ? String(g.student_id) : '',
                    relationship: g.relationship || 'father',
                    full_name: g.full_name || '',
                    phone: g.phone || '',
                    email: g.email || '',
                    occupation: g.occupation || '',
                    nida_number: g.nida_number || '',
                    address: g.address || '',
                    is_primary: Boolean(g.is_primary),
                  })
                  sheet.onOpen()
                },
              },
              {
                key: 'delete',
                label: 'Remove',
                color: 'danger',
                onPress: () => {
                  if (window.confirm('Remove this guardian?')) delMut.mutate(row.original.id)
                },
              },
            ]}
          />
        ),
      },
    ],
    [delMut, sheet],
  )

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={listQ.data?.guardians || []}
        isLoading={listQ.isLoading}
        emptyMessage="No parents/guardians yet."
        searchPlaceholder="Search guardian or phone…"
        search={q}
        onSearchChange={setQ}
        onRefresh={() => listQ.refetch()}
        isRefreshing={listQ.isFetching}
        toolbarActions={
          <FormButton
            className="h-8 min-h-8"
            startContent={<Plus className="h-3.5 w-3.5" />}
            onPress={() => {
            setForm({
              id: null,
              student_id: '',
              relationship: 'father',
              full_name: '',
              phone: '',
              email: '',
              occupation: '',
              nida_number: '',
              address: '',
              is_primary: true,
            })
            sheet.onOpen()
            }}
          >
            Add guardian
          </FormButton>
        }
      />
      <SideSheet
        isOpen={sheet.isOpen}
        onOpenChange={sheet.onOpenChange}
        title={form.id ? 'Edit guardian' : 'Add guardian'}
        size="md"
      >
        <div className="space-y-3">
          <FormField label="Student" required>
            <FormSelect
              options={(studentsQ.data?.students || []).map((s) => ({
                value: String(s.id),
                label: studentLabel(s),
              }))}
              value={form.student_id}
              onChange={(v) => setForm((f) => ({ ...f, student_id: v }))}
            />
          </FormField>
          <FormField label="Full name" required>
            <FormInput value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
          </FormField>
          <FormField label="Relationship">
            <FormSelect
              options={[
                { value: 'father', label: 'Father' },
                { value: 'mother', label: 'Mother' },
                { value: 'guardian', label: 'Guardian' },
                { value: 'other', label: 'Other' },
              ]}
              value={form.relationship}
              onChange={(v) => setForm((f) => ({ ...f, relationship: v }))}
            />
          </FormField>
          <FormField label="Phone">
            <FormInput value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="07XXXXXXXX" />
          </FormField>
          <FormField label="Email">
            <FormInput value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </FormField>
          <FormField label="NIDA">
            <FormInput value={form.nida_number} onChange={(e) => setForm((f) => ({ ...f, nida_number: e.target.value }))} />
          </FormField>
          <FormField label="Occupation">
            <FormInput value={form.occupation} onChange={(e) => setForm((f) => ({ ...f, occupation: e.target.value }))} />
          </FormField>
          <FormField label="Address">
            <FormTextarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </FormField>
          <FormButton
            className="w-full bg-[#12544f]"
            color="primary"
            isLoading={saveMut.isPending}
            onPress={() =>
              saveMut.mutate({
                id: form.id || undefined,
                student_id: Number(form.student_id),
                relationship: form.relationship,
                full_name: form.full_name,
                phone: form.phone || null,
                email: form.email || null,
                occupation: form.occupation || null,
                nida_number: form.nida_number || null,
                address: form.address || null,
                is_primary: form.is_primary,
              })
            }
          >
            Save
          </FormButton>
        </div>
      </SideSheet>
    </div>
  )
}

function ChildrenSection() {
  const listQ = useGuardians('')
  const groups = useMemo(() => {
    const map = new Map()
    for (const g of listQ.data?.guardians || []) {
      const key = (g.phone || g.nida_number || g.full_name || '').trim().toLowerCase()
      if (!key) continue
      if (!map.has(key)) {
        map.set(key, { key, name: g.full_name, phone: g.phone, children: [] })
      }
      const entry = map.get(key)
      if (g.student) entry.children.push(g.student)
    }
    return [...map.values()].filter((g) => g.children.length > 1)
  }, [listQ.data])

  if (listQ.isLoading) return <SectionSkeleton />
  if (!groups.length) {
    return (
      <p className="text-sm text-slate-500">
        No guardians currently linked to multiple children. Add the same phone/NIDA on each child&apos;s guardian record.
      </p>
    )
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {groups.map((g) => (
        <Card key={g.key} className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
          <CardBody className="space-y-2 p-3.5">
            <div>
              <p className="text-sm font-semibold">{g.name}</p>
              <p className="text-xs text-slate-500">{g.phone || 'No phone'}</p>
            </div>
            <ul className="space-y-1 text-sm">
              {g.children.map((c) => (
                <li key={c.id} className="rounded-md bg-slate-50 px-2 py-1.5">
                  {studentLabel(c)}
                </li>
              ))}
            </ul>
            <Chip size="sm" variant="flat">{g.children.length} children</Chip>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

function FeesSection() {
  const outstandingQ = useQuery({
    queryKey: ['finance', 'outstanding', 'parents'],
    queryFn: () => listOutstandingFees({ per_page: 50 }),
  })
  const money = (n) => Number(n || 0).toLocaleString()
  const columns = useMemo(
    () => [
      {
        accessorKey: 'student',
        header: 'Student',
        Cell: ({ row }) => studentLabel(row.original.student),
      },
      {
        accessorKey: 'reference',
        header: 'Invoice',
        Cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.reference}</span>
        ),
      },
      {
        accessorKey: 'balance_amount',
        header: 'Balance (TZS)',
        Cell: ({ row }) => (
          <span className="font-semibold text-rose-700">{money(row.original.balance_amount)}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => (
          <Chip size="sm" variant="flat" color={row.original.status === 'overdue' ? 'danger' : 'warning'}>
            {row.original.status}
          </Chip>
        ),
      },
    ],
    [],
  )
  if (outstandingQ.isLoading) return <SectionSkeleton />
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        Outstanding invoices parents may see for their children. Total open:{' '}
        <strong>TZS {money(outstandingQ.data?.summary?.total_outstanding)}</strong>
      </p>
      <DataTable
        columns={columns}
        data={outstandingQ.data?.invoices || []}
        emptyMessage="No outstanding balances."
      />
    </div>
  )
}

function HomeworkSection() {
  const listQ = useQuery({
    queryKey: ['learning', 'assignments', 'parents'],
    queryFn: () => listAssignments({ type: 'homework', status: 'published', per_page: 40 }),
  })
  const columns = useMemo(
    () => [
      { accessorKey: 'title', header: 'Homework' },
      { accessorKey: 'subject', header: 'Subject', Cell: ({ row }) => row.original.subject?.name || '—' },
      { accessorKey: 'classroom', header: 'Class', Cell: ({ row }) => row.original.classroom?.name || '—' },
      {
        accessorKey: 'due_at',
        header: 'Due',
        Cell: ({ row }) =>
          row.original.due_at
            ? String(row.original.due_at).slice(0, 16).replace('T', ' ')
            : '—',
      },
    ],
    [],
  )
  if (listQ.isLoading) return <SectionSkeleton />
  return (
    <DataTable
      columns={columns}
      data={listQ.data?.assignments || []}
      emptyMessage="No published homework."
    />
  )
}

function PerformanceSection() {
  const navigate = useNavigate()
  const studentsQ = useQuery({
    queryKey: ['students', 'parents-performance'],
    queryFn: () => listStudents({ per_page: 40, status: 'active' }),
  })
  const students = studentsQ.data?.students || []
  if (studentsQ.isLoading) return <SectionSkeleton />
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        Open a learner profile or fee record to review progress with the parent.
      </p>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {students.map((s) => (
          <Card
            key={s.id}
            isPressable
            className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]"
            onPress={() => navigate(`/students/${s.id}`)}
          >
            <CardBody className="p-3">
              <p className="text-sm font-semibold">{s.full_name}</p>
              <p className="text-xs text-slate-500">
                {s.admission_number || '—'} · {s.classroom?.name || 'No class'}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}

function InfoPanel({ title, body, actionLabel, onAction }) {
  return (
    <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)] max-w-xl">
      <CardBody className="space-y-3 p-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600">{body}</p>
        {actionLabel && onAction ? (
          <FormButton className="bg-[#12544f]" color="primary" onPress={onAction}>
            {actionLabel}
          </FormButton>
        ) : null}
      </CardBody>
    </Card>
  )
}

function Overview() {
  const navigate = useNavigate()
  const guardiansQ = useGuardians('')
  const statusQ = useQuery({
    queryKey: ['students', 'status-summary', 'parents'],
    queryFn: studentStatusSummary,
  })
  const totalG = guardiansQ.data?.meta?.total ?? (guardiansQ.data?.guardians || []).length
  const activeStudents = (statusQ.data?.by_status || []).find((r) => r.status === 'active')?.total ?? 0

  const modules = [
    { t: 'Parent Accounts', d: 'Guardian directory and contacts', p: '/parents/accounts', icon: UsersRound },
    { t: 'Multiple Children', d: 'Families with more than one learner', p: '/parents/children', icon: Users },
    { t: 'Fee Balance', d: 'Outstanding balances for children', p: '/parents/fees', icon: Wallet },
    { t: 'Homework', d: 'Published homework for follow-up', p: '/parents/homework', icon: BookOpen },
    { t: 'Student Performance', d: 'Open learner profiles with parents', p: '/parents/performance', icon: ClipboardList },
    { t: 'Attendance View', d: 'Daily class attendance', p: '/attendance/students/daily', icon: ClipboardList },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
        <Stat label="Guardians" value={guardiansQ.isLoading ? <ValueSkeleton /> : totalG} icon={UsersRound} tone="bg-violet-50 text-violet-700" onPress={() => navigate('/parents/accounts')} />
        <Stat label="Active students" value={statusQ.isLoading ? <ValueSkeleton /> : activeStudents} icon={Users} tone="bg-emerald-50 text-emerald-700" onPress={() => navigate('/students/list')} />
        <Stat label="Multi-child" value="—" icon={Users} tone="bg-sky-50 text-sky-700" onPress={() => navigate('/parents/children')} />
        <Stat label="Fee follow-up" value="Open" icon={Wallet} tone="bg-amber-50 text-amber-800" onPress={() => navigate('/parents/fees')} />
        <Stat label="Homework" value="Open" icon={BookOpen} tone="bg-rose-50 text-rose-700" onPress={() => navigate('/parents/homework')} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map((m) => {
          const Icon = m.icon
          return (
            <Card key={m.p} isPressable className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]" onPress={() => navigate(m.p)}>
              <CardBody className="flex flex-row items-start gap-3 p-3.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#12544f]/8 text-[#12544f]">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{m.t}</h3>
                  <p className="text-xs text-slate-500">{m.d}</p>
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default function ParentsWorkspace() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const meta = META[pathname] || META['/parents']

  let body
  switch (meta.section) {
    case 'overview':
      body = <Overview />
      break
    case 'accounts':
      body = <AccountsSection />
      break
    case 'children':
      body = <ChildrenSection />
      break
    case 'fees':
      body = <FeesSection />
      break
    case 'homework':
      body = <HomeworkSection />
      break
    case 'performance':
      body = <PerformanceSection />
      break
    case 'attendance':
      body = (
        <InfoPanel
          title="Attendance view"
          body="Open daily student attendance to review class presence with parents. Records are taken in the Assess → Attendance module."
          actionLabel="Open daily attendance"
          onAction={() => navigate('/attendance/students/daily')}
        />
      )
      break
    case 'reports':
      body = (
        <InfoPanel
          title="Learner reports"
          body="Print or download report cards for a class or student from Assess → Report cards."
          actionLabel="Open report cards"
          onAction={() => navigate('/report-cards')}
        />
      )
      break
    case 'announcements':
      body = (
        <InfoPanel
          title="Parent announcements"
          body="School-wide notices for guardians. Publish operational updates from Engage → Communication when that channel is enabled."
          actionLabel="Open communication"
          onAction={() => navigate('/communication')}
        />
      )
      break
    case 'messages':
      body = (
        <InfoPanel
          title="Message teachers"
          body="Parent–teacher messaging uses guardian phone/email on the student record. Keep contacts current under Parent Accounts."
          actionLabel="Manage guardian contacts"
          onAction={() => navigate('/parents/accounts')}
        />
      )
      break
    default:
      body = <Overview />
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title={meta.title}
          description={meta.desc}
          breadcrumbs={[
            { label: 'People', href: '/students' },
            { label: 'Parents', href: '/parents' },
            { label: meta.title },
          ]}
        />
        {body}
      </div>
    </DashboardLayout>
  )
}
