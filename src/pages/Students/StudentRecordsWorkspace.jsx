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
  bulkUpdateStudentStatus,
  createGuardian,
  createStudentDocument,
  deleteGuardian,
  deleteStudentDocument,
  listGuardians,
  listMedicalRecords,
  listPreviousSchools,
  listStudentDocuments,
  listStudents,
  saveMedicalRecord,
  studentStatusSummary,
  updateGuardian,
  updatePreviousSchool,
  updateStudentDocument,
} from '../../api/domain.js'

const statusColor = {
  active: 'success',
  transferred: 'warning',
  graduated: 'primary',
  inactive: 'danger',
  archived: 'default',
}

function sectionFromPath(pathname) {
  if (pathname.includes('/students/parents')) return 'parents'
  if (pathname.includes('/students/medical')) return 'medical'
  if (pathname.includes('/students/previous-school')) return 'previous'
  if (pathname.includes('/students/documents')) return 'documents'
  if (pathname.includes('/students/status')) return 'status'
  return 'parents'
}

function useStudentsOptions() {
  return useQuery({
    queryKey: ['students', 'options', 'records'],
    queryFn: () => listStudents({ per_page: 100, status: 'active' }),
    staleTime: 60_000,
  })
}

function studentOptionsFrom(data) {
  return (data?.students || []).map((s) => ({
    value: String(s.id),
    label: `${s.full_name}${s.admission_number ? ` (${s.admission_number})` : ''}`,
  }))
}

// ── Parents / Guardians ──────────────────────────────────────────

function ParentsSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [q, setQ] = useState('')
  const [relationship, setRelationship] = useState('')
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
    is_primary: false,
  })

  const studentsQ = useStudentsOptions()
  const listQ = useQuery({
    queryKey: ['guardians', q, relationship],
    queryFn: () =>
      listGuardians({
        q: q || undefined,
        relationship: relationship || undefined,
        per_page: 50,
      }),
  })

  const saveMut = useMutation({
    mutationFn: (payload) =>
      payload.id
        ? updateGuardian(payload.id, payload)
        : createGuardian(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guardians'] })
      qc.invalidateQueries({ queryKey: ['students'] })
      toastSuccess(form.id ? 'Guardian updated' : 'Guardian added')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Save failed'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteGuardian,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guardians'] })
      toastSuccess('Guardian removed')
    },
    onError: (e) => toastError(e?.message || 'Delete failed'),
  })

  const openCreate = () => {
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
      is_primary: false,
    })
    sheet.onOpen()
  }

  const openEdit = (g) => {
    setForm({
      id: g.id,
      student_id: String(g.student_id),
      relationship: g.relationship || 'guardian',
      full_name: g.full_name || '',
      phone: g.phone || '',
      email: g.email || '',
      occupation: g.occupation || '',
      nida_number: g.nida_number || '',
      address: g.address || '',
      is_primary: Boolean(g.is_primary),
    })
    sheet.onOpen()
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'full_name',
        header: 'Guardian',
        size: 180,
        Cell: ({ row }) => (
          <div>
            <div className="font-medium text-zinc-900">
              {row.original.full_name}
            </div>
            <div className="text-[11px] capitalize text-zinc-400">
              {row.original.relationship}
              {row.original.is_primary ? ' · Primary' : ''}
            </div>
          </div>
        ),
      },
      {
        id: 'student',
        header: 'Student',
        size: 180,
        Cell: ({ row }) => (
          <div>
            <div className="text-zinc-800">
              {row.original.student?.full_name || '—'}
            </div>
            <div className="font-mono text-[11px] text-zinc-400">
              {row.original.student?.admission_number}
            </div>
          </div>
        ),
      },
      { accessorKey: 'phone', header: 'Phone', size: 120 },
      { accessorKey: 'email', header: 'Email', size: 160 },
      {
        id: 'actions',
        header: 'Actions',
        size: 90,
        enableSorting: false,
        Cell: ({ row }) => (
          <RowActionsMenu
            ariaLabel="Guardian actions"
            items={[
              {
                key: 'edit',
                label: 'Edit',
                onPress: () => openEdit(row.original),
              },
              {
                key: 'delete',
                label: 'Remove',
                color: 'danger',
                onPress: () => {
                  if (
                    window.confirm(
                      `Remove guardian “${row.original.full_name}”?`,
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

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <FormInput
            value={q}
            onValueChange={setQ}
            placeholder="Search guardian or student…"
            classNames={{ inputWrapper: 'pl-8' }}
          />
        </div>
        <FormSelect
          className="w-40"
          placeholder="Relationship"
          value={relationship || 'all'}
          onChange={(v) => setRelationship(v === 'all' ? '' : v)}
          options={[
            { value: 'all', label: 'All' },
            { value: 'father', label: 'Father' },
            { value: 'mother', label: 'Mother' },
            { value: 'guardian', label: 'Guardian' },
            { value: 'other', label: 'Other' },
          ]}
        />
        <FormButton appearance="bordered" onPress={() => listQ.refetch()}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" />
          Refresh
        </FormButton>
        <FormButton onPress={openCreate}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add guardian
        </FormButton>
      </div>

      <DataTable
        columns={columns}
        data={listQ.data?.guardians || []}
        isLoading={listQ.isLoading}
        emptyMessage="No parents or guardians yet"
        enableRowSelection={false}
        hideTopToolbar
        maxHeight="min(55vh, 480px)"
      />

      <SideSheet
        isOpen={sheet.isOpen}
        onOpenChange={sheet.onOpenChange}
        title={form.id ? 'Edit guardian' : 'Add parent / guardian'}
        size="lg"
        footer={(onClose) => (
          <>
            <FormButton appearance="light" onPress={onClose}>
              Cancel
            </FormButton>
            <FormButton
              isLoading={saveMut.isPending}
              onPress={() => {
                if (!form.student_id || !form.full_name.trim()) {
                  toastError('Student and full name are required')
                  return
                }
                saveMut.mutate({
                  ...form,
                  student_id: Number(form.student_id),
                  is_primary: Boolean(form.is_primary),
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
              options={studentOptionsFrom(studentsQ.data)}
            />
          </FormField>
          <FormField label="Relationship" required>
            <FormSelect
              value={form.relationship}
              onChange={(v) => setForm((f) => ({ ...f, relationship: v }))}
              options={[
                { value: 'father', label: 'Father' },
                { value: 'mother', label: 'Mother' },
                { value: 'guardian', label: 'Guardian' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </FormField>
          <FormField label="Full name" required>
            <FormInput
              value={form.full_name}
              onValueChange={(v) => setForm((f) => ({ ...f, full_name: v }))}
            />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Phone">
              <FormInput
                value={form.phone}
                onValueChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              />
            </FormField>
            <FormField label="Email">
              <FormInput
                value={form.email}
                onValueChange={(v) => setForm((f) => ({ ...f, email: v }))}
              />
            </FormField>
            <FormField label="Occupation">
              <FormInput
                value={form.occupation}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, occupation: v }))
                }
              />
            </FormField>
            <FormField label="NIDA number">
              <FormInput
                value={form.nida_number}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, nida_number: v }))
                }
              />
            </FormField>
          </div>
          <FormField label="Address">
            <FormTextarea
              value={form.address}
              onValueChange={(v) => setForm((f) => ({ ...f, address: v }))}
            />
          </FormField>
          <label className="flex items-center gap-2 text-[13px] text-zinc-700">
            <input
              type="checkbox"
              checked={form.is_primary}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_primary: e.target.checked }))
              }
            />
            Primary contact
          </label>
        </div>
      </SideSheet>
    </>
  )
}

// ── Medical ──────────────────────────────────────────────────────

function MedicalSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [q, setQ] = useState('')
  const [form, setForm] = useState({
    student_id: '',
    blood_group: '',
    disability: '',
    allergies: '',
    chronic_conditions: '',
    notes: '',
    full_name: '',
  })

  const listQ = useQuery({
    queryKey: ['students', 'medical', q],
    queryFn: () =>
      listMedicalRecords({ q: q || undefined, per_page: 50, include_all: 1 }),
  })

  const saveMut = useMutation({
    mutationFn: () =>
      saveMedicalRecord(form.student_id, {
        blood_group: form.blood_group || null,
        disability: form.disability || null,
        allergies: form.allergies || null,
        chronic_conditions: form.chronic_conditions || null,
        notes: form.notes || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students', 'medical'] })
      toastSuccess('Medical information saved')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Save failed'),
  })

  const openEdit = (row) => {
    setForm({
      student_id: row.student_id,
      full_name: row.full_name,
      blood_group: row.blood_group || '',
      disability: row.disability || '',
      allergies: row.allergies || '',
      chronic_conditions: row.chronic_conditions || '',
      notes: row.notes || '',
    })
    sheet.onOpen()
  }

  const columns = useMemo(
    () => [
      {
        id: 'student',
        header: 'Student',
        size: 200,
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
        accessorKey: 'blood_group',
        header: 'Blood',
        size: 80,
        Cell: ({ cell }) => cell.getValue() || '—',
      },
      {
        accessorKey: 'disability',
        header: 'Disability',
        size: 120,
        Cell: ({ cell }) => cell.getValue() || '—',
      },
      {
        accessorKey: 'allergies',
        header: 'Allergies',
        size: 160,
        Cell: ({ cell }) => (
          <span className="line-clamp-2 text-[12px]">
            {cell.getValue() || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'chronic_conditions',
        header: 'Chronic',
        size: 160,
        Cell: ({ cell }) => (
          <span className="line-clamp-2 text-[12px]">
            {cell.getValue() || '—'}
          </span>
        ),
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
                label: 'Edit medical',
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
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <FormInput
            value={q}
            onValueChange={setQ}
            placeholder="Search student…"
            classNames={{ inputWrapper: 'pl-8' }}
          />
        </div>
        <FormButton appearance="bordered" onPress={() => listQ.refetch()}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" />
          Refresh
        </FormButton>
      </div>

      <DataTable
        columns={columns}
        data={listQ.data?.records || []}
        isLoading={listQ.isLoading}
        emptyMessage="No medical records"
        enableRowSelection={false}
        hideTopToolbar
        maxHeight="min(55vh, 480px)"
      />

      <SideSheet
        isOpen={sheet.isOpen}
        onOpenChange={sheet.onOpenChange}
        title={`Medical — ${form.full_name || 'Student'}`}
        size="lg"
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
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Blood group">
              <FormSelect
                placeholder="Blood group"
                value={form.blood_group || 'none'}
                onChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    blood_group: v === 'none' ? '' : v,
                  }))
                }
                options={[
                  { value: 'none', label: 'Not set' },
                  'A+',
                  'A-',
                  'B+',
                  'B-',
                  'AB+',
                  'AB-',
                  'O+',
                  'O-',
                ].map((x) =>
                  typeof x === 'string' ? { value: x, label: x } : x,
                )}
              />
            </FormField>
            <FormField label="Disability / special needs">
              <FormInput
                value={form.disability}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, disability: v }))
                }
              />
            </FormField>
          </div>
          <FormField label="Allergies">
            <FormTextarea
              value={form.allergies}
              onValueChange={(v) => setForm((f) => ({ ...f, allergies: v }))}
            />
          </FormField>
          <FormField label="Chronic conditions">
            <FormTextarea
              value={form.chronic_conditions}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, chronic_conditions: v }))
              }
            />
          </FormField>
          <FormField label="Notes">
            <FormTextarea
              value={form.notes}
              onValueChange={(v) => setForm((f) => ({ ...f, notes: v }))}
            />
          </FormField>
        </div>
      </SideSheet>
    </>
  )
}

