import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardBody, CardHeader, Spinner } from '@heroui/react'
import {
  ChevronLeft,
  ChevronRight,
  UserPlus,
  MapPin,
  Users,
  GraduationCap,
  School,
} from 'lucide-react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import PageHeader from '../../components/Layout/PageHeader.jsx'
import {
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  FormButton,
} from '../../components/Form'
import { toastSuccess, toastError } from '../../components/Toast'
import {
  createStudent,
  listClasses,
  listYears,
  listTerms,
} from '../../api/domain.js'

/** Common Tanzania regions (TAMISEMI-style) */
const TZ_REGIONS = [
  'Arusha',
  'Dar es Salaam',
  'Dodoma',
  'Geita',
  'Iringa',
  'Kagera',
  'Katavi',
  'Kigoma',
  'Kilimanjaro',
  'Lindi',
  'Manyara',
  'Mara',
  'Mbeya',
  'Morogoro',
  'Mtwara',
  'Mwanza',
  'Njombe',
  'Pwani',
  'Rukwa',
  'Ruvuma',
  'Shinyanga',
  'Simiyu',
  'Singida',
  'Songwe',
  'Tabora',
  'Tanga',
  'Zanzibar North',
  'Zanzibar South',
  'Zanzibar Urban/West',
  'Pemba North',
  'Pemba South',
]

const STEPS = [
  { key: 'personal', label: 'Personal', icon: UserPlus },
  { key: 'address', label: 'Address', icon: MapPin },
  { key: 'guardians', label: 'Guardians', icon: Users },
  { key: 'previous', label: 'Previous school', icon: School },
  { key: 'enrollment', label: 'Enrollment', icon: GraduationCap },
]

const emptyForm = () => ({
  first_name: '',
  middle_name: '',
  last_name: '',
  gender: '',
  date_of_birth: '',
  birth_certificate_no: '',
  place_of_birth: '',
  region_of_birth: '',
  district_of_birth: '',
  nationality: 'Tanzanian',
  religion: '',
  disability: 'None',
  blood_group: '',
  phone: '',
  admission_number: '',
  prems_number: '',
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
  previous_school: '',
  previous_class: '',
  classroom_id: '',
  academic_year_id: '',
  term_id: '',
  boarding_status: 'day',
  admission_date: new Date().toISOString().slice(0, 10),
  notes: '',
  status: 'active',
})

