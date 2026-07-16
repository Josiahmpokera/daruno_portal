import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Chip, Spinner, Switch, useDisclosure } from '@heroui/react'
import { Plus } from 'lucide-react'
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
  listSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  listSubjectCategories,
  createSubjectCategory,
  updateSubjectCategory,
  deleteSubjectCategory,
  listSubjectCombinations,
  createSubjectCombination,
  updateSubjectCombination,
  deleteSubjectCombination,
  listClassSubjects,
  createClassSubject,
  updateClassSubject,
  deleteClassSubject,
  listTeacherAllocations,
  createTeacherAllocation,
  updateTeacherAllocation,
  deleteTeacherAllocation,
  listClasses,
  listYears,
  listTerms,
  listStaff,
} from '../../api/domain.js'
import { useAuth } from '../../auth'
import {
  stageLabel,
  stagesForSchool,
  formatStagesSummary,
} from '../../config/educationStages.js'

/** Stages for form select (school-filtered + optional "All stages") */
function subjectStageOptions(schoolStages) {
  const base = stagesForSchool(schoolStages).map((s) => ({
    value: s.value,
    label: s.label,
  }))
  return [...base, { value: 'all', label: 'All stages (shared)' }]
}

function useSchoolStages() {
  const { session, school } = useAuth()
  return (
    school?.education_stages ||
    session?.school?.education_stages ||
    session?.user?.school?.education_stages ||
    []
  )
}

function PanelShell({
  error,
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
  toolbar,
}) {
  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
        {onAdd ? (
          <FormButton startContent={<Plus className="h-4 w-4" />} onPress={onAdd}>
            {addLabel}
          </FormButton>
        ) : null}
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
                {selected.length} row{selected.length === 1 ? '' : 's'}
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
      {sheet ? (
        <SideSheet
          isOpen={sheet.isOpen}
          onOpenChange={sheet.onOpenChange}
          title={sheetTitle}
          size="lg"
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
      ) : null}
    </div>
  )
}

// ─── Categories ───────────────────────────────────────────────────

