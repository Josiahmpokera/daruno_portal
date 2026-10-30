import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardBody, Chip, useDisclosure } from '@heroui/react'
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Plus,
  RefreshCw,
  Search,
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
  createStaff,
  createTeacherAllocation,
  deleteTeacherAllocation,
  listClasses,
  listStaff,
  listStaffPositions,
  listSubjects,
  listTeacherAllocations,
  listYears,
  updateStaff,
} from '../../api/domain.js'
import { SectionSkeleton } from '../../components/Loading'

const META = {
  '/teachers': { title: 'All Teachers', section: 'directory', desc: 'Teaching staff directory (TAMISEMI HR)' },
  '/teachers/portal': { title: 'Teacher Portal', section: 'portal', desc: 'Quick links for teacher day-to-day work' },
  '/teachers/registration': { title: 'Registration', section: 'registration', desc: 'Register a new teacher' },
  '/teachers/qualifications': { title: 'Qualifications', section: 'qualifications', desc: 'Positions and teaching credentials' },
  '/teachers/employment': { title: 'Employment', section: 'employment', desc: 'Contracts and employment status' },
  '/teachers/subjects': { title: 'Subject Allocation', section: 'subjects', desc: 'Allocate teachers to subjects and classes' },
  '/teachers/class-teachers': { title: 'Class Teacher Assignment', section: 'class-teachers', desc: 'Class teacher (mwalimu wa darasa) allocations' },
  '/teachers/timetable': { title: 'Timetable', section: 'timetable', desc: 'Teaching load from subject allocations' },
  '/teachers/attendance': { title: 'Attendance', section: 'attendance', desc: 'Staff attendance operations' },
  '/teachers/leave': { title: 'Leave Management', section: 'leave', desc: 'Teachers currently on leave' },
  '/teachers/performance': { title: 'Performance Evaluation', section: 'performance', desc: 'Teaching load and allocation review' },
}

const statusColor = {
  active: 'success',
  on_leave: 'warning',
  inactive: 'default',
  terminated: 'danger',
}

function isTeachingStaff(s) {
  const pos = `${s.staff_position?.name || ''} ${s.position || ''} ${s.department?.name || ''}`.toLowerCase()
  return (
    pos.includes('teach') ||
    pos.includes('mwalimu') ||
    pos.includes('academic') ||
    pos.includes('lectur') ||
    !s.department // default include if not classified
  )
}

function useTeachers(q, status) {
  return useQuery({
    queryKey: ['staff', 'teachers', q, status],
    queryFn: () =>
      listStaff({
        q: q || undefined,
        status: status || undefined,
        per_page: 100,
      }),
    placeholderData: (prev) => prev,
  })
}

