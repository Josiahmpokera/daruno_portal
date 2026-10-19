import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardBody, Chip, Spinner, useDisclosure } from '@heroui/react'
import {
  Briefcase,
  Building2,
  CalendarCheck,
  ClipboardList,
  Plus,
  RefreshCw,
  Search,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import StaffProfiles from './StaffProfiles.jsx'
import StaffOnboard from './StaffOnboard.jsx'
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
  approveStaffLeave,
  createDepartment,
  createStaff,
  createStaffContract,
  createStaffDocument,
  createStaffLeave,
  createStaffPosition,
  deleteDepartment,
  deleteStaff,
  deleteStaffDocument,
  deleteStaffPosition,
  getStaffAttendanceRoster,
  getStaffOverview,
  getStaffPayroll,
  listDepartments,
  listStaff,
  listStaffContracts,
  listStaffDocuments,
  listStaffLeave,
  listStaffPositions,
  markStaffAttendance,
  rejectStaffLeave,
  updateDepartment,
  updateStaff,
  updateStaffContract,
  updateStaffPosition,
} from '../../api/domain.js'

const statusColor = {
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
  present: 'success',
  absent: 'danger',
  late: 'warning',
  half_day: 'primary',
  holiday: 'default',
}

const EMPLOYMENT_TYPES = [
  { value: 'Full-time', label: 'Full-time' },
  { value: 'Part-time', label: 'Part-time' },
  { value: 'Contract', label: 'Contract' },
  { value: 'Temporary', label: 'Temporary' },
  { value: 'Volunteer', label: 'Volunteer' },
]

const LEAVE_TYPES = [
  { value: 'annual', label: 'Annual' },
  { value: 'sick', label: 'Sick' },
  { value: 'maternity', label: 'Maternity' },
  { value: 'paternity', label: 'Paternity' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'compassionate', label: 'Compassionate' },
  { value: 'study', label: 'Study' },
]

const DOC_TYPES = [
  { value: 'national_id', label: 'National ID / NIDA' },
  { value: 'contract', label: 'Signed contract' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'cv', label: 'CV / Resume' },
  { value: 'medical', label: 'Medical clearance' },
  { value: 'other', label: 'Other' },
]

const ATT_STATUSES = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'half_day', label: 'Half day' },
  { value: 'on_leave', label: 'On leave' },
  { value: 'holiday', label: 'Holiday' },
]

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

function StatusChip({ value }) {
  return (
    <Chip
      size="sm"
      variant="flat"
      color={statusColor[value] || 'default'}
      className="h-5 capitalize text-[10px]"
    >
      {String(value || '—').replace(/_/g, ' ')}
    </Chip>
  )
}

function useOrgLookups() {
  const deptsQ = useQuery({ queryKey: ['staff-departments'], queryFn: listDepartments, staleTime: 30_000 })
  const posQ = useQuery({ queryKey: ['staff-positions'], queryFn: listStaffPositions, staleTime: 30_000 })
  const staffQ = useQuery({
    queryKey: ['staff', 'lookup'],
    queryFn: () => listStaff({ per_page: 100, status: 'active' }),
    staleTime: 30_000,
  })
  return {
    departments: deptsQ.data?.departments || [],
    positions: posQ.data?.positions || [],
    staffOptions: (staffQ.data?.staff || []).map((s) => ({
      value: String(s.id),
      label: `${s.full_name}${s.employee_code ? ` (${s.employee_code})` : ''}`,
    })),
  }
}

const emptyStaffForm = () => ({
  first_name: '',
  middle_name: '',
  last_name: '',
  email: '',
  phone: '',
  employee_code: '',
  department_id: '',
  staff_position_id: '',
  employment_type: 'Full-time',
  hire_date: '',
  contract_end_date: '',
  status: 'active',
  national_id: '',
  gender: '',
  address: '',
  bank_name: '',
  bank_account: '',
  bank_branch: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  notes: '',
})

// ── Directory ─────────────────────────────────────────────────────

