import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Chip, Spinner, Switch, useDisclosure } from '@heroui/react'
import { Plus } from 'lucide-react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import PageHeader from '../../components/Layout/PageHeader.jsx'
import ModulePlaceholder from '../../components/Layout/ModulePlaceholder.jsx'
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
import EducationStagesPicker from '../../components/School/EducationStagesPicker.jsx'
import {
  formatStagesSummary,
  schoolOffersSubjectCombinations,
} from '../../config/educationStages.js'
import { writeSession } from '../../auth/sessionStorage.js'
import { useAuth } from '../../auth'
import {
  listYears,
  createYear,
  updateYear,
  deleteYear,
  listTerms,
  createTerm,
  updateTerm,
  deleteTerm,
  listLevels,
  createLevel,
  updateLevel,
  deleteLevel,
  listStreams,
  createStream,
  updateStream,
  deleteStream,
  listClasses,
  createClass,
  updateClass,
  deleteClass,
  listSubjects,
  getSchoolProfile,
  updateSchoolProfile,
} from '../../api/domain.js'
import {
  SubjectsPanel,
  CategoriesPanel,
  CombinationsPanel,
  ClassAssignmentPanel,
  TeacherAllocationPanel,
} from './SubjectManagement.jsx'

const sectionMeta = {
  '/academic': {
    title: 'Academic Setup',
    description: 'Years, terms, levels, streams, classes and subjects',
    section: 'overview',
  },
  '/academic/years': {
    title: 'Academic Years',
    description: 'Define school years and mark the current year',
    section: 'years',
  },
  '/academic/terms': {
    title: 'Terms / Semesters',
    description: 'Terms linked to an academic year',
    section: 'terms',
  },
  '/academic/levels': {
    title: 'Education Levels',
    description:
      'Set which TAMISEMI stages this school operates, then manage class levels',
    section: 'levels',
  },
  '/academic/streams': {
    title: 'Streams',
    description: 'Class streams (A/B/C, Science, Arts…)',
    section: 'streams',
  },
  '/academic/classes': {
    title: 'Classes',
    description: 'Classrooms with optional level and stream',
    section: 'classes',
  },
  '/academic/subjects': {
    title: 'All Subjects',
    description:
      'TAMISEMI curriculum subjects for primary and secondary (NECTA codes supported)',
    section: 'subjects',
  },
  '/academic/subjects/categories': {
    title: 'Subject Categories',
    description: 'Group subjects (Languages, Sciences, Social sciences…)',
    section: 'subject-categories',
  },
  '/academic/subjects/combinations': {
    title: 'Subject Combinations',
    description:
      'NECTA A-level packages (PCM, PCB, HGL…) and optional O-level packages',
    section: 'subject-combinations',
  },
  '/academic/subjects/class-assignment': {
    title: 'Class Assignment',
    description:
      'Assign curriculum subjects to each class for the academic year',
    section: 'class-assignment',
  },
  '/academic/subjects/teacher-allocation': {
    title: 'Teacher Allocation',
    description:
      'Allocate teachers to subjects and classes (workload / timetable input)',
    section: 'teacher-allocation',
  },
}

