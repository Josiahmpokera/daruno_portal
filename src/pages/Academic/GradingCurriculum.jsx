import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardBody, Chip, Spinner, useDisclosure } from '@heroui/react'
import { Award, BookMarked, Plus, RefreshCw } from 'lucide-react'
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
  createCurriculum,
  createCurriculumTopic,
  createGradingSystem,
  deleteCurriculum,
  deleteCurriculumTopic,
  deleteGradingSystem,
  getCurriculum,
  listCurricula,
  listGradingSystems,
  listLevels,
  listSubjects,
  previewGrading,
  setDefaultGradingSystem,
  updateCurriculum,
  updateGradingSystem,
} from '../../api/domain.js'

const STAGE_OPTS = [
  { value: 'all', label: 'All stages' },
  { value: 'pre_primary', label: 'Pre-primary' },
  { value: 'primary', label: 'Primary' },
  { value: 'o_level', label: 'O-level (secondary)' },
  { value: 'a_level', label: 'A-level (advanced)' },
]

const SCALE_OPTS = [
  { value: 'necta_secondary', label: 'NECTA secondary (CSEE/ACSEE)' },
  { value: 'primary', label: 'Primary / basic' },
  { value: 'custom', label: 'Custom' },
]

const NECTA_DEFAULT_BANDS = [
  { grade: 'A', min_percent: '75', points: '1', remark: 'Excellent' },
  { grade: 'B', min_percent: '65', points: '2', remark: 'Very Good' },
  { grade: 'C', min_percent: '45', points: '3', remark: 'Good' },
  { grade: 'D', min_percent: '30', points: '4', remark: 'Satisfactory' },
  { grade: 'F', min_percent: '0', points: '5', remark: 'Fail' },
]

const emptyGradingForm = () => ({
  name: '',
  code: '',
  education_stage: 'o_level',
  education_level_id: '',
  scale_type: 'necta_secondary',
  pass_mark: '30',
  is_default: false,
  is_active: true,
  notes: '',
  bands: NECTA_DEFAULT_BANDS.map((b) => ({ ...b })),
})

// ── Grading System ────────────────────────────────────────────────

