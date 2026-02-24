import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Card, CardHeader, CardBody, Input } from '@heroui/react'
import { registerSchool, saveAuth } from '../../api/auth.js'
import logoDaruno from '../../assets/logo/daruno_red.png'

function RegisterSchool() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [schoolName, setSchoolName] = useState('')
  const [schoolCode, setSchoolCode] = useState('')
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')

  const registerMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        school_name: schoolName,
        school_code: schoolCode || undefined,
        admin_name: adminName,
        admin_email: adminEmail,
        admin_password: adminPassword,
      }
      const data = await registerSchool(payload)
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
    registerMutation.mutate()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="flex w-full max-w-5xl items-stretch rounded-xl bg-white shadow-md overflow-hidden">
        {/* Left Side - Branding */}
        <div className="hidden w-1/2 bg-gradient-to-br from-zinc-900 to-[#d41f1f] p-8 text-white md:flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Daruno Portal</h2>
            <p className="mt-1 text-sm text-white/90">School Registration</p>
          </div>
          <p className="text-xs text-white/70">
            Join thousands of schools managing their curriculum with Daruno.
          </p>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8">
          <Card className="border-none shadow-none">
            <CardHeader className="flex flex-col gap-1 px-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-full p-1 hover:bg-slate-100"
                  onClick={() => navigate('/')}
                >
                  <img src={logoDaruno} alt="Daruno logo" className="h-10 w-auto" />
                </button>
                <div>
                  <h1 className="text-xl font-semibold">Register School</h1>
                  <p className="text-xs text-slate-500">Create a new school account</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="px-0">
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-4">
                  <Input
                    variant="underlined"
                    label="School Name"
                    placeholder="Official name of your school"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    isRequired
                    classNames={{
                      inputWrapper: "after:bg-[#d41f1f]",
                    }}
                  />
                  
                  <Input
                    variant="underlined"
                    label="School Code (Optional)"
                    placeholder="Short code to identify your school"
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value)}
                    classNames={{
                      inputWrapper: "after:bg-[#d41f1f]",
                    }}
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      variant="underlined"
                      label="Admin Name"
                      placeholder="Your full name"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      isRequired
                      classNames={{
                        inputWrapper: "after:bg-[#d41f1f]",
                      }}
                    />
                    <Input
                      variant="underlined"
                      label="Admin Email"
                      placeholder="name@school.edu"
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      isRequired
                      classNames={{
                        inputWrapper: "after:bg-[#d41f1f]",
                      }}
                    />
                  </div>

                  <Input
                    variant="underlined"
                    label="Password"
                    placeholder="Create a strong password"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    isRequired
                    classNames={{
                      inputWrapper: "after:bg-[#d41f1f]",
                    }}
                  />
                </div>

                {registerMutation.isError && (
                  <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                    {registerMutation.error.body?.message || registerMutation.error.message}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4">
                  <Button
                    variant="light"
                    onPress={() => navigate('/login')}
                    className="font-medium text-zinc-600"
                  >
                    Back to Sign In
                  </Button>
                  <Button
                    type="submit"
                    color="primary"
                    className="bg-[#d41f1f] font-semibold text-white"
                    isLoading={registerMutation.isPending}
                  >
                    Register School
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

export default RegisterSchool