function YearsPanel() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [form, setForm] = useState({
    name: '',
    starts_at: '',
    ends_at: '',
    is_current: false,
  })
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const listQ = useQuery({ queryKey: ['academic', 'years'], queryFn: listYears })
  const rows = listQ.data?.academic_years || []

  const saveMut = useMutation({
    mutationFn: (payload) =>
      editingId ? updateYear(editingId, payload) : createYear(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'years'] })
      qc.invalidateQueries({ queryKey: ['academic', 'terms'] })
      setMessage(editingId ? 'Year updated' : 'Year created')
      toastSuccess(editingId ? 'Year updated' : 'Year created')
      setError('')
      setForm({ name: '', starts_at: '', ends_at: '', is_current: false })
      setEditingId(null)
      sheet.onClose()
    },
    onError: (e) => {
      setError(e.message)
      toastError('Action failed', e.message)
    },
  })

  const deleteMut = useMutation({
    mutationFn: deleteYear,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'years'] })
      setMessage('Year deleted')
      toastSuccess('Year deleted')
    },
    onError: (e) => {
      setError(e.message)
      toastError('Action failed', e.message)
    },
  })

  const openCreate = () => {
    setEditingId(null)
    setForm({ name: '', starts_at: '', ends_at: '', is_current: false })
    setError('')
    sheet.onOpen()
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    setForm({
      name: row.name || '',
      starts_at: row.starts_at?.slice?.(0, 10) || row.starts_at || '',
      ends_at: row.ends_at?.slice?.(0, 10) || row.ends_at || '',
      is_current: Boolean(row.is_current),
    })
    setError('')
    sheet.onOpen()
  }

  const setCurrent = (id) => {
    updateYear(id, { is_current: true })
      .then(() => {
        qc.invalidateQueries({ queryKey: ['academic', 'years'] })
        setMessage('Current year updated')
        toastSuccess('Current year updated')
        setError('')
      })
      .catch((e) => {
        setError(e.message)
        toastError('Could not set current year', e.message)
      })
  }

  const columnsFixed = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Year',
        size: 140,
        Cell: ({ row }) => (
          <span className="font-medium text-zinc-900">{row.original.name}</span>
        ),
      },
      {
        id: 'period',
        header: 'Period',
        size: 200,
        accessorFn: (r) =>
          `${String(r.starts_at || '').slice(0, 10) || '—'} → ${String(r.ends_at || '').slice(0, 10) || '—'}`,
      },
      {
        accessorKey: 'terms_count',
        header: 'Terms',
        size: 80,
        Cell: ({ cell }) => cell.getValue() ?? 0,
      },
      {
        accessorKey: 'is_current',
        header: 'Status',
        size: 100,
        Cell: ({ cell }) =>
          cell.getValue() ? (
            <Chip size="sm" color="success" variant="flat" className="h-5 text-[10px]">
              Current
            </Chip>
          ) : (
            <span className="text-zinc-400">—</span>
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
                { key: 'edit', label: 'Edit', onPress: () => openEdit(r) },
                {
                  key: 'current',
                  label: 'Set as current',
                  show: !r.is_current,
                  onPress: () => setCurrent(r.id),
                },
                {
                  key: 'delete',
                  label: 'Delete',
                  color: 'danger',
                  onPress: () => {
                    if (window.confirm(`Delete academic year “${r.name}”?`)) {
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

  return (
    <CatalogShell
      error={error}
      message={message}
      onAdd={openCreate}
      addLabel="Add year"
      loading={listQ.isLoading}
      listError={listQ.error?.message}
      columns={columnsFixed}
      data={rows}
      emptyMessage="No academic years yet"
      sheet={sheet}
      sheetTitle={editingId ? 'Edit academic year' : 'New academic year'}
      saving={saveMut.isPending}
      onSave={() => {
        if (!form.name.trim()) {
          setError('Name is required')
          return
        }
        saveMut.mutate({
          name: form.name.trim(),
          starts_at: form.starts_at || null,
          ends_at: form.ends_at || null,
          is_current: Boolean(form.is_current),
        })
      }}
    >
      <FormField label="Name" required>
        <FormInput
          placeholder="2025/2026"
          value={form.name}
          onValueChange={(v) => setForm((f) => ({ ...f, name: v }))}
        />
      </FormField>
      <FormField label="Starts">
        <FormInput
          type="date"
          value={form.starts_at}
          onValueChange={(v) => setForm((f) => ({ ...f, starts_at: v }))}
        />
      </FormField>
      <FormField label="Ends">
        <FormInput
          type="date"
          value={form.ends_at}
          onValueChange={(v) => setForm((f) => ({ ...f, ends_at: v }))}
        />
      </FormField>
      <Switch
        size="sm"
        isSelected={form.is_current}
        onValueChange={(v) => setForm((f) => ({ ...f, is_current: v }))}
      >
        Set as current year
      </Switch>
    </CatalogShell>
  )
}

function CatalogShell({
  error,
  message,
  onAdd,
  addLabel,
  loading,
  listError,
  columns,
  data,
  emptyMessage,
  sheet,
  sheetTitle,
  saving,
  onSave,
  children,
}) {
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
      <div className="flex justify-end">
        <FormButton
          startContent={<Plus className="h-4 w-4" />}
          onPress={onAdd}
        >
          {addLabel}
        </FormButton>
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner color="primary" />
        </div>
      ) : listError ? (
        <p className="py-8 text-center text-sm text-red-600">{listError}</p>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          emptyMessage={emptyMessage}
          enableRowSelection
          getRowId={(row) => String(row.id)}
          renderBulkActions={(selected, { clearSelection }) => (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-zinc-500">
                {selected.length} selected
              </span>
              <FormButton
                appearance="light"
                className="!h-7 min-h-7 text-[11px]"
                onPress={clearSelection}
              >
                Clear
              </FormButton>
            </div>
          )}
        />
      )}
      <SideSheet
        isOpen={sheet.isOpen}
        onOpenChange={sheet.onOpenChange}
        title={sheetTitle}
        footer={(onClose) => (
          <>
            <FormButton appearance="light" onPress={onClose}>
              Cancel
            </FormButton>
            <FormButton isLoading={saving} onPress={onSave}>
              Save
            </FormButton>
          </>
        )}
      >
        <div className="flex flex-col gap-3">{children}</div>
      </SideSheet>
    </div>
  )
}

function TermsPanel() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [form, setForm] = useState({
    name: '',
    academic_year_id: '',
    starts_at: '',
    ends_at: '',
  })
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const yearsQ = useQuery({ queryKey: ['academic', 'years'], queryFn: listYears })
  const listQ = useQuery({ queryKey: ['academic', 'terms'], queryFn: () => listTerms() })
  const years = yearsQ.data?.academic_years || []
  const rows = listQ.data?.terms || []

  const saveMut = useMutation({
    mutationFn: (payload) =>
      editingId ? updateTerm(editingId, payload) : createTerm(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'terms'] })
      qc.invalidateQueries({ queryKey: ['academic', 'years'] })
      setMessage(editingId ? 'Term updated' : 'Term created')
      toastSuccess(editingId ? 'Term updated' : 'Term created')
      setError('')
      setForm({ name: '', academic_year_id: '', starts_at: '', ends_at: '' })
      setEditingId(null)
      sheet.onClose()
    },
    onError: (e) => {
      setError(e.message)
      toastError('Action failed', e.message)
    },
  })

  const deleteMut = useMutation({
    mutationFn: deleteTerm,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'terms'] })
      qc.invalidateQueries({ queryKey: ['academic', 'years'] })
      setMessage('Term deleted')
      toastSuccess('Term deleted')
    },
    onError: (e) => {
      setError(e.message)
      toastError('Action failed', e.message)
    },
  })

  const openCreate = () => {
    const current = years.find((y) => y.is_current) || years[0]
    setEditingId(null)
    setForm({
      name: '',
      academic_year_id: current ? String(current.id) : '',
      starts_at: '',
      ends_at: '',
    })
    setError('')
    sheet.onOpen()
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    setForm({
      name: row.name || '',
      academic_year_id: row.academic_year_id ? String(row.academic_year_id) : '',
      starts_at: String(row.starts_at || '').slice(0, 10),
      ends_at: String(row.ends_at || '').slice(0, 10),
    })
    setError('')
    sheet.onOpen()
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Term',
        size: 120,
        Cell: ({ row }) => (
          <span className="font-medium text-zinc-900">{row.original.name}</span>
        ),
      },
      {
        id: 'year',
        header: 'Academic year',
        size: 140,
        accessorFn: (r) => r.academic_year?.name || r.academic_year_id || '—',
      },
      {
        id: 'period',
        header: 'Period',
        size: 200,
        accessorFn: (r) =>
          `${String(r.starts_at || '').slice(0, 10) || '—'} → ${String(r.ends_at || '').slice(0, 10) || '—'}`,
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
                { key: 'edit', label: 'Edit', onPress: () => openEdit(r) },
                {
                  key: 'delete',
                  label: 'Delete',
                  color: 'danger',
                  onPress: () => {
                    if (window.confirm(`Delete term “${r.name}”?`)) {
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

  return (
    <CatalogShell
      error={error}
      message={message}
      onAdd={openCreate}
      addLabel="Add term"
      loading={listQ.isLoading}
      listError={listQ.error?.message}
      columns={columns}
      data={rows}
      emptyMessage="No terms yet"
      sheet={sheet}
      sheetTitle={editingId ? 'Edit term' : 'New term'}
      saving={saveMut.isPending}
      onSave={() => {
        if (!form.name.trim() || !form.academic_year_id) {
          setError('Name and academic year are required')
          return
        }
        saveMut.mutate({
          name: form.name.trim(),
          academic_year_id: Number(form.academic_year_id),
          starts_at: form.starts_at || null,
          ends_at: form.ends_at || null,
        })
      }}
    >
      <FormField label="Name" required>
        <FormInput
          placeholder="Term 1"
          value={form.name}
          onValueChange={(v) => setForm((f) => ({ ...f, name: v }))}
        />
      </FormField>
      <FormField label="Academic year" required>
        <FormSelect
          label="Year"
          placeholder="Select year"
          value={form.academic_year_id}
          onChange={(v) => setForm((f) => ({ ...f, academic_year_id: v }))}
          options={years.map((y) => ({
            value: String(y.id),
            label: `${y.name}${y.is_current ? ' (current)' : ''}`,
          }))}
        />
      </FormField>
      <FormField label="Starts">
        <FormInput
          type="date"
          value={form.starts_at}
          onValueChange={(v) => setForm((f) => ({ ...f, starts_at: v }))}
        />
      </FormField>
      <FormField label="Ends">
        <FormInput
          type="date"
          value={form.ends_at}
          onValueChange={(v) => setForm((f) => ({ ...f, ends_at: v }))}
        />
      </FormField>
    </CatalogShell>
  )
}

function SchoolStagesSettings() {
  const qc = useQueryClient()
  const profileQ = useQuery({
    queryKey: ['school', 'profile'],
    queryFn: getSchoolProfile,
  })
  const school = profileQ.data?.school
  const [stages, setStages] = useState([])
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    const s = school?.education_stages
    if (Array.isArray(s)) {
      setStages(s)
      setDirty(false)
    }
  }, [school?.education_stages, school?.id])

  const saveMut = useMutation({
    mutationFn: () => updateSchoolProfile({ education_stages: stages }),
    onSuccess: (data) => {
      qc.setQueryData(['school', 'profile'], data)
      qc.invalidateQueries({ queryKey: ['school', 'profile'] })
      qc.invalidateQueries({ queryKey: ['academic', 'subjects'] })
      qc.invalidateQueries({ queryKey: ['academic', 'subject-combinations'] })
      const session = qc.getQueryData(['auth', 'session'])
      if (session?.access_token && data?.school) {
        const patch = {
          education_stages: data.school.education_stages || stages,
          education_level: data.school.education_level || null,
        }
        const next = {
          ...session,
          user: {
            ...session.user,
            school: { ...(session.user?.school || {}), ...patch },
          },
          school: { ...(session.school || {}), ...patch },
        }
        writeSession(next)
        qc.setQueryData(['auth', 'session'], next)
      }
      setDirty(false)
      toastSuccess(
        'Education levels saved',
        formatStagesSummary(data?.school?.education_stages || stages),
      )
    },
    onError: (e) => toastError('Could not save levels', e.message),
  })

  if (profileQ.isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner color="primary" size="sm" />
      </div>
    )
  }

  return (
    <div className="rounded-md border border-zinc-200 bg-white p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-zinc-900">
          Levels this school operates
        </h3>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          Multi-select TAMISEMI stages. Subjects, combinations, and related
          Academic content only show for enabled levels.
        </p>
      </div>
      <EducationStagesPicker
        required
        value={stages}
        onChange={(next) => {
          setStages(next)
          setDirty(true)
        }}
        hint={null}
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-zinc-400">
          Current: {formatStagesSummary(stages)}
        </p>
        <FormButton
          isDisabled={!dirty || !stages.length}
          isLoading={saveMut.isPending}
          onPress={() => {
            if (!stages.length) {
              toastError('Select at least one level')
              return
            }
            saveMut.mutate()
          }}
        >
          Save school levels
        </FormButton>
      </div>
    </div>
  )
}

