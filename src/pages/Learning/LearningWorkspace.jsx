import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardBody, Chip, Spinner, useDisclosure } from '@heroui/react'
import {
  BookMarked,
  BookOpen,
  Clapperboard,
  FileText,
  GraduationCap,
  LayoutGrid,
  Plus,
  RefreshCw,
  ScrollText,
  Video,
} from 'lucide-react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import PageHeader from '../../components/Layout/PageHeader.jsx'
import SideSheet from '../../components/Layout/SideSheet.jsx'
import DataTable from '../../components/Tables/DataTable.jsx'
import {
  FormButton,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
} from '../../components/Form'
import { toastError, toastSuccess } from '../../components/Toast'
import {
  archiveLearningResource,
  createAssignment,
  createAssignmentSubmission,
  createCourse,
  createLearningResource,
  createLesson,
  getCourse,
  getLearningOverview,
  gradeAssignmentSubmission,
  listAssignmentSubmissions,
  listAssignments,
  listClasses,
  listCourses,
  listLearningResources,
  listLevels,
  listStudents,
  listSubjects,
  listYears,
  updateAssignment,
  updateCourse,
  updateLearningResource,
} from '../../api/domain.js'
import { SectionSkeleton, ValueSkeleton } from '../../components/Loading'

const TYPE_META = {
  note: { label: 'Notes', path: '/learning/notes', icon: FileText, tone: 'bg-sky-50 text-sky-700' },
  past_paper: { label: 'Past papers', path: '/learning/past-papers', icon: ScrollText, tone: 'bg-amber-50 text-amber-800' },
  video: { label: 'Videos', path: '/learning/videos', icon: Video, tone: 'bg-violet-50 text-violet-700' },
  digital_book: { label: 'Digital books', path: '/learning/books', icon: BookOpen, tone: 'bg-emerald-50 text-emerald-700' },
}

const META = {
  '/learning': { title: 'Learning', section: 'overview', desc: 'TAMISEMI digital resources, smart classroom and assignments' },
  '/learning/classroom': { title: 'Smart Classroom', section: 'classroom', desc: 'Courses and lessons by class / subject' },
  '/learning/notes': { title: 'Notes', section: 'resources', type: 'note', desc: 'Teacher and curriculum notes' },
  '/learning/past-papers': { title: 'Past Papers', section: 'resources', type: 'past_paper', desc: 'NECTA and mock past papers by subject' },
  '/learning/videos': { title: 'Videos', section: 'resources', type: 'video', desc: 'Video lessons and media links' },
  '/learning/books': { title: 'Digital Books', section: 'resources', type: 'digital_book', desc: 'E-books and reading materials' },
  '/learning/assignments': { title: 'Assignments', section: 'assignments', desc: 'Homework, quizzes and projects' },
}

const staffName = (t) =>
  t ? [t.first_name, t.last_name].filter(Boolean).join(' ') || t.full_name || '—' : '—'
const studentLabel = (s) =>
  s
    ? `${[s.first_name, s.last_name].filter(Boolean).join(' ')}${s.admission_number ? ` (${s.admission_number})` : ''}`
    : '—'

function StatCard({ label, value, hint, icon: Icon, tone, onPress }) {
  return (
    <Card
      isPressable={Boolean(onPress)}
      className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)] transition-colors hover:border-[#12544f]/30"
      onPress={onPress}
    >
      <CardBody className="flex flex-row items-center gap-2.5 p-2.5">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
          <p className="truncate text-base font-semibold tabular-nums text-slate-900">{value}</p>
          {hint ? <p className="truncate text-[10px] text-slate-500">{hint}</p> : null}
        </div>
      </CardBody>
    </Card>
  )
}

