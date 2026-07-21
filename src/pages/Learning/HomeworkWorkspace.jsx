import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardBody, Chip, Spinner, useDisclosure } from '@heroui/react'
import {
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  MessageSquareText,
  Plus,
  RefreshCw,
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
  createAssignment,
  createAssignmentSubmission,
  getHomeworkOverview,
  getHomeworkReports,
  gradeAssignmentSubmission,
  listAssignmentSubmissions,
  listAssignments,
  listClasses,
  listStudents,
  listSubjects,
} from '../../api/domain.js'

const META = {
  '/homework': { title: 'Homework', section: 'overview', desc: 'Create homework, track submissions and feedback' },
  '/homework/create': { title: 'Create Homework', section: 'create', desc: 'Publish homework for a class and subject' },
  '/homework/submissions': { title: 'Online Submission', section: 'submissions', desc: 'Record and review student submissions' },
  '/homework/due-dates': { title: 'Due Dates', section: 'due-dates', desc: 'Upcoming and overdue homework' },
  '/homework/feedback': { title: 'Teacher Feedback', section: 'feedback', desc: 'Grade submissions and leave feedback' },
  '/homework/reports': { title: 'Homework Reports', section: 'reports', desc: 'Submission and scoring summary' },
}

const studentLabel = (s) =>
  s
    ? `${[s.first_name, s.last_name].filter(Boolean).join(' ')}${s.admission_number ? ` (${s.admission_number})` : ''}`
    : '—'

