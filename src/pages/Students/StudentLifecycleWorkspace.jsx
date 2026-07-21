import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Chip, Spinner, useDisclosure } from '@heroui/react'
import { Plus, RefreshCw, Search } from 'lucide-react'
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
  createGraduation,
  createTransfer,
  deleteGraduation,
  deleteTransfer,
  listAlumni,
  listGraduations,
  listStudents,
  listTransfers,
  listYears,
  updateAlumni,
  updateGraduation,
  updateTransfer,
} from '../../api/domain.js'

const transferStatusColor = {
  pending: 'warning',
  approved: 'primary',
  completed: 'success',
  cancelled: 'default',
}

function sectionFromPath(pathname) {
  if (pathname.includes('/students/transfers')) return 'transfers'
  if (pathname.includes('/students/graduation')) return 'graduation'
  if (pathname.includes('/students/alumni')) return 'alumni'
  return 'transfers'
}

function useActiveStudents() {
  return useQuery({
    queryKey: ['students', 'lifecycle-options'],
    queryFn: () => listStudents({ per_page: 100, status: 'active' }),
    staleTime: 60_000,
  })
}

function studentOptions(data) {
  return (data?.students || []).map((s) => ({
    value: String(s.id),
    label: `${s.full_name}${s.admission_number ? ` (${s.admission_number})` : ''}`,
  }))
}

// ── Transfers ────────────────────────────────────────────────────

function TransfersSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [direction, setDirection] = useState('')
  const studentsQ = useActiveStudents()

  const [form, setForm] = useState({
    id: null,
    student_id: '',
    direction: 'outgoing',
    other_school_name: '',
    other_school_code: '',
    transfer_date: '',
    reason: '',
    reference_number: '',
    status: 'pending',
    notes: '',
    apply_status: false,
  })

  const listQ = useQuery({
    queryKey: ['students', 'transfers', q, status, direction],
    queryFn: () =>
      listTransfers({
        q: q || undefined,
        status: status || undefined,
        direction: direction || undefined,
        per_page: 50,
      }),
  })

  const saveMut = useMutation({
    mutationFn: (payload) =>
      payload.id
        ? updateTransfer(payload.id, payload)
        : createTransfer(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students', 'transfers'] })
      qc.invalidateQueries({ queryKey: ['students'] })
      toastSuccess(form.id ? 'Transfer updated' : 'Transfer recorded')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Save failed'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteTransfer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students', 'transfers'] })
      toastSuccess('Transfer removed')
    },
    onError: (e) => toastError(e?.message || 'Delete failed'),
  })

  const completeMut = useMutation({
    mutationFn: (id) => updateTransfer(id, { status: 'completed' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students', 'transfers'] })
      qc.invalidateQueries({ queryKey: ['students'] })
      toastSuccess('Transfer completed — student status updated')
    },
    onError: (e) => toastError(e?.message || 'Could not complete'),
  })

  const openCreate = () => {
    setForm({
      id: null,
      student_id: '',
      direction: 'outgoing',
      other_school_name: '',
      other_school_code: '',
      transfer_date: new Date().toISOString().slice(0, 10),
      reason: '',
      reference_number: '',
      status: 'pending',
      notes: '',
      apply_status: false,
    })
    sheet.onOpen()
  }

  const openEdit = (t) => {
    setForm({
      id: t.id,
      student_id: String(t.student_id),
      direction: t.direction || 'outgoing',
      other_school_name: t.other_school_name || '',
      other_school_code: t.other_school_code || '',
      transfer_date: t.transfer_date || '',
      reason: t.reason || '',
      reference_number: t.reference_number || '',
      status: t.status || 'pending',
      notes: t.notes || '',
      apply_status: false,
    })
    sheet.onOpen()
  }

  const summary = listQ.data?.summary || {}

  const columns = useMemo(
    () => [
      {
        id: 'student',
        header: 'Student',
        size: 180,
        Cell: ({ row }) => (
          <div>
            <div className="font-medium text-zinc-900">
              {row.original.student?.full_name || '—'}
            </div>
            <div className="font-mono text-[11px] text-zinc-400">
              {row.original.student?.admission_number}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'direction',
        header: 'Direction',
        size: 100,
        Cell: ({ cell }) => (
          <span className="capitalize">{cell.getValue()}</span>
        ),
      },
      {
        accessorKey: 'other_school_name',
        header: 'Other school',
        size: 160,
        Cell: ({ cell }) => cell.getValue() || '—',
      },
      {
        accessorKey: 'transfer_date',
        header: 'Date',
        size: 110,
        Cell: ({ cell }) => cell.getValue() || '—',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 110,
        Cell: ({ cell }) => (
          <Chip
            size="sm"
            variant="flat"
            color={transferStatusColor[cell.getValue()] || 'default'}
            className="capitalize"
          >
            {cell.getValue()}
          </Chip>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 100,
        enableSorting: false,
        Cell: ({ row }) => {
          const t = row.original
          return (
            <RowActionsMenu
              items={[
                {
                  key: 'edit',
                  label: 'Edit',
                  show: t.status !== 'completed',
                  onPress: () => openEdit(t),
                },
                {
                  key: 'complete',
                  label: 'Mark completed',
                  show: t.status !== 'completed' && t.status !== 'cancelled',
                  onPress: () => completeMut.mutate(t.id),
                },
                {
                  key: 'cancel',
                  label: 'Cancel',
                  color: 'warning',
                  show: t.status === 'pending' || t.status === 'approved',
                  onPress: () =>
                    updateTransfer(t.id, { status: 'cancelled' }).then(() => {
                      qc.invalidateQueries({ queryKey: ['students', 'transfers'] })
                      toastSuccess('Transfer cancelled')
                    }),
                },
                {
                  key: 'delete',
                  label: 'Delete',
                  color: 'danger',
                  show: t.status !== 'completed',
                  onPress: () => {
                    if (window.confirm('Delete this transfer record?')) {
                      deleteMut.mutate(t.id)
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
    [completeMut.isPending, deleteMut.isPending],
  )

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {['pending', 'approved', 'completed', 'cancelled'].map((st) => (
          <div
            key={st}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
              {st}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-900">
              {(summary[st] ?? 0).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <FormInput
            value={q}
            onValueChange={setQ}
            placeholder="Search student or school…"
            classNames={{ inputWrapper: 'pl-8' }}
          />
        </div>
        <FormSelect
          className="w-36"
          placeholder="Status"
          value={status || 'all'}
          onChange={(v) => setStatus(v === 'all' ? '' : v)}
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
        />
        <FormSelect
          className="w-36"
          placeholder="Direction"
          value={direction || 'all'}
          onChange={(v) => setDirection(v === 'all' ? '' : v)}
          options={[
            { value: 'all', label: 'All directions' },
            { value: 'outgoing', label: 'Outgoing' },
            { value: 'incoming', label: 'Incoming' },
          ]}
        />
        <FormButton appearance="bordered" onPress={() => listQ.refetch()}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" />
          Refresh
        </FormButton>
        <FormButton onPress={openCreate}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          New transfer
        </FormButton>
      </div>

      {listQ.isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner color="success" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={listQ.data?.transfers || []}
          emptyMessage="No transfer records"
          enableRowSelection={false}
          hideTopToolbar
          maxHeight="min(55vh, 480px)"
        />
      )}

      <SideSheet
        isOpen={sheet.isOpen}
        onOpenChange={sheet.onOpenChange}
        title={form.id ? 'Edit transfer' : 'Record transfer'}
        size="lg"
        footer={(onClose) => (
          <>
            <FormButton appearance="light" onPress={onClose}>
              Cancel
            </FormButton>
            <FormButton
              isLoading={saveMut.isPending}
              onPress={() => {
                if (!form.student_id) {
                  toastError('Select a student')
                  return
                }
                saveMut.mutate({
                  ...form,
                  student_id: Number(form.student_id),
                  apply_status: Boolean(form.apply_status),
                })
              }}
            >
              Save
            </FormButton>
          </>
        )}
      >
        <div className="flex flex-col gap-3">
          <FormField label="Student" required>
            <FormSelect
              placeholder="Select student"
              value={form.student_id}
              onChange={(v) => setForm((f) => ({ ...f, student_id: v }))}
              options={studentOptions(studentsQ.data)}
              isDisabled={Boolean(form.id)}
            />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Direction">
              <FormSelect
                value={form.direction}
                onChange={(v) => setForm((f) => ({ ...f, direction: v }))}
                options={[
                  { value: 'outgoing', label: 'Outgoing (leaving)' },
                  { value: 'incoming', label: 'Incoming (joining)' },
                ]}
              />
            </FormField>
            <FormField label="Status">
              <FormSelect
                value={form.status}
                onChange={(v) => setForm((f) => ({ ...f, status: v }))}
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
              />
            </FormField>
            <FormField label="Other school name">
              <FormInput
                value={form.other_school_name}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, other_school_name: v }))
                }
              />
            </FormField>
            <FormField label="Other school code">
              <FormInput
                value={form.other_school_code}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, other_school_code: v }))
                }
              />
            </FormField>
            <FormField label="Transfer date">
              <FormInput
                type="date"
                value={form.transfer_date}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, transfer_date: v }))
                }
              />
            </FormField>
            <FormField label="Reference number">
              <FormInput
                value={form.reference_number}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, reference_number: v }))
                }
              />
            </FormField>
          </div>
          <FormField label="Reason">
            <FormInput
              value={form.reason}
              onValueChange={(v) => setForm((f) => ({ ...f, reason: v }))}
            />
          </FormField>
          <FormField label="Notes">
            <FormTextarea
              value={form.notes}
              onValueChange={(v) => setForm((f) => ({ ...f, notes: v }))}
            />
          </FormField>
          {!form.id && (
            <label className="flex items-center gap-2 text-[13px] text-zinc-700">
              <input
                type="checkbox"
                checked={form.apply_status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, apply_status: e.target.checked }))
                }
              />
              Complete immediately (set student status for outgoing transfers)
            </label>
          )}
        </div>
      </SideSheet>
    </>
  )
}