// ── Previous school ──────────────────────────────────────────────

function PreviousSchoolSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [q, setQ] = useState('')
  const [hasPrevious, setHasPrevious] = useState('')
  const [form, setForm] = useState({
    student_id: '',
    full_name: '',
    previous_school: '',
    previous_class: '',
    admission_date: '',
  })

  const listQ = useQuery({
    queryKey: ['students', 'previous-school', q, hasPrevious],
    queryFn: () =>
      listPreviousSchools({
        q: q || undefined,
        has_previous: hasPrevious || undefined,
        per_page: 50,
      }),
  })

  const saveMut = useMutation({
    mutationFn: () =>
      updatePreviousSchool(form.student_id, {
        previous_school: form.previous_school || null,
        previous_class: form.previous_class || null,
        admission_date: form.admission_date || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students', 'previous-school'] })
      toastSuccess('Previous school updated')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Save failed'),
  })

  const openEdit = (row) => {
    setForm({
      student_id: row.id,
      full_name: row.full_name,
      previous_school: row.previous_school || '',
      previous_class: row.previous_class || '',
      admission_date: row.admission_date || '',
    })
    sheet.onOpen()
  }

  const columns = useMemo(
    () => [
      {
        id: 'student',
        header: 'Student',
        size: 200,
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
        accessorKey: 'previous_school',
        header: 'Previous school',
        size: 200,
        Cell: ({ cell }) => cell.getValue() || '—',
      },
      {
        accessorKey: 'previous_class',
        header: 'Previous class',
        size: 120,
        Cell: ({ cell }) => cell.getValue() || '—',
      },
      {
        accessorKey: 'admission_date',
        header: 'Admitted',
        size: 110,
        Cell: ({ cell }) => cell.getValue() || '—',
      },
      {
        id: 'class',
        header: 'Current class',
        size: 120,
        Cell: ({ row }) => row.original.classroom?.name || '—',
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
            ]}
          />
        ),
      },
    ],
    [],
  )

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <FormInput
            value={q}
            onValueChange={setQ}
            placeholder="Search student or school…"
            classNames={{ inputWrapper: 'pl-8' }}
          />
        </div>
        <FormSelect
          className="w-44"
          placeholder="Filter"
          value={hasPrevious || 'all'}
          onChange={(v) => setHasPrevious(v === 'all' ? '' : v)}
          options={[
            { value: 'all', label: 'All students' },
            { value: 'yes', label: 'Has previous school' },
            { value: 'no', label: 'No previous school' },
          ]}
        />
        <FormButton appearance="bordered" onPress={() => listQ.refetch()}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" />
          Refresh
        </FormButton>
      </div>

      <DataTable
        columns={columns}
        data={listQ.data?.students || []}
        isLoading={listQ.isLoading}
        emptyMessage="No students found"
        enableRowSelection={false}
        hideTopToolbar
        maxHeight="min(55vh, 480px)"
      />

      <SideSheet
        isOpen={sheet.isOpen}
        onOpenChange={sheet.onOpenChange}
        title={`Previous school — ${form.full_name || ''}`}
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
          <FormField label="Previous school name">
            <FormInput
              value={form.previous_school}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, previous_school: v }))
              }
            />
          </FormField>
          <FormField label="Previous class / form">
            <FormInput
              value={form.previous_class}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, previous_class: v }))
              }
            />
          </FormField>
          <FormField label="Admission date (this school)">
            <FormInput
              type="date"
              value={form.admission_date}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, admission_date: v }))
              }
            />
          </FormField>
        </div>
      </SideSheet>
    </>
  )
}

