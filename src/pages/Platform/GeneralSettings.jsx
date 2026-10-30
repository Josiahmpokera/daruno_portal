import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Switch } from '@heroui/react'
import { Save } from 'lucide-react'
import {
  FormButton,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
} from '../../components/Form'
import { toastError, toastSuccess } from '../../components/Toast'
import { platformSettings, platformUpdateSettings } from '../../api/domain.js'
import { SectionSkeleton } from '../../components/Loading'

const CURRENCY_OPTIONS = [
  { value: 'TZS', label: 'TZS — Tanzanian Shilling' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'KES', label: 'KES — Kenyan Shilling' },
  { value: 'UGX', label: 'UGX — Ugandan Shilling' },
]

const emptyFooterColumns = () => [
  {
    title: 'Product',
    linksText: 'Features|/features\nPricing|/#pricing\nRegister school|/register-school',
  },
  {
    title: 'Company',
    linksText: 'About|/#about\nContact|/#contact\nSupport|/#support',
  },
  {
    title: 'Legal',
    linksText: 'Privacy|/#privacy\nTerms|/#terms',
  },
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
  website_tagline: '',
  website_subtitle: '',
  website_phone: '',
  website_address: '',
  website_facebook: '',
  website_twitter: '',
  website_linkedin: '',
  website_instagram: '',
  website_copyright: '',
  footer_columns: emptyFooterColumns(),
})

function columnsToForm(cols) {
  if (!Array.isArray(cols) || !cols.length) return emptyFooterColumns()
  return cols.map((c) => ({
    title: c.title || '',
    linksText: (c.links || [])
      .map((l) => `${l.label || ''}|${l.href || ''}`)
      .join('\n'),
  }))
}