// ── Graduation ───────────────────────────────────────────────────

function GraduationSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const bulkSheet = useDisclosure()
  const [q, setQ] = useState('')
  const studentsQ = useActiveStudents()
  const yearsQ = useQuery({
    queryKey: ['academic', 'years'],
    queryFn: listYears,
    staleTime: 60_000,
  })

  const [form, setForm] = useState({
    id: null,
    student_id: '',
    academic_year_id: '',
    graduation_date: '',
    certificate_number: '',
    level_completed: '',
    remarks: '',
  })
  const [bulkIds, setBulkIds] = useState([])
  const [bulkForm, setBulkForm] = useState({
    academic_year_id: '',
    graduation_date: '',
    level_completed: '',
    remarks: '',
  })

  const listQ = useQuery({
    queryKey: ['students', 'graduations', q],
    queryFn: () =>
      listGraduations({
        q: q || undefined,
        per_page: 50,
      }),
  })

  const saveMut = useMutation({
    mutationFn: (payload) =>
      payload.id
        ? updateGraduation(payload.id, payload)
        : createGraduation(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students', 'graduations'] })
      qc.invalidateQueries({ queryKey: ['students', 'alumni'] })
      qc.invalidateQueries({ queryKey: ['students'] })
      toastSuccess(form.id ? 'Graduation updated' : 'Student graduated')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Save failed'),
  })

  const bulkMut = useMutation({
    mutationFn: (payload) => createGraduation(payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['students'] })
      toastSuccess(`Graduated ${data?.graduated ?? 0} student(s)`)
      bulkSheet.onClose()
      setBulkIds([])
    },
    onError: (e) => toastError(e?.message || 'Bulk graduation failed'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteGraduation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students', 'graduations'] })
      qc.invalidateQueries({ queryKey: ['students'] })
      toastSuccess('Graduation record removed')
    },
    onError: (e) => toastError(e?.message || 'Delete failed'),
  })

  // listYears returns unwrapped data: { years: [...] } or similar
  const yearsList = useMemo(() => {
    const d = yearsQ.data
    if (!d) return []
    if (Array.isArray(d.years)) return d.years
    if (Array.isArray(d)) return d
    return []
  }, [yearsQ.data])

  const openCreate = () => {
    setForm({
      id: null,
      student_id: '',
      academic_year_id: '',
      graduation_date: new Date().toISOString().slice(0, 10),
      certificate_number: '',
      level_completed: '',
      remarks: '',
    })
    sheet.onOpen()
  }

  const openEdit = (g) => {
    setForm({
      id: g.id,
      student_id: String(g.student_id),
      academic_year_id: g.academic_year_id ? String(g.academic_year_id) : '',
      graduation_date: g.graduation_date || '',
      certificate_number: g.certificate_number || '',
      level_completed: g.level_completed || '',
      remarks: g.remarks || '',
    })
    sheet.onOpen()
  }

  const columns = useMemo(
    () => [
      {
        id: 'student',
        header: 'Student',
        size: 180,
        Cell: ({ row }) => (
          <div>
            <div className="font-medium text-zinc-900">
              {row.original.student?.full_name || '—'}
            </div>
            <div className="font-mono text-[11px] text-zinc-400">
              {row.original.student?.admission_number}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'graduation_date',
        header: 'Date',
        size: 110,
        Cell: ({ cell }) => cell.getValue() || '—',
      },
      {
        id: 'year',
        header: 'Year',
        size: 120,
        Cell: ({ row }) => row.original.academic_year?.name || '—',
      },
      {
        accessorKey: 'level_completed',
        header: 'Level',
        size: 120,
        Cell: ({ cell }) => cell.getValue() || '—',
      },
      {
        accessorKey: 'certificate_number',
        header: 'Certificate #',
        size: 120,
        Cell: ({ cell }) => cell.getValue() || '—',
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 90,
        Cell: ({ row }) => (
          <RowActionsMenu
            items={[
              {
                key: 'edit',
                label: 'Edit',
                onPress: () => openEdit(row.original),
              },
              {
                key: 'delete',
                label: 'Undo graduation',
                color: 'danger',
                onPress: () => {
                  if (
                    window.confirm(
                      'Remove graduation and set student back to active?',
                    )
                  ) {
                    deleteMut.mutate(row.original.id)
                  }
                },
              },
            ]}
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deleteMut.isPending],
  )

  const summary = listQ.data?.summary || {}

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            Graduation records
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-900">
            {(summary.total ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            Graduated students
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-900">
            {(summary.graduated_students ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <FormInput
            value={q}
            onValueChange={setQ}
            placeholder="Search graduate…"
            classNames={{ inputWrapper: 'pl-8' }}
          />
        </div>
        <FormButton appearance="bordered" onPress={() => listQ.refetch()}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" />
          Refresh
        </FormButton>
        <FormButton appearance="bordered" onPress={() => bulkSheet.onOpen()}>
          Bulk graduate
        </FormButton>
        <FormButton onPress={openCreate}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Graduate student
        </FormButton>
      </div>

      <DataTable
        columns={columns}
        data={listQ.data?.graduations || []}
        isLoading={listQ.isLoading}
        emptyMessage="No graduation records yet"
        enableRowSelection={false}
        hideTopToolbar
        maxHeight="min(55vh, 480px)"
      />

      <SideSheet
        isOpen={sheet.isOpen}
        onOpenChange={sheet.onOpenChange}
        title={form.id ? 'Edit graduation' : 'Graduate student'}
        size="lg"
        footer={(onClose) => (
          <>
            <FormButton appearance="light" onPress={onClose}>
              Cancel
            </FormButton>
            <FormButton
              isLoading={saveMut.isPending}
              onPress={() => {
                if (!form.id && !form.student_id) {
                  toastError('Select a student')
                  return
                }
                const payload = {
                  ...form,
                  student_id: form.student_id
                    ? Number(form.student_id)
                    : undefined,
                  academic_year_id: form.academic_year_id
                    ? Number(form.academic_year_id)
                    : null,
                }
                saveMut.mutate(payload)
              }}
            >
              Save
            </FormButton>
          </>
        )}
      >
        <div className="flex flex-col gap-3">
          {!form.id && (
            <FormField label="Student" required>
              <FormSelect
                placeholder="Select active student"
                value={form.student_id}
                onChange={(v) => setForm((f) => ({ ...f, student_id: v }))}
                options={studentOptions(studentsQ.data)}
              />
            </FormField>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Graduation date">
              <FormInput
                type="date"
                value={form.graduation_date}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, graduation_date: v }))
                }
              />
            </FormField>
            <FormField label="Academic year">
              <FormSelect
                placeholder="Year"
                value={form.academic_year_id || 'none'}
                onChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    academic_year_id: v === 'none' ? '' : v,
                  }))
                }
                options={[
                  { value: 'none', label: 'Not set' },
                  ...yearsList.map((y) => ({
                    value: String(y.id),
                    label: y.name || `Year ${y.id}`,
                  })),
                ]}
              />
            </FormField>
            <FormField label="Level completed">
              <FormInput
                value={form.level_completed}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, level_completed: v }))
                }
                placeholder="e.g. Primary, O-Level"
              />
            </FormField>
            <FormField label="Certificate number">
              <FormInput
                value={form.certificate_number}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, certificate_number: v }))
                }
              />
            </FormField>
          </div>
          <FormField label="Remarks">
            <FormTextarea
              value={form.remarks}
              onValueChange={(v) => setForm((f) => ({ ...f, remarks: v }))}
            />
          </FormField>
        </div>
      </SideSheet>

      <SideSheet
        isOpen={bulkSheet.isOpen}
        onOpenChange={bulkSheet.onOpenChange}
        title="Bulk graduate students"
        size="lg"
        footer={(onClose) => (
          <>
            <FormButton appearance="light" onPress={onClose}>
              Cancel
            </FormButton>
            <FormButton
              isLoading={bulkMut.isPending}
              onPress={() => {
                if (!bulkIds.length) {
                  toastError('Select at least one student')
                  return
                }
                bulkMut.mutate({
                  student_id: Number(bulkIds[0]),
                  student_ids: bulkIds.map(Number),
                  academic_year_id: bulkForm.academic_year_id
                    ? Number(bulkForm.academic_year_id)
                    : null,
                  graduation_date: bulkForm.graduation_date || null,
                  level_completed: bulkForm.level_completed || null,
                  remarks: bulkForm.remarks || null,
                })
              }}
            >
              Graduate {bulkIds.length || 0} selected
            </FormButton>
          </>
        )}
      >
        <div className="flex flex-col gap-3">
          <p className="text-[12px] text-zinc-500">
            Select active students to graduate. They will move to alumni.
          </p>
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-zinc-200 p-2">
            {(studentsQ.data?.students || []).map((s) => {
              const checked = bulkIds.includes(String(s.id))
              return (
                <label
                  key={s.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-[13px] hover:bg-zinc-50"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const id = String(s.id)
                      setBulkIds((prev) =>
                        e.target.checked
                          ? [...prev, id]
                          : prev.filter((x) => x !== id),
                      )
                    }}
                  />
                  <span>
                    {s.full_name}
                    <span className="ml-1 font-mono text-[11px] text-zinc-400">
                      {s.admission_number}
                    </span>
                  </span>
                </label>
              )
            })}
            {!studentsQ.data?.students?.length && (
              <p className="p-2 text-[12px] text-zinc-400">
                No active students
              </p>
            )}
          </div>
          <FormField label="Graduation date">
            <FormInput
              type="date"
              value={bulkForm.graduation_date}
              onValueChange={(v) =>
                setBulkForm((f) => ({ ...f, graduation_date: v }))
              }
            />
          </FormField>
          <FormField label="Level completed">
            <FormInput
              value={bulkForm.level_completed}
              onValueChange={(v) =>
                setBulkForm((f) => ({ ...f, level_completed: v }))
              }
            />
          </FormField>
        </div>
      </SideSheet>
    </>
  )
}

