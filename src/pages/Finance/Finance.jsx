import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Tabs, Tab } from '@heroui/react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import PageHeader from '../../components/Layout/PageHeader.jsx'
import FeeManagement from '../../components/Finance/FeeManagement'
import Accounting from '../../components/Finance/Accounting'
import Payroll from '../../components/Finance/Payroll'
import Budgeting from '../../components/Finance/Budgeting'
import AssetManagement from '../../components/Finance/AssetManagement'
import FinancialReporting from '../../components/Finance/FinancialReporting'

const VALID_TABS = [
  'fees',
  'accounting',
  'payroll',
  'budgeting',
  'assets',
  'reporting',
]

function Finance() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const activeTab = useMemo(() => {
    const tab = searchParams.get('tab') || 'fees'
    return VALID_TABS.includes(tab) ? tab : 'fees'
  }, [searchParams])

  const onTabChange = (key) => {
    navigate(`/finance?tab=${key}`, { replace: true })
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Finance"
          breadcrumbs={[
            { label: 'Money', href: '/finance' },
            { label: 'Finance' },
          ]}
          description="Manage fees, accounting, payroll, budgeting, and assets"
        />

        <div className="flex w-full flex-col">
          <Tabs
            aria-label="Finance Modules"
            selectedKey={activeTab}
            onSelectionChange={onTabChange}
            color="primary"
            classNames={{
              cursor: 'bg-[#0B3D2E]',
              tabContent: 'group-data-[selected=true]:text-white',
            }}
          >
            <Tab key="fees" title="Fee Management & Invoicing">
              <FeeManagement />
            </Tab>

            <Tab key="accounting" title="Accounting & General Ledger">
              <Accounting />
            </Tab>

            <Tab key="payroll" title="Payroll & HR Finance">
              <Payroll />
            </Tab>

            <Tab key="budgeting" title="Budgeting & Fund Management">
              <Budgeting />
            </Tab>

            <Tab key="assets" title="Asset & Inventory Management">
              <AssetManagement />
            </Tab>

            <Tab key="reporting" title="Reporting & Analytics">
              <FinancialReporting />
            </Tab>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Finance
