import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardBody, Chip, Spinner, useDisclosure } from '@heroui/react'
import {
  ArrowRightLeft,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Layers,
  ListChecks,
  Play,
  Plus,
  RefreshCw,
  Repeat,
  Settings2,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import PageHeader from '../../components/Layout/PageHeader.jsx'
import SideSheet from '../../components/Layout/SideSheet.jsx'
import DataTable from '../../components/Tables/DataTable.jsx'
import {
  FormButton,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
} from '../../components/Form'
import { toastError, toastSuccess } from '../../components/Toast'
import {
  createPromotionRule,
  deletePromotionRule,
  getPromotionReports,
  getPromotionsOverview,
  listClasses,
  listLevels,
  listPromotionCandidates,
  listPromotionRules,
  listPromotionRuns,
  listYears,
  runAutomaticPromotion,
  runManualPromotion,
  runRepeatClass,
  updatePromotionRule,
} from '../../api/domain.js'

const META = {
  '/promotions': {
    title: 'Promotions',
    section: 'overview',
    desc: 'TAMISEMI end-of-year promotion rules, automatic/manual runs and reports',
  },
  '/promotions/rules': {
    title: 'Promotion Rules',
    section: 'rules',
    desc: 'Pass marks, attendance thresholds and class mapping',
  },
  '/promotions/automatic': {
    title: 'Automatic Promotion',
    section: 'automatic',
    desc: 'Preview candidates and promote/repeat by rules',
  },
  '/promotions/manual': {
    title: 'Manual Promotion',
    section: 'manual',
    desc: 'Override and promote selected students to a target class',
  },
  '/promotions/repeat': {
    title: 'Repeat Class',
    section: 'repeat',
    desc: 'Hold back selected students in the same class for the next year',
  },
  '/promotions/reports': {
    title: 'Promotion Reports',
    section: 'reports',
    desc: 'Outcomes by class, run history and totals',
  },
}

function StatCard({ label, value, hint, icon: Icon, tone, onPress }) {
  return (
    <Card
      isPressable={Boolean(onPress)}
      className="border border-slate-200 shadow-none transition-colors hover:border-[#0B3D2E]/30"
      onPress={onPress}
    >
      <CardBody className="flex flex-row items-center gap-2.5 p-2.5">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[10px] font-medium uppercase tracking-wide text-slate-400">
            {label}
          </p>
          <p className="truncate text-base font-semibold tabular-nums text-slate-900">{value}</p>
          {hint ? <p className="truncate text-[10px] text-slate-500">{hint}</p> : null}
        </div>
      </CardBody>
    </Card>
  )
}

function useLookups() {
  const yearsQ = useQuery({ queryKey: ['academic', 'years'], queryFn: listYears, staleTime: 60_000 })
  const classesQ = useQuery({
    queryKey: ['academic', 'classes'],
    queryFn: listClasses,
    staleTime: 60_000,
  })
  const levelsQ = useQuery({
    queryKey: ['academic', 'levels'],
    queryFn: listLevels,
    staleTime: 60_000,
  })
  return {
    years: (yearsQ.data?.academic_years || yearsQ.data?.years || []).map((y) => ({
      value: String(y.id),
      label: y.name,
    })),
    classes: (classesQ.data?.classes || []).map((c) => ({
      value: String(c.id),
      label: c.name,
    })),
    levels: (levelsQ.data?.levels || []).map((l) => ({
      value: String(l.id),
      label: l.name,
    })),
    loading: yearsQ.isLoading || classesQ.isLoading,
  }
}

function outcomeChip(outcome) {
  const map = {
    promoted: { color: 'success', label: 'Promoted' },
    repeated: { color: 'warning', label: 'Repeated' },
    skipped: { color: 'default', label: 'Skipped' },
  }
  const m = map[outcome] || { color: 'default', label: outcome || '—' }
  return (
    <Chip size="sm" variant="flat" color={m.color}>
      {m.label}
    </Chip>
  )
}

// ── Overview ─────────────────────────────────────────────────────

function OverviewSection() {
  const navigate = useNavigate()
  const q = useQuery({
    queryKey: ['promotions', 'overview'],
    queryFn: getPromotionsOverview,
    staleTime: 30_000,
  })
  const s = q.data?.summary || {}
  const loading = q.isLoading

  const stats = [
    {
      label: 'Active rules',
      value: loading ? '…' : String(s.active_rules ?? 0),
      hint: `${s.total_rules ?? 0} total`,
      icon: Settings2,
      tone: 'bg-sky-50 text-sky-700',
      path: '/promotions/rules',
    },
    {
      label: 'Promotion runs',
      value: loading ? '…' : String(s.runs ?? 0),
      hint: s.last_run_at ? `Last: ${new Date(s.last_run_at).toLocaleDateString()}` : 'No runs yet',
      icon: Play,
      tone: 'bg-indigo-50 text-indigo-700',
      path: '/promotions/reports',
    },
    {
      label: 'Promoted',
      value: loading ? '…' : String(s.promoted ?? 0),
      hint: 'All-time decisions',
      icon: CheckCircle2,
      tone: 'bg-emerald-50 text-emerald-700',
      path: '/promotions/reports',
    },
    {
      label: 'Repeated',
      value: loading ? '…' : String(s.repeated ?? 0),
      hint: 'Held back',
      icon: Repeat,
      tone: 'bg-amber-50 text-amber-800',
      path: '/promotions/repeat',
    },
  ]

  const modules = [
    {
      t: 'Promotion Rules',
      d: 'Average %, attendance % and class mapping (TAMISEMI)',
      p: '/promotions/rules',
      icon: ListChecks,
    },
    {
      t: 'Automatic Promotion',
      d: 'Evaluate rules → promote eligible, repeat others',
      p: '/promotions/automatic',
      icon: ArrowRightLeft,
    },
    {
      t: 'Manual Promotion',
      d: 'Force-promote selected students to a target class',
      p: '/promotions/manual',
      icon: UserCheck,
    },
    {
      t: 'Repeat Class',
      d: 'Hold selected students in the same class next year',
      p: '/promotions/repeat',
      icon: Repeat,
    },
    {
      t: 'Promotion Reports',
      d: 'By class, by outcome and run history',
      p: '/promotions/reports',
      icon: BarChart3,
    },
  ]

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2">
          <h2 className="text-sm font-semibold text-slate-900">At a glance</h2>
          <p className="text-xs text-slate-500">Live promotion statistics</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {stats.map((st) => (
            <StatCard key={st.label} {...st} onPress={() => navigate(st.path)} />
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2">
          <h2 className="text-sm font-semibold text-slate-900">Workflows</h2>
          <p className="text-xs text-slate-500">Industrial end-of-year promotion process</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((c) => {
            const Icon = c.icon
            return (
              <Card
                key={c.p}
                isPressable
                className="border border-slate-200 shadow-none transition-colors hover:border-[#0B3D2E]/40"
                onPress={() => navigate(c.p)}
              >
                <CardBody className="flex flex-row items-start gap-3 p-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0B3D2E]/8 text-[#0B3D2E]">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900">{c.t}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">{c.d}</p>
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Rules ────────────────────────────────────────────────────────

function RulesSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const lookups = useLookups()
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({
    name: '',
    education_level_id: '',
    from_classroom_id: '',
    to_classroom_id: '',
    min_average_percent: '40',
    min_attendance_percent: '75',
    priority: '10',
    is_active: true,
    notes: '',
  })

  const rulesQ = useQuery({
    queryKey: ['promotions', 'rules'],
    queryFn: listPromotionRules,
  })

  const resetForm = () => {
    setEditId(null)
    setForm({
      name: '',
      education_level_id: '',
      from_classroom_id: '',
      to_classroom_id: '',
      min_average_percent: '40',
      min_attendance_percent: '75',
      priority: '10',
      is_active: true,
      notes: '',
    })
  }

  const openCreate = () => {
    resetForm()
    sheet.onOpen()
  }

  const openEdit = (row) => {
    setEditId(row.id)
    setForm({
      name: row.name || '',
      education_level_id: row.education_level_id ? String(row.education_level_id) : '',
      from_classroom_id: row.from_classroom_id ? String(row.from_classroom_id) : '',
      to_classroom_id: row.to_classroom_id ? String(row.to_classroom_id) : '',
      min_average_percent: String(row.min_average_percent ?? 40),
      min_attendance_percent: String(row.min_attendance_percent ?? 75),
      priority: String(row.priority ?? 10),
      is_active: row.is_active !== false,
      notes: row.notes || '',
    })
    sheet.onOpen()
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        education_level_id: form.education_level_id ? Number(form.education_level_id) : null,
        from_classroom_id: form.from_classroom_id ? Number(form.from_classroom_id) : null,
        to_classroom_id: form.to_classroom_id ? Number(form.to_classroom_id) : null,
        min_average_percent: Number(form.min_average_percent),
        min_attendance_percent: Number(form.min_attendance_percent),
        priority: Number(form.priority) || 10,
        is_active: Boolean(form.is_active),
        notes: form.notes || null,
      }
      if (editId) return updatePromotionRule(editId, payload)
      return createPromotionRule(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['promotions'] })
      toastSuccess(editId ? 'Rule updated' : 'Rule created')
      sheet.onClose()
      resetForm()
    },
    onError: (e) => toastError(e?.message || 'Failed to save rule'),
  })

  const delMut = useMutation({
    mutationFn: (id) => deletePromotionRule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['promotions'] })
      toastSuccess('Rule deleted')
    },
    onError: (e) => toastError(e?.message || 'Failed to delete'),
  })

  const columns = useMemo(
    () => [
      { accessorKey: 'name', header: 'Rule' },
      {
        id: 'scope',
        header: 'Scope',
        Cell: ({ row }) => {
          const r = row.original
          if (r.from_classroom) return r.from_classroom.name
          if (r.education_level) return r.education_level.name
          return 'All classes'
        },
      },
      {
        id: 'to',
        header: 'Next class',
        Cell: ({ row }) => row.original.to_classroom?.name || 'Auto (next in level)',
      },
      {
        id: 'avg',
        header: 'Min avg %',
        Cell: ({ row }) => `${row.original.min_average_percent ?? 40}%`,
      },
      {
        id: 'att',
        header: 'Min att %',
        Cell: ({ row }) => `${row.original.min_attendance_percent ?? 75}%`,
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
      },
      {
        id: 'active',
        header: 'Status',
        Cell: ({ row }) =>
          row.original.is_active ? (
            <Chip size="sm" color="success" variant="flat">
              Active
            </Chip>
          ) : (
            <Chip size="sm" color="default" variant="flat">
              Inactive
            </Chip>
          ),
      },
    ],
    [],
  )

  const rows = rulesQ.data?.rules || []

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          Rules are matched by class first, then education level, then school-wide defaults.
        </p>
        <FormButton size="sm" onPress={openCreate} startContent={<Plus className="h-3.5 w-3.5" />}>
          Add rule
        </FormButton>
      </div>
      {rulesQ.isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="sm" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          emptyMessage="No promotion rules yet. Add pass-mark and attendance thresholds."
          enableRowSelection={false}
          enableRowActions
          renderRowActions={({ row }) => (
            <div className="flex gap-1">
              <FormButton size="sm" variant="light" onPress={() => openEdit(row.original)}>
                Edit
              </FormButton>
              <FormButton
                size="sm"
                variant="light"
                color="danger"
                onPress={() => {
                  if (window.confirm('Delete this promotion rule?')) delMut.mutate(row.original.id)
                }}
              >
                Delete
              </FormButton>
            </div>
          )}
        />
      )}

      <SideSheet
        isOpen={sheet.isOpen}
        onOpenChange={sheet.onOpenChange}
        title={editId ? 'Edit promotion rule' : 'New promotion rule'}
      >
        <div className="flex flex-col gap-3">
          <FormField label="Rule name" required>
            <FormInput
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Standard pass — Form 1"
            />
          </FormField>
          <FormField label="Education level (optional)">
            <FormSelect
              value={form.education_level_id}
              onChange={(v) => setForm((f) => ({ ...f, education_level_id: v }))}
              options={[{ value: '', label: 'Any' }, ...lookups.levels]}
            />
          </FormField>
          <FormField label="From classroom (optional)">
            <FormSelect
              value={form.from_classroom_id}
              onChange={(v) => setForm((f) => ({ ...f, from_classroom_id: v }))}
              options={[{ value: '', label: 'Any class' }, ...lookups.classes]}
            />
          </FormField>
          <FormField label="To classroom (optional)">
            <FormSelect
              value={form.to_classroom_id}
              onChange={(v) => setForm((f) => ({ ...f, to_classroom_id: v }))}
              options={[
                { value: '', label: 'Auto (next class in level)' },
                ...lookups.classes,
              ]}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Min average %" required>
              <FormInput
                type="number"
                min={0}
                max={100}
                value={form.min_average_percent}
                onChange={(e) => setForm((f) => ({ ...f, min_average_percent: e.target.value }))}
              />
            </FormField>
            <FormField label="Min attendance %" required>
              <FormInput
                type="number"
                min={0}
                max={100}
                value={form.min_attendance_percent}
                onChange={(e) =>
                  setForm((f) => ({ ...f, min_attendance_percent: e.target.value }))
                }
              />
            </FormField>
          </div>
          <FormField label="Priority (lower = higher)">
            <FormInput
              type="number"
              min={1}
              max={100}
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            />
          </FormField>
          <FormField label="Status">
            <FormSelect
              value={form.is_active ? '1' : '0'}
              onChange={(v) => setForm((f) => ({ ...f, is_active: v === '1' }))}
              options={[
                { value: '1', label: 'Active' },
                { value: '0', label: 'Inactive' },
              ]}
            />
          </FormField>
          <FormField label="Notes">
            <FormTextarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Optional policy notes"
            />
          </FormField>
          <FormButton
            isLoading={saveMut.isPending}
            onPress={() => {
              if (!form.name.trim()) {
                toastError('Rule name is required')
                return
              }
              saveMut.mutate()
            }}
          >
            {editId ? 'Save changes' : 'Create rule'}
          </FormButton>
        </div>
      </SideSheet>
    </div>
  )
}

