import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Card,
  CardHeader,
  CardBody,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
} from '@heroui/react'
import {
  FileText,
  Printer,
  Trophy,
  MessageSquare,
  Layers,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Users,
} from 'lucide-react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import PageHeader from '../../components/Layout/PageHeader.jsx'
import {
  FormField,
  FormSelect,
  FormButton,
  FormTextarea,
} from '../../components/Form'
import { toastSuccess, toastError } from '../../components/Toast'
import { useAuth } from '../../auth'
import {
  listYears,
  listTerms,
  listClasses,
  listStudents,
  getReportCard,
  openReportCardHtml,
  examRanking,
} from '../../api/domain.js'
import {
  filterClassesBySchoolStages,
  classSelectLabel,
  formatStagesSummary,
} from '../../config/educationStages.js'
import {
  REPORT_KIND_OPTIONS,
  REPORT_KIND_LABEL,
  reportSectionFromPath,
  reportKindFromPath,
  REPORT_SECTION_META,
  REPORT_WORKFLOW,
} from './reportConstants.js'

function EmptyHint({ title, children }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-10 text-center">
      <AlertCircle className="h-5 w-5 text-zinc-400" />
      <p className="text-sm font-medium text-zinc-700">{title}</p>
      {children ? (
        <p className="max-w-md text-[12px] text-zinc-500">{children}</p>
      ) : null}
    </div>
  )
}

function SectionCard({ title, description, children, className = '' }) {
  return (
    <Card className={`border border-zinc-200 shadow-none ${className}`}>
      <CardHeader className="flex flex-col items-start gap-0.5 px-4 py-3">
        <span className="text-sm font-semibold text-zinc-900">{title}</span>
        {description ? (
          <span className="text-[11px] font-normal text-zinc-500">
            {description}
          </span>
        ) : null}
      </CardHeader>
      <CardBody className="px-4 pb-4 pt-0">{children}</CardBody>
    </Card>
  )
}