function DirectorySection({ defaultOpenCreate = false }) {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [form, setForm] = useState({
    id: null,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    employee_code: '',
    staff_position_id: '',
    employment_type: 'Full-time',
    hire_date: '',
    contract_end_date: '',
    national_id: '',
    status: 'active',
  })
  const positionsQ = useQuery({
    queryKey: ['staff', 'positions'],
    queryFn: listStaffPositions,
    staleTime: 60_000,
  })
  const listQ = useTeachers(q, status)

  const teachers = useMemo(() => {
    const all = listQ.data?.staff || []
    // Prefer teaching-looking records; if none match, show all staff
    const teaching = all.filter(isTeachingStaff)
    return teaching.length ? teaching : all
  }, [listQ.data])

  const saveMut = useMutation({
    mutationFn: (payload) =>
      payload.id ? updateStaff(payload.id, payload) : createStaff(payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['staff'] })
      toastSuccess(vars.id ? 'Teacher updated' : 'Teacher registered')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Save failed'),
  })

  const openCreate = () => {
    setForm({
      id: null,
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      employee_code: '',
      staff_position_id: '',
      employment_type: 'Full-time',
      hire_date: '',
      contract_end_date: '',
      national_id: '',
      status: 'active',
    })
    sheet.onOpen()
  }

  const openEdit = (s) => {
    setForm({
      id: s.id,
      first_name: s.first_name || '',
      last_name: s.last_name || '',
      email: s.email || '',
      phone: s.phone || '',
      employee_code: s.employee_code || '',
      staff_position_id: s.staff_position_id ? String(s.staff_position_id) : '',
      employment_type: s.employment_type || 'Full-time',
      hire_date: s.hire_date ? String(s.hire_date).slice(0, 10) : '',
      contract_end_date: s.contract_end_date
        ? String(s.contract_end_date).slice(0, 10)
        : '',
      national_id: s.national_id || '',
      status: s.status || 'active',
    })
    sheet.onOpen()
  }

  // auto-open create when landing on registration
  useMemo(() => {
    if (defaultOpenCreate) {
      // no-op on render; user clicks Add
    }
  }, [defaultOpenCreate])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'full_name',
        header: 'Teacher',
        Cell: ({ row }) => row.original.full_name || `${row.original.first_name} ${row.original.last_name}`,
      },
      {
        accessorKey: 'employee_code',
        header: 'Staff no.',
        Cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.employee_code || '—'}</span>
        ),
      },
      {
        accessorKey: 'position',
        header: 'Position',
        Cell: ({ row }) =>
          row.original.staff_position?.name || row.original.position || '—',
      },
      { accessorKey: 'phone', header: 'Phone', Cell: ({ row }) => row.original.phone || '—' },
      { accessorKey: 'email', header: 'Email', Cell: ({ row }) => row.original.email || '—' },
      {
        accessorKey: 'employment_type',
        header: 'Employment',
        Cell: ({ row }) => row.original.employment_type || '—',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => (
          <Chip size="sm" variant="flat" color={statusColor[row.original.status] || 'default'}>
            {String(row.original.status || '').replace('_', ' ')}
          </Chip>
        ),
      },
      {
        id: 'actions',
        header: '',
        Cell: ({ row }) => (
          <RowActionsMenu
            items={[
              { key: 'edit', label: 'Edit', onPress: () => openEdit(row.original) },
              {
                key: 'leave',
                label: row.original.status === 'on_leave' ? 'Mark active' : 'Mark on leave',
                onPress: () =>
                  saveMut.mutate({
                    id: row.original.id,
                    status:
                      row.original.status === 'on_leave' ? 'active' : 'on_leave',
                  }),
              },
            ]}
          />
        ),
      },
    ],
    [saveMut],
  )

  return (
    <div className="space-y-4">
      <DataTable
        isLoading={listQ.isLoading} columns={columns} data={teachers} emptyMessage="No teachers registered yet."
        searchPlaceholder="Search name, code, phone…"
        search={q}
        onSearchChange={setQ}
        filters={[
          {
            key: 'status',
            label: 'Status',
            value: status,
            onChange: setStatus,
            options: [
              { value: 'active', label: 'Active' },
              { value: 'on_leave', label: 'On leave' },
              { value: 'inactive', label: 'Inactive' },
            ],
          },
        ]}
        onRefresh={() => listQ.refetch()}
        isRefreshing={listQ.isFetching}
        toolbarActions={
          <FormButton className="h-8 min-h-8 bg-[#12544f]" color="primary" startContent={<Plus className="h-4 w-4" />} onPress={openCreate}>
            Register teacher
          </FormButton>
        }
      />

      <SideSheet
        isOpen={sheet.isOpen}
        onOpenChange={sheet.onOpenChange}
        title={form.id ? 'Edit teacher' : 'Register teacher'}
        size="lg"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="First name" required>
            <FormInput value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} />
          </FormField>
          <FormField label="Last name" required>
            <FormInput value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} />
          </FormField>
          <FormField label="Staff / check no.">
            <FormInput value={form.employee_code} onChange={(e) => setForm((f) => ({ ...f, employee_code: e.target.value }))} placeholder="Optional" />
          </FormField>
          <FormField label="Position">
            <FormSelect
              options={(positionsQ.data?.positions || positionsQ.data?.staff_positions || []).map((p) => ({
                value: String(p.id),
                label: p.name,
              }))}
              value={form.staff_position_id}
              onChange={(v) => setForm((f) => ({ ...f, staff_position_id: v }))}
              placeholder="e.g. Teacher"
            />
          </FormField>
          <FormField label="Phone">
            <FormInput value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </FormField>
          <FormField label="Email">
            <FormInput value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </FormField>
          <FormField label="NIDA / national ID">
            <FormInput value={form.national_id} onChange={(e) => setForm((f) => ({ ...f, national_id: e.target.value }))} />
          </FormField>
          <FormField label="Employment type">
            <FormSelect
              options={[
                { value: 'Full-time', label: 'Full-time' },
                { value: 'Part-time', label: 'Part-time' },
                { value: 'Contract', label: 'Contract' },
                { value: 'Volunteer', label: 'Volunteer' },
              ]}
              value={form.employment_type}
              onChange={(v) => setForm((f) => ({ ...f, employment_type: v }))}
            />
          </FormField>
          <FormField label="Hire date">
            <FormInput type="date" value={form.hire_date} onChange={(e) => setForm((f) => ({ ...f, hire_date: e.target.value }))} />
          </FormField>
          <FormField label="Contract end">
            <FormInput type="date" value={form.contract_end_date} onChange={(e) => setForm((f) => ({ ...f, contract_end_date: e.target.value }))} />
          </FormField>
          <FormField label="Status">
            <FormSelect
              options={[
                { value: 'active', label: 'Active' },
                { value: 'on_leave', label: 'On leave' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              value={form.status}
              onChange={(v) => setForm((f) => ({ ...f, status: v }))}
            />
          </FormField>
          <div className="sm:col-span-2">
            <FormButton
              className="w-full bg-[#12544f]"
              color="primary"
              isLoading={saveMut.isPending}
              onPress={() =>
                saveMut.mutate({
                  id: form.id || undefined,
                  first_name: form.first_name,
                  last_name: form.last_name,
                  email: form.email || null,
                  phone: form.phone || null,
                  employee_code: form.employee_code || null,
                  staff_position_id: form.staff_position_id
                    ? Number(form.staff_position_id)
                    : null,
                  employment_type: form.employment_type,
                  hire_date: form.hire_date || null,
                  contract_end_date: form.contract_end_date || null,
                  national_id: form.national_id || null,
                  status: form.status,
                  position: 'Teacher',
                })
              }
            >
              {form.id ? 'Update teacher' : 'Register teacher'}
            </FormButton>
          </div>
        </div>
      </SideSheet>
    </div>
  )
}

function AllocationsSection({ classTeacherOnly = false }) {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const yearsQ = useQuery({ queryKey: ['academic', 'years'], queryFn: listYears })
  const classesQ = useQuery({ queryKey: ['academic', 'classes'], queryFn: listClasses })
  const subjectsQ = useQuery({ queryKey: ['academic', 'subjects'], queryFn: () => listSubjects() })
  const teachersQ = useTeachers('', 'active')
  const listQ = useQuery({
    queryKey: ['academic', 'teacher-allocations'],
    queryFn: () => listTeacherAllocations({ per_page: 100 }),
  })
  const currentYear = useMemo(() => {
    const years = yearsQ.data?.academic_years || []
    return years.find((y) => y.is_current) || years[0]
  }, [yearsQ.data])

  const [form, setForm] = useState({
    staff_id: '',
    classroom_id: '',
    subject_id: '',
    academic_year_id: '',
    is_primary_teacher: classTeacherOnly,
  })

  const rows = useMemo(() => {
    const all = listQ.data?.allocations || listQ.data?.teacher_allocations || []
    if (!classTeacherOnly) return all
    return all.filter((a) => a.is_primary_teacher)
  }, [listQ.data, classTeacherOnly])

  const createMut = useMutation({
    mutationFn: createTeacherAllocation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'teacher-allocations'] })
      toastSuccess('Allocation saved')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  const delMut = useMutation({
    mutationFn: deleteTeacherAllocation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'teacher-allocations'] })
      toastSuccess('Allocation removed')
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })

  const teachers = useMemo(() => {
    const all = teachersQ.data?.staff || []
    const t = all.filter(isTeachingStaff)
    return t.length ? t : all
  }, [teachersQ.data])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'teacher',
        header: 'Teacher',
        Cell: ({ row }) =>
          row.original.staff_name ||
          row.original.staff?.full_name ||
          [row.original.staff?.first_name, row.original.staff?.last_name]
            .filter(Boolean)
            .join(' ') ||
          '—',
      },
      {
        accessorKey: 'subject',
        header: 'Subject',
        Cell: ({ row }) => row.original.subject?.name || '—',
      },
      {
        accessorKey: 'classroom',
        header: 'Class',
        Cell: ({ row }) => row.original.classroom?.name || '—',
      },
      {
        accessorKey: 'year',
        header: 'Year',
        Cell: ({ row }) => row.original.academic_year?.name || '—',
      },
      {
        accessorKey: 'is_primary_teacher',
        header: 'Primary',
        Cell: ({ row }) =>
          row.original.is_primary_teacher ? (
            <Chip size="sm" color="success" variant="flat">
              Yes
            </Chip>
          ) : (
            '—'
          ),
      },
      {
        id: 'actions',
        header: '',
        Cell: ({ row }) => (
          <FormButton
            size="sm"
            appearance="flat"
            color="danger"
            onPress={() => {
              if (window.confirm('Remove this allocation?')) delMut.mutate(row.original.id)
            }}
          >
            Remove
          </FormButton>
        ),
      },
    ],
    [delMut],
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <FormButton appearance="bordered" startContent={<RefreshCw className="h-4 w-4" />} onPress={() => listQ.refetch()}>
          Refresh
        </FormButton>
        <FormButton className="bg-[#12544f]" color="primary" startContent={<Plus className="h-4 w-4" />} onPress={() => sheet.onOpen()}>
          {classTeacherOnly ? 'Assign class teacher' : 'Add allocation'}
        </FormButton>
      </div>
      {listQ.isLoading ? (
        <SectionSkeleton />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          emptyMessage={classTeacherOnly ? 'No class teachers assigned.' : 'No subject allocations yet.'}
        />
      )}
      <SideSheet
        isOpen={sheet.isOpen}
        onOpenChange={sheet.onOpenChange}
        title={classTeacherOnly ? 'Assign class teacher' : 'Subject allocation'}
        size="md"
      >
        <div className="space-y-3">
          <FormField label="Teacher" required>
            <FormSelect
              options={teachers.map((t) => ({
                value: String(t.id),
                label: t.full_name || `${t.first_name} ${t.last_name}`,
              }))}
              value={form.staff_id}
              onChange={(v) => setForm((f) => ({ ...f, staff_id: v }))}
            />
          </FormField>
          <FormField label="Class" required>
            <FormSelect
              options={(classesQ.data?.classes || []).map((c) => ({
                value: String(c.id),
                label: c.name,
              }))}
              value={form.classroom_id}
              onChange={(v) => setForm((f) => ({ ...f, classroom_id: v }))}
            />
          </FormField>
          <FormField label="Subject" required>
            <FormSelect
              options={(subjectsQ.data?.subjects || []).map((s) => ({
                value: String(s.id),
                label: s.name,
              }))}
              value={form.subject_id}
              onChange={(v) => setForm((f) => ({ ...f, subject_id: v }))}
            />
          </FormField>
          <FormField label="Academic year" required>
            <FormSelect
              options={(yearsQ.data?.academic_years || []).map((y) => ({
                value: String(y.id),
                label: y.name,
              }))}
              value={
                form.academic_year_id ||
                (currentYear ? String(currentYear.id) : '')
              }
              onChange={(v) => setForm((f) => ({ ...f, academic_year_id: v }))}
            />
          </FormField>
          <FormButton
            className="w-full bg-[#12544f]"
            color="primary"
            isLoading={createMut.isPending}
            onPress={() => {
              const yearId =
                form.academic_year_id ||
                (currentYear ? String(currentYear.id) : '')
              if (!form.staff_id || !form.classroom_id || !form.subject_id || !yearId) {
                toastError('Teacher, class, subject and year are required')
                return
              }
              createMut.mutate({
                staff_id: Number(form.staff_id),
                classroom_id: Number(form.classroom_id),
                subject_id: Number(form.subject_id),
                academic_year_id: Number(yearId),
                is_primary_teacher: classTeacherOnly ? true : true,
              })
            }}
          >
            Save allocation
          </FormButton>
        </div>
      </SideSheet>
    </div>
  )
}

