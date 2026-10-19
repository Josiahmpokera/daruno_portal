import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardBody } from '@heroui/react'
import dayjs from 'dayjs'
import {
  AlertTriangle,
  CheckCircle2,
  GraduationCap,
  IdCard,
  MapPin,
  School,
  StickyNote,
  UserPlus,
  UserRound,
  Users,
} from 'lucide-react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import PageHeader from '../../components/Layout/PageHeader.jsx'
import {
  FieldGrid,
  FieldGroupTitle,
  FormButton,
  FormField,
  FormInput,
  FormSection,
  FormSelect,
  FormTextarea,
  ProgressChecklist,
  SummaryList,
  scrollToId,
} from '../../components/Form'
import { toastError, toastSuccess } from '../../components/Toast'
import { createStudent, listClasses, listTerms, listYears } from '../../api/domain.js'

/* ── Reference data ──────────────────────────────────────────────── */

/** Tanzania regions (TAMISEMI) */
const TZ_REGIONS = [
  'Arusha', 'Dar es Salaam', 'Dodoma', 'Geita', 'Iringa', 'Kagera', 'Katavi', 'Kigoma',
  'Kilimanjaro', 'Lindi', 'Manyara', 'Mara', 'Mbeya', 'Morogoro', 'Mtwara', 'Mwanza',
  'Njombe', 'Pwani', 'Rukwa', 'Ruvuma', 'Shinyanga', 'Simiyu', 'Singida', 'Songwe',
  'Tabora', 'Tanga', 'Zanzibar North', 'Zanzibar South', 'Zanzibar Urban/West',
  'Pemba North', 'Pemba South',
].map((r) => ({ value: r, label: r }))

const SEXES = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
]
const RELIGIONS = ['Christian', 'Muslim', 'Other', 'None'].map((v) => ({ value: v, label: v }))
const DISABILITIES = ['None', 'Visual', 'Hearing', 'Physical', 'Intellectual', 'Multiple', 'Other'].map((v) => ({ value: v, label: v }))
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((v) => ({ value: v, label: v }))
const BOARDING = [
  { value: 'day', label: 'Day scholar' },
  { value: 'boarding', label: 'Boarding' },
  { value: 'hostel', label: 'Hostel' },
]
const GUARDIAN_RELATIONSHIPS = ['Guardian', 'Uncle', 'Aunt', 'Grandparent', 'Sibling', 'Other'].map((v) => ({ value: v, label: v }))

const emptyForm = () => ({
  first_name: '',
  middle_name: '',
  last_name: '',
  gender: '',
  date_of_birth: '',
  nationality: 'Tanzanian',
  religion: '',
  disability: 'None',
  blood_group: '',
  birth_certificate_no: '',
  place_of_birth: '',
  region_of_birth: '',
  district_of_birth: '',
  admission_number: '',
  prems_number: '',
  phone: '',
  address_region: '',
  address_district: '',
  address_ward: '',
  address_street: '',
  father_name: '',
  father_phone: '',
  father_occupation: '',
  father_nida: '',
  mother_name: '',
  mother_phone: '',
  mother_occupation: '',
  mother_nida: '',
  guardian_name: '',
  guardian_phone: '',
  guardian_relationship: 'Guardian',
  guardian_occupation: '',
  primary_contact: '',
  previous_school: '',
  previous_class: '',
  admission_date: dayjs().format('YYYY-MM-DD'),
  boarding_status: 'day',
  academic_year_id: '',
  term_id: '',
  classroom_id: '',
  notes: '',
})

const PHONE_RE = /^\+?[\d\s-]{9,16}$/