function useLookups() {
  const subjectsQ = useQuery({ queryKey: ['academic', 'subjects'], queryFn: () => listSubjects(), staleTime: 60_000 })
  const classesQ = useQuery({ queryKey: ['academic', 'classes'], queryFn: listClasses, staleTime: 60_000 })
  const levelsQ = useQuery({ queryKey: ['academic', 'levels'], queryFn: listLevels, staleTime: 60_000 })
  const yearsQ = useQuery({ queryKey: ['academic', 'years'], queryFn: listYears, staleTime: 60_000 })
  return {
    subjects: (subjectsQ.data?.subjects || []).map((s) => ({ value: String(s.id), label: s.name })),
    classes: (classesQ.data?.classes || []).map((c) => ({ value: String(c.id), label: c.name })),
    levels: (levelsQ.data?.levels || []).map((l) => ({ value: String(l.id), label: l.name })),
    years: (yearsQ.data?.academic_years || []).map((y) => ({ value: String(y.id), label: y.name })),
  }
}

// ── Overview ─────────────────────────────────────────────────────

function OverviewSection() {
  const navigate = useNavigate()
  const q = useQuery({ queryKey: ['learning', 'overview'], queryFn: getLearningOverview, staleTime: 30_000 })
  const s = q.data?.summary || {}
  const loading = q.isLoading

  const stats = [
    { label: 'Notes', value: loading ? <ValueSkeleton /> : String(s.notes ?? 0), hint: 'Teacher notes', icon: FileText, tone: TYPE_META.note.tone, path: '/learning/notes' },
    { label: 'Past papers', value: loading ? <ValueSkeleton /> : String(s.past_papers ?? 0), hint: 'NECTA / mock', icon: ScrollText, tone: TYPE_META.past_paper.tone, path: '/learning/past-papers' },
    { label: 'Videos', value: loading ? <ValueSkeleton /> : String(s.videos ?? 0), hint: 'Media lessons', icon: Video, tone: TYPE_META.video.tone, path: '/learning/videos' },
    { label: 'Digital books', value: loading ? <ValueSkeleton /> : String(s.digital_books ?? 0), hint: 'E-books', icon: BookOpen, tone: TYPE_META.digital_book.tone, path: '/learning/books' },
    { label: 'Courses', value: loading ? <ValueSkeleton /> : String(s.courses ?? 0), hint: `${s.lessons ?? 0} lessons`, icon: LayoutGrid, tone: 'bg-indigo-50 text-indigo-700', path: '/learning/classroom' },
  ]

  const modules = [
    { t: 'Smart Classroom', d: 'Courses and sequenced lessons by class', p: '/learning/classroom', icon: Clapperboard },
    { t: 'Notes', d: 'Curriculum and teacher notes', p: '/learning/notes', icon: FileText },
    { t: 'Past Papers', d: 'NECTA past papers by subject & year', p: '/learning/past-papers', icon: ScrollText },
    { t: 'Videos', d: 'Video lessons and links', p: '/learning/videos', icon: Video },
    { t: 'Digital Books', d: 'E-books and reading packs', p: '/learning/books', icon: BookOpen },
    { t: 'Assignments', d: `${s.open_assignments ?? 0} open · ${s.pending_grading ?? 0} to grade`, p: '/learning/assignments', icon: GraduationCap },
  ]

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2">
          <h2 className="text-sm font-semibold text-slate-900">At a glance</h2>
          <p className="text-xs text-slate-500">Live learning content statistics</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
          {stats.map((st) => (
            <StatCard key={st.label} {...st} onPress={() => navigate(st.path)} />
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2">
          <h2 className="text-sm font-semibold text-slate-900">Modules</h2>
          <p className="text-xs text-slate-500">Content library and classroom tools</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((c) => {
            const Icon = c.icon
            return (
              <Card key={c.p} isPressable className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)] transition-colors hover:border-[#12544f]/40" onPress={() => navigate(c.p)}>
                <CardBody className="flex flex-row items-start gap-3 p-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#12544f]/8 text-[#12544f]">
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

// ── Resources library ────────────────────────────────────────────

function ResourcesSection({ type }) {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const lookups = useLookups()
  const meta = TYPE_META[type] || TYPE_META.note
  const [q, setQ] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject_id: '',
    classroom_id: '',
    education_level_id: '',
    external_url: '',
    file_path: '',
    exam_body: type === 'past_paper' ? 'NECTA' : '',
    exam_year: '',
    paper_code: '',
    class_level: '',
    language: 'en',
    status: 'published',
  })

  const listQ = useQuery({
    queryKey: ['learning', 'resources', type, q],
    queryFn: () => listLearningResources({ type, q: q || undefined, per_page: 50 }),
    placeholderData: (prev) => prev,
  })

  const mut = useMutation({
    mutationFn: createLearningResource,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['learning'] })
      toastSuccess(`${meta.label.slice(0, -1)} published`)
      sheet.onClose()
      setForm((f) => ({
        ...f,
        title: '',
        description: '',
        external_url: '',
        file_path: '',
        paper_code: '',
        exam_year: '',
      }))
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })

  const archiveMut = useMutation({
    mutationFn: archiveLearningResource,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['learning', 'resources'] })
      toastSuccess('Resource archived')
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })

  const columns = useMemo(
    () => [
      { accessorKey: 'title', header: 'Title' },
      { accessorKey: 'subject', header: 'Subject', Cell: ({ row }) => row.original.subject?.name || '—' },
      { accessorKey: 'classroom', header: 'Class', Cell: ({ row }) => row.original.classroom?.name || row.original.class_level || '—' },
      ...(type === 'past_paper'
        ? [
            { accessorKey: 'exam_year', header: 'Year', Cell: ({ row }) => row.original.exam_year || '—' },
            { accessorKey: 'exam_body', header: 'Body', Cell: ({ row }) => row.original.exam_body || '—' },
            { accessorKey: 'paper_code', header: 'Code', Cell: ({ row }) => row.original.paper_code || '—' },
          ]
        : [
            {
              accessorKey: 'link',
              header: 'Source',
              Cell: ({ row }) =>
                row.original.external_url || row.original.file_path ? (
                  <span className="truncate text-xs text-sky-700">Available</span>
                ) : (
                  '—'
                ),
            },
          ]),
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => (
          <Chip size="sm" variant="flat" color={row.original.status === 'published' ? 'success' : 'default'}>
            {row.original.status}
          </Chip>
        ),
      },
      {
        accessorKey: 'views',
        header: 'Views',
        Cell: ({ row }) => row.original.view_count ?? 0,
      },
      {
        id: 'actions',
        header: '',
        Cell: ({ row }) => (
          <FormButton size="sm" appearance="flat" color="danger" onPress={() => archiveMut.mutate(row.original.id)}>
            Archive
          </FormButton>
        ),
      },
    ],
    [type, archiveMut],
  )

  return (
    <div className="space-y-4">
      <DataTable
        isLoading={listQ.isLoading} columns={columns} data={listQ.data?.resources || []} emptyMessage={`No ${meta.label.toLowerCase()} yet.`}
        searchPlaceholder="Search title, code…"
        search={q}
        onSearchChange={setQ}
        onRefresh={() => listQ.refetch()}
        isRefreshing={listQ.isFetching}
        toolbarActions={
          <FormButton className="h-8 min-h-8 bg-[#12544f]" color="primary" startContent={<Plus className="h-4 w-4" />} onPress={() => sheet.onOpen()}>
            Add {meta.label.slice(0, -1).toLowerCase()}
          </FormButton>
        }
      />

      <SideSheet isOpen={sheet.isOpen} onOpenChange={sheet.onOpenChange} title={`Add ${meta.label.slice(0, -1).toLowerCase()}`} size="lg">
        <div className="space-y-3">
          <FormField label="Title" required>
            <FormInput value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder={type === 'past_paper' ? 'e.g. Basic Mathematics FTNA 2024' : 'Resource title'} />
          </FormField>
          <FormField label="Description">
            <FormTextarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Subject">
              <FormSelect options={lookups.subjects} value={form.subject_id} onChange={(v) => setForm((f) => ({ ...f, subject_id: v }))} placeholder="Optional" />
            </FormField>
            <FormField label="Class">
              <FormSelect options={lookups.classes} value={form.classroom_id} onChange={(v) => setForm((f) => ({ ...f, classroom_id: v }))} placeholder="Optional" />
            </FormField>
            <FormField label="Education level">
              <FormSelect options={lookups.levels} value={form.education_level_id} onChange={(v) => setForm((f) => ({ ...f, education_level_id: v }))} placeholder="Optional" />
            </FormField>
            <FormField label="Class level label">
              <FormInput value={form.class_level} onChange={(e) => setForm((f) => ({ ...f, class_level: e.target.value }))} placeholder="Form II / STD IV" />
            </FormField>
          </div>
          {type === 'past_paper' && (
            <div className="grid gap-3 sm:grid-cols-3">
              <FormField label="Exam body">
                <FormSelect
                  options={[
                    { value: 'NECTA', label: 'NECTA' },
                    { value: 'mock', label: 'School mock' },
                    { value: 'zonal', label: 'Zonal' },
                    { value: 'other', label: 'Other' },
                  ]}
                  value={form.exam_body}
                  onChange={(v) => setForm((f) => ({ ...f, exam_body: v }))}
                />
              </FormField>
              <FormField label="Exam year">
                <FormInput type="number" value={form.exam_year} onChange={(e) => setForm((f) => ({ ...f, exam_year: e.target.value }))} placeholder="2024" />
              </FormField>
              <FormField label="Paper code">
                <FormInput value={form.paper_code} onChange={(e) => setForm((f) => ({ ...f, paper_code: e.target.value }))} placeholder="041" />
              </FormField>
            </div>
          )}
          <FormField label="External URL">
            <FormInput value={form.external_url} onChange={(e) => setForm((f) => ({ ...f, external_url: e.target.value }))} placeholder="https://… or YouTube link" />
          </FormField>
          <FormField label="File path / storage key">
            <FormInput value={form.file_path} onChange={(e) => setForm((f) => ({ ...f, file_path: e.target.value }))} placeholder="Optional storage path" />
          </FormField>
          <FormField label="Language">
            <FormSelect
              options={[
                { value: 'en', label: 'English' },
                { value: 'sw', label: 'Kiswahili' },
                { value: 'both', label: 'Both' },
              ]}
              value={form.language}
              onChange={(v) => setForm((f) => ({ ...f, language: v }))}
            />
          </FormField>
          <FormButton
            className="w-full bg-[#12544f]"
            color="primary"
            isLoading={mut.isPending}
            onPress={() =>
              mut.mutate({
                type,
                title: form.title,
                description: form.description || null,
                subject_id: form.subject_id ? Number(form.subject_id) : null,
                classroom_id: form.classroom_id ? Number(form.classroom_id) : null,
                education_level_id: form.education_level_id ? Number(form.education_level_id) : null,
                external_url: form.external_url || null,
                file_path: form.file_path || null,
                exam_body: form.exam_body || null,
                exam_year: form.exam_year ? Number(form.exam_year) : null,
                paper_code: form.paper_code || null,
                class_level: form.class_level || null,
                language: form.language || null,
                status: form.status,
              })
            }
          >
            Publish
          </FormButton>
        </div>
      </SideSheet>
    </div>
  )
}

