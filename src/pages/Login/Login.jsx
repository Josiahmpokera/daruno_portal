import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Spinner } from '@heroui/react'
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  GraduationCap,
  Lock,
  Mail,
  ReceiptText,
  Users,
} from 'lucide-react'
import ShengenaLogo from '../../components/Brand/ShengenaLogo.jsx'
import { useAuth } from '../../auth'
import { toastSuccess } from '../../components/Toast'
import { fetchSsoConfig, ssoStartUrl } from '../../api/auth.js'

const BLOCKED_SCHOOL_STATUSES = ['suspended', 'rejected']

const HIGHLIGHTS = [
  { icon: GraduationCap, text: 'Students, exams and NECTA report cards' },
  { icon: ReceiptText, text: 'Fees, invoices and school accounts' },
  { icon: Users, text: 'Staff, parents and daily attendance' },
]

/** Human message for a failed sign-in. */
function signInErrorMessage(err) {
  if (!err) return ''
  if (err.status === 0) return err.message
  if (err.status === 401) return 'Incorrect email or password. Please try again.'
  if (err.status === 429) return 'Too many attempts. Wait a minute, then try again.'
  if (err.status === 422) return err.message || 'Check your email and password.'
  return err.message || 'Sign-in failed. Please try again.'
}

/** The three stepped bars of the Shengena mark — decorative only. */
function BrandMark({ className = '' }) {
  const bars = [
    { shift: 0, color: 'bg-emerald-300' },
    { shift: 24, color: 'bg-emerald-500' },
    { shift: 2, color: 'bg-emerald-800' },
  ]
  return (
    <div className={`flex w-[280px] flex-col gap-3 ${className}`} aria-hidden="true">
      {bars.map((bar) => (
        <div
          key={bar.color}
          className={`h-[72px] w-[72%] ${bar.color}`}
          style={{
            marginLeft: `${bar.shift}%`,
            clipPath: 'polygon(0 0, 100% 0, 80% 100%, 20% 100%)',
          }}
        />
      ))}
    </div>
  )
}

function Field({ id, label, icon, trailing, ...inputProps }) {
  const FieldIcon = icon
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs font-medium text-slate-700">
        {label}
      </label>
      <div className="group relative">
        <FieldIcon
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#0B3D2E]"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <input
          id={id}
          className={`block h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#0B3D2E] focus:ring-4 focus:ring-[#0B3D2E]/10 disabled:cursor-not-allowed disabled:bg-slate-50 ${
            trailing ? 'pr-10' : 'pr-3'
          }`}
          {...inputProps}
        />
        {trailing}
      </div>
    </div>
  )
}

