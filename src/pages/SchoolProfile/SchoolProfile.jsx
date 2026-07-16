import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  CheckboxGroup,
  Chip,
  Spinner,
} from '@heroui/react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import PageHeader from '../../components/Layout/PageHeader.jsx'
import {
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  FormButton,
} from '../../components/Form'
import { writeSession } from '../../auth/sessionStorage.js'
import { toastSuccess, toastError } from '../../components/Toast'
import EducationStagesPicker from '../../components/School/EducationStagesPicker.jsx'
import { formatStagesSummary } from '../../config/educationStages.js'
import { getSchoolProfile, updateSchoolProfile } from '../../api/domain.js'

const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

const SCHOOL_TYPE_OPTIONS = [
  { value: 'Day', label: 'Day school' },
  { value: 'Boarding', label: 'Boarding' },
  { value: 'Mixed', label: 'Mixed (day & boarding)' },
  { value: 'Special', label: 'Special needs' },
]

const OWNERSHIP_OPTIONS = [
  { value: 'Government', label: 'Government' },
  { value: 'Private', label: 'Private' },
  { value: 'Faith-based', label: 'Faith-based' },
  { value: 'Community', label: 'Community' },
]

/** Common Tanzania regions for address */
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

const emptyForm = {
  name: '',
  code: '',
  slug: '',
  registration_number: '',
  emis_code: '',
  school_type: '',
  ownership: '',
  education_level: '',
  education_stages: [],
  contact_email: '',
  contact_phone: '',
  address: '',
  city: '',
  region: '',
  country: 'Tanzania',
  website: '',
  motto: '',
  vision: '',
  mission: '',
  logo_url: '',
  working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  calendar_notes: '',
}

function sectionFromPath(pathname) {
  if (pathname.endsWith('/info') || pathname === '/school-profile' || pathname === '/school-profile/') {
    return 'info'
  }
  if (pathname.includes('/registration')) return 'registration'
  if (pathname.includes('/type')) return 'type'
  if (pathname.includes('/levels')) return 'levels'
  if (pathname.includes('/branding')) return 'branding'
  if (pathname.includes('/calendar')) return 'calendar'
  if (pathname.includes('/working-days')) return 'working-days'
  if (pathname.includes('/mission')) return 'mission'
  return 'info'
}

function SectionCard({ title, description, children }) {
  return (
    <Card className="h-full border border-zinc-200 shadow-none">
      <CardHeader className="flex flex-col items-start gap-0.5 px-4 py-3 sm:px-5">
        <span className="text-[13px] font-semibold text-zinc-900">{title}</span>
        {description ? (
          <span className="text-[11px] font-normal leading-snug text-zinc-500">
            {description}
          </span>
        ) : null}
      </CardHeader>
      <CardBody className="px-4 pb-4 pt-0 sm:px-5 sm:pb-5">{children}</CardBody>
    </Card>
  )
}