function Overview() {
  const navigate = useNavigate()
  const q = useQuery({ queryKey: ['homework', 'overview'], queryFn: getHomeworkOverview })
  const s = q.data?.summary || {}
  const cards = [
    { t: 'Create homework', d: 'Publish class homework', p: '/homework/create', icon: Plus },
    { t: 'Submissions', d: `${s.submissions ?? 0} total submissions`, p: '/homework/submissions', icon: ClipboardList },
    { t: 'Due dates', d: `${s.open_assignments ?? 0} open items`, p: '/homework/due-dates', icon: CalendarClock },
    { t: 'Feedback', d: `${s.pending_grading ?? 0} awaiting grade`, p: '/homework/feedback', icon: MessageSquareText },
    { t: 'Reports', d: 'Performance summary', p: '/homework/reports', icon: ClipboardCheck },
  ]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { l: 'Assignments', v: s.assignments ?? 0 },
          { l: 'Open', v: s.open_assignments ?? 0 },
          { l: 'Submissions', v: s.submissions ?? 0 },
          { l: 'To grade', v: s.pending_grading ?? 0 },
        ].map((x) => (
          <Card key={x.l} className="border border-slate-200 shadow-none">
            <CardBody className="p-2.5">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">{x.l}</p>
              <p className="text-lg font-semibold tabular-nums">{q.isLoading ? '…' : x.v}</p>
            </CardBody>
          </Card>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <Card key={c.p} isPressable className="border border-slate-200 shadow-none" onPress={() => navigate(c.p)}>
              <CardBody className="flex flex-row items-start gap-3 p-3.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B3D2E]/8 text-[#0B3D2E]">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{c.t}</h3>
                  <p className="text-xs text-slate-500">{c.d}</p>
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function CreateHomework() {
  const qc = useQueryClient()
  const subjectsQ = useQuery({ queryKey: ['academic', 'subjects'], queryFn: () => listSubjects() })
  const classesQ = useQuery({ queryKey: ['academic', 'classes'], queryFn: listClasses })
  const [form, setForm] = useState({
    title: '', description: '', instructions: '', classroom_id: '', subject_id: '',
    due_at: '', max_score: '100',
  })
  const mut = useMutation({
    mutationFn: createAssignment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['learning'] })
      qc.invalidateQueries({ queryKey: ['homework'] })
      toastSuccess('Homework created')
      setForm({ title: '', description: '', instructions: '', classroom_id: '', subject_id: '', due_at: '', max_score: '100' })
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })

  return (
    <Card className="max-w-2xl border border-slate-200 shadow-none">
      <CardBody className="space-y-3 p-4">
        <FormField label="Title" required>
          <FormInput value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Chapter 3 exercises" />
        </FormField>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Subject">
            <FormSelect
              options={(subjectsQ.data?.subjects || []).map((s) => ({ value: String(s.id), label: s.name }))}
              value={form.subject_id}
              onChange={(v) => setForm((f) => ({ ...f, subject_id: v }))}
              placeholder="Optional"
            />
          </FormField>
          <FormField label="Class">
            <FormSelect
              options={(classesQ.data?.classes || []).map((c) => ({ value: String(c.id), label: c.name }))}
              value={form.classroom_id}
              onChange={(v) => setForm((f) => ({ ...f, classroom_id: v }))}
              placeholder="Optional"
            />
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
          className="bg-[#0B3D2E]"
          color="primary"
          isLoading={mut.isPending}
          onPress={() =>
            mut.mutate({
              title: form.title,
              type: 'homework',
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
          Publish homework
        </FormButton>
      </CardBody>
    </Card>
  )
}

function SubmissionsSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const studentsQ = useQuery({
    queryKey: ['students', 'homework'],
    queryFn: () => listStudents({ per_page: 100, status: 'active' }),
  })
  const assignmentsQ = useQuery({
    queryKey: ['learning', 'assignments', 'homework'],
    queryFn: () => listAssignments({ type: 'homework', per_page: 100 }),
  })
  const listQ = useQuery({
    queryKey: ['learning', 'submissions', 'all'],
    queryFn: () => listAssignmentSubmissions({ per_page: 50 }),
  })
  const [form, setForm] = useState({ assignment_id: '', student_id: '', content: '' })
  const mut = useMutation({
    mutationFn: createAssignmentSubmission,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['learning', 'submissions'] })
      qc.invalidateQueries({ queryKey: ['homework'] })
      toastSuccess('Submission recorded')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })

  const columns = useMemo(
    () => [
      { accessorKey: 'student', header: 'Student', Cell: ({ row }) => studentLabel(row.original.student) },
      { accessorKey: 'assignment', header: 'Homework', Cell: ({ row }) => row.original.assignment?.title || '—' },
      {
        accessorKey: 'submitted_at',
        header: 'Submitted',
        Cell: ({ row }) => (row.original.submitted_at ? String(row.original.submitted_at).slice(0, 16).replace('T', ' ') : '—'),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => <Chip size="sm" variant="flat">{row.original.status}</Chip>,
      },
      {
        accessorKey: 'score',
        header: 'Score',
        Cell: ({ row }) => (row.original.score != null ? row.original.score : '—'),
      },
    ],
    [],
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <FormButton className="bg-[#0B3D2E]" color="primary" startContent={<Plus className="h-4 w-4" />} onPress={() => sheet.onOpen()}>
          Record submission
        </FormButton>
      </div>
      {listQ.isLoading ? (
        <div className="flex justify-center py-12"><Spinner color="success" /></div>
      ) : (
        <DataTable columns={columns} data={listQ.data?.submissions || []} emptyMessage="No submissions yet." />
      )}
      <SideSheet isOpen={sheet.isOpen} onOpenChange={sheet.onOpenChange} title="Record submission" size="md">
        <div className="space-y-3">
          <FormField label="Homework" required>
            <FormSelect
              options={(assignmentsQ.data?.assignments || []).map((a) => ({ value: String(a.id), label: a.title }))}
              value={form.assignment_id}
              onChange={(v) => setForm((f) => ({ ...f, assignment_id: v }))}
            />
          </FormField>
          <FormField label="Student" required>
            <FormSelect
              options={(studentsQ.data?.students || []).map((s) => ({ value: String(s.id), label: studentLabel(s) }))}
              value={form.student_id}
              onChange={(v) => setForm((f) => ({ ...f, student_id: v }))}
            />
          </FormField>
          <FormField label="Answer / notes">
            <FormTextarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} />
          </FormField>
          <FormButton
            className="w-full bg-[#0B3D2E]"
            color="primary"
            isLoading={mut.isPending}
            onPress={() =>
              mut.mutate({
                assignment_id: Number(form.assignment_id),
                student_id: Number(form.student_id),
                content: form.content || null,
              })
            }
          >
            Submit
          </FormButton>
        </div>
      </SideSheet>
    </div>
  )
}

function DueDatesSection() {
  const upcomingQ = useQuery({
    queryKey: ['learning', 'assignments', 'due-soon'],
    queryFn: () => listAssignments({ due_soon: 1, type: 'homework', per_page: 50 }),
  })
  const overdueQ = useQuery({
    queryKey: ['learning', 'assignments', 'overdue'],
    queryFn: () => listAssignments({ overdue: 1, type: 'homework', per_page: 50 }),
  })
  const columns = useMemo(
    () => [
      { accessorKey: 'title', header: 'Homework' },
      { accessorKey: 'classroom', header: 'Class', Cell: ({ row }) => row.original.classroom?.name || '—' },
      { accessorKey: 'subject', header: 'Subject', Cell: ({ row }) => row.original.subject?.name || '—' },
      {
        accessorKey: 'due_at',
        header: 'Due',
        Cell: ({ row }) => (row.original.due_at ? String(row.original.due_at).slice(0, 16).replace('T', ' ') : '—'),
      },
      { accessorKey: 'submissions_count', header: 'Subs', Cell: ({ row }) => row.original.submissions_count ?? 0 },
    ],
    [],
  )
  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-2 text-sm font-semibold">Due within 7 days</h3>
        {upcomingQ.isLoading ? <Spinner color="success" /> : (
          <DataTable columns={columns} data={upcomingQ.data?.assignments || []} emptyMessage="Nothing due soon." />
        )}
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-rose-700">Overdue</h3>
        {overdueQ.isLoading ? <Spinner color="success" /> : (
          <DataTable columns={columns} data={overdueQ.data?.assignments || []} emptyMessage="No overdue homework." />
        )}
      </div>
    </div>
  )
}

function FeedbackSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const listQ = useQuery({
    queryKey: ['learning', 'submissions', 'ungraded'],
    queryFn: () => listAssignmentSubmissions({ ungraded: 1, per_page: 50 }),
  })
  const [form, setForm] = useState({ id: null, score: '', feedback: '', grade: '' })
  const mut = useMutation({
    mutationFn: ({ id, ...p }) => gradeAssignmentSubmission(id, p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['learning', 'submissions'] })
      toastSuccess('Feedback saved')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  const columns = useMemo(
    () => [
      { accessorKey: 'student', header: 'Student', Cell: ({ row }) => studentLabel(row.original.student) },
      { accessorKey: 'assignment', header: 'Homework', Cell: ({ row }) => row.original.assignment?.title || '—' },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => <Chip size="sm" variant="flat">{row.original.status}</Chip>,
      },
      {
        id: 'actions',
        header: '',
        Cell: ({ row }) => (
          <FormButton
            size="sm"
            appearance="flat"
            color="success"
            onPress={() => {
              setForm({ id: row.original.id, score: '', feedback: '', grade: '' })
              sheet.onOpen()
            }}
          >
            Grade
          </FormButton>
        ),
      },
    ],
    [sheet],
  )
  return (
    <div className="space-y-4">
      {listQ.isLoading ? (
        <div className="flex justify-center py-12"><Spinner color="success" /></div>
      ) : (
        <DataTable columns={columns} data={listQ.data?.submissions || []} emptyMessage="No submissions waiting for feedback." />
      )}
      <SideSheet isOpen={sheet.isOpen} onOpenChange={sheet.onOpenChange} title="Teacher feedback" size="md">
        <div className="space-y-3">
          <FormField label="Score" required>
            <FormInput type="number" value={form.score} onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))} />
          </FormField>
          <FormField label="Grade letter">
            <FormInput value={form.grade} onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))} placeholder="Optional (auto A–F)" />
          </FormField>
          <FormField label="Feedback">
            <FormTextarea value={form.feedback} onChange={(e) => setForm((f) => ({ ...f, feedback: e.target.value }))} />
          </FormField>
          <FormButton
            className="w-full bg-[#0B3D2E]"
            color="primary"
            isLoading={mut.isPending}
            onPress={() =>
              mut.mutate({
                id: form.id,
                score: Number(form.score),
                grade: form.grade || null,
                feedback: form.feedback || null,
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

function ReportsSection() {
  const q = useQuery({ queryKey: ['homework', 'reports'], queryFn: getHomeworkReports })
  if (q.isLoading) return <div className="flex justify-center py-12"><Spinner color="success" /></div>
  const subs = q.data?.submissions || {}
  const byType = q.data?.assignments_by_type || []
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border border-slate-200 shadow-none">
          <CardBody className="py-3">
            <p className="text-xs text-slate-500">Graded submissions</p>
            <p className="text-xl font-semibold">{subs.graded ?? 0}</p>
          </CardBody>
        </Card>
        <Card className="border border-slate-200 shadow-none">
          <CardBody className="py-3">
            <p className="text-xs text-slate-500">Average score</p>
            <p className="text-xl font-semibold">{subs.average_score ?? 0}</p>
          </CardBody>
        </Card>
      </div>
      <Card className="border border-slate-200 shadow-none">
        <CardBody>
          <h3 className="mb-2 text-sm font-semibold">By assignment type</h3>
          {byType.length === 0 ? (
            <p className="text-sm text-slate-500">No data yet.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {byType.map((r) => (
                <li key={r.type} className="flex justify-between border-b border-slate-50 py-1.5">
                  <span className="capitalize">{r.type}</span>
                  <span>{r.total} total · {r.published} published</span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

export default function HomeworkWorkspace() {
  const { pathname } = useLocation()
  const meta = META[pathname] || META['/homework']
  let body
  switch (meta.section) {
    case 'overview': body = <Overview />; break
    case 'create': body = <CreateHomework />; break
    case 'submissions': body = <SubmissionsSection />; break
    case 'due-dates': body = <DueDatesSection />; break
    case 'feedback': body = <FeedbackSection />; break
    case 'reports': body = <ReportsSection />; break
    default: body = <Overview />
  }
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title={meta.title}
          description={meta.desc}
          breadcrumbs={[
            { label: 'Learning', href: '/learning' },
            { label: 'Homework', href: '/homework' },
            { label: meta.title },
          ]}
        />
        {body}
      </div>
    </DashboardLayout>
  )
}