function StaffDirectory() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [form, setForm] = useState(emptyStaffForm)
  const [editingId, setEditingId] = useState(null)
  const { departments, positions } = useOrgLookups()

  const overviewQ = useQuery({ queryKey: ['staff', 'overview'], queryFn: getStaffOverview, staleTime: 30_000 })
  const staffQ = useQuery({
    queryKey: ['staff', filter, statusFilter],
    queryFn: () =>
      listStaff({
        q: filter || undefined,
        status: statusFilter || undefined,
        per_page: 100,
      }),
    // Keep the table (and its search box) mounted while a new search loads
    placeholderData: (prev) => prev,
  })

  const s = overviewQ.data?.summary || {}
  const staff = staffQ.data?.staff || []

  const saveMut = useMutation({
    mutationFn: (payload) =>
      editingId ? updateStaff(editingId, payload) : createStaff(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] })
      toastSuccess(editingId ? 'Staff updated' : 'Staff created')
      setForm(emptyStaffForm())
      setEditingId(null)
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Save failed'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteStaff,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['staff'] })
      toastSuccess(data?.terminated ? 'Staff terminated (HR history kept)' : 'Staff removed')
    },
    onError: (e) => toastError(e?.message || 'Remove failed'),
  })

  const statusMut = useMutation({
    mutationFn: ({ id, status }) => updateStaff(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] })
      toastSuccess('Status updated')
    },
    onError: (e) => toastError(e?.message || 'Status update failed'),
  })

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyStaffForm())
    sheet.onOpen()
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    setForm({
      ...emptyStaffForm(),
      first_name: row.first_name || '',
      middle_name: row.middle_name || '',
      last_name: row.last_name || '',
      email: row.email || '',
      phone: row.phone || '',
      employee_code: row.employee_code || '',
      department_id: row.department_id ? String(row.department_id) : '',
      staff_position_id: row.staff_position_id ? String(row.staff_position_id) : '',
      employment_type: row.employment_type || 'Full-time',
      hire_date: row.hire_date || '',
      contract_end_date: row.contract_end_date || '',
      status: row.status || 'active',
      national_id: row.national_id || '',
      gender: row.gender || '',
      address: row.address || '',
      bank_name: row.bank_name || '',
      bank_account: row.bank_account || '',
      bank_branch: row.bank_branch || '',
      emergency_contact_name: row.emergency_contact_name || '',
      emergency_contact_phone: row.emergency_contact_phone || '',
      notes: row.notes || '',
    })
    sheet.onOpen()
  }

  const save = () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toastError('First and last name are required')
      return
    }
    const payload = {
      first_name: form.first_name.trim(),
      middle_name: form.middle_name.trim() || null,
      last_name: form.last_name.trim(),
      email: form.email || null,
      phone: form.phone || null,
      employee_code: form.employee_code || null,
      department_id: form.department_id ? Number(form.department_id) : null,
      staff_position_id: form.staff_position_id ? Number(form.staff_position_id) : null,
      employment_type: form.employment_type || 'Full-time',
      hire_date: form.hire_date || null,
      contract_end_date: form.contract_end_date || null,
      status: form.status || 'active',
      national_id: form.national_id || null,
      gender: form.gender || null,
      address: form.address || null,
      bank_name: form.bank_name || null,
      bank_account: form.bank_account || null,
      bank_branch: form.bank_branch || null,
      emergency_contact_name: form.emergency_contact_name || null,
      emergency_contact_phone: form.emergency_contact_phone || null,
      notes: form.notes || null,
    }
    saveMut.mutate(payload)
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'full_name',
        header: 'Staff',
        size: 180,
        Cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate text-[11px] font-medium text-zinc-900">
              {row.original.full_name}
            </div>
            <div className="truncate text-[10px] text-zinc-400">
              {row.original.employee_code || `ID ${row.original.id}`}
              {row.original.hire_date ? ` · Joined ${row.original.hire_date}` : ''}
            </div>
          </div>
        ),
      },
      {
        id: 'department',
        header: 'Department',
        size: 120,
        accessorFn: (r) => r.department?.name || '—',
      },
      {
        id: 'role',
        header: 'Position',
        size: 120,
        accessorFn: (r) => r.staff_position?.name || r.position || '—',
      },
      {
        accessorKey: 'employment_type',
        header: 'Contract type',
        size: 100,
      },
      {
        id: 'contact',
        header: 'Contact',
        size: 160,
        Cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate text-[11px]">{row.original.email || '—'}</div>
            <div className="truncate text-[10px] text-zinc-400">{row.original.phone || '—'}</div>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 90,
        Cell: ({ cell }) => <StatusChip value={cell.getValue()} />,
      },
      {
        id: 'portal',
        header: 'Login',
        size: 70,
        Cell: ({ row }) =>
          row.original.has_portal_user ? (
            <Chip size="sm" color="success" variant="flat" className="h-5 text-[10px]">
              Yes
            </Chip>
          ) : (
            <span className="text-[10px] text-zinc-400">—</span>
          ),
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 96,
        enableSorting: false,
        Cell: ({ row }) => {
          const r = row.original
          return (
            <RowActionsMenu
              ariaLabel={`Actions for ${r.full_name}`}
              items={[
                { key: 'edit', label: 'Edit', onPress: () => openEdit(r) },
                {
                  key: 'profile',
                  label: 'View profile',
                  onPress: () => navigate(`/staff/profiles?id=${r.id}`),
                },
                {
                  key: 'toggle',
                  label: r.status === 'active' ? 'Deactivate' : 'Activate',
                  color: r.status === 'active' ? 'warning' : 'default',
                  onPress: () =>
                    statusMut.mutate({
                      id: r.id,
                      status: r.status === 'active' ? 'inactive' : 'active',
                    }),
                },
                {
                  key: 'remove',
                  label: 'Remove / terminate',
                  color: 'danger',
                  onPress: () => {
                    if (window.confirm(`Remove or terminate ${r.full_name}?`)) {
                      deleteMut.mutate(r.id)
                    }
                  },
                },
              ]}
            />
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  // Fix actions toggle - the inline logic is messy. Simpler approach with mutation for status.
  // Actually the onPress has a bug. Let me use a cleaner approach in the file rewrite...
  // I'll leave and fix via a small status update in openEdit path - better fix the action.

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total" value={overviewQ.isLoading ? '…' : String(s.total ?? 0)} icon={Users} tone="bg-slate-100 text-slate-700" />
        <StatCard label="Active" value={overviewQ.isLoading ? '…' : String(s.active ?? 0)} icon={Users} tone="bg-emerald-50 text-emerald-700" onPress={() => setStatusFilter('active')} />
        <StatCard label="On leave" value={overviewQ.isLoading ? '…' : String(s.on_leave ?? 0)} icon={CalendarCheck} tone="bg-amber-50 text-amber-800" />
        <StatCard label="Contracts" value={overviewQ.isLoading ? '…' : String(s.active_contracts ?? 0)} hint={s.expiring_contracts ? `${s.expiring_contracts} expiring` : undefined} icon={Briefcase} tone="bg-indigo-50 text-indigo-700" onPress={() => navigate('/staff/contracts')} />
        <StatCard label="Pending leave" value={overviewQ.isLoading ? '…' : String(s.pending_leave ?? 0)} icon={ClipboardList} tone="bg-violet-50 text-violet-700" onPress={() => navigate('/staff/leave')} />
        <StatCard label="Present today" value={overviewQ.isLoading ? '…' : String(s.present_today ?? 0)} icon={CalendarCheck} tone="bg-sky-50 text-sky-700" onPress={() => navigate('/staff/attendance')} />
      </div>

      {staffQ.isError && !staffQ.data ? (
        <p className="py-8 text-center text-sm text-red-600">
          {staffQ.error?.message || 'Failed to load staff'}
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={staff}
          isLoading={staffQ.isLoading}
          emptyMessage="No staff yet. Onboard your first staff member."
          enableRowSelection={false}
          searchPlaceholder="Search name, code, email…"
          search={filter}
          onSearchChange={setFilter}
          filters={[
            {
              key: 'status',
              label: 'Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'active', label: 'Active' },
                { value: 'on_leave', label: 'On leave' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'terminated', label: 'Terminated' },
              ],
            },
          ]}
          onRefresh={() => staffQ.refetch()}
          isRefreshing={staffQ.isFetching}
          toolbarActions={
            <>
              <FormButton
                appearance="bordered"
                className="h-8 min-h-8"
                startContent={<UserPlus className="h-3.5 w-3.5" />}
                onPress={() => navigate('/staff/onboard')}
              >
                Onboard staff
              </FormButton>
              <FormButton className="h-8 min-h-8" startContent={<Plus className="h-3.5 w-3.5" />} onPress={openCreate}>
                Quick add
              </FormButton>
            </>
          }
        />
      )}

      <SideSheet
        isOpen={sheet.isOpen}
        onOpenChange={sheet.onOpenChange}
        title={editingId ? 'Edit staff member' : 'Quick add staff'}
        size="lg"
        footer={(onClose) => (
          <>
            <FormButton appearance="light" onPress={onClose}>
              Cancel
            </FormButton>
            <FormButton isLoading={saveMut.isPending} onPress={save}>
              {editingId ? 'Save changes' : 'Create staff'}
            </FormButton>
          </>
        )}
      >
        <StaffFormFields form={form} setForm={setForm} departments={departments} positions={positions} />
      </SideSheet>
    </div>
  )
}