function SchoolProfile() {
  const location = useLocation()
  const qc = useQueryClient()
  const section = sectionFromPath(location.pathname)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const profileQ = useQuery({
    queryKey: ['school', 'profile'],
    queryFn: getSchoolProfile,
  })

  useEffect(() => {
    const school = profileQ.data?.school
    if (!school) return
    setForm({
      name: school.name || '',
      code: school.code || '',
      slug: school.slug || '',
      registration_number: school.registration_number || '',
      emis_code: school.emis_code || '',
      school_type: school.school_type || '',
      ownership: school.ownership || '',
      education_level: school.education_level || '',
      education_stages: Array.isArray(school.education_stages)
        ? school.education_stages
        : [],
      contact_email: school.contact_email || '',
      contact_phone: school.contact_phone || '',
      address: school.address || '',
      city: school.city || '',
      region: school.region || '',
      country: school.country || 'Tanzania',
      website: school.website || '',
      motto: school.motto || '',
      vision: school.vision || '',
      mission: school.mission || '',
      logo_url: school.logo_url || '',
      working_days: school.working_days?.length
        ? school.working_days
        : emptyForm.working_days,
      calendar_notes: school.calendar_notes || '',
    })
  }, [profileQ.data])

  const saveMut = useMutation({
    mutationFn: updateSchoolProfile,
    onSuccess: (data) => {
      qc.setQueryData(['school', 'profile'], data)
      qc.invalidateQueries({ queryKey: ['school', 'profile'] })
      const session = qc.getQueryData(['auth', 'session'])
      if (session?.access_token && session?.user?.school && data?.school) {
        const schoolPatch = {
          name: data.school.name,
          code: data.school.code,
          slug: data.school.slug,
          education_stages: data.school.education_stages || [],
          education_level: data.school.education_level || null,
        }
        const next = {
          ...session,
          user: {
            ...session.user,
            school: {
              ...session.user.school,
              ...schoolPatch,
            },
          },
          school: {
            ...(session.school || session.user.school),
            ...schoolPatch,
          },
        }
        writeSession(next)
        qc.setQueryData(['auth', 'session'], next)
      }
      qc.invalidateQueries({ queryKey: ['academic', 'subjects'] })
      qc.invalidateQueries({ queryKey: ['academic', 'subject-combinations'] })
      qc.invalidateQueries({ queryKey: ['students'] })
      setError('')
      toastSuccess('School profile saved')
    },
    onError: (e) => {
      setError(e.message || 'Failed to save')
      toastError('Could not save profile', e.message)
    },
  })

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setError('')
  }

  const onSave = () => {
    setError('')
    if (!form.name?.trim()) {
      setError('School name is required.')
      toastError('Missing fields', 'School name is required.')
      return
    }
    if (
      (section === 'levels' || section === 'info') &&
      !form.education_stages?.length
    ) {
      setError('Select at least one education level.')
      toastError('Missing levels', 'Select at least one education level.')
      return
    }
    saveMut.mutate({
      name: form.name.trim(),
      slug: form.slug?.trim() || undefined,
      registration_number: form.registration_number?.trim() || null,
      emis_code: form.emis_code?.trim() || null,
      school_type: form.school_type || null,
      ownership: form.ownership || null,
      education_stages:
        section === 'levels' ||
        section === 'info' ||
        form.education_stages?.length
          ? form.education_stages
          : undefined,
      contact_email: form.contact_email?.trim() || null,
      contact_phone: form.contact_phone?.trim() || null,
      address: form.address?.trim() || null,
      city: form.city?.trim() || null,
      region: form.region || null,
      country: form.country?.trim() || null,
      website: form.website?.trim() || null,
      motto: form.motto?.trim() || null,
      vision: form.vision?.trim() || null,
      mission: form.mission?.trim() || null,
      logo_url: form.logo_url?.trim() || null,
      working_days: form.working_days,
      calendar_notes: form.calendar_notes?.trim() || null,
    })
  }

  const onReset = () => {
    profileQ.refetch()
    setError('')
    toastSuccess('Form reset from server')
  }

  const title = useMemo(() => {
    const map = {
      info: 'School Information',
      registration: 'Registration & EMIS',
      type: 'Type & Ownership',
      levels: 'Education Levels',
      branding: 'Contacts & Logo',
      calendar: 'Academic Calendar',
      'working-days': 'Working Days',
      mission: 'Motto, Vision & Mission',
    }
    return map[section] || 'School Profile'
  }, [section])

  const description = useMemo(() => {
    const map = {
      info: 'Complete institutional identity used across the school portal (TAMISEMI / EMIS style)',
      registration: 'Legal registration and ministry EMIS identifiers',
      type: 'Day / boarding classification and ownership',
      levels: 'Which education stages this school operates — drives Academic content',
      branding: 'Public contact details and logo',
      calendar: 'Term notes and calendar guidance for staff',
      'working-days': 'Days the school is open for lessons and office',
      mission: 'Motto, vision and mission shown on reports and branding',
    }
    return map[section] || 'Manage your school institutional profile'
  }, [section])

  const school = profileQ.data?.school
  const regionOptions = useMemo(() => {
    const list = [...TZ_REGIONS]
    if (form.region && !list.includes(form.region)) {
      list.unshift(form.region)
    }
    return list.map((r) => ({ value: r, label: r }))
  }, [form.region])

  const SaveBar = (
    <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50/95 px-1 py-3 backdrop-blur-sm sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
      <FormButton appearance="bordered" onPress={onReset}>
        Reset
      </FormButton>
      <FormButton isLoading={saveMut.isPending} onPress={onSave}>
        Save changes
      </FormButton>
    </div>
  )

  /** Full School Information — all core fields, full content width */
  const infoBody = (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard
          title="Identity"
          description="Official school name and portal identifiers"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <FormField label="School name" required className="md:col-span-2">
              <FormInput
                placeholder="e.g. Green Valley Secondary School"
                value={form.name}
                onValueChange={(v) => setField('name', v)}
                isRequired
              />
            </FormField>
            <FormField
              label="School code"
              hint="Assigned by the platform — read only"
            >
              <FormInput value={form.code} isReadOnly />
            </FormField>
            <FormField
              label="URL slug"
              hint="Used in links; leave blank to auto-generate from name"
            >
              <FormInput
                placeholder="e.g. green-valley-secondary"
                value={form.slug}
                onValueChange={(v) => setField('slug', v)}
              />
            </FormField>
          </div>
        </SectionCard>

        <SectionCard
          title="Registration & EMIS"
          description="Legal and ministry identifiers (TAMISEMI / PREMS)"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <FormField label="Registration number">
              <FormInput
                placeholder="Legal registration ID"
                value={form.registration_number}
                onValueChange={(v) => setField('registration_number', v)}
              />
            </FormField>
            <FormField
              label="EMIS code"
              hint="Education Management Information System code"
            >
              <FormInput
                placeholder="Ministry EMIS identifier"
                value={form.emis_code}
                onValueChange={(v) => setField('emis_code', v)}
              />
            </FormField>
            <FormField label="School type">
              <FormSelect
                label="School type"
                placeholder="Select type"
                value={form.school_type}
                onChange={(v) => setField('school_type', v)}
                options={SCHOOL_TYPE_OPTIONS}
              />
            </FormField>
            <FormField label="Ownership">
              <FormSelect
                label="Ownership"
                placeholder="Select ownership"
                value={form.ownership}
                onChange={(v) => setField('ownership', v)}
                options={OWNERSHIP_OPTIONS}
              />
            </FormField>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Education levels"
        description="Controls subjects, combinations, classes and student lists"
      >
        <EducationStagesPicker
          required
          value={form.education_stages}
          onChange={(next) => setField('education_stages', next)}
          hint={`Current: ${formatStagesSummary(form.education_stages)}. Primary-only schools will not see A-level combinations.`}
        />
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard
          title="Contact information"
          description="Primary phone and email for the school office"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <FormField label="Contact email">
              <FormInput
                type="email"
                placeholder="admin@school.ac.tz"
                value={form.contact_email}
                onValueChange={(v) => setField('contact_email', v)}
              />
            </FormField>
            <FormField label="Contact phone">
              <FormInput
                placeholder="+255 …"
                value={form.contact_phone}
                onValueChange={(v) => setField('contact_phone', v)}
              />
            </FormField>
            <FormField label="Website" className="md:col-span-2">
              <FormInput
                placeholder="https://www.school.ac.tz"
                value={form.website}
                onValueChange={(v) => setField('website', v)}
              />
            </FormField>
          </div>
        </SectionCard>

        <SectionCard
          title="Physical address"
          description="Location used on letters, report cards and official forms"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <FormField label="Street / postal address" className="md:col-span-2">
              <FormTextarea
                minRows={2}
                placeholder="P.O. Box / street address"
                value={form.address}
                onValueChange={(v) => setField('address', v)}
              />
            </FormField>
            <FormField label="City / town">
              <FormInput
                placeholder="e.g. Moshi"
                value={form.city}
                onValueChange={(v) => setField('city', v)}
              />
            </FormField>
            <FormField label="Region">
              <FormSelect
                label="Region"
                placeholder="Select region"
                value={form.region}
                onChange={(v) => setField('region', v)}
                options={regionOptions}
              />
            </FormField>
            <FormField label="Country" className="md:col-span-2">
              <FormInput
                value={form.country}
                onValueChange={(v) => setField('country', v)}
              />
            </FormField>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard
          title="Logo"
          description="Public image URL for letterheads and the portal (upload later)"
        >
          <FormField label="Logo URL">
            <FormInput
              placeholder="https://…/logo.png"
              value={form.logo_url}
              onValueChange={(v) => setField('logo_url', v)}
            />
          </FormField>
          {form.logo_url ? (
            <div className="mt-3">
              <p className="mb-1.5 text-[11px] font-medium text-zinc-500">
                Preview
              </p>
              <img
                src={form.logo_url}
                alt="School logo preview"
                className="h-16 w-auto max-w-full rounded-md border border-zinc-200 bg-white object-contain p-1.5"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          ) : null}
        </SectionCard>

        <SectionCard
          title="Motto (optional)"
          description="Short phrase; full vision & mission under Motto, Vision & Mission"
        >
          <FormField label="Motto">
            <FormInput
              placeholder="e.g. Excellence through discipline"
              value={form.motto}
              onValueChange={(v) => setField('motto', v)}
            />
          </FormField>
        </SectionCard>
      </div>

      {SaveBar}
    </div>
  )

  let body = null

  if (section === 'info') {
    body = infoBody
  } else if (section === 'registration') {
    body = (
      <div className="flex flex-col gap-4">
        <SectionCard
          title="Registration & EMIS"
          description="Legal registration and ministry identifiers"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Registration number">
              <FormInput
                placeholder="Legal registration ID"
                value={form.registration_number}
                onValueChange={(v) => setField('registration_number', v)}
              />
            </FormField>
            <FormField label="EMIS code">
              <FormInput
                placeholder="Ministry EMIS identifier"
                value={form.emis_code}
                onValueChange={(v) => setField('emis_code', v)}
              />
            </FormField>
            <FormField
              label="School code"
              hint="Assigned by the platform"
            >
              <FormInput value={form.code} isReadOnly />
            </FormField>
            <FormField label="School name" required>
              <FormInput
                value={form.name}
                onValueChange={(v) => setField('name', v)}
              />
            </FormField>
          </div>
        </SectionCard>
        {SaveBar}
      </div>
    )
  } else if (section === 'type') {
    body = (
      <div className="flex flex-col gap-4">
        <SectionCard title="Type & ownership">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="School type">
              <FormSelect
                label="School type"
                placeholder="Select type"
                value={form.school_type}
                onChange={(v) => setField('school_type', v)}
                options={SCHOOL_TYPE_OPTIONS}
              />
            </FormField>
            <FormField label="Ownership">
              <FormSelect
                label="Ownership"
                placeholder="Select ownership"
                value={form.ownership}
                onChange={(v) => setField('ownership', v)}
                options={OWNERSHIP_OPTIONS}
              />
            </FormField>
          </div>
        </SectionCard>
        {SaveBar}
      </div>
    )
  } else if (section === 'levels') {
    body = (
      <div className="flex flex-col gap-4">
        <SectionCard
          title="Education levels (TAMISEMI)"
          description="Select every level this school operates. This filters Academic subjects, combinations and student lists."
        >
          <EducationStagesPicker
            required
            value={form.education_stages}
            onChange={(next) => setField('education_stages', next)}
            hint={`Current: ${formatStagesSummary(form.education_stages)}`}
          />
        </SectionCard>
        {SaveBar}
      </div>
    )
  } else if (section === 'branding') {
    body = (
      <div className="flex flex-col gap-4">
        <SectionCard title="Contacts">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Contact email">
              <FormInput
                type="email"
                placeholder="admin@school.ac.tz"
                value={form.contact_email}
                onValueChange={(v) => setField('contact_email', v)}
              />
            </FormField>
            <FormField label="Contact phone">
              <FormInput
                placeholder="+255 …"
                value={form.contact_phone}
                onValueChange={(v) => setField('contact_phone', v)}
              />
            </FormField>
            <FormField label="Website" className="sm:col-span-2">
              <FormInput
                placeholder="https://"
                value={form.website}
                onValueChange={(v) => setField('website', v)}
              />
            </FormField>
          </div>
        </SectionCard>
        <SectionCard title="Logo">
          <FormField label="Logo URL">
            <FormInput
              placeholder="https://…/logo.png"
              value={form.logo_url}
              onValueChange={(v) => setField('logo_url', v)}
            />
          </FormField>
          {form.logo_url ? (
            <div className="mt-3">
              <img
                src={form.logo_url}
                alt="School logo preview"
                className="h-16 w-auto rounded-md border border-zinc-200 bg-white object-contain p-1.5"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          ) : null}
        </SectionCard>
        {SaveBar}
      </div>
    )
  } else if (section === 'calendar') {
    body = (
      <div className="flex flex-col gap-4">
        <SectionCard
          title="Academic calendar notes"
          description="Term dates, holidays and exam weeks for staff reference"
        >
          <FormField label="Calendar notes">
            <FormTextarea
              minRows={6}
              placeholder="e.g. Term 1: 15 Jan – 15 Apr · Mid-term break · Exam week …"
              value={form.calendar_notes}
              onValueChange={(v) => setField('calendar_notes', v)}
            />
          </FormField>
        </SectionCard>
        {SaveBar}
      </div>
    )
  } else if (section === 'working-days') {
    body = (
      <div className="flex flex-col gap-4">
        <SectionCard
          title="Working days"
          description="Days the school is open for lessons and administration"
        >
          <CheckboxGroup
            label="Select working days"
            orientation="horizontal"
            value={form.working_days}
            onValueChange={(v) => setField('working_days', v)}
            classNames={{
              label: 'text-[11px] font-medium text-zinc-600',
              wrapper: 'gap-2',
            }}
          >
            {WEEKDAYS.map((day) => (
              <Checkbox key={day} value={day} radius="sm" size="sm">
                {day.slice(0, 3)}
              </Checkbox>
            ))}
          </CheckboxGroup>
        </SectionCard>
        {SaveBar}
      </div>
    )
  } else if (section === 'mission') {
    body = (
      <div className="flex flex-col gap-4">
        <SectionCard
          title="Motto, vision & mission"
          description="Shown on report cards, letters and public materials"
        >
          <div className="flex flex-col gap-3">
            <FormField label="Motto">
              <FormInput
                placeholder="Short institutional motto"
                value={form.motto}
                onValueChange={(v) => setField('motto', v)}
              />
            </FormField>
            <FormField label="Vision">
              <FormTextarea
                minRows={3}
                placeholder="Where the school aspires to be"
                value={form.vision}
                onValueChange={(v) => setField('vision', v)}
              />
            </FormField>
            <FormField label="Mission">
              <FormTextarea
                minRows={3}
                placeholder="How the school achieves its vision"
                value={form.mission}
                onValueChange={(v) => setField('mission', v)}
              />
            </FormField>
          </div>
        </SectionCard>
        {SaveBar}
      </div>
    )
  } else {
    body = infoBody
  }

  return (
    <DashboardLayout>
      <div className="flex w-full min-w-0 flex-col gap-4">
        <PageHeader
          title={title}
          breadcrumbs={[
            { label: 'School', href: '/school-profile' },
            { label: title },
          ]}
          description={description}
          actions={
            school ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <Chip
                  size="sm"
                  variant="flat"
                  color="primary"
                  className="h-6 capitalize"
                >
                  {school.status || 'active'}
                </Chip>
                <Chip size="sm" variant="flat" className="h-6 font-mono text-[11px]">
                  {school.code}
                </Chip>
                {form.education_stages?.length ? (
                  <Chip size="sm" variant="flat" className="h-6 text-[11px]">
                    {formatStagesSummary(form.education_stages)}
                  </Chip>
                ) : null}
              </div>
            ) : null
          }
        />

        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
            {error}
          </div>
        ) : null}

        {profileQ.isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner color="primary" />
          </div>
        ) : profileQ.isError ? (
          <Card className="border border-zinc-200 shadow-none">
            <CardBody className="p-6 text-sm text-red-600">
              {profileQ.error?.message ||
                'Unable to load school profile. Ensure you are logged in as a school user.'}
            </CardBody>
          </Card>
        ) : (
          body
        )}
      </div>
    </DashboardLayout>
  )
}

export default SchoolProfile
