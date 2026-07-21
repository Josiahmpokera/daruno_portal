import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Spinner, Switch } from '@heroui/react'
import { Save } from 'lucide-react'
import {
  FormButton,
  FormField,
  FormInput,
  FormSelect,
} from '../../components/Form'
import { toastError, toastSuccess } from '../../components/Toast'
import { platformSettings, platformUpdateSettings } from '../../api/domain.js'

const CURRENCY_OPTIONS = [
  { value: 'TZS', label: 'TZS — Tanzanian Shilling' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'KES', label: 'KES — Kenyan Shilling' },
  { value: 'UGX', label: 'UGX — Ugandan Shilling' },
]

const emptyForm = () => ({
  app_name: '',
  support_email: '',
  default_currency: 'TZS',
  default_trial_days: '14',
  allow_self_registration: true,
  require_school_approval: true,
  jwt_ttl_minutes: '60',
  password_min_length: '8',
  email_enabled: true,
  sms_enabled: false,
})

function settingsToForm(settings = {}) {
  return {
    app_name: settings.app_name ?? '',
    support_email: settings.support_email ?? '',
    default_currency: settings.default_currency ?? 'USD',
    default_trial_days: String(settings.default_trial_days ?? 14),
    allow_self_registration: Boolean(settings.allow_self_registration),
    require_school_approval: Boolean(settings.require_school_approval),
    jwt_ttl_minutes: String(
      settings.jwt_ttl_minutes ?? settings.auth?.jwt_ttl_minutes ?? 60,
    ),
    password_min_length: String(
      settings.password_min_length ?? settings.auth?.password_min_length ?? 8,
    ),
    email_enabled: Boolean(
      settings.email_enabled ?? settings.notifications?.email_enabled ?? true,
    ),
    sms_enabled: Boolean(
      settings.sms_enabled ?? settings.notifications?.sms_enabled ?? false,
    ),
  }
}

function formToPayload(form) {
  return {
    app_name: form.app_name.trim(),
    support_email: form.support_email.trim(),
    default_currency: String(form.default_currency || 'USD').toUpperCase(),
    default_trial_days: Number(form.default_trial_days) || 0,
    allow_self_registration: Boolean(form.allow_self_registration),
    require_school_approval: Boolean(form.require_school_approval),
    jwt_ttl_minutes: Number(form.jwt_ttl_minutes) || 60,
    password_min_length: Number(form.password_min_length) || 8,
    email_enabled: Boolean(form.email_enabled),
    sms_enabled: Boolean(form.sms_enabled),
  }
}

/**
 * Super Admin — General Settings (editable form, no raw JSON).
 */