function StaffFormFields({ form, setForm, departments, positions, showBank = true }) {
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <FormField label="First name" required>
        <FormInput value={form.first_name} onValueChange={set('first_name')} />
      </FormField>
      <FormField label="Middle name">
        <FormInput value={form.middle_name} onValueChange={set('middle_name')} />
      </FormField>
      <FormField label="Last name" required>
        <FormInput value={form.last_name} onValueChange={set('last_name')} />
      </FormField>
      <FormField label="Employee code">
        <FormInput placeholder="Auto if empty" value={form.employee_code} onValueChange={set('employee_code')} />
      </FormField>
      <FormField label="Email">
        <FormInput value={form.email} onValueChange={set('email')} />
      </FormField>
      <FormField label="Phone">
        <FormInput value={form.phone} onValueChange={set('phone')} />
      </FormField>
      <FormField label="National ID / NIDA">
        <FormInput value={form.national_id} onValueChange={set('national_id')} />
      </FormField>
      <FormField label="Gender">
        <FormSelect
          value={form.gender}
          onChange={set('gender')}
          options={[
            { value: '', label: '—' },
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' },
          ]}
        />
      </FormField>
      <FormField label="Department">
        <FormSelect
          value={form.department_id}
          onChange={set('department_id')}
          options={[
            { value: '', label: '—' },
            ...departments.filter((d) => d.is_active !== false).map((d) => ({ value: String(d.id), label: d.name })),
          ]}
        />
      </FormField>
      <FormField label="Position">
        <FormSelect
          value={form.staff_position_id}
          onChange={set('staff_position_id')}
          options={[
            { value: '', label: '—' },
            ...positions.filter((p) => p.is_active !== false).map((p) => ({ value: String(p.id), label: p.name })),
          ]}
        />
      </FormField>
      <FormField label="Employment type">
        <FormSelect value={form.employment_type} onChange={set('employment_type')} options={EMPLOYMENT_TYPES} />
      </FormField>
      <FormField label="Joining date">
        <FormInput type="date" value={form.hire_date} onValueChange={set('hire_date')} />
      </FormField>
      <FormField label="Contract end date">
        <FormInput type="date" value={form.contract_end_date} onValueChange={set('contract_end_date')} />
      </FormField>
      <FormField label="Status">
        <FormSelect
          value={form.status}
          onChange={set('status')}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'on_leave', label: 'On leave' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'terminated', label: 'Terminated' },
          ]}
        />
      </FormField>
      <FormField label="Address" className="sm:col-span-2">
        <FormInput value={form.address} onValueChange={set('address')} />
      </FormField>
      <FormField label="Emergency contact">
        <FormInput value={form.emergency_contact_name} onValueChange={set('emergency_contact_name')} />
      </FormField>
      <FormField label="Emergency phone">
        <FormInput value={form.emergency_contact_phone} onValueChange={set('emergency_contact_phone')} />
      </FormField>
      {showBank ? (
        <>
          <FormField label="Bank name">
            <FormInput value={form.bank_name} onValueChange={set('bank_name')} />
          </FormField>
          <FormField label="Bank account">
            <FormInput value={form.bank_account} onValueChange={set('bank_account')} />
          </FormField>
          <FormField label="Bank branch">
            <FormInput value={form.bank_branch} onValueChange={set('bank_branch')} />
          </FormField>
        </>
      ) : null}
      <FormField label="Notes" className="sm:col-span-2">
        <FormTextarea value={form.notes} onValueChange={set('notes')} />
      </FormField>
    </div>
  )
}