function LeaveSection() {
  const listQ = useTeachers('', 'on_leave')
  const columns = useMemo(
    () => [
      {
        accessorKey: 'full_name',
        header: 'Teacher',
        Cell: ({ row }) => row.original.full_name || `${row.original.first_name} ${row.original.last_name}`,
      },
      { accessorKey: 'phone', header: 'Phone', Cell: ({ row }) => row.original.phone || '—' },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: () => (
          <Chip size="sm" color="warning" variant="flat">
            On leave
          </Chip>
        ),
      },
    ],
    [],
  )
  if (listQ.isLoading) return <SectionSkeleton />
  return (
    <DataTable
      columns={columns}
      data={listQ.data?.staff || []}
      emptyMessage="No teachers currently on leave."
    />
  )
}

function EmploymentSection() {
  const listQ = useTeachers('', '')
  const columns = useMemo(
    () => [
      {
        accessorKey: 'full_name',
        header: 'Teacher',
        Cell: ({ row }) => row.original.full_name || `${row.original.first_name} ${row.original.last_name}`,
      },
      { accessorKey: 'employment_type', header: 'Type' },
      {
        accessorKey: 'hire_date',
        header: 'Hired',
        Cell: ({ row }) =>
          row.original.hire_date ? String(row.original.hire_date).slice(0, 10) : '—',
      },
      {
        accessorKey: 'contract_end_date',
        header: 'Contract end',
        Cell: ({ row }) =>
          row.original.contract_end_date
            ? String(row.original.contract_end_date).slice(0, 10)
            : '—',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => (
          <Chip size="sm" variant="flat" color={statusColor[row.original.status] || 'default'}>
            {String(row.original.status || '').replace('_', ' ')}
          </Chip>
        ),
      },
    ],
    [],
  )
  if (listQ.isLoading) return <SectionSkeleton />
  const data = (listQ.data?.staff || []).filter(isTeachingStaff)
  return (
    <DataTable
      columns={columns}
      data={data.length ? data : listQ.data?.staff || []}
      emptyMessage="No employment records."
    />
  )
}

