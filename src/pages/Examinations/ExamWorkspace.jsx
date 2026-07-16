import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../auth'
import {
  Card,
  CardHeader,
  CardBody,
  Chip,
  Spinner,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Progress,
} from '@heroui/react'
import {
  ClipboardList,
  Lock,
  Unlock,
  CheckCircle2,
  BarChart3,
  Trophy,
  BookOpen,
  Calendar,
  PencilLine,
  FileText,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import PageHeader from '../../components/Layout/PageHeader.jsx'
import {
  FormField,
  FormInput,
  FormSelect,
  FormButton,
} from '../../components/Form'
import { toastSuccess, toastError } from '../../components/Toast'
import {
  listAssessments,
  createAssessment,
  deleteAssessment,
  getAssessmentResults,
  saveAssessmentResults,
  publishAssessment,
  unpublishAssessment,
  lockAssessment,
  unlockAssessment,
  examRanking,
  examSubjectAnalysis,
  listExamTypes,
  getReportCard,
  openReportCardHtml,
  listYears,
  listTerms,
  listClasses,
  listSubjects,
  listStudents,
} from '../../api/domain.js'
import {
  EXAM_TYPE_OPTIONS,
  TYPE_LABEL,
  sectionFromPath,
  SECTION_META,
  WORKFLOW_STEPS,
  NECTA_BANDS,
  gradeFromPercent,
  defaultTypeForSection,
} from './examConstants.js'
import {
  filterClassesBySchoolStages,
  classSelectLabel,
  formatStagesSummary,
} from '../../config/educationStages.js'

const emptyForm = () => ({
  name: '',
  type: 'terminal',
  academic_year_id: '',
  term_id: '',
  classroom_id: '',
  subject_id: '',
  max_score: '100',
  weight: '1',
  date: '',
})

const REPORT_KIND_OPTIONS = [
  { value: 'terminal', label: 'Terminal report card' },
  { value: 'annual', label: 'Annual report' },
  { value: 'progress', label: 'Progress report' },
  { value: 'transcript', label: 'Transcript' },
]

function reportKindFromPath(pathname) {
  if (!pathname) return 'terminal'
  if (pathname.includes('/annual')) return 'annual'
  if (pathname.includes('/progress')) return 'progress'
  if (pathname.includes('/transcript')) return 'transcript'
  if (pathname.includes('/terminal')) return 'terminal'
  return 'terminal'
}

function StatusChips({ a }) {
  return (
    <div className="flex flex-wrap gap-1">
      <Chip
        size="sm"
        variant="flat"
        color={a.is_published ? 'success' : 'warning'}
        className="h-5 text-[10px]"
      >
        {a.is_published ? 'Published' : 'Draft'}
      </Chip>
      {a.is_locked ? (
        <Chip size="sm" variant="flat" color="danger" className="h-5 text-[10px]">
          Locked
        </Chip>
      ) : (
        <Chip size="sm" variant="flat" className="h-5 text-[10px]">
          Editable
        </Chip>
      )}
      {a.results_count != null ? (
        <Chip size="sm" variant="flat" className="h-5 text-[10px]">
          {a.results_count} marks
        </Chip>
      ) : null}
    </div>
  )
}

function EmptyHint({ title, children, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-10 text-center">
      <AlertCircle className="h-5 w-5 text-zinc-400" />
      <p className="text-sm font-medium text-zinc-700">{title}</p>
      {children ? (
        <p className="max-w-md text-[12px] text-zinc-500">{children}</p>
      ) : null}
      {action}
    </div>
  )
}

function ExamWorkspace() {
  const location = useLocation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { school: authSchool, session } = useAuth()
  const section = sectionFromPath(location.pathname)
  const meta = SECTION_META[section] || SECTION_META.overview
  const forcedType = defaultTypeForSection(section)
  const schoolStages =
    authSchool?.education_stages ||
    session?.school?.education_stages ||
    session?.user?.school?.education_stages ||
    []

  const [form, setForm] = useState(emptyForm)
  const [selectedAssessment, setSelectedAssessment] = useState('')
  const [scores, setScores] = useState({})
  const [typeFilter, setTypeFilter] = useState('')
  const [listFilters, setListFilters] = useState({
    classroom_id: '',
    academic_year_id: '',
    term_id: '',
  })
  const [rankParams, setRankParams] = useState({
    classroom_id: '',
    academic_year_id: '',
    term_id: '',
  })
  const [analysisParams, setAnalysisParams] = useState({
    classroom_id: '',
    academic_year_id: '',
    term_id: '',
    subject_id: '',
  })
  const [reportParams, setReportParams] = useState({
    student_id: '', // '' | 'all' | numeric id string
    academic_year_id: '',
    term_id: '',
    classroom_id: '',
    report_kind: 'terminal', // terminal | annual | progress | transcript
  })
  const [report, setReport] = useState(null)
  const [reportBatch, setReportBatch] = useState([]) // when generating all
  const [rankData, setRankData] = useState(null)
  const [analysisData, setAnalysisData] = useState(null)
  const [rankLoading, setRankLoading] = useState(false)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)

  // Sync type filter + form type with section (CA / homework / practical)
  useEffect(() => {
    if (forcedType) {
      setTypeFilter(forcedType)
      setForm((f) => ({ ...f, type: forcedType }))
    } else if (section === 'scheduling' || section === 'overview') {
      setTypeFilter('')
    }
  }, [section, forcedType])

  // Report kind follows report-cards nav path when present
  useEffect(() => {
    if (section === 'reports') {
      setReportParams((f) => ({
        ...f,
        report_kind: reportKindFromPath(location.pathname),
      }))
    }
  }, [section, location.pathname])

  const assessmentsQ = useQuery({
    queryKey: [
      'exams',
      'assessments',
      typeFilter,
      listFilters.classroom_id,
      listFilters.academic_year_id,
      listFilters.term_id,
    ],
    queryFn: () =>
      listAssessments({
        type: typeFilter || undefined,
        classroom_id: listFilters.classroom_id || undefined,
        academic_year_id: listFilters.academic_year_id || undefined,
        term_id: listFilters.term_id || undefined,
      }),
  })
  const typesQ = useQuery({
    queryKey: ['exams', 'types'],
    queryFn: listExamTypes,
  })
  const yearsQ = useQuery({ queryKey: ['academic', 'years'], queryFn: listYears })
  const termsYearId =
    form.academic_year_id ||
    listFilters.academic_year_id ||
    reportParams.academic_year_id ||
    rankParams.academic_year_id ||
    analysisParams.academic_year_id
  const termsQ = useQuery({
    queryKey: ['academic', 'terms', termsYearId],
    queryFn: () =>
      listTerms({
        academic_year_id: termsYearId || undefined,
      }),
  })
  const classesQ = useQuery({
    queryKey: ['academic', 'classes'],
    queryFn: listClasses,
  })
  const subjectsQ = useQuery({
    queryKey: ['academic', 'subjects'],
    queryFn: () => listSubjects(),
  })
  const studentsQ = useQuery({
    queryKey: ['students', 'exam-roster', selectedAssessment],
    queryFn: () => listStudents({ per_page: 200, status: 'active' }),
  })
  /** Learners in the class selected for report cards */
  const reportStudentsQ = useQuery({
    queryKey: [
      'students',
      'report-class',
      reportParams.classroom_id,
      reportParams.academic_year_id,
    ],
    queryFn: () =>
      listStudents({
        per_page: 200,
        status: 'active',
        classroom_id: reportParams.classroom_id,
      }),
    enabled: Boolean(reportParams.classroom_id) && section === 'reports',
  })

  const resultsQ = useQuery({
    queryKey: ['exams', 'results', selectedAssessment],
    queryFn: () => getAssessmentResults(selectedAssessment),
    enabled: Boolean(selectedAssessment),
  })

  const assessments = assessmentsQ.data?.assessments || []
  const years = yearsQ.data?.academic_years || []
  const terms = termsQ.data?.terms || []
  /** Classes limited to this school's education stages (API + client) */
  const classes = useMemo(() => {
    const raw = classesQ.data?.classes || []
    const stages =
      classesQ.data?.school_education_stages?.length
        ? classesQ.data.school_education_stages
        : schoolStages
    return filterClassesBySchoolStages(raw, stages)
  }, [classesQ.data, schoolStages])

  // Drop selected class if it is outside school education stages
  // (must run after `classes` is defined — avoid TDZ / blank page)
  useEffect(() => {
    if (!classes.length) return
    const ids = new Set(classes.map((c) => String(c.id)))
    setReportParams((f) =>
      f.classroom_id && !ids.has(String(f.classroom_id))
        ? { ...f, classroom_id: '', student_id: '' }
        : f,
    )
    setRankParams((f) =>
      f.classroom_id && !ids.has(String(f.classroom_id))
        ? { ...f, classroom_id: '' }
        : f,
    )
    setAnalysisParams((f) =>
      f.classroom_id && !ids.has(String(f.classroom_id))
        ? { ...f, classroom_id: '' }
        : f,
    )
    setForm((f) =>
      f.classroom_id && !ids.has(String(f.classroom_id))
        ? { ...f, classroom_id: '' }
        : f,
    )
    setListFilters((f) =>
      f.classroom_id && !ids.has(String(f.classroom_id))
        ? { ...f, classroom_id: '' }
        : f,
    )
  }, [classes])

  const subjects = subjectsQ.data?.subjects || []
  const students = studentsQ.data?.students || []
  const reportClassStudents = reportStudentsQ.data?.students || []
  const assessment = resultsQ.data?.assessment
  const existingResults = resultsQ.data?.results || []
  const currentYear = years.find((y) => y.is_current) || years[0]
  const grading = typesQ.data?.grading
  const typeCatalog = typesQ.data?.types || EXAM_TYPE_OPTIONS

  const createMut = useMutation({
    mutationFn: createAssessment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exams', 'assessments'] })
      toastSuccess('Assessment scheduled', 'Continue with marks entry when ready.')
      setForm((f) => ({
        ...emptyForm(),
        academic_year_id: f.academic_year_id,
        term_id: f.term_id,
        type: forcedType || f.type || 'terminal',
        classroom_id: f.classroom_id,
      }))
    },
    onError: (e) => toastError('Could not create assessment', e.message),
  })

  const saveMut = useMutation({
    mutationFn: ({ id, results }) => saveAssessmentResults(id, { results }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exams', 'results', selectedAssessment] })
      qc.invalidateQueries({ queryKey: ['exams', 'assessments'] })
      toastSuccess('Marks saved', 'NECTA grades applied automatically')
    },
    onError: (e) => toastError('Could not save marks', e.message),
  })

  const publishMut = useMutation({
    mutationFn: publishAssessment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exams', 'assessments'] })
      toastSuccess('Assessment approved / published')
    },
    onError: (e) => toastError('Publish failed', e.message),
  })
  const unpublishMut = useMutation({
    mutationFn: unpublishAssessment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exams', 'assessments'] })
      toastSuccess('Assessment unpublished')
    },
    onError: (e) => toastError('Unpublish failed', e.message),
  })
  const lockMut = useMutation({
    mutationFn: lockAssessment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exams', 'assessments'] })
      toastSuccess('Results locked')
    },
    onError: (e) => toastError('Lock failed', e.message),
  })
  const unlockMut = useMutation({
    mutationFn: unlockAssessment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exams', 'assessments'] })
      toastSuccess('Results unlocked')
    },
    onError: (e) => toastError('Unlock failed', e.message),
  })
  const deleteMut = useMutation({
    mutationFn: deleteAssessment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exams', 'assessments'] })
      toastSuccess('Assessment deleted')
      if (selectedAssessment) setSelectedAssessment('')
    },
    onError: (e) => toastError('Delete failed', e.message),
  })

  useEffect(() => {
    if (!currentYear) return
    const yid = String(currentYear.id)
    setForm((f) => (f.academic_year_id ? f : { ...f, academic_year_id: yid }))
    setListFilters((f) =>
      f.academic_year_id ? f : { ...f, academic_year_id: yid },
    )
    setRankParams((f) =>
      f.academic_year_id ? f : { ...f, academic_year_id: yid },
    )
    setAnalysisParams((f) =>
      f.academic_year_id ? f : { ...f, academic_year_id: yid },
    )
    setReportParams((f) =>
      f.academic_year_id ? f : { ...f, academic_year_id: yid },
    )
  }, [currentYear])

  const studentClassId = (s) =>
    s.classroom?.id ?? s.current_enrollment?.classroom?.id ?? s.currentEnrollment?.classroom?.id

  const buildRosterScores = useCallback(() => {
    if (!resultsQ.data) return
    const classId = resultsQ.data.assessment?.classroom_id
    const classStudents = students.filter(
      (s) => !classId || String(studentClassId(s)) === String(classId),
    )
    const next = {}
    classStudents.forEach((s) => {
      const existing = existingResults.find((r) => r.student_id === s.id)
      next[s.id] = existing?.score != null ? String(existing.score) : ''
    })
    existingResults.forEach((r) => {
      if (next[r.student_id] === undefined) {
        next[r.student_id] = r.score != null ? String(r.score) : ''
      }
    })
    setScores(next)
  }, [resultsQ.data, students, existingResults])

  // Auto-load roster when assessment results arrive
  useEffect(() => {
    if (selectedAssessment && resultsQ.data) {
      buildRosterScores()
    }
  }, [selectedAssessment, resultsQ.dataUpdatedAt, students.length, buildRosterScores])

  const studentName = (id) => {
    const s = students.find((x) => x.id === id)
    if (s) return s.full_name
    const r = existingResults.find((x) => x.student_id === id)
    return r?.student
      ? `${r.student.first_name || ''} ${r.student.last_name || ''}`.trim() ||
          r.student.full_name
      : `#${id}`
  }

  const submitCreate = () => {
    const type = forcedType || form.type || 'terminal'
    if (!form.name.trim() || !form.academic_year_id) {
      toastError('Missing fields', 'Title and academic year are required.')
      return
    }
    createMut.mutate({
      name: form.name.trim(),
      type,
      academic_year_id: Number(form.academic_year_id),
      term_id: form.term_id ? Number(form.term_id) : null,
      classroom_id: form.classroom_id ? Number(form.classroom_id) : null,
      subject_id: form.subject_id ? Number(form.subject_id) : null,
      max_score: Number(form.max_score || 100),
      weight: Number(form.weight || 1),
      date: form.date || null,
    })
  }

  const saveMarks = () => {
    if (assessment?.is_locked) {
      toastError('Locked', 'Unlock this assessment before editing marks.')
      return
    }
    const max = Number(assessment?.max_score || 100)
    const results = Object.entries(scores)
      .filter(([, score]) => score !== '' && score != null)
      .map(([student_id, score]) => ({
        student_id: Number(student_id),
        score: Math.min(Number(score), max),
      }))
    if (!results.length) {
      toastError('No scores', 'Enter at least one score before saving.')
      return
    }
    saveMut.mutate({ id: selectedAssessment, results })
  }

  const runRanking = async () => {
    if (!rankParams.classroom_id || !rankParams.academic_year_id) {
      toastError('Select class and year')
      return
    }
    setRankLoading(true)
    try {
      const data = await examRanking({
        classroom_id: rankParams.classroom_id,
        academic_year_id: rankParams.academic_year_id,
        term_id: rankParams.term_id || undefined,
      })
      setRankData(data)
      toastSuccess('Ranking loaded', `${data.class_size || 0} learners ranked`)
    } catch (e) {
      toastError('Ranking failed', e.message)
    } finally {
      setRankLoading(false)
    }
  }

  const runAnalysis = async () => {
    if (!analysisParams.classroom_id || !analysisParams.academic_year_id) {
      toastError('Select class and year')
      return
    }
    setAnalysisLoading(true)
    try {
      const data = await examSubjectAnalysis({
        classroom_id: analysisParams.classroom_id,
        academic_year_id: analysisParams.academic_year_id,
        term_id: analysisParams.term_id || undefined,
        subject_id: analysisParams.subject_id || undefined,
      })
      setAnalysisData(data)
      toastSuccess('Analysis ready')
    } catch (e) {
      toastError('Analysis failed', e.message)
    } finally {
      setAnalysisLoading(false)
    }
  }

  const typeBreakdown = useMemo(() => {
    const map = {}
    assessments.forEach((a) => {
      map[a.type] = (map[a.type] || 0) + 1
    })
    return Object.entries(map).map(([type, count]) => ({
      type,
      label: TYPE_LABEL[type] || type,
      count,
      published: assessments.filter((a) => a.type === type && a.is_published)
        .length,
    }))
  }, [assessments])

  const overviewStats = [
    {
      label: 'Assessments',
      value: assessments.length,
      icon: ClipboardList,
      href: '/examinations/scheduling',
    },
    {
      label: 'Published',
      value: assessments.filter((a) => a.is_published).length,
      icon: CheckCircle2,
      href: '/examinations/approval',
    },
    {
      label: 'Locked',
      value: assessments.filter((a) => a.is_locked).length,
      icon: Lock,
      href: '/examinations/lock',
    },
    {
      label: 'Drafts',
      value: assessments.filter((a) => !a.is_published).length,
      icon: PencilLine,
      href: '/examinations/marks',
    },
  ]

  const quickLinks = [
    { label: 'Schedule exam', path: '/examinations/scheduling', icon: Calendar },
    { label: 'Enter marks', path: '/examinations/marks', icon: PencilLine },
    { label: 'Class ranking', path: '/examinations/ranking', icon: Trophy },
    { label: 'Subject analysis', path: '/examinations/analysis', icon: BarChart3 },
    { label: 'Exam types', path: '/examinations/types', icon: BookOpen },
    { label: 'Approve / publish', path: '/examinations/approval', icon: CheckCircle2 },
    { label: 'Lock results', path: '/examinations/lock', icon: Lock },
    { label: 'Report cards', path: '/report-cards', icon: FileText },
  ]

  const yearOptions = years.map((y) => ({
    value: String(y.id),
    label: `${y.name}${y.is_current ? ' (current)' : ''}`,
  }))
  const termOptions = terms.map((t) => ({ value: String(t.id), label: t.name }))
  const classOptions = classes.map((c) => ({
    value: String(c.id),
    label: classSelectLabel(c),
  }))
  const stagesHint = formatStagesSummary(
    classesQ.data?.school_education_stages?.length
      ? classesQ.data.school_education_stages
      : schoolStages,
  )
  const subjectOptions = subjects.map((s) => ({
    value: String(s.id),
    label: s.code ? `${s.name} (${s.code})` : s.name,
  }))

  const typeValue = forcedType || form.type
  const assessmentCreateForm = (
      <Card className="border border-zinc-200 shadow-none">
        <CardHeader className="flex flex-col items-start gap-0.5 px-4 py-3">
          <span className="text-sm font-semibold">Schedule assessment</span>
          <span className="text-[11px] font-normal text-zinc-500">
            {forcedType
              ? TYPE_LABEL[forcedType]
              : 'Pick type, class, subject and weight for terminal average'}
          </span>
        </CardHeader>
        <CardBody className="flex flex-col gap-3 px-4 pb-4">
          <FormField label="Title" required>
            <FormInput
              placeholder="e.g. Term 1 Mathematics CA 1"
              value={form.name}
              onValueChange={(v) => setForm((f) => ({ ...f, name: v }))}
            />
          </FormField>
          <FormField label="Type" required>
            <FormSelect
              label="Type"
              value={typeValue}
              isDisabled={Boolean(forcedType)}
              onChange={(v) => setForm((f) => ({ ...f, type: v }))}
              options={EXAM_TYPE_OPTIONS}
            />
          </FormField>
          <FormField label="Academic year" required>
            <FormSelect
              label="Year"
              value={form.academic_year_id}
              onChange={(v) =>
                setForm((f) => ({ ...f, academic_year_id: v, term_id: '' }))
              }
              options={yearOptions}
            />
          </FormField>
          <FormField label="Term">
            <FormSelect
              label="Term"
              placeholder="Optional"
              value={form.term_id}
              onChange={(v) => setForm((f) => ({ ...f, term_id: v }))}
              options={termOptions}
            />
          </FormField>
          <FormField label="Class" hint="Recommended for class-scoped marks">
            <FormSelect
              label="Class"
              placeholder="Optional"
              value={form.classroom_id}
              onChange={(v) => setForm((f) => ({ ...f, classroom_id: v }))}
              options={classOptions}
            />
          </FormField>
          <FormField label="Subject" hint="Recommended for subject analysis">
            <FormSelect
              label="Subject"
              placeholder="Optional"
              value={form.subject_id}
              onChange={(v) => setForm((f) => ({ ...f, subject_id: v }))}
              options={subjectOptions}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-2">
            <FormField label="Max score">
              <FormInput
                type="number"
                min={1}
                value={form.max_score}
                onValueChange={(v) => setForm((f) => ({ ...f, max_score: v }))}
              />
            </FormField>
            <FormField label="Weight" hint="Weighted terminal average">
              <FormInput
                type="number"
                min={0}
                step="0.1"
                value={form.weight}
                onValueChange={(v) => setForm((f) => ({ ...f, weight: v }))}
              />
            </FormField>
          </div>
          <FormField label="Date">
            <FormInput
              type="date"
              value={form.date}
              onValueChange={(v) => setForm((f) => ({ ...f, date: v }))}
            />
          </FormField>
          <FormButton isLoading={createMut.isPending} onPress={submitCreate}>
            Create assessment
          </FormButton>
        </CardBody>
      </Card>
  )

  const ListFiltersBar = ({ showType = true }) => (
    <div className="mb-2 flex flex-wrap items-end gap-2">
      {showType && !forcedType ? (
        <FormSelect
          className="w-full sm:w-52"
          placeholder="All types"
          value={typeFilter}
          onChange={setTypeFilter}
          options={EXAM_TYPE_OPTIONS}
        />
      ) : null}
      <FormSelect
        className="w-full sm:w-40"
        placeholder="All years"
        value={listFilters.academic_year_id}
        onChange={(v) =>
          setListFilters((f) => ({ ...f, academic_year_id: v, term_id: '' }))
        }
        options={yearOptions}
      />
      <FormSelect
        className="w-full sm:w-36"
        placeholder="All terms"
        value={listFilters.term_id}
        onChange={(v) => setListFilters((f) => ({ ...f, term_id: v }))}
        options={termOptions}
      />
      <FormSelect
        className="w-full sm:w-40"
        placeholder="All classes"
        value={listFilters.classroom_id}
        onChange={(v) => setListFilters((f) => ({ ...f, classroom_id: v }))}
        options={classOptions}
      />
      <span className="pb-2 text-[11px] text-zinc-400">
        {assessments.length} assessment(s)
      </span>
    </div>
  )

  const AssessmentTable = ({
    mode = 'full',
    empty = 'No assessments yet — schedule one to get started.',
  }) => {
    const showPublish = mode === 'full' || mode === 'approval'
    const showLock = mode === 'full' || mode === 'lock'
    const showDelete = mode === 'full'
    const showMarks = mode === 'full' || mode === 'marks'

    return (
      <Card className="border border-zinc-200 shadow-none">
        <CardBody className="p-2 sm:p-3">
          {assessmentsQ.isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner color="primary" />
            </div>
          ) : assessments.length === 0 ? (
            <EmptyHint title={empty}>
              Use the schedule form or go to Exam scheduling.
              <div className="mt-2">
                <FormButton
                  appearance="flat"
                  className="!h-8"
                  onPress={() => navigate('/examinations/scheduling')}
                >
                  Open scheduling
                </FormButton>
              </div>
            </EmptyHint>
          ) : (
            <Table shadow="none" aria-label="Assessments" className="min-w-full">
              <TableHeader>
                <TableColumn>ASSESSMENT</TableColumn>
                <TableColumn>SUBJECT</TableColumn>
                <TableColumn>CLASS</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {assessments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="text-[12px] font-medium text-zinc-900">
                        {a.name}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {TYPE_LABEL[a.type] || a.type}
                        {a.date ? ` · ${a.date}` : ''}
                        {a.weight != null ? ` · wt ${a.weight}` : ''}
                      </div>
                    </TableCell>
                    <TableCell className="text-[12px]">
                      {a.subject?.name || '—'}
                    </TableCell>
                    <TableCell className="text-[12px]">
                      {a.classroom?.name || '—'}
                    </TableCell>
                    <TableCell>
                      <StatusChips a={a} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {showMarks ? (
                          <FormButton
                            appearance="flat"
                            className="!h-7 min-h-7 text-[11px]"
                            onPress={() => {
                              setSelectedAssessment(String(a.id))
                              navigate('/examinations/marks')
                            }}
                          >
                            Marks
                          </FormButton>
                        ) : null}
                        {showPublish ? (
                          !a.is_published ? (
                            <FormButton
                              appearance="bordered"
                              className="!h-7 min-h-7 text-[11px]"
                              isLoading={publishMut.isPending}
                              onPress={() => publishMut.mutate(a.id)}
                            >
                              Publish
                            </FormButton>
                          ) : (
                            <FormButton
                              appearance="light"
                              className="!h-7 min-h-7 text-[11px]"
                              isDisabled={a.is_locked}
                              isLoading={unpublishMut.isPending}
                              onPress={() => unpublishMut.mutate(a.id)}
                            >
                              Unpublish
                            </FormButton>
                          )
                        ) : null}
                        {showLock ? (
                          a.is_locked ? (
                            <FormButton
                              appearance="light"
                              className="!h-7 min-h-7 text-[11px]"
                              isLoading={unlockMut.isPending}
                              onPress={() => unlockMut.mutate(a.id)}
                              startContent={<Unlock className="h-3 w-3" />}
                            >
                              Unlock
                            </FormButton>
                          ) : (
                            <FormButton
                              appearance="light"
                              className="!h-7 min-h-7 text-[11px]"
                              isLoading={lockMut.isPending}
                              onPress={() => lockMut.mutate(a.id)}
                              startContent={<Lock className="h-3 w-3" />}
                            >
                              Lock
                            </FormButton>
                          )
                        ) : null}
                        {showDelete ? (
                          <FormButton
                            appearance="light"
                            className="!h-7 min-h-7 text-[11px] text-rose-600"
                            isDisabled={a.is_locked || a.is_published}
                            onPress={() => {
                              if (
                                window.confirm(
                                  `Delete “${a.name}”? This cannot be undone.`,
                                )
                              ) {
                                deleteMut.mutate(a.id)
                              }
                            }}
                          >
                            Delete
                          </FormButton>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    )
  }

  const RankFilters = (
    <div className="flex flex-wrap items-end gap-2">
      <FormField label="Class" className="min-w-[140px]" required>
        <FormSelect
          label="Class"
          value={rankParams.classroom_id}
          onChange={(v) => setRankParams((f) => ({ ...f, classroom_id: v }))}
          options={classOptions}
        />
      </FormField>
      <FormField label="Year" className="min-w-[140px]" required>
        <FormSelect
          label="Year"
          value={rankParams.academic_year_id}
          onChange={(v) =>
            setRankParams((f) => ({ ...f, academic_year_id: v, term_id: '' }))
          }
          options={yearOptions}
        />
      </FormField>
      <FormField label="Term" className="min-w-[120px]">
        <FormSelect
          label="Term"
          placeholder="All terms"
          value={rankParams.term_id}
          onChange={(v) => setRankParams((f) => ({ ...f, term_id: v }))}
          options={termOptions}
        />
      </FormField>
      <FormButton isLoading={rankLoading} onPress={runRanking}>
        Load ranking
      </FormButton>
    </div>
  )

  const WorkflowStrip = () => (
    <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
        TAMISEMI exam workflow
      </p>
      <div className="flex min-w-max items-center gap-1">
        {WORKFLOW_STEPS.map((step, i) => (
          <div key={step.key} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => navigate(step.path)}
              className="rounded-md border border-zinc-100 px-2.5 py-1.5 text-left transition-colors hover:border-[#0B3D2E]/40 hover:bg-emerald-50/50"
            >
              <div className="text-[11px] font-semibold text-[#0B3D2E]">
                {step.label}
              </div>
              <div className="text-[10px] text-zinc-400">{step.hint}</div>
            </button>
            {i < WORKFLOW_STEPS.length - 1 ? (
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-zinc-300" />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )

  let body = null

  if (section === 'overview') {
    body = (
      <div className="flex flex-col gap-4">
        <WorkflowStrip />
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {overviewStats.map((s) => {
            const Icon = s.icon
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => navigate(s.href)}
                className="rounded-md border border-zinc-200 bg-white px-3 py-3 text-left transition-colors hover:border-[#0B3D2E]/40"
              >
                <div className="flex items-center gap-2 text-zinc-400">
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-[10px] uppercase tracking-wide">
                    {s.label}
                  </span>
                </div>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">
                  {s.value}
                </p>
              </button>
            )
          })}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((l) => {
            const Icon = l.icon
            return (
              <Link
                key={l.path}
                to={l.path}
                className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white px-3 py-3 text-[13px] font-medium text-zinc-800 transition-colors hover:border-[#0B3D2E]/40"
              >
                <Icon className="h-4 w-4 text-[#0B3D2E]" />
                {l.label}
              </Link>
            )
          })}
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[12px] font-semibold text-zinc-700">
              Recent assessments
            </h3>
            <Link
              to="/examinations/scheduling"
              className="text-[11px] font-medium text-[#0B3D2E] hover:underline"
            >
              Manage all
            </Link>
          </div>
          <AssessmentTable />
        </div>
      </div>
    )
  } else if (
    section === 'scheduling' ||
    section === 'ca' ||
    section === 'homework' ||
    section === 'practical'
  ) {
    body = (
      <div className="grid gap-4 lg:grid-cols-3">
        {assessmentCreateForm}
        <div className="lg:col-span-2">
          <ListFiltersBar showType={section === 'scheduling'} />
          <AssessmentTable />
        </div>
      </div>
    )
  } else if (section === 'types') {
    const formative = typeCatalog.filter(
      (t) => (t.group || 'formative') === 'formative',
    )
    const summative = typeCatalog.filter((t) => t.group === 'summative')
    body = (
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border border-zinc-200 shadow-none">
          <CardHeader className="px-4 py-3 text-sm font-semibold">
            Formative assessments
          </CardHeader>
          <CardBody className="px-4 pb-4">
            <ul className="flex flex-col gap-2">
              {formative.map((t) => (
                <li
                  key={t.value}
                  className="flex items-start justify-between gap-2 rounded-md border border-zinc-100 px-3 py-2"
                >
                  <div>
                    <p className="text-[13px] font-medium text-zinc-900">
                      {t.label}
                    </p>
                    <p className="text-[10px] text-zinc-400">code: {t.value}</p>
                  </div>
                  <FormButton
                    appearance="flat"
                    className="!h-7 min-h-7 text-[11px]"
                    onPress={() => {
                      setForm((f) => ({ ...f, type: t.value }))
                      navigate('/examinations/scheduling')
                    }}
                  >
                    Use
                  </FormButton>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
        <div className="flex flex-col gap-4">
          <Card className="border border-zinc-200 shadow-none">
            <CardHeader className="px-4 py-3 text-sm font-semibold">
              Summative examinations
            </CardHeader>
            <CardBody className="px-4 pb-4">
              <ul className="flex flex-col gap-2">
                {summative.map((t) => (
                  <li
                    key={t.value}
                    className="flex items-start justify-between gap-2 rounded-md border border-zinc-100 px-3 py-2"
                  >
                    <div>
                      <p className="text-[13px] font-medium text-zinc-900">
                        {t.label}
                      </p>
                      <p className="text-[10px] text-zinc-400">code: {t.value}</p>
                    </div>
                    <FormButton
                      appearance="flat"
                      className="!h-7 min-h-7 text-[11px]"
                      onPress={() => {
                        setForm((f) => ({ ...f, type: t.value }))
                        navigate('/examinations/scheduling')
                      }}
                    >
                      Use
                    </FormButton>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
          <Card className="border border-zinc-200 shadow-none">
            <CardHeader className="px-4 py-3 text-sm font-semibold">
              NECTA-oriented grade bands
            </CardHeader>
            <CardBody className="px-4 pb-4">
              <p className="mb-3 text-[11px] text-zinc-500">
                {grading?.scale ||
                  'Simplified CSEE/ACSEE-style bands. Primary schools use the same A–F mapping for consistency.'}
              </p>
              <Table shadow="none" aria-label="Grades">
                <TableHeader>
                  <TableColumn>GRADE</TableColumn>
                  <TableColumn>MIN %</TableColumn>
                  <TableColumn>POINTS</TableColumn>
                  <TableColumn>REMARK</TableColumn>
                </TableHeader>
                <TableBody>
                  {(grading?.bands || NECTA_BANDS).map((b) => (
                    <TableRow key={b.grade}>
                      <TableCell className="font-semibold">{b.grade}</TableCell>
                      <TableCell>≥ {b.min_percent}%</TableCell>
                      <TableCell>{b.points}</TableCell>
                      <TableCell>{b.remark}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="mt-3 text-[11px] text-zinc-500">
                Division from average points (lower is better): I ≤ 1.5, II ≤
                2.5, III ≤ 3.5, IV ≤ 4.5, else 0.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    )
  } else if (section === 'marks' || section === 'grades') {
    body = (
      <div className="flex flex-col gap-3">
        <div className="rounded-md border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-[11px] text-emerald-900">
          {section === 'grades'
            ? 'Grades follow NECTA bands (A ≥ 75 … F < 30). Live preview updates as you type; save to persist.'
            : 'Select an assessment — class roster loads automatically. Scores are capped at max score. Locked assessments cannot be edited.'}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <FormField label="Assessment" className="min-w-[260px] flex-1" required>
            <FormSelect
              label="Assessment"
              placeholder="Select assessment"
              value={selectedAssessment}
              onChange={setSelectedAssessment}
              options={assessments.map((a) => ({
                value: String(a.id),
                label: `${a.name} — ${a.subject?.name || 'Subject'}${a.classroom?.name ? ` (${a.classroom.name})` : ''}${a.is_locked ? ' [LOCKED]' : ''}`,
              }))}
            />
          </FormField>
          <FormButton
            appearance="flat"
            isDisabled={!selectedAssessment}
            onPress={buildRosterScores}
          >
            Reload class list
          </FormButton>
          <FormButton
            isDisabled={
              !selectedAssessment ||
              !Object.keys(scores).length ||
              assessment?.is_locked
            }
            isLoading={saveMut.isPending}
            onPress={saveMarks}
          >
            Save marks
          </FormButton>
        </div>
        {assessment ? (
          <p className="text-[11px] text-zinc-500">
            Max {assessment.max_score} · Weight {assessment.weight} ·{' '}
            {TYPE_LABEL[assessment.type] || assessment.type}
            {assessment.is_published ? ' · Published' : ' · Draft'}
            {assessment.is_locked ? ' · LOCKED (unlock to edit)' : ''}
          </p>
        ) : null}
        <Card className="border border-zinc-200 shadow-none">
          <CardBody className="p-2">
            {resultsQ.isLoading ? (
              <div className="flex justify-center py-10">
                <Spinner color="primary" />
              </div>
            ) : !selectedAssessment ? (
              <EmptyHint title="Select an assessment">
                Choose an assessment above to enter or review marks.
              </EmptyHint>
            ) : (
              <Table shadow="none" aria-label="Marks">
                <TableHeader>
                  <TableColumn>STUDENT</TableColumn>
                  <TableColumn>SCORE</TableColumn>
                  <TableColumn>%</TableColumn>
                  <TableColumn>GRADE</TableColumn>
                  <TableColumn>PTS</TableColumn>
                  <TableColumn>REMARK</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No learners found for this class. Enroll students first.">
                  {Object.keys(scores).map((sid) => {
                    const max = Number(assessment?.max_score || 100)
                    const sc = scores[sid] !== '' ? Number(scores[sid]) : null
                    const pct =
                      sc != null && max > 0
                        ? Math.round((sc / max) * 1000) / 10
                        : null
                    const live = gradeFromPercent(pct)
                    return (
                      <TableRow key={sid}>
                        <TableCell className="text-[12px]">
                          {studentName(Number(sid))}
                        </TableCell>
                        <TableCell>
                          <FormInput
                            type="number"
                            min={0}
                            max={max}
                            className="max-w-[100px]"
                            isDisabled={assessment?.is_locked}
                            value={scores[sid]}
                            onValueChange={(v) =>
                              setScores((s) => ({ ...s, [sid]: v }))
                            }
                          />
                        </TableCell>
                        <TableCell className="tabular-nums text-[12px]">
                          {pct != null ? `${pct}%` : '—'}
                        </TableCell>
                        <TableCell className="font-semibold text-[#0B3D2E]">
                          {live.grade}
                        </TableCell>
                        <TableCell className="tabular-nums text-[12px]">
                          {live.points ?? '—'}
                        </TableCell>
                        <TableCell className="text-[11px] text-zinc-500">
                          {live.remark}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>
      </div>
    )
  } else if (
    section === 'ranking' ||
    section === 'merit' ||
    section === 'gpa' ||
    section === 'division'
  ) {
    const fullList = rankData?.ranking || []
    const list =
      section === 'merit'
        ? rankData?.merit_list || fullList.slice(0, 10)
        : fullList
    const showGpaHint = section === 'gpa'
    body = (
      <div className="flex flex-col gap-3">
        {RankFilters}
        <p className="text-[11px] text-zinc-500">
          Uses <strong>published</strong> assessments only. Average points:
          lower is better (NECTA style — A = 1 point).
          {section === 'merit'
            ? ' Merit list shows top 10 by position.'
            : null}
          {showGpaHint
            ? ' Average points act as the GPA equivalent for ranking.'
            : null}
        </p>
        {section === 'division' && rankData?.division_summary ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {['I', 'II', 'III', 'IV', '0'].map((div) => {
              const n = rankData.division_summary[div] || 0
              const total = rankData.class_size || 1
              return (
                <div
                  key={div}
                  className="rounded-md border border-zinc-200 bg-white px-3 py-2"
                >
                  <div className="text-[10px] uppercase text-zinc-400">
                    Division {div}
                  </div>
                  <div className="text-xl font-semibold tabular-nums">{n}</div>
                  <Progress
                    size="sm"
                    value={(n / total) * 100}
                    className="mt-1"
                    classNames={{ indicator: 'bg-[#0B3D2E]' }}
                    aria-label={`Division ${div}`}
                  />
                </div>
              )
            })}
          </div>
        ) : null}
        {section === 'gpa' && fullList.length ? (
          <div className="flex flex-wrap gap-3 text-[12px]">
            <Chip variant="flat" size="sm">
              Class size: {rankData.class_size}
            </Chip>
            <Chip variant="flat" size="sm">
              Best avg pts:{' '}
              {Math.min(...fullList.map((r) => r.average_points))}
            </Chip>
            <Chip variant="flat" size="sm">
              Class mean pts:{' '}
              {(
                fullList.reduce((s, r) => s + Number(r.average_points), 0) /
                fullList.length
              ).toFixed(2)}
            </Chip>
          </div>
        ) : null}
        <Card className="border border-zinc-200 shadow-none">
          <CardBody className="p-2">
            <Table shadow="none" aria-label="Ranking">
              <TableHeader>
                <TableColumn>POS</TableColumn>
                <TableColumn>ADM NO</TableColumn>
                <TableColumn>NAME</TableColumn>
                <TableColumn>
                  {section === 'gpa' ? 'AVG POINTS' : 'AVG PTS'}
                </TableColumn>
                <TableColumn>DIVISION</TableColumn>
              </TableHeader>
              <TableBody emptyContent="Load ranking for a class and year (published results only)">
                {list.map((r) => (
                  <TableRow key={r.student_id}>
                    <TableCell className="font-semibold tabular-nums">
                      {r.position}
                    </TableCell>
                    <TableCell className="font-mono text-[11px]">
                      {r.admission_number || '—'}
                    </TableCell>
                    <TableCell>{r.full_name}</TableCell>
                    <TableCell className="tabular-nums font-medium">
                      {r.average_points}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={
                          r.division === 'I' || r.division === 'II'
                            ? 'success'
                            : r.division === '0'
                              ? 'danger'
                              : 'default'
                        }
                        className="h-5 font-semibold"
                      >
                        {r.division}
                      </Chip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>
    )
  } else if (section === 'analysis' || section === 'trends') {
    body = (
      <div className="flex flex-col gap-3">
        {section === 'analysis' ? (
          <>
            <div className="flex flex-wrap items-end gap-2">
              <FormField label="Class" className="min-w-[140px]" required>
                <FormSelect
                  label="Class"
                  value={analysisParams.classroom_id}
                  onChange={(v) =>
                    setAnalysisParams((f) => ({ ...f, classroom_id: v }))
                  }
                  options={classOptions}
                />
              </FormField>
              <FormField label="Year" className="min-w-[140px]" required>
                <FormSelect
                  label="Year"
                  value={analysisParams.academic_year_id}
                  onChange={(v) =>
                    setAnalysisParams((f) => ({
                      ...f,
                      academic_year_id: v,
                      term_id: '',
                    }))
                  }
                  options={yearOptions}
                />
              </FormField>
              <FormField label="Term" className="min-w-[120px]">
                <FormSelect
                  label="Term"
                  placeholder="All"
                  value={analysisParams.term_id}
                  onChange={(v) =>
                    setAnalysisParams((f) => ({ ...f, term_id: v }))
                  }
                  options={termOptions}
                />
              </FormField>
              <FormField label="Subject" className="min-w-[140px]">
                <FormSelect
                  label="Subject"
                  placeholder="All subjects"
                  value={analysisParams.subject_id}
                  onChange={(v) =>
                    setAnalysisParams((f) => ({ ...f, subject_id: v }))
                  }
                  options={subjectOptions}
                />
              </FormField>
              <FormButton isLoading={analysisLoading} onPress={runAnalysis}>
                Run analysis
              </FormButton>
            </div>
            <p className="text-[11px] text-zinc-500">
              Pass rate uses ≥ 30% (grade D or better). Only published
              assessments are included.
            </p>
            <Card className="border border-zinc-200 shadow-none">
              <CardBody className="p-2">
                <Table shadow="none" aria-label="Subject analysis">
                  <TableHeader>
                    <TableColumn>SUBJECT</TableColumn>
                    <TableColumn>N</TableColumn>
                    <TableColumn>MEAN %</TableColumn>
                    <TableColumn>PASS %</TableColumn>
                    <TableColumn>MEAN GRADE</TableColumn>
                    <TableColumn>A–F</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent="Run analysis for published results">
                    {(analysisData?.subjects || []).map((s) => (
                      <TableRow key={s.subject_id || s.subject_name}>
                        <TableCell>
                          <div className="text-[12px] font-medium">
                            {s.subject_name}
                          </div>
                          {s.subject_code ? (
                            <div className="text-[10px] text-zinc-400">
                              {s.subject_code}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell className="tabular-nums">{s.entries}</TableCell>
                        <TableCell className="tabular-nums">
                          {s.mean_percent}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {s.pass_rate}%
                        </TableCell>
                        <TableCell className="font-semibold text-[#0B3D2E]">
                          {s.mean_grade}
                        </TableCell>
                        <TableCell className="text-[10px] text-zinc-500">
                          {s.grade_distribution
                            ? Object.entries(s.grade_distribution)
                                .map(([g, n]) => `${g}:${n}`)
                                .join(' ')
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          </>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border border-zinc-200 shadow-none">
              <CardHeader className="px-4 py-3 text-sm font-semibold">
                Assessments by type
              </CardHeader>
              <CardBody className="px-4 pb-4">
                {typeBreakdown.length === 0 ? (
                  <EmptyHint title="No assessments yet">
                    Schedule exams to see trends by type.
                  </EmptyHint>
                ) : (
                  <div className="flex flex-col gap-3">
                    {typeBreakdown.map((t) => {
                      const max = Math.max(
                        ...typeBreakdown.map((x) => x.count),
                        1,
                      )
                      return (
                        <div key={t.type}>
                          <div className="mb-1 flex justify-between text-[12px]">
                            <span className="font-medium text-zinc-800">
                              {t.label}
                            </span>
                            <span className="tabular-nums text-zinc-500">
                              {t.published}/{t.count} published
                            </span>
                          </div>
                          <Progress
                            size="sm"
                            value={(t.count / max) * 100}
                            classNames={{ indicator: 'bg-[#0B3D2E]' }}
                            aria-label={t.label}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardBody>
            </Card>
            <Card className="border border-zinc-200 shadow-none">
              <CardHeader className="px-4 py-3 text-sm font-semibold">
                Publication status
              </CardHeader>
              <CardBody className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md border border-zinc-100 p-3">
                    <div className="text-[10px] uppercase text-zinc-400">
                      Draft
                    </div>
                    <div className="text-2xl font-semibold tabular-nums">
                      {assessments.filter((a) => !a.is_published).length}
                    </div>
                  </div>
                  <div className="rounded-md border border-zinc-100 p-3">
                    <div className="text-[10px] uppercase text-zinc-400">
                      Published
                    </div>
                    <div className="text-2xl font-semibold tabular-nums text-emerald-700">
                      {assessments.filter((a) => a.is_published).length}
                    </div>
                  </div>
                  <div className="rounded-md border border-zinc-100 p-3">
                    <div className="text-[10px] uppercase text-zinc-400">
                      Locked
                    </div>
                    <div className="text-2xl font-semibold tabular-nums">
                      {assessments.filter((a) => a.is_locked).length}
                    </div>
                  </div>
                  <div className="rounded-md border border-zinc-100 p-3">
                    <div className="text-[10px] uppercase text-zinc-400">
                      Total
                    </div>
                    <div className="text-2xl font-semibold tabular-nums">
                      {assessments.length}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    )
  } else if (section === 'lock' || section === 'approval') {
    body = (
      <div className="flex flex-col gap-3">
        <WorkflowStrip />
        <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-[12px] text-zinc-600">
          {section === 'lock' ? (
            <>
              <strong className="text-zinc-800">Locking</strong> freezes marks
              after academic office verification. Unlock only for authorised
              corrections. Published + locked is the industrial end-state before
              printing report cards.
            </>
          ) : (
            <>
              <strong className="text-zinc-800">Publishing</strong> is the
              approval step: only published assessments appear on rankings,
              subject analysis and NECTA-oriented report cards. Unpublish
              requires unlock first if locked.
            </>
          )}
        </div>
        <ListFiltersBar />
        <AssessmentTable mode={section === 'lock' ? 'lock' : 'approval'} />
      </div>
    )
  } else if (section === 'reports') {
    const reportStudentOptions = [
      {
        value: 'all',
        label: `All students in class (${reportClassStudents.length})`,
      },
      ...reportClassStudents.map((s) => ({
        value: String(s.id),
        label: s.admission_number
          ? `${s.full_name} · ${s.admission_number}`
          : s.full_name,
      })),
    ]

    const buildReportPayload = (studentId) => ({
      student_id: studentId,
      academic_year_id: reportParams.academic_year_id,
      term_id: reportParams.term_id || undefined,
      classroom_id: reportParams.classroom_id || undefined,
    })

    const targetStudentIds = () => {
      if (reportParams.student_id === 'all') {
        return reportClassStudents.map((s) => s.id)
      }
      if (reportParams.student_id) {
        return [Number(reportParams.student_id)]
      }
      return []
    }

    const validateReportForm = () => {
      if (!reportParams.academic_year_id) {
        toastError('Select academic year')
        return false
      }
      if (!reportParams.classroom_id) {
        toastError('Select class')
        return false
      }
      if (!reportParams.student_id) {
        toastError('Select a student or All students')
        return false
      }
      if (
        reportParams.student_id === 'all' &&
        reportClassStudents.length === 0
      ) {
        toastError('No students', 'This class has no active learners.')
        return false
      }
      return true
    }

    const runPreview = async () => {
      if (!validateReportForm()) return
      const ids = targetStudentIds()
      setReportLoading(true)
      setReport(null)
      setReportBatch([])
      try {
        if (ids.length === 1) {
          const data = await getReportCard(buildReportPayload(ids[0]))
          setReport(data.report_card)
          setReportBatch([data.report_card])
          toastSuccess('Report card generated')
        } else {
          const batch = []
          let failed = 0
          for (const id of ids) {
            try {
              const data = await getReportCard(buildReportPayload(id))
              if (data?.report_card) batch.push(data.report_card)
            } catch {
              failed += 1
            }
          }
          setReportBatch(batch)
          setReport(batch[0] || null)
          toastSuccess(
            `Generated ${batch.length} report card(s)`,
            failed ? `${failed} failed` : undefined,
          )
        }
      } catch (e) {
        toastError('Report failed', e.message)
      } finally {
        setReportLoading(false)
      }
    }

    const runPrint = async () => {
      if (!validateReportForm()) return
      const ids = targetStudentIds()
      if (!ids.length) {
        toastError('No students', 'Select a class with learners first.')
        return
      }
      setReportLoading(true)
      try {
        const payloads = ids.map((id) => buildReportPayload(id))
        // Single tab for one or many — avoids multi-popup blocking
        const result = await openReportCardHtml(
          payloads.length === 1 ? payloads[0] : payloads,
        )
        toastSuccess(
          result?.opened > 1
            ? `Opened ${result.opened} printable report cards`
            : 'Printable report card opened',
        )
      } catch (e) {
        if (e?.partial && e.opened > 0) {
          toastSuccess(
            `Opened ${e.opened} of ${e.total} cards`,
            e.message,
          )
        } else {
          toastError('Print failed', e?.message || 'Could not open report cards')
        }
      } finally {
        setReportLoading(false)
      }
    }

    body = (
      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="border border-zinc-200 shadow-none lg:col-span-4">
          <CardHeader className="flex flex-col items-start gap-0.5 px-4 py-3">
            <span className="text-sm font-semibold">Generate report card</span>
            <span className="text-[11px] font-normal text-zinc-500">
              Choose period, class, then student(s) · published marks only
            </span>
          </CardHeader>
          <CardBody className="flex flex-col gap-4 px-4 pb-4">
            {/* 1. Period */}
            <div className="flex flex-col gap-3 rounded-md border border-zinc-100 bg-zinc-50/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                1. Period
              </p>
              <FormField label="Academic year" required>
                <FormSelect
                  label="Year"
                  placeholder="Select year"
                  value={reportParams.academic_year_id}
                  onChange={(v) =>
                    setReportParams((f) => ({
                      ...f,
                      academic_year_id: v,
                      term_id: '',
                      student_id: '',
                    }))
                  }
                  options={yearOptions}
                />
              </FormField>
              <FormField label="Term" hint="Optional — leave blank for all terms">
                <FormSelect
                  label="Term"
                  placeholder="All terms"
                  value={reportParams.term_id}
                  onChange={(v) =>
                    setReportParams((f) => ({ ...f, term_id: v }))
                  }
                  options={termOptions}
                />
              </FormField>
            </div>

            {/* 2. Class */}
            <div className="flex flex-col gap-3 rounded-md border border-zinc-100 bg-zinc-50/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                2. Class
              </p>
              <FormField
                label="Class"
                required
                hint={
                  stagesHint
                    ? `Showing classes for: ${stagesHint}`
                    : 'Classes match school education levels'
                }
              >
                <FormSelect
                  label="Class"
                  placeholder={
                    classOptions.length
                      ? 'Select class'
                      : 'No classes for your levels'
                  }
                  value={reportParams.classroom_id}
                  onChange={(v) =>
                    setReportParams((f) => ({
                      ...f,
                      classroom_id: v,
                      student_id: '',
                    }))
                  }
                  options={classOptions}
                />
              </FormField>
              {reportParams.classroom_id ? (
                <p className="text-[11px] text-zinc-500">
                  {reportStudentsQ.isLoading
                    ? 'Loading class list…'
                    : `${reportClassStudents.length} active learner(s) in this class`}
                </p>
              ) : (
                <p className="text-[11px] text-zinc-400">
                  {classOptions.length
                    ? 'Select a class to load its students.'
                    : 'No classes for this school’s education levels. Add classes under Academic setup.'}
                </p>
              )}
            </div>

            {/* 3. Student(s) */}
            <div className="flex flex-col gap-3 rounded-md border border-zinc-100 bg-zinc-50/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                3. Student(s)
              </p>
              <FormField
                label="Learner"
                required
                hint="Choose one learner or the whole class"
              >
                <FormSelect
                  label="Student"
                  placeholder={
                    reportParams.classroom_id
                      ? 'Select student or All'
                      : 'Select class first'
                  }
                  value={reportParams.student_id}
                  onChange={(v) =>
                    setReportParams((f) => ({ ...f, student_id: v }))
                  }
                  isDisabled={
                    !reportParams.classroom_id || reportStudentsQ.isLoading
                  }
                  options={
                    reportParams.classroom_id ? reportStudentOptions : []
                  }
                />
              </FormField>
              {reportParams.student_id === 'all' ? (
                <Chip size="sm" variant="flat" color="primary" className="h-6">
                  Whole class · {reportClassStudents.length} cards
                </Chip>
              ) : null}
            </div>

            {/* 4. Report type */}
            <div className="flex flex-col gap-3 rounded-md border border-zinc-100 bg-zinc-50/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                4. Report type
              </p>
              <FormField label="Format">
                <FormSelect
                  label="Report type"
                  value={reportParams.report_kind}
                  onChange={(v) =>
                    setReportParams((f) => ({ ...f, report_kind: v }))
                  }
                  options={REPORT_KIND_OPTIONS}
                />
              </FormField>
              <p className="text-[10px] text-zinc-400">
                Grades and division use published assessments only (NECTA-style).
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <FormButton isLoading={reportLoading} onPress={runPreview}>
                {reportParams.student_id === 'all'
                  ? 'Generate all previews'
                  : 'Preview report card'}
              </FormButton>
              <FormButton
                appearance="bordered"
                isLoading={reportLoading}
                onPress={runPrint}
              >
                {reportParams.student_id === 'all'
                  ? 'Open all printable cards'
                  : 'Open printable HTML'}
              </FormButton>
            </div>
          </CardBody>
        </Card>

        <div className="flex flex-col gap-4 lg:col-span-8">
          {reportBatch.length > 1 ? (
            <Card className="border border-zinc-200 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between gap-2 px-4 py-3">
                <span className="text-sm font-semibold">
                  Class batch · {reportBatch.length} report(s)
                </span>
                <span className="text-[11px] text-zinc-400">
                  Click a row to preview
                </span>
              </CardHeader>
              <CardBody className="p-2">
                <Table shadow="none" aria-label="Batch reports">
                  <TableHeader>
                    <TableColumn>ADM NO</TableColumn>
                    <TableColumn>NAME</TableColumn>
                    <TableColumn>DIV</TableColumn>
                    <TableColumn>POS</TableColumn>
                    <TableColumn>AVG PTS</TableColumn>
                    <TableColumn> </TableColumn>
                  </TableHeader>
                  <TableBody>
                    {reportBatch.map((rc) => (
                      <TableRow key={rc.student?.id || rc.student?.admission_number}>
                        <TableCell className="font-mono text-[11px]">
                          {rc.student?.admission_number || '—'}
                        </TableCell>
                        <TableCell className="text-[12px]">
                          {rc.student?.full_name}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {rc.summary?.division ?? '—'}
                        </TableCell>
                        <TableCell className="tabular-nums text-[12px]">
                          {rc.summary?.class_position
                            ? `${rc.summary.class_position}/${rc.summary.class_size}`
                            : '—'}
                        </TableCell>
                        <TableCell className="tabular-nums text-[12px]">
                          {rc.summary?.average_points ?? '—'}
                        </TableCell>
                        <TableCell>
                          <FormButton
                            appearance="flat"
                            className="!h-7 min-h-7 text-[11px]"
                            onPress={() => setReport(rc)}
                          >
                            View
                          </FormButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          ) : null}

          <Card className="border border-zinc-200 shadow-none">
            <CardHeader className="px-4 py-3 text-sm font-semibold">
              Preview
              {reportParams.report_kind ? (
                <span className="ml-2 text-[11px] font-normal capitalize text-zinc-400">
                  · {reportParams.report_kind}
                </span>
              ) : null}
            </CardHeader>
            <CardBody className="px-4 pb-4">
              {!report ? (
                <EmptyHint title="Generate a report to preview">
                  Select year, class, and a student (or all), then Preview.
                  Ensure assessments for that class are published first.
                </EmptyHint>
              ) : (
                <div className="space-y-3 text-sm">
                  <div>
                    <strong>{report.student?.full_name}</strong> ·{' '}
                    {report.student?.admission_number}
                    <div className="text-xs text-zinc-500">
                      {report.class?.name} · {report.class?.academic_year}
                      {report.class?.term ? ` · ${report.class.term}` : ''} ·
                      Division {report.summary?.division}
                      {report.summary?.class_position
                        ? ` · Position ${report.summary.class_position}/${report.summary.class_size}`
                        : ''}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Chip size="sm" variant="flat">
                      Subjects: {report.summary?.subjects_count ?? 0}
                    </Chip>
                    <Chip size="sm" variant="flat">
                      Avg pts: {report.summary?.average_points ?? '—'}
                    </Chip>
                    <Chip size="sm" variant="flat" color="success">
                      Division {report.summary?.division}
                    </Chip>
                  </div>
                  <Table shadow="none" aria-label="Subjects">
                    <TableHeader>
                      <TableColumn>SUBJECT</TableColumn>
                      <TableColumn>AVG %</TableColumn>
                      <TableColumn>GRADE</TableColumn>
                      <TableColumn>POINTS</TableColumn>
                      <TableColumn>REMARK</TableColumn>
                    </TableHeader>
                    <TableBody emptyContent="No published subject results">
                      {(report.subjects || []).map((row) => (
                        <TableRow key={row.subject_id || row.subject_name}>
                          <TableCell>{row.subject_name}</TableCell>
                          <TableCell className="tabular-nums">
                            {row.average_percent}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {row.grade}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {row.points}
                          </TableCell>
                          <TableCell className="text-[11px] text-zinc-500">
                            {row.remark}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <p className="text-xs text-zinc-600">
                    <span className="font-medium">Head teacher remark: </span>
                    {report.head_teacher_remark}
                  </p>
                  {report.student?.id ? (
                    <FormButton
                      appearance="bordered"
                      className="self-start"
                      onPress={() =>
                        openReportCardHtml(
                          buildReportPayload(report.student.id),
                        ).catch((e) => toastError('Print failed', e.message))
                      }
                    >
                      Print this learner
                    </FormButton>
                  ) : null}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    )
  } else {
    body = <AssessmentTable />
  }

  const crumbs = location.pathname.startsWith('/report-cards')
    ? [
        { label: 'Academic', href: '/academic' },
        { label: 'Report cards', href: '/report-cards' },
        ...(section !== 'reports' || location.pathname !== '/report-cards'
          ? [{ label: meta.title }]
          : []),
      ]
    : [
        { label: 'Academic', href: '/academic' },
        { label: 'Examinations', href: '/examinations' },
        ...(section !== 'overview' ? [{ label: meta.title }] : []),
      ]

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title={meta.title}
          breadcrumbs={crumbs}
          description={meta.description}
        />
        {body}
      </div>
    </DashboardLayout>
  )
}

export default ExamWorkspace