export function CategoriesPanel() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    sort_order: '0',
    is_active: true,
  })
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')

  const listQ = useQuery({
    queryKey: ['academic', 'subject-categories'],
    queryFn: listSubjectCategories,
  })
  const rows = listQ.data?.categories || []

  const saveMut = useMutation({
    mutationFn: (payload) =>
      editingId
        ? updateSubjectCategory(editingId, payload)
        : createSubjectCategory(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'subject-categories'] })
      toastSuccess(editingId ? 'Category updated' : 'Category created')
      setEditingId(null)
      setForm({ name: '', code: '', description: '', sort_order: '0', is_active: true })
      sheet.onClose()
      setError('')
    },
    onError: (e) => {
      setError(e.message)
      toastError('Could not save category', e.message)
    },
  })

  const deleteMut = useMutation({
    mutationFn: deleteSubjectCategory,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['academic', 'subject-categories'] })
      toastSuccess(
        data?.deactivated
          ? 'Category deactivated (still has subjects)'
          : 'Category deleted',
      )
    },
    onError: (e) => toastError('Could not delete category', e.message),
  })

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Category',
        size: 180,
        Cell: ({ row }) => (
          <div>
            <div className="text-[12px] font-medium text-zinc-900">
              {row.original.name}
            </div>
            <div className="font-mono text-[10px] text-zinc-400">
              {row.original.code || '—'}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'subjects_count',
        header: 'Subjects',
        size: 90,
        Cell: ({ cell }) => (
          <span className="tabular-nums">{cell.getValue() ?? 0}</span>
        ),
      },
      {
        accessorKey: 'sort_order',
        header: 'Order',
        size: 70,
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
                  onPress: () => {
                    setEditingId(r.id)
                    setForm({
                      name: r.name || '',
                      code: r.code || '',
                      description: r.description || '',
                      sort_order: String(r.sort_order ?? 0),
                      is_active: r.is_active !== false,
                    })
                    setError('')
                    sheet.onOpen()
                  },
                },
                {
                  key: 'delete',
                  label: 'Delete',
                  color: 'danger',
                  onPress: () => {
                    if (window.confirm(`Delete category “${r.name}”?`)) {
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
    <PanelShell
      error={error}
      onAdd={() => {
        setEditingId(null)
        setForm({
          name: '',
          code: '',
          description: '',
          sort_order: '0',
          is_active: true,
        })
        setError('')
        sheet.onOpen()
      }}
      addLabel="Add category"
      loading={listQ.isLoading}
      listError={listQ.error?.message}
      columns={columns}
      data={rows}
      emptyMessage="No subject categories yet. Seed TAMISEMI defaults or add one."
      sheet={sheet}
      sheetTitle={editingId ? 'Edit category' : 'New category'}
      saving={saveMut.isPending}
      onSave={() => {
        if (!form.name.trim()) {
          setError('Name is required')
          return
        }
        saveMut.mutate({
          name: form.name.trim(),
          code: form.code.trim() || undefined,
          description: form.description.trim() || undefined,
          sort_order: Number(form.sort_order || 0),
          is_active: Boolean(form.is_active),
        })
      }}
    >
      <FormField label="Name" required>
        <FormInput
          placeholder="e.g. Sciences"
          value={form.name}
          onValueChange={(v) => setForm((f) => ({ ...f, name: v }))}
        />
      </FormField>
      <FormField label="Code">
        <FormInput
          placeholder="SCI"
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
    </PanelShell>
  )
}

// ─── All subjects ─────────────────────────────────────────────────

const emptySubject = () => ({
  name: '',
  short_name: '',
  code: '',
  necta_code: '',
  subject_category_id: '',
  education_stage: 'primary',
  is_core: true,
  is_compulsory: true,
  is_active: true,
  weekly_periods: '',
  sort_order: '0',
  description: '',
})

export function SubjectsPanel() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const schoolStages = useSchoolStages()
  const stageOptions = subjectStageOptions(schoolStages)
  const [form, setForm] = useState(() => ({
    ...emptySubject(),
    education_stage: schoolStages[0] || 'primary',
  }))
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [q, setQ] = useState('')

  const catsQ = useQuery({
    queryKey: ['academic', 'subject-categories'],
    queryFn: listSubjectCategories,
  })
  const listQ = useQuery({
    queryKey: ['academic', 'subjects', stageFilter, q, schoolStages.join(',')],
    queryFn: () =>
      listSubjects({
        stage: stageFilter || undefined,
        q: q || undefined,
      }),
  })

  const categories = catsQ.data?.categories || []
  const rows = listQ.data?.subjects || []
  const offeredFromApi = listQ.data?.school_education_stages || schoolStages

  const saveMut = useMutation({
    mutationFn: (payload) =>
      editingId ? updateSubject(editingId, payload) : createSubject(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'subjects'] })
      toastSuccess(editingId ? 'Subject updated' : 'Subject created')
      setEditingId(null)
      setForm(emptySubject())
      sheet.onClose()
      setError('')
    },
    onError: (e) => {
      setError(e.message)
      toastError('Could not save subject', e.message)
    },
  })

  const deleteMut = useMutation({
    mutationFn: deleteSubject,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['academic', 'subjects'] })
      toastSuccess(
        data?.deactivated
          ? 'Subject deactivated (in use)'
          : 'Subject deleted',
      )
    },
    onError: (e) => toastError('Could not delete subject', e.message),
  })

  const openEdit = (r) => {
    setEditingId(r.id)
    setForm({
      name: r.name || '',
      short_name: r.short_name || '',
      code: r.code || '',
      necta_code: r.necta_code || '',
      subject_category_id: r.subject_category_id
        ? String(r.subject_category_id)
        : r.category?.id
          ? String(r.category.id)
          : '',
      education_stage: r.education_stage || 'all',
      is_core: r.is_core !== false,
      is_compulsory: r.is_compulsory !== false,
      is_active: r.is_active !== false,
      weekly_periods:
        r.weekly_periods != null ? String(r.weekly_periods) : '',
      sort_order: String(r.sort_order ?? 0),
      description: r.description || '',
    })
    setError('')
    sheet.onOpen()
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Subject',
        size: 200,
        Cell: ({ row }) => (
          <div>
            <div className="text-[12px] font-medium text-zinc-900">
              {row.original.name}
            </div>
            <div className="text-[10px] text-zinc-400">
              {[row.original.code, row.original.necta_code && `NECTA ${row.original.necta_code}`]
                .filter(Boolean)
                .join(' · ') || '—'}
            </div>
          </div>
        ),
      },
      {
        id: 'category',
        header: 'Category',
        size: 120,
        accessorFn: (r) => r.category?.name || '—',
      },
      {
        accessorKey: 'education_stage',
        header: 'Stage',
        size: 140,
        Cell: ({ cell }) => (
          <span className="text-[11px]">{stageLabel(cell.getValue())}</span>
        ),
      },
      {
        id: 'flags',
        header: 'Type',
        size: 120,
        Cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.is_core ? (
              <Chip size="sm" variant="flat" className="h-5 text-[10px]">
                Core
              </Chip>
            ) : null}
            {row.original.is_compulsory ? (
              <Chip size="sm" variant="flat" color="primary" className="h-5 text-[10px]">
                Compulsory
              </Chip>
            ) : (
              <Chip size="sm" variant="flat" className="h-5 text-[10px]">
                Optional
              </Chip>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'weekly_periods',
        header: 'Periods/wk',
        size: 90,
        Cell: ({ cell }) => (
          <span className="tabular-nums">{cell.getValue() ?? '—'}</span>
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
                { key: 'edit', label: 'Edit', onPress: () => openEdit(r) },
                {
                  key: 'delete',
                  label: 'Delete',
                  color: 'danger',
                  onPress: () => {
                    if (window.confirm(`Remove subject “${r.name}”?`)) {
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
    <PanelShell
      error={error}
      toolbar={
        <>
          <p className="w-full text-[11px] text-zinc-500 sm:w-auto">
            Showing stages:{' '}
            <span className="font-medium text-zinc-700">
              {formatStagesSummary(offeredFromApi)}
            </span>
            {' · '}
            <a
              href="/school-profile/levels"
              className="text-[#0B3D2E] underline-offset-2 hover:underline"
            >
              Change
            </a>
          </p>
          <FormInput
            className="w-full sm:w-48"
            placeholder="Search name / code…"
            value={q}
            onValueChange={setQ}
            isClearable
          />
          <FormSelect
            className="w-full sm:w-48"
            placeholder="All school stages"
            value={stageFilter}
            onChange={setStageFilter}
            options={stagesForSchool(offeredFromApi).map((s) => ({
              value: s.value,
              label: s.label,
            }))}
          />
        </>
      }
      onAdd={() => {
        setEditingId(null)
        setForm({
          ...emptySubject(),
          education_stage: offeredFromApi[0] || schoolStages[0] || 'primary',
        })
        setError('')
        sheet.onOpen()
      }}
      addLabel="Add subject"
      loading={listQ.isLoading}
      listError={listQ.error?.message}
      columns={columns}
      data={rows}
      emptyMessage="No subjects for your enabled education levels. Update levels under School profile or add subjects."
      sheet={sheet}
      sheetTitle={editingId ? 'Edit subject' : 'New subject'}
      saving={saveMut.isPending}
      onSave={() => {
        if (!form.name.trim()) {
          setError('Subject name is required')
          return
        }
        saveMut.mutate({
          name: form.name.trim(),
          short_name: form.short_name.trim() || undefined,
          code: form.code.trim() || undefined,
          necta_code: form.necta_code.trim() || undefined,
          subject_category_id: form.subject_category_id
            ? Number(form.subject_category_id)
            : null,
          education_stage: form.education_stage || 'all',
          is_core: Boolean(form.is_core),
          is_compulsory: Boolean(form.is_compulsory),
          is_active: Boolean(form.is_active),
          weekly_periods: form.weekly_periods
            ? Number(form.weekly_periods)
            : null,
          sort_order: Number(form.sort_order || 0),
          description: form.description.trim() || undefined,
        })
      }}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Subject name" required className="sm:col-span-2">
          <FormInput
            placeholder="e.g. Kiswahili"
            value={form.name}
            onValueChange={(v) => setForm((f) => ({ ...f, name: v }))}
          />
        </FormField>
        <FormField label="Short name">
          <FormInput
            placeholder="KIS"
            value={form.short_name}
            onValueChange={(v) => setForm((f) => ({ ...f, short_name: v }))}
          />
        </FormField>
        <FormField label="School code">
          <FormInput
            placeholder="Internal code"
            value={form.code}
            onValueChange={(v) => setForm((f) => ({ ...f, code: v }))}
          />
        </FormField>
        <FormField label="NECTA code" hint="Official exam subject code when applicable">
          <FormInput
            placeholder="e.g. 021"
            value={form.necta_code}
            onValueChange={(v) => setForm((f) => ({ ...f, necta_code: v }))}
          />
        </FormField>
        <FormField label="Category">
          <FormSelect
            label="Category"
            placeholder="Select category"
            value={form.subject_category_id}
            onChange={(v) =>
              setForm((f) => ({ ...f, subject_category_id: v }))
            }
            options={categories.map((c) => ({
              value: String(c.id),
              label: c.name,
            }))}
          />
        </FormField>
        <FormField label="Education stage" required>
          <FormSelect
            label="Stage"
            value={form.education_stage}
            onChange={(v) => setForm((f) => ({ ...f, education_stage: v }))}
            options={stageOptions}
          />
        </FormField>
        <FormField label="Periods / week">
          <FormInput
            type="number"
            value={form.weekly_periods}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, weekly_periods: v }))
            }
          />
        </FormField>
        <FormField label="Sort order">
          <FormInput
            type="number"
            value={form.sort_order}
            onValueChange={(v) => setForm((f) => ({ ...f, sort_order: v }))}
          />
        </FormField>
        <FormField label="Description" className="sm:col-span-2">
          <FormTextarea
            minRows={2}
            value={form.description}
            onValueChange={(v) => setForm((f) => ({ ...f, description: v }))}
          />
        </FormField>
      </div>
      <div className="flex flex-col gap-2">
        <Switch
          size="sm"
          isSelected={form.is_core}
          onValueChange={(v) => setForm((f) => ({ ...f, is_core: v }))}
        >
          Core subject
        </Switch>
        <Switch
          size="sm"
          isSelected={form.is_compulsory}
          onValueChange={(v) => setForm((f) => ({ ...f, is_compulsory: v }))}
        >
          Compulsory (all learners in stage)
        </Switch>
        <Switch
          size="sm"
          isSelected={form.is_active}
          onValueChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
        >
          Active
        </Switch>
      </div>
    </PanelShell>
  )
}