const SSO_ERRORS = {
  expired: 'Sign-in took too long. Please try again.',
  cancelled: 'Sign-in with Shengena was cancelled.',
  no_account:
    'Your Shengena account is not linked to a portal account yet. Ask your school administrator to add you.',
  failed: 'We could not complete sign-in with Shengena. Please try again.',
}

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, logout } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [showResetHelp, setShowResetHelp] = useState(false)
  const [ssoReturn] = useState(() => {
    const params = new URLSearchParams(window.location.hash.slice(1))
    return { code: params.get('sso_code'), error: params.get('sso_error') }
  })
  const [blockedMessage, setBlockedMessage] = useState(() =>
    ssoReturn.error ? SSO_ERRORS[ssoReturn.error] || SSO_ERRORS.failed : '',
  )

  const loginMutation = useMutation({
    mutationFn: (credentials) => login(credentials),
    onSuccess: async (session) => {
      const role = session?.user?.role?.name
      const isPlatform = session?.audience === 'platform' || role === 'super_admin'
      const school = session?.user?.school || session?.school || null

      // A suspended / rejected school cannot use the portal — explain, don't half-load
      if (!isPlatform && BLOCKED_SCHOOL_STATUSES.includes(school?.status)) {
        await logout()
        setBlockedMessage(
          `${school?.name || 'This school'} is ${school.status}. Contact Shengena support to restore access.`,
        )
        return
      }

      const name = session?.user?.name || session?.user?.email || 'there'
      toastSuccess(
        `Welcome back, ${name.split(' ')[0]}`,
        isPlatform ? 'Platform console' : school?.name || '',
      )

      // Return to the page that asked for sign-in, when it belongs to this audience
      const from = location.state?.from
      const fromOk =
        typeof from === 'string' &&
        from !== '/login' &&
        (isPlatform ? from.startsWith('/platform') : !from.startsWith('/platform'))
      navigate(fromOk ? from : isPlatform ? '/platform' : '/dashboard', { replace: true })
    },
  })

  const [ssoEnabled, setSsoEnabled] = useState(false)
  const handledSsoReturn = useRef(false)

  useEffect(() => {
    let active = true
    fetchSsoConfig().then(({ enabled }) => {
      if (!active) return
      setSsoEnabled(enabled)
      // /login?sso=1 (from the Shengena apps menu or the demo email) signs in with
      // Shengena straight away, unless we are just back from it with an error.
      const autoStart = new URLSearchParams(window.location.search).get('sso') === '1'
      if (enabled && autoStart && !ssoReturn.code && !ssoReturn.error) {
        window.location.assign(ssoStartUrl())
      }
    })
    return () => {
      active = false
    }
  }, [ssoReturn])

  // Back from Sign in with Shengena: the API put a one-time code (or an error) in the
  // fragment. Drop it from the address bar, then finish signing in with the code.
  useEffect(() => {
    if (handledSsoReturn.current || !(ssoReturn.code || ssoReturn.error)) return
    handledSsoReturn.current = true
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    if (ssoReturn.code) loginMutation.mutate({ ssoCode: ssoReturn.code })
  }, [ssoReturn, loginMutation])

  const pending = loginMutation.isPending
  const errorMessage =
    blockedMessage || (loginMutation.isError ? signInErrorMessage(loginMutation.error) : '')
  const canSubmit = email.trim() !== '' && password !== '' && !pending

  const onSubmit = (event) => {
    event.preventDefault()
    if (!canSubmit) return
    setBlockedMessage('')
    loginMutation.mutate({ email: email.trim(), password })
  }

  const clearError = () => {
    if (loginMutation.isError) loginMutation.reset()
    if (blockedMessage) setBlockedMessage('')
  }

  const trackCapsLock = (event) => {
    if (typeof event.getModifierState === 'function') {
      setCapsLock(event.getModifierState('CapsLock'))
    }
  }

  const year = new Date().getFullYear()

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0B3D2E] via-[#0a3628] to-[#06271c]">
      {/* Background texture + brand mark (decorative) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />
      <BrandMark className="pointer-events-none absolute -left-16 bottom-16 hidden opacity-[0.10] lg:flex" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 pb-16 pt-10 lg:justify-between lg:px-12">
        {/* Brand copy — desktop only */}
        <section className="hidden max-w-md text-white lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/90">
            Shengena School Portal
          </p>
          <h2 className="mt-5 text-4xl font-semibold leading-[1.15] tracking-tight">
            One classroom,
            <br />
            one system.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/75">
            Everything your school runs on, from admissions to report cards, in one
            secure place.
          </p>
          <ul className="mt-8 space-y-3.5">
            {HIGHLIGHTS.map((item) => (
              <li key={item.text} className="flex items-center gap-3 text-sm text-white/90">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                  <item.icon className="h-4 w-4 text-emerald-300" strokeWidth={1.75} />
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        </section>

        {/* Compact sign-in card */}
        <main className="w-full max-w-[340px] rounded-xl bg-white p-6 shadow-2xl shadow-black/25 ring-1 ring-black/5">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="-ml-0.5 inline-flex rounded-md transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B3D2E]/40"
            aria-label="Shengena home"
          >
            <ShengenaLogo iconClassName="h-8 w-auto object-contain" />
          </button>

          <h1 className="mt-5 text-lg font-semibold tracking-tight text-slate-900">Sign in</h1>
          <p className="mt-0.5 text-xs text-slate-500">Use the account your school gave you.</p>

          <form className="mt-5 space-y-3.5" onSubmit={onSubmit} noValidate>
            <Field
              id="login-email"
              label="Email address"
              icon={Mail}
              type="email"
              name="email"
              autoComplete="username"
              inputMode="email"
              placeholder="you@school.ac.tz"
              autoFocus
              required
              value={email}
              disabled={pending}
              onChange={(e) => {
                setEmail(e.target.value)
                clearError()
              }}
            />

            <div className="space-y-1">
              <Field
                id="login-password"
                label="Password"
                icon={Lock}
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                required
                value={password}
                disabled={pending}
                onChange={(e) => {
                  setPassword(e.target.value)
                  clearError()
                }}
                onKeyDown={trackCapsLock}
                onKeyUp={trackCapsLock}
                onBlur={() => setCapsLock(false)}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B3D2E]/40"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                    ) : (
                      <Eye className="h-4 w-4" strokeWidth={1.75} />
                    )}
                  </button>
                }
              />
              <div className="flex min-h-5 items-center justify-between gap-3 text-xs">
                <span className="text-amber-700" aria-live="polite">
                  {capsLock ? 'Caps Lock is on' : ''}
                </span>
                <button
                  type="button"
                  className="font-medium text-[#0B3D2E] hover:underline focus-visible:outline-none focus-visible:underline"
                  onClick={() => setShowResetHelp((v) => !v)}
                  aria-expanded={showResetHelp}
                >
                  Forgot password?
                </button>
              </div>
              {showResetHelp && (
                <p className="rounded-md bg-slate-50 px-2.5 py-2 text-[11px] leading-relaxed text-slate-600 ring-1 ring-slate-200">
                  Ask your school administrator to reset it from{' '}
                  <span className="font-medium text-slate-800">Users &amp; Roles</span>.
                </p>
              )}
            </div>

            <div aria-live="assertive">
              {errorMessage ? (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs text-rose-700"
                >
                  <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  <span>{errorMessage}</span>
                </div>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#0B3D2E] text-sm font-semibold text-white transition hover:bg-[#093326] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0B3D2E]/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? (
                <>
                  <Spinner size="sm" color="white" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </>
              )}
            </button>
          </form>

          {ssoEnabled ? (
            <>
              <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-wider text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                or
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => window.location.assign(ssoStartUrl())}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-[#0B3D2E] transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0B3D2E]/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <KeyRound className="h-4 w-4" strokeWidth={2} />
                Sign in with Shengena
              </button>
            </>
          ) : null}

          <p className="mt-5 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
            New to Shengena?{' '}
            <button
              type="button"
              className="font-semibold text-[#0B3D2E] hover:underline"
              onClick={() => navigate('/register-school')}
            >
              Register your school
            </button>
          </p>
        </main>
      </div>

      <footer className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 pb-5 text-center text-xs text-white/50">
        <span>© {year} Shengena</span>
        <span aria-hidden="true">·</span>
        <button
          type="button"
          className="hover:text-white hover:underline"
          onClick={() => navigate('/privacy-policy')}
        >
          Privacy Policy
        </button>
      </footer>
    </div>
  )
}

export default Login