// ── Documents ────────────────────────────────────────────────────

function DocumentsSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [q, setQ] = useState('')
  const [docType, setDocType] = useState('')
  const studentsQ = useStudentsOptions()
  const [form, setForm] = useState({
    id: null,
    student_id: '',
    title: '',
    document_type: 'birth_certificate',
    reference_number: '',
    issued_on: '',
    expires_on: '',
    notes: '',
    status: 'active',
    file_name: '',
  })

  const listQ = useQuery({
    queryKey: ['students', 'documents', q, docType],
    queryFn: () =>
      listStudentDocuments({
        q: q || undefined,
        document_type: docType || undefined,
        per_page: 50,
      }),
  })

  const types = listQ.data?.document_types || [
    'birth_certificate',
    'transfer_letter',
    'medical_report',
    'photo',
    'id',
    'report_card',
    'other',
  ]

  const saveMut = useMutation({
    mutationFn: (payload) =>
      payload.id
        ? updateStudentDocument(payload.id, payload)
        : createStudentDocument(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students', 'documents'] })
      toastSuccess(form.id ? 'Document updated' : 'Document added')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Save failed'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteStudentDocument,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students', 'documents'] })
      toastSuccess('Document removed')
    },
    onError: (e) => toastError(e?.message || 'Delete failed'),
  })

  const openCreate = () => {
    setForm({
      id: null,
      student_id: '',
      title: '',
      document_type: 'birth_certificate',
      reference_number: '',
      issued_on: '',
      expires_on: '',
      notes: '',
      status: 'active',
      file_name: '',
    })
    sheet.onOpen()
  }

  const openEdit = (d) => {
    setForm({
      id: d.id,
      student_id: String(d.student_id),
      title: d.title || '',
      document_type: d.document_type || 'other',
      reference_number: d.reference_number || '',
      issued_on: d.issued_on || '',
      expires_on: d.expires_on || '',
      notes: d.notes || '',
      status: d.status || 'active',
      file_name: d.file_name || '',
    })
    sheet.onOpen()
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Document',
        size: 180,
        Cell: ({ row }) => (
          <div>
            <div className="font-medium text-zinc-900">{row.original.title}</div>
            <div className="text-[11px] capitalize text-zinc-400">
              {String(row.original.document_type || '').replaceAll('_', ' ')}
            </div>
          </div>
        ),
      },
      {
        id: 'student',
        header: 'Student',
        size: 160,
        Cell: ({ row }) => row.original.student?.full_name || '—',
      },
      {
        accessorKey: 'reference_number',
        header: 'Reference',
        size: 120,
        Cell: ({ cell }) => cell.getValue() || '—',
      },
      {
        accessorKey: 'issued_on',
        header: 'Issued',
        size: 100,
        Cell: ({ cell }) => cell.getValue() || '—',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 90,
        Cell: ({ cell }) => (
          <Chip size="sm" variant="flat" className="capitalize">
            {cell.getValue()}
          </Chip>
        ),
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
                label: 'Delete',
                color: 'danger',
                onPress: () => {
                  if (window.confirm('Delete this document record?')) {
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

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <FormInput
            value={q}
            onValueChange={setQ}
            placeholder="Search document or student…"
            classNames={{ inputWrapper: 'pl-8' }}
          />
        </div>
        <FormSelect
          className="w-48"
          placeholder="Type"
          value={docType || 'all'}
          onChange={(v) => setDocType(v === 'all' ? '' : v)}
          options={[
            { value: 'all', label: 'All types' },
            ...types.map((t) => ({
              value: t,
              label: t.replaceAll('_', ' '),
            })),
          ]}
        />
        <FormButton appearance="bordered" onPress={() => listQ.refetch()}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" />
          Refresh
        </FormButton>
        <FormButton onPress={openCreate}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add document
        </FormButton>
      </div>

      <DataTable
        columns={columns}
        data={listQ.data?.documents || []}
        isLoading={listQ.isLoading}
        emptyMessage="No documents recorded"
        enableRowSelection={false}
        hideTopToolbar
        maxHeight="min(55vh, 480px)"
      />

      <SideSheet
        isOpen={sheet.isOpen}
        onOpenChange={sheet.onOpenChange}
        title={form.id ? 'Edit document' : 'Add document / certificate'}
        size="lg"
        footer={(onClose) => (
          <>
            <FormButton appearance="light" onPress={onClose}>
              Cancel
            </FormButton>
            <FormButton
              isLoading={saveMut.isPending}
              onPress={() => {
                if (!form.student_id || !form.title.trim()) {
                  toastError('Student and title are required')
                  return
                }
                saveMut.mutate({
                  ...form,
                  student_id: Number(form.student_id),
                  issued_on: form.issued_on || null,
                  expires_on: form.expires_on || null,
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
              options={studentOptionsFrom(studentsQ.data)}
            />
          </FormField>
          <FormField label="Title" required>
            <FormInput
              value={form.title}
              onValueChange={(v) => setForm((f) => ({ ...f, title: v }))}
              placeholder="e.g. Birth certificate"
            />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Type">
              <FormSelect
                value={form.document_type}
                onChange={(v) =>
                  setForm((f) => ({ ...f, document_type: v }))
                }
                options={types.map((t) => ({
                  value: t,
                  label: t.replaceAll('_', ' '),
                }))}
              />
            </FormField>
            <FormField label="Status">
              <FormSelect
                value={form.status}
                onChange={(v) => setForm((f) => ({ ...f, status: v }))}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'archived', label: 'Archived' },
                ]}
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
            <FormField label="File name (optional)">
              <FormInput
                value={form.file_name}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, file_name: v }))
                }
                placeholder="certificate.pdf"
              />
            </FormField>
            <FormField label="Issued on">
              <FormInput
                type="date"
                value={form.issued_on}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, issued_on: v }))
                }
              />
            </FormField>
            <FormField label="Expires on">
              <FormInput
                type="date"
                value={form.expires_on}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, expires_on: v }))
                }
              />
            </FormField>
          </div>
          <FormField label="Notes">
            <FormTextarea
              value={form.notes}
              onValueChange={(v) => setForm((f) => ({ ...f, notes: v }))}
            />
          </FormField>
        </div>
      </SideSheet>
    </>
  )
}

