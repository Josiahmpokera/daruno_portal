import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardBody } from '@heroui/react'
import dayjs from 'dayjs'
import {
  Banknote,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  FileSignature,
  KeyRound,
  Mail,
  StickyNote,
  UserPlus,
  UserRound,
} from 'lucide-react'
import {
  FieldGrid,
  FormButton,
  FormField,
  FormInput,
  FormSection,
  FormSelect,
  FormTextarea,
  ProgressChecklist,
  ToggleRow,
} from '../../components/Form'
import { copyText } from '../../utils/clipboard'
import { toastError, toastSuccess } from '../../components/Toast'
import { useAuth } from '../../auth'
import {
  listDepartments,
  listSchoolRoles,
  listStaffPositions,
  onboardStaff,
} from '../../api/domain.js'

/* ── Options & defaults ──────────────────────────────────────────── */

const EMPLOYMENT_TYPES = [
  { value: 'Full-time', label: 'Full-time' },
  { value: 'Part-time', label: 'Part-time' },
  { value: 'Contract', label: 'Contract' },
  { value: 'Temporary', label: 'Temporary' },
  { value: 'Volunteer', label: 'Volunteer' },
]

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

const CURRENCIES = [
  { value: 'TZS', label: 'TZS' },
  { value: 'USD', label: 'USD' },
  { value: 'KES', label: 'KES' },
  { value: 'UGX', label: 'UGX' },
]

const emptyForm = () => ({
  first_name: '',
  middle_name: '',
  last_name: '',
  gender: '',
  date_of_birth: '',
  national_id: '',
  email: '',
  phone: '',
  address: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  employee_code: '',
  department_id: '',
  staff_position_id: '',
  employment_type: 'Full-time',
  hire_date: dayjs().format('YYYY-MM-DD'),
  probation_end_date: '',
  contract_end_date: '',
  basic_salary: '',
  currency: 'TZS',
  contract_title: '',
  contract_terms: '',
  bank_name: '',
  bank_account: '',
  bank_branch: '',
  create_portal_user: false,
  role_id: '',
  password: '',
  notes: '',
})

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Field-level validation — mirrors the API rules so errors show before submit. */
function validate(form) {
  const e = {}
  if (!form.first_name.trim()) e.first_name = 'First name is required'
  if (!form.last_name.trim()) e.last_name = 'Last name is required'
  if (form.email && !EMAIL_RE.test(form.email.trim())) e.email = 'Enter a valid email address'
  if (form.date_of_birth && dayjs(form.date_of_birth).isAfter(dayjs())) {
    e.date_of_birth = 'Date of birth cannot be in the future'
  }
  if (!form.hire_date) e.hire_date = 'Joining date is required'
  if (form.hire_date && form.probation_end_date && form.probation_end_date < form.hire_date) {
    e.probation_end_date = 'Must be on or after the joining date'
  }
  if (form.hire_date && form.contract_end_date && form.contract_end_date < form.hire_date) {
    e.contract_end_date = 'Must be on or after the joining date'
  }
  if (form.basic_salary !== '' && (Number.isNaN(Number(form.basic_salary)) || Number(form.basic_salary) < 0)) {
    e.basic_salary = 'Enter a valid amount'
  }
  if (form.create_portal_user) {
    if (!form.email.trim()) e.email = 'Email is required to create a portal login'
    if (form.password && form.password.length < 8) e.password = 'At least 8 characters'
  }
  return e
}

/** Which section each field lives in (to scroll to the first error). */
const FIELD_SECTION = {
  first_name: 'personal',
  last_name: 'personal',
  date_of_birth: 'personal',
  email: 'contact',
  hire_date: 'contract',
  probation_end_date: 'contract',
  contract_end_date: 'contract',
  basic_salary: 'contract',
  password: 'access',
}

const SECTIONS = [
  { key: 'personal', title: 'Personal details', icon: UserRound, required: true },
  { key: 'contact', title: 'Contact', icon: Mail },
  { key: 'placement', title: 'Role & placement', icon: Building2 },
  { key: 'contract', title: 'Employment contract', icon: FileSignature, required: true },
  { key: 'bank', title: 'Payroll & bank', icon: Banknote },
  { key: 'access', title: 'Portal access', icon: KeyRound },
  { key: 'notes', title: 'Notes', icon: StickyNote },
]

function sectionDone(key, f) {
  switch (key) {
    case 'personal':
      return Boolean(f.first_name.trim() && f.last_name.trim())
    case 'contact':
      return Boolean(f.email.trim() || f.phone.trim())
    case 'placement':
      return Boolean(f.department_id && f.staff_position_id)
    case 'contract':
      return Boolean(f.hire_date)
    case 'bank':
      return Boolean(f.bank_name.trim() && f.bank_account.trim())
    case 'access':
      return f.create_portal_user ? Boolean(f.email.trim()) : true
    case 'notes':
      return Boolean(f.notes.trim())
    default:
      return false
  }
}