// ── Named catalog (dept / positions) ──────────────────────────────

function NamedCatalog({ kind }) {
  const isDept = kind === 'departments'
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [form, setForm] = useState({ name: '', code: '', description: '', is_active: true })
  const [editingId, setEditingId] = useState(null)

  const listQ = useQuery({
    queryKey: [isDept ? 'staff-departments' : 'staff-positions'],
    queryFn: isDept ? listDepartments : listStaffPositions,
  })
  const rows = isDept ? listQ.data?.departments || [] : listQ.data?.positions || []
  const createFn = isDept ? createDepartment : createStaffPosition
  const updateFn = isDept ? updateDepartment : updateStaffPosition
  const deleteFn = isDept ? deleteDepartment : deleteStaffPosition
  const entityLabel = isDept ? 'Department' : 'Position'

  const saveMut = useMutation({
    mutationFn: (payload) =>
      editingId ? updateFn(editingId, payload) : createFn(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [isDept ? 'staff-departments' : 'staff-positions'] })
      qc.invalidateQueries({ queryKey: ['staff'] })
      toastSuccess(editingId ? `${entityLabel} updated` : `${entityLabel} created`)
      setForm({ name: '', code: '', description: '', is_active: true })
      setEditingId(null)
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteFn,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [isDept ? 'staff-departments' : 'staff-positions'] })
      toastSuccess(data?.deactivated ? `${entityLabel} deactivated` : `${entityLabel} deleted`)
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        Cell: ({ row }) => (
          <div>
            <div className="text-[11px] font-medium">{row.original.name}</div>
            <div className="font-mono text-[10px] text-zinc-400">{row.original.code || '—'}</div>
          </div>
        ),
      },
      { accessorKey: 'description', header: 'Description', Cell: ({ cell }) => cell.getValue() || '—' },
      { accessorKey: 'staff_count', header: 'Staff', Cell: ({ cell }) => <span className="tabular-nums">{cell.getValue() ?? 0}</span> },
      {
        accessorKey: 'is_active',
        header: 'Status',
        Cell: ({ cell }) => <StatusChip value={cell.getValue() ? 'active' : 'inactive'} />,
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        Cell: ({ row }) => {
          const r = row.original
          return (
            <RowActionsMenu
              items={[
                {
                  key: 'edit',
                  label: 'Edit',
                  onPress: () => {
                    setEditingId(r.id)
                    setForm({
                      name: r.name || '',
                      code: r.code || '',
                      description: r.description || '',
                      is_active: r.is_active !== false,
                    })
                    sheet.onOpen()
                  },
                },
                {
                  key: 'delete',
                  label: 'Delete',
                  color: 'danger',
                  onPress: () => {
                    if (window.confirm(`Delete ${r.name}?`)) deleteMut.mutate(r.id)
                  },
                },
              ]}
            />
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <FormButton
          startContent={<Plus className="h-4 w-4" />}
          onPress={() => {
            setEditingId(null)
            setForm({ name: '', code: '', description: '', is_active: true })
            sheet.onOpen()
          }}
        >
          Add {entityLabel.toLowerCase()}
        </FormButton>
      </div>
      {listQ.isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <DataTable columns={columns} data={rows} emptyMessage={`No ${entityLabel.toLowerCase()}s yet.`} enableRowSelection={false} />
      )}
      <SideSheet
        isOpen={sheet.isOpen}
        onOpenChange={sheet.onOpenChange}
        title={editingId ? `Edit ${entityLabel.toLowerCase()}` : `New ${entityLabel.toLowerCase()}`}
        footer={(onClose) => (
          <>
            <FormButton appearance="light" onPress={onClose}>Cancel</FormButton>
            <FormButton
              isLoading={saveMut.isPending}
              onPress={() => {
                if (!form.name.trim()) {
                  toastError('Name is required')
                  return
                }
                saveMut.mutate({
                  name: form.name.trim(),
                  code: form.code.trim() || undefined,
                  description: form.description.trim() || undefined,
                  is_active: Boolean(form.is_active),
                })
              }}
            >
              {editingId ? 'Save' : 'Create'}
            </FormButton>
          </>
        )}
      >
        <div className="flex flex-col gap-3">
          <FormField label="Name" required>
            <FormInput value={form.name} onValueChange={(v) => setForm((f) => ({ ...f, name: v }))} />
          </FormField>
          <FormField label="Code">
            <FormInput value={form.code} onValueChange={(v) => setForm((f) => ({ ...f, code: v }))} />
          </FormField>
          <FormField label="Description">
            <FormTextarea value={form.description} onValueChange={(v) => setForm((f) => ({ ...f, description: v }))} />
          </FormField>
        </div>
      </SideSheet>
    </div>
  )
}

// ── Contracts ─────────────────────────────────────────────────────

function ContractsSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const { staffOptions } = useOrgLookups()
  const [form, setForm] = useState({
    staff_id: '',
    title: '',
    employment_type: 'Full-time',
    start_date: '',
    end_date: '',
    probation_end_date: '',
    basic_salary: '',
    currency: 'TZS',
    status: 'active',
    terms: '',
  })

  const listQ = useQuery({ queryKey: ['staff', 'contracts'], queryFn: () => listStaffContracts() })

  const createMut = useMutation({
    mutationFn: createStaffContract,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] })
      toastSuccess('Contract created')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })

  const statusMut = useMutation({
    mutationFn: ({ id, status }) => updateStaffContract(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff', 'contracts'] })
      toastSuccess('Contract updated')
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })

  const columns = useMemo(
    () => [
      {
        id: 'staff',
        header: 'Staff',
        Cell: ({ row }) => (
          <div>
            <div className="text-[11px] font-medium">{row.original.staff?.full_name || '—'}</div>
            <div className="text-[10px] text-zinc-400">{row.original.contract_number}</div>
          </div>
        ),
      },
      { accessorKey: 'employment_type', header: 'Type' },
      {
        id: 'dates',
        header: 'Period',
        Cell: ({ row }) => (
          <span className="text-[11px]">
            {row.original.start_date} → {row.original.end_date || 'Open'}
          </span>
        ),
      },
      {
        id: 'salary',
        header: 'Salary',
        Cell: ({ row }) =>
          row.original.basic_salary != null
            ? `${Number(row.original.basic_salary).toLocaleString()} ${row.original.currency}`
            : '—',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ cell }) => <StatusChip value={cell.getValue()} />,
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        Cell: ({ row }) => {
          const c = row.original
          return (
            <RowActionsMenu
              items={[
                c.status !== 'active' && {
                  key: 'activate',
                  label: 'Activate',
                  onPress: () => statusMut.mutate({ id: c.id, status: 'active' }),
                },
                c.status === 'active' && {
                  key: 'terminate',
                  label: 'Terminate',
                  color: 'danger',
                  onPress: () => statusMut.mutate({ id: c.id, status: 'terminated' }),
                },
              ].filter(Boolean)}
            />
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <FormButton startContent={<Plus className="h-4 w-4" />} onPress={sheet.onOpen}>
          New contract
        </FormButton>
      </div>
      {listQ.isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <DataTable columns={columns} data={listQ.data?.contracts || []} emptyMessage="No contracts yet." enableRowSelection={false} />
      )}
      <SideSheet
        isOpen={sheet.isOpen}
        onOpenChange={sheet.onOpenChange}
        title="New employment contract"
        size="lg"
        footer={(onClose) => (
          <>
            <FormButton appearance="light" onPress={onClose}>Cancel</FormButton>
            <FormButton
              isLoading={createMut.isPending}
              onPress={() => {
                if (!form.staff_id || !form.start_date) {
                  toastError('Staff and start (joining) date are required')
                  return
                }
                createMut.mutate({
                  staff_id: Number(form.staff_id),
                  title: form.title || null,
                  employment_type: form.employment_type,
                  start_date: form.start_date,
                  end_date: form.end_date || null,
                  probation_end_date: form.probation_end_date || null,
                  basic_salary: form.basic_salary ? Number(form.basic_salary) : null,
                  currency: form.currency || 'TZS',
                  status: form.status || 'active',
                  terms: form.terms || null,
                })
              }}
            >
              Create contract
            </FormButton>
          </>
        )}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Staff" required className="sm:col-span-2">
            <FormSelect value={form.staff_id} onChange={(v) => setForm((f) => ({ ...f, staff_id: v }))} options={[{ value: '', label: 'Select…' }, ...staffOptions]} />
          </FormField>
          <FormField label="Title" className="sm:col-span-2">
            <FormInput value={form.title} onValueChange={(v) => setForm((f) => ({ ...f, title: v }))} />
          </FormField>
          <FormField label="Employment type">
            <FormSelect value={form.employment_type} onChange={(v) => setForm((f) => ({ ...f, employment_type: v }))} options={EMPLOYMENT_TYPES} />
          </FormField>
          <FormField label="Start / joining date" required>
            <FormInput type="date" value={form.start_date} onValueChange={(v) => setForm((f) => ({ ...f, start_date: v }))} />
          </FormField>
          <FormField label="End date">
            <FormInput type="date" value={form.end_date} onValueChange={(v) => setForm((f) => ({ ...f, end_date: v }))} />
          </FormField>
          <FormField label="Probation end">
            <FormInput type="date" value={form.probation_end_date} onValueChange={(v) => setForm((f) => ({ ...f, probation_end_date: v }))} />
          </FormField>
          <FormField label="Basic salary">
            <FormInput type="number" value={form.basic_salary} onValueChange={(v) => setForm((f) => ({ ...f, basic_salary: v }))} />
          </FormField>
          <FormField label="Terms" className="sm:col-span-2">
            <FormTextarea value={form.terms} onValueChange={(v) => setForm((f) => ({ ...f, terms: v }))} />
          </FormField>
        </div>
      </SideSheet>
    </div>
  )
}

// ── Documents ─────────────────────────────────────────────────────

function DocumentsSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const { staffOptions } = useOrgLookups()
  const [form, setForm] = useState({
    staff_id: '',
    doc_type: 'other',
    title: '',
    external_url: '',
    issued_at: '',
    expires_at: '',
    notes: '',
  })

  const listQ = useQuery({ queryKey: ['staff', 'documents'], queryFn: () => listStaffDocuments() })

  const createMut = useMutation({
    mutationFn: createStaffDocument,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff', 'documents'] })
      toastSuccess('Document recorded')
      sheet.onClose()
      setForm({ staff_id: '', doc_type: 'other', title: '', external_url: '', issued_at: '', expires_at: '', notes: '' })
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })

  const delMut = useMutation({
    mutationFn: deleteStaffDocument,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff', 'documents'] })
      toastSuccess('Document deleted')
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })

  const columns = useMemo(
    () => [
      {
        id: 'staff',
        header: 'Staff',
        Cell: ({ row }) => row.original.staff?.full_name || '—',
      },
      { accessorKey: 'doc_type', header: 'Type', Cell: ({ cell }) => String(cell.getValue() || '').replace(/_/g, ' ') },
      { accessorKey: 'title', header: 'Title' },
      {
        id: 'link',
        header: 'Link',
        Cell: ({ row }) =>
          row.original.external_url ? (
            <a href={row.original.external_url} target="_blank" rel="noreferrer" className="text-[#0B3D2E] underline text-[11px]">
              Open
            </a>
          ) : (
            '—'
          ),
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        Cell: ({ row }) => (
          <RowActionsMenu
            items={[
              {
                key: 'del',
                label: 'Delete',
                color: 'danger',
                onPress: () => {
                  if (window.confirm('Delete this document record?')) delMut.mutate(row.original.id)
                },
              },
            ]}
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <FormButton startContent={<Plus className="h-4 w-4" />} onPress={sheet.onOpen}>
          Add document
        </FormButton>
      </div>
      {listQ.isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <DataTable columns={columns} data={listQ.data?.documents || []} emptyMessage="No HR documents yet." enableRowSelection={false} />
      )}
      <SideSheet
        isOpen={sheet.isOpen}
        onOpenChange={sheet.onOpenChange}
        title="Record HR document"
        footer={(onClose) => (
          <>
            <FormButton appearance="light" onPress={onClose}>Cancel</FormButton>
            <FormButton
              isLoading={createMut.isPending}
              onPress={() => {
                if (!form.staff_id || !form.title.trim()) {
                  toastError('Staff and title are required')
                  return
                }
                createMut.mutate({
                  staff_id: Number(form.staff_id),
                  doc_type: form.doc_type,
                  title: form.title.trim(),
                  external_url: form.external_url || null,
                  issued_at: form.issued_at || null,
                  expires_at: form.expires_at || null,
                  notes: form.notes || null,
                })
              }}
            >
              Save
            </FormButton>
          </>
        )}
      >
        <div className="flex flex-col gap-3">
          <FormField label="Staff" required>
            <FormSelect value={form.staff_id} onChange={(v) => setForm((f) => ({ ...f, staff_id: v }))} options={[{ value: '', label: 'Select…' }, ...staffOptions]} />
          </FormField>
          <FormField label="Type">
            <FormSelect value={form.doc_type} onChange={(v) => setForm((f) => ({ ...f, doc_type: v }))} options={DOC_TYPES} />
          </FormField>
          <FormField label="Title" required>
            <FormInput value={form.title} onValueChange={(v) => setForm((f) => ({ ...f, title: v }))} />
          </FormField>
          <FormField label="Document URL / link">
            <FormInput placeholder="https://…" value={form.external_url} onValueChange={(v) => setForm((f) => ({ ...f, external_url: v }))} />
          </FormField>
          <FormField label="Issued">
            <FormInput type="date" value={form.issued_at} onValueChange={(v) => setForm((f) => ({ ...f, issued_at: v }))} />
          </FormField>
          <FormField label="Expires">
            <FormInput type="date" value={form.expires_at} onValueChange={(v) => setForm((f) => ({ ...f, expires_at: v }))} />
          </FormField>
        </div>
      </SideSheet>
    </div>
  )
}

// ── Leave ─────────────────────────────────────────────────────────

function LeaveSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const { staffOptions } = useOrgLookups()
  const [status, setStatus] = useState('')
  const [form, setForm] = useState({
    staff_id: '',
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: '',
  })

  const listQ = useQuery({
    queryKey: ['staff', 'leave', status],
    queryFn: () => listStaffLeave(status ? { status } : {}),
  })

  const createMut = useMutation({
    mutationFn: createStaffLeave,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff', 'leave'] })
      qc.invalidateQueries({ queryKey: ['staff', 'overview'] })
      toastSuccess('Leave request submitted')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })

  const approveMut = useMutation({
    mutationFn: approveStaffLeave,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] })
      toastSuccess('Leave approved')
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })

  const rejectMut = useMutation({
    mutationFn: (id) => rejectStaffLeave(id, { rejection_reason: 'Rejected by admin' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff', 'leave'] })
      toastSuccess('Leave rejected')
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })

  const columns = useMemo(
    () => [
      {
        id: 'staff',
        header: 'Staff',
        Cell: ({ row }) => row.original.staff?.full_name || '—',
      },
      {
        accessorKey: 'leave_type',
        header: 'Type',
        Cell: ({ cell }) => <span className="capitalize">{String(cell.getValue() || '').replace(/_/g, ' ')}</span>,
      },
      {
        id: 'period',
        header: 'Period',
        Cell: ({ row }) => (
          <span className="text-[11px]">
            {row.original.start_date} → {row.original.end_date} ({row.original.days}d)
          </span>
        ),
      },
      { accessorKey: 'reason', header: 'Reason', Cell: ({ cell }) => cell.getValue() || '—' },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ cell }) => <StatusChip value={cell.getValue()} />,
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        Cell: ({ row }) => {
          const l = row.original
          if (l.status !== 'pending') return null
          return (
            <RowActionsMenu
              items={[
                { key: 'ok', label: 'Approve', onPress: () => approveMut.mutate(l.id) },
                { key: 'no', label: 'Reject', color: 'danger', onPress: () => rejectMut.mutate(l.id) },
              ]}
            />
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <FormSelect
          className="w-40"
          value={status}
          onChange={setStatus}
          options={[
            { value: '', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
          ]}
        />
        <FormButton className="ml-auto" startContent={<Plus className="h-4 w-4" />} onPress={sheet.onOpen}>
          Request leave
        </FormButton>
      </div>
      {listQ.isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <DataTable columns={columns} data={listQ.data?.leave_requests || []} emptyMessage="No leave requests." enableRowSelection={false} />
      )}
      <SideSheet
        isOpen={sheet.isOpen}
        onOpenChange={sheet.onOpenChange}
        title="New leave request"
        footer={(onClose) => (
          <>
            <FormButton appearance="light" onPress={onClose}>Cancel</FormButton>
            <FormButton
              isLoading={createMut.isPending}
              onPress={() => {
                if (!form.staff_id || !form.start_date || !form.end_date) {
                  toastError('Staff, start and end dates are required')
                  return
                }
                createMut.mutate({
                  staff_id: Number(form.staff_id),
                  leave_type: form.leave_type,
                  start_date: form.start_date,
                  end_date: form.end_date,
                  reason: form.reason || null,
                })
              }}
            >
              Submit
            </FormButton>
          </>
        )}
      >
        <div className="flex flex-col gap-3">
          <FormField label="Staff" required>
            <FormSelect value={form.staff_id} onChange={(v) => setForm((f) => ({ ...f, staff_id: v }))} options={[{ value: '', label: 'Select…' }, ...staffOptions]} />
          </FormField>
          <FormField label="Leave type">
            <FormSelect value={form.leave_type} onChange={(v) => setForm((f) => ({ ...f, leave_type: v }))} options={LEAVE_TYPES} />
          </FormField>
          <FormField label="Start" required>
            <FormInput type="date" value={form.start_date} onValueChange={(v) => setForm((f) => ({ ...f, start_date: v }))} />
          </FormField>
          <FormField label="End" required>
            <FormInput type="date" value={form.end_date} onValueChange={(v) => setForm((f) => ({ ...f, end_date: v }))} />
          </FormField>
          <FormField label="Reason">
            <FormTextarea value={form.reason} onValueChange={(v) => setForm((f) => ({ ...f, reason: v }))} />
          </FormField>
        </div>
      </SideSheet>
    </div>
  )
}

// ── Attendance ────────────────────────────────────────────────────

function AttendanceSection() {
  const qc = useQueryClient()
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [marks, setMarks] = useState({})

  const rosterQ = useQuery({
    queryKey: ['staff', 'attendance-roster', date],
    queryFn: () => getStaffAttendanceRoster({ date }),
  })

  const roster = rosterQ.data?.roster || []

  useEffect(() => {
    const next = {}
    roster.forEach((r) => {
      next[r.staff_id] =
        r.attendance_status || (r.staff_status === 'on_leave' ? 'on_leave' : 'present')
    })
    setMarks(next)
  }, [rosterQ.dataUpdatedAt]) // eslint-disable-line react-hooks/exhaustive-deps

  const saveMut = useMutation({
    mutationFn: () =>
      markStaffAttendance({
        date,
        records: roster.map((r) => ({
          staff_id: r.staff_id,
          status: marks[r.staff_id] || 'present',
        })),
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['staff', 'attendance'] })
      qc.invalidateQueries({ queryKey: ['staff', 'overview'] })
      toastSuccess(`Attendance saved (${data?.saved ?? 0} records)`)
      rosterQ.refetch()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })

  const columns = useMemo(
    () => [
      {
        id: 'staff',
        header: 'Staff',
        Cell: ({ row }) => (
          <div>
            <div className="text-[11px] font-medium">{row.original.full_name}</div>
            <div className="text-[10px] text-zinc-400">{row.original.employee_code} · {row.original.department || '—'}</div>
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Attendance',
        size: 160,
        Cell: ({ row }) => (
          <FormSelect
            className="min-w-[130px]"
            value={marks[row.original.staff_id] || 'present'}
            onChange={(v) => setMarks((m) => ({ ...m, [row.original.staff_id]: v }))}
            options={ATT_STATUSES}
          />
        ),
      },
      {
        id: 'marked',
        header: 'Saved',
        Cell: ({ row }) =>
          row.original.marked ? (
            <Chip size="sm" color="success" variant="flat" className="h-5 text-[10px]">Yes</Chip>
          ) : (
            <span className="text-[10px] text-zinc-400">No</span>
          ),
      },
    ],
    [marks],
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-44">
          <FormField label="Date">
            <FormInput type="date" value={date} onValueChange={setDate} />
          </FormField>
        </div>
        <FormButton appearance="bordered" startContent={<RefreshCw className="h-3.5 w-3.5" />} onPress={() => rosterQ.refetch()}>
          Reload roster
        </FormButton>
        <FormButton
          className="ml-auto"
          isLoading={saveMut.isPending}
          startContent={<CalendarCheck className="h-4 w-4" />}
          onPress={() => saveMut.mutate()}
        >
          Save attendance
        </FormButton>
      </div>
      {rosterQ.isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <DataTable
          columns={columns}
          data={roster}
          emptyMessage="No active staff to mark."
          enableRowSelection={false}
          getRowId={(r) => String(r.staff_id)}
        />
      )}
    </div>
  )
}

// ── Payroll ───────────────────────────────────────────────────────

function PayrollSection() {
  const q = useQuery({ queryKey: ['staff', 'payroll'], queryFn: getStaffPayroll })
  const summary = q.data?.summary || {}
  const rows = q.data?.staff || []

  const columns = useMemo(
    () => [
      {
        id: 'staff',
        header: 'Staff',
        Cell: ({ row }) => (
          <div>
            <div className="text-[11px] font-medium">{row.original.full_name}</div>
            <div className="text-[10px] text-zinc-400">{row.original.employee_code}</div>
          </div>
        ),
      },
      { accessorKey: 'department', header: 'Department', Cell: ({ cell }) => cell.getValue() || '—' },
      { accessorKey: 'position', header: 'Position', Cell: ({ cell }) => cell.getValue() || '—' },
      { accessorKey: 'employment_type', header: 'Type' },
      { accessorKey: 'hire_date', header: 'Joined' },
      {
        id: 'salary',
        header: 'Basic salary',
        Cell: ({ row }) =>
          row.original.basic_salary != null
            ? `${Number(row.original.basic_salary).toLocaleString()} ${row.original.currency}`
            : '—',
      },
      {
        id: 'bank',
        header: 'Bank account',
        Cell: ({ row }) =>
          row.original.bank_account
            ? `${row.original.bank_name || ''} ${row.original.bank_account}`.trim()
            : '—',
      },
      {
        id: 'ready',
        header: 'Payroll ready',
        Cell: ({ row }) =>
          row.original.payroll_ready ? (
            <Chip size="sm" color="success" variant="flat" className="h-5 text-[10px]">Ready</Chip>
          ) : (
            <Chip size="sm" color="warning" variant="flat" className="h-5 text-[10px]">Incomplete</Chip>
          ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatCard label="Active staff" value={q.isLoading ? '…' : String(summary.active_staff ?? 0)} icon={Users} tone="bg-slate-100 text-slate-700" />
        <StatCard label="With salary" value={q.isLoading ? '…' : String(summary.with_salary ?? 0)} icon={Wallet} tone="bg-emerald-50 text-emerald-700" />
        <StatCard label="Payroll ready" value={q.isLoading ? '…' : String(summary.payroll_ready ?? 0)} hint="Contract + bank" icon={Briefcase} tone="bg-indigo-50 text-indigo-700" />
        <StatCard label="Missing bank" value={q.isLoading ? '…' : String(summary.missing_bank ?? 0)} icon={Building2} tone="bg-amber-50 text-amber-800" />
      </div>
      <p className="text-xs text-slate-500">
        Payroll integration exports employment and bank data for your payroll processor. Complete
        contracts (with basic salary) and bank details to mark staff as payroll-ready.
      </p>
      {q.isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <DataTable columns={columns} data={rows} emptyMessage="No active staff." enableRowSelection={false} getRowId={(r) => String(r.staff_id)} />
      )}
    </div>
  )
}

// ── Shell ─────────────────────────────────────────────────────────

const sectionMeta = {
  '/staff': {
    title: 'All Staff',
    description: 'Staff directory, joining dates, and HR status',
    section: 'directory',
  },
  '/staff/onboard': {
    title: 'Onboard Staff',
    description: 'Hire workflow: profile, contract, joining date, optional portal login',
    section: 'onboard',
  },
  '/staff/profiles': {
    title: 'Staff Profiles',
    description: 'Full employment profile, contracts and documents',
    section: 'profiles',
  },
  '/staff/departments': {
    title: 'Departments',
    description: 'Organize staff by department',
    section: 'departments',
  },
  '/staff/roles': {
    title: 'Roles & positions',
    description: 'Job titles and position catalog',
    section: 'roles',
  },
  '/staff/attendance': {
    title: 'Staff Attendance',
    description: 'Daily presence for non-teaching staff',
    section: 'attendance',
  },
  '/staff/leave': {
    title: 'Leave',
    description: 'Leave requests, approvals and balances',
    section: 'leave',
  },
  '/staff/contracts': {
    title: 'Contracts',
    description: 'Employment contracts, renewals and end dates',
    section: 'contracts',
  },
  '/staff/documents': {
    title: 'Documents',
    description: 'IDs, certificates and HR files',
    section: 'documents',
  },
  '/staff/payroll': {
    title: 'Payroll Integration',
    description: 'Salary and bank data for payroll processing',
    section: 'payroll',
  },
}

export default function Staff() {
  const { pathname } = useLocation()
  const meta = sectionMeta[pathname] || sectionMeta['/staff']

  let body
  switch (meta.section) {
    case 'directory':
      body = <StaffDirectory />
      break
    case 'onboard':
      body = <StaffOnboard />
      break
    case 'profiles':
      body = <StaffProfiles />
      break
    case 'departments':
      body = <NamedCatalog kind="departments" />
      break
    case 'roles':
      body = <NamedCatalog kind="positions" />
      break
    case 'contracts':
      body = <ContractsSection />
      break
    case 'documents':
      body = <DocumentsSection />
      break
    case 'leave':
      body = <LeaveSection />
      break
    case 'attendance':
      body = <AttendanceSection />
      break
    case 'payroll':
      body = <PayrollSection />
      break
    default:
      body = <StaffDirectory />
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title={meta.title}
          description={meta.description}
          breadcrumbs={[
            { label: 'Staff', href: '/staff' },
            { label: meta.title },
          ]}
        />
        {body}
      </div>
    </DashboardLayout>
  )
}
