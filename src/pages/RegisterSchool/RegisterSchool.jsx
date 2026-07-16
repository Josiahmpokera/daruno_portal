import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Button, Card, CardHeader, CardBody, Input } from '@heroui/react'
import { useAuth } from '../../auth'
import { toastSuccess, toastError } from '../../components/Toast'
import ShengenaLogo from '../../components/Brand/ShengenaLogo.jsx'
import EducationStagesPicker from '../../components/School/EducationStagesPicker.jsx'

function RegisterSchool() {
  const navigate = useNavigate()
  const { registerSchool } = useAuth()

  const [schoolName, setSchoolName] = useState('')
  const [schoolCode, setSchoolCode] = useState('')
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [educationStages, setEducationStages] = useState([])
  const [localError, setLocalError] = useState('')

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!educationStages.length) {
        throw new Error(
          'Select at least one education level (e.g. Primary, O-Level).',
        )
      }
      return registerSchool({
        school_name: schoolName,
        school_code: schoolCode || undefined,
        admin_name: adminName,
        admin_email: adminEmail,
        admin_password: adminPassword,
        education_stages: educationStages,
      })
    },
    onSuccess: (session) => {
      toastSuccess(
        'School registered',
        session?.school?.name
          ? `${session.school.name} is ready to use.`
          : 'Your school account is ready.',
      )
      navigate('/dashboard', { replace: true })
    },
    onError: (err) => {
      toastError('Registration failed', err?.message || 'Please try again.')
    },
  })

  const onSubmit = (event) => {
    event.preventDefault()
    setLocalError('')
    if (!educationStages.length) {
      setLocalError(
        'Select at least one education level your school operates.',
      )
      return
    }
    registerMutation.mutate()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="flex w-full max-w-5xl items-stretch rounded-xl bg-white shadow-md overflow-hidden">
        {/* Left Side - Branding */}
        <div className="hidden w-1/2 bg-gradient-to-br from-zinc-900 to-[#0B3D2E] p-8 text-white md:flex flex-col justify-between">
          <div>
            <ShengenaLogo
              variant="full"
              iconClassName="h-10 w-10 object-contain"
              wordClassName="h-7 w-auto object-contain brightness-0 invert"
            />
            <p className="mt-4 text-sm text-white/90">School Registration</p>
          </div>
          <p className="text-xs text-white/70">
            Join thousands of schools managing their curriculum with Shengena.
          </p>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8">
          <Card className="border-none shadow-none">
            <CardHeader className="flex flex-col gap-1 px-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-md p-1 hover:bg-slate-100"
                  onClick={() => navigate('/')}
                >
                  <ShengenaLogo
                    variant="full"
                    iconClassName="h-9 w-9 object-contain"
                    wordClassName="h-7 w-auto object-contain"
                  />
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
                      inputWrapper: "after:bg-[#0B3D2E]",
                    }}
                  />
                  
                  <Input
                    variant="underlined"
                    label="School Code (Optional)"
                    placeholder="Short code to identify your school"
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value)}
                    classNames={{
                      inputWrapper: "after:bg-[#0B3D2E]",
                    }}
                  />

                  <EducationStagesPicker
                    required
                    value={educationStages}
                    onChange={(next) => {
                      setEducationStages(next)
                      setLocalError('')
                    }}
                    hint="Choose every level you run (you may select more than one). This controls subjects, combinations, and class setup."
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
                        inputWrapper: "after:bg-[#0B3D2E]",
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
                        inputWrapper: "after:bg-[#0B3D2E]",
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
                      inputWrapper: "after:bg-[#0B3D2E]",
                    }}
                  />
                </div>

                {(localError || registerMutation.isError) && (
                  <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    {localError ||
                      registerMutation.error?.body?.message ||
                      registerMutation.error?.message}
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
                    className="bg-[#0B3D2E] font-semibold text-white"
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
