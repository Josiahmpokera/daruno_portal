import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Card,
  CardBody,
  CardHeader,
} from '@heroui/react'
import { BarChart3, FileText, TrendingUp, Users } from 'lucide-react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import PageHeader from '../../components/Layout/PageHeader.jsx'
import ModulePlaceholder from '../../components/Layout/ModulePlaceholder'

const sectionMeta = {
  '/reports': {
    title: 'Reports',
    description: 'School-wide analytics and exportable reports',
  },
  '/reports/attendance': {
    title: 'Attendance Report',
    description: 'Student and class attendance summaries',
  },
  '/reports/exams': {
    title: 'Exam Results',
    description: 'Assessment performance across classes',
  },
  '/reports/fees': {
    title: 'Fee Collection',
    description: 'Invoice and payment collection reports',
  },
  '/reports/payroll': {
    title: 'Payroll Summary',
    description: 'Staff payroll runs and totals',
  },
  '/reports/custom': {
    title: 'Custom Reports',
    description: 'Build and save your own report views',
  },
}

const overviewCards = [
  {
    title: 'Academic',
    desc: 'Attendance, exams, and progress',
    icon: Users,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    title: 'Finance',
    desc: 'Fees, payroll, and cash flow',
    icon: TrendingUp,
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    title: 'Operations',
    desc: 'Staff, inventory, and transport',
    icon: FileText,
    color: 'bg-orange-50 text-orange-600',
  },
  {
    title: 'Custom',
    desc: 'Compose your own datasets',
    icon: BarChart3,
    color: 'bg-purple-50 text-purple-600',
  },
]

function Reports() {
  const location = useLocation()
  const meta = useMemo(
    () =>
      sectionMeta[location.pathname] || {
        title: 'Reports',
        description: 'Analytics and reports',
      },
    [location.pathname],
  )

  const isOverview = location.pathname === '/reports'

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title={meta.title}
          breadcrumbs={[
            { label: 'Reports', href: '/reports' },
            { label: meta.title },
          ]}
          description={meta.description}
        />

        {isOverview ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {overviewCards.map((card) => {
              const Icon = card.icon
              return (
                <Card key={card.title} className="border border-slate-200 shadow-none">
                  <CardHeader className="flex flex-row items-start justify-between gap-2 p-4 pb-2">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {card.title}
                      </h3>
                      <p className="text-xs text-slate-500">{card.desc}</p>
                    </div>
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${card.color}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardBody className="px-4 pb-4 pt-0">
                    <p className="text-xs text-slate-400">
                      Use the sidebar to open a detailed report.
                    </p>
                  </CardBody>
                </Card>
              )
            })}
          </div>
        ) : (
          <ModulePlaceholder
            title={meta.title}
            description={meta.description}
            wrapLayout={false}
            showHeader={false}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

export default Reports
