import { useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardBody, Chip, Spinner, Switch, useDisclosure } from '@heroui/react'
import {
  Award,
  BookMarked,
  BookOpen,
  Bookmark,
  CalendarDays,
  CalendarRange,
  Layers,
  LayoutGrid,
  Plus,
  School,
  Shapes,
  UsersRound,
} from 'lucide-react'
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
import { CurriculumPanel, GradingPanel } from './GradingCurriculum.jsx'

const sectionMeta = {
  '/academic': {
    title: 'Academic Setup',
    description: 'Years, terms, levels, streams, classes, curriculum and grading',
    section: 'overview',
  },
  '/academic/curriculum': {
    title: 'Curriculum',
    description:
      'TAMISEMI curriculum frameworks: subjects and topics by education stage',
    section: 'curriculum',
  },
  '/academic/grading': {
    title: 'Grading System',
    description:
      'NECTA / primary grade bands, pass marks and grade points for exams & report cards',
    section: 'grading',
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
      {listError ? (
        <p className="py-8 text-center text-sm text-red-600">{listError}</p>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          isLoading={loading}
          emptyMessage={emptyMessage}
          toolbarActions={
            <FormButton className="h-8 min-h-8" startContent={<Plus className="h-3.5 w-3.5" />} onPress={onAdd}>
              {addLabel}
            </FormButton>
          }
          enableRowSelection={false}
          getRowId={(row) => String(row.id)}
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

function AcademicStatCard({ label, value, hint, icon: Icon, tone, onPress }) {
  return (
    <Card
      isPressable={Boolean(onPress)}
      className="border border-slate-200 shadow-none transition-colors hover:border-[#0B3D2E]/30"
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

function OverviewPanel() {
  const navigate = useNavigate()
  const { school, session } = useAuth()
  const schoolStages =
    school?.education_stages ||
    session?.school?.education_stages ||
    session?.user?.school?.education_stages ||
    []
  const showCombinations =
    schoolStages.length === 0 || schoolOffersSubjectCombinations(schoolStages)

  const yearsQ = useQuery({
    queryKey: ['academic', 'years'],
    queryFn: listYears,
    staleTime: 30_000,
  })
  const termsQ = useQuery({
    queryKey: ['academic', 'terms'],
    queryFn: () => listTerms(),
    staleTime: 30_000,
  })
  const levelsQ = useQuery({
    queryKey: ['academic', 'levels'],
    queryFn: listLevels,
    staleTime: 30_000,
  })
  const streamsQ = useQuery({
    queryKey: ['academic', 'streams'],
    queryFn: listStreams,
    staleTime: 30_000,
  })
  const classesQ = useQuery({
    queryKey: ['academic', 'classes'],
    queryFn: listClasses,
    staleTime: 30_000,
  })
  const subjectsQ = useQuery({
    queryKey: ['academic', 'subjects', 'overview'],
    queryFn: () => listSubjects(),
    staleTime: 30_000,
  })

  const loading =
    yearsQ.isLoading ||
    termsQ.isLoading ||
    levelsQ.isLoading ||
    classesQ.isLoading ||
    subjectsQ.isLoading

  const stats = [
    {
      label: 'Academic years',
      value: loading ? '…' : String(yearsQ.data?.academic_years?.length ?? 0),
      hint: 'Configured years',
      icon: CalendarRange,
      tone: 'bg-emerald-50 text-emerald-700',
      path: '/academic/years',
    },
    {
      label: 'Terms',
      value: loading ? '…' : String(termsQ.data?.terms?.length ?? 0),
      hint: 'Terms / semesters',
      icon: CalendarDays,
      tone: 'bg-sky-50 text-sky-700',
      path: '/academic/terms',
    },
    {
      label: 'Classes',
      value: loading ? '…' : String(classesQ.data?.classes?.length ?? 0),
      hint: 'Active classrooms',
      icon: School,
      tone: 'bg-violet-50 text-violet-700',
      path: '/academic/classes',
    },
    {
      label: 'Subjects',
      value: loading ? '…' : String(subjectsQ.data?.subjects?.length ?? 0),
      hint: 'Curriculum subjects',
      icon: BookOpen,
      tone: 'bg-amber-50 text-amber-800',
      path: '/academic/subjects',
    },
    {
      label: 'Levels',
      value: loading ? '…' : String(levelsQ.data?.levels?.length ?? 0),
      hint: 'Education levels',
      icon: Layers,
      tone: 'bg-rose-50 text-rose-700',
      path: '/academic/levels',
    },
  ]

  const modules = [
    {
      t: 'Curriculum',
      d: 'TAMISEMI frameworks, subjects and topics by stage',
      p: '/academic/curriculum',
      icon: BookMarked,
    },
    {
      t: 'Grading System',
      d: 'NECTA / primary grade bands for exams & report cards',
      p: '/academic/grading',
      icon: Award,
    },
    {
      t: 'Academic Years',
      d: 'Define school years and mark the current year',
      p: '/academic/years',
      icon: CalendarRange,
    },
    {
      t: 'Terms / Semesters',
      d: 'Terms linked to an academic year',
      p: '/academic/terms',
      icon: CalendarDays,
    },
    {
      t: 'Education Levels',
      d: 'TAMISEMI stages and class levels',
      p: '/academic/levels',
      icon: Layers,
    },
    {
      t: 'Streams',
      d: `Class streams (${streamsQ.data?.streams?.length ?? 0} configured)`,
      p: '/academic/streams',
      icon: Shapes,
    },
    {
      t: 'Classes',
      d: 'Classrooms with optional level and stream',
      p: '/academic/classes',
      icon: School,
    },
    {
      t: 'All Subjects',
      d: 'Primary and secondary curriculum subjects',
      p: '/academic/subjects',
      icon: BookOpen,
    },
    {
      t: 'Subject Categories',
      d: 'Group subjects (Languages, Sciences…)',
      p: '/academic/subjects/categories',
      icon: Bookmark,
    },
    ...(showCombinations
      ? [
          {
            t: 'Subject Combinations',
            d: 'NECTA packages (PCM, PCB, HGL…)',
            p: '/academic/subjects/combinations',
            icon: LayoutGrid,
          },
        ]
      : []),
    {
      t: 'Class Assignment',
      d: 'Assign subjects to each class',
      p: '/academic/subjects/class-assignment',
      icon: LayoutGrid,
    },
    {
      t: 'Teacher Allocation',
      d: 'Allocate teachers to subjects and classes',
      p: '/academic/subjects/teacher-allocation',
      icon: UsersRound,
    },
  ]

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">At a glance</h2>
            <p className="text-xs text-slate-500">
              Live academic structure statistics
            </p>
          </div>
          {(yearsQ.isFetching || classesQ.isFetching || subjectsQ.isFetching) &&
          !loading ? (
            <Spinner size="sm" color="success" />
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
          {stats.map((stat) => (
            <AcademicStatCard
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
      </div>

      <div>
        <div className="mb-2">
          <h2 className="text-sm font-semibold text-slate-900">Modules</h2>
          <p className="text-xs text-slate-500">
            Jump into years, classes, subjects and allocations
          </p>
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
    case 'curriculum':
      body = <CurriculumPanel />
      break
    case 'grading':
      body = <GradingPanel />
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