function formColumnsToPayload(cols) {
  return (cols || []).map((c) => ({
    title: (c.title || '').trim() || 'Links',
    links: String(c.linksText || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, href] = line.split('|').map((s) => s.trim())
        return { label: label || 'Link', href: href || '#' }
      }),
  }))
}

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
    website_tagline: settings.website_tagline ?? settings.website?.tagline ?? '',
    website_subtitle: settings.website_subtitle ?? settings.website?.subtitle ?? '',
    website_phone: settings.website_phone ?? settings.website?.phone ?? '',
    website_address: settings.website_address ?? settings.website?.address ?? '',
    website_facebook:
      settings.website_facebook ?? settings.website?.social?.facebook ?? '',
    website_twitter:
      settings.website_twitter ?? settings.website?.social?.twitter ?? '',
    website_linkedin:
      settings.website_linkedin ?? settings.website?.social?.linkedin ?? '',
    website_instagram:
      settings.website_instagram ?? settings.website?.social?.instagram ?? '',
    website_copyright:
      settings.website_copyright ?? settings.website?.copyright ?? '',
    footer_columns: columnsToForm(
      settings.website_footer_columns ?? settings.website?.footer_columns,
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
    website_tagline: form.website_tagline.trim(),
    website_subtitle: form.website_subtitle.trim(),
    website_phone: form.website_phone.trim(),
    website_address: form.website_address.trim(),
    website_facebook: form.website_facebook.trim(),
    website_twitter: form.website_twitter.trim(),
    website_linkedin: form.website_linkedin.trim(),
    website_instagram: form.website_instagram.trim(),
    website_copyright: form.website_copyright.trim(),
    website_footer_columns: formColumnsToPayload(form.footer_columns),
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
      <SectionSkeleton label="Loading settings" />
    )
  }

  if (settingsQ.isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {settingsQ.error?.message || 'Failed to load settings.'}
      </div>
    )
  }

  const setFooterCol = (idx, key, value) => {
    setForm((prev) => {
      const cols = [...(prev.footer_columns || [])]
      cols[idx] = { ...cols[idx], [key]: value }
      return { ...prev, footer_columns: cols }
    })
    setDirty(true)
  }

  const addFooterCol = () => {
    setForm((prev) => ({
      ...prev,
      footer_columns: [
        ...(prev.footer_columns || []),
        { title: 'New column', linksText: 'Label|/path' },
      ],
    }))
    setDirty(true)
  }

  const removeFooterCol = (idx) => {
    setForm((prev) => ({
      ...prev,
      footer_columns: (prev.footer_columns || []).filter((_, i) => i !== idx),
    }))
    setDirty(true)
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

      {/* Public website & footer */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-zinc-900">
            Public website & footer
          </h3>
          <p className="mt-0.5 text-[12px] text-zinc-500">
            Hero copy, contact details and multi-column footer on the marketing site
            (home, features, pricing). Changes appear after save — no redeploy.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Hero tagline" className="sm:col-span-2">
            <FormInput
              value={form.website_tagline}
              onValueChange={(v) => setField('website_tagline', v)}
              placeholder="One classroom, one system."
            />
          </FormField>
          <FormField label="Hero subtitle" className="sm:col-span-2">
            <FormTextarea
              value={form.website_subtitle}
              onValueChange={(v) => setField('website_subtitle', v)}
              placeholder="Shengena gives private schools…"
            />
          </FormField>
          <FormField label="Public phone">
            <FormInput
              value={form.website_phone}
              onValueChange={(v) => setField('website_phone', v)}
              placeholder="+255 …"
            />
          </FormField>
          <FormField label="Address">
            <FormInput
              value={form.website_address}
              onValueChange={(v) => setField('website_address', v)}
              placeholder="Dar es Salaam, Tanzania"
            />
          </FormField>
          <FormField label="Facebook URL">
            <FormInput
              value={form.website_facebook}
              onValueChange={(v) => setField('website_facebook', v)}
            />
          </FormField>
          <FormField label="X / Twitter URL">
            <FormInput
              value={form.website_twitter}
              onValueChange={(v) => setField('website_twitter', v)}
            />
          </FormField>
          <FormField label="LinkedIn URL">
            <FormInput
              value={form.website_linkedin}
              onValueChange={(v) => setField('website_linkedin', v)}
            />
          </FormField>
          <FormField label="Instagram URL">
            <FormInput
              value={form.website_instagram}
              onValueChange={(v) => setField('website_instagram', v)}
            />
          </FormField>
          <FormField
            label="Copyright line"
            hint="Use {year} for the current year"
            className="sm:col-span-2"
          >
            <FormInput
              value={form.website_copyright}
              onValueChange={(v) => setField('website_copyright', v)}
              placeholder="© {year} Shengena. All rights reserved."
            />
          </FormField>
        </div>

        <div className="mt-5 border-t border-zinc-100 pt-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Footer columns</p>
              <p className="text-[12px] text-zinc-500">
                One link per line as <code className="text-[11px]">Label|path</code> (e.g.{' '}
                <code className="text-[11px]">Features|/features</code>).
              </p>
            </div>
            <FormButton size="sm" appearance="bordered" onPress={addFooterCol}>
              Add column
            </FormButton>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {(form.footer_columns || []).map((col, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-zinc-100 bg-zinc-50/60 p-3"
              >
                <FormField label="Column title">
                  <FormInput
                    value={col.title}
                    onValueChange={(v) => setFooterCol(idx, 'title', v)}
                  />
                </FormField>
                <FormField label="Links" className="mt-2">
                  <FormTextarea
                    value={col.linksText}
                    onValueChange={(v) => setFooterCol(idx, 'linksText', v)}
                    placeholder={'Features|/features\nPricing|/#pricing'}
                  />
                </FormField>
                <button
                  type="button"
                  className="mt-2 text-[11px] font-medium text-rose-600 hover:underline"
                  onClick={() => removeFooterCol(idx)}
                >
                  Remove column
                </button>
              </div>
            ))}
          </div>
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
