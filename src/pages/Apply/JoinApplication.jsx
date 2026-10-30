import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button } from '@heroui/react'
import { CheckCircle2, School } from 'lucide-react'
import ShengenaLogo from '../../components/Brand/ShengenaLogo.jsx'
import {
  FormButton,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
} from '../../components/Form'
import {
  publicSchoolInfo,
  publicSubmitApplication,
} from '../../api/domain.js'
import { SectionSkeleton } from '../../components/Loading'

const emptyForm = () => ({
  first_name: '',
  middle_name: '',
  last_name: '',
  date_of_birth: '',
  gender: '',
  phone: '',
  email: '',
  nationality: 'Tanzanian',
  previous_school: '',
  previous_class: '',
  preferred_level: '',
  address: '',
  guardian_name: '',
  guardian_relationship: 'parent',
  guardian_phone: '',
  guardian_email: '',
  notes: '',
})

export default function JoinApplication() {
  const { schoolCode: paramCode } = useParams()
  const navigate = useNavigate()
  const [codeInput, setCodeInput] = useState(paramCode || '')
  const [activeCode, setActiveCode] = useState(paramCode || '')
  const [form, setForm] = useState(emptyForm())
  const [submitted, setSubmitted] = useState(null)
  const [formError, setFormError] = useState('')

  const schoolQ = useQuery({
    queryKey: ['public', 'school', activeCode],
    queryFn: () => publicSchoolInfo(activeCode),
    enabled: Boolean(activeCode),
    retry: 1,
  })

  const school = schoolQ.data?.school

  const submitMut = useMutation({
    mutationFn: (payload) => publicSubmitApplication(activeCode, payload),
    onSuccess: (data) => {
      setSubmitted(data?.application || data)
      setForm(emptyForm())
      setFormError('')
    },
    onError: (e) => {
      setFormError(e?.message || 'Could not submit application')
    },
  })

  const loadSchool = () => {
    const c = codeInput.trim()
    if (!c) {
      setFormError('Enter a school code')
      return
    }
    setFormError('')
    setSubmitted(null)
    setActiveCode(c)
    if (paramCode !== c) {
      navigate(`/apply/${encodeURIComponent(c)}`, { replace: true })
    }
  }

  const handleSubmit = () => {
    setFormError('')
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setFormError('Applicant first and last name are required')
      return
    }
    if (!form.guardian_name.trim() || !form.guardian_phone.trim()) {
      setFormError('Guardian name and phone are required')
      return
    }
    submitMut.mutate({
      ...form,
      gender: form.gender || null,
      date_of_birth: form.date_of_birth || null,
    })
  }

  const set = (key) => (v) => setForm((f) => ({ ...f, [key]: v }))

  const stagesLabel = useMemo(() => {
    if (!school?.education_stages?.length && !school?.education_level) {
      return null
    }
    if (Array.isArray(school.education_stages) && school.education_stages.length) {
      return school.education_stages
        .map((s) => String(s).replaceAll('_', ' '))
        .join(' · ')
    }
    return school.education_level
  }, [school])

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <button
            type="button"
            className="flex items-center gap-2"
            onClick={() => navigate('/')}
          >
            <ShengenaLogo
              variant="full"
              iconClassName="h-8 w-28 object-contain"
              wordClassName="h-6 w-auto object-contain"
            />
          </button>
          <Button
            size="sm"
            variant="light"
            className="text-zinc-600"
            onPress={() => navigate('/login')}
          >
            Staff sign in
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 text-center sm:text-left">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#12544f]">
            School join application
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">
            Apply to join a school
          </h1>
          <p className="mt-1 text-[14px] text-zinc-500">
            Fill in the form. The school will review your application in their
            portal.
          </p>
        </div>

        {!paramCode && !activeCode ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <FormField
              label="School code"
              required
              hint="Ask the school for their Shengena school code"
            >
              <FormInput
                value={codeInput}
                onValueChange={setCodeInput}
                placeholder="e.g. GVS001"
              />
            </FormField>
            {formError ? (
              <p className="mt-2 text-[13px] text-red-600">{formError}</p>
            ) : null}
            <FormButton className="mt-4" onPress={loadSchool}>
              Continue
            </FormButton>
          </div>
        ) : null}

        {activeCode && schoolQ.isLoading ? (
          <SectionSkeleton label="Loading school" />
        ) : null}

        {activeCode && schoolQ.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm text-red-700">
              {schoolQ.error?.message || 'School not found'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <FormInput
                value={codeInput || activeCode}
                onValueChange={setCodeInput}
                placeholder="School code"
                className="max-w-xs"
              />
              <FormButton appearance="bordered" onPress={loadSchool}>
                Try again
              </FormButton>
            </div>
          </div>
        ) : null}

        {submitted ? (
          <div className="rounded-xl border border-emerald-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-zinc-900">
              Application submitted
            </h2>
            <p className="mt-1 text-[14px] text-zinc-500">
              {submitted.school?.name || school?.name} has received your
              application.
            </p>
            <p className="mt-4 font-mono text-sm font-semibold text-[#12544f]">
              {submitted.application_number}
            </p>
            <p className="mt-1 text-[12px] text-zinc-400">
              Keep this application number for your records
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <FormButton
                appearance="bordered"
                onPress={() => {
                  setSubmitted(null)
                  setForm(emptyForm())
                }}
              >
                Submit another
              </FormButton>
              <FormButton onPress={() => navigate('/')}>
                Back to home
              </FormButton>
            </div>
          </div>
        ) : null}

        {school && !submitted && !schoolQ.isLoading ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#12544f]">
                <School className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-zinc-900">
                  {school.name}
                </h2>
                <p className="font-mono text-[12px] text-zinc-400">
                  Code {school.code}
                </p>
                <p className="mt-1 text-[12px] text-zinc-500">
                  {[school.district, school.region, school.country]
                    .filter(Boolean)
                    .join(', ') || 'Tanzania'}
                  {stagesLabel ? ` · ${stagesLabel}` : ''}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-zinc-900">
                Applicant details
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <FormField label="First name" required>
                  <FormInput
                    value={form.first_name}
                    onValueChange={set('first_name')}
                  />
                </FormField>
                <FormField label="Last name" required>
                  <FormInput
                    value={form.last_name}
                    onValueChange={set('last_name')}
                  />
                </FormField>
                <FormField label="Middle name">
                  <FormInput
                    value={form.middle_name}
                    onValueChange={set('middle_name')}
                  />
                </FormField>
                <FormField label="Date of birth">
                  <FormInput
                    type="date"
                    value={form.date_of_birth}
                    onValueChange={set('date_of_birth')}
                  />
                </FormField>
                <FormField label="Gender">
                  <FormSelect
                    value={form.gender || 'none'}
                    onChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        gender: v === 'none' ? '' : v,
                      }))
                    }
                    options={[
                      { value: 'none', label: 'Prefer not to say' },
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' },
                    ]}
                  />
                </FormField>
                <FormField label="Phone">
                  <FormInput value={form.phone} onValueChange={set('phone')} />
                </FormField>
                <FormField label="Email">
                  <FormInput value={form.email} onValueChange={set('email')} />
                </FormField>
                <FormField label="Preferred level / class">
                  <FormInput
                    value={form.preferred_level}
                    onValueChange={set('preferred_level')}
                    placeholder="e.g. Form 1, Std I"
                  />
                </FormField>
                <FormField label="Previous school">
                  <FormInput
                    value={form.previous_school}
                    onValueChange={set('previous_school')}
                  />
                </FormField>
                <FormField label="Previous class">
                  <FormInput
                    value={form.previous_class}
                    onValueChange={set('previous_class')}
                  />
                </FormField>
              </div>
              <FormField label="Home address" className="mt-3">
                <FormTextarea
                  value={form.address}
                  onValueChange={set('address')}
                  minRows={2}
                />
              </FormField>

              <h3 className="mt-6 text-sm font-semibold text-zinc-900">
                Parent / guardian
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <FormField label="Guardian full name" required>
                  <FormInput
                    value={form.guardian_name}
                    onValueChange={set('guardian_name')}
                  />
                </FormField>
                <FormField label="Relationship">
                  <FormSelect
                    value={form.guardian_relationship}
                    onChange={set('guardian_relationship')}
                    options={[
                      { value: 'parent', label: 'Parent' },
                      { value: 'father', label: 'Father' },
                      { value: 'mother', label: 'Mother' },
                      { value: 'guardian', label: 'Guardian' },
                      { value: 'other', label: 'Other' },
                    ]}
                  />
                </FormField>
                <FormField label="Guardian phone" required>
                  <FormInput
                    value={form.guardian_phone}
                    onValueChange={set('guardian_phone')}
                  />
                </FormField>
                <FormField label="Guardian email">
                  <FormInput
                    value={form.guardian_email}
                    onValueChange={set('guardian_email')}
                  />
                </FormField>
              </div>

              <FormField label="Additional notes" className="mt-3">
                <FormTextarea
                  value={form.notes}
                  onValueChange={set('notes')}
                  minRows={2}
                />
              </FormField>

              {formError ? (
                <p className="mt-3 text-[13px] text-red-600">{formError}</p>
              ) : null}

              <FormButton
                className="mt-5 w-full sm:w-auto"
                isLoading={submitMut.isPending}
                onPress={handleSubmit}
              >
                Submit application
              </FormButton>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