// ── Automatic ────────────────────────────────────────────────────

function AutomaticSection() {
  const qc = useQueryClient()
  const lookups = useLookups()
  const [fromYear, setFromYear] = useState('')
  const [toYear, setToYear] = useState('')
  const [classroomId, setClassroomId] = useState('')
  const [title, setTitle] = useState('Automatic promotion')
  const [preview, setPreview] = useState(null)

  const candidatesMut = useMutation({
    mutationFn: () =>
      listPromotionCandidates({
        from_academic_year_id: Number(fromYear),
        classroom_id: classroomId ? Number(classroomId) : undefined,
      }),
    onSuccess: (data) => {
      setPreview(data)
      toastSuccess(
        `Loaded ${data?.summary?.total ?? 0} candidates (${data?.summary?.eligible ?? 0} eligible)`,
      )
    },
    onError: (e) => toastError(e?.message || 'Failed to load candidates'),
  })

  const dryMut = useMutation({
    mutationFn: () =>
      runAutomaticPromotion({
        from_academic_year_id: Number(fromYear),
        to_academic_year_id: Number(toYear),
        classroom_id: classroomId ? Number(classroomId) : null,
        title,
        dry_run: true,
      }),
    onSuccess: (data) => {
      setPreview({
        candidates: data?.candidates || [],
        summary: data?.summary || {},
        dry_run: true,
      })
      toastSuccess('Dry run complete — no enrollments changed')
    },
    onError: (e) => toastError(e?.message || 'Dry run failed'),
  })

  const runMut = useMutation({
    mutationFn: () =>
      runAutomaticPromotion({
        from_academic_year_id: Number(fromYear),
        to_academic_year_id: Number(toYear),
        classroom_id: classroomId ? Number(classroomId) : null,
        title,
        dry_run: false,
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['promotions'] })
      const r = data?.run || {}
      toastSuccess(
        `Promotion complete: ${r.promoted_count ?? 0} promoted, ${r.repeated_count ?? 0} repeated`,
      )
      setPreview(null)
    },
    onError: (e) => toastError(e?.message || 'Promotion failed'),
  })

  const columns = useMemo(
    () => [
      {
        id: 'student',
        header: 'Student',
        Cell: ({ row }) => {
          const s = row.original.student || {}
          return (
            <div>
              <p className="text-sm font-medium">{s.full_name || '—'}</p>
              <p className="text-[11px] text-slate-500">{s.admission_number || ''}</p>
            </div>
          )
        },
      },
      {
        id: 'from',
        header: 'From',
        Cell: ({ row }) => row.original.from_classroom?.name || '—',
      },
      {
        id: 'to',
        header: 'Suggested to',
        Cell: ({ row }) =>
          row.original.eligible
            ? row.original.suggested_to_classroom?.name || '—'
            : row.original.from_classroom?.name || '—',
      },
      {
        id: 'avg',
        header: 'Avg %',
        Cell: ({ row }) => (
          <span className="tabular-nums">{row.original.average_percent ?? 0}</span>
        ),
      },
      {
        id: 'att',
        header: 'Att %',
        Cell: ({ row }) => (
          <span className="tabular-nums">{row.original.attendance_percent ?? 0}</span>
        ),
      },
      {
        id: 'eligible',
        header: 'Eligible',
        Cell: ({ row }) =>
          row.original.eligible ? (
            <Chip size="sm" color="success" variant="flat" startContent={<CheckCircle2 className="h-3 w-3" />}>
              Yes
            </Chip>
          ) : (
            <Chip size="sm" color="warning" variant="flat" startContent={<XCircle className="h-3 w-3" />}>
              No
            </Chip>
          ),
      },
      {
        id: 'outcome',
        header: 'Outcome',
        Cell: ({ row }) => outcomeChip(row.original.suggested_outcome),
      },
      {
        id: 'rule',
        header: 'Rule',
        Cell: ({ row }) => row.original.rule?.name || 'Default (40% / 75%)',
      },
    ],
    [],
  )

  const candidates = preview?.candidates || []
  const summary = preview?.summary || {}

  return (
    <div className="space-y-4">
      <Card className="border border-slate-200 shadow-none">
        <CardBody className="space-y-3 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="From academic year" required>
              <FormSelect
                value={fromYear}
                onChange={setFromYear}
                options={[{ value: '', label: 'Select year' }, ...lookups.years]}
              />
            </FormField>
            <FormField label="To academic year" required>
              <FormSelect
                value={toYear}
                onChange={setToYear}
                options={[{ value: '', label: 'Select year' }, ...lookups.years]}
              />
            </FormField>
            <FormField label="Classroom (optional)">
              <FormSelect
                value={classroomId}
                onChange={setClassroomId}
                options={[{ value: '', label: 'All classes' }, ...lookups.classes]}
              />
            </FormField>
            <FormField label="Run title">
              <FormInput value={title} onChange={(e) => setTitle(e.target.value)} />
            </FormField>
          </div>
          <div className="flex flex-wrap gap-2">
            <FormButton
              size="sm"
              variant="bordered"
              isLoading={candidatesMut.isPending}
              startContent={<Users className="h-3.5 w-3.5" />}
              onPress={() => {
                if (!fromYear) {
                  toastError('Select source academic year')
                  return
                }
                candidatesMut.mutate()
              }}
            >
              Preview candidates
            </FormButton>
            <FormButton
              size="sm"
              variant="bordered"
              isLoading={dryMut.isPending}
              startContent={<ClipboardList className="h-3.5 w-3.5" />}
              onPress={() => {
                if (!fromYear || !toYear) {
                  toastError('Select source and target years')
                  return
                }
                if (fromYear === toYear) {
                  toastError('Source and target years must differ')
                  return
                }
                dryMut.mutate()
              }}
            >
              Dry run
            </FormButton>
            <FormButton
              size="sm"
              color="primary"
              isLoading={runMut.isPending}
              startContent={<Play className="h-3.5 w-3.5" />}
              onPress={() => {
                if (!fromYear || !toYear) {
                  toastError('Select source and target years')
                  return
                }
                if (fromYear === toYear) {
                  toastError('Source and target years must differ')
                  return
                }
                if (
                  !window.confirm(
                    'Run automatic promotion? Eligible students will be promoted; others will repeat the same class in the target year. Source enrollments will be closed.',
                  )
                ) {
                  return
                }
                runMut.mutate()
              }}
            >
              Run automatic promotion
            </FormButton>
          </div>
        </CardBody>
      </Card>

      {preview ? (
        <>
          <div className="grid grid-cols-3 gap-2.5">
            <StatCard
              label="Total"
              value={String(summary.total ?? candidates.length)}
              icon={Users}
              tone="bg-slate-100 text-slate-700"
            />
            <StatCard
              label="Eligible"
              value={String(summary.eligible ?? 0)}
              icon={CheckCircle2}
              tone="bg-emerald-50 text-emerald-700"
            />
            <StatCard
              label="Not eligible"
              value={String(summary.not_eligible ?? 0)}
              icon={XCircle}
              tone="bg-amber-50 text-amber-800"
            />
          </div>
          <DataTable
            columns={columns}
            data={candidates}
            emptyMessage="No active enrollments for this year/class."
            enableRowSelection={false}
            getRowId={(row) => String(row.student_id)}
          />
        </>
      ) : null}
    </div>
  )
}