function ReportCardsWorkspace() {
  const location = useLocation()
  const navigate = useNavigate()
  const { school: authSchool, session } = useAuth()
  const section = reportSectionFromPath(location.pathname)
  const meta = REPORT_SECTION_META[section] || REPORT_SECTION_META.overview

  const schoolStages =
    authSchool?.education_stages ||
    session?.school?.education_stages ||
    session?.user?.school?.education_stages ||
    []

  const [params, setParams] = useState({
    academic_year_id: '',
    term_id: '',
    classroom_id: '',
    student_id: '', // '' | 'all' | id
    report_kind: 'terminal',
  })
  const [includeAttendance, setIncludeAttendance] = useState(true)
  const [includeFeeBalance, setIncludeFeeBalance] = useState(false)
  const [teacherRemark, setTeacherRemark] = useState('')
  const [headRemarkOverride, setHeadRemarkOverride] = useState('')
  const [report, setReport] = useState(null)
  const [reportBatch, setReportBatch] = useState([])
  const [rankData, setRankData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [rankLoading, setRankLoading] = useState(false)

  // Sync report kind from path
  useEffect(() => {
    const kind = reportKindFromPath(location.pathname)
    setParams((f) => ({ ...f, report_kind: kind }))
  }, [location.pathname])

  const yearsQ = useQuery({ queryKey: ['academic', 'years'], queryFn: listYears })
  const termsQ = useQuery({
    queryKey: ['academic', 'terms', params.academic_year_id],
    queryFn: () =>
      listTerms({ academic_year_id: params.academic_year_id || undefined }),
  })
  const classesQ = useQuery({
    queryKey: ['academic', 'classes'],
    queryFn: listClasses,
  })
  const classStudentsQ = useQuery({
    queryKey: ['students', 'report-class', params.classroom_id],
    queryFn: () =>
      listStudents({
        per_page: 200,
        status: 'active',
        classroom_id: params.classroom_id,
      }),
    enabled: Boolean(params.classroom_id),
  })

  const years = yearsQ.data?.academic_years || []
  const terms = termsQ.data?.terms || []
  const currentYear = years.find((y) => y.is_current) || years[0]

  const classes = useMemo(() => {
    const raw = classesQ.data?.classes || []
    const stages = classesQ.data?.school_education_stages?.length
      ? classesQ.data.school_education_stages
      : schoolStages
    return filterClassesBySchoolStages(raw, stages)
  }, [classesQ.data, schoolStages])

  const classStudents = classStudentsQ.data?.students || []

  useEffect(() => {
    if (currentYear && !params.academic_year_id) {
      setParams((f) => ({ ...f, academic_year_id: String(currentYear.id) }))
    }
  }, [currentYear, params.academic_year_id])

  useEffect(() => {
    if (!classes.length) return
    const ids = new Set(classes.map((c) => String(c.id)))
    setParams((f) =>
      f.classroom_id && !ids.has(String(f.classroom_id))
        ? { ...f, classroom_id: '', student_id: '' }
        : f,
    )
  }, [classes])

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
  const studentOptions = [
    {
      value: 'all',
      label: `All students in class (${classStudents.length})`,
    },
    ...classStudents.map((s) => ({
      value: String(s.id),
      label: s.admission_number
        ? `${s.full_name} · ${s.admission_number}`
        : s.full_name,
    })),
  ]

  const setField = (key, value) => {
    setParams((f) => {
      const next = { ...f, [key]: value }
      if (key === 'academic_year_id') next.term_id = ''
      if (key === 'classroom_id') next.student_id = ''
      return next
    })
  }

  const buildPayload = (studentId) => ({
    student_id: studentId,
    academic_year_id: params.academic_year_id,
    term_id: params.term_id || undefined,
    classroom_id: params.classroom_id || undefined,
  })

  const targetIds = () => {
    if (params.student_id === 'all') return classStudents.map((s) => s.id)
    if (params.student_id) return [Number(params.student_id)]
    return []
  }

  const validate = ({ requireStudent = true, forceAll = false } = {}) => {
    if (!params.academic_year_id) {
      toastError('Select academic year')
      return false
    }
    if (!params.classroom_id) {
      toastError('Select class')
      return false
    }
    if (forceAll) {
      if (!classStudents.length) {
        toastError('No students', 'This class has no active learners.')
        return false
      }
      return true
    }
    if (requireStudent && !params.student_id) {
      toastError('Select a student or All students')
      return false
    }
    if (params.student_id === 'all' && !classStudents.length) {
      toastError('No students', 'This class has no active learners.')
      return false
    }
    return true
  }

  const runPreview = async (opts = {}) => {
    if (!validate(opts)) return
    const ids = opts.forceAll
      ? classStudents.map((s) => s.id)
      : targetIds()
    if (!ids.length) {
      toastError('No students selected')
      return
    }
    setLoading(true)
    setReport(null)
    setReportBatch([])
    try {
      const batch = []
      let failed = 0
      for (const id of ids) {
        try {
          const data = await getReportCard(buildPayload(id))
          if (data?.report_card) {
            let card = data.report_card
            // Client-side remark overlays (until dedicated remarks API)
            if (teacherRemark.trim() || headRemarkOverride.trim()) {
              card = {
                ...card,
                class_teacher_remark:
                  teacherRemark.trim() || card.class_teacher_remark,
                head_teacher_remark:
                  headRemarkOverride.trim() || card.head_teacher_remark,
                extras: {
                  include_attendance: includeAttendance,
                  include_fee_balance: includeFeeBalance,
                },
              }
            } else {
              card = {
                ...card,
                extras: {
                  include_attendance: includeAttendance,
                  include_fee_balance: includeFeeBalance,
                },
              }
            }
            batch.push(card)
          }
        } catch {
          failed += 1
        }
      }
      setReportBatch(batch)
      setReport(batch[0] || null)
      toastSuccess(
        batch.length === 1
          ? 'Report card generated'
          : `Generated ${batch.length} report card(s)`,
        failed ? `${failed} failed` : undefined,
      )
    } catch (e) {
      toastError('Report failed', e.message)
    } finally {
      setLoading(false)
    }
  }

  const runPrint = async (opts = {}) => {
    if (!validate(opts)) return
    const ids = opts.forceAll
      ? classStudents.map((s) => s.id)
      : targetIds()
    if (!ids.length) {
      toastError('No students selected')
      return
    }
    setLoading(true)
    try {
      const payloads = ids.map((id) => buildPayload(id))
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
        toastSuccess(`Opened ${e.opened} of ${e.total} cards`, e.message)
      } else {
        toastError('Print failed', e?.message || 'Could not open report cards')
      }
    } finally {
      setLoading(false)
    }
  }

  const runRanking = async () => {
    if (!params.classroom_id || !params.academic_year_id) {
      toastError('Select class and year')
      return
    }
    setRankLoading(true)
    try {
      const data = await examRanking({
        classroom_id: params.classroom_id,
        academic_year_id: params.academic_year_id,
        term_id: params.term_id || undefined,
      })
      setRankData(data)
      toastSuccess('Positions loaded', `${data.class_size || 0} learners`)
    } catch (e) {
      toastError('Ranking failed', e.message)
    } finally {
      setRankLoading(false)
    }
  }

  /** Shared filters: year / term / class / student */
  const FiltersBlock = ({
    showStudent = true,
    forceAllStudents = false,
    showKind = true,
  }) => (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Academic year" required>
          <FormSelect
            label="Year"
            value={params.academic_year_id}
            onChange={(v) => setField('academic_year_id', v)}
            options={yearOptions}
          />
        </FormField>
        <FormField label="Term" hint="Optional — blank = all terms in year">
          <FormSelect
            label="Term"
            placeholder="All terms"
            value={params.term_id}
            onChange={(v) => setField('term_id', v)}
            options={termOptions}
          />
        </FormField>
        <FormField
          label="Class"
          required
          className="sm:col-span-2"
          hint={
            stagesHint
              ? `Classes for school levels: ${stagesHint}`
              : 'Filtered by school education levels'
          }
        >
          <FormSelect
            label="Class"
            placeholder={
              classOptions.length ? 'Select class' : 'No classes for your levels'
            }
            value={params.classroom_id}
            onChange={(v) => setField('classroom_id', v)}
            options={classOptions}
          />
        </FormField>
        {showStudent && !forceAllStudents ? (
          <FormField
            label="Student(s)"
            required
            className="sm:col-span-2"
            hint="One learner or whole class"
          >
            <FormSelect
              label="Student"
              placeholder={
                params.classroom_id ? 'Select student or All' : 'Select class first'
              }
              value={params.student_id}
              onChange={(v) => setField('student_id', v)}
              isDisabled={!params.classroom_id || classStudentsQ.isLoading}
              options={params.classroom_id ? studentOptions : []}
            />
          </FormField>
        ) : null}
        {forceAllStudents && params.classroom_id ? (
          <div className="sm:col-span-2">
            <Chip size="sm" variant="flat" color="primary" className="h-6">
              Whole class · {classStudents.length} learner(s)
              {classStudentsQ.isLoading ? ' · loading…' : ''}
            </Chip>
          </div>
        ) : null}
        {showKind ? (
          <FormField label="Report type" className="sm:col-span-2">
            <FormSelect
              label="Type"
              value={params.report_kind}
              onChange={(v) => setField('report_kind', v)}
              options={REPORT_KIND_OPTIONS.map((k) => ({
                value: k.value,
                label: k.label,
              }))}
            />
          </FormField>
        ) : null}
      </div>
    </div>
  )

  const PreviewPane = () => (
    <div className="flex flex-col gap-4">
      {reportBatch.length > 1 ? (
        <SectionCard
          title={`Class batch · ${reportBatch.length} report(s)`}
          description="Click View to preview a learner"
        >
          <Table shadow="none" aria-label="Batch">
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
                <TableRow
                  key={rc.student?.id || rc.student?.admission_number}
                >
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
        </SectionCard>
      ) : null}

      <SectionCard
        title="Preview"
        description={
          params.report_kind
            ? REPORT_KIND_LABEL[params.report_kind] || params.report_kind
            : undefined
        }
      >
        {!report ? (
          <EmptyHint title="Generate a report to preview">
            Select year, class and learner(s), then Preview. Only{' '}
            <strong>published</strong> assessments are included (NECTA-style
            grades and division).
          </EmptyHint>
        ) : (
          <div className="space-y-3 text-sm">
            <div>
              <strong>{report.student?.full_name}</strong>
              {report.student?.admission_number
                ? ` · ${report.student.admission_number}`
                : ''}
              <div className="text-xs text-zinc-500">
                {report.class?.name} · {report.class?.academic_year}
                {report.class?.term ? ` · ${report.class.term}` : ''} · Division{' '}
                {report.summary?.division}
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
              {includeAttendance ? (
                <Chip size="sm" variant="flat">
                  + Attendance section
                </Chip>
              ) : null}
              {includeFeeBalance ? (
                <Chip size="sm" variant="flat">
                  + Fee balance
                </Chip>
              ) : null}
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
                    <TableCell className="font-semibold">{row.grade}</TableCell>
                    <TableCell className="tabular-nums">{row.points}</TableCell>
                    <TableCell className="text-[11px] text-zinc-500">
                      {row.remark}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {(report.class_teacher_remark || teacherRemark) && (
              <p className="text-xs text-zinc-600">
                <span className="font-medium">Class teacher: </span>
                {teacherRemark.trim() || report.class_teacher_remark}
              </p>
            )}
            <p className="text-xs text-zinc-600">
              <span className="font-medium">Head teacher: </span>
              {headRemarkOverride.trim() || report.head_teacher_remark}
            </p>
            {report.student?.id ? (
              <FormButton
                appearance="bordered"
                onPress={() =>
                  openReportCardHtml(buildPayload(report.student.id)).catch(
                    (e) => toastError('Print failed', e.message),
                  )
                }
              >
                Print this learner
              </FormButton>
            ) : null}
          </div>
        )}
      </SectionCard>
    </div>
  )

  let body = null

  if (section === 'overview') {
    body = (
      <div className="flex flex-col gap-4">
        <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            Report card workflow (TAMISEMI)
          </p>
          <div className="flex min-w-max items-center gap-1">
            {REPORT_WORKFLOW.map((step, i) => (
              <div key={step.key} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => navigate(step.path)}
                  className="rounded-md border border-zinc-100 px-2.5 py-1.5 text-left transition-colors hover:border-[#12544f]/40 hover:bg-emerald-50/50"
                >
                  <div className="text-[11px] font-semibold text-[#12544f]">
                    {step.label}
                  </div>
                  <div className="text-[10px] text-zinc-400">{step.hint}</div>
                </button>
                {i < REPORT_WORKFLOW.length - 1 ? (
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-zinc-300" />
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              label: 'Generate report cards',
              path: '/report-cards/generate',
              icon: FileText,
              hint: 'By class and learner',
            },
            {
              label: 'Terminal reports',
              path: '/report-cards/terminal',
              icon: Layers,
              hint: 'End of term',
            },
            {
              label: 'Class positions',
              path: '/report-cards/positions',
              icon: Trophy,
              hint: 'Division & rank',
            },
            {
              label: 'Bulk print',
              path: '/report-cards/bulk',
              icon: Printer,
              hint: 'Whole class PDF',
            },
            {
              label: 'Remarks',
              path: '/report-cards/remarks',
              icon: MessageSquare,
              hint: 'Teacher & head',
            },
            {
              label: 'Report extras',
              path: '/report-cards/extras',
              icon: Users,
              hint: 'Attendance & fees',
            },
          ].map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-start gap-3 rounded-md border border-zinc-200 bg-white px-3 py-3 transition-colors hover:border-[#12544f]/40"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#12544f]" />
                <div>
                  <div className="text-[13px] font-medium text-zinc-900">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-zinc-400">{item.hint}</div>
                </div>
              </Link>
            )
          })}
        </div>

        <SectionCard
          title="Report types"
          description="All use the same engine — published marks, NECTA grades A–F, division I–IV"
        >
          <ul className="grid gap-2 sm:grid-cols-2">
            {REPORT_KIND_OPTIONS.map((k) => (
              <li key={k.value}>
                <button
                  type="button"
                  onClick={() => navigate(`/report-cards/${k.value === 'transcript' ? 'transcripts' : k.value}`)}
                  className="flex w-full flex-col rounded-md border border-zinc-100 px-3 py-2.5 text-left hover:border-[#12544f]/30"
                >
                  <span className="text-[13px] font-medium text-zinc-900">
                    {k.label}
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    {k.description}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>

        <div className="rounded-md border border-emerald-100 bg-emerald-50/50 px-3 py-2 text-[12px] text-emerald-900">
          <CheckCircle2 className="mr-1.5 inline h-3.5 w-3.5" />
          Classes in the selector are limited to this school’s education levels
          {stagesHint ? ` (${stagesHint})` : ''}. Publish assessments under
          Examinations before printing.
        </div>
      </div>
    )
  } else if (section === 'generate') {
    body = (
      <div className="grid gap-4 lg:grid-cols-12">
        <SectionCard
          className="lg:col-span-4"
          title="Generate report card"
          description="Period → class → learner(s) · published marks only"
        >
          <div className="flex flex-col gap-4">
            <FiltersBlock showStudent showKind />
            <div className="flex flex-col gap-2">
              <FormButton isLoading={loading} onPress={() => runPreview()}>
                {params.student_id === 'all'
                  ? 'Generate all previews'
                  : 'Preview report card'}
              </FormButton>
              <FormButton
                appearance="bordered"
                isLoading={loading}
                onPress={() => runPrint()}
              >
                {params.student_id === 'all'
                  ? 'Open all printable cards'
                  : 'Open printable HTML'}
              </FormButton>
            </div>
          </div>
        </SectionCard>
        <div className="lg:col-span-8">
          <PreviewPane />
        </div>
      </div>
    )
  } else if (section === 'bulk') {
    body = (
      <div className="grid gap-4 lg:grid-cols-12">
        <SectionCard
          className="lg:col-span-4"
          title="Bulk print / export"
          description="Always prints the full class list for the selected period"
        >
          <div className="flex flex-col gap-4">
            <FiltersBlock
              showStudent={false}
              forceAllStudents
              showKind
            />
            <FormButton
              isLoading={loading}
              onPress={() => runPreview({ forceAll: true })}
            >
              Generate class previews
            </FormButton>
            <FormButton
              appearance="bordered"
              isLoading={loading}
              onPress={() => runPrint({ forceAll: true })}
            >
              Open class printable document
            </FormButton>
            <p className="text-[11px] text-zinc-500">
              One browser tab opens with all cards and page breaks — use Print /
              Save PDF. Allow pop-ups if the browser blocks the first open.
            </p>
          </div>
        </SectionCard>
        <div className="lg:col-span-8">
          <PreviewPane />
        </div>
      </div>
    )
  } else if (section === 'positions') {
    body = (
      <div className="flex flex-col gap-4">
        <SectionCard
          title="Class positions & division"
          description="From published assessments only · average grade points (lower is better)"
        >
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <FormField label="Academic year" required>
              <FormSelect
                label="Year"
                value={params.academic_year_id}
                onChange={(v) => setField('academic_year_id', v)}
                options={yearOptions}
              />
            </FormField>
            <FormField label="Term">
              <FormSelect
                label="Term"
                placeholder="All terms"
                value={params.term_id}
                onChange={(v) => setField('term_id', v)}
                options={termOptions}
              />
            </FormField>
            <FormField label="Class" required hint={stagesHint || undefined}>
              <FormSelect
                label="Class"
                value={params.classroom_id}
                onChange={(v) => setField('classroom_id', v)}
                options={classOptions}
              />
            </FormField>
          </div>
          <FormButton isLoading={rankLoading} onPress={runRanking}>
            Load positions
          </FormButton>
        </SectionCard>

        {rankData?.division_summary ? (
          <div className="flex flex-wrap gap-2">
            {['I', 'II', 'III', 'IV', '0'].map((div) => (
              <Chip key={div} variant="flat" className="h-7">
                Division {div}: {rankData.division_summary[div] || 0}
              </Chip>
            ))}
          </div>
        ) : null}

        <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
          <CardBody className="p-2">
            <Table shadow="none" aria-label="Positions">
              <TableHeader>
                <TableColumn>POS</TableColumn>
                <TableColumn>ADM NO</TableColumn>
                <TableColumn>NAME</TableColumn>
                <TableColumn>AVG PTS</TableColumn>
                <TableColumn>DIVISION</TableColumn>
                <TableColumn> </TableColumn>
              </TableHeader>
              <TableBody emptyContent="Load positions for a class and year">
                {(rankData?.ranking || []).map((r) => (
                  <TableRow key={r.student_id}>
                    <TableCell className="font-semibold tabular-nums">
                      {r.position}
                    </TableCell>
                    <TableCell className="font-mono text-[11px]">
                      {r.admission_number || '—'}
                    </TableCell>
                    <TableCell>{r.full_name}</TableCell>
                    <TableCell className="tabular-nums">
                      {r.average_points}
                    </TableCell>
                    <TableCell className="font-semibold">{r.division}</TableCell>
                    <TableCell>
                      <FormButton
                        appearance="flat"
                        className="!h-7 min-h-7 text-[11px]"
                        onPress={() => {
                          setParams((f) => ({
                            ...f,
                            student_id: String(r.student_id),
                          }))
                          navigate('/report-cards/generate')
                        }}
                      >
                        Report
                      </FormButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>
    )
  } else if (section === 'remarks') {
    body = (
      <div className="grid gap-4 lg:grid-cols-12">
        <SectionCard
          className="lg:col-span-5"
          title="Remarks templates"
          description="Applied when you generate a preview in this session. Head remark defaults from division if left blank."
        >
          <div className="flex flex-col gap-3">
            <FormField
              label="Class teacher remark"
              hint="Shown on terminal / progress cards"
            >
              <FormTextarea
                minRows={3}
                placeholder="e.g. Has shown improvement in class participation…"
                value={teacherRemark}
                onValueChange={setTeacherRemark}
              />
            </FormField>
            <FormField
              label="Head teacher remark (override)"
              hint="Leave empty to use automatic NECTA-style remark by division"
            >
              <FormTextarea
                minRows={3}
                placeholder="Optional override for head teacher comment"
                value={headRemarkOverride}
                onValueChange={setHeadRemarkOverride}
              />
            </FormField>
            <div className="rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 text-[11px] text-zinc-600">
              <p className="font-medium text-zinc-800">Default head remarks</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                <li>Division I — Excellent performance. Keep it up.</li>
                <li>Division II — Very good results. Aim higher next term.</li>
                <li>Division III — Average. More effort is needed.</li>
                <li>Division IV — Below average. Needs academic support.</li>
                <li>Division 0 — Unsatisfactory. Remedial action required.</li>
              </ul>
            </div>
            <FormButton
              appearance="bordered"
              onPress={() => navigate('/report-cards/generate')}
            >
              Continue to generate
            </FormButton>
          </div>
        </SectionCard>
        <div className="lg:col-span-7">
          <SectionCard
            title="How remarks appear"
            description="NECTA-oriented layout on printable HTML"
          >
            <ol className="list-decimal space-y-2 pl-4 text-[13px] text-zinc-600">
              <li>Publish assessments under Examinations → Approval.</li>
              <li>Optionally set class teacher / head remarks here.</li>
              <li>
                Generate for a class under Report cards → Generate or Bulk print.
              </li>
              <li>
                Remarks print under the subject table on the official card.
              </li>
            </ol>
          </SectionCard>
        </div>
      </div>
    )
  } else if (section === 'extras') {
    body = (
      <div className="grid gap-4 lg:grid-cols-12">
        <SectionCard
          className="lg:col-span-5"
          title="Sections on printed report"
          description="Toggle extras included when generating in this session"
        >
          <div className="flex flex-col gap-4">
            <Checkbox
              isSelected={includeAttendance}
              onValueChange={setIncludeAttendance}
              radius="sm"
              size="sm"
            >
              <span className="text-[13px]">
                Attendance summary on report
              </span>
            </Checkbox>
            <p className="text-[11px] text-zinc-500">
              Days present / absent for the term (when attendance module has
              data for the class).
            </p>
            <Checkbox
              isSelected={includeFeeBalance}
              onValueChange={setIncludeFeeBalance}
              radius="sm"
              size="sm"
            >
              <span className="text-[13px]">Fee balance on report</span>
            </Checkbox>
            <p className="text-[11px] text-zinc-500">
              Outstanding balance note for parents (finance data when linked).
            </p>
            <FormButton
              appearance="bordered"
              onPress={() => navigate('/report-cards/generate')}
            >
              Continue to generate
            </FormButton>
          </div>
        </SectionCard>
        <SectionCard
          className="lg:col-span-7"
          title="TAMISEMI notes"
          description="What schools typically put on report cards"
        >
          <ul className="space-y-2 text-[13px] text-zinc-600">
            <li>
              <strong className="text-zinc-800">Core:</strong> school identity,
              learner details, subjects with %, grade, points, class position,
              division.
            </li>
            <li>
              <strong className="text-zinc-800">Remarks:</strong> class teacher
              and head teacher comments.
            </li>
            <li>
              <strong className="text-zinc-800">Optional:</strong> attendance
              summary and fee status for parent meetings.
            </li>
          </ul>
        </SectionCard>
      </div>
    )
  } else {
    body = (
      <EmptyHint title="Report cards">
        Choose an item from the Assess → Report cards menu.
      </EmptyHint>
    )
  }

  const crumbs = [
    { label: 'Assess', href: '/attendance' },
    { label: 'Report cards', href: '/report-cards' },
    ...(section !== 'overview' ? [{ label: meta.title }] : []),
  ]

  return (
    <DashboardLayout>
      <div className="flex w-full min-w-0 flex-col gap-4">
        <PageHeader
          title={
            section === 'generate' && params.report_kind
              ? REPORT_KIND_LABEL[params.report_kind] || meta.title
              : meta.title
          }
          breadcrumbs={crumbs}
          description={meta.description}
          actions={
            section !== 'overview' ? (
              <FormButton
                appearance="flat"
                className="!h-8"
                onPress={() => navigate('/report-cards')}
              >
                Overview
              </FormButton>
            ) : null
          }
        />
        {body}
      </div>
    </DashboardLayout>
  )
}

export default ReportCardsWorkspace