// ── Status management ────────────────────────────────────────────

function StatusSection() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const [bulkStatus, setBulkStatus] = useState('active')

  const summaryQ = useQuery({
    queryKey: ['students', 'status-summary'],
    queryFn: studentStatusSummary,
  })

  const listQ = useQuery({
    queryKey: ['students', 'status-list', q, statusFilter],
    queryFn: () =>
      listStudents({
        q: q || undefined,
        status: statusFilter || undefined,
        per_page: 50,
      }),
  })

  const bulkMut = useMutation({
    mutationFn: (payload) => bulkUpdateStudentStatus(payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['students'] })
      setRowSelection({})
      toastSuccess(`Updated ${data?.updated ?? 0} student(s)`)
    },
    onError: (e) => toastError(e?.message || 'Bulk update failed'),
  })

  const singleMut = useMutation({
    mutationFn: ({ id, status }) =>
      bulkUpdateStudentStatus({ ids: [id], status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      toastSuccess('Status updated')
    },
    onError: (e) => toastError(e?.message || 'Update failed'),
  })

  const selectedIds = useMemo(() => {
    return Object.keys(rowSelection || {})
      .filter((k) => rowSelection[k])
      .map((k) => Number(k))
      .filter(Boolean)
  }, [rowSelection])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'full_name',
        header: 'Student',
        size: 200,
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
        id: 'class',
        header: 'Class',
        size: 120,
        Cell: ({ row }) => row.original.classroom?.name || '—',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 120,
        Cell: ({ cell }) => (
          <Chip
            size="sm"
            variant="flat"
            color={statusColor[cell.getValue()] || 'default'}
            className="capitalize"
          >
            {cell.getValue()}
          </Chip>
        ),
      },
      {
        id: 'actions',
        header: 'Set status',
        size: 200,
        enableSorting: false,
        Cell: ({ row }) => (
          <RowActionsMenu
            ariaLabel="Status actions"
            items={[
              {
                key: 'active',
                label: 'Mark active',
                show: row.original.status !== 'active',
                onPress: () =>
                  singleMut.mutate({ id: row.original.id, status: 'active' }),
              },
              {
                key: 'transferred',
                label: 'Mark transferred',
                show: row.original.status !== 'transferred',
                onPress: () =>
                  singleMut.mutate({
                    id: row.original.id,
                    status: 'transferred',
                  }),
              },
              {
                key: 'graduated',
                label: 'Mark graduated',
                show: row.original.status !== 'graduated',
                onPress: () =>
                  singleMut.mutate({
                    id: row.original.id,
                    status: 'graduated',
                  }),
              },
              {
                key: 'inactive',
                label: 'Mark inactive',
                color: 'danger',
                show: row.original.status !== 'inactive',
                onPress: () =>
                  singleMut.mutate({
                    id: row.original.id,
                    status: 'inactive',
                  }),
              },
            ]}
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [singleMut.isPending],
  )

  const byStatus = summaryQ.data?.by_status || []

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {['active', 'transferred', 'graduated', 'inactive'].map((st) => {
          const row = byStatus.find((r) => r.status === st)
          return (
            <div
              key={st}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5"
            >
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                {st}
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-900">
                {(row?.total ?? 0).toLocaleString()}
              </p>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-zinc-200 bg-white p-2.5">
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <FormInput
            value={q}
            onValueChange={setQ}
            placeholder="Search students…"
            classNames={{ inputWrapper: 'pl-8' }}
          />
        </div>
        <FormSelect
          className="w-40"
          placeholder="Filter status"
          value={statusFilter || 'all'}
          onChange={(v) => setStatusFilter(v === 'all' ? '' : v)}
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'active', label: 'Active' },
            { value: 'transferred', label: 'Transferred' },
            { value: 'graduated', label: 'Graduated' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />
        <FormSelect
          className="w-40"
          placeholder="Bulk status"
          value={bulkStatus}
          onChange={setBulkStatus}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'transferred', label: 'Transferred' },
            { value: 'graduated', label: 'Graduated' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />
        <FormButton
          isDisabled={!selectedIds.length || bulkMut.isPending}
          isLoading={bulkMut.isPending}
          onPress={() => {
            if (!selectedIds.length) {
              toastError('Select at least one student')
              return
            }
            bulkMut.mutate({ ids: selectedIds, status: bulkStatus })
          }}
        >
          Apply to {selectedIds.length || 0} selected
        </FormButton>
      </div>

      <DataTable
        columns={columns}
        data={listQ.data?.students || []}
        isLoading={listQ.isLoading}
        emptyMessage="No students found"
        enableRowSelection
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        getRowId={(row) => String(row.id)}
        maxHeight="min(50vh, 440px)"
        hideTopToolbar={false}
      />
    </>
  )
}

// ── Shell ────────────────────────────────────────────────────────

const META = {
  parents: {
    title: 'Parents / Guardians',
    description: 'Link parents and guardians to students with contact details',
  },
  medical: {
    title: 'Medical information',
    description: 'Blood group, allergies, disability, and health notes',
  },
  previous: {
    title: 'Previous school',
    description: 'Prior school and class before admission',
  },
  documents: {
    title: 'Documents & certificates',
    description: 'Birth certificates, transfer letters, and other records',
  },
  status: {
    title: 'Status management',
    description: 'Active, transferred, graduated, and inactive students',
  },
}

export default function StudentRecordsWorkspace() {
  const location = useLocation()
  const section = sectionFromPath(location.pathname)
  const meta = META[section] || META.parents

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

        {section === 'parents' && <ParentsSection />}
        {section === 'medical' && <MedicalSection />}
        {section === 'previous' && <PreviousSchoolSection />}
        {section === 'documents' && <DocumentsSection />}
        {section === 'status' && <StatusSection />}
      </div>
    </DashboardLayout>
  )
}