/** Field-level validation (mirrors API + TAMISEMI requirements). */
function validate(f, { yearId }) {
  const e = {}
  if (!f.first_name.trim()) e.first_name = 'First name is required'
  if (!f.last_name.trim()) e.last_name = 'Last name is required'
  if (!f.gender) e.gender = 'Select the learner’s sex'
  if (!f.date_of_birth) e.date_of_birth = 'Date of birth is required for EMIS'
  else if (dayjs(f.date_of_birth).isAfter(dayjs())) e.date_of_birth = 'Date of birth cannot be in the future'
  else if (dayjs().diff(dayjs(f.date_of_birth), 'year') > 30) e.date_of_birth = 'Check the year — learner would be over 30'
  for (const k of ['phone', 'father_phone', 'mother_phone', 'guardian_phone']) {
    if (f[k].trim() && !PHONE_RE.test(f[k].trim())) e[k] = 'Enter a valid phone number'
  }
  if (!f.father_name.trim() && !f.mother_name.trim() && !f.guardian_name.trim()) {
    e.guardians = 'Add at least one parent or guardian'
  }
  if (!f.admission_date) e.admission_date = 'Admission date is required'
  if (!yearId) e.academic_year_id = 'Select the academic year'
  if (!f.classroom_id) e.classroom_id = 'Select the class the learner joins'
  return e
}

const FIELD_SECTION = {
  first_name: 'learner',
  last_name: 'learner',
  gender: 'learner',
  date_of_birth: 'learner',
  phone: 'residence',
  father_phone: 'guardians',
  mother_phone: 'guardians',
  guardian_phone: 'guardians',
  guardians: 'guardians',
  admission_date: 'enrollment',
  academic_year_id: 'enrollment',
  classroom_id: 'enrollment',
}

const SECTIONS = [
  { key: 'learner', title: 'Learner details', required: true },
  { key: 'identity', title: 'Birth & identifiers' },
  { key: 'residence', title: 'Residence & contact' },
  { key: 'guardians', title: 'Parents & guardians', required: true },
  { key: 'previous', title: 'Previous school' },
  { key: 'enrollment', title: 'Enrollment', required: true },
  { key: 'notes', title: 'Notes' },
]

function sectionDone(key, f, yearId) {
  switch (key) {
    case 'learner':
      return Boolean(f.first_name.trim() && f.last_name.trim() && f.gender && f.date_of_birth)
    case 'identity':
      return Boolean(f.birth_certificate_no.trim() || f.place_of_birth.trim() || f.prems_number.trim())
    case 'residence':
      return Boolean(f.address_region || f.address_district.trim())
    case 'guardians':
      return Boolean(f.father_name.trim() || f.mother_name.trim() || f.guardian_name.trim())
    case 'previous':
      return Boolean(f.previous_school.trim())
    case 'enrollment':
      return Boolean(f.classroom_id && yearId && f.admission_date)
    case 'notes':
      return Boolean(f.notes.trim())
    default:
      return false
  }
}

const sectionId = (key) => `register-${key}`

const ageOf = (dob) => {
  if (!dob || !dayjs(dob).isValid() || dayjs(dob).isAfter(dayjs())) return null
  return dayjs().diff(dayjs(dob), 'year')
}

/* ── Success screen ──────────────────────────────────────────────── */