// ── Manual ───────────────────────────────────────────────────────

function ManualSection() {
  const qc = useQueryClient()
  const lookups = useLookups()
  const [fromYear, setFromYear] = useState('')
  const [toYear, setToYear] = useState('')
  const [toClassroom, setToClassroom] = useState('')
  const [classroomFilter, setClassroomFilter] = useState('')
  const [reason, setReason] = useState('Manual promotion override')
  const [title, setTitle] = useState('Manual promotion')
  const [candidates, setCandidates] = useState([])
  const [selection, setSelection] = useState({})

  const loadMut = useMutation({
    mutationFn: () =>
      listPromotionCandidates({
        from_academic_year_id: Number(fromYear),
        classroom_id: classroomFilter ? Number(classroomFilter) : undefined,
      }),
    onSuccess: (data) => {
      setCandidates(data?.candidates || [])
      setSelection({})
      toastSuccess(`Loaded ${data?.summary?.total ?? 0} students`)
    },
    onError: (e) => toastError(e?.message || 'Failed to load students'),
  })

  const runMut = useMutation({
    mutationFn: (studentIds) =>
      runManualPromotion({
        from_academic_year_id: Number(fromYear),
        to_academic_year_id: Number(toYear),
        to_classroom_id: Number(toClassroom),
        student_ids: studentIds,
        title,
        reason,
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['promotions'] })
      const r = data?.run || {}
      toastSuccess(`Manual promotion: ${r.promoted_count ?? 0} student(s) promoted`)
      setSelection({})
      loadMut.mutate()
    },
    onError: (e) => toastError(e?.message || 'Manual promotion failed'),
  })

  const columns = useMemo(
    () => [
      {
        id: 'student',
        header: 'Student',
        Cell: ({ row }) => {
          const s = row.original.student || {}
          return (
            <div>
              <p className="text-sm font-medium">{s.full_name || '—'}</p>
              <p className="text-[11px] text-slate-500">{s.admission_number || ''}</p>
            </div>
          )
        },
      },
      {
        id: 'from',
        header: 'Current class',
        Cell: ({ row }) => row.original.from_classroom?.name || '—',
      },
      {
        id: 'avg',
        header: 'Avg %',
        Cell: ({ row }) => (
          <span className="tabular-nums">{row.original.average_percent ?? 0}</span>
        ),
      },
      {
        id: 'att',
        header: 'Att %',
        Cell: ({ row }) => (
          <span className="tabular-nums">{row.original.attendance_percent ?? 0}</span>
        ),
      },
      {
        id: 'eligible',
        header: 'Rule eligible',
        Cell: ({ row }) =>
          row.original.eligible ? (
            <Chip size="sm" color="success" variant="flat">
              Yes
            </Chip>
          ) : (
            <Chip size="sm" color="warning" variant="flat">
              No
            </Chip>
          ),
      },
    ],
    [],
  )

  const selectedIds = Object.keys(selection)
    .filter((k) => selection[k])
    .map(Number)

  return (
    <div className="space-y-4">
      <Card className="border border-slate-200 shadow-none">
        <CardBody className="space-y-3 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="From academic year" required>
              <FormSelect
                value={fromYear}
                onChange={setFromYear}
                options={[{ value: '', label: 'Select year' }, ...lookups.years]}
              />
            </FormField>
            <FormField label="To academic year" required>
              <FormSelect
                value={toYear}
                onChange={setToYear}
                options={[{ value: '', label: 'Select year' }, ...lookups.years]}
              />
            </FormField>
            <FormField label="Target classroom" required>
              <FormSelect
                value={toClassroom}
                onChange={setToClassroom}
                options={[{ value: '', label: 'Select class' }, ...lookups.classes]}
              />
            </FormField>
            <FormField label="Filter source class">
              <FormSelect
                value={classroomFilter}
                onChange={setClassroomFilter}
                options={[{ value: '', label: 'All classes' }, ...lookups.classes]}
              />
            </FormField>
            <FormField label="Title">
              <FormInput value={title} onChange={(e) => setTitle(e.target.value)} />
            </FormField>
            <FormField label="Reason">
              <FormInput value={reason} onChange={(e) => setReason(e.target.value)} />
            </FormField>
          </div>
          <div className="flex flex-wrap gap-2">
            <FormButton
              size="sm"
              variant="bordered"
              isLoading={loadMut.isPending}
              startContent={<RefreshCw className="h-3.5 w-3.5" />}
              onPress={() => {
                if (!fromYear) {
                  toastError('Select source year')
                  return
                }
                loadMut.mutate()
              }}
            >
              Load students
            </FormButton>
            <FormButton
              size="sm"
              color="primary"
              isLoading={runMut.isPending}
              isDisabled={!selectedIds.length}
              startContent={<UserCheck className="h-3.5 w-3.5" />}
              onPress={() => {
                if (!fromYear || !toYear || !toClassroom) {
                  toastError('Select years and target class')
                  return
                }
                if (fromYear === toYear) {
                  toastError('Source and target years must differ')
                  return
                }
                if (
                  !window.confirm(
                    `Promote ${selectedIds.length} selected student(s) to the target class?`,
                  )
                ) {
                  return
                }
                runMut.mutate(selectedIds)
              }}
            >
              Promote selected ({selectedIds.length})
            </FormButton>
          </div>
        </CardBody>
      </Card>

      <DataTable
        columns={columns}
        data={candidates}
        emptyMessage="Load students from a source year to select for manual promotion."
        enableRowSelection
        rowSelection={selection}
        onRowSelectionChange={setSelection}
        getRowId={(row) => String(row.student_id)}
      />
    </div>
  )
}