// ── Smart classroom ──────────────────────────────────────────────

function ClassroomSection() {
  const qc = useQueryClient()
  const courseSheet = useDisclosure()
  const lessonSheet = useDisclosure()
  const lookups = useLookups()
  const [selectedId, setSelectedId] = useState(null)
  const [courseForm, setCourseForm] = useState({
    title: '', code: '', description: '', classroom_id: '', subject_id: '', status: 'active',
  })
  const [lessonForm, setLessonForm] = useState({
    title: '', summary: '', content: '', video_url: '', duration_minutes: '',
  })

  const listQ = useQuery({ queryKey: ['learning', 'courses'], queryFn: () => listCourses() })
  const detailQ = useQuery({
    queryKey: ['learning', 'course', selectedId],
    queryFn: () => getCourse(selectedId),
    enabled: !!selectedId,
  })

  const courseMut = useMutation({
    mutationFn: createCourse,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['learning', 'courses'] })
      toastSuccess('Course created')
      courseSheet.onClose()
      if (data?.course?.id) setSelectedId(data.course.id)
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })

  const lessonMut = useMutation({
    mutationFn: createLesson,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['learning', 'course', selectedId] })
      qc.invalidateQueries({ queryKey: ['learning', 'courses'] })
      toastSuccess('Lesson added')
      lessonSheet.onClose()
      setLessonForm({ title: '', summary: '', content: '', video_url: '', duration_minutes: '' })
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })

  const courses = listQ.data?.courses || []
  const course = detailQ.data?.course

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <FormButton appearance="bordered" startContent={<RefreshCw className="h-4 w-4" />} onPress={() => listQ.refetch()}>
          Refresh
        </FormButton>
        <FormButton className="bg-[#12544f]" color="primary" startContent={<Plus className="h-4 w-4" />} onPress={() => courseSheet.onOpen()}>
          New course
        </FormButton>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)] lg:col-span-2">
          <CardBody className="p-0">
            {listQ.isLoading ? (
              <SectionSkeleton />
            ) : courses.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">No courses yet. Create a smart classroom course for a class and subject.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {courses.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className={`w-full px-3 py-3 text-left transition-colors hover:bg-slate-50 ${selectedId === c.id ? 'bg-[#12544f]/5' : ''}`}
                      onClick={() => setSelectedId(c.id)}
                    >
                      <p className="text-sm font-semibold text-slate-900">{c.title}</p>
                      <p className="text-xs text-slate-500">
                        {[c.subject?.name, c.classroom?.name].filter(Boolean).join(' · ') || 'No class/subject'}
                        {' · '}
                        {c.lessons_count ?? 0} lessons
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)] lg:col-span-3">
          <CardBody className="space-y-3 p-4">
            {!selectedId ? (
              <p className="text-sm text-slate-500">Select a course to view lessons.</p>
            ) : detailQ.isLoading ? (
              <SectionSkeleton />
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{course?.title}</h3>
                    <p className="text-xs text-slate-500">
                      {[course?.subject?.name, course?.classroom?.name, staffName(course?.teacher)].filter(Boolean).join(' · ')}
                    </p>
                    {course?.description ? <p className="mt-1 text-sm text-slate-600">{course.description}</p> : null}
                  </div>
                  <FormButton size="sm" className="bg-[#12544f]" color="primary" startContent={<Plus className="h-4 w-4" />} onPress={() => lessonSheet.onOpen()}>
                    Add lesson
                  </FormButton>
                </div>
                <div className="space-y-2">
                  {(course?.lessons || []).length === 0 ? (
                    <p className="text-sm text-slate-500">No lessons in this course yet.</p>
                  ) : (
                    (course?.lessons || []).map((l, idx) => (
                      <div key={l.id} className="rounded-lg border border-slate-100 px-3 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              <span className="mr-2 text-xs text-slate-400">{idx + 1}.</span>
                              {l.title}
                            </p>
                            {l.summary ? <p className="text-xs text-slate-500">{l.summary}</p> : null}
                            {l.video_url ? (
                              <a href={l.video_url} target="_blank" rel="noreferrer" className="text-xs text-sky-700 hover:underline">
                                Open video
                              </a>
                            ) : null}
                          </div>
                          <Chip size="sm" variant="flat">{l.status}</Chip>
                        </div>
                        {l.content ? <p className="mt-1 line-clamp-3 text-xs text-slate-600">{l.content}</p> : null}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>

      <SideSheet isOpen={courseSheet.isOpen} onOpenChange={courseSheet.onOpenChange} title="New course" size="md">
        <div className="space-y-3">
          <FormField label="Title" required>
            <FormInput value={courseForm.title} onChange={(e) => setCourseForm((f) => ({ ...f, title: e.target.value }))} placeholder="Form 2 Mathematics" />
          </FormField>
          <FormField label="Code">
            <FormInput value={courseForm.code} onChange={(e) => setCourseForm((f) => ({ ...f, code: e.target.value }))} />
          </FormField>
          <FormField label="Subject">
            <FormSelect options={lookups.subjects} value={courseForm.subject_id} onChange={(v) => setCourseForm((f) => ({ ...f, subject_id: v }))} placeholder="Optional" />
          </FormField>
          <FormField label="Class">
            <FormSelect options={lookups.classes} value={courseForm.classroom_id} onChange={(v) => setCourseForm((f) => ({ ...f, classroom_id: v }))} placeholder="Optional" />
          </FormField>
          <FormField label="Description">
            <FormTextarea value={courseForm.description} onChange={(e) => setCourseForm((f) => ({ ...f, description: e.target.value }))} />
          </FormField>
          <FormButton
            className="w-full bg-[#12544f]"
            color="primary"
            isLoading={courseMut.isPending}
            onPress={() =>
              courseMut.mutate({
                title: courseForm.title,
                code: courseForm.code || null,
                description: courseForm.description || null,
                subject_id: courseForm.subject_id ? Number(courseForm.subject_id) : null,
                classroom_id: courseForm.classroom_id ? Number(courseForm.classroom_id) : null,
                status: 'active',
              })
            }
          >
            Create course
          </FormButton>
        </div>
      </SideSheet>

      <SideSheet isOpen={lessonSheet.isOpen} onOpenChange={lessonSheet.onOpenChange} title="Add lesson" size="md">
        <div className="space-y-3">
          <FormField label="Title" required>
            <FormInput value={lessonForm.title} onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))} />
          </FormField>
          <FormField label="Summary">
            <FormInput value={lessonForm.summary} onChange={(e) => setLessonForm((f) => ({ ...f, summary: e.target.value }))} />
          </FormField>
          <FormField label="Content / notes">
            <FormTextarea value={lessonForm.content} onChange={(e) => setLessonForm((f) => ({ ...f, content: e.target.value }))} />
          </FormField>
          <FormField label="Video URL">
            <FormInput value={lessonForm.video_url} onChange={(e) => setLessonForm((f) => ({ ...f, video_url: e.target.value }))} />
          </FormField>
          <FormField label="Duration (minutes)">
            <FormInput type="number" value={lessonForm.duration_minutes} onChange={(e) => setLessonForm((f) => ({ ...f, duration_minutes: e.target.value }))} />
          </FormField>
          <FormButton
            className="w-full bg-[#12544f]"
            color="primary"
            isLoading={lessonMut.isPending}
            isDisabled={!selectedId}
            onPress={() =>
              lessonMut.mutate({
                course_id: selectedId,
                title: lessonForm.title,
                summary: lessonForm.summary || null,
                content: lessonForm.content || null,
                video_url: lessonForm.video_url || null,
                duration_minutes: lessonForm.duration_minutes ? Number(lessonForm.duration_minutes) : null,
              })
            }
          >
            Add lesson
          </FormButton>
        </div>
      </SideSheet>
    </div>
  )
}

// ── Assignments ──────────────────────────────────────────────────

function AssignmentsSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const gradeSheet = useDisclosure()
  const submitSheet = useDisclosure()
  const lookups = useLookups()
  const studentsQ = useQuery({
    queryKey: ['students', 'learning'],
    queryFn: () => listStudents({ per_page: 100, status: 'active' }),
    staleTime: 60_000,
  })
  const [form, setForm] = useState({
    title: '', description: '', instructions: '', classroom_id: '', subject_id: '',
    type: 'homework', due_at: '', max_score: '100', status: 'published',
  })
  const [gradeForm, setGradeForm] = useState({ id: null, score: '', feedback: '', grade: '' })
  const [submitForm, setSubmitForm] = useState({ assignment_id: '', student_id: '', content: '' })

  const listQ = useQuery({
    queryKey: ['learning', 'assignments'],
    queryFn: () => listAssignments({ per_page: 50 }),
  })
  const subsQ = useQuery({
    queryKey: ['learning', 'submissions', 'ungraded'],
    queryFn: () => listAssignmentSubmissions({ ungraded: 1, per_page: 30 }),
  })

  const createMut = useMutation({
    mutationFn: createAssignment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['learning'] })
      toastSuccess('Assignment published')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })

  const submitMut = useMutation({
    mutationFn: createAssignmentSubmission,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['learning'] })
      toastSuccess('Submission recorded')
      submitSheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })

  const gradeMut = useMutation({
    mutationFn: ({ id, ...payload }) => gradeAssignmentSubmission(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['learning'] })
      toastSuccess('Feedback saved')
      gradeSheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })

  const columns = useMemo(
    () => [
      { accessorKey: 'title', header: 'Title' },
      { accessorKey: 'type', header: 'Type', Cell: ({ row }) => <Chip size="sm" variant="flat">{row.original.type}</Chip> },
      { accessorKey: 'subject', header: 'Subject', Cell: ({ row }) => row.original.subject?.name || '—' },
      { accessorKey: 'classroom', header: 'Class', Cell: ({ row }) => row.original.classroom?.name || '—' },
      {
        accessorKey: 'due_at',
        header: 'Due',
        Cell: ({ row }) => (row.original.due_at ? String(row.original.due_at).slice(0, 16).replace('T', ' ') : '—'),
      },
      { accessorKey: 'submissions_count', header: 'Subs', Cell: ({ row }) => row.original.submissions_count ?? 0 },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => <Chip size="sm" variant="flat" color={row.original.status === 'published' ? 'success' : 'default'}>{row.original.status}</Chip>,
      },
      {
        id: 'actions',
        header: '',
        Cell: ({ row }) => (
          <FormButton
            size="sm"
            appearance="flat"
            onPress={() => {
              setSubmitForm((f) => ({ ...f, assignment_id: String(row.original.id) }))
              submitSheet.onOpen()
            }}
          >
            Record submit
          </FormButton>
        ),
      },
    ],
    [submitSheet],
  )

  const subColumns = useMemo(
    () => [
      { accessorKey: 'student', header: 'Student', Cell: ({ row }) => studentLabel(row.original.student) },
      { accessorKey: 'assignment', header: 'Assignment', Cell: ({ row }) => row.original.assignment?.title || '—' },
      {
        accessorKey: 'submitted_at',
        header: 'Submitted',
        Cell: ({ row }) => (row.original.submitted_at ? String(row.original.submitted_at).slice(0, 16).replace('T', ' ') : '—'),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => <Chip size="sm" variant="flat" color={row.original.status === 'late' ? 'warning' : 'primary'}>{row.original.status}</Chip>,
      },
      {
        id: 'grade',
        header: '',
        Cell: ({ row }) => (
          <FormButton
            size="sm"
            appearance="flat"
            color="success"
            onPress={() => {
              setGradeForm({ id: row.original.id, score: '', feedback: '', grade: '' })
              gradeSheet.onOpen()
            }}
          >
            Grade
          </FormButton>
        ),
      },
    ],
    [gradeSheet],
  )

  return (
    <div className="space-y-5">
      <div className="flex justify-end gap-2">
        <FormButton appearance="bordered" startContent={<RefreshCw className="h-4 w-4" />} onPress={() => { listQ.refetch(); subsQ.refetch() }}>
          Refresh
        </FormButton>
        <FormButton className="bg-[#12544f]" color="primary" startContent={<Plus className="h-4 w-4" />} onPress={() => sheet.onOpen()}>
          New assignment
        </FormButton>
      </div>

      {listQ.isLoading ? (
        <SectionSkeleton />
      ) : (
        <DataTable columns={columns} data={listQ.data?.assignments || []} emptyMessage="No assignments yet." />
      )}

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-900">Pending grading</h3>
        {subsQ.isLoading ? (
          <Spinner size="sm" color="success" />
        ) : (
          <DataTable columns={subColumns} data={subsQ.data?.submissions || []} emptyMessage="No ungraded submissions." />
        )}
      </div>

      <SideSheet isOpen={sheet.isOpen} onOpenChange={sheet.onOpenChange} title="Create assignment" size="lg">
        <div className="space-y-3">
          <FormField label="Title" required>
            <FormInput value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </FormField>
          <FormField label="Type">
            <FormSelect
              options={[
                { value: 'homework', label: 'Homework' },
                { value: 'assignment', label: 'Assignment' },
                { value: 'quiz', label: 'Quiz' },
                { value: 'project', label: 'Project' },
              ]}
              value={form.type}
              onChange={(v) => setForm((f) => ({ ...f, type: v }))}
            />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Subject">
              <FormSelect options={lookups.subjects} value={form.subject_id} onChange={(v) => setForm((f) => ({ ...f, subject_id: v }))} placeholder="Optional" />
            </FormField>
            <FormField label="Class">
              <FormSelect options={lookups.classes} value={form.classroom_id} onChange={(v) => setForm((f) => ({ ...f, classroom_id: v }))} placeholder="Optional" />
            </FormField>
          </div>
          <FormField label="Due date">
            <FormInput type="datetime-local" value={form.due_at} onChange={(e) => setForm((f) => ({ ...f, due_at: e.target.value }))} />
          </FormField>
          <FormField label="Max score">
            <FormInput type="number" value={form.max_score} onChange={(e) => setForm((f) => ({ ...f, max_score: e.target.value }))} />
          </FormField>
          <FormField label="Description">
            <FormTextarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </FormField>
          <FormField label="Instructions">
            <FormTextarea value={form.instructions} onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))} />
          </FormField>
          <FormButton
            className="w-full bg-[#12544f]"
            color="primary"
            isLoading={createMut.isPending}
            onPress={() =>
              createMut.mutate({
                title: form.title,
                type: form.type,
                description: form.description || null,
                instructions: form.instructions || null,
                subject_id: form.subject_id ? Number(form.subject_id) : null,
                classroom_id: form.classroom_id ? Number(form.classroom_id) : null,
                due_at: form.due_at || null,
                max_score: Number(form.max_score || 100),
                status: 'published',
              })
            }
          >
            Publish assignment
          </FormButton>
        </div>
      </SideSheet>

      <SideSheet isOpen={submitSheet.isOpen} onOpenChange={submitSheet.onOpenChange} title="Record submission" size="md">
        <div className="space-y-3">
          <FormField label="Student" required>
            <FormSelect
              options={(studentsQ.data?.students || []).map((s) => ({ value: String(s.id), label: studentLabel(s) }))}
              value={submitForm.student_id}
              onChange={(v) => setSubmitForm((f) => ({ ...f, student_id: v }))}
            />
          </FormField>
          <FormField label="Work / answer">
            <FormTextarea value={submitForm.content} onChange={(e) => setSubmitForm((f) => ({ ...f, content: e.target.value }))} />
          </FormField>
          <FormButton
            className="w-full bg-[#12544f]"
            color="primary"
            isLoading={submitMut.isPending}
            onPress={() =>
              submitMut.mutate({
                assignment_id: Number(submitForm.assignment_id),
                student_id: Number(submitForm.student_id),
                content: submitForm.content || null,
              })
            }
          >
            Submit
          </FormButton>
        </div>
      </SideSheet>

      <SideSheet isOpen={gradeSheet.isOpen} onOpenChange={gradeSheet.onOpenChange} title="Grade & feedback" size="md">
        <div className="space-y-3">
          <FormField label="Score" required>
            <FormInput type="number" value={gradeForm.score} onChange={(e) => setGradeForm((f) => ({ ...f, score: e.target.value }))} />
          </FormField>
          <FormField label="Grade letter (optional)">
            <FormInput value={gradeForm.grade} onChange={(e) => setGradeForm((f) => ({ ...f, grade: e.target.value }))} placeholder="A–F (auto if empty)" />
          </FormField>
          <FormField label="Teacher feedback">
            <FormTextarea value={gradeForm.feedback} onChange={(e) => setGradeForm((f) => ({ ...f, feedback: e.target.value }))} />
          </FormField>
          <FormButton
            className="w-full bg-[#12544f]"
            color="primary"
            isLoading={gradeMut.isPending}
            onPress={() =>
              gradeMut.mutate({
                id: gradeForm.id,
                score: Number(gradeForm.score),
                grade: gradeForm.grade || null,
                feedback: gradeForm.feedback || null,
              })
            }
          >
            Save feedback
          </FormButton>
        </div>
      </SideSheet>
    </div>
  )
}

export default function LearningWorkspace() {
  const { pathname } = useLocation()
  const meta = META[pathname] || META['/learning']

  let body
  switch (meta.section) {
    case 'overview':
      body = <OverviewSection />
      break
    case 'classroom':
      body = <ClassroomSection />
      break
    case 'resources':
      body = <ResourcesSection type={meta.type || 'note'} />
      break
    case 'assignments':
      body = <AssignmentsSection />
      break
    default:
      body = <OverviewSection />
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title={meta.title}
          description={meta.desc}
          breadcrumbs={[
            { label: 'Learning', href: '/learning' },
            { label: meta.title },
          ]}
        />
        {body}
      </div>
    </DashboardLayout>
  )
}
