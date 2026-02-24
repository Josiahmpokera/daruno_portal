import { useState } from 'react'
import {
  Tabs,
  Tab,
  Card,
  CardHeader,
  CardBody,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react'
import { BarChart3, FileText, Download } from 'lucide-react'

function FinancialReporting() {
  const [activeTab, setActiveTab] = useState('statements')

  return (
    <div className="flex w-full flex-col">
      <Tabs
        aria-label="Reporting Modules"
        selectedKey={activeTab}
        onSelectionChange={setActiveTab}
        color="primary"
        variant="underlined"
        classNames={{
          tabList: 'gap-6 w-full relative rounded-none p-0 border-b border-divider',
          cursor: 'w-full bg-[#d41f1f]',
          tab: 'max-w-fit px-0 h-12',
          tabContent: 'group-data-[selected=true]:text-[#d41f1f]',
        }}
      >
        <Tab key="statements" title="Financial Statements">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Financial Statements</h3>
                <p className="text-sm text-slate-500">Balance Sheets, Profit & Loss, Trial Balances</p>
              </div>
              <Button color="primary" startContent={<Download className="h-4 w-4" />} className="bg-[#d41f1f]">
                Download Report
              </Button>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 border rounded-lg hover:border-[#d41f1f] cursor-pointer transition-colors">
                      <FileText className="h-8 w-8 text-slate-400 mb-2" />
                      <h4 className="font-semibold">Balance Sheet</h4>
                      <p className="text-sm text-slate-500">Assets, liabilities, and equity.</p>
                  </div>
                  <div className="p-6 border rounded-lg hover:border-[#d41f1f] cursor-pointer transition-colors">
                      <FileText className="h-8 w-8 text-slate-400 mb-2" />
                      <h4 className="font-semibold">Profit & Loss</h4>
                      <p className="text-sm text-slate-500">Revenues, costs, and expenses.</p>
                  </div>
                   <div className="p-6 border rounded-lg hover:border-[#d41f1f] cursor-pointer transition-colors">
                      <FileText className="h-8 w-8 text-slate-400 mb-2" />
                      <h4 className="font-semibold">Trial Balance</h4>
                      <p className="text-sm text-slate-500">Closing balances of ledgers.</p>
                  </div>
              </div>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="dashboards" title="Real-Time Dashboards">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader>
               <div>
                <h3 className="text-lg font-semibold">Financial Dashboards</h3>
                <p className="text-sm text-slate-500">Visual snapshots of cash flow and trends</p>
              </div>
            </CardHeader>
            <CardBody>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg">
                  <div className="text-center text-slate-400">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                      <p>Charts and graphs will be displayed here</p>
                  </div>
              </div>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="audit" title="Audit Trails">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Audit Trails</h3>
                <p className="text-sm text-slate-500">Timestamped logs of every transaction</p>
              </div>
               <Button variant="bordered" startContent={<Download className="h-4 w-4" />}>
                Export Logs
              </Button>
            </CardHeader>
            <CardBody>
              <Table aria-label="Audit Logs Table" shadow="none">
                <TableHeader>
                  <TableColumn>TIMESTAMP</TableColumn>
                  <TableColumn>USER</TableColumn>
                  <TableColumn>ACTION</TableColumn>
                  <TableColumn>MODULE</TableColumn>
                  <TableColumn>DETAILS</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No activity logs found.">
                  {[]}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  )
}

export default FinancialReporting
