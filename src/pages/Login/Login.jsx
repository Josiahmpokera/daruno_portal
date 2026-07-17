import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Button, Input } from '@heroui/react'
import ShengenaLogo from '../../components/Brand/ShengenaLogo.jsx'
import { useAuth } from '../../auth'
import { toastSuccess, toastError } from '../../components/Toast'

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState('identifier')

  const loginMutation = useMutation({
    mutationFn: async ({ email: loginEmail, password: loginPassword }) => {
      return login({
        email: loginEmail,
        password: loginPassword,
      })
    },
    onSuccess: (session) => {
      const role = session?.user?.role?.name
      const isPlatform =
        session?.audience === 'platform' || role === 'super_admin'
      const name = session?.user?.name || session?.user?.email || 'User'
      toastSuccess(
        'Welcome back',
        isPlatform
          ? `${name} — platform console`
          : `${name}${session?.school?.name ? ` · ${session.school.name}` : ''}`,
      )
      navigate(isPlatform ? '/platform' : '/dashboard', { replace: true })
    },
    onError: (err) => {
      toastError('Sign-in failed', err?.message || 'Check your email and password.')
    },
  })

  const onSubmit = (event) => {
    event.preventDefault()
    if (step === 'identifier') {
      if (!email.trim()) {
        return
      }
      setStep('password')
      return
    }

    loginMutation.mutate({ email, password })
  }

  const year = new Date().getFullYear()

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-8 overflow-hidden">
      {/* Page background texture (outside card) */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-slate-100" />
        {/* Soft brand glow */}
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[#0B3D2E]/[0.07] blur-3xl" />
        <div className="absolute -bottom-28 -right-20 h-96 w-96 rounded-full bg-zinc-900/[0.06] blur-3xl" />
        <div className="absolute top-1/3 right-1/4 h-64 w-64 rounded-full bg-[#0B3D2E]/[0.04] blur-3xl" />
        {/* Dot grid texture */}
        <div
          className="absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.45) 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        />
        {/* Fine diagonal hatch */}
        <div
          className="absolute inset-0 opacity-[0.2]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-12deg, transparent, transparent 11px, rgb(100 116 139 / 0.08) 11px, rgb(100 116 139 / 0.08) 12px)',
          }}
        />
      </div>

      <div className="relative flex w-full max-w-3xl items-stretch overflow-hidden rounded-xl border border-slate-200 bg-white">
        {/* Compact brand panel */}
        <div className="hidden w-[220px] shrink-0 bg-gradient-to-br from-zinc-900 to-[#0B3D2E] p-6 text-white md:flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold leading-snug">Shengena Portal</h2>
            <p className="mt-1.5 text-xs text-white/90 leading-relaxed">
              Sign in to continue
            </p>
          </div>
          <p className="text-[11px] text-white/70 leading-relaxed">
            Secure access for school admins, teachers, and staff.
          </p>
        </div>

        {/* Form takes remaining space — single column, shared left edge */}
        <div className="min-w-0 flex-1 flex items-center">
          <div className="w-full max-w-md mx-auto px-8 py-10 sm:px-10">
            <div className="flex flex-col items-start gap-6">
              <button
                type="button"
                className="-ml-1.5 inline-flex shrink-0 items-center transition-opacity hover:opacity-80"
                onClick={() => navigate('/')}
                aria-label="Go to home"
              >
              <ShengenaLogo
              variant="full"
              iconClassName=" w-32 object-contain"  // increased from h-9 to h-16
              wordClassName=" w-auto object-contain object-left"  // increased from h-7 to h-12
            />
              </button>

              <div className="w-full space-y-1">
                <h1 className="text-xl font-semibold leading-tight text-slate-900">
                  {step === 'identifier' ? 'Sign in' : 'Enter password'}
                </h1>
                <p className="text-sm leading-snug text-slate-500 break-all">
                  {step === 'identifier' ? 'to your Shengena account' : email}
                </p>
              </div>

              <form className="w-full space-y-5" onSubmit={onSubmit}>
                {step === 'identifier' && (
                  <>
                    <Input
                      radius="none"
                      variant="underlined"
                      size="lg"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email, phone, or Skype"
                      classNames={{
                        base: 'w-full',
                        mainWrapper: 'w-full',
                        inputWrapper: 'px-0 after:bg-[#0B3D2E]',
                        input: 'text-left',
                      }}
                      isRequired
                    />

                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span>No account?</span>
                      <button
                        type="button"
                        className="font-semibold text-[#0B3D2E] hover:underline"
                        onClick={() => navigate('/register-school')}
                      >
                        Create one!
                      </button>
                    </div>
                  </>
                )}

                {step === 'password' && (
                  <>
                    <Input
                      radius="none"
                      variant="underlined"
                      size="lg"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      classNames={{
                        base: 'w-full',
                        mainWrapper: 'w-full',
                        inputWrapper: 'px-0 after:bg-[#0B3D2E]',
                        input: 'text-left',
                      }}
                      isRequired
                      autoFocus
                    />
                    <div className="flex w-full items-center justify-between text-xs">
                      <button
                        type="button"
                        className="text-slate-500 hover:text-slate-700"
                        onClick={() => setStep('identifier')}
                      >
                        ← Back
                      </button>
                      <button type="button" className="text-[#0B3D2E] hover:underline">
                        Forgot password?
                      </button>
                    </div>
                  </>
                )}

                {loginMutation.isError ? (
                  <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {loginMutation.error?.message || 'Sign-in failed. Check your email and password.'}
                  </p>
                ) : null}

                <div className="flex w-full justify-end pt-1">
                  <Button
                    type="submit"
                    color="primary"
                    className="bg-[#0B3D2E] px-8 font-semibold text-white"
                    isLoading={loginMutation.isPending}
                  >
                    {step === 'identifier' ? 'Next' : 'Sign in'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <footer className="relative mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-xs text-slate-500">
        <span>© {year} Shengena. All rights reserved.</span>
        <span className="hidden text-slate-300 sm:inline" aria-hidden="true">
          ·
        </span>
        <button
          type="button"
          className="text-slate-500 hover:text-[#0B3D2E] hover:underline transition-colors"
          onClick={() => navigate('/privacy-policy')}
        >
          Privacy Policy
        </button>
      </footer>
    </div>
  )
}

export default Login
