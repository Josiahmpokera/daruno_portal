import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Card, CardHeader, CardBody, Input } from '@heroui/react'
import logoDaruno from '../../assets/logo/daruno_red.png'
import { login, saveAuth } from '../../api/auth.js'

function Login() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState('identifier')

  const loginMutation = useMutation({
    mutationFn: async ({ email: loginEmail, password: loginPassword }) => {
      const payload = {
        email: loginEmail,
        password: loginPassword,
      }
      const data = await login(payload)
      return data
    },
    onSuccess: (data) => {
      saveAuth(data)
      queryClient.setQueryData(['auth', 'session'], data)
      navigate('/')
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

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="flex w-full max-w-5xl items-stretch rounded-xl bg-white shadow-md overflow-hidden">
        <div className="hidden w-1/2 bg-gradient-to-br from-zinc-900 to-[#d41f1f] p-8 text-white md:flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Daruno Portal</h2>
            <p className="mt-1 text-sm text-white/90">Sign in to continue</p>
          </div>
          <p className="text-xs text-white/70">
            Secure access for school admins, teachers, and staff.
          </p>
        </div>

        <div className="w-full md:w-1/2 p-8">
          <Card className="border-none shadow-none">
            <CardHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-full p-1 hover:bg-slate-100"
                  onClick={() => navigate('/')}
                >
                  <img src={logoDaruno} alt="Daruno logo" className="h-10 w-auto" />
                </button>
                <div>
                  <h1 className="text-xl font-semibold">
                    {step === 'identifier' ? 'Sign in' : 'Enter password'}
                  </h1>
                  <p className="text-xs text-slate-500">
                    {step === 'identifier' ? 'to your Daruno account' : email}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <form className="space-y-4" onSubmit={onSubmit}>
                {step === 'identifier' && (
                  <>
                    <div className="space-y-1">
                      <Input
                        radius="none"
                        variant="underlined"
                        size="lg"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email, phone, or Skype"
                        classNames={{
                          inputWrapper: "after:bg-[#d41f1f]",
                        }}
                        className="w-full"
                        isRequired
                      />
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span>No account?</span>
                      <button
                        type="button"
                        className="text-[#d41f1f] hover:underline font-semibold"
                        onClick={() => navigate('/register-school')}
                      >
                        Create one!
                      </button>
                    </div>
                  </>
                )}

                {step === 'password' && (
                  <>
                    <div className="space-y-1">
                      <Input
                        radius="none"
                        variant="underlined"
                        size="lg"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        classNames={{
                          inputWrapper: "after:bg-[#d41f1f]",
                        }}
                        className="w-full"
                        isRequired
                        autoFocus
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <button
                        type="button"
                        className="text-slate-500 hover:text-slate-700"
                        onClick={() => setStep('identifier')}
                      >
                        ← Back
                      </button>
                      <button type="button" className="text-[#d41f1f] hover:underline">
                        Forgot password?
                      </button>
                    </div>
                  </>
                )}

                <div className="pt-4 flex justify-end">
                  <Button
                    type="submit"
                    color="primary"
                    className="bg-[#d41f1f] px-8 font-semibold text-white"
                    isLoading={loginMutation.isPending}
                  >
                    {step === 'identifier' ? 'Next' : 'Sign in'}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Login