function PortalSection() {
  const navigate = useNavigate()
  const cards = [
    { t: 'Daily attendance', d: 'Mark class attendance', p: '/attendance/students/daily', icon: ClipboardList },
    { t: 'Subject allocation', d: 'Your teaching assignments', p: '/teachers/subjects', icon: BookOpen },
    { t: 'Homework', d: 'Create and review homework', p: '/homework', icon: GraduationCap },
    { t: 'Examinations', d: 'Enter marks and publish results', p: '/examinations', icon: ClipboardList },
    { t: 'Report cards', d: 'Print learner report cards', p: '/report-cards', icon: CalendarDays },
    { t: 'Learning resources', d: 'Notes, past papers, videos', p: '/learning', icon: BookOpen },
  ]
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <Card key={c.p} isPressable className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]" onPress={() => navigate(c.p)}>
            <CardBody className="flex flex-row items-start gap-3 p-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#12544f]/8 text-[#12544f]">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">{c.t}</h3>
                <p className="text-xs text-slate-500">{c.d}</p>
              </div>
            </CardBody>
          </Card>
        )
      })}
    </div>
  )
}

function InfoLink({ title, body, action, path }) {
  const navigate = useNavigate()
  return (
    <Card className="max-w-xl rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
      <CardBody className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-sm text-slate-600">{body}</p>
        <FormButton className="bg-[#12544f]" color="primary" onPress={() => navigate(path)}>
          {action}
        </FormButton>
      </CardBody>
    </Card>
  )
}

