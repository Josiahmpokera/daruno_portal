import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Chip, useDisclosure } from '@heroui/react'
import { Plus, Search } from 'lucide-react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import PageHeader from '../../components/Layout/PageHeader.jsx'
import SideSheet from '../../components/Layout/SideSheet.jsx'
import DataTable from '../../components/Tables/DataTable.jsx'
import RowActionsMenu from '../../components/Tables/RowActionsMenu.jsx'
import {
  FormField,
  FormInput,
  FormSelect,
  FormButton,
} from '../../components/Form'
import { toastSuccess, toastError } from '../../components/Toast'
import {
  listStudents,
  createStudent,
  updateStudent,
  bulkUpdateStudents,
  listClasses,
  listYears,
} from '../../api/domain.js'

const statusColorMap = {
  active: 'success',
  transferred: 'warning',
  graduated: 'primary',
  inactive: 'danger',
}

function downloadCsv(filename, rows) {
  if (!rows.length) return
  const headers = [
    'id',
    'full_name',
    'admission_number',
    'gender',
    'date_of_birth',
    'status',
    'class',
  ]
  const escape = (v) => {
    const s = v == null ? '' : String(v)
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      [
        r.id,
        r.full_name,
        r.admission_number,
        r.gender,
        r.date_of_birth,
        r.status,
        r.classroom?.name,
      ]
        .map(escape)
        .join(','),
    ),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function Students() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure()
  const [filterValue, setFilterValue] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const [form, setForm] = useState({
    id: null,
    first_name: '',
    last_name: '',
    admission_number: '',
    gender: '',
    date_of_birth: '',
    classroom_id: '',
    academic_year_id: '',
    status: 'active',
  })
  const [formError, setFormError] = useState('')
  const isEditing = Boolean(form.id)

  const emptyForm = () => ({
    id: null,
    first_name: '',
    last_name: '',
    admission_number: '',
    gender: '',
    date_of_birth: '',
    classroom_id: '',
    academic_year_id: '',
    status: 'active',
  })

  const studentsQuery = useQuery({
    queryKey: ['students', filterValue, statusFilter, classFilter],
    queryFn: () =>
      listStudents({
        q: filterValue || undefined,
        status: statusFilter || undefined,
        classroom_id: classFilter || undefined,
        per_page: 50,
      }),
    // Keep the table (and its search box) mounted while a new search loads
    placeholderData: (prev) => prev,
  })

  const classesQuery = useQuery({
    queryKey: ['academic', 'classes'],
    queryFn: listClasses,
  })

  const yearsQuery = useQuery({
    queryKey: ['academic', 'years'],
    queryFn: listYears,
  })

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      payload.id
        ? updateStudent(payload.id, payload)
        : createStudent(payload),
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      setFormError('')
      const student = data?.student || data
      const name =
        student?.full_name ||
        [vars.first_name, vars.last_name].filter(Boolean).join(' ') ||
        'Student'
      toastSuccess(
        vars.id ? 'Student updated' : 'Student added',
        vars.id
          ? `${name} was saved.`
          : `${name} is now on the student list.`,
      )
      setForm(emptyForm())
      onClose()
    },
    onError: (err) => {
      const msg = err.message || 'Failed to save student'
      setFormError(msg)
      toastError('Could not save student', msg)
    },
  })

  const openCreate = () => {
    setForm(emptyForm())
    setFormError('')
    onOpen()
  }

  const openEdit = (s) => {
    setForm({
      id: s.id,
      first_name: s.first_name || '',
      last_name: s.last_name || '',
      admission_number: s.admission_number || '',
      gender: s.gender || '',
      date_of_birth: s.date_of_birth
        ? String(s.date_of_birth).slice(0, 10)
        : '',
      classroom_id: s.classroom?.id ? String(s.classroom.id) : '',
      academic_year_id: '',
      status: s.status || 'active',
    })
    setFormError('')
    onOpen()
  }

  const statusMut = useMutation({
    mutationFn: ({ id, status }) => updateStudent(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      toastSuccess('Student status updated')
    },
    onError: (e) => toastError('Could not update status', e.message),
  })

  const bulkStatusMut = useMutation({
    mutationFn: ({ ids, status }) => bulkUpdateStudents(ids, { status }),
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      setRowSelection({})
      const n = res.ok.length
      const f = res.failed.length
      if (n) {
        toastSuccess(
          `Updated ${n} student${n === 1 ? '' : 's'}`,
          `Status set to ${vars.status}${f ? ` · ${f} failed` : ''}`,
        )
      }
      if (f && !n) toastError('Bulk update failed')
    },
    onError: (e) => toastError('Bulk update failed', e.message),
  })

  const students = studentsQuery.data?.students || []
  const classes = classesQuery.data?.classes || []
  const years = yearsQuery.data?.academic_years || []
  const currentYear = useMemo(
    () => years.find((y) => y.is_current) || years[0],
    [years],
  )

  const columns = useMemo(
    () => [
      {
        accessorKey: 'full_name',
        header: 'Student',
        size: 220,
        Cell: ({ row }) => (
          <button
            type="button"
            className="flex flex-col text-left hover:opacity-80"
            onClick={() => navigate(`/students/${row.original.id}`)}
          >
            <span className="text-sm font-medium text-[#0B3D2E]">
              {row.original.full_name}
            </span>
            <span className="text-[11px] text-zinc-400">
              {row.original.admission_number
                ? `Adm: ${row.original.admission_number}`
                : `ID: ${row.original.id}`}
            </span>
          </button>
        ),
      },
      {
        accessorKey: 'admission_number',
        header: 'Admission no',
        size: 130,
        Cell: ({ cell }) => cell.getValue() || '—',
      },
      {
        id: 'class',
        header: 'Class',
        size: 120,
        accessorFn: (r) => r.classroom?.name || '—',
      },
      {
        accessorKey: 'gender',
        header: 'Gender',
        size: 90,
        Cell: ({ cell }) => cell.getValue() || '—',
      },
      {
        accessorKey: 'date_of_birth',
        header: 'DOB',
        size: 120,
        Cell: ({ cell }) => cell.getValue() || '—',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 100,
        Cell: ({ cell }) => (
          <Chip
            className="h-5 capitalize text-[10px]"
            color={statusColorMap[cell.getValue()] || 'default'}
            size="sm"
            variant="flat"
          >
            {cell.getValue()}
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
                  key: 'view',
                  label: 'View profile',
                  onPress: () => navigate(`/students/${s.id}`),
                },
                {
                  key: 'edit',
                  label: 'Edit',
                  onPress: () => openEdit(s),
                },
                {
                  key: 'transfer',
                  label: 'Transfer',
                  onPress: () => navigate('/students/transfers'),
                },
                {
                  key: 'guardians',
                  label: 'Guardians',
                  onPress: () => navigate('/students/parents'),
                },
                {
                  key: 'deactivate',
                  label: s.status === 'active' ? 'Deactivate' : 'Activate',
                  color: s.status === 'active' ? 'warning' : 'default',
                  onPress: () =>
                    statusMut.mutate({
                      id: s.id,
                      status: s.status === 'active' ? 'inactive' : 'active',
                    }),
                },
              ]}
            />
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate],
  )

  const onSave = async () => {
    setFormError('')
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setFormError('First and last name are required')
      toastError('Missing details', 'First and last name are required.')
      return
    }
    try {
      await saveMutation.mutateAsync({
        id: form.id || undefined,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        admission_number: form.admission_number || undefined,
        gender: form.gender || undefined,
        date_of_birth: form.date_of_birth || undefined,
        status: form.status || 'active',
        classroom_id: form.classroom_id ? Number(form.classroom_id) : undefined,
        academic_year_id: form.academic_year_id
          ? Number(form.academic_year_id)
          : form.id
            ? undefined
            : currentYear?.id,
      })
    } catch {
      // Toast handled in mutation onError
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title="All Students"
          description="School learner directory"
          breadcrumbs={[
            { label: 'People', href: '/students' },
            { label: 'All Students' },
          ]}
          actions={
            <FormButton
              startContent={<Plus className="h-4 w-4" />}
              onPress={() => navigate('/students/registration')}
            >
              Add student
            </FormButton>
          }
        />

        {studentsQuery.isError && !studentsQuery.data ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <p className="text-sm text-red-600">
              {studentsQuery.error?.message || 'Failed to load students'}
            </p>
            {(studentsQuery.error?.status === 401 ||
              /unauth/i.test(studentsQuery.error?.message || '')) && (
              <p className="max-w-md text-xs text-zinc-500">
                Your session may have expired. Sign out and sign in again as a
                school user, then reopen Students.
              </p>
            )}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={students}
            isLoading={studentsQuery.isLoading}
            emptyMessage="No students yet. Add your first student."
            searchPlaceholder="Search name, admission or PREMS no…"
            search={filterValue}
            onSearchChange={setFilterValue}
            filters={[
              {
                key: 'status',
                label: 'Status',
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { value: 'active', label: 'Active' },
                  { value: 'transferred', label: 'Transferred' },
                  { value: 'graduated', label: 'Graduated' },
                  { value: 'inactive', label: 'Inactive' },
                ],
              },
              {
                key: 'classroom_id',
                label: 'Class',
                value: classFilter,
                onChange: setClassFilter,
                options: (classesQuery.data?.classes || []).map((c) => ({
                  value: String(c.id),
                  label: c.name,
                })),
              },
            ]}
            onRefresh={() => studentsQuery.refetch()}
            isRefreshing={studentsQuery.isFetching}
            toolbarActions={
              studentsQuery.data?.meta ? (
                <span className="whitespace-nowrap text-[11px] tabular-nums text-zinc-500">
                  {studentsQuery.data.meta.total} total
                </span>
              ) : null
            }
            enableRowSelection
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            getRowId={(row) => String(row.id)}
            renderBulkActions={(selected) => (
              <div className="flex flex-wrap items-center gap-1.5">
                <FormButton
                  appearance="bordered"
                  className="!h-7 min-h-7 text-[11px]"
                  isLoading={bulkStatusMut.isPending}
                  onPress={() =>
                    bulkStatusMut.mutate({
                      ids: selected.map((s) => s.id),
                      status: 'active',
                    })
                  }
                >
                  Activate
                </FormButton>
                <FormButton
                  appearance="bordered"
                  className="!h-7 min-h-7 text-[11px]"
                  isLoading={bulkStatusMut.isPending}
                  onPress={() => {
                    if (
                      !window.confirm(
                        `Deactivate ${selected.length} selected student(s)?`,
                      )
                    ) {
                      return
                    }
                    bulkStatusMut.mutate({
                      ids: selected.map((s) => s.id),
                      status: 'inactive',
                    })
                  }}
                >
                  Deactivate
                </FormButton>
                <FormButton
                  appearance="flat"
                  className="!h-7 min-h-7 text-[11px]"
                  onPress={() => {
                    downloadCsv(
                      `students-selected-${new Date().toISOString().slice(0, 10)}.csv`,
                      selected,
                    )
                    toastSuccess(
                      'Export ready',
                      `${selected.length} student(s) exported to CSV.`,
                    )
                  }}
                >
                  Export CSV
                </FormButton>
              </div>
            )}
          />
        )}

        <SideSheet
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          title={isEditing ? 'Edit student' : 'Add new student'}
          size="lg"
          footer={(close) => (
            <>
              <FormButton appearance="light" onPress={close}>
                Cancel
              </FormButton>
              <FormButton
                isLoading={saveMutation.isPending}
                onPress={onSave}
              >
                {isEditing ? 'Update student' : 'Save student'}
              </FormButton>
            </>
          )}
        >
          {formError && <p className="text-sm text-red-600">{formError}</p>}
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
            <FormField label="Admission no (optional)">
              <FormInput
                placeholder="Auto-generated if empty"
                value={form.admission_number}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, admission_number: v }))
                }
              />
            </FormField>
            <FormField label="Gender">
              <FormSelect
                label="Gender"
                placeholder="Select"
                value={form.gender}
                onChange={(v) => setForm((f) => ({ ...f, gender: v }))}
                options={[
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                ]}
              />
            </FormField>
            <FormField label="Date of birth">
              <FormInput
                type="date"
                value={form.date_of_birth}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, date_of_birth: v }))
                }
              />
            </FormField>
            <FormField label="Class">
              <FormSelect
                label="Class"
                placeholder="Select class"
                value={form.classroom_id}
                onChange={(v) => setForm((f) => ({ ...f, classroom_id: v }))}
                options={classes.map((c) => ({
                  value: String(c.id),
                  label: c.name,
                }))}
              />
            </FormField>
            <FormField label="Academic year" className="sm:col-span-2">
              <FormSelect
                label="Academic year"
                placeholder="Select year"
                value={
                  form.academic_year_id ||
                  (currentYear ? String(currentYear.id) : '')
                }
                onChange={(v) =>
                  setForm((f) => ({ ...f, academic_year_id: v }))
                }
                options={years.map((y) => ({
                  value: String(y.id),
                  label: `${y.name}${y.is_current ? ' (current)' : ''}`,
                }))}
              />
            </FormField>
          </div>
        </SideSheet>
      </div>
    </DashboardLayout>
  )
}

export default Students
