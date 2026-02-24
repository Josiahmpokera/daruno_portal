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
import { Plus, Users, Calculator, FileText } from 'lucide-react'

function Payroll() {
  const [activeTab, setActiveTab] = useState('processing')

  return (
    <div className="flex w-full flex-col">
      <Tabs
        aria-label="Payroll Modules"
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
        <Tab key="processing" title="Salary Processing">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Salary Processing</h3>
                <p className="text-sm text-slate-500">Calculate gross and net pay based on attendance</p>
              </div>
              <Button color="primary" startContent={<Calculator className="h-4 w-4" />} className="bg-[#d41f1f]">
                Process Payroll
              </Button>
            </CardHeader>
            <CardBody>
              <Table aria-label="Payroll Processing Table" shadow="none">
                <TableHeader>
                  <TableColumn>EMPLOYEE</TableColumn>
                  <TableColumn>ROLE</TableColumn>
                  <TableColumn>BASIC PAY</TableColumn>
                  <TableColumn>ALLOWANCES</TableColumn>
                  <TableColumn>DEDUCTIONS</TableColumn>
                  <TableColumn>NET PAY</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No payroll records for this month.">
                  {[]}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="deductions" title="Deductions & Compliance">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Tax & Compliance</h3>
                <p className="text-sm text-slate-500">Manage VAT/GST, PF, and social insurance</p>
              </div>
              <Button variant="bordered" startContent={<Plus className="h-4 w-4" />}>
                Add Rule
              </Button>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-slate-700">Tax Settings</h4>
                      <p className="text-sm text-slate-500 mt-1">Configure income tax slabs and rates.</p>
                  </div>
                   <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-slate-700">Social Security / PF</h4>
                      <p className="text-sm text-slate-500 mt-1">Set up provident fund contributions.</p>
                  </div>
              </div>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="payslips" title="Payslips">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Payslip Generation</h3>
                <p className="text-sm text-slate-500">Distribute digital payslips to employees</p>
              </div>
              <Button variant="bordered" startContent={<FileText className="h-4 w-4" />}>
                Generate Batch
              </Button>
            </CardHeader>
            <CardBody>
              <Table aria-label="Payslips Table" shadow="none">
                <TableHeader>
                  <TableColumn>MONTH</TableColumn>
                  <TableColumn>EMPLOYEE</TableColumn>
                  <TableColumn>GENERATED ON</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No payslips generated.">
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

export default Payroll