// ── Alumni ───────────────────────────────────────────────────────

function AlumniSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [q, setQ] = useState('')
  const [year, setYear] = useState('')
  const [form, setForm] = useState({
    id: null,
    full_name: '',
    alumni_year: '',
    alumni_phone: '',
    alumni_email: '',
    alumni_occupation: '',
    alumni_notes: '',
  })

  const listQ = useQuery({
    queryKey: ['students', 'alumni', q, year],
    queryFn: () =>
      listAlumni({
        q: q || undefined,
        alumni_year: year || undefined,
        per_page: 50,
      }),
  })

  const saveMut = useMutation({
    mutationFn: () =>
      updateAlumni(form.id, {
        alumni_year: form.alumni_year ? Number(form.alumni_year) : null,
        alumni_phone: form.alumni_phone || null,
        alumni_email: form.alumni_email || null,
        alumni_occupation: form.alumni_occupation || null,
        alumni_notes: form.alumni_notes || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students', 'alumni'] })
      toastSuccess('Alumni profile updated')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Save failed'),
  })

  const openEdit = (a) => {
    setForm({
      id: a.id,
      full_name: a.full_name,
      alumni_year: a.alumni_year ? String(a.alumni_year) : '',
      alumni_phone: a.alumni_phone || '',
      alumni_email: a.alumni_email || '',
      alumni_occupation: a.alumni_occupation || '',
      alumni_notes: a.alumni_notes || '',
    })
    sheet.onOpen()
  }

  const years = listQ.data?.years || []
  const summary = listQ.data?.summary || {}

  const columns = useMemo(
    () => [
      {
        accessorKey: 'full_name',
        header: 'Alumni',
        size: 180,
        Cell: ({ row }) => (
          <div>
            <div className="font-medium text-zinc-900">
              {row.original.full_name}
            </div>
            <div className="font-mono text-[11px] text-zinc-400">
              {row.original.admission_number}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'alumni_year',
        header: 'Year',
        size: 80,
        Cell: ({ cell }) => cell.getValue() || '—',
      },
      {
        id: 'grad',
        header: 'Graduation',
        size: 140,
        Cell: ({ row }) =>
          row.original.graduation?.graduation_date ||
          row.original.graduation?.level_completed ||
          '—',
      },
      {
        accessorKey: 'alumni_phone',
        header: 'Phone',
        size: 120,
        Cell: ({ cell }) => cell.getValue() || '—',
      },
      {
        accessorKey: 'alumni_email',
        header: 'Email',
        size: 160,
        Cell: ({ cell }) => cell.getValue() || '—',
      },
      {
        accessorKey: 'alumni_occupation',
        header: 'Occupation',
        size: 140,
        Cell: ({ cell }) => cell.getValue() || '—',
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 90,
        Cell: ({ row }) => (
          <RowActionsMenu
            items={[
              {
                key: 'edit',
                label: 'Edit profile',
                onPress: () => openEdit(row.original),
              },
            ]}
          />
        ),
      },
    ],
    [],
  )

  return (
    <>
      <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 sm:w-64">
        <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
          Total alumni
        </p>
        <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-900">
          {(summary.total ?? 0).toLocaleString()}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <FormInput
            value={q}
            onValueChange={setQ}
            placeholder="Search alumni…"
            classNames={{ inputWrapper: 'pl-8' }}
          />
        </div>
        <FormSelect
          className="w-36"
          placeholder="Year"
          value={year || 'all'}
          onChange={(v) => setYear(v === 'all' ? '' : v)}
          options={[
            { value: 'all', label: 'All years' },
            ...years.map((y) => ({ value: String(y), label: String(y) })),
          ]}
        />
        <FormButton appearance="bordered" onPress={() => listQ.refetch()}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" />
          Refresh
        </FormButton>
      </div>

      <p className="text-[12px] text-zinc-500">
        Alumni are students with status <strong>graduated</strong>. Graduate
        learners from the Graduation page first.
      </p>

      <DataTable
        columns={columns}
        data={listQ.data?.alumni || []}
        isLoading={listQ.isLoading}
        emptyMessage="No alumni yet — graduate students to build the list"
        enableRowSelection={false}
        hideTopToolbar
        maxHeight="min(55vh, 480px)"
      />

      <SideSheet
        isOpen={sheet.isOpen}
        onOpenChange={sheet.onOpenChange}
        title={`Alumni — ${form.full_name || ''}`}
        footer={(onClose) => (
          <>
            <FormButton appearance="light" onPress={onClose}>
              Cancel
            </FormButton>
            <FormButton
              isLoading={saveMut.isPending}
              onPress={() => saveMut.mutate()}
            >
              Save
            </FormButton>
          </>
        )}
      >
        <div className="flex flex-col gap-3">
          <FormField label="Alumni year">
            <FormInput
              type="number"
              value={form.alumni_year}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, alumni_year: v }))
              }
            />
          </FormField>
          <FormField label="Phone">
            <FormInput
              value={form.alumni_phone}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, alumni_phone: v }))
              }
            />
          </FormField>
          <FormField label="Email">
            <FormInput
              value={form.alumni_email}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, alumni_email: v }))
              }
            />
          </FormField>
          <FormField label="Occupation">
            <FormInput
              value={form.alumni_occupation}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, alumni_occupation: v }))
              }
            />
          </FormField>
          <FormField label="Notes">
            <FormTextarea
              value={form.alumni_notes}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, alumni_notes: v }))
              }
            />
          </FormField>
        </div>
      </SideSheet>
    </>
  )
}

// ── Shell ────────────────────────────────────────────────────────

const META = {
  transfers: {
    title: 'Transfers',
    description:
      'Incoming and outgoing student transfers with status workflow',
  },
  graduation: {
    title: 'Graduation',
    description: 'Graduate students and issue certificate records',
  },
  alumni: {
    title: 'Alumni',
    description: 'Former graduates with contact and occupation details',
  },
}

export default function StudentLifecycleWorkspace() {
  const location = useLocation()
  const section = sectionFromPath(location.pathname)
  const meta = META[section] || META.transfers

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title={meta.title}
          description={meta.description}
          breadcrumbs={[
            { label: 'People', href: '/students' },
            { label: 'Students', href: '/students' },
            { label: meta.title },
          ]}
        />

        {section === 'transfers' && <TransfersSection />}
        {section === 'graduation' && <GraduationSection />}
        {section === 'alumni' && <AlumniSection />}
      </div>
    </DashboardLayout>
  )
}
