import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Card,
  CardHeader,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Spinner,
} from '@heroui/react'
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
  listClasses,
  listYears,
  getAttendanceRoster,
  markAttendance,
} from '../../api/domain.js'

const STATUSES = ['present', 'absent', 'late', 'excused']

function DailyAttendance() {
  const [classroomId, setClassroomId] = useState('')
  const [yearId, setYearId] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [session, setSession] = useState('morning')
  const [marks, setMarks] = useState({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const classesQ = useQuery({ queryKey: ['academic', 'classes'], queryFn: listClasses })
  const yearsQ = useQuery({ queryKey: ['academic', 'years'], queryFn: listYears })

  const rosterQ = useQuery({
    queryKey: ['attendance', 'roster', classroomId, date, session, yearId],
    queryFn: () =>
      getAttendanceRoster({
        classroom_id: classroomId,
        date,
        session,
        academic_year_id: yearId || undefined,
      }),
    enabled: Boolean(classroomId && date),
  })

  useEffect(() => {
    const roster = rosterQ.data?.roster || []
    const next = {}
    roster.forEach((r) => {
      next[r.student_id] = r.status || 'present'
    })
    setMarks(next)
  }, [rosterQ.data])

  useEffect(() => {
    const years = yearsQ.data?.academic_years || []
    const current = years.find((y) => y.is_current) || years[0]
    if (current && !yearId) setYearId(String(current.id))
  }, [yearsQ.data, yearId])

  const saveMut = useMutation({
    mutationFn: markAttendance,
    onSuccess: (data) => {
      setMessage(`Saved ${data.saved} marks`)
      setError('')
      toastSuccess('Attendance saved', `${data.saved} mark(s) recorded.`)
      rosterQ.refetch()
    },
    onError: (e) => {
      setError(e.message)
      setMessage('')
      toastError('Could not save attendance', e.message)
    },
  })

  const roster = rosterQ.data?.roster || []
  const summary = rosterQ.data?.summary
  // API filters classes to this school's education stages
  const classes = classesQ.data?.classes || []
  const years = yearsQ.data?.academic_years || []

  const payloadMarks = useMemo(
    () =>
      Object.entries(marks).map(([student_id, status]) => ({
        student_id: Number(student_id),
        status,
      })),
    [marks],
  )

  const markAll = (status) => {
    const next = {}
    roster.forEach((r) => {
      next[r.student_id] = status
    })
    setMarks(next)
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Daily Attendance"
          breadcrumbs={[
            { label: 'Assessment', href: '/attendance' },
            { label: 'Daily Attendance' },
          ]}
          description="Mark morning / afternoon sessions by class"
        />

        <Card className="border border-slate-200 shadow-none">
          <CardBody className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <FormField label="Class" className="min-w-[160px]">
              <FormSelect
                label="Class"
                placeholder={classes.length ? 'Select class' : 'No classes for school levels'}
                value={classroomId}
                onChange={setClassroomId}
                options={classes.map((c) => {
                  const level = c.education_level || c.educationLevel
                  const levelBit = level?.name ? ` · ${level.name}` : ''
                  return {
                    value: String(c.id),
                    label: `${c.name}${levelBit}`,
                  }
                })}
              />
            </FormField>
            <FormField label="Year" className="min-w-[140px]">
              <FormSelect label="Year" placeholder="Any" value={yearId} onChange={setYearId} options={years.map((y) => ({ value: String(y.id), label: y.name }))} />
            </FormField>
            <FormField label="Date" className="w-40">
              <FormInput type="date" value={date} onValueChange={setDate} />
            </FormField>
            <FormField label="Session">
              <FormSelect label="Session" value={session} onChange={setSession} options={[
                { value: 'morning', label: 'Morning' },
                { value: 'afternoon', label: 'Afternoon' },
                { value: 'full', label: 'Full day' },
              ]} />
            </FormField>
            <FormButton appearance="flat" onPress={() => rosterQ.refetch()} isDisabled={!classroomId}>Load roster</FormButton>
          </CardBody>
        </Card>

        {summary && (
          <div className="flex flex-wrap gap-2">
            <Chip size="sm" variant="flat">Total {summary.total}</Chip>
            <Chip size="sm" color="success" variant="flat">Present {summary.present}</Chip>
            <Chip size="sm" color="primary" variant="flat">Absent {summary.absent}</Chip>
            <Chip size="sm" color="warning" variant="flat">Late {summary.late}</Chip>
            <Chip size="sm" color="primary" variant="flat">Excused {summary.excused}</Chip>
            <Chip size="sm" variant="bordered">Unmarked {summary.unmarked}</Chip>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}

        <Card className="border border-slate-200 shadow-none">
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold">Class roster</span>
            <div className="flex flex-wrap gap-2">
              <FormButton appearance="flat" onPress={() => markAll('present')}>All present</FormButton>
              <FormButton appearance="flat" onPress={() => markAll('absent')}>All absent</FormButton>
              <FormButton
                isLoading={saveMut.isPending}
                isDisabled={!payloadMarks.length}
                onPress={() =>
                  saveMut.mutate({
                    date,
                    session,
                    marks: payloadMarks,
                  })
                }
              >
                Save attendance
              </FormButton>
            </div>
          </CardHeader>
          <CardBody>
            {!classroomId ? (
              <p className="text-sm text-slate-500">Select a class to load students.</p>
            ) : rosterQ.isLoading ? (
              <Spinner color="primary" />
            ) : rosterQ.isError ? (
              <p className="text-sm text-red-600">{rosterQ.error?.message}</p>
            ) : (
              <Table shadow="none" aria-label="Attendance roster">
                <TableHeader>
                  <TableColumn>ADM NO</TableColumn>
                  <TableColumn>STUDENT</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No enrolled students in this class">
                  {roster.map((r) => (
                    <TableRow key={r.student_id}>
                      <TableCell>{r.admission_number || '—'}</TableCell>
                      <TableCell>{r.full_name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {STATUSES.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setMarks((m) => ({ ...m, [r.student_id]: s }))}
                              className={`rounded-full px-2 py-0.5 text-xs capitalize ${
                                marks[r.student_id] === s
                                  ? 'bg-[#0B3D2E] text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default DailyAttendance