export function GradingPanel() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyGradingForm)
  const [previewPct, setPreviewPct] = useState('72')
  const [previewResult, setPreviewResult] = useState(null)

  const listQ = useQuery({
    queryKey: ['academic', 'grading'],
    queryFn: listGradingSystems,
  })
  const levelsQ = useQuery({
    queryKey: ['academic', 'levels'],
    queryFn: listLevels,
    staleTime: 60_000,
  })

  const systems = listQ.data?.grading_systems || []
  const levels = levelsQ.data?.levels || []

  const saveMut = useMutation({
    mutationFn: (payload) =>
      editingId ? updateGradingSystem(editingId, payload) : createGradingSystem(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'grading'] })
      toastSuccess(editingId ? 'Grading system updated' : 'Grading system created')
      setForm(emptyGradingForm())
      setEditingId(null)
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Save failed'),
  })

  const delMut = useMutation({
    mutationFn: deleteGradingSystem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'grading'] })
      toastSuccess('Grading system deleted')
    },
    onError: (e) => toastError(e?.message || 'Delete failed'),
  })

  const defaultMut = useMutation({
    mutationFn: setDefaultGradingSystem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'grading'] })
      toastSuccess('Default grading system set')
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })

  const previewMut = useMutation({
    mutationFn: previewGrading,
    onSuccess: (data) => setPreviewResult(data?.result || null),
    onError: (e) => toastError(e?.message || 'Preview failed'),
  })

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyGradingForm())
    sheet.onOpen()
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    setForm({
      name: row.name || '',
      code: row.code || '',
      education_stage: row.education_stage || 'all',
      education_level_id: row.education_level_id ? String(row.education_level_id) : '',
      scale_type: row.scale_type || 'necta_secondary',
      pass_mark: String(row.pass_mark ?? 30),
      is_default: Boolean(row.is_default),
      is_active: row.is_active !== false,
      notes: row.notes || '',
      bands: (row.bands || []).length
        ? row.bands.map((b) => ({
            grade: b.grade,
            min_percent: String(b.min_percent),
            points: String(b.points),
            remark: b.remark || '',
          }))
        : NECTA_DEFAULT_BANDS.map((b) => ({ ...b })),
    })
    sheet.onOpen()
  }

  const save = () => {
    if (!form.name.trim()) {
      toastError('Name is required')
      return
    }
    if (!form.bands.length) {
      toastError('At least one grade band is required')
      return
    }
    saveMut.mutate({
      name: form.name.trim(),
      code: form.code.trim() || null,
      education_stage: form.education_stage || 'all',
      education_level_id: form.education_level_id ? Number(form.education_level_id) : null,
      scale_type: form.scale_type || 'custom',
      pass_mark: Number(form.pass_mark) || 30,
      is_default: Boolean(form.is_default),
      is_active: Boolean(form.is_active),
      notes: form.notes || null,
      bands: form.bands.map((b) => ({
        grade: b.grade,
        min_percent: Number(b.min_percent),
        points: Number(b.points) || 5,
        remark: b.remark || null,
      })),
    })
  }

  const updateBand = (idx, key, val) => {
    setForm((f) => {
      const bands = [...f.bands]
      bands[idx] = { ...bands[idx], [key]: val }
      return { ...f, bands }
    })
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Scale',
        Cell: ({ row }) => (
          <div>
            <div className="text-[11px] font-medium text-zinc-900">
              {row.original.name}
              {row.original.is_default ? (
                <Chip size="sm" color="success" variant="flat" className="ml-1.5 h-4 text-[9px]">
                  Default
                </Chip>
              ) : null}
            </div>
            <div className="text-[10px] text-zinc-400">
              {row.original.code || '—'} · {row.original.scale_type}
            </div>
          </div>
        ),
      },
      {
        id: 'stage',
        header: 'Stage',
        Cell: ({ row }) =>
          STAGE_OPTS.find((s) => s.value === row.original.education_stage)?.label ||
          row.original.education_stage,
      },
      {
        id: 'pass',
        header: 'Pass mark',
        Cell: ({ row }) => `${row.original.pass_mark}%`,
      },
      {
        id: 'bands',
        header: 'Bands',
        Cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {(row.original.bands || []).map((b) => (
              <Chip key={b.grade} size="sm" variant="flat" className="h-5 text-[10px]">
                {b.grade} ≥{b.min_percent}%
              </Chip>
            ))}
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        Cell: ({ row }) => (
          <Chip
            size="sm"
            variant="flat"
            color={row.original.is_active ? 'success' : 'default'}
            className="h-5 text-[10px]"
          >
            {row.original.is_active ? 'Active' : 'Inactive'}
          </Chip>
        ),
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
                { key: 'edit', label: 'Edit', onPress: () => openEdit(r) },
                !r.is_default && {
                  key: 'default',
                  label: 'Set as default',
                  onPress: () => defaultMut.mutate(r.id),
                },
                !r.is_default && {
                  key: 'del',
                  label: 'Delete',
                  color: 'danger',
                  onPress: () => {
                    if (window.confirm(`Delete ${r.name}?`)) delMut.mutate(r.id)
                  },
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
    <div className="space-y-4">
      <Card className="border border-slate-200 shadow-none">
        <CardBody className="space-y-1 p-3.5">
          <p className="text-sm font-semibold text-slate-900">TAMISEMI / NECTA grading</p>
          <p className="text-xs text-slate-500">
            Configure letter grades and grade points used for continuous assessment, terminal exams
            and report cards. Secondary schools typically use NECTA A–F (lower points = better).
            Primary may use A–E with a 40% pass mark.
          </p>
        </CardBody>
      </Card>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="border border-slate-200 shadow-none lg:col-span-2">
          <CardBody className="flex flex-row flex-wrap items-center justify-between gap-2 p-3">
            <div>
              <p className="text-sm font-semibold">Grading systems</p>
              <p className="text-xs text-slate-500">
                {listQ.isLoading ? 'Loading…' : `${systems.length} scale(s)`}
              </p>
            </div>
            <div className="flex gap-2">
              <FormButton
                appearance="bordered"
                startContent={<RefreshCw className="h-3.5 w-3.5" />}
                onPress={() => listQ.refetch()}
              >
                Refresh
              </FormButton>
              <FormButton startContent={<Plus className="h-3.5 w-3.5" />} onPress={openCreate}>
                New scale
              </FormButton>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-slate-200 shadow-none">
          <CardBody className="space-y-2 p-3">
            <p className="text-xs font-semibold text-slate-800">Preview grade</p>
            <div className="flex gap-2">
              <FormInput
                type="number"
                min={0}
                max={100}
                value={previewPct}
                onValueChange={setPreviewPct}
                placeholder="%"
              />
              <FormButton
                size="sm"
                isLoading={previewMut.isPending}
                onPress={() =>
                  previewMut.mutate({
                    percent: Number(previewPct),
                    grading_system_id: systems.find((s) => s.is_default)?.id,
                  })
                }
              >
                Grade
              </FormButton>
            </div>
            {previewResult ? (
              <div className="rounded-lg bg-slate-50 px-2.5 py-2 text-xs">
                <span className="font-semibold text-[#0B3D2E]">{previewResult.grade}</span>
                {' · '}
                {previewResult.points} pts · {previewResult.remark}
                {previewResult.pass != null ? (
                  <span className={previewResult.pass ? ' text-emerald-700' : ' text-rose-700'}>
                    {' '}
                    · {previewResult.pass ? 'Pass' : 'Fail'}
                  </span>
                ) : null}
              </div>
            ) : null}
          </CardBody>
        </Card>
      </div>

      {listQ.isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={systems}
          emptyMessage="No grading systems yet."
          enableRowSelection={false}
        />
      )}

      <SideSheet
        isOpen={sheet.isOpen}
        onOpenChange={sheet.onOpenChange}
        title={editingId ? 'Edit grading system' : 'New grading system'}
        size="lg"
        footer={(onClose) => (
          <>
            <FormButton appearance="light" onPress={onClose}>
              Cancel
            </FormButton>
            <FormButton isLoading={saveMut.isPending} onPress={save}>
              {editingId ? 'Save changes' : 'Create'}
            </FormButton>
          </>
        )}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Name" required className="sm:col-span-2">
            <FormInput
              value={form.name}
              onValueChange={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="e.g. NECTA secondary (default)"
            />
          </FormField>
          <FormField label="Code">
            <FormInput
              value={form.code}
              onValueChange={(v) => setForm((f) => ({ ...f, code: v }))}
              placeholder="NECTA_SEC"
            />
          </FormField>
          <FormField label="Pass mark %">
            <FormInput
              type="number"
              value={form.pass_mark}
              onValueChange={(v) => setForm((f) => ({ ...f, pass_mark: v }))}
            />
          </FormField>
          <FormField label="Education stage">
            <FormSelect
              value={form.education_stage}
              onChange={(v) => setForm((f) => ({ ...f, education_stage: v }))}
              options={STAGE_OPTS}
            />
          </FormField>
          <FormField label="Scale type">
            <FormSelect
              value={form.scale_type}
              onChange={(v) => {
                setForm((f) => ({
                  ...f,
                  scale_type: v,
                  bands:
                    v === 'primary'
                      ? [
                          { grade: 'A', min_percent: '80', points: '1', remark: 'Excellent' },
                          { grade: 'B', min_percent: '65', points: '2', remark: 'Very Good' },
                          { grade: 'C', min_percent: '50', points: '3', remark: 'Good' },
                          { grade: 'D', min_percent: '40', points: '4', remark: 'Average' },
                          { grade: 'E', min_percent: '0', points: '5', remark: 'Needs improvement' },
                        ]
                      : v === 'necta_secondary'
                        ? NECTA_DEFAULT_BANDS.map((b) => ({ ...b }))
                        : f.bands,
                  pass_mark: v === 'primary' ? '40' : f.pass_mark,
                }))
              }}
              options={SCALE_OPTS}
            />
          </FormField>
          <FormField label="Level (optional)">
            <FormSelect
              value={form.education_level_id}
              onChange={(v) => setForm((f) => ({ ...f, education_level_id: v }))}
              options={[
                { value: '', label: 'Any level' },
                ...levels.map((l) => ({ value: String(l.id), label: l.name })),
              ]}
            />
          </FormField>
          <FormField label="Default for school">
            <FormSelect
              value={form.is_default ? '1' : '0'}
              onChange={(v) => setForm((f) => ({ ...f, is_default: v === '1' }))}
              options={[
                { value: '0', label: 'No' },
                { value: '1', label: 'Yes — use for exams & report cards' },
              ]}
            />
          </FormField>
          <FormField label="Status">
            <FormSelect
              value={form.is_active ? '1' : '0'}
              onChange={(v) => setForm((f) => ({ ...f, is_active: v === '1' }))}
              options={[
                { value: '1', label: 'Active' },
                { value: '0', label: 'Inactive' },
              ]}
            />
          </FormField>
          <FormField label="Notes" className="sm:col-span-2">
            <FormTextarea
              value={form.notes}
              onValueChange={(v) => setForm((f) => ({ ...f, notes: v }))}
            />
          </FormField>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Grade bands
            </p>
            <FormButton
              size="sm"
              appearance="bordered"
              onPress={() =>
                setForm((f) => ({
                  ...f,
                  bands: [
                    ...f.bands,
                    { grade: '', min_percent: '0', points: '5', remark: '' },
                  ],
                }))
              }
            >
              Add band
            </FormButton>
          </div>
          <div className="space-y-2">
            {form.bands.map((b, i) => (
              <div key={i} className="grid grid-cols-4 gap-2">
                <FormInput
                  placeholder="Grade"
                  value={b.grade}
                  onValueChange={(v) => updateBand(i, 'grade', v)}
                />
                <FormInput
                  type="number"
                  placeholder="Min %"
                  value={b.min_percent}
                  onValueChange={(v) => updateBand(i, 'min_percent', v)}
                />
                <FormInput
                  type="number"
                  placeholder="Points"
                  value={b.points}
                  onValueChange={(v) => updateBand(i, 'points', v)}
                />
                <FormInput
                  placeholder="Remark"
                  value={b.remark}
                  onValueChange={(v) => updateBand(i, 'remark', v)}
                />
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-slate-400">
            Bands are matched by highest min % first (e.g. 72% → B if B ≥ 65 and A ≥ 75).
          </p>
        </div>
      </SideSheet>
    </div>
  )
}

// ── Curriculum ────────────────────────────────────────────────────

export function CurriculumPanel() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const detailSheet = useDisclosure()
  const topicSheet = useDisclosure()
  const [editingId, setEditingId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState({
    name: '',
    code: '',
    education_stage: 'primary',
    version: String(new Date().getFullYear()),
    authority: 'TAMISEMI',
    description: '',
    is_default: false,
    is_active: true,
    subject_ids: [],
  })
  const [topicForm, setTopicForm] = useState({
    title: '',
    subject_id: '',
    code: '',
    term_number: '',
    week_from: '',
    week_to: '',
    description: '',
  })

  const listQ = useQuery({
    queryKey: ['academic', 'curriculum'],
    queryFn: listCurricula,
  })
  const subjectsQ = useQuery({
    queryKey: ['academic', 'subjects'],
    queryFn: () => listSubjects({ per_page: 200 }),
    staleTime: 60_000,
  })
  const detailQ = useQuery({
    queryKey: ['academic', 'curriculum', selectedId],
    queryFn: () => getCurriculum(selectedId),
    enabled: Boolean(selectedId),
  })

  const curricula = listQ.data?.curricula || []
  const subjects = subjectsQ.data?.subjects || []
  const detail = detailQ.data?.curriculum

  const saveMut = useMutation({
    mutationFn: (payload) =>
      editingId ? updateCurriculum(editingId, payload) : createCurriculum(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'curriculum'] })
      toastSuccess(editingId ? 'Curriculum updated' : 'Curriculum created')
      sheet.onClose()
      setEditingId(null)
    },
    onError: (e) => toastError(e?.message || 'Save failed'),
  })

  const delMut = useMutation({
    mutationFn: deleteCurriculum,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'curriculum'] })
      toastSuccess('Curriculum deleted')
      if (selectedId) {
        setSelectedId(null)
        detailSheet.onClose()
      }
    },
    onError: (e) => toastError(e?.message || 'Delete failed'),
  })

  const topicMut = useMutation({
    mutationFn: (payload) => createCurriculumTopic(selectedId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'curriculum'] })
      toastSuccess('Topic added')
      setTopicForm({
        title: '',
        subject_id: '',
        code: '',
        term_number: '',
        week_from: '',
        week_to: '',
        description: '',
      })
      topicSheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })

  const delTopicMut = useMutation({
    mutationFn: deleteCurriculumTopic,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'curriculum'] })
      toastSuccess('Topic deleted')
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })

  const openCreate = () => {
    setEditingId(null)
    setForm({
      name: '',
      code: '',
      education_stage: 'primary',
      version: String(new Date().getFullYear()),
      authority: 'TAMISEMI',
      description: '',
      is_default: false,
      is_active: true,
      subject_ids: [],
    })
    sheet.onOpen()
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    setForm({
      name: row.name || '',
      code: row.code || '',
      education_stage: row.education_stage || 'all',
      version: row.version || '',
      authority: row.authority || 'TAMISEMI',
      description: row.description || '',
      is_default: Boolean(row.is_default),
      is_active: row.is_active !== false,
      subject_ids: (row.subjects || []).map((s) => String(s.subject_id)),
    })
    sheet.onOpen()
  }

  const openDetail = (row) => {
    setSelectedId(row.id)
    detailSheet.onOpen()
  }

  const toggleSubject = (id) => {
    const sid = String(id)
    setForm((f) => ({
      ...f,
      subject_ids: f.subject_ids.includes(sid)
        ? f.subject_ids.filter((x) => x !== sid)
        : [...f.subject_ids, sid],
    }))
  }

  const stageSubjects = subjects.filter(
    (s) =>
      form.education_stage === 'all' ||
      !s.education_stage ||
      s.education_stage === form.education_stage,
  )

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Curriculum',
        Cell: ({ row }) => (
          <div>
            <div className="text-[11px] font-medium">
              {row.original.name}
              {row.original.is_default ? (
                <Chip size="sm" color="success" variant="flat" className="ml-1.5 h-4 text-[9px]">
                  Default
                </Chip>
              ) : null}
            </div>
            <div className="text-[10px] text-zinc-400">
              {row.original.authority || 'TAMISEMI'}
              {row.original.version ? ` · v${row.original.version}` : ''}
            </div>
          </div>
        ),
      },
      {
        id: 'stage',
        header: 'Stage',
        Cell: ({ row }) =>
          STAGE_OPTS.find((s) => s.value === row.original.education_stage)?.label ||
          row.original.education_stage,
      },
      {
        id: 'subjects',
        header: 'Subjects',
        Cell: ({ row }) => row.original.subjects_count ?? 0,
      },
      {
        id: 'topics',
        header: 'Topics',
        Cell: ({ row }) => row.original.topics_count ?? 0,
      },
      {
        id: 'status',
        header: 'Status',
        Cell: ({ row }) => (
          <Chip
            size="sm"
            variant="flat"
            color={row.original.is_active ? 'success' : 'default'}
            className="h-5 text-[10px]"
          >
            {row.original.is_active ? 'Active' : 'Inactive'}
          </Chip>
        ),
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
                { key: 'view', label: 'Open', onPress: () => openDetail(r) },
                { key: 'edit', label: 'Edit', onPress: () => openEdit(r) },
                !r.is_default && {
                  key: 'del',
                  label: 'Delete',
                  color: 'danger',
                  onPress: () => {
                    if (window.confirm(`Delete ${r.name}?`)) delMut.mutate(r.id)
                  },
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
    <div className="space-y-4">
      <Card className="border border-slate-200 shadow-none">
        <CardBody className="space-y-1 p-3.5">
          <p className="text-sm font-semibold text-slate-900">TAMISEMI curriculum frameworks</p>
          <p className="text-xs text-slate-500">
            Define curriculum packages by education stage, attach subjects from your catalogue, and
            plan topics / units by term. Class assignment and teacher allocation use the same
            subject catalogue for industrial school operations.
          </p>
        </CardBody>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          {listQ.isLoading ? 'Loading…' : `${curricula.length} curriculum framework(s)`}
        </p>
        <div className="flex gap-2">
          <FormButton
            appearance="bordered"
            startContent={<RefreshCw className="h-3.5 w-3.5" />}
            onPress={() => listQ.refetch()}
          >
            Refresh
          </FormButton>
          <FormButton startContent={<Plus className="h-3.5 w-3.5" />} onPress={openCreate}>
            New curriculum
          </FormButton>
        </div>
      </div>

      {listQ.isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={curricula}
          emptyMessage="No curricula yet. Create a framework and attach subjects."
          enableRowSelection={false}
        />
      )}

      {/* Create / edit */}
      <SideSheet
        isOpen={sheet.isOpen}
        onOpenChange={sheet.onOpenChange}
        title={editingId ? 'Edit curriculum' : 'New curriculum'}
        size="lg"
        footer={(onClose) => (
          <>
            <FormButton appearance="light" onPress={onClose}>
              Cancel
            </FormButton>
            <FormButton
              isLoading={saveMut.isPending}
              onPress={() => {
                if (!form.name.trim()) {
                  toastError('Name is required')
                  return
                }
                saveMut.mutate({
                  name: form.name.trim(),
                  code: form.code.trim() || null,
                  education_stage: form.education_stage,
                  version: form.version || null,
                  authority: form.authority || 'TAMISEMI',
                  description: form.description || null,
                  is_default: Boolean(form.is_default),
                  is_active: Boolean(form.is_active),
                  subject_ids: form.subject_ids.map(Number),
                })
              }}
            >
              {editingId ? 'Save' : 'Create'}
            </FormButton>
          </>
        )}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Name" required className="sm:col-span-2">
            <FormInput
              value={form.name}
              onValueChange={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="e.g. O-level curriculum"
            />
          </FormField>
          <FormField label="Code">
            <FormInput
              value={form.code}
              onValueChange={(v) => setForm((f) => ({ ...f, code: v }))}
            />
          </FormField>
          <FormField label="Version">
            <FormInput
              value={form.version}
              onValueChange={(v) => setForm((f) => ({ ...f, version: v }))}
              placeholder="2019 / 2023"
            />
          </FormField>
          <FormField label="Stage">
            <FormSelect
              value={form.education_stage}
              onChange={(v) => setForm((f) => ({ ...f, education_stage: v, subject_ids: [] }))}
              options={STAGE_OPTS}
            />
          </FormField>
          <FormField label="Authority">
            <FormInput
              value={form.authority}
              onValueChange={(v) => setForm((f) => ({ ...f, authority: v }))}
            />
          </FormField>
          <FormField label="Default">
            <FormSelect
              value={form.is_default ? '1' : '0'}
              onChange={(v) => setForm((f) => ({ ...f, is_default: v === '1' }))}
              options={[
                { value: '0', label: 'No' },
                { value: '1', label: 'Yes' },
              ]}
            />
          </FormField>
          <FormField label="Description" className="sm:col-span-2">
            <FormTextarea
              value={form.description}
              onValueChange={(v) => setForm((f) => ({ ...f, description: v }))}
            />
          </FormField>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Subjects in this curriculum ({form.subject_ids.length})
          </p>
          <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-slate-100 p-2">
            {stageSubjects.length === 0 ? (
              <p className="p-2 text-xs text-slate-400">
                No subjects for this stage. Add subjects under Academic → Subjects first.
              </p>
            ) : (
              stageSubjects.map((s) => {
                const checked = form.subject_ids.includes(String(s.id))
                return (
                  <label
                    key={s.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSubject(s.id)}
                      className="rounded border-slate-300"
                    />
                    <span className="font-medium text-slate-800">{s.name}</span>
                    <span className="text-slate-400">
                      {s.code || s.necta_code || ''}
                      {s.is_core ? ' · core' : ''}
                    </span>
                  </label>
                )
              })
            )}
          </div>
        </div>
      </SideSheet>

      {/* Detail */}
      <SideSheet
        isOpen={detailSheet.isOpen}
        onOpenChange={(open) => {
          detailSheet.onOpenChange(open)
          if (!open) setSelectedId(null)
        }}
        title={detail?.name || 'Curriculum'}
        size="lg"
      >
        {detailQ.isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : detail ? (
          <div className="space-y-4">
            <div className="text-xs text-slate-500">
              {STAGE_OPTS.find((s) => s.value === detail.education_stage)?.label} ·{' '}
              {detail.authority || 'TAMISEMI'}
              {detail.version ? ` · v${detail.version}` : ''}
            </div>
            {detail.description ? (
              <p className="text-sm text-slate-600">{detail.description}</p>
            ) : null}

            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                Subjects ({detail.subjects?.length || 0})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(detail.subjects || []).map((s) => (
                  <Chip key={s.id} size="sm" variant="flat" className="h-6">
                    {s.subject?.name || '—'}
                    {s.is_compulsory ? '' : ' (opt)'}
                  </Chip>
                ))}
                {!detail.subjects?.length ? (
                  <p className="text-xs text-slate-400">No subjects attached. Edit to add.</p>
                ) : null}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Topics / units ({detail.topics?.length || 0})
                </p>
                <FormButton
                  size="sm"
                  startContent={<Plus className="h-3.5 w-3.5" />}
                  onPress={() => topicSheet.onOpen()}
                >
                  Add topic
                </FormButton>
              </div>
              <ul className="space-y-1.5">
                {(detail.topics || []).map((t) => (
                  <li
                    key={t.id}
                    className="flex items-start justify-between gap-2 rounded-lg border border-slate-100 px-2.5 py-2 text-xs"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{t.title}</p>
                      <p className="text-slate-400">
                        {t.subject?.name || 'General'}
                        {t.term_number ? ` · Term ${t.term_number}` : ''}
                        {t.week_from ? ` · Wk ${t.week_from}${t.week_to ? `–${t.week_to}` : ''}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-rose-600 hover:underline"
                      onClick={() => {
                        if (window.confirm('Delete topic?')) delTopicMut.mutate(t.id)
                      }}
                    >
                      Delete
                    </button>
                  </li>
                ))}
                {!detail.topics?.length ? (
                  <p className="text-xs text-slate-400">No topics yet. Add units by term/week.</p>
                ) : null}
              </ul>
            </div>
          </div>
        ) : null}
      </SideSheet>

      <SideSheet
        isOpen={topicSheet.isOpen}
        onOpenChange={topicSheet.onOpenChange}
        title="Add curriculum topic"
        footer={(onClose) => (
          <>
            <FormButton appearance="light" onPress={onClose}>
              Cancel
            </FormButton>
            <FormButton
              isLoading={topicMut.isPending}
              onPress={() => {
                if (!topicForm.title.trim()) {
                  toastError('Title is required')
                  return
                }
                topicMut.mutate({
                  title: topicForm.title.trim(),
                  subject_id: topicForm.subject_id ? Number(topicForm.subject_id) : null,
                  code: topicForm.code || null,
                  term_number: topicForm.term_number ? Number(topicForm.term_number) : null,
                  week_from: topicForm.week_from ? Number(topicForm.week_from) : null,
                  week_to: topicForm.week_to ? Number(topicForm.week_to) : null,
                  description: topicForm.description || null,
                })
              }}
            >
              Add topic
            </FormButton>
          </>
        )}
      >
        <div className="flex flex-col gap-3">
          <FormField label="Title" required>
            <FormInput
              value={topicForm.title}
              onValueChange={(v) => setTopicForm((f) => ({ ...f, title: v }))}
            />
          </FormField>
          <FormField label="Subject">
            <FormSelect
              value={topicForm.subject_id}
              onChange={(v) => setTopicForm((f) => ({ ...f, subject_id: v }))}
              options={[
                { value: '', label: 'General / cross-cutting' },
                ...(detail?.subjects || []).map((s) => ({
                  value: String(s.subject_id),
                  label: s.subject?.name || `#${s.subject_id}`,
                })),
              ]}
            />
          </FormField>
          <div className="grid grid-cols-3 gap-2">
            <FormField label="Term">
              <FormInput
                type="number"
                min={1}
                max={4}
                value={topicForm.term_number}
                onValueChange={(v) => setTopicForm((f) => ({ ...f, term_number: v }))}
              />
            </FormField>
            <FormField label="Week from">
              <FormInput
                type="number"
                value={topicForm.week_from}
                onValueChange={(v) => setTopicForm((f) => ({ ...f, week_from: v }))}
              />
            </FormField>
            <FormField label="Week to">
              <FormInput
                type="number"
                value={topicForm.week_to}
                onValueChange={(v) => setTopicForm((f) => ({ ...f, week_to: v }))}
              />
            </FormField>
          </div>
          <FormField label="Description">
            <FormTextarea
              value={topicForm.description}
              onValueChange={(v) => setTopicForm((f) => ({ ...f, description: v }))}
            />
          </FormField>
        </div>
      </SideSheet>
    </div>
  )
}

export function curriculumOverviewCards() {
  return [
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
  ]
}
