import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Chip } from '@heroui/react'
import { ArrowLeft, User } from 'lucide-react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import PageHeader from '../../components/Layout/PageHeader.jsx'
import { FormButton } from '../../components/Form'
import { getStudent } from '../../api/domain.js'
import { SectionSkeleton } from '../../components/Loading'

const statusColorMap = {
  active: 'success',
  transferred: 'warning',
  graduated: 'primary',
  inactive: 'danger',
}

function InfoRow({ label, value, className = '' }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <dt className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-[13px] text-zinc-900">
        {value != null && value !== '' ? value : '—'}
      </dd>
    </div>
  )
}

function Section({ title, children, className = '' }) {
  return (
    <section
      className={`rounded-md border border-zinc-200 bg-white shadow-none ${className}`}
    >
      <div className="border-b border-zinc-100 px-4 py-2.5">
        <h2 className="text-[13px] font-semibold text-zinc-900">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function StudentProfile() {
  const { id } = useParams()
  const navigate = useNavigate()

  const numericId = id && /^\d+$/.test(String(id)) ? String(id) : null

  const studentQ = useQuery({
    queryKey: ['students', 'detail', numericId],
    queryFn: () => getStudent(numericId),
    enabled: Boolean(numericId),
  })

  const student = studentQ.data?.student
  const displayName = student?.full_name || 'Student'

  const age = useMemo(() => {
    if (!student?.date_of_birth) return null
    const dob = new Date(student.date_of_birth)
    if (Number.isNaN(dob.getTime())) return null
    const now = new Date()
    let a = now.getFullYear() - dob.getFullYear()
    const m = now.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) a -= 1
    return a
  }, [student?.date_of_birth])

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title={studentQ.isLoading ? 'Student profile' : displayName}
          breadcrumbs={[
            { label: 'People', href: '/students' },
            { label: 'Students', href: '/students' },
            { label: student?.admission_number || 'Profile' },
          ]}
          description={
            student
              ? [
                  student.admission_number && `Adm. ${student.admission_number}`,
                  student.classroom?.name,
                  student.status,
                ]
                  .filter(Boolean)
                  .join(' · ')
              : 'Learner record'
          }
          actions={
            <FormButton
              appearance="bordered"
              startContent={<ArrowLeft className="h-4 w-4" />}
              onPress={() => navigate('/students')}
            >
              Back to list
            </FormButton>
          }
        />

        {studentQ.isLoading ? (
          <SectionSkeleton />
        ) : studentQ.isError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-6 text-center">
            <p className="text-sm text-rose-700">
              {studentQ.error?.message || 'Could not load student'}
            </p>
            <FormButton
              className="mt-3"
              appearance="bordered"
              onPress={() => navigate('/students')}
            >
              Return to students
            </FormButton>
          </div>
        ) : student ? (
          <>
            <div className="flex flex-wrap items-center gap-3 rounded-md border border-zinc-200 bg-white px-4 py-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#12544f]/10 text-[#12544f]">
                <User className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-semibold text-zinc-900">
                  {displayName}
                </h1>
                <p className="text-[11px] text-zinc-500">
                  {student.gender || '—'}
                  {age != null ? ` · ${age} yrs` : ''}
                  {student.date_of_birth ? ` · DOB ${student.date_of_birth}` : ''}
                </p>
              </div>
              <Chip
                size="sm"
                variant="flat"
                color={statusColorMap[student.status] || 'default'}
                className="h-6 capitalize"
              >
                {student.status}
              </Chip>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Section title="Personal details">
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoRow label="First name" value={student.first_name} />
                  <InfoRow label="Middle name" value={student.middle_name} />
                  <InfoRow label="Last name" value={student.last_name} />
                  <InfoRow label="Sex" value={student.gender} />
                  <InfoRow label="Date of birth" value={student.date_of_birth} />
                  <InfoRow
                    label="Birth certificate no."
                    value={student.birth_certificate_no}
                  />
                  <InfoRow label="Place of birth" value={student.place_of_birth} />
                  <InfoRow label="Region of birth" value={student.region_of_birth} />
                  <InfoRow
                    label="District of birth"
                    value={student.district_of_birth}
                  />
                  <InfoRow label="Nationality" value={student.nationality} />
                  <InfoRow label="Religion" value={student.religion} />
                  <InfoRow label="Disability" value={student.disability} />
                  <InfoRow label="Blood group" value={student.blood_group} />
                  <InfoRow label="Phone" value={student.phone} />
                </dl>
              </Section>

              <Section title="School / admission">
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoRow
                    label="Admission number"
                    value={student.admission_number}
                  />
                  <InfoRow label="PREMS / EMIS" value={student.prems_number} />
                  <InfoRow
                    label="Current class"
                    value={student.classroom?.name}
                  />
                  <InfoRow
                    label="Boarding status"
                    value={student.boarding_status}
                  />
                  <InfoRow
                    label="Admission date"
                    value={student.admission_date}
                  />
                  <InfoRow label="Status" value={student.status} />
                  <InfoRow
                    label="Previous school"
                    value={student.previous_school}
                  />
                  <InfoRow
                    label="Last class completed"
                    value={student.previous_class}
                  />
                </dl>
              </Section>

              <Section title="Address">
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoRow label="Region" value={student.address_region} />
                  <InfoRow label="District" value={student.address_district} />
                  <InfoRow label="Ward" value={student.address_ward} />
                  <InfoRow
                    label="Street / village"
                    value={student.address_street}
                    className="sm:col-span-2"
                  />
                </dl>
              </Section>

              <Section title="Guardians / parents">
                {(student.guardians || []).length === 0 ? (
                  <p className="text-[12px] text-zinc-500">
                    No guardians linked to this learner.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {student.guardians.map((g) => (
                      <li
                        key={g.id}
                        className="rounded-md border border-zinc-100 bg-zinc-50/80 px-3 py-2"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[13px] font-medium text-zinc-900">
                            {g.full_name}
                          </span>
                          <Chip size="sm" variant="flat" className="h-5 text-[10px] capitalize">
                            {g.relationship || 'Guardian'}
                          </Chip>
                          {g.is_primary ? (
                            <Chip
                              size="sm"
                              variant="flat"
                              color="primary"
                              className="h-5 text-[10px]"
                            >
                              Primary
                            </Chip>
                          ) : null}
                        </div>
                        <p className="mt-1 text-[11px] text-zinc-500">
                          {[g.phone, g.email, g.occupation]
                            .filter(Boolean)
                            .join(' · ') || 'No contact details'}
                        </p>
                        {g.nida_number ? (
                          <p className="text-[10px] text-zinc-400">
                            NIDA: {g.nida_number}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              {(student.enrollments || []).length > 0 ? (
                <Section title="Enrollment history" className="lg:col-span-2">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px] text-left text-[12px]">
                      <thead>
                        <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-wide text-zinc-400">
                          <th className="py-2 pr-3 font-medium">Class</th>
                          <th className="py-2 pr-3 font-medium">Year</th>
                          <th className="py-2 pr-3 font-medium">Enrolled</th>
                          <th className="py-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {student.enrollments.map((e) => (
                          <tr
                            key={e.id}
                            className="border-b border-zinc-50 text-zinc-800"
                          >
                            <td className="py-2 pr-3">{e.classroom || '—'}</td>
                            <td className="py-2 pr-3">
                              {e.academic_year || '—'}
                            </td>
                            <td className="py-2 pr-3">
                              {e.enrolled_at || '—'}
                            </td>
                            <td className="py-2 capitalize">{e.status || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>
              ) : null}

              {student.notes ? (
                <Section title="Notes" className="lg:col-span-2">
                  <p className="whitespace-pre-wrap text-[13px] text-zinc-700">
                    {student.notes}
                  </p>
                </Section>
              ) : null}
            </div>

            <p className="text-[11px] text-zinc-400">
              Need to update details? Use{' '}
              <Link
                to="/students/registration"
                className="text-[#12544f] underline-offset-2 hover:underline"
              >
                registration
              </Link>{' '}
              tools or ask an admin with edit access.
            </p>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  )
}

export default StudentProfile