// ── Repeat ───────────────────────────────────────────────────────

function RepeatSection() {
  const qc = useQueryClient()
  const lookups = useLookups()
  const [fromYear, setFromYear] = useState('')
  const [toYear, setToYear] = useState('')
  const [classroomFilter, setClassroomFilter] = useState('')
  const [reason, setReason] = useState('Repeat class (held back)')
  const [title, setTitle] = useState('Repeat class')
  const [candidates, setCandidates] = useState([])
  const [selection, setSelection] = useState({})

  const loadMut = useMutation({
    mutationFn: () =>
      listPromotionCandidates({
        from_academic_year_id: Number(fromYear),
        classroom_id: classroomFilter ? Number(classroomFilter) : undefined,
      }),
    onSuccess: (data) => {
      setCandidates(data?.candidates || [])
      setSelection({})
      toastSuccess(`Loaded ${data?.summary?.total ?? 0} students`)
    },
    onError: (e) => toastError(e?.message || 'Failed to load students'),
  })

  const runMut = useMutation({
    mutationFn: (studentIds) =>
      runRepeatClass({
        from_academic_year_id: Number(fromYear),
        to_academic_year_id: Number(toYear),
        student_ids: studentIds,
        title,
        reason,
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['promotions'] })
      const r = data?.run || {}
      toastSuccess(`Repeat recorded: ${r.repeated_count ?? 0} student(s)`)
      setSelection({})
      loadMut.mutate()
    },
    onError: (e) => toastError(e?.message || 'Repeat failed'),
  })

  const columns = useMemo(
    () => [
      {
        id: 'student',
        header: 'Student',
        Cell: ({ row }) => {
          const s = row.original.student || {}
          return (
            <div>
              <p className="text-sm font-medium">{s.full_name || '—'}</p>
              <p className="text-[11px] text-slate-500">{s.admission_number || ''}</p>
            </div>
          )
        },
      },
      {
        id: 'from',
        header: 'Class (will repeat)',
        Cell: ({ row }) => row.original.from_classroom?.name || '—',
      },
      {
        id: 'avg',
        header: 'Avg %',
        Cell: ({ row }) => (
          <span className="tabular-nums">{row.original.average_percent ?? 0}</span>
        ),
      },
      {
        id: 'att',
        header: 'Att %',
        Cell: ({ row }) => (
          <span className="tabular-nums">{row.original.attendance_percent ?? 0}</span>
        ),
      },
      {
        id: 'suggested',
        header: 'Rule suggests',
        Cell: ({ row }) => outcomeChip(row.original.suggested_outcome),
      },
    ],
    [],
  )

  const selectedIds = Object.keys(selection)
    .filter((k) => selection[k])
    .map(Number)

  return (
    <div className="space-y-4">
      <Card className="border border-slate-200 shadow-none">
        <CardBody className="space-y-3 p-4">
          <p className="text-xs text-slate-500">
            Selected students keep the same classroom in the target academic year. Source
            enrollments are closed as <strong>repeated</strong>.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="From academic year" required>
              <FormSelect
                value={fromYear}
                onChange={setFromYear}
                options={[{ value: '', label: 'Select year' }, ...lookups.years]}
              />
            </FormField>
            <FormField label="To academic year" required>
              <FormSelect
                value={toYear}
                onChange={setToYear}
                options={[{ value: '', label: 'Select year' }, ...lookups.years]}
              />
            </FormField>
            <FormField label="Filter class">
              <FormSelect
                value={classroomFilter}
                onChange={setClassroomFilter}
                options={[{ value: '', label: 'All classes' }, ...lookups.classes]}
              />
            </FormField>
            <FormField label="Title">
              <FormInput value={title} onChange={(e) => setTitle(e.target.value)} />
            </FormField>
            <FormField label="Reason">
              <FormInput value={reason} onChange={(e) => setReason(e.target.value)} />
            </FormField>
          </div>
          <div className="flex flex-wrap gap-2">
            <FormButton
              size="sm"
              variant="bordered"
              isLoading={loadMut.isPending}
              startContent={<RefreshCw className="h-3.5 w-3.5" />}
              onPress={() => {
                if (!fromYear) {
                  toastError('Select source year')
                  return
                }
                loadMut.mutate()
              }}
            >
              Load students
            </FormButton>
            <FormButton
              size="sm"
              color="warning"
              isLoading={runMut.isPending}
              isDisabled={!selectedIds.length}
              startContent={<Repeat className="h-3.5 w-3.5" />}
              onPress={() => {
                if (!fromYear || !toYear) {
                  toastError('Select source and target years')
                  return
                }
                if (fromYear === toYear) {
                  toastError('Source and target years must differ')
                  return
                }
                if (
                  !window.confirm(
                    `Record repeat class for ${selectedIds.length} selected student(s)?`,
                  )
                ) {
                  return
                }
                runMut.mutate(selectedIds)
              }}
            >
              Repeat selected ({selectedIds.length})
            </FormButton>
          </div>
        </CardBody>
      </Card>

      <DataTable
        columns={columns}
        data={candidates}
        emptyMessage="Load students to select for repeat class."
        enableRowSelection
        rowSelection={selection}
        onRowSelectionChange={setSelection}
        getRowId={(row) => String(row.student_id)}
      />
    </div>
  )
}

