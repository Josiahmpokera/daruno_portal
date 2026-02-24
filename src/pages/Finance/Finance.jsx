import { useState } from 'react'
import {
  Tabs,
  Tab,
} from '@heroui/react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import FeeManagement from '../../components/Finance/FeeManagement'
import Accounting from '../../components/Finance/Accounting'
import Payroll from '../../components/Finance/Payroll'
import Budgeting from '../../components/Finance/Budgeting'
import AssetManagement from '../../components/Finance/AssetManagement'
import FinancialReporting from '../../components/Finance/FinancialReporting'

function Finance() {
  const [activeTab, setActiveTab] = useState('fees')

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-900">Finance</h1>
          <p className="text-sm text-slate-500">
            Manage fees, accounting, payroll, budgeting, and assets
          </p>
        </div>

        <div className="flex w-full flex-col">
          <Tabs
            aria-label="Finance Modules"
            selectedKey={activeTab}
            onSelectionChange={setActiveTab}
            color="danger"
            classNames={{
              cursor: "bg-[#d41f1f]",
              tabContent: "group-data-[selected=true]:text-white"
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