function RegistrationSuccess({ student, className, onAnother }) {
  const navigate = useNavigate()
  const s = student || {}
  const name = s.full_name || [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(' ') || 'Learner'
  const rows = [
    ['Admission number', s.admission_number],
    ['PREMS / EMIS number', s.prems_number],
    ['Class', s.classroom?.name || className],
    ['Admission date', s.admission_date ? dayjs(s.admission_date).format('D MMM YYYY') : null],
    ['Parents / guardians', s.guardians?.length ? `${s.guardians.length} recorded` : null],
  ]
  return (
    <Card className="border border-slate-200 shadow-none">
      <CardBody className="p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
          <div className="lg:max-w-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" strokeWidth={1.75} />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">{name} is registered</h2>
            <p className="mt-1 text-sm text-slate-500">
              The learner record, enrollment and parent / guardian contacts have been saved.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {s.id ? <FormButton onPress={() => navigate(`/students/${s.id}`)}>View profile</FormButton> : null}
              <FormButton appearance="bordered" startContent={<UserPlus className="h-4 w-4" />} onPress={onAnother}>
                Register another
              </FormButton>
              <FormButton appearance="light" onPress={() => navigate('/students/list')}>
                All students
              </FormButton>
            </div>
          </div>
          <dl className="min-w-0 flex-1 divide-y divide-slate-100 rounded-lg border border-slate-200">
            {rows.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[minmax(8rem,40%)_1fr] gap-3 px-4 py-2.5 text-[13px]">
                <dt className="text-slate-500">{label}</dt>
                <dd className="min-w-0 break-words font-medium text-slate-900">
                  {value || <span className="font-normal text-slate-400">—</span>}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </CardBody>
    </Card>
  )
}

/* ── Page ────────────────────────────────────────────────────────── */

function StudentRegistration() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [form, setForm] = useState(emptyForm)
  const [showErrors, setShowErrors] = useState(false)
  const [result, setResult] = useState(null)
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))

  const yearsQ = useQuery({ queryKey: ['academic', 'years'], queryFn: listYears })
  const classesQ = useQuery({ queryKey: ['academic', 'classes'], queryFn: listClasses })
  const termsQ = useQuery({ queryKey: ['academic', 'terms'], queryFn: listTerms })

  const years = useMemo(() => yearsQ.data?.academic_years || yearsQ.data?.years || [], [yearsQ.data])
  const classes = useMemo(
    () => (classesQ.data?.classes || []).filter((c) => c.is_active !== false),
    [classesQ.data],
  )
  const currentYear = years.find((y) => y.is_current) || years[0]
  const yearId = form.academic_year_id || (currentYear ? String(currentYear.id) : '')
  const terms = (termsQ.data?.terms || []).filter(
    (t) => !t.academic_year_id || String(t.academic_year_id) === String(yearId),
  )
  const selectedClass = classes.find((c) => String(c.id) === form.classroom_id)

  const errors = useMemo(() => validate(form, { yearId }), [form, yearId])
  const err = (k) => (showErrors ? errors[k] : undefined)

  const classOptions = classes.map((c) => {
    const level = c.education_level?.name
    const full = c.capacity && c.active_students_count >= c.capacity
    return {
      value: String(c.id),
      label: `${c.name}${level ? ` · ${level}` : ''}${full ? ' (full)' : ''}`,
    }
  })

  const createMut = useMutation({
    mutationFn: createStudent,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['students'] })
      qc.invalidateQueries({ queryKey: ['academic', 'classes'] })
      const student = data?.student || data
      toastSuccess(
        'Student registered',
        student?.admission_number ? `Admission no. ${student.admission_number}` : undefined,
      )
      setResult({ student, className: selectedClass?.name })
      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
    },
    onError: (e) => toastError('Registration failed', e?.message || 'Please check the form and try again.'),
  })

  const buildGuardians = () => {
    const filled = [
      form.father_name.trim() && {
        key: 'father',
        relationship: 'father',
        full_name: form.father_name.trim(),
        phone: form.father_phone.trim() || undefined,
        occupation: form.father_occupation.trim() || undefined,
        nida_number: form.father_nida.trim() || undefined,
      },
      form.mother_name.trim() && {
        key: 'mother',
        relationship: 'mother',
        full_name: form.mother_name.trim(),
        phone: form.mother_phone.trim() || undefined,
        occupation: form.mother_occupation.trim() || undefined,
        nida_number: form.mother_nida.trim() || undefined,
      },
      form.guardian_name.trim() && {
        key: 'guardian',
        relationship: (form.guardian_relationship || 'guardian').toLowerCase(),
        full_name: form.guardian_name.trim(),
        phone: form.guardian_phone.trim() || undefined,
        occupation: form.guardian_occupation.trim() || undefined,
      },
    ].filter(Boolean)
    const primary = filled.some((g) => g.key === form.primary_contact) ? form.primary_contact : filled[0]?.key
    return filled.map(({ key, ...g }) => ({ ...g, is_primary: key === primary }))
  }

  const submit = () => {
    setShowErrors(true)
    const keys = Object.keys(errors)
    if (keys.length) {
      toastError('Please fix the highlighted fields')
      scrollToId(sectionId(FIELD_SECTION[keys[0]] || 'learner'))
      return
    }
    const v = (x) => (typeof x === 'string' ? x.trim() || undefined : x || undefined)
    createMut.mutate({
      first_name: form.first_name.trim(),
      middle_name: v(form.middle_name),
      last_name: form.last_name.trim(),
      gender: form.gender,
      date_of_birth: form.date_of_birth,
      nationality: v(form.nationality) || 'Tanzanian',
      religion: v(form.religion),
      disability: form.disability && form.disability !== 'None' ? form.disability : undefined,
      blood_group: v(form.blood_group),
      birth_certificate_no: v(form.birth_certificate_no),
      place_of_birth: v(form.place_of_birth),
      region_of_birth: v(form.region_of_birth),
      district_of_birth: v(form.district_of_birth),
      admission_number: v(form.admission_number),
      prems_number: v(form.prems_number),
      phone: v(form.phone),
      address_region: v(form.address_region),
      address_district: v(form.address_district),
      address_ward: v(form.address_ward),
      address_street: v(form.address_street),
      previous_school: v(form.previous_school),
      previous_class: v(form.previous_class),
      admission_date: form.admission_date,
      boarding_status: form.boarding_status || 'day',
      notes: v(form.notes),
      status: 'active',
      academic_year_id: Number(yearId),
      term_id: form.term_id ? Number(form.term_id) : undefined,
      classroom_id: Number(form.classroom_id),
      guardians: buildGuardians(),
    })
  }

  const reset = () => {
    setForm(emptyForm())
    setShowErrors(false)
    setResult(null)
    createMut.reset()
  }

  const fullName = [form.first_name, form.middle_name, form.last_name].map((x) => x.trim()).filter(Boolean).join(' ')
  const age = ageOf(form.date_of_birth)
  const guardianNames = [
    form.father_name.trim() && 'father',
    form.mother_name.trim() && 'mother',
    form.guardian_name.trim() && 'guardian',
  ].filter(Boolean)
  const checklist = SECTIONS.map((s) => ({
    ...s,
    done: sectionDone(s.key, form, yearId),
    hasError: showErrors && Object.keys(errors).some((k) => FIELD_SECTION[k] === s.key),
  }))
  const requiredLeft = checklist.filter((c) => c.required && !c.done).length
  const classFull = selectedClass?.capacity && selectedClass.active_students_count >= selectedClass.capacity

  const header = (
    <PageHeader
      title="Student registration"
      breadcrumbs={[
        { label: 'People', href: '/students' },
        { label: 'Students', href: '/students/list' },
        { label: 'Registration' },
      ]}
      description="Register a new learner — TAMISEMI / PREMS-aligned details, parents and class enrollment"
    />
  )

  if (result) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-4">
          {header}
          <RegistrationSuccess student={result.student} className={result.className} onAnother={reset} />
        </div>
      </DashboardLayout>
    )
  }

  const actions = (
    <div className="flex flex-col gap-2">
      <FormButton
        className="w-full"
        isLoading={createMut.isPending}
        startContent={createMut.isPending ? null : <UserPlus className="h-4 w-4" />}
        onPress={submit}
      >
        Complete registration
      </FormButton>
      <FormButton className="w-full" appearance="light" onPress={() => navigate('/students/list')} isDisabled={createMut.isPending}>
        Cancel
      </FormButton>
    </div>
  )

  const guardianBlock = (prefix, title, extra = null) => (
    <div className="min-w-0 rounded-lg border border-slate-200 p-3.5">
      <FieldGroupTitle
        aside={
          form[`${prefix}_name`].trim() ? (
            <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-slate-600">
              <input
                type="radio"
                name="primary_contact"
                className="accent-[#0B3D2E]"
                checked={
                  form.primary_contact === prefix ||
                  (!guardianNames.includes(form.primary_contact) && guardianNames[0] === prefix)
                }
                onChange={() => set('primary_contact')(prefix)}
              />
              Primary contact
            </label>
          ) : null
        }
      >
        {title}
      </FieldGroupTitle>
      <div className="grid grid-cols-1 gap-3">
        {extra}
        <FormField label="Full name">
          <FormInput value={form[`${prefix}_name`]} onValueChange={set(`${prefix}_name`)} autoComplete="off" />
        </FormField>
        <FormField label="Phone" error={err(`${prefix}_phone`)}>
          <FormInput
            type="tel"
            value={form[`${prefix}_phone`]}
            onValueChange={set(`${prefix}_phone`)}
            isInvalid={!!err(`${prefix}_phone`)}
            placeholder="+255 7XX XXX XXX"
          />
        </FormField>
        <FormField label="Occupation">
          <FormInput value={form[`${prefix}_occupation`]} onValueChange={set(`${prefix}_occupation`)} />
        </FormField>
        {prefix !== 'guardian' ? (
          <FormField label="NIDA number">
            <FormInput value={form[`${prefix}_nida`]} onValueChange={set(`${prefix}_nida`)} inputMode="numeric" autoComplete="off" />
          </FormField>
        ) : null}
      </div>
    </div>
  )

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        {header}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
          <form
            className="min-w-0 space-y-4"
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            <FormSection
              id={sectionId('learner')}
              index={1}
              title="Learner details"
              icon={UserRound}
              description="Legal names exactly as on the birth certificate."
            >
              <FieldGrid>
                <FormField label="First name" required error={err('first_name')}>
                  <FormInput value={form.first_name} onValueChange={set('first_name')} isInvalid={!!err('first_name')} autoComplete="off" />
                </FormField>
                <FormField label="Middle name">
                  <FormInput value={form.middle_name} onValueChange={set('middle_name')} autoComplete="off" />
                </FormField>
                <FormField label="Last name / surname" required error={err('last_name')}>
                  <FormInput value={form.last_name} onValueChange={set('last_name')} isInvalid={!!err('last_name')} autoComplete="off" />
                </FormField>
                <FormField label="Sex" required error={err('gender')}>
                  <FormSelect placeholder="Select sex" value={form.gender} onChange={set('gender')} options={SEXES} isInvalid={!!err('gender')} />
                </FormField>
                <FormField
                  label="Date of birth"
                  required
                  error={err('date_of_birth')}
                  hint={age !== null ? `Age ${age}` : undefined}
                >
                  <FormInput
                    type="date"
                    value={form.date_of_birth}
                    onValueChange={set('date_of_birth')}
                    isInvalid={!!err('date_of_birth')}
                    max={dayjs().format('YYYY-MM-DD')}
                  />
                </FormField>
                <FormField label="Nationality">
                  <FormInput value={form.nationality} onValueChange={set('nationality')} />
                </FormField>
                <FormField label="Religion">
                  <FormSelect placeholder="Select religion" value={form.religion} onChange={set('religion')} options={RELIGIONS} />
                </FormField>
                <FormField label="Disability">
                  <FormSelect value={form.disability} onChange={(v) => set('disability')(v || 'None')} options={DISABILITIES} />
                </FormField>
                <FormField label="Blood group">
                  <FormSelect placeholder="Unknown" value={form.blood_group} onChange={set('blood_group')} options={BLOOD_GROUPS} />
                </FormField>
              </FieldGrid>
            </FormSection>

            <FormSection
              id={sectionId('identity')}
              index={2}
              title="Birth & identifiers"
              icon={IdCard}
              optional
              description="Birth registration and official learner numbers. Admission numbers are generated automatically when left empty."
            >
              <FieldGrid>
                <FormField label="Birth certificate number">
                  <FormInput value={form.birth_certificate_no} onValueChange={set('birth_certificate_no')} autoComplete="off" />
                </FormField>
                <FormField label="Place of birth">
                  <FormInput placeholder="Village / town / hospital" value={form.place_of_birth} onValueChange={set('place_of_birth')} />
                </FormField>
                <FormField label="Region of birth">
                  <FormSelect placeholder="Select region" value={form.region_of_birth} onChange={set('region_of_birth')} options={TZ_REGIONS} />
                </FormField>
                <FormField label="District of birth">
                  <FormInput value={form.district_of_birth} onValueChange={set('district_of_birth')} />
                </FormField>
                <FormField label="Admission number" hint="Leave empty to auto-generate (ADM-YYYY-####)">
                  <FormInput value={form.admission_number} onValueChange={set('admission_number')} placeholder="Auto" autoComplete="off" />
                </FormField>
                <FormField label="PREMS / EMIS number" hint="Government learner ID, if already issued">
                  <FormInput value={form.prems_number} onValueChange={set('prems_number')} autoComplete="off" />
                </FormField>
              </FieldGrid>
            </FormSection>

            <FormSection
              id={sectionId('residence')}
              index={3}
              title="Residence & contact"
              icon={MapPin}
              optional
              description="Where the learner currently lives."
            >
              <FieldGrid>
                <FormField label="Region">
                  <FormSelect placeholder="Select region" value={form.address_region} onChange={set('address_region')} options={TZ_REGIONS} />
                </FormField>
                <FormField label="District">
                  <FormInput value={form.address_district} onValueChange={set('address_district')} />
                </FormField>
                <FormField label="Ward">
                  <FormInput value={form.address_ward} onValueChange={set('address_ward')} />
                </FormField>
                <FormField label="Street / village">
                  <FormInput value={form.address_street} onValueChange={set('address_street')} />
                </FormField>
                <FormField label="Home phone" error={err('phone')}>
                  <FormInput type="tel" value={form.phone} onValueChange={set('phone')} isInvalid={!!err('phone')} placeholder="+255 7XX XXX XXX" />
                </FormField>
              </FieldGrid>
            </FormSection>

            <FormSection
              id={sectionId('guardians')}
              index={4}
              title="Parents & guardians"
              icon={Users}
              description="At least one parent or guardian is required. The primary contact receives school communication."
            >
              {err('guardians') ? (
                <p className="mb-3 flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700" role="alert">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {err('guardians')}
                </p>
              ) : null}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {guardianBlock('father', 'Father')}
                {guardianBlock('mother', 'Mother')}
                {guardianBlock(
                  'guardian',
                  'Other guardian',
                  <FormField label="Relationship">
                    <FormSelect
                      value={form.guardian_relationship}
                      onChange={(v) => set('guardian_relationship')(v || 'Guardian')}
                      options={GUARDIAN_RELATIONSHIPS}
                    />
                  </FormField>,
                )}
              </div>
            </FormSection>

            <FormSection
              id={sectionId('previous')}
              index={5}
              title="Previous school"
              icon={School}
              optional
              description="Leave empty for first-time entrants (e.g. Standard 1 or Form 1)."
            >
              <FieldGrid columns={2}>
                <FormField label="Previous school">
                  <FormInput value={form.previous_school} onValueChange={set('previous_school')} />
                </FormField>
                <FormField label="Last class completed">
                  <FormInput placeholder="e.g. Standard 7, Form 2" value={form.previous_class} onValueChange={set('previous_class')} />
                </FormField>
              </FieldGrid>
            </FormSection>

            <FormSection
              id={sectionId('enrollment')}
              index={6}
              title="Enrollment"
              icon={GraduationCap}
              description="The class and academic year the learner joins today."
            >
              <FieldGrid>
                <FormField label="Admission date" required error={err('admission_date')}>
                  <FormInput type="date" value={form.admission_date} onValueChange={set('admission_date')} isInvalid={!!err('admission_date')} />
                </FormField>
                <FormField label="Academic year" required error={err('academic_year_id')}>
                  <FormSelect
                    placeholder={yearsQ.isLoading ? 'Loading…' : 'Select year'}
                    value={yearId}
                    onChange={(v) => setForm((f) => ({ ...f, academic_year_id: v, term_id: '' }))}
                    options={years.map((y) => ({ value: String(y.id), label: `${y.name}${y.is_current ? ' (current)' : ''}` }))}
                    isInvalid={!!err('academic_year_id')}
                  />
                </FormField>
                <FormField label="Term">
                  <FormSelect
                    placeholder={termsQ.isLoading ? 'Loading…' : terms.length ? 'Optional' : 'No terms for this year'}
                    value={form.term_id}
                    onChange={set('term_id')}
                    options={terms.map((t) => ({ value: String(t.id), label: t.name }))}
                    isDisabled={!terms.length}
                  />
                </FormField>
                <FormField
                  label="Class / stream"
                  required
                  error={err('classroom_id')}
                  hint={
                    selectedClass?.capacity
                      ? `${selectedClass.active_students_count ?? 0} of ${selectedClass.capacity} places taken`
                      : !classesQ.isLoading && !classes.length
                        ? 'No classes yet — create them under Academic › Classes'
                        : undefined
                  }
                >
                  <FormSelect
                    placeholder={classesQ.isLoading ? 'Loading…' : 'Select class'}
                    value={form.classroom_id}
                    onChange={set('classroom_id')}
                    options={classOptions}
                    isInvalid={!!err('classroom_id')}
                  />
                </FormField>
                <FormField label="Boarding status">
                  <FormSelect value={form.boarding_status} onChange={(v) => set('boarding_status')(v || 'day')} options={BOARDING} />
                </FormField>
              </FieldGrid>
              {classFull ? (
                <p className="mt-3 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {selectedClass.name} is at capacity. You can still register, but consider another stream.
                </p>
              ) : null}
            </FormSection>

            <FormSection id={sectionId('notes')} index={7} title="Notes" icon={StickyNote} optional description="Transfer reason, special needs or other remarks.">
              <FormTextarea value={form.notes} onValueChange={set('notes')} minRows={3} />
            </FormSection>

            {/* Actions for screens without the side panel */}
            <Card className="border border-slate-200 shadow-none xl:hidden">
              <CardBody className="flex flex-col-reverse gap-2 p-4 sm:flex-row sm:justify-end">
                <FormButton appearance="light" onPress={() => navigate('/students/list')} isDisabled={createMut.isPending}>
                  Cancel
                </FormButton>
                <FormButton isLoading={createMut.isPending} startContent={createMut.isPending ? null : <UserPlus className="h-4 w-4" />} onPress={submit}>
                  Complete registration
                </FormButton>
              </CardBody>
            </Card>
          </form>

          {/* Side panel */}
          <aside className="hidden space-y-4 xl:sticky xl:top-0 xl:block">
            <ProgressChecklist title="Registration checklist" items={checklist} onSelect={(k) => scrollToId(sectionId(k))} />
            <Card className="border border-slate-200 shadow-none">
              <CardBody className="space-y-4 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0B3D2E] text-sm font-semibold text-white">
                    {fullName ? fullName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase() : <UserRound className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{fullName || 'New learner'}</p>
                    <p className="truncate text-xs text-slate-500">
                      {[form.gender, age !== null ? `${age} yrs` : null].filter(Boolean).join(' · ') || 'Details not entered'}
                    </p>
                  </div>
                </div>
                <SummaryList
                  rows={[
                    ['Class', selectedClass?.name],
                    ['Academic year', years.find((y) => String(y.id) === String(yearId))?.name],
                    ['Admission no.', form.admission_number.trim() || 'Auto-generated'],
                    ['Guardians', guardianNames.length ? `${guardianNames.length} added` : null],
                    ['Boarding', BOARDING.find((b) => b.value === form.boarding_status)?.label],
                  ]}
                />
                {requiredLeft > 0 ? (
                  <p className="rounded-md bg-slate-50 px-2.5 py-2 text-[11px] text-slate-600">
                    Complete the required steps to finish registration.
                  </p>
                ) : null}
                {actions}
              </CardBody>
            </Card>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default StudentRegistration
