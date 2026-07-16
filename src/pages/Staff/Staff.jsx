import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Chip, Spinner, useDisclosure } from '@heroui/react'
import { Plus, Search, RefreshCw } from 'lucide-react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import ModulePlaceholder from '../../components/Layout/ModulePlaceholder'
import PageHeader from '../../components/Layout/PageHeader.jsx'
import SideSheet from '../../components/Layout/SideSheet.jsx'
import DataTable from '../../components/Tables/DataTable.jsx'
import RowActionsMenu from '../../components/Tables/RowActionsMenu.jsx'
import {
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  FormButton,
} from '../../components/Form'
import { toastSuccess, toastError } from '../../components/Toast'
import {
  listStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  listStaffPositions,
  createStaffPosition,
  updateStaffPosition,
  deleteStaffPosition,
} from '../../api/domain.js'

const statusColor = {
  active: 'success',
  on_leave: 'warning',
  inactive: 'default',
  terminated: 'danger',
}

const emptyStaffForm = () => ({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  employee_code: '',
  department_id: '',
  staff_position_id: '',
  employment_type: 'Full-time',
  hire_date: '',
  status: 'active',
})

const emptyNamedForm = () => ({
  name: '',
  code: '',
  description: '',
  is_active: true,
})

function StaffDirectory() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [form, setForm] = useState(emptyStaffForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const staffQ = useQuery({
    queryKey: ['staff', filter, statusFilter],
    queryFn: () =>
      listStaff({
        q: filter || undefined,
        status: statusFilter || undefined,
        per_page: 100,
      }),
  })

  const deptsQ = useQuery({
    queryKey: ['staff-departments'],
    queryFn: listDepartments,
  })

  const positionsQ = useQuery({
    queryKey: ['staff-positions'],
    queryFn: listStaffPositions,
  })

  const departments = deptsQ.data?.departments || []
  const positions = positionsQ.data?.positions || []
  const staff = staffQ.data?.staff || []

  const createMut = useMutation({
    mutationFn: createStaff,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] })
      setMessage('Staff member created')
      setError('')
      setForm(emptyStaffForm())
      setEditingId(null)
      sheet.onClose()
      toastSuccess('Staff member created', 'They are now on the staff directory.')
    },
    onError: (e) => {
      setError(e.message)
      toastError('Could not create staff', e.message)
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => updateStaff(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] })
      setMessage('Staff member updated')
      setError('')
      setForm(emptyStaffForm())
      setEditingId(null)
      sheet.onClose()
      toastSuccess('Staff member updated')
    },
    onError: (e) => {
      setError(e.message)
      toastError('Could not update staff', e.message)
    },
  })

  const deleteMut = useMutation({
    mutationFn: deleteStaff,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] })
      setMessage('Staff member removed')
      toastSuccess('Staff member removed')
    },
    onError: (e) => {
      setError(e.message)
      toastError('Could not remove staff', e.message)
    },
  })

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyStaffForm())
    setError('')
    sheet.onOpen()
  }

  const openEdit = (s) => {
    setEditingId(s.id)
    setForm({
      first_name: s.first_name || '',
      last_name: s.last_name || '',
      email: s.email || '',
      phone: s.phone || '',
      employee_code: s.employee_code || '',
      department_id: s.department_id ? String(s.department_id) : '',
      staff_position_id: s.staff_position_id ? String(s.staff_position_id) : '',
      employment_type: s.employment_type || 'Full-time',
      hire_date: s.hire_date || '',
      status: s.status || 'active',
    })
    setError('')
    sheet.onOpen()
  }

  const save = () => {
    setError('')
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('First and last name are required')
      return
    }
    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email || undefined,
      phone: form.phone || undefined,
      employee_code: form.employee_code || undefined,
      department_id: form.department_id ? Number(form.department_id) : null,
      staff_position_id: form.staff_position_id
        ? Number(form.staff_position_id)
        : null,
      employment_type: form.employment_type || 'Full-time',
      hire_date: form.hire_date || undefined,
      status: form.status || 'active',
    }
    if (editingId) {
      updateMut.mutate({ id: editingId, payload })
    } else {
      createMut.mutate(payload)
    }
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
        header: 'Role',
        size: 130,
        accessorFn: (r) => r.staff_position?.name || r.position || '—',
      },
      {
        accessorKey: 'employment_type',
        header: 'Contract',
        size: 100,
        Cell: ({ cell }) => cell.getValue() || '—',
      },
      {
        id: 'contact',
        header: 'Contact',
        size: 180,
        Cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate text-[11px]">
              {row.original.email || '—'}
            </div>
            <div className="truncate text-[10px] text-zinc-400">
              {row.original.phone || '—'}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 100,
        Cell: ({ cell }) => (
          <Chip
            size="sm"
            variant="flat"
            color={statusColor[cell.getValue()] || 'default'}
            className="h-5 capitalize text-[10px]"
          >
            {String(cell.getValue() || '').replace('_', ' ')}
          </Chip>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 96,
        enableSorting: false,
        Cell: ({ row }) => {
          const s = row.original
          return (
            <RowActionsMenu
              ariaLabel={`Actions for ${s.full_name}`}
              items={[
                {
                  key: 'edit',
                  label: 'Edit',
                  onPress: () => openEdit(s),
                },
                {
                  key: 'toggle',
                  label: s.status === 'active' ? 'Deactivate' : 'Activate',
                  color: s.status === 'active' ? 'warning' : 'default',
                  onPress: () =>
                    updateMut.mutate({
                      id: s.id,
                      payload: {
                        status: s.status === 'active' ? 'inactive' : 'active',
                      },
                    }),
                },
                {
                  key: 'leave',
                  label: 'Mark on leave',
                  show: s.status === 'active',
                  onPress: () =>
                    updateMut.mutate({
                      id: s.id,
                      payload: { status: 'on_leave' },
                    }),
                },
                {
                  key: 'remove',
                  label: 'Remove',
                  color: 'danger',
                  onPress: () => {
                    if (
                      window.confirm(
                        `Remove ${s.full_name} from the staff directory?`,
                      )
                    ) {
                      deleteMut.mutate(s.id)
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
    [updateMut.isPending, deleteMut.isPending],
  )

  return (
    <div className="flex flex-col gap-3">
      {(error || message) && (
        <p
          className={`rounded-md border px-3 py-2 text-sm ${
            error
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          {error || message}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <FormInput
          isClearable
          className="w-full sm:max-w-xs"
          placeholder="Search staff..."
          startContent={<Search className="h-3.5 w-3.5 text-zinc-400" />}
          value={filter}
          onValueChange={setFilter}
        />
        <FormSelect
          placeholder="Status"
          className="w-full sm:w-36"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'on_leave', label: 'On leave' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'terminated', label: 'Terminated' },
          ]}
        />
        <FormButton
          appearance="flat"
          isIconOnly
          onPress={() => staffQ.refetch()}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </FormButton>
        <FormButton
          className="sm:ml-auto"
          startContent={<Plus className="h-4 w-4" />}
          onPress={openCreate}
        >
          Add staff
        </FormButton>
      </div>

      {staffQ.isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner color="primary" />
        </div>
      ) : staffQ.isError ? (
        <p className="py-8 text-center text-sm text-red-600">
          {staffQ.error?.message || 'Failed to load staff'}
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={staff}
          emptyMessage="No staff yet. Add your first staff member."
        />
      )}

      <SideSheet
        isOpen={sheet.isOpen}
        onOpenChange={sheet.onOpenChange}
        title={editingId ? 'Edit staff member' : 'Add staff member'}
        size="lg"
        footer={(onClose) => (
          <>
            <FormButton appearance="light" onPress={onClose}>
              Cancel
            </FormButton>
            <FormButton
              isLoading={createMut.isPending || updateMut.isPending}
              onPress={save}
            >
              {editingId ? 'Save changes' : 'Create staff'}
            </FormButton>
          </>
        )}
      >
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="First name" required>
            <FormInput
              value={form.first_name}
              onValueChange={(v) => setForm((f) => ({ ...f, first_name: v }))}
            />
          </FormField>
          <FormField label="Last name" required>
            <FormInput
              value={form.last_name}
              onValueChange={(v) => setForm((f) => ({ ...f, last_name: v }))}
            />
          </FormField>
          <FormField label="Email">
            <FormInput
              value={form.email}
              onValueChange={(v) => setForm((f) => ({ ...f, email: v }))}
            />
          </FormField>
          <FormField label="Phone">
            <FormInput
              value={form.phone}
              onValueChange={(v) => setForm((f) => ({ ...f, phone: v }))}
            />
          </FormField>
          <FormField label="Employee code">
            <FormInput
              placeholder="Auto if empty"
              value={form.employee_code}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, employee_code: v }))
              }
            />
          </FormField>
          <FormField label="Employment type">
            <FormSelect
              label="Employment type"
              value={form.employment_type}
              onChange={(v) =>
                setForm((f) => ({ ...f, employment_type: v }))
              }
              options={[
                { value: 'Full-time', label: 'Full-time' },
                { value: 'Part-time', label: 'Part-time' },
                { value: 'Contract', label: 'Contract' },
                { value: 'Volunteer', label: 'Volunteer' },
              ]}
            />
          </FormField>
          <FormField label="Department">
            <FormSelect
              label="Department"
              placeholder="Department"
              value={form.department_id}
              onChange={(v) => setForm((f) => ({ ...f, department_id: v }))}
              options={departments
                .filter((d) => d.is_active !== false)
                .map((d) => ({ value: String(d.id), label: d.name }))}
            />
          </FormField>
          <FormField label="Role / position">
            <FormSelect
              label="Position"
              placeholder="Role / position"
              value={form.staff_position_id}
              onChange={(v) =>
                setForm((f) => ({ ...f, staff_position_id: v }))
              }
              options={positions
                .filter((p) => p.is_active !== false)
                .map((p) => ({ value: String(p.id), label: p.name }))}
            />
          </FormField>
          <FormField label="Hire date">
            <FormInput
              type="date"
              value={form.hire_date}
              onValueChange={(v) => setForm((f) => ({ ...f, hire_date: v }))}
            />
          </FormField>
          <FormField label="Status">
            <FormSelect
              label="Status"
              value={form.status}
              onChange={(v) => setForm((f) => ({ ...f, status: v }))}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'on_leave', label: 'On leave' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'terminated', label: 'Terminated' },
              ]}
            />
          </FormField>
        </div>
      </SideSheet>
    </div>
  )
}

function NamedCatalog({ kind }) {
  const isDept = kind === 'departments'
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [form, setForm] = useState(emptyNamedForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const listQ = useQuery({
    queryKey: [isDept ? 'staff-departments' : 'staff-positions'],
    queryFn: isDept ? listDepartments : listStaffPositions,
  })

  const rows = isDept
    ? listQ.data?.departments || []
    : listQ.data?.positions || []

  const createFn = isDept ? createDepartment : createStaffPosition
  const updateFn = isDept ? updateDepartment : updateStaffPosition
  const deleteFn = isDept ? deleteDepartment : deleteStaffPosition
  const entityLabel = isDept ? 'Department' : 'Position'

  const createMut = useMutation({
    mutationFn: createFn,
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: [isDept ? 'staff-departments' : 'staff-positions'],
      })
      qc.invalidateQueries({ queryKey: ['staff'] })
      setMessage(`${entityLabel} created`)
      setError('')
      setForm(emptyNamedForm())
      setEditingId(null)
      sheet.onClose()
      toastSuccess(`${entityLabel} created`)
    },
    onError: (e) => {
      setError(e.message)
      toastError(`Could not create ${entityLabel.toLowerCase()}`, e.message)
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => updateFn(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: [isDept ? 'staff-departments' : 'staff-positions'],
      })
      qc.invalidateQueries({ queryKey: ['staff'] })
      setMessage(`${entityLabel} updated`)
      setError('')
      setForm(emptyNamedForm())
      setEditingId(null)
      sheet.onClose()
      toastSuccess(`${entityLabel} updated`)
    },
    onError: (e) => {
      setError(e.message)
      toastError(`Could not update ${entityLabel.toLowerCase()}`, e.message)
    },
  })

  const deleteMut = useMutation({
    mutationFn: deleteFn,
    onSuccess: (data) => {
      qc.invalidateQueries({
        queryKey: [isDept ? 'staff-departments' : 'staff-positions'],
      })
      const msg = data?.deactivated
        ? `${entityLabel} deactivated (still assigned to staff)`
        : `${entityLabel} deleted`
      setMessage(msg)
      toastSuccess(msg)
    },
    onError: (e) => {
      setError(e.message)
      toastError(`Could not delete ${entityLabel.toLowerCase()}`, e.message)
    },
  })

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyNamedForm())
    setError('')
    sheet.onOpen()
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    setForm({
      name: row.name || '',
      code: row.code || '',
      description: row.description || '',
      is_active: row.is_active !== false,
    })
    setError('')
    sheet.onOpen()
  }

  const save = () => {
    if (!form.name.trim()) {
      setError('Name is required')
      return
    }
    const payload = {
      name: form.name.trim(),
      code: form.code.trim() || undefined,
      description: form.description.trim() || undefined,
      is_active: Boolean(form.is_active),
    }
    if (editingId) {
      updateMut.mutate({ id: editingId, payload })
    } else {
      createMut.mutate(payload)
    }
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        size: 180,
        Cell: ({ row }) => (
          <div>
            <div className="text-[11px] font-medium text-zinc-900">
              {row.original.name}
            </div>
            <div className="font-mono text-[10px] text-zinc-400">
              {row.original.code || '—'}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        size: 240,
        Cell: ({ cell }) => (
          <span className="line-clamp-2 text-[11px] text-zinc-600">
            {cell.getValue() || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'staff_count',
        header: 'Staff',
        size: 80,
        Cell: ({ cell }) => (
          <span className="tabular-nums">{cell.getValue() ?? 0}</span>
        ),
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        size: 90,
        Cell: ({ cell }) => (
          <Chip
            size="sm"
            variant="flat"
            color={cell.getValue() ? 'success' : 'default'}
            className="h-5 text-[10px]"
          >
            {cell.getValue() ? 'Active' : 'Inactive'}
          </Chip>
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
              items={[
                {
                  key: 'edit',
                  label: 'Edit',
                  onPress: () => openEdit(r),
                },
                {
                  key: 'toggle',
                  label: r.is_active ? 'Deactivate' : 'Activate',
                  color: r.is_active ? 'warning' : 'default',
                  onPress: () =>
                    updateMut.mutate({
                      id: r.id,
                      payload: { is_active: !r.is_active },
                    }),
                },
                {
                  key: 'delete',
                  label: 'Delete',
                  color: 'danger',
                  onPress: () => {
                    if (
                      window.confirm(
                        `Delete ${r.name}? Assigned staff will force deactivation instead.`,
                      )
                    ) {
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
    [updateMut.isPending, deleteMut.isPending],
  )

  return (
    <div className="flex flex-col gap-3">
      {(error || message) && (
        <p
          className={`rounded-md border px-3 py-2 text-sm ${
            error
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          {error || message}
        </p>
      )}

      <div className="flex items-center justify-end">
        <FormButton
          startContent={<Plus className="h-4 w-4" />}
          onPress={openCreate}
        >
          Add {entityLabel.toLowerCase()}
        </FormButton>
      </div>

      {listQ.isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner color="primary" />
        </div>
      ) : listQ.isError ? (
        <p className="py-8 text-center text-sm text-red-600">
          {listQ.error?.message || `Failed to load ${entityLabel.toLowerCase()}s`}
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          emptyMessage={`No ${entityLabel.toLowerCase()}s yet.`}
        />
      )}

      <SideSheet
        isOpen={sheet.isOpen}
        onOpenChange={sheet.onOpenChange}
        title={editingId ? `Edit ${entityLabel.toLowerCase()}` : `New ${entityLabel.toLowerCase()}`}
        footer={(onClose) => (
          <>
            <FormButton appearance="light" onPress={onClose}>
              Cancel
            </FormButton>
            <FormButton
              isLoading={createMut.isPending || updateMut.isPending}
              onPress={save}
            >
              {editingId ? 'Save' : 'Create'}
            </FormButton>
          </>
        )}
      >
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-col gap-3">
          <FormField label="Name" required>
            <FormInput
              value={form.name}
              onValueChange={(v) => setForm((f) => ({ ...f, name: v }))}
            />
          </FormField>
          <FormField label="Code">
            <FormInput
              placeholder="Optional short code"
              value={form.code}
              onValueChange={(v) => setForm((f) => ({ ...f, code: v }))}
            />
          </FormField>
          <FormField label="Description">
            <FormTextarea
              value={form.description}
              onValueChange={(v) => setForm((f) => ({ ...f, description: v }))}
            />
          </FormField>
          <FormField label="Status">
            <FormSelect
              label="Status"
              value={form.is_active ? '1' : '0'}
              onChange={(v) =>
                setForm((f) => ({ ...f, is_active: v === '1' }))
              }
              options={[
                { value: '1', label: 'Active' },
                { value: '0', label: 'Inactive' },
              ]}
            />
          </FormField>
        </div>
      </SideSheet>
    </div>
  )
}

const sectionMeta = {
  '/staff': {
    title: 'All Staff',
    description: 'Non-teaching staff directory for your school',
  },
  '/staff/profiles': {
    title: 'Staff Profiles',
    description: 'Detailed profiles and employment history',
  },
  '/staff/departments': {
    title: 'Departments',
    description: 'Organize staff by department',
  },
  '/staff/roles': {
    title: 'Roles & positions',
    description: 'Job titles and position hierarchy',
  },
  '/staff/attendance': {
    title: 'Staff Attendance',
    description: 'Daily clock-in and presence tracking',
  },
  '/staff/leave': {
    title: 'Leave',
    description: 'Leave requests, balances, and approvals',
  },
  '/staff/contracts': {
    title: 'Contracts',
    description: 'Employment contracts and renewals',
  },
  '/staff/documents': {
    title: 'Documents',
    description: 'IDs, certificates, and HR files',
  },
  '/staff/payroll': {
    title: 'Payroll Integration',
    description: 'Link staff records to payroll processing',
  },
}

function Staff() {
  const location = useLocation()
  const path = location.pathname
  const meta = useMemo(
    () =>
      sectionMeta[path] || {
        title: 'Staff',
        description: 'Non-teaching staff management',
      },
    [path],
  )

  let body = null
  if (path === '/staff') {
    body = <StaffDirectory />
  } else if (path === '/staff/departments') {
    body = <NamedCatalog kind="departments" />
  } else if (path === '/staff/roles') {
    body = <NamedCatalog kind="positions" />
  } else {
    body = (
      <ModulePlaceholder
        title={meta.title}
        description={meta.description}
        wrapLayout={false}
        showHeader={false}
      />
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title={meta.title}
          breadcrumbs={[
            { label: 'Staff', href: '/staff' },
            { label: meta.title },
          ]}
          description={meta.description}
        />
        {body}
      </div>
    </DashboardLayout>
  )
}

export default Staff