// ── Reports ──────────────────────────────────────────────────────

function ReportsSection() {
  const lookups = useLookups()
  const [yearId, setYearId] = useState('')

  const reportsQ = useQuery({
    queryKey: ['promotions', 'reports', yearId],
    queryFn: () =>
      getPromotionReports(yearId ? { academic_year_id: Number(yearId) } : {}),
  })
  const runsQ = useQuery({
    queryKey: ['promotions', 'runs'],
    queryFn: listPromotionRuns,
  })

  const totals = reportsQ.data?.totals || {}
  const byClass = reportsQ.data?.by_class || []
  const recent = reportsQ.data?.recent_runs || runsQ.data?.runs || []

  const classColumns = useMemo(
    () => [
      { accessorKey: 'classroom', header: 'Classroom' },
      {
        accessorKey: 'promoted',
        header: 'Promoted',
        Cell: ({ row }) => (
          <span className="tabular-nums text-emerald-700">{row.original.promoted ?? 0}</span>
        ),
      },
      {
        accessorKey: 'repeated',
        header: 'Repeated',
        Cell: ({ row }) => (
          <span className="tabular-nums text-amber-700">{row.original.repeated ?? 0}</span>
        ),
      },
      {
        accessorKey: 'skipped',
        header: 'Skipped',
        Cell: ({ row }) => (
          <span className="tabular-nums">{row.original.skipped ?? 0}</span>
        ),
      },
      {
        accessorKey: 'total',
        header: 'Total',
        Cell: ({ row }) => <span className="tabular-nums font-medium">{row.original.total ?? 0}</span>,
      },
    ],
    [],
  )

  const runColumns = useMemo(
    () => [
      {
        id: 'title',
        header: 'Run',
        Cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium">{row.original.title || row.original.mode}</p>
            <p className="text-[11px] text-slate-500">
              {row.original.run_at
                ? new Date(row.original.run_at).toLocaleString()
                : '—'}
            </p>
          </div>
        ),
      },
      {
        id: 'mode',
        header: 'Mode',
        Cell: ({ row }) => (
          <Chip size="sm" variant="flat">
            {row.original.mode}
          </Chip>
        ),
      },
      {
        id: 'years',
        header: 'Years',
        Cell: ({ row }) =>
          `${row.original.from_year?.name || '—'} → ${row.original.to_year?.name || '—'}`,
      },
      {
        id: 'promoted',
        header: 'Promoted',
        Cell: ({ row }) => (
          <span className="tabular-nums">{row.original.promoted_count ?? 0}</span>
        ),
      },
      {
        id: 'repeated',
        header: 'Repeated',
        Cell: ({ row }) => (
          <span className="tabular-nums">{row.original.repeated_count ?? 0}</span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        Cell: ({ row }) => (
          <Chip
            size="sm"
            color={row.original.status === 'completed' ? 'success' : 'default'}
            variant="flat"
          >
            {row.original.status}
          </Chip>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-56">
          <FormField label="Filter by source year">
            <FormSelect
              value={yearId}
              onChange={setYearId}
              options={[{ value: '', label: 'All years' }, ...lookups.years]}
            />
          </FormField>
        </div>
        <FormButton
          size="sm"
          variant="bordered"
          startContent={<RefreshCw className="h-3.5 w-3.5" />}
          onPress={() => {
            reportsQ.refetch()
            runsQ.refetch()
          }}
        >
          Refresh
        </FormButton>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <StatCard
          label="Promoted"
          value={reportsQ.isLoading ? '…' : String(totals.promoted ?? 0)}
          icon={CheckCircle2}
          tone="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          label="Repeated"
          value={reportsQ.isLoading ? '…' : String(totals.repeated ?? 0)}
          icon={Repeat}
          tone="bg-amber-50 text-amber-800"
        />
        <StatCard
          label="Skipped"
          value={reportsQ.isLoading ? '…' : String(totals.skipped ?? 0)}
          icon={Layers}
          tone="bg-slate-100 text-slate-700"
        />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-900">By classroom</h3>
        {reportsQ.isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="sm" />
          </div>
        ) : (
          <DataTable
            columns={classColumns}
            data={byClass}
            emptyMessage="No promotion decisions yet."
            enableRowSelection={false}
            getRowId={(row, i) => String(row.classroom || i)}
          />
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-900">Recent runs</h3>
        {runsQ.isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="sm" />
          </div>
        ) : (
          <DataTable
            columns={runColumns}
            data={recent}
            emptyMessage="No promotion runs yet."
            enableRowSelection={false}
          />
        )}
      </div>
    </div>
  )
}

// ── Shell ────────────────────────────────────────────────────────

export default function PromotionsWorkspace() {
  const { pathname } = useLocation()
  const meta = META[pathname] || META['/promotions']
  let body
  switch (meta.section) {
    case 'overview':
      body = <OverviewSection />
      break
    case 'rules':
      body = <RulesSection />
      break
    case 'automatic':
      body = <AutomaticSection />
      break
    case 'manual':
      body = <ManualSection />
      break
    case 'repeat':
      body = <RepeatSection />
      break
    case 'reports':
      body = <ReportsSection />
      break
    default:
      body = <OverviewSection />
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title={meta.title}
          description={meta.desc}
          breadcrumbs={[
            { label: 'Learning', href: '/learning' },
            { label: 'Promotions', href: '/promotions' },
            { label: meta.title },
          ]}
        />
        {body}
      </div>
    </DashboardLayout>
  )
}