function LevelsPanel() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [form, setForm] = useState({
    name: '',
    code: '',
    sort_order: '0',
    description: '',
    is_active: true,
  })
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const listQ = useQuery({ queryKey: ['academic', 'levels'], queryFn: listLevels })
  const rows = listQ.data?.levels || []

  const saveMut = useMutation({
    mutationFn: (payload) =>
      editingId ? updateLevel(editingId, payload) : createLevel(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'levels'] })
      setMessage(editingId ? 'Level updated' : 'Level created')
      toastSuccess(editingId ? 'Level updated' : 'Level created')
      setError('')
      setForm({ name: '', code: '', sort_order: '0', description: '', is_active: true })
      setEditingId(null)
      sheet.onClose()
    },
    onError: (e) => {
      setError(e.message)
      toastError('Action failed', e.message)
    },
  })

  const deleteMut = useMutation({
    mutationFn: deleteLevel,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['academic', 'levels'] })
      setMessage(data?.deactivated ? 'Level deactivated (has classes)' : 'Level deleted')
      toastSuccess(data?.deactivated ? 'Level deactivated (has classes)' : 'Level deleted')
    },
    onError: (e) => {
      setError(e.message)
      toastError('Action failed', e.message)
    },
  })

  const openCreate = () => {
    setEditingId(null)
    setForm({ name: '', code: '', sort_order: '0', description: '', is_active: true })
    setError('')
    sheet.onOpen()
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    setForm({
      name: row.name || '',
      code: row.code || '',
      sort_order: String(row.sort_order ?? 0),
      description: row.description || '',
      is_active: row.is_active !== false,
    })
    setError('')
    sheet.onOpen()
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Level',
        size: 160,
        Cell: ({ row }) => (
          <div>
            <div className="font-medium text-zinc-900">{row.original.name}</div>
            <div className="font-mono text-[10px] text-zinc-400">
              {row.original.code || '—'}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'sort_order',
        header: 'Order',
        size: 70,
      },
      {
        accessorKey: 'classrooms_count',
        header: 'Classes',
        size: 80,
        Cell: ({ cell }) => cell.getValue() ?? 0,
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
                { key: 'edit', label: 'Edit', onPress: () => openEdit(r) },
                {
                  key: 'toggle',
                  label: r.is_active ? 'Deactivate' : 'Activate',
                  color: r.is_active ? 'warning' : 'default',
                  onPress: () =>
                    updateLevel(r.id, { is_active: !r.is_active }).then(() =>
                      qc.invalidateQueries({ queryKey: ['academic', 'levels'] }),
                    ),
                },
                {
                  key: 'delete',
                  label: 'Delete',
                  color: 'danger',
                  onPress: () => {
                    if (window.confirm(`Delete level “${r.name}”?`)) {
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

  return (
    <div className="flex flex-col gap-4">
      <SchoolStagesSettings />
      <CatalogShell
      error={error}
      message={message}
      onAdd={openCreate}
      addLabel="Add level"
      loading={listQ.isLoading}
      listError={listQ.error?.message}
      columns={columns}
      data={rows}
      emptyMessage="No education levels yet"
      sheet={sheet}
      sheetTitle={editingId ? 'Edit level' : 'New education level'}
      saving={saveMut.isPending}
      onSave={() => {
        if (!form.name.trim()) {
          setError('Name is required')
          return
        }
        saveMut.mutate({
          name: form.name.trim(),
          code: form.code.trim() || null,
          sort_order: Number(form.sort_order) || 0,
          description: form.description.trim() || null,
          is_active: Boolean(form.is_active),
        })
      }}
    >
      <FormField label="Name" required>
        <FormInput
          placeholder="Ordinary Level"
          value={form.name}
          onValueChange={(v) => setForm((f) => ({ ...f, name: v }))}
        />
      </FormField>
      <FormField label="Code">
        <FormInput
          placeholder="O"
          value={form.code}
          onValueChange={(v) => setForm((f) => ({ ...f, code: v }))}
        />
      </FormField>
      <FormField label="Sort order">
        <FormInput
          type="number"
          value={form.sort_order}
          onValueChange={(v) => setForm((f) => ({ ...f, sort_order: v }))}
        />
      </FormField>
      <FormField label="Description">
        <FormTextarea
          minRows={2}
          value={form.description}
          onValueChange={(v) => setForm((f) => ({ ...f, description: v }))}
        />
      </FormField>
      <Switch
        size="sm"
        isSelected={form.is_active}
        onValueChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
      >
        Active
      </Switch>
    </CatalogShell>
    </div>
  )
}

function StreamsPanel() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    is_active: true,
  })
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const listQ = useQuery({ queryKey: ['academic', 'streams'], queryFn: listStreams })
  const rows = listQ.data?.streams || []

  const saveMut = useMutation({
    mutationFn: (payload) =>
      editingId ? updateStream(editingId, payload) : createStream(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'streams'] })
      setMessage(editingId ? 'Stream updated' : 'Stream created')
      toastSuccess(editingId ? 'Stream updated' : 'Stream created')
      setError('')
      setForm({ name: '', code: '', description: '', is_active: true })
      setEditingId(null)
      sheet.onClose()
    },
    onError: (e) => {
      setError(e.message)
      toastError('Action failed', e.message)
    },
  })

  const deleteMut = useMutation({
    mutationFn: deleteStream,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['academic', 'streams'] })
      setMessage(data?.deactivated ? 'Stream deactivated (has classes)' : 'Stream deleted')
      toastSuccess(data?.deactivated ? 'Stream deactivated (has classes)' : 'Stream deleted')
    },
    onError: (e) => {
      setError(e.message)
      toastError('Action failed', e.message)
    },
  })

  const openCreate = () => {
    setEditingId(null)
    setForm({ name: '', code: '', description: '', is_active: true })
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

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Stream',
        size: 160,
        Cell: ({ row }) => (
          <div>
            <div className="font-medium text-zinc-900">{row.original.name}</div>
            <div className="font-mono text-[10px] text-zinc-400">
              {row.original.code || '—'}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'classrooms_count',
        header: 'Classes',
        size: 80,
        Cell: ({ cell }) => cell.getValue() ?? 0,
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
                { key: 'edit', label: 'Edit', onPress: () => openEdit(r) },
                {
                  key: 'toggle',
                  label: r.is_active ? 'Deactivate' : 'Activate',
                  color: r.is_active ? 'warning' : 'default',
                  onPress: () =>
                    updateStream(r.id, { is_active: !r.is_active }).then(() =>
                      qc.invalidateQueries({ queryKey: ['academic', 'streams'] }),
                    ),
                },
                {
                  key: 'delete',
                  label: 'Delete',
                  color: 'danger',
                  onPress: () => {
                    if (window.confirm(`Delete stream “${r.name}”?`)) {
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

  return (
    <CatalogShell
      error={error}
      message={message}
      onAdd={openCreate}
      addLabel="Add stream"
      loading={listQ.isLoading}
      listError={listQ.error?.message}
      columns={columns}
      data={rows}
      emptyMessage="No streams yet"
      sheet={sheet}
      sheetTitle={editingId ? 'Edit stream' : 'New stream'}
      saving={saveMut.isPending}
      onSave={() => {
        if (!form.name.trim()) {
          setError('Name is required')
          return
        }
        saveMut.mutate({
          name: form.name.trim(),
          code: form.code.trim() || null,
          description: form.description.trim() || null,
          is_active: Boolean(form.is_active),
        })
      }}
    >
      <FormField label="Name" required>
        <FormInput
          placeholder="Stream A"
          value={form.name}
          onValueChange={(v) => setForm((f) => ({ ...f, name: v }))}
        />
      </FormField>
      <FormField label="Code">
        <FormInput
          placeholder="A"
          value={form.code}
          onValueChange={(v) => setForm((f) => ({ ...f, code: v }))}
        />
      </FormField>
      <FormField label="Description">
        <FormTextarea
          minRows={2}
          value={form.description}
          onValueChange={(v) => setForm((f) => ({ ...f, description: v }))}
        />
      </FormField>
      <Switch
        size="sm"
        isSelected={form.is_active}
        onValueChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
      >
        Active
      </Switch>
    </CatalogShell>
  )
}

function ClassesPanel() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [form, setForm] = useState({
    name: '',
    code: '',
    education_level_id: '',
    stream_id: '',
    capacity: '',
    is_active: true,
  })
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const listQ = useQuery({ queryKey: ['academic', 'classes'], queryFn: listClasses })
  const levelsQ = useQuery({ queryKey: ['academic', 'levels'], queryFn: listLevels })
  const streamsQ = useQuery({ queryKey: ['academic', 'streams'], queryFn: listStreams })

  const rows = listQ.data?.classes || []
  const levels = levelsQ.data?.levels || []
  const streams = streamsQ.data?.streams || []

  const saveMut = useMutation({
    mutationFn: (payload) =>
      editingId ? updateClass(editingId, payload) : createClass(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'classes'] })
      setMessage(editingId ? 'Class updated' : 'Class created')
      toastSuccess(editingId ? 'Class updated' : 'Class created')
      setError('')
      setForm({
        name: '',
        code: '',
        education_level_id: '',
        stream_id: '',
        capacity: '',
        is_active: true,
      })
      setEditingId(null)
      sheet.onClose()
    },
    onError: (e) => {
      setError(e.message)
      toastError('Action failed', e.message)
    },
  })

  const deleteMut = useMutation({
    mutationFn: deleteClass,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['academic', 'classes'] })
      const msg = data?.deactivated
        ? 'Class deactivated (has enrollments)'
        : 'Class deleted'
      setMessage(msg)
      toastSuccess(msg)
    },
    onError: (e) => {
      setError(e.message)
      toastError('Action failed', e.message)
    },
  })

  const openCreate = () => {
    setEditingId(null)
    setForm({
      name: '',
      code: '',
      education_level_id: '',
      stream_id: '',
      capacity: '',
      is_active: true,
    })
    setError('')
    sheet.onOpen()
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    setForm({
      name: row.name || '',
      code: row.code || '',
      education_level_id: row.education_level_id
        ? String(row.education_level_id)
        : '',
      stream_id: row.stream_id ? String(row.stream_id) : '',
      capacity: row.capacity != null ? String(row.capacity) : '',
      is_active: row.is_active !== false,
    })
    setError('')
    sheet.onOpen()
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Class',
        size: 160,
        Cell: ({ row }) => (
          <div>
            <div className="font-medium text-zinc-900">{row.original.name}</div>
            <div className="font-mono text-[10px] text-zinc-400">
              {row.original.code || '—'}
            </div>
          </div>
        ),
      },
      {
        id: 'level',
        header: 'Level',
        size: 120,
        accessorFn: (r) => r.education_level?.name || '—',
      },
      {
        id: 'stream',
        header: 'Stream',
        size: 100,
        accessorFn: (r) => r.stream?.name || '—',
      },
      {
        accessorKey: 'active_students_count',
        header: 'Students',
        size: 80,
        Cell: ({ cell }) => cell.getValue() ?? 0,
      },
      {
        accessorKey: 'capacity',
        header: 'Capacity',
        size: 80,
        Cell: ({ cell }) => cell.getValue() ?? '—',
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        size: 90,
        Cell: ({ cell }) => (
          <Chip
            size="sm"
            variant="flat"
            color={cell.getValue() !== false ? 'success' : 'default'}
            className="h-5 text-[10px]"
          >
            {cell.getValue() !== false ? 'Active' : 'Inactive'}
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
                { key: 'edit', label: 'Edit', onPress: () => openEdit(r) },
                {
                  key: 'delete',
                  label: 'Delete',
                  color: 'danger',
                  onPress: () => {
                    if (window.confirm(`Delete class “${r.name}”?`)) {
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

  return (
    <CatalogShell
      error={error}
      message={message}
      onAdd={openCreate}
      addLabel="Add class"
      loading={listQ.isLoading}
      listError={listQ.error?.message}
      columns={columns}
      data={rows}
      emptyMessage="No classes yet"
      sheet={sheet}
      sheetTitle={editingId ? 'Edit class' : 'New class'}
      saving={saveMut.isPending}
      onSave={() => {
        if (!form.name.trim()) {
          setError('Class name is required')
          return
        }
        saveMut.mutate({
          name: form.name.trim(),
          code: form.code.trim() || null,
          education_level_id: form.education_level_id
            ? Number(form.education_level_id)
            : null,
          stream_id: form.stream_id ? Number(form.stream_id) : null,
          capacity: form.capacity ? Number(form.capacity) : null,
          is_active: Boolean(form.is_active),
        })
      }}
    >
      <FormField label="Class name" required>
        <FormInput
          placeholder="Form 1 A"
          value={form.name}
          onValueChange={(v) => setForm((f) => ({ ...f, name: v }))}
        />
      </FormField>
      <FormField label="Code">
        <FormInput
          placeholder="F1A"
          value={form.code}
          onValueChange={(v) => setForm((f) => ({ ...f, code: v }))}
        />
      </FormField>
      <FormField label="Education level">
        <FormSelect
          label="Level"
          placeholder="Optional"
          value={form.education_level_id}
          onChange={(v) => setForm((f) => ({ ...f, education_level_id: v }))}
          options={levels
            .filter((l) => l.is_active !== false)
            .map((l) => ({ value: String(l.id), label: l.name }))}
        />
      </FormField>
      <FormField label="Stream">
        <FormSelect
          label="Stream"
          placeholder="Optional"
          value={form.stream_id}
          onChange={(v) => setForm((f) => ({ ...f, stream_id: v }))}
          options={streams
            .filter((s) => s.is_active !== false)
            .map((s) => ({ value: String(s.id), label: s.name }))}
        />
      </FormField>
      <FormField label="Capacity">
        <FormInput
          type="number"
          placeholder="45"
          value={form.capacity}
          onValueChange={(v) => setForm((f) => ({ ...f, capacity: v }))}
        />
      </FormField>
      <Switch
        size="sm"
        isSelected={form.is_active}
        onValueChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
      >
        Active
      </Switch>
      {!levels.length && (
        <p className="text-[11px] text-amber-700">
          Tip: create Levels first under Academic setup → Levels.
        </p>
      )}
    </CatalogShell>
  )
}

function OverviewPanel() {
  const yearsQ = useQuery({ queryKey: ['academic', 'years'], queryFn: listYears })
  const termsQ = useQuery({ queryKey: ['academic', 'terms'], queryFn: () => listTerms() })
  const levelsQ = useQuery({ queryKey: ['academic', 'levels'], queryFn: listLevels })
  const streamsQ = useQuery({ queryKey: ['academic', 'streams'], queryFn: listStreams })
  const classesQ = useQuery({ queryKey: ['academic', 'classes'], queryFn: listClasses })
  const subjectsQ = useQuery({
    queryKey: ['academic', 'subjects', 'overview'],
    queryFn: () => listSubjects(),
  })

  const stats = [
    {
      label: 'Academic years',
      value: yearsQ.data?.academic_years?.length ?? '—',
      href: '/academic/years',
    },
    {
      label: 'Terms',
      value: termsQ.data?.terms?.length ?? '—',
      href: '/academic/terms',
    },
    {
      label: 'Levels',
      value: levelsQ.data?.levels?.length ?? '—',
      href: '/academic/levels',
    },
    {
      label: 'Subjects',
      value: subjectsQ.data?.subjects?.length ?? '—',
      href: '/academic/subjects',
    },
    {
      label: 'Streams',
      value: streamsQ.data?.streams?.length ?? '—',
      href: '/academic/streams',
    },
    {
      label: 'Classes',
      value: classesQ.data?.classes?.length ?? '—',
      href: '/academic/classes',
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((s) => (
        <Link
          key={s.label}
          to={s.href}
          className="rounded-md border border-zinc-200 bg-white px-3 py-3 transition-colors hover:border-[#0B3D2E]/40"
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            {s.label}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">
            {s.value}
          </p>
        </Link>
      ))}
    </div>
  )
}

function AcademicSetup() {
  const location = useLocation()
  const { school, session } = useAuth()
  const schoolStages =
    school?.education_stages ||
    session?.school?.education_stages ||
    session?.user?.school?.education_stages ||
    []

  const meta = sectionMeta[location.pathname] || {
    title: 'Academic Setup',
    description: 'Configure academic structure',
    section: 'placeholder',
  }

  // Primary / pre-primary only schools: Combinations is not applicable
  if (
    meta.section === 'subject-combinations' &&
    schoolStages.length > 0 &&
    !schoolOffersSubjectCombinations(schoolStages)
  ) {
    return <Navigate to="/academic/subjects" replace />
  }

  let body = null
  switch (meta.section) {
    case 'overview':
      body = <OverviewPanel />
      break
    case 'years':
      body = <YearsPanel />
      break
    case 'terms':
      body = <TermsPanel />
      break
    case 'levels':
      body = <LevelsPanel />
      break
    case 'streams':
      body = <StreamsPanel />
      break
    case 'classes':
      body = <ClassesPanel />
      break
    case 'subjects':
      body = <SubjectsPanel />
      break
    case 'subject-categories':
      body = <CategoriesPanel />
      break
    case 'subject-combinations':
      body = <CombinationsPanel />
      break
    case 'class-assignment':
      body = <ClassAssignmentPanel />
      break
    case 'teacher-allocation':
      body = <TeacherAllocationPanel />
      break
    default:
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
            { label: 'Academic', href: '/academic' },
            { label: meta.title },
          ]}
          description={meta.description}
        />
        {body}
      </div>
    </DashboardLayout>
  )
}

export default AcademicSetup