const scrollToSection = (key) =>
  document.getElementById(`onboard-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

/* ── Layout pieces ───────────────────────────────────────────────── */

/** Thin adapters over the shared form layout (ids used for scroll-to-section). */
const Section = ({ sectionKey, ...props }) => <FormSection id={`onboard-${sectionKey}`} {...props} />
const Grid = FieldGrid
const Toggle = ToggleRow

/* ── Success screen ──────────────────────────────────────────────── */

function OnboardSuccess({ result, onAnother }) {
  const navigate = useNavigate()
  const s = result?.staff || {}
  const contract = result?.contract
  const password = result?.temporary_password
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await copyText(password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toastError('Could not copy — select the password and copy it manually')
    }
  }

  const rows = [
    ['Employee code', s.employee_code],
    ['Position', s.staff_position?.name || s.position],
    ['Department', s.department?.name],
    ['Joining date', s.hire_date ? dayjs(s.hire_date).format('D MMM YYYY') : null],
    ['Contract', contract?.contract_number || contract?.title],
    ['Portal login', result?.user ? result.user.email : 'Not created'],
  ]

  return (
    <Card className="border border-slate-200 shadow-none">
      <CardBody className="p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
          <div className="lg:max-w-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" strokeWidth={1.75} />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              {s.full_name || 'Staff member'} is onboarded
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Their HR profile and employment contract have been created
              {result?.user ? ', along with a portal login.' : '.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <FormButton onPress={() => navigate(`/staff/profiles?id=${s.id}`)}>View profile</FormButton>
              <FormButton appearance="bordered" startContent={<UserPlus className="h-4 w-4" />} onPress={onAnother}>
                Onboard another
              </FormButton>
              <FormButton appearance="light" onPress={() => navigate('/staff')}>
                Staff directory
              </FormButton>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {rows.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[minmax(7rem,40%)_1fr] gap-3 px-4 py-2.5 text-[13px]">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="min-w-0 break-words font-medium text-slate-900">
                    {value || <span className="font-normal text-slate-400">—</span>}
                  </dd>
                </div>
              ))}
            </dl>

            {password ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-[13px] font-semibold text-amber-900">Temporary password</p>
                <p className="mt-0.5 text-xs text-amber-800">
                  Shown only once. Share it securely; the employee should change it after first sign-in.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-md border border-amber-200 bg-white px-3 py-2 font-mono text-sm text-slate-900">
                    {password}
                  </code>
                  <FormButton appearance="bordered" isIconOnly aria-label="Copy password" onPress={copy}>
                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </FormButton>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

/* ── Page ────────────────────────────────────────────────────────── */

export default function StaffOnboard() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { can } = useAuth()
  const canCreateLogin = can('users', 'write')

  const deptsQ = useQuery({ queryKey: ['staff-departments'], queryFn: listDepartments, staleTime: 30_000 })
  const posQ = useQuery({ queryKey: ['staff-positions'], queryFn: listStaffPositions, staleTime: 30_000 })
  const rolesQ = useQuery({
    queryKey: ['school', 'roles'],
    queryFn: () => listSchoolRoles({ scope: 'school' }),
    enabled: canCreateLogin,
  })

  const departments = (deptsQ.data?.departments || []).filter((d) => d.is_active !== false)
  const positions = (posQ.data?.positions || []).filter((p) => p.is_active !== false)
  const roles = (rolesQ.data?.roles || []).filter((r) => r.name !== 'super_admin')

  const [form, setForm] = useState(emptyForm)
  const [showErrors, setShowErrors] = useState(false)
  const [result, setResult] = useState(null)

  const errors = useMemo(() => validate(form), [form])
  const visibleErrors = showErrors ? errors : {}
  const err = (k) => visibleErrors[k]
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))

  const mut = useMutation({
    mutationFn: onboardStaff,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['staff'] })
      toastSuccess('Staff onboarded successfully')
      setResult(data)
      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
    },
    onError: (e) => toastError('Onboarding failed', e?.message || 'Please check the form and try again.'),
  })

  const submit = () => {
    setShowErrors(true)
    const keys = Object.keys(errors)
    if (keys.length) {
      toastError('Please fix the highlighted fields')
      scrollToSection(FIELD_SECTION[keys[0]] || 'personal')
      return
    }
    const n = (v) => (v === '' || v === null ? null : v)
    mut.mutate({
      first_name: form.first_name.trim(),
      middle_name: n(form.middle_name.trim()),
      last_name: form.last_name.trim(),
      gender: n(form.gender),
      date_of_birth: n(form.date_of_birth),
      national_id: n(form.national_id.trim()),
      email: n(form.email.trim()),
      phone: n(form.phone.trim()),
      address: n(form.address.trim()),
      emergency_contact_name: n(form.emergency_contact_name.trim()),
      emergency_contact_phone: n(form.emergency_contact_phone.trim()),
      employee_code: n(form.employee_code.trim()),
      department_id: form.department_id ? Number(form.department_id) : null,
      staff_position_id: form.staff_position_id ? Number(form.staff_position_id) : null,
      employment_type: form.employment_type || 'Full-time',
      hire_date: form.hire_date,
      probation_end_date: n(form.probation_end_date),
      contract_end_date: n(form.contract_end_date),
      basic_salary: form.basic_salary !== '' ? Number(form.basic_salary) : null,
      currency: form.currency || 'TZS',
      contract_title: n(form.contract_title.trim()),
      contract_terms: n(form.contract_terms.trim()),
      bank_name: n(form.bank_name.trim()),
      bank_account: n(form.bank_account.trim()),
      bank_branch: n(form.bank_branch.trim()),
      notes: n(form.notes.trim()),
      status: 'active',
      create_portal_user: canCreateLogin && Boolean(form.create_portal_user),
      role_id: form.create_portal_user && form.role_id ? Number(form.role_id) : null,
      password: form.create_portal_user ? n(form.password) : null,
    })
  }

  const reset = () => {
    setForm(emptyForm())
    setShowErrors(false)
    setResult(null)
    mut.reset()
  }

  if (result) {
    return <OnboardSuccess result={result} onAnother={reset} />
  }

  const fullName = [form.first_name, form.middle_name, form.last_name].map((v) => v.trim()).filter(Boolean).join(' ')
  const deptName = departments.find((d) => String(d.id) === form.department_id)?.name
  const posName = positions.find((p) => String(p.id) === form.staff_position_id)?.name
  const requiredLeft = SECTIONS.filter((s) => s.required && !sectionDone(s.key, form)).length

  const actions = (
    <div className="flex flex-col gap-2">
      <FormButton
        className="w-full"
        isLoading={mut.isPending}
        startContent={mut.isPending ? null : <UserPlus className="h-4 w-4" />}
        onPress={submit}
      >
        Complete onboarding
      </FormButton>
      <FormButton className="w-full" appearance="light" onPress={() => navigate('/staff')} isDisabled={mut.isPending}>
        Cancel
      </FormButton>
    </div>
  )

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
      {/* ── Form ── */}
      <form
        className="min-w-0 space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <Section
          index={1}
          sectionKey="personal"
          title="Personal details"
          icon={UserRound}
          description="Legal name and identity details as they appear on official documents."
        >
          <Grid>
            <FormField label="First name" required error={err('first_name')}>
              <FormInput value={form.first_name} onValueChange={set('first_name')} isInvalid={!!err('first_name')} autoComplete="off" />
            </FormField>
            <FormField label="Middle name">
              <FormInput value={form.middle_name} onValueChange={set('middle_name')} autoComplete="off" />
            </FormField>
            <FormField label="Last name" required error={err('last_name')}>
              <FormInput value={form.last_name} onValueChange={set('last_name')} isInvalid={!!err('last_name')} autoComplete="off" />
            </FormField>
            <FormField label="Gender">
              <FormSelect placeholder="Select gender" value={form.gender} onChange={set('gender')} options={GENDERS} />
            </FormField>
            <FormField label="Date of birth" error={err('date_of_birth')}>
              <FormInput
                type="date"
                value={form.date_of_birth}
                onValueChange={set('date_of_birth')}
                isInvalid={!!err('date_of_birth')}
                max={dayjs().format('YYYY-MM-DD')}
              />
            </FormField>
            <FormField label="National ID (NIDA)">
              <FormInput value={form.national_id} onValueChange={set('national_id')} autoComplete="off" />
            </FormField>
          </Grid>
        </Section>

        <Section
          index={2}
          sectionKey="contact"
          title="Contact"
          icon={Mail}
          description="How the school reaches this person, and who to call in an emergency."
        >
          <Grid>
            <FormField
              label="Email"
              required={form.create_portal_user}
              error={err('email')}
              hint={form.create_portal_user ? 'Used as the portal login' : undefined}
            >
              <FormInput type="email" value={form.email} onValueChange={set('email')} isInvalid={!!err('email')} placeholder="name@school.ac.tz" />
            </FormField>
            <FormField label="Phone">
              <FormInput type="tel" value={form.phone} onValueChange={set('phone')} placeholder="+255 7XX XXX XXX" />
            </FormField>
            <FormField label="Address" className="sm:col-span-2 2xl:col-span-1">
              <FormInput value={form.address} onValueChange={set('address')} />
            </FormField>
            <FormField label="Emergency contact name">
              <FormInput value={form.emergency_contact_name} onValueChange={set('emergency_contact_name')} />
            </FormField>
            <FormField label="Emergency contact phone">
              <FormInput type="tel" value={form.emergency_contact_phone} onValueChange={set('emergency_contact_phone')} />
            </FormField>
          </Grid>
        </Section>

        <Section
          index={3}
          sectionKey="placement"
          title="Role & placement"
          icon={Building2}
          description="Where this person sits in the school’s organisation."
        >
          <Grid>
            <FormField
              label="Department"
              hint={!deptsQ.isLoading && departments.length === 0 ? 'No departments yet — add them under Staff › Departments' : undefined}
            >
              <FormSelect
                placeholder={deptsQ.isLoading ? 'Loading…' : 'Select department'}
                value={form.department_id}
                onChange={set('department_id')}
                options={departments.map((d) => ({ value: String(d.id), label: d.name }))}
              />
            </FormField>
            <FormField
              label="Position"
              hint={!posQ.isLoading && positions.length === 0 ? 'No positions yet — add them under Staff › Roles & positions' : undefined}
            >
              <FormSelect
                placeholder={posQ.isLoading ? 'Loading…' : 'Select position'}
                value={form.staff_position_id}
                onChange={set('staff_position_id')}
                options={positions.map((p) => ({ value: String(p.id), label: p.name }))}
              />
            </FormField>
            <FormField label="Employee code" hint="Leave empty to generate automatically">
              <FormInput value={form.employee_code} onValueChange={set('employee_code')} placeholder="e.g. STF-0006" />
            </FormField>
          </Grid>
        </Section>

        <Section
          index={4}
          sectionKey="contract"
          title="Employment contract"
          icon={FileSignature}
          description="Creates the first contract on file. Leave the end date empty for a permanent position."
        >
          <Grid>
            <FormField label="Employment type">
              <FormSelect value={form.employment_type} onChange={set('employment_type')} options={EMPLOYMENT_TYPES} />
            </FormField>
            <FormField label="Joining date" required error={err('hire_date')}>
              <FormInput type="date" value={form.hire_date} onValueChange={set('hire_date')} isInvalid={!!err('hire_date')} />
            </FormField>
            <FormField label="Probation ends" error={err('probation_end_date')}>
              <FormInput
                type="date"
                value={form.probation_end_date}
                onValueChange={set('probation_end_date')}
                isInvalid={!!err('probation_end_date')}
                min={form.hire_date || undefined}
              />
            </FormField>
            <FormField label="Contract ends" error={err('contract_end_date')} hint="Only for fixed-term contracts">
              <FormInput
                type="date"
                value={form.contract_end_date}
                onValueChange={set('contract_end_date')}
                isInvalid={!!err('contract_end_date')}
                min={form.hire_date || undefined}
              />
            </FormField>
            <FormField label="Basic salary (monthly)" error={err('basic_salary')}>
              <div className="flex gap-2">
                <div className="w-24 shrink-0">
                  <FormSelect value={form.currency} onChange={(v) => set('currency')(v || 'TZS')} options={CURRENCIES} label="Currency" />
                </div>
                <FormInput
                  aria-label="Basic salary amount"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={form.basic_salary}
                  onValueChange={set('basic_salary')}
                  isInvalid={!!err('basic_salary')}
                  placeholder="0"
                />
              </div>
            </FormField>
            <FormField label="Contract title">
              <FormInput value={form.contract_title} onValueChange={set('contract_title')} placeholder="e.g. Permanent employment agreement" />
            </FormField>
            <FormField label="Contract terms" className="sm:col-span-2 2xl:col-span-3">
              <FormTextarea value={form.contract_terms} onValueChange={set('contract_terms')} minRows={3} placeholder="Key terms, allowances, working hours…" />
            </FormField>
          </Grid>
        </Section>

        <Section
          index={5}
          sectionKey="bank"
          title="Payroll & bank"
          icon={Banknote}
          optional
          description="Used for salary payments. You can add these later from the staff directory."
        >
          <Grid>
            <FormField label="Bank name">
              <FormInput value={form.bank_name} onValueChange={set('bank_name')} placeholder="e.g. CRDB, NMB" />
            </FormField>
            <FormField label="Account number">
              <FormInput value={form.bank_account} onValueChange={set('bank_account')} autoComplete="off" />
            </FormField>
            <FormField label="Branch">
              <FormInput value={form.bank_branch} onValueChange={set('bank_branch')} />
            </FormField>
          </Grid>
        </Section>

        <Section
          index={6}
          sectionKey="access"
          title="Portal access"
          icon={KeyRound}
          optional
          description="Give this person their own Shengena login. Their role decides what they can open."
        >
          {canCreateLogin ? (
            <div className="space-y-3.5">
              <Toggle
                checked={form.create_portal_user}
                onChange={set('create_portal_user')}
                label="Create a portal login"
                description={
                  form.create_portal_user
                    ? 'A login will be created with the email above.'
                    : 'HR record only — no sign-in access.'
                }
              />
              {form.create_portal_user ? (
                <Grid>
                  <FormField label="System role" hint="Controls which areas they can open">
                    <FormSelect
                      placeholder={rolesQ.isLoading ? 'Loading…' : 'Default (Clerk)'}
                      value={form.role_id}
                      onChange={set('role_id')}
                      options={roles.map((r) => ({ value: String(r.id), label: r.label || r.name }))}
                    />
                  </FormField>
                  <FormField label="Password" error={err('password')} hint="Leave empty to generate a temporary password">
                    <FormInput
                      type="password"
                      value={form.password}
                      onValueChange={set('password')}
                      isInvalid={!!err('password')}
                      autoComplete="new-password"
                    />
                  </FormField>
                </Grid>
              ) : null}
            </div>
          ) : (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs text-slate-600">
              Only school administrators can create portal logins. The HR record will be created without sign-in access.
            </p>
          )}
        </Section>

        <Section index={7} sectionKey="notes" title="Notes" icon={StickyNote} optional description="Internal HR notes. Not visible to the employee.">
          <FormTextarea value={form.notes} onValueChange={set('notes')} minRows={3} />
        </Section>

        {/* Actions for screens without the side panel */}
        <Card className="border border-slate-200 shadow-none xl:hidden">
          <CardBody className="flex flex-col-reverse gap-2 p-4 sm:flex-row sm:justify-end">
            <FormButton appearance="light" onPress={() => navigate('/staff')} isDisabled={mut.isPending}>
              Cancel
            </FormButton>
            <FormButton isLoading={mut.isPending} startContent={mut.isPending ? null : <UserPlus className="h-4 w-4" />} onPress={submit}>
              Complete onboarding
            </FormButton>
          </CardBody>
        </Card>
      </form>

      {/* ── Side panel: progress, summary, actions ── */}
      <aside className="hidden space-y-4 xl:sticky xl:top-0 xl:block">
        <ProgressChecklist
          title="Onboarding checklist"
          items={SECTIONS.map((sec) => ({
            ...sec,
            done: sectionDone(sec.key, form),
            hasError: showErrors && Object.keys(errors).some((k) => FIELD_SECTION[k] === sec.key),
          }))}
          onSelect={scrollToSection}
        />

        <Card className="border border-slate-200 shadow-none">
          <CardBody className="space-y-4 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0B3D2E] text-sm font-semibold text-white">
                {fullName ? fullName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase() : <UserRound className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{fullName || 'New staff member'}</p>
                <p className="truncate text-xs text-slate-500">{[posName, deptName].filter(Boolean).join(' · ') || 'No position yet'}</p>
              </div>
            </div>
            <dl className="space-y-1.5 text-xs">
              {[
                ['Joining', form.hire_date ? dayjs(form.hire_date).format('D MMM YYYY') : '—'],
                ['Employment', form.employment_type || '—'],
                ['Salary', form.basic_salary !== '' && !Number.isNaN(Number(form.basic_salary)) ? `${Number(form.basic_salary).toLocaleString()} ${form.currency}` : '—'],
                ['Portal login', form.create_portal_user && canCreateLogin ? 'Yes' : 'No'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="truncate text-right font-medium text-slate-900">{v}</dd>
                </div>
              ))}
            </dl>
            {requiredLeft > 0 ? (
              <p className="rounded-md bg-slate-50 px-2.5 py-2 text-[11px] text-slate-600">
                Complete the required steps to finish onboarding.
              </p>
            ) : null}
            {actions}
          </CardBody>
        </Card>

        <p className="flex items-start gap-1.5 px-1 text-[11px] leading-relaxed text-slate-400">
          <Briefcase className="mt-px h-3.5 w-3.5 shrink-0" />
          The staff member is created as Active with their first contract on file.
        </p>
      </aside>
    </div>
  )
}
