import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Chip, Spinner } from '@heroui/react'
import {
  Building2,
  Check,
  CreditCard,
  MapPin,
  Search,
  Shield,
  UserRound,
} from 'lucide-react'
import { useAuth } from '../../auth'
import { toastSuccess, toastError } from '../../components/Toast'
import ShengenaLogo from '../../components/Brand/ShengenaLogo.jsx'
import EducationStagesPicker from '../../components/School/EducationStagesPicker.jsx'
import {
  FormButton,
  FormField,
  FormInput,
  FormSelect,
} from '../../components/Form'
import {
  publicPricingPlans,
  searchRegistrySchools,
} from '../../api/domain.js'
import { formatPlanPrice } from '../../utils/money.js'

const TRIAL_DAYS = 15

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'mobile_money', label: 'Mobile money (M-Pesa / Tigo / Airtel)' },
  { value: 'cash', label: 'Cash / office payment' },
  { value: 'other', label: 'Other' },
]

function RegisterSchool() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { registerSchool } = useAuth()
  const searchWrapRef = useRef(null)

  const modeParam = searchParams.get('mode') === 'paid' ? 'paid' : 'trial'
  const planIdParam = searchParams.get('plan_id') || ''

  const [mode, setMode] = useState(modeParam)
  const [planId, setPlanId] = useState(planIdParam)
  const [step, setStep] = useState(0)

  const [schoolName, setSchoolName] = useState('')
  const [schoolCode, setSchoolCode] = useState('')
  const [selectedSchoolId, setSelectedSchoolId] = useState(null)
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [educationStages, setEducationStages] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [paymentReference, setPaymentReference] = useState('')
  const [localError, setLocalError] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [debouncedQ, setDebouncedQ] = useState('')

  // Sync URL → state once
  useEffect(() => {
    setMode(modeParam)
    if (planIdParam) {
      setPlanId(planIdParam)
      setMode('paid')
    }
  }, [modeParam, planIdParam])

  const plansQ = useQuery({
    queryKey: ['public', 'pricing', 'plans'],
    queryFn: publicPricingPlans,
    staleTime: 60_000,
  })
  const plans = plansQ.data?.plans || []
  const selectedPlan = plans.find((p) => String(p.id) === String(planId))

  const steps = useMemo(() => {
    const base = [
      {
        key: 'path',
        label: 'Plan',
        desc: mode === 'paid' ? 'Choose package' : '15-day free trial',
        icon: CreditCard,
      },
      {
        key: 'school',
        label: 'School',
        desc: 'Find or name your school',
        icon: Building2,
      },
      {
        key: 'levels',
        label: 'Levels',
        desc: 'Education stages',
        icon: Shield,
      },
      {
        key: 'admin',
        label: 'Admin',
        desc: 'Your account',
        icon: UserRound,
      },
    ]
    if (mode === 'paid') {
      base.push({
        key: 'payment',
        label: 'Payment',
        desc: 'Pay for your package',
        icon: CreditCard,
      })
    }
    base.push({
      key: 'review',
      label: 'Confirm',
      desc: 'Review & finish',
      icon: Check,
    })
    return base
  }, [mode])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(schoolName.trim()), 280)
    return () => clearTimeout(t)
  }, [schoolName])

  const searchQ = useQuery({
    queryKey: ['public', 'register-school-search', debouncedQ],
    queryFn: () => searchRegistrySchools({ q: debouncedQ, limit: 12 }),
    enabled: debouncedQ.length >= 2 && !selectedSchoolId && step === 1,
    staleTime: 15_000,
  })
  const results = searchQ.data?.schools || []

  useEffect(() => {
    const onDoc = (e) => {
      if (!searchWrapRef.current?.contains(e.target)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  // Keep step in range when mode changes
  useEffect(() => {
    if (step >= steps.length) setStep(steps.length - 1)
  }, [steps.length, step])

  const pickSchool = (s) => {
    if (s.is_claimed || !s.available) {
      toastError(
        'School already registered',
        'This school already has a Shengena account. Sign in instead.',
      )
      return
    }
    setSelectedSchoolId(s.id)
    setSchoolName(s.name || '')
    setSchoolCode(s.code || '')
    if (Array.isArray(s.education_stages) && s.education_stages.length) {
      setEducationStages(s.education_stages)
    }
    setSearchOpen(false)
    setLocalError('')
  }

  const clearPickedSchool = () => setSelectedSchoolId(null)

  const validateStep = (i) => {
    setLocalError('')
    const key = steps[i]?.key
    if (key === 'path') {
      if (mode === 'paid' && !planId) {
        setLocalError('Select a subscription package to continue.')
        return false
      }
      return true
    }
    if (key === 'school') {
      if (!schoolName.trim()) {
        setLocalError('School name is required.')
        return false
      }
      return true
    }
    if (key === 'levels') {
      if (!educationStages.length) {
        setLocalError('Select at least one education level.')
        return false
      }
      return true
    }
    if (key === 'admin') {
      if (!adminName.trim() || !adminEmail.trim() || !adminPassword) {
        setLocalError('Admin name, email and password are required.')
        return false
      }
      if (adminPassword.length < 8) {
        setLocalError('Password must be at least 8 characters.')
        return false
      }
      return true
    }
    if (key === 'payment') {
      if (!paymentMethod) {
        setLocalError('Select a payment method.')
        return false
      }
      return true
    }
    return true
  }

  const goNext = () => {
    if (!validateStep(step)) return
    setStep((s) => Math.min(s + 1, steps.length - 1))
  }
  const goBack = () => {
    setLocalError('')
    setStep((s) => Math.max(s - 1, 0))
  }

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!educationStages.length) {
        throw new Error('Select at least one education level (e.g. Primary, O-Level).')
      }
      if (!schoolName.trim()) throw new Error('School name is required.')
      if (mode === 'paid' && !planId) {
        throw new Error('Select a package for paid registration.')
      }
      return registerSchool({
        school_name: schoolName.trim(),
        school_code: schoolCode.trim() || undefined,
        school_id: selectedSchoolId || undefined,
        admin_name: adminName.trim(),
        admin_email: adminEmail.trim(),
        admin_password: adminPassword,
        education_stages: educationStages,
        registration_mode: mode,
        plan_id: planId ? Number(planId) : undefined,
        payment_method: mode === 'paid' ? paymentMethod : undefined,
        payment_reference:
          mode === 'paid' && paymentReference.trim()
            ? paymentReference.trim()
            : undefined,
      })
    },
    onSuccess: (session) => {
      const sub = session?.subscription || session?.user?.school?.subscription
      if (mode === 'trial') {
        const days =
          sub?.trial_days_left ??
          (sub?.trial_ends_on
            ? Math.max(
                0,
                Math.ceil(
                  (new Date(sub.trial_ends_on) - new Date()) / 86400000,
                ),
              )
            : TRIAL_DAYS)
        toastSuccess(
          'Trial started',
          `${session?.user?.school?.name || 'Your school'} — ${days} days free. Trial ends ${sub?.trial_ends_on || 'in 15 days'}.`,
        )
      } else {
        toastSuccess(
          'Account created',
          session?.invoice?.reference
            ? `Invoice ${session.invoice.reference} issued. Complete payment to activate billing.`
            : 'Complete payment so your subscription can be activated.',
        )
      }
      navigate('/dashboard', { replace: true })
    },
    onError: (err) => {
      toastError('Registration failed', err?.message || 'Please try again.')
    },
  })

  const finish = () => {
    if (!validateStep(step)) return
    // Validate all prior steps
    for (let i = 0; i < steps.length - 1; i++) {
      if (!validateStep(i)) {
        setStep(i)
        return
      }
    }
    registerMutation.mutate()
  }

  const currentKey = steps[step]?.key

  const goToStep = (i) => {
    if (i <= step) {
      setLocalError('')
      setStep(i)
      return
    }
    for (let j = 0; j < i; j++) {
      if (!validateStep(j)) {
        setStep(j)
        return
      }
    }
    setStep(i)
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-zinc-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            className="rounded-md p-1 transition-colors hover:bg-zinc-50"
            onClick={() => navigate('/')}
          >
            <ShengenaLogo
              variant="full"
              iconClassName="h-8 w-32 object-contain sm:h-9 sm:w-36"
              wordClassName="h-6 w-auto object-contain sm:h-7"
            />
          </button>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden text-xs text-zinc-500 sm:inline">
              Already registered?
            </span>
            <FormButton appearance="light" onPress={() => navigate('/login')}>
              Sign in
            </FormButton>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-col md:min-h-[calc(100vh-3.5rem)] md:flex-row">
        {/* Steps — page sidebar, not a card */}
        <aside className="border-b border-zinc-100 bg-zinc-50/80 px-4 py-5 sm:px-6 md:w-64 md:shrink-0 md:border-b-0 md:border-r md:px-6 md:py-10 lg:w-72 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#0B3D2E]/70">
            School registration
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
            {mode === 'trial' ? `${TRIAL_DAYS}-day free trial` : 'Paid package'}
          </h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-500">
            {mode === 'trial'
              ? 'Full access while we count down your trial days.'
              : selectedPlan
                ? `${selectedPlan.name} · ${formatPlanPrice(selectedPlan)}`
                : 'Choose a plan, then complete payment.'}
          </p>

          {/* Mobile horizontal steps */}
          <div className="mt-5 flex gap-1.5 overflow-x-auto pb-1 md:hidden">
            {steps.map((s, i) => {
              const done = i < step
              const active = i === step
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => goToStep(i)}
                  className={[
                    'flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                    active
                      ? 'bg-[#0B3D2E] text-white'
                      : done
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-white text-zinc-500 ring-1 ring-zinc-200',
                  ].join(' ')}
                >
                  {done ? <Check className="h-3 w-3" /> : i + 1}
                  {s.label}
                </button>
              )
            })}
          </div>

          {/* Desktop vertical steps */}
          <ol className="mt-8 hidden space-y-0 md:block">
            {steps.map((s, i) => {
              const Icon = s.icon
              const done = i < step
              const active = i === step
              const last = i === steps.length - 1
              return (
                <li key={s.key} className="relative">
                  {!last ? (
                    <span
                      className={[
                        'absolute left-[13px] top-8 h-[calc(100%-0.5rem)] w-px',
                        done ? 'bg-emerald-400' : 'bg-zinc-200',
                      ].join(' ')}
                      aria-hidden
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => goToStep(i)}
                    className={[
                      'relative flex w-full items-start gap-3 rounded-lg py-2 text-left transition-colors',
                      active ? 'opacity-100' : done ? 'opacity-90' : 'opacity-55 hover:opacity-80',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                        done
                          ? 'bg-emerald-500 text-white'
                          : active
                            ? 'bg-[#0B3D2E] text-white'
                            : 'bg-white text-zinc-500 ring-1 ring-zinc-200',
                      ].join(' ')}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                    <span className="min-w-0 pt-0.5">
                      <span
                        className={[
                          'flex items-center gap-1.5 text-[13px] font-semibold',
                          active ? 'text-zinc-900' : 'text-zinc-700',
                        ].join(' ')}
                      >
                        <Icon className="h-3.5 w-3.5 opacity-70" />
                        {s.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-zinc-500">
                        {s.desc}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </aside>

        {/* Form area — open on the page, no card shell */}
        <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-12 lg:py-12">
          <div className="mx-auto w-full max-w-xl">
            <div className="mb-8">
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                Step {step + 1} of {steps.length}
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
                {steps[step]?.label}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">{steps[step]?.desc}</p>
            </div>

            <div className="flex flex-col gap-5">
              {/* Step: path */}
              {currentKey === 'path' ? (
                <div className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('trial')
                        setPlanId('')
                      }}
                      className={`rounded-lg border p-4 text-left transition-colors ${
                        mode === 'trial'
                          ? 'border-[#0B3D2E] bg-[#0B3D2E]/[0.04] ring-1 ring-[#0B3D2E]/25'
                          : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <Chip size="sm" color="success" variant="flat" className="mb-2">
                        Recommended
                      </Chip>
                      <p className="text-sm font-semibold text-zinc-900">
                        {TRIAL_DAYS}-day free trial
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                        Full platform access. We start counting days when you
                        finish registration — no payment now.
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('paid')}
                      className={`rounded-lg border p-4 text-left transition-colors ${
                        mode === 'paid'
                          ? 'border-[#0B3D2E] bg-[#0B3D2E]/[0.04] ring-1 ring-[#0B3D2E]/25'
                          : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <p className="text-sm font-semibold text-zinc-900">
                        Choose a package
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                        Pick a plan and complete payment to activate billing
                        from day one.
                      </p>
                    </button>
                  </div>

                  {mode === 'paid' ? (
                    <div className="space-y-2">
                      <p className="text-[11px] font-medium text-zinc-600">
                        Select package
                      </p>
                      {plansQ.isLoading ? (
                        <Spinner size="sm" color="success" />
                      ) : (
                        <div className="grid gap-2">
                          {plans.map((p) => {
                            const active = String(p.id) === String(planId)
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setPlanId(String(p.id))}
                                className={`flex items-center justify-between rounded-lg border px-3.5 py-3 text-left transition-colors ${
                                  active
                                    ? 'border-[#0B3D2E] bg-[#0B3D2E]/[0.04]'
                                    : 'border-zinc-200 hover:border-zinc-300'
                                }`}
                              >
                                <div>
                                  <p className="text-sm font-semibold text-zinc-900">
                                    {p.name}
                                  </p>
                                  <p className="text-[11px] capitalize text-zinc-500">
                                    {p.billing_cycle} billing
                                  </p>
                                </div>
                                <p className="text-sm font-bold tabular-nums text-[#0B3D2E]">
                                  {formatPlanPrice(p)}
                                </p>
                              </button>
                            )
                          })}
                          {!plans.length ? (
                            <p className="text-xs text-zinc-500">
                              No active plans. Contact support or start a trial.
                            </p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs leading-relaxed text-zinc-500">
                      Your trial starts the day you complete registration and
                      lasts <strong className="text-zinc-700">{TRIAL_DAYS} days</strong>.
                      We track trial end date on your subscription for monitoring
                      and reminders.
                    </p>
                  )}
                </div>
              ) : null}

              {/* Step: school */}
              {currentKey === 'school' ? (
                <div ref={searchWrapRef} className="relative space-y-4">
                  <FormField label="School name" required>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                      <FormInput
                        placeholder="Start typing to search your school…"
                        value={schoolName}
                        onValueChange={(v) => {
                          setSchoolName(v)
                          if (selectedSchoolId) clearPickedSchool()
                          setSearchOpen(true)
                        }}
                        onFocus={() => setSearchOpen(true)}
                        isRequired
                        classNames={{ inputWrapper: 'pl-8' }}
                      />
                    </div>
                  </FormField>

                  {selectedSchoolId ? (
                    <div className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-xs text-emerald-900">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">Linked to directory school</p>
                        <p className="text-emerald-800/80">
                          Code: {schoolCode || '—'}
                        </p>
                      </div>
                      <FormButton
                        appearance="light"
                        className="min-w-0 px-1 text-emerald-800"
                        onPress={() => {
                          clearPickedSchool()
                          setSchoolCode('')
                        }}
                      >
                        Change
                      </FormButton>
                    </div>
                  ) : null}

                  {searchOpen && debouncedQ.length >= 2 && !selectedSchoolId ? (
                    <div className="absolute z-30 max-h-64 w-full overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-md">
                      {searchQ.isFetching ? (
                        <div className="flex items-center justify-center gap-2 px-3 py-4 text-xs text-zinc-500">
                          <Spinner size="sm" color="success" />
                          Searching…
                        </div>
                      ) : results.length === 0 ? (
                        <div className="px-3 py-3 text-xs text-zinc-500">
                          No directory match — continue with “{debouncedQ}” as
                          new.
                        </div>
                      ) : (
                        results.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            disabled={s.is_claimed}
                            onClick={() => pickSchool(s)}
                            className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left ${
                              s.is_claimed
                                ? 'cursor-not-allowed opacity-50'
                                : 'hover:bg-[#0B3D2E]/5'
                            }`}
                          >
                            <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0B3D2E]" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {s.name}
                              </p>
                              <p className="text-[11px] text-zinc-500">
                                {s.code ? (
                                  <span className="font-mono">{s.code}</span>
                                ) : null}
                                {s.region || s.district ? (
                                  <span className="ml-2 inline-flex items-center gap-0.5">
                                    <MapPin className="h-3 w-3" />
                                    {[s.district, s.region]
                                      .filter(Boolean)
                                      .join(', ')}
                                  </span>
                                ) : null}
                                {s.is_claimed ? (
                                  <span className="ml-2 text-amber-700">
                                    Registered
                                  </span>
                                ) : (
                                  <span className="ml-2 text-emerald-700">
                                    Available
                                  </span>
                                )}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  ) : null}

                  <FormField
                    label="School code"
                    hint="Optional — auto if empty"
                  >
                    <FormInput
                      placeholder="Short code"
                      value={schoolCode}
                      onValueChange={setSchoolCode}
                      isDisabled={Boolean(selectedSchoolId)}
                    />
                  </FormField>
                </div>
              ) : null}

              {currentKey === 'levels' ? (
                <EducationStagesPicker
                  required
                  titlesOnly
                  value={educationStages}
                  onChange={(next) => {
                    setEducationStages(next)
                    setLocalError('')
                  }}
                  hint="Tap every level you operate."
                />
              ) : null}

              {currentKey === 'admin' ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="Admin name" required>
                    <FormInput
                      placeholder="Your full name"
                      value={adminName}
                      onValueChange={setAdminName}
                      isRequired
                    />
                  </FormField>
                  <FormField label="Admin email" required>
                    <FormInput
                      type="email"
                      placeholder="name@school.edu"
                      value={adminEmail}
                      onValueChange={setAdminEmail}
                      isRequired
                    />
                  </FormField>
                  <FormField
                    label="Password"
                    required
                    className="sm:col-span-2"
                  >
                    <FormInput
                      type="password"
                      placeholder="At least 8 characters"
                      value={adminPassword}
                      onValueChange={setAdminPassword}
                      isRequired
                    />
                  </FormField>
                </div>
              ) : null}

              {currentKey === 'payment' && selectedPlan ? (
                <div className="space-y-4">
                  <div className="border-b border-zinc-100 pb-4">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                      Amount due
                    </p>
                    <p className="mt-0.5 text-2xl font-bold tabular-nums text-zinc-900">
                      {formatPlanPrice(selectedPlan)}
                    </p>
                    <p className="text-xs capitalize text-zinc-500">
                      {selectedPlan.name} · {selectedPlan.billing_cycle}
                    </p>
                  </div>
                  <FormField label="Payment method" required>
                    <FormSelect
                      value={paymentMethod}
                      onChange={setPaymentMethod}
                      options={PAYMENT_METHODS}
                    />
                  </FormField>
                  <FormField
                    label="Payment reference"
                    hint="Optional now — you can pay after signup; super admin will confirm"
                  >
                    <FormInput
                      placeholder="Bank slip / M-Pesa code"
                      value={paymentReference}
                      onValueChange={setPaymentReference}
                    />
                  </FormField>
                  <p className="text-[11px] leading-relaxed text-zinc-500">
                    An invoice will be created as <strong>unpaid</strong>. Your
                    school can use the portal while payment is confirmed by
                    platform billing.
                  </p>
                </div>
              ) : null}

              {currentKey === 'review' ? (
                <dl className="divide-y divide-zinc-100 text-sm">
                  <div className="flex flex-col gap-0.5 py-3 first:pt-0">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                      Path
                    </dt>
                    <dd className="font-medium text-zinc-900">
                      {mode === 'trial'
                        ? `${TRIAL_DAYS}-day free trial`
                        : `Paid · ${selectedPlan?.name || 'Package'}`}
                    </dd>
                    {mode === 'trial' ? (
                      <dd className="text-xs text-zinc-500">
                        Trial monitoring starts today ({TRIAL_DAYS} days).
                      </dd>
                    ) : (
                      <dd className="text-xs text-zinc-500">
                        {selectedPlan
                          ? formatPlanPrice(selectedPlan)
                          : '—'}{' '}
                        · {paymentMethod.replace('_', ' ')}
                        {paymentReference ? ` · ${paymentReference}` : ''}
                      </dd>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 py-3">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                      School
                    </dt>
                    <dd className="font-medium text-zinc-900">{schoolName}</dd>
                    <dd className="text-xs text-zinc-500">
                      {schoolCode || 'Code auto'}
                      {selectedSchoolId ? ' · Directory claim' : ' · New school'}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-0.5 py-3">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                      Levels
                    </dt>
                    <dd className="font-medium text-zinc-900">
                      {educationStages.length
                        ? educationStages.join(', ').replaceAll('_', ' ')
                        : '—'}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-0.5 py-3 last:pb-0">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                      Admin
                    </dt>
                    <dd className="font-medium text-zinc-900">{adminName}</dd>
                    <dd className="text-xs text-zinc-500">{adminEmail}</dd>
                  </div>
                </dl>
              ) : null}

              {(localError || registerMutation.isError) && (
                <div className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
                  {localError ||
                    registerMutation.error?.body?.error ||
                    registerMutation.error?.body?.message ||
                    registerMutation.error?.message}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-6">
                <FormButton
                  appearance="light"
                  isDisabled={step === 0 || registerMutation.isPending}
                  onPress={goBack}
                >
                  Back
                </FormButton>
                {step < steps.length - 1 ? (
                  <FormButton onPress={goNext}>Continue</FormButton>
                ) : (
                  <FormButton
                    isLoading={registerMutation.isPending}
                    onPress={finish}
                  >
                    {mode === 'trial'
                      ? `Start ${TRIAL_DAYS}-day trial`
                      : 'Create account & issue invoice'}
                  </FormButton>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default RegisterSchool
