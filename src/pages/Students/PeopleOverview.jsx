import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, CardBody, Spinner } from '@heroui/react'
import {
  ArrowLeftRight,
  ClipboardList,
  FileBadge,
  GraduationCap,
  HeartPulse,
  IdCard,
  School,
  UserPlus,
  UserRound,
  Users,
  UsersRound,
} from 'lucide-react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import PageHeader from '../../components/Layout/PageHeader.jsx'
import {
  listAdmissions,
  listAlumni,
  listGuardians,
  listStaff,
  listStudents,
  studentStatusSummary,
} from '../../api/domain.js'
import { ValueSkeleton } from '../../components/Loading'

function StatCard({ label, value, hint, icon: Icon, tone, onPress }) {
  return (
    <Card
      isPressable={Boolean(onPress)}
      className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)] transition-colors hover:border-[#12544f]/30"
      onPress={onPress}
    >
      <CardBody className="flex flex-row items-center gap-2.5 p-2.5">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone}`}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[10px] font-medium uppercase tracking-wide text-slate-400">
            {label}
          </p>
          <p className="truncate text-base font-semibold tabular-nums text-slate-900">
            {value}
          </p>
          {hint ? (
            <p className="truncate text-[10px] text-slate-500">{hint}</p>
          ) : null}
        </div>
      </CardBody>
    </Card>
  )
}

function PeopleOverview() {
  const navigate = useNavigate()

  const statusQ = useQuery({
    queryKey: ['students', 'status-summary', 'people-overview'],
    queryFn: studentStatusSummary,
    staleTime: 30_000,
  })
  const guardiansQ = useQuery({
    queryKey: ['guardians', 'people-overview'],
    queryFn: () => listGuardians({ per_page: 1 }),
    staleTime: 30_000,
  })
  const admissionsQ = useQuery({
    queryKey: ['admissions', 'people-overview'],
    queryFn: () => listAdmissions({ status: 'pending', per_page: 1 }),
    staleTime: 30_000,
  })
  const alumniQ = useQuery({
    queryKey: ['alumni', 'people-overview'],
    queryFn: () => listAlumni({ per_page: 1 }),
    staleTime: 30_000,
  })
  const staffQ = useQuery({
    queryKey: ['staff', 'people-overview'],
    queryFn: () => listStaff({ per_page: 1, status: 'active' }),
    staleTime: 30_000,
  })
  // Fallback count for teachers via active students meta if staff meta missing
  const studentsActiveQ = useQuery({
    queryKey: ['students', 'active-count', 'people-overview'],
    queryFn: () => listStudents({ status: 'active', per_page: 1 }),
    staleTime: 30_000,
  })

  const byStatus = useMemo(() => {
    const map = {}
    for (const row of statusQ.data?.by_status || []) {
      map[row.status] = row.total
    }
    return map
  }, [statusQ.data])

  const totalStudents = statusQ.data?.total ?? 0
  const activeStudents =
    byStatus.active ?? studentsActiveQ.data?.meta?.total ?? 0
  const parentsCount =
    guardiansQ.data?.meta?.total ?? guardiansQ.data?.guardians?.length ?? 0
  const pendingApps =
    admissionsQ.data?.summary?.pending ??
    admissionsQ.data?.meta?.total ??
    admissionsQ.data?.applications?.length ??
    0
  const staffCount =
    staffQ.data?.meta?.total ?? staffQ.data?.staff?.length ?? 0
  const alumniCount =
    alumniQ.data?.meta?.total ??
    alumniQ.data?.alumni?.length ??
    byStatus.graduated ??
    0

  const loading =
    statusQ.isLoading ||
    guardiansQ.isLoading ||
    admissionsQ.isLoading ||
    staffQ.isLoading

  const stats = [
    {
      label: 'Students',
      value: loading ? <ValueSkeleton /> : String(totalStudents),
      hint: `${activeStudents} active`,
      icon: Users,
      tone: 'bg-emerald-50 text-emerald-700',
      path: '/students/list',
    },
    {
      label: 'Active',
      value: loading ? <ValueSkeleton /> : String(activeStudents),
      hint: 'Currently enrolled',
      icon: School,
      tone: 'bg-sky-50 text-sky-700',
      path: '/students/list',
    },
    {
      label: 'Parents',
      value: guardiansQ.isLoading ? <ValueSkeleton /> : String(parentsCount),
      hint: 'Guardians on file',
      icon: UsersRound,
      tone: 'bg-violet-50 text-violet-700',
      path: '/students/parents',
    },
    {
      label: 'Applications',
      value: admissionsQ.isLoading ? <ValueSkeleton /> : String(pendingApps),
      hint: 'Pending join requests',
      icon: ClipboardList,
      tone: 'bg-amber-50 text-amber-800',
      path: '/students/admissions',
    },
    {
      label: 'Staff',
      value: staffQ.isLoading ? <ValueSkeleton /> : String(staffCount),
      hint: `${alumniCount} alumni on record`,
      icon: UserRound,
      tone: 'bg-rose-50 text-rose-700',
      path: '/staff',
    },
  ]

  const modules = [
    {
      t: 'All Students',
      d: 'Browse and manage the full learner directory',
      p: '/students/list',
      icon: Users,
    },
    {
      t: 'Registration',
      d: 'Register new learners (TAMISEMI fields)',
      p: '/students/registration',
      icon: UserPlus,
    },
    {
      t: 'Admission Numbers',
      d: 'Issue and manage admission numbers',
      p: '/students/admission-numbers',
      icon: FileBadge,
    },
    {
      t: 'Applications',
      d: 'Review public join applications',
      p: '/students/admissions',
      icon: ClipboardList,
    },
    {
      t: 'Parents / Guardians',
      d: 'Contacts linked to students',
      p: '/students/parents',
      icon: UsersRound,
    },
    {
      t: 'Medical Information',
      d: 'Health records and conditions',
      p: '/students/medical',
      icon: HeartPulse,
    },
    {
      t: 'Status Management',
      d: 'Active, transferred, graduated, inactive',
      p: '/students/status',
      icon: UserRound,
    },
    {
      t: 'Transfers',
      d: 'In / out transfers between schools',
      p: '/students/transfers',
      icon: ArrowLeftRight,
    },
    {
      t: 'Graduation',
      d: 'Graduate classes and cohorts',
      p: '/students/graduation',
      icon: GraduationCap,
    },
    {
      t: 'Alumni',
      d: 'Former students directory',
      p: '/students/alumni',
      icon: School,
    },
    {
      t: 'QR / Barcode',
      d: 'Scannable QR codes and Code-128 barcodes',
      p: '/students/qr',
      icon: IdCard,
    },
    {
      t: 'ID Cards',
      d: 'Templates and printable student ID cards',
      p: '/students/id-cards',
      icon: IdCard,
    },
    {
      t: 'Teachers',
      d: 'Teaching staff directory',
      p: '/teachers',
      icon: UserRound,
    },
  ]

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title="People"
          description="Students, parents, teachers and lifecycle records"
          breadcrumbs={[{ label: 'People' }, { label: 'Overview' }]}
        />

        <div className="space-y-5">
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  At a glance
                </h2>
                <p className="text-xs text-slate-500">
                  Live people statistics for your school
                </p>
              </div>
              {(statusQ.isFetching || guardiansQ.isFetching) && !loading ? (
                <Spinner size="sm" color="success" />
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
              {stats.map((stat) => (
                <StatCard
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                  hint={stat.hint}
                  icon={stat.icon}
                  tone={stat.tone}
                  onPress={() => navigate(stat.path)}
                />
              ))}
            </div>
            {statusQ.isError ? (
              <p className="mt-2 text-xs text-rose-600">
                Could not load stats. {statusQ.error?.message || ''}
              </p>
            ) : null}
          </div>

          <div>
            <div className="mb-2">
              <h2 className="text-sm font-semibold text-slate-900">Modules</h2>
              <p className="text-xs text-slate-500">
                Jump into registration, records and lifecycle
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {modules.map((c) => {
                const Icon = c.icon
                return (
                  <Card
                    key={c.p}
                    isPressable
                    className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)] transition-colors hover:border-[#12544f]/40"
                    onPress={() => navigate(c.p)}
                  >
                    <CardBody className="flex flex-row items-start gap-3 p-3.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#12544f]/8 text-[#12544f]">
                        <Icon className="h-4 w-4" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900">
                          {c.t}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500">{c.d}</p>
                      </div>
                    </CardBody>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PeopleOverview