// ─── Combinations (A-Level / packages) ────────────────────────────

const emptyCombo = () => ({
  name: '',
  code: '',
  education_stage: 'advanced_level',
  description: '',
  is_active: true,
  subject_ids: [],
})

export function CombinationsPanel() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const schoolStages = useSchoolStages()
  const [form, setForm] = useState(emptyCombo)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')

  const listQ = useQuery({
    queryKey: ['academic', 'subject-combinations', schoolStages.join(',')],
    queryFn: listSubjectCombinations,
  })
  const subjectsQ = useQuery({
    queryKey: ['academic', 'subjects', 'for-combo'],
    queryFn: () => listSubjects({ active: true }),
  })

  const rows = listQ.data?.combinations || []
  const subjects = subjectsQ.data?.subjects || []
  const offersALevel =
    (listQ.data?.school_education_stages || schoolStages).includes(
      'advanced_level',
    )

  const saveMut = useMutation({
    mutationFn: (payload) =>
      editingId
        ? updateSubjectCombination(editingId, payload)
        : createSubjectCombination(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'subject-combinations'] })
      toastSuccess(editingId ? 'Combination updated' : 'Combination created')
      setEditingId(null)
      setForm(emptyCombo())
      sheet.onClose()
      setError('')
    },
    onError: (e) => {
      setError(e.message)
      toastError('Could not save combination', e.message)
    },
  })

  const deleteMut = useMutation({
    mutationFn: deleteSubjectCombination,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'subject-combinations'] })
      toastSuccess('Combination deleted')
    },
    onError: (e) => toastError('Could not delete combination', e.message),
  })

  const toggleSubject = (id) => {
    const sid = String(id)
    setForm((f) => {
      const has = f.subject_ids.includes(sid)
      return {
        ...f,
        subject_ids: has
          ? f.subject_ids.filter((x) => x !== sid)
          : [...f.subject_ids, sid],
      }
    })
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'code',
        header: 'Code',
        size: 80,
        Cell: ({ cell }) => (
          <span className="font-mono text-[12px] font-semibold text-[#0B3D2E]">
            {cell.getValue()}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Combination',
        size: 220,
      },
      {
        accessorKey: 'education_stage',
        header: 'Stage',
        size: 130,
        Cell: ({ cell }) => (
          <span className="text-[11px]">{stageLabel(cell.getValue())}</span>
        ),
      },
      {
        id: 'subjects',
        header: 'Subjects',
        size: 220,
        Cell: ({ row }) => (
          <span className="line-clamp-2 text-[11px] text-zinc-600">
            {(row.original.subjects || [])
              .map((s) => s.short_name || s.code || s.name)
              .join(', ') || '—'}
          </span>
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
                  onPress: () => {
                    setEditingId(r.id)
                    setForm({
                      name: r.name || '',
                      code: r.code || '',
                      education_stage: r.education_stage || 'advanced_level',
                      description: r.description || '',
                      is_active: r.is_active !== false,
                      subject_ids: (r.subject_ids || r.subjects || []).map(
                        (x) => String(typeof x === 'object' ? x.id : x),
                      ),
                    })
                    setError('')
                    sheet.onOpen()
                  },
                },
                {
                  key: 'delete',
                  label: 'Delete',
                  color: 'danger',
                  onPress: () => {
                    if (window.confirm(`Delete combination ${r.code}?`)) {
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

  const aLevelSubjects = subjects.filter(
    (s) =>
      s.education_stage === 'advanced_level' ||
      s.education_stage === 'all' ||
      s.education_stage === 'ordinary_level',
  )

  return (
    <PanelShell
      error={error}
      onAdd={() => {
        setEditingId(null)
        setForm(emptyCombo())
        setError('')
        sheet.onOpen()
      }}
      addLabel="Add combination"
      loading={listQ.isLoading}
      listError={listQ.error?.message}
      columns={columns}
      data={rows}
      emptyMessage={
        offersALevel
          ? 'No combinations yet. NECTA A-level packages (PCM, PCB, HGL…) can be seeded.'
          : 'A-level combinations are hidden because this school does not offer A-Level. Enable A-Level under School profile → Education levels.'
      }
      sheet={sheet}
      sheetTitle={editingId ? 'Edit combination' : 'New combination'}
      saving={saveMut.isPending}
      onSave={() => {
        if (!form.name.trim() || !form.code.trim()) {
          setError('Name and code are required (e.g. PCM)')
          return
        }
        if (!form.subject_ids.length) {
          setError('Select at least one principal subject')
          return
        }
        saveMut.mutate({
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          education_stage: form.education_stage,
          description: form.description.trim() || undefined,
          is_active: Boolean(form.is_active),
          subject_ids: form.subject_ids.map(Number),
        })
      }}
    >
      <p className="text-[11px] text-zinc-500">
        A-level combinations follow NECTA packaging (e.g. PCM = Physics,
        Chemistry, Mathematics). Only stages enabled for your school are shown.
      </p>
      {!offersALevel ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
          Enable <strong>A-Level (Form 5–6)</strong> in School profile if you
          need NECTA combinations.
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Code" required>
          <FormInput
            placeholder="PCM"
            value={form.code}
            onValueChange={(v) => setForm((f) => ({ ...f, code: v }))}
          />
        </FormField>
        <FormField label="Stage">
          <FormSelect
            label="Stage"
            value={form.education_stage}
            onChange={(v) => setForm((f) => ({ ...f, education_stage: v }))}
            options={subjectStageOptions(schoolStages).filter((s) =>
              ['advanced_level', 'ordinary_level', 'all'].includes(s.value),
            )}
          />
        </FormField>
        <FormField label="Name" required className="sm:col-span-2">
          <FormInput
            placeholder="Physics, Chemistry & Mathematics"
            value={form.name}
            onValueChange={(v) => setForm((f) => ({ ...f, name: v }))}
          />
        </FormField>
        <FormField label="Description" className="sm:col-span-2">
          <FormTextarea
            minRows={2}
            value={form.description}
            onValueChange={(v) => setForm((f) => ({ ...f, description: v }))}
          />
        </FormField>
      </div>
      <FormField label="Principal subjects" required>
        <div className="max-h-48 overflow-y-auto rounded-md border border-zinc-200 p-2">
          {aLevelSubjects.length === 0 ? (
            <p className="text-xs text-zinc-400">Create subjects first.</p>
          ) : (
            aLevelSubjects.map((s) => {
              const sid = String(s.id)
              const checked = form.subject_ids.includes(sid)
              return (
                <label
                  key={s.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-[12px] hover:bg-zinc-50"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSubject(s.id)}
                    className="rounded border-zinc-300"
                  />
                  <span className="font-medium">{s.name}</span>
                  <span className="text-[10px] text-zinc-400">
                    {s.code || s.short_name}
                  </span>
                </label>
              )
            })
          )}
        </div>
      </FormField>
      <Switch
        size="sm"
        isSelected={form.is_active}
        onValueChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
      >
        Active
      </Switch>
    </PanelShell>
  )
}

// ─── Class assignment ─────────────────────────────────────────────

export function ClassAssignmentPanel() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    classroom_id: '',
    academic_year_id: '',
    subject_ids: [],
    is_compulsory: true,
    periods_per_week: '',
  })
  const [yearFilter, setYearFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')

  const yearsQ = useQuery({ queryKey: ['academic', 'years'], queryFn: listYears })
  const classesQ = useQuery({
    queryKey: ['academic', 'classes'],
    queryFn: listClasses,
  })
  const subjectsQ = useQuery({
    queryKey: ['academic', 'subjects', 'active'],
    queryFn: () => listSubjects({ active: true }),
  })
  const listQ = useQuery({
    queryKey: ['academic', 'class-subjects', yearFilter, classFilter],
    queryFn: () =>
      listClassSubjects({
        academic_year_id: yearFilter || undefined,
        classroom_id: classFilter || undefined,
      }),
  })

  const years = yearsQ.data?.academic_years || []
  const classes = classesQ.data?.classes || []
  const subjects = subjectsQ.data?.subjects || []
  const rows = listQ.data?.assignments || []
  const currentYear = years.find((y) => y.is_current) || years[0]

  const saveMut = useMutation({
    mutationFn: createClassSubject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'class-subjects'] })
      toastSuccess('Subjects assigned to class')
      setForm({
        classroom_id: '',
        academic_year_id: currentYear ? String(currentYear.id) : '',
        subject_ids: [],
        is_compulsory: true,
        periods_per_week: '',
      })
      sheet.onClose()
      setError('')
    },
    onError: (e) => {
      setError(e.message)
      toastError('Could not assign subjects', e.message)
    },
  })

  const deleteMut = useMutation({
    mutationFn: deleteClassSubject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'class-subjects'] })
      toastSuccess('Assignment removed')
    },
    onError: (e) => toastError('Could not remove', e.message),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => updateClassSubject(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'class-subjects'] })
      toastSuccess('Assignment updated')
    },
    onError: (e) => toastError('Update failed', e.message),
  })

  const columns = useMemo(
    () => [
      {
        id: 'class',
        header: 'Class',
        size: 140,
        accessorFn: (r) => r.classroom?.name || '—',
      },
      {
        id: 'subject',
        header: 'Subject',
        size: 160,
        accessorFn: (r) => r.subject?.name || '—',
      },
      {
        id: 'year',
        header: 'Year',
        size: 110,
        accessorFn: (r) => r.academic_year?.name || '—',
      },
      {
        accessorKey: 'is_compulsory',
        header: 'Compulsory',
        size: 100,
        Cell: ({ cell }) => (cell.getValue() ? 'Yes' : 'Optional'),
      },
      {
        accessorKey: 'periods_per_week',
        header: 'Periods',
        size: 80,
        Cell: ({ cell }) => cell.getValue() ?? '—',
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
                  key: 'toggle',
                  label: r.is_compulsory ? 'Mark optional' : 'Mark compulsory',
                  onPress: () =>
                    updateMut.mutate({
                      id: r.id,
                      payload: { is_compulsory: !r.is_compulsory },
                    }),
                },
                {
                  key: 'delete',
                  label: 'Remove',
                  color: 'danger',
                  onPress: () => {
                    if (window.confirm('Remove this subject from the class?')) {
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

  const toggleSubject = (id) => {
    const sid = String(id)
    setForm((f) => ({
      ...f,
      subject_ids: f.subject_ids.includes(sid)
        ? f.subject_ids.filter((x) => x !== sid)
        : [...f.subject_ids, sid],
    }))
  }

  return (
    <PanelShell
      error={error}
      toolbar={
        <>
          <FormSelect
            className="w-full sm:w-40"
            placeholder="All years"
            value={yearFilter}
            onChange={setYearFilter}
            options={years.map((y) => ({
              value: String(y.id),
              label: `${y.name}${y.is_current ? ' ★' : ''}`,
            }))}
          />
          <FormSelect
            className="w-full sm:w-40"
            placeholder="All classes"
            value={classFilter}
            onChange={setClassFilter}
            options={classes.map((c) => ({
              value: String(c.id),
              label: c.name,
            }))}
          />
        </>
      }
      onAdd={() => {
        setForm({
          classroom_id: '',
          academic_year_id: currentYear ? String(currentYear.id) : '',
          subject_ids: [],
          is_compulsory: true,
          periods_per_week: '',
        })
        setError('')
        sheet.onOpen()
      }}
      addLabel="Assign subjects"
      loading={listQ.isLoading}
      listError={listQ.error?.message}
      columns={columns}
      data={rows}
      emptyMessage="No class–subject assignments yet. Assign the curriculum subjects for each class and year."
      sheet={sheet}
      sheetTitle="Assign subjects to class"
      saving={saveMut.isPending}
      onSave={() => {
        if (!form.classroom_id || !form.academic_year_id) {
          setError('Class and academic year are required')
          return
        }
        if (!form.subject_ids.length) {
          setError('Select at least one subject')
          return
        }
        saveMut.mutate({
          classroom_id: Number(form.classroom_id),
          academic_year_id: Number(form.academic_year_id),
          subject_id: Number(form.subject_ids[0]),
          subject_ids: form.subject_ids.map(Number),
          is_compulsory: Boolean(form.is_compulsory),
          periods_per_week: form.periods_per_week
            ? Number(form.periods_per_week)
            : null,
        })
      }}
    >
      <p className="text-[11px] text-zinc-500">
        Link TAMISEMI curriculum subjects to each class for the academic year
        (used for timetable, exams, and report cards).
      </p>
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
      <FormField label="Class" required>
        <FormSelect
          label="Class"
          placeholder="Select class"
          value={form.classroom_id}
          onChange={(v) => setForm((f) => ({ ...f, classroom_id: v }))}
          options={classes.map((c) => ({
            value: String(c.id),
            label: c.code ? `${c.name} (${c.code})` : c.name,
          }))}
        />
      </FormField>
      <FormField label="Periods / week (optional default)">
        <FormInput
          type="number"
          value={form.periods_per_week}
          onValueChange={(v) =>
            setForm((f) => ({ ...f, periods_per_week: v }))
          }
        />
      </FormField>
      <FormField label="Subjects" required>
        <div className="max-h-52 overflow-y-auto rounded-md border border-zinc-200 p-2">
          {subjects.map((s) => {
            const sid = String(s.id)
            return (
              <label
                key={s.id}
                className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-[12px] hover:bg-zinc-50"
              >
                <input
                  type="checkbox"
                  checked={form.subject_ids.includes(sid)}
                  onChange={() => toggleSubject(s.id)}
                  className="rounded border-zinc-300"
                />
                <span>{s.name}</span>
                <span className="text-[10px] text-zinc-400">
                  {stageLabel(s.education_stage)}
                </span>
              </label>
            )
          })}
        </div>
      </FormField>
      <Switch
        size="sm"
        isSelected={form.is_compulsory}
        onValueChange={(v) => setForm((f) => ({ ...f, is_compulsory: v }))}
      >
        Compulsory for this class
      </Switch>
    </PanelShell>
  )
}

// ─── Teacher allocation ───────────────────────────────────────────

export function TeacherAllocationPanel() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    staff_id: '',
    subject_id: '',
    classroom_id: '',
    academic_year_id: '',
    term_id: '',
    periods_per_week: '',
    is_primary_teacher: true,
    notes: '',
  })
  const [yearFilter, setYearFilter] = useState('')

  const yearsQ = useQuery({ queryKey: ['academic', 'years'], queryFn: listYears })
  const termsQ = useQuery({ queryKey: ['academic', 'terms'], queryFn: () => listTerms() })
  const classesQ = useQuery({
    queryKey: ['academic', 'classes'],
    queryFn: listClasses,
  })
  const subjectsQ = useQuery({
    queryKey: ['academic', 'subjects', 'active'],
    queryFn: () => listSubjects({ active: true }),
  })
  const staffQ = useQuery({
    queryKey: ['staff', 'for-alloc'],
    queryFn: () => listStaff({ per_page: 200, status: 'active' }),
  })
  const listQ = useQuery({
    queryKey: ['academic', 'teacher-allocations', yearFilter],
    queryFn: () =>
      listTeacherAllocations({
        academic_year_id: yearFilter || undefined,
      }),
  })

  const years = yearsQ.data?.academic_years || []
  const terms = termsQ.data?.terms || []
  const classes = classesQ.data?.classes || []
  const subjects = subjectsQ.data?.subjects || []
  const staff = staffQ.data?.staff || []
  const rows = listQ.data?.allocations || []
  const currentYear = years.find((y) => y.is_current) || years[0]

  const saveMut = useMutation({
    mutationFn: createTeacherAllocation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'teacher-allocations'] })
      toastSuccess('Teacher allocated')
      setForm({
        staff_id: '',
        subject_id: '',
        classroom_id: '',
        academic_year_id: currentYear ? String(currentYear.id) : '',
        term_id: '',
        periods_per_week: '',
        is_primary_teacher: true,
        notes: '',
      })
      sheet.onClose()
      setError('')
    },
    onError: (e) => {
      setError(e.message)
      toastError('Could not allocate teacher', e.message)
    },
  })

  const deleteMut = useMutation({
    mutationFn: deleteTeacherAllocation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'teacher-allocations'] })
      toastSuccess('Allocation removed')
    },
    onError: (e) => toastError('Could not remove', e.message),
  })

  const columns = useMemo(
    () => [
      {
        id: 'teacher',
        header: 'Teacher',
        size: 160,
        accessorFn: (r) =>
          r.staff_name ||
          r.staff?.full_name ||
          [r.staff?.first_name, r.staff?.last_name].filter(Boolean).join(' ') ||
          '—',
      },
      {
        id: 'subject',
        header: 'Subject',
        size: 140,
        accessorFn: (r) => r.subject?.name || '—',
      },
      {
        id: 'class',
        header: 'Class',
        size: 120,
        accessorFn: (r) => r.classroom?.name || '—',
      },
      {
        id: 'year',
        header: 'Year',
        size: 100,
        accessorFn: (r) => r.academic_year?.name || '—',
      },
      {
        accessorKey: 'periods_per_week',
        header: 'Periods',
        size: 80,
        Cell: ({ cell }) => cell.getValue() ?? '—',
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
                  key: 'delete',
                  label: 'Remove',
                  color: 'danger',
                  onPress: () => {
                    if (window.confirm('Remove this teacher allocation?')) {
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
    <PanelShell
      error={error}
      toolbar={
        <FormSelect
          className="w-full sm:w-44"
          placeholder="All years"
          value={yearFilter}
          onChange={setYearFilter}
          options={years.map((y) => ({
            value: String(y.id),
            label: `${y.name}${y.is_current ? ' ★' : ''}`,
          }))}
        />
      }
      onAdd={() => {
        setForm({
          staff_id: '',
          subject_id: '',
          classroom_id: '',
          academic_year_id: currentYear ? String(currentYear.id) : '',
          term_id: '',
          periods_per_week: '',
          is_primary_teacher: true,
          notes: '',
        })
        setError('')
        sheet.onOpen()
      }}
      addLabel="Allocate teacher"
      loading={listQ.isLoading}
      listError={listQ.error?.message}
      columns={columns}
      data={rows}
      emptyMessage="No teacher allocations yet. Assign teachers to subjects and classes for the year."
      sheet={sheet}
      sheetTitle="Allocate teacher to subject & class"
      saving={saveMut.isPending}
      onSave={() => {
        if (
          !form.staff_id ||
          !form.subject_id ||
          !form.classroom_id ||
          !form.academic_year_id
        ) {
          setError('Teacher, subject, class and year are required')
          return
        }
        saveMut.mutate({
          staff_id: Number(form.staff_id),
          subject_id: Number(form.subject_id),
          classroom_id: Number(form.classroom_id),
          academic_year_id: Number(form.academic_year_id),
          term_id: form.term_id ? Number(form.term_id) : null,
          periods_per_week: form.periods_per_week
            ? Number(form.periods_per_week)
            : null,
          is_primary_teacher: Boolean(form.is_primary_teacher),
          notes: form.notes.trim() || undefined,
        })
      }}
    >
      <p className="text-[11px] text-zinc-500">
        Industrial staffing: one teacher can teach a subject in several classes;
        periods/week feed workload and timetable planning.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Teacher" required className="sm:col-span-2">
          <FormSelect
            label="Teacher"
            placeholder="Select staff"
            value={form.staff_id}
            onChange={(v) => setForm((f) => ({ ...f, staff_id: v }))}
            options={staff.map((s) => ({
              value: String(s.id),
              label: s.full_name || `${s.first_name} ${s.last_name}`,
            }))}
          />
        </FormField>
        <FormField label="Subject" required>
          <FormSelect
            label="Subject"
            placeholder="Select subject"
            value={form.subject_id}
            onChange={(v) => setForm((f) => ({ ...f, subject_id: v }))}
            options={subjects.map((s) => ({
              value: String(s.id),
              label: s.name,
            }))}
          />
        </FormField>
        <FormField label="Class" required>
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
        <FormField label="Academic year" required>
          <FormSelect
            label="Year"
            value={form.academic_year_id}
            onChange={(v) => setForm((f) => ({ ...f, academic_year_id: v }))}
            options={years.map((y) => ({
              value: String(y.id),
              label: `${y.name}${y.is_current ? ' (current)' : ''}`,
            }))}
          />
        </FormField>
        <FormField label="Term (optional)">
          <FormSelect
            label="Term"
            placeholder="Whole year"
            value={form.term_id}
            onChange={(v) => setForm((f) => ({ ...f, term_id: v }))}
            options={terms.map((t) => ({
              value: String(t.id),
              label: t.name,
            }))}
          />
        </FormField>
        <FormField label="Periods / week">
          <FormInput
            type="number"
            value={form.periods_per_week}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, periods_per_week: v }))
            }
          />
        </FormField>
        <FormField label="Notes" className="sm:col-span-2">
          <FormTextarea
            minRows={2}
            value={form.notes}
            onValueChange={(v) => setForm((f) => ({ ...f, notes: v }))}
          />
        </FormField>
      </div>
      <Switch
        size="sm"
        isSelected={form.is_primary_teacher}
        onValueChange={(v) =>
          setForm((f) => ({ ...f, is_primary_teacher: v }))
        }
      >
        Primary teacher for this subject/class
      </Switch>
    </PanelShell>
  )
}