function StudentRegistration() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const yearsQ = useQuery({ queryKey: ['academic', 'years'], queryFn: listYears })
  const classesQ = useQuery({
    queryKey: ['academic', 'classes'],
    queryFn: listClasses,
  })
  const termsQ = useQuery({ queryKey: ['academic', 'terms'], queryFn: listTerms })

  const years = yearsQ.data?.academic_years || yearsQ.data?.years || []
  // API already filters by school education stages
  const classes = classesQ.data?.classes || []
  const terms = termsQ.data?.terms || []
  const currentYear = useMemo(
    () => years.find((y) => y.is_current) || years[0],
    [years],
  )

  const createMut = useMutation({
    mutationFn: createStudent,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['students'] })
      setError('')
      const student = data?.student || data
      const name =
        student?.full_name ||
        [student?.first_name, student?.last_name].filter(Boolean).join(' ') ||
        'Student'
      const adm = student?.admission_number
      toastSuccess(
        'Student registered',
        adm
          ? `${name} was registered with admission no. ${adm}.`
          : `${name} was registered successfully.`,
      )
      navigate('/students', { replace: true })
    },
    onError: (e) => {
      const msg = e.message || 'Registration failed'
      setError(msg)
      toastError('Registration failed', msg)
    },
  })

  const validateStep = () => {
    if (step === 0) {
      if (!form.first_name.trim() || !form.last_name.trim()) {
        setError('First name and last name are required (TAMISEMI personal details).')
        return false
      }
      if (!form.gender) {
        setError('Sex / gender is required.')
        return false
      }
      if (!form.date_of_birth) {
        setError('Date of birth is required for EMIS registration.')
        return false
      }
    }
    if (step === 2) {
      const hasParent =
        form.father_name.trim() ||
        form.mother_name.trim() ||
        form.guardian_name.trim()
      if (!hasParent) {
        setError('At least one parent or guardian is required.')
        return false
      }
    }
    if (step === 4) {
      if (!form.classroom_id) {
        setError('Select the class the learner is enrolling into.')
        return false
      }
      if (!form.academic_year_id && !currentYear?.id) {
        setError('Select an academic year.')
        return false
      }
    }
    setError('')
    return true
  }

  const next = () => {
    if (!validateStep()) return
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const back = () => {
    setError('')
    setStep((s) => Math.max(s - 1, 0))
  }

  const buildGuardians = () => {
    const list = []
    if (form.father_name.trim()) {
      list.push({
        relationship: 'father',
        full_name: form.father_name.trim(),
        phone: form.father_phone || undefined,
        occupation: form.father_occupation || undefined,
        nida_number: form.father_nida || undefined,
        is_primary: !form.mother_name.trim() && !form.guardian_name.trim(),
      })
    }
    if (form.mother_name.trim()) {
      list.push({
        relationship: 'mother',
        full_name: form.mother_name.trim(),
        phone: form.mother_phone || undefined,
        occupation: form.mother_occupation || undefined,
        nida_number: form.mother_nida || undefined,
        is_primary: !form.father_name.trim(),
      })
    }
    if (form.guardian_name.trim()) {
      list.push({
        relationship: form.guardian_relationship || 'guardian',
        full_name: form.guardian_name.trim(),
        phone: form.guardian_phone || undefined,
        occupation: form.guardian_occupation || undefined,
        is_primary: !form.father_name.trim() && !form.mother_name.trim(),
      })
    }
    return list
  }

  const submit = () => {
    if (!validateStep()) return
    const yearId = form.academic_year_id
      ? Number(form.academic_year_id)
      : currentYear?.id

    createMut.mutate({
      first_name: form.first_name.trim(),
      middle_name: form.middle_name.trim() || undefined,
      last_name: form.last_name.trim(),
      gender: form.gender || undefined,
      date_of_birth: form.date_of_birth || undefined,
      birth_certificate_no: form.birth_certificate_no || undefined,
      place_of_birth: form.place_of_birth || undefined,
      region_of_birth: form.region_of_birth || undefined,
      district_of_birth: form.district_of_birth || undefined,
      nationality: form.nationality || 'Tanzanian',
      religion: form.religion || undefined,
      disability:
        form.disability && form.disability !== 'None'
          ? form.disability
          : undefined,
      blood_group: form.blood_group || undefined,
      phone: form.phone || undefined,
      admission_number: form.admission_number || undefined,
      prems_number: form.prems_number || undefined,
      address_region: form.address_region || undefined,
      address_district: form.address_district || undefined,
      address_ward: form.address_ward || undefined,
      address_street: form.address_street || undefined,
      previous_school: form.previous_school || undefined,
      previous_class: form.previous_class || undefined,
      boarding_status: form.boarding_status || 'day',
      admission_date: form.admission_date || undefined,
      notes: form.notes || undefined,
      status: 'active',
      classroom_id: form.classroom_id ? Number(form.classroom_id) : undefined,
      academic_year_id: yearId || undefined,
      term_id: form.term_id ? Number(form.term_id) : undefined,
      guardians: buildGuardians(),
    })
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Student registration"
          breadcrumbs={[
            { label: 'People', href: '/students' },
            { label: 'Students', href: '/students' },
            { label: 'Registration' },
          ]}
          description="TAMISEMI / PREMS-aligned learner registration for your school"
        />

        <Card className="border border-zinc-200 shadow-none rounded-md">
          <CardBody className="p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-2">
              {STEPS.map((s, i) => {
                const Icon = s.icon
                const active = i === step
                const done = i < step
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => {
                      if (i < step) {
                        setError('')
                        setStep(i)
                      }
                    }}
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      active
                        ? 'bg-[#0B3D2E] text-white'
                        : done
                          ? 'bg-[#0B3D2E]/10 text-[#0B3D2E] cursor-pointer'
                          : 'bg-zinc-100 text-zinc-400'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">
                      {i + 1}. {s.label}
                    </span>
                    <span className="sm:hidden">{i + 1}</span>
                  </button>
                )
              })}
            </div>
          </CardBody>
        </Card>

        {error ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <Card className="border border-zinc-200 shadow-none rounded-md">
          <CardHeader className="border-b border-zinc-100 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">
                {STEPS[step].label}
              </h2>
              <p className="text-[11px] text-zinc-400">
                Step {step + 1} of {STEPS.length} · Fields aligned with school
                EMIS / TAMISEMI capture
              </p>
            </div>
          </CardHeader>
          <CardBody className="flex flex-col gap-4 p-4">
            {yearsQ.isLoading || classesQ.isLoading ? (
              <div className="flex justify-center py-10">
                <Spinner color="primary" />
              </div>
            ) : null}

            {step === 0 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <FormField label="First name" required>
                  <FormInput
                    value={form.first_name}
                    onValueChange={(v) => set('first_name', v)}
                  />
                </FormField>
                <FormField label="Middle name">
                  <FormInput
                    value={form.middle_name}
                    onValueChange={(v) => set('middle_name', v)}
                  />
                </FormField>
                <FormField label="Last name / surname" required>
                  <FormInput
                    value={form.last_name}
                    onValueChange={(v) => set('last_name', v)}
                  />
                </FormField>
                <FormField label="Sex" required>
                  <FormSelect
                    label="Sex"
                    placeholder="Select sex"
                    value={form.gender}
                    onChange={(v) => set('gender', v)}
                    options={[
                      { value: 'Male', label: 'Male' },
                      { value: 'Female', label: 'Female' },
                    ]}
                  />
                </FormField>
                <FormField label="Date of birth" required>
                  <FormInput
                    type="date"
                    value={form.date_of_birth}
                    onValueChange={(v) => set('date_of_birth', v)}
                  />
                </FormField>
                <FormField label="Birth certificate number">
                  <FormInput
                    value={form.birth_certificate_no}
                    onValueChange={(v) => set('birth_certificate_no', v)}
                  />
                </FormField>
                <FormField label="Place of birth">
                  <FormInput
                    placeholder="Village / town"
                    value={form.place_of_birth}
                    onValueChange={(v) => set('place_of_birth', v)}
                  />
                </FormField>
                <FormField label="Region of birth">
                  <FormSelect
                    label="Region of birth"
                    placeholder="Select region"
                    value={form.region_of_birth}
                    onChange={(v) => set('region_of_birth', v)}
                    options={TZ_REGIONS.map((r) => ({ value: r, label: r }))}
                  />
                </FormField>
                <FormField label="District of birth">
                  <FormInput
                    value={form.district_of_birth}
                    onValueChange={(v) => set('district_of_birth', v)}
                  />
                </FormField>
                <FormField label="Nationality">
                  <FormInput
                    value={form.nationality}
                    onValueChange={(v) => set('nationality', v)}
                  />
                </FormField>
                <FormField label="Religion">
                  <FormSelect
                    label="Religion"
                    placeholder="Select religion"
                    value={form.religion}
                    onChange={(v) => set('religion', v)}
                    options={[
                      { value: 'Christian', label: 'Christian' },
                      { value: 'Muslim', label: 'Muslim' },
                      { value: 'Other', label: 'Other' },
                      { value: 'None', label: 'None' },
                    ]}
                  />
                </FormField>
                <FormField label="Disability">
                  <FormSelect
                    label="Disability"
                    placeholder="Select"
                    value={form.disability}
                    onChange={(v) => set('disability', v)}
                    options={[
                      { value: 'None', label: 'None' },
                      { value: 'Visual', label: 'Visual' },
                      { value: 'Hearing', label: 'Hearing' },
                      { value: 'Physical', label: 'Physical' },
                      { value: 'Intellectual', label: 'Intellectual' },
                      { value: 'Multiple', label: 'Multiple' },
                      { value: 'Other', label: 'Other' },
                    ]}
                  />
                </FormField>
                <FormField label="Blood group">
                  <FormSelect
                    label="Blood group"
                    placeholder="Unknown"
                    value={form.blood_group}
                    onChange={(v) => set('blood_group', v)}
                    options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(
                      (b) => ({ value: b, label: b }),
                    )}
                  />
                </FormField>
                <FormField label="Phone (learner / home)">
                  <FormInput
                    placeholder="+255..."
                    value={form.phone}
                    onValueChange={(v) => set('phone', v)}
                  />
                </FormField>
                <FormField
                  label="Admission number"
                  hint="Leave blank to auto-generate (ADM-YYYY-####)"
                >
                  <FormInput
                    value={form.admission_number}
                    onValueChange={(v) => set('admission_number', v)}
                  />
                </FormField>
                <FormField
                  label="PREMS / EMIS number"
                  hint="Unique learner ID when issued by government systems"
                >
                  <FormInput
                    value={form.prems_number}
                    onValueChange={(v) => set('prems_number', v)}
                  />
                </FormField>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Region of residence">
                  <FormSelect
                    label="Region of residence"
                    placeholder="Select region"
                    value={form.address_region}
                    onChange={(v) => set('address_region', v)}
                    options={TZ_REGIONS.map((r) => ({ value: r, label: r }))}
                  />
                </FormField>
                <FormField label="District">
                  <FormInput
                    value={form.address_district}
                    onValueChange={(v) => set('address_district', v)}
                  />
                </FormField>
                <FormField label="Ward">
                  <FormInput
                    value={form.address_ward}
                    onValueChange={(v) => set('address_ward', v)}
                  />
                </FormField>
                <FormField label="Street / village">
                  <FormInput
                    value={form.address_street}
                    onValueChange={(v) => set('address_street', v)}
                  />
                </FormField>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Father
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField label="Full name">
                      <FormInput
                        value={form.father_name}
                        onValueChange={(v) => set('father_name', v)}
                      />
                    </FormField>
                    <FormField label="Phone">
                      <FormInput
                        value={form.father_phone}
                        onValueChange={(v) => set('father_phone', v)}
                      />
                    </FormField>
                    <FormField label="Occupation">
                      <FormInput
                        value={form.father_occupation}
                        onValueChange={(v) => set('father_occupation', v)}
                      />
                    </FormField>
                    <FormField label="NIDA number">
                      <FormInput
                        value={form.father_nida}
                        onValueChange={(v) => set('father_nida', v)}
                      />
                    </FormField>
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Mother
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField label="Full name">
                      <FormInput
                        value={form.mother_name}
                        onValueChange={(v) => set('mother_name', v)}
                      />
                    </FormField>
                    <FormField label="Phone">
                      <FormInput
                        value={form.mother_phone}
                        onValueChange={(v) => set('mother_phone', v)}
                      />
                    </FormField>
                    <FormField label="Occupation">
                      <FormInput
                        value={form.mother_occupation}
                        onValueChange={(v) => set('mother_occupation', v)}
                      />
                    </FormField>
                    <FormField label="NIDA number">
                      <FormInput
                        value={form.mother_nida}
                        onValueChange={(v) => set('mother_nida', v)}
                      />
                    </FormField>
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Other guardian (if applicable)
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField label="Full name">
                      <FormInput
                        value={form.guardian_name}
                        onValueChange={(v) => set('guardian_name', v)}
                      />
                    </FormField>
                    <FormField label="Relationship">
                      <FormSelect
                        label="Relationship"
                        placeholder="Select"
                        value={form.guardian_relationship}
                        onChange={(v) => set('guardian_relationship', v)}
                        options={[
                          'Guardian',
                          'Uncle',
                          'Aunt',
                          'Grandparent',
                          'Sibling',
                          'Other',
                        ].map((r) => ({ value: r, label: r }))}
                      />
                    </FormField>
                    <FormField label="Phone">
                      <FormInput
                        value={form.guardian_phone}
                        onValueChange={(v) => set('guardian_phone', v)}
                      />
                    </FormField>
                    <FormField label="Occupation">
                      <FormInput
                        value={form.guardian_occupation}
                        onValueChange={(v) => set('guardian_occupation', v)}
                      />
                    </FormField>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  label="Previous school"
                  hint="Leave blank for first-time entrants (e.g. Standard 1 / Form 1)"
                >
                  <FormInput
                    value={form.previous_school}
                    onValueChange={(v) => set('previous_school', v)}
                  />
                </FormField>
                <FormField label="Last class completed">
                  <FormInput
                    placeholder="e.g. Standard 7, Form 2"
                    value={form.previous_class}
                    onValueChange={(v) => set('previous_class', v)}
                  />
                </FormField>
                <div className="sm:col-span-2">
                  <FormField label="Notes">
                    <FormTextarea
                      minRows={3}
                      placeholder="Transfer reason, special needs notes..."
                      value={form.notes}
                      onValueChange={(v) => set('notes', v)}
                    />
                  </FormField>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Admission date" required>
                  <FormInput
                    type="date"
                    value={form.admission_date}
                    onValueChange={(v) => set('admission_date', v)}
                  />
                </FormField>
                <FormField label="Boarding status">
                  <FormSelect
                    label="Boarding status"
                    placeholder="Select"
                    value={form.boarding_status}
                    onChange={(v) => set('boarding_status', v)}
                    options={[
                      { value: 'day', label: 'Day scholar' },
                      { value: 'boarding', label: 'Boarding' },
                      { value: 'hostel', label: 'Hostel' },
                    ]}
                  />
                </FormField>
                <FormField label="Academic year" required>
                  <FormSelect
                    label="Academic year"
                    placeholder="Select year"
                    value={
                      form.academic_year_id ||
                      (currentYear ? String(currentYear.id) : '')
                    }
                    onChange={(v) => set('academic_year_id', v)}
                    options={years.map((y) => ({
                      value: String(y.id),
                      label: `${y.name}${y.is_current ? ' (current)' : ''}`,
                    }))}
                  />
                </FormField>
                <FormField label="Term / semester">
                  <FormSelect
                    label="Term"
                    placeholder="Optional"
                    value={form.term_id}
                    onChange={(v) => set('term_id', v)}
                    options={terms.map((t) => ({
                      value: String(t.id),
                      label: t.name,
                    }))}
                  />
                </FormField>
                <FormField label="Class / stream" required>
                  <FormSelect
                    label="Class"
                    placeholder="Select class"
                    value={form.classroom_id}
                    onChange={(v) => set('classroom_id', v)}
                    options={classes.map((c) => {
                      const level = c.education_level || c.educationLevel
                      const levelBit = level?.name ? ` · ${level.name}` : ''
                      const codeBit = c.code ? ` (${c.code})` : ''
                      return {
                        value: String(c.id),
                        label: `${c.name}${codeBit}${levelBit}`,
                      }
                    })}
                  />
                </FormField>
                {!classes.length ? (
                  <p className="text-xs text-amber-700 sm:col-span-2">
                    No classes found. Create classes under Academic → Academic
                    setup first.
                  </p>
                ) : null}
              </div>
            )}

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-4">
              <FormButton
                appearance="light"
                isDisabled={step === 0}
                startContent={<ChevronLeft className="h-4 w-4" />}
                onPress={back}
              >
                Back
              </FormButton>
              {step < STEPS.length - 1 ? (
                <FormButton
                  endContent={<ChevronRight className="h-4 w-4" />}
                  onPress={next}
                >
                  Continue
                </FormButton>
              ) : (
                <FormButton
                  isLoading={createMut.isPending}
                  startContent={<UserPlus className="h-4 w-4" />}
                  onPress={submit}
                >
                  Complete registration
                </FormButton>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default StudentRegistration