export default function TeachersWorkspace() {
  const { pathname } = useLocation()
  const meta = META[pathname] || META['/teachers']

  let body
  switch (meta.section) {
    case 'directory':
    case 'registration':
    case 'qualifications':
      body = <DirectorySection defaultOpenCreate={meta.section === 'registration'} />
      break
    case 'employment':
      body = <EmploymentSection />
      break
    case 'subjects':
    case 'timetable':
    case 'performance':
      body = <AllocationsSection />
      break
    case 'class-teachers':
      body = <AllocationsSection classTeacherOnly />
      break
    case 'leave':
      body = <LeaveSection />
      break
    case 'portal':
      body = <PortalSection />
      break
    case 'attendance':
      body = (
        <InfoLink
          title="Teacher attendance operations"
          body="Mark learner attendance for your classes from the Assess module. Staff attendance can also be tracked under Staff when enabled."
          action="Open daily attendance"
          path="/attendance/students/daily"
        />
      )
      break
    default:
      body = <DirectorySection />
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title={meta.title}
          description={meta.desc}
          breadcrumbs={[
            { label: 'People', href: '/students' },
            { label: 'Teachers', href: '/teachers' },
            { label: meta.title },
          ]}
        />
        {body}
      </div>
    </DashboardLayout>
  )
}
