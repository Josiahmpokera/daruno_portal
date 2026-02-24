import { Button, Card, CardHeader, CardBody, CardFooter } from '@heroui/react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  UserCheck,
  BookOpen,
  BarChart3,
} from 'lucide-react'
import DashboardLayout from '../../components/Layout/DashboardLayout'

function Dashboard() {
  const navigate = useNavigate()

  const { data: session } = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: async () => null,
    initialData: null,
    enabled: false,
  })

  const school = session?.school || null

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-900">
            Overview
          </h1>
          <p className="text-sm text-slate-500">
            Overview of your Daruno school workspace
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border border-slate-200">
              <CardBody className="flex flex-row items-center justify-between p-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">Total Students</p>
                  <h3 className="text-2xl font-bold text-slate-900">0</h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Users className="h-5 w-5" />
                </div>
              </CardBody>
            </Card>
            <Card className="border border-slate-200">
              <CardBody className="flex flex-row items-center justify-between p-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">Total Teachers</p>
                  <h3 className="text-2xl font-bold text-slate-900">0</h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                  <UserCheck className="h-5 w-5" />
                </div>
              </CardBody>
            </Card>
            <Card className="border border-slate-200">
              <CardBody className="flex flex-row items-center justify-between p-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">Classes</p>
                  <h3 className="text-2xl font-bold text-slate-900">0</h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                  <BookOpen className="h-5 w-5" />
                </div>
              </CardBody>
            </Card>
            <Card className="border border-slate-200">
              <CardBody className="flex flex-row items-center justify-between p-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">Reports</p>
                  <h3 className="text-2xl font-bold text-slate-900">0</h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600">
                  <BarChart3 className="h-5 w-5" />
                </div>
              </CardBody>
            </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* School Summary */}
          <Card className="h-full border border-slate-200">
            <CardHeader className="flex flex-col items-start gap-1">
              <h2 className="text-lg font-semibold text-slate-900">School Summary</h2>
              <p className="text-xs text-slate-500">Key information for your school</p>
            </CardHeader>
            <CardBody className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">School Name</div>
                <div className="mt-1 text-base font-semibold text-slate-900">
                  {school?.name || 'Not linked to a school'}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">School Code</div>
                <div className="mt-1 text-base font-mono text-slate-900 bg-slate-100 w-fit px-2 py-0.5 rounded">
                  {school?.code || '—'}
                </div>
              </div>
            </CardBody>
            <CardFooter className="pt-0">
              <Button
                variant="bordered"
                size="sm"
                className="w-full sm:w-auto font-medium"
                onPress={() => navigate('/settings')}
              >
                Manage School Settings
              </Button>
            </CardFooter>
          </Card>

          {/* Quick Actions */}
          <Card className="h-full border border-slate-200">
            <CardHeader className="flex flex-col items-start gap-1">
              <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
              <p className="text-xs text-slate-500">Common tasks for school admins</p>
            </CardHeader>
            <CardBody>
              <div className="flex flex-wrap gap-3">
                <Button color="primary" size="sm" className="bg-[#d41f1f] font-medium">
                  Add Student
                </Button>
                <Button variant="bordered" size="sm" className="font-medium">
                  Add Teacher
                </Button>
                <Button variant="light" size="sm" className="font-medium">
                  View Timetable
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Checklist */}
        <Card className="border border-slate-200">
          <CardHeader className="flex flex-col items-start gap-1">
            <h2 className="text-lg font-semibold text-slate-900">Get Started Checklist</h2>
            <p className="text-xs text-slate-500">A simple path to set up your school</p>
          </CardHeader>
          <CardBody>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">✓</div>
                <div>
                  <div className="font-medium text-slate-900">Confirm your school details</div>
                  <p className="text-xs text-slate-500">Check name, code, and contact information</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">2</div>
                <div>
                  <div className="font-medium text-slate-900">Add staff and teachers</div>
                  <p className="text-xs text-slate-500">Invite your core team to the portal</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">3</div>
                <div>
                  <div className="font-medium text-slate-900">Set up classes and subjects</div>
                  <p className="text-xs text-slate-500">Define structure for the academic year</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">4</div>
                <div>
                  <div className="font-medium text-slate-900">Enroll students</div>
                  <p className="text-xs text-slate-500">Import or add students to classes</p>
                </div>
              </li>
            </ol>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  )
}


export default Dashboard