export default function GeneralSettings({ onOpenTanzaniaSchools }) {
  const qc = useQueryClient()
  const [form, setForm] = useState(emptyForm)
  const [dirty, setDirty] = useState(false)

  const settingsQ = useQuery({
    queryKey: ['platform', 'settings'],
    queryFn: platformSettings,
  })

  useEffect(() => {
    if (settingsQ.data?.settings) {
      setForm(settingsToForm(settingsQ.data.settings))
      setDirty(false)
    }
  }, [settingsQ.data])

  const saveMut = useMutation({
    mutationFn: (payload) => platformUpdateSettings(payload),
    onSuccess: (data) => {
      qc.setQueryData(['platform', 'settings'], data)
      if (data?.settings) {
        setForm(settingsToForm(data.settings))
      }
      setDirty(false)
      toastSuccess('Settings saved')
    },
    onError: (err) => {
      toastError(err?.message || 'Could not save settings')
    },
  })

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  const handleSave = () => {
    if (!form.app_name.trim()) {
      toastError('App name is required')
      return
    }
    if (!form.support_email.trim()) {
      toastError('Support email is required')
      return
    }
    saveMut.mutate(formToPayload(form))
  }

  const handleReset = () => {
    if (settingsQ.data?.settings) {
      setForm(settingsToForm(settingsQ.data.settings))
      setDirty(false)
    }
  }

  if (settingsQ.isLoading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-zinc-200 bg-white py-16">
        <Spinner color="success" label="Loading settings…" />
      </div>
    )
  }

  if (settingsQ.isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {settingsQ.error?.message || 'Failed to load settings.'}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Branding & contact */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-zinc-900">
            Platform identity
          </h3>
          <p className="mt-0.5 text-[12px] text-zinc-500">
            Product name and support contact shown across the SaaS console.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="App name" required>
            <FormInput
              value={form.app_name}
              onValueChange={(v) => setField('app_name', v)}
              placeholder="Shengena"
            />
          </FormField>
          <FormField label="Support email" required>
            <FormInput
              type="email"
              value={form.support_email}
              onValueChange={(v) => setField('support_email', v)}
              placeholder="support@shengena.app"
            />
          </FormField>
        </div>
      </section>

      {/* Billing defaults */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-zinc-900">
            Billing defaults
          </h3>
          <p className="mt-0.5 text-[12px] text-zinc-500">
            Defaults applied when onboarding new schools and subscriptions.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Default currency" hint="Used for new plans and invoices">
            <FormSelect
              placeholder="Currency"
              value={form.default_currency}
              onChange={(v) => setField('default_currency', v)}
              options={CURRENCY_OPTIONS}
            />
          </FormField>
          <FormField
            label="Default trial days"
            hint="Trial length when a school is created without a custom plan"
          >
            <FormInput
              type="number"
              min={0}
              max={365}
              value={form.default_trial_days}
              onValueChange={(v) => setField('default_trial_days', v)}
            />
          </FormField>
        </div>
      </section>

      {/* Tenant onboarding */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-zinc-900">
            School onboarding
          </h3>
          <p className="mt-0.5 text-[12px] text-zinc-500">
            Control how new schools join the platform.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-900">
                Allow self-registration
              </p>
              <p className="mt-0.5 text-[12px] text-zinc-500">
                Schools can sign up from the public registration page.
              </p>
            </div>
            <Switch
              size="sm"
              color="success"
              isSelected={form.allow_self_registration}
              onValueChange={(v) => setField('allow_self_registration', v)}
              aria-label="Allow self-registration"
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-900">
                Require school approval
              </p>
              <p className="mt-0.5 text-[12px] text-zinc-500">
                New schools stay pending until a super admin activates them.
              </p>
            </div>
            <Switch
              size="sm"
              color="success"
              isSelected={form.require_school_approval}
              onValueChange={(v) => setField('require_school_approval', v)}
              aria-label="Require school approval"
            />
          </div>
        </div>
      </section>

      {/* Auth & security (summary on general) */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-zinc-900">
            Authentication defaults
          </h3>
          <p className="mt-0.5 text-[12px] text-zinc-500">
            Session and password policy for portal users.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="JWT access token lifetime (minutes)">
            <FormInput
              type="number"
              min={5}
              max={10080}
              value={form.jwt_ttl_minutes}
              onValueChange={(v) => setField('jwt_ttl_minutes', v)}
            />
          </FormField>
          <FormField label="Minimum password length">
            <FormInput
              type="number"
              min={6}
              max={32}
              value={form.password_min_length}
              onValueChange={(v) => setField('password_min_length', v)}
            />
          </FormField>
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-zinc-900">
            Platform notifications
          </h3>
          <p className="mt-0.5 text-[12px] text-zinc-500">
            Channels used for platform and tenant system messages.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-900">Email</p>
              <p className="mt-0.5 text-[12px] text-zinc-500">
                Send platform emails (billing, approvals, alerts).
              </p>
            </div>
            <Switch
              size="sm"
              color="success"
              isSelected={form.email_enabled}
              onValueChange={(v) => setField('email_enabled', v)}
              aria-label="Email notifications"
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-900">SMS</p>
              <p className="mt-0.5 text-[12px] text-zinc-500">
                SMS gateway for critical notices (requires integration).
              </p>
            </div>
            <Switch
              size="sm"
              color="success"
              isSelected={form.sms_enabled}
              onValueChange={(v) => setField('sms_enabled', v)}
              aria-label="SMS notifications"
            />
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3">
        <p className="text-[12px] text-zinc-500">
          {dirty
            ? 'You have unsaved changes.'
            : 'All changes are saved.'}
        </p>
        <div className="flex flex-wrap gap-2">
          <FormButton
            type="button"
            appearance="light"
            isDisabled={!dirty || saveMut.isPending}
            onPress={handleReset}
          >
            Discard
          </FormButton>
          <FormButton
            type="button"
            isDisabled={!dirty || saveMut.isPending}
            isLoading={saveMut.isPending}
            onPress={handleSave}
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Save settings
          </FormButton>
        </div>
      </div>

      {/* Shortcut to Tanzania registry */}
      <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-4">
        <p className="text-sm font-medium text-zinc-900">
          Tanzania school registry
        </p>
        <p className="mt-1 text-[12px] text-zinc-600">
          Bulk import and manage primary schools (region, district, school_name,
          school_code).
        </p>
        {typeof onOpenTanzaniaSchools === 'function' && (
          <FormButton
            type="button"
            className="mt-3"
            appearance="bordered"
            onPress={onOpenTanzaniaSchools}
          >
            Open Tanzania Schools
          </FormButton>
        )}
      </div>
    </div>
  )
}
