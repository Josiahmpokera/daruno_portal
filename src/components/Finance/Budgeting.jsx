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
  Progress,
} from '@heroui/react'
import { Plus, PieChart, Wallet } from 'lucide-react'

function Budgeting() {
  const [activeTab, setActiveTab] = useState('budgets')

  return (
    <div className="flex w-full flex-col">
      <Tabs
        aria-label="Budgeting Modules"
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
        <Tab key="budgets" title="Budget Allocation">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Budget Allocation</h3>
                <p className="text-sm text-slate-500">Annual or term-wise budgets for departments</p>
              </div>
              <Button color="primary" startContent={<Plus className="h-4 w-4" />} className="bg-[#d41f1f]">
                Create Budget
              </Button>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                 <div className="p-4 border rounded-lg">
                     <div className="flex justify-between mb-2">
                         <span className="font-medium">Science Department</span>
                         <span className="text-slate-500">$5,000 / $10,000</span>
                     </div>
                     <Progress value={50} color="primary" className="h-2" classNames={{ indicator: "bg-[#d41f1f]" }} />
                 </div>
                 <div className="p-4 border rounded-lg">
                     <div className="flex justify-between mb-2">
                         <span className="font-medium">Sports & Activities</span>
                         <span className="text-slate-500">$8,200 / $15,000</span>
                     </div>
                     <Progress value={54} color="primary" className="h-2" classNames={{ indicator: "bg-[#d41f1f]" }} />
                 </div>
              </div>
              <Table aria-label="Budgets Table" shadow="none">
                <TableHeader>
                  <TableColumn>DEPARTMENT</TableColumn>
                  <TableColumn>ALLOCATED</TableColumn>
                  <TableColumn>SPENT</TableColumn>
                  <TableColumn>REMAINING</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No active budgets.">
                  {[]}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="grants" title="Grants & Donations">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Grant & Donation Tracking</h3>
                <p className="text-sm text-slate-500">Track usage of specialized funds</p>
              </div>
              <Button variant="bordered" startContent={<Plus className="h-4 w-4" />}>
                Log Donation
              </Button>
            </CardHeader>
            <CardBody>
               <Table aria-label="Grants Table" shadow="none">
                <TableHeader>
                  <TableColumn>SOURCE</TableColumn>
                  <TableColumn>TYPE</TableColumn>
                  <TableColumn>AMOUNT</TableColumn>
                  <TableColumn>RESTRICTIONS</TableColumn>
                  <TableColumn>DATE RECEIVED</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No grants recorded.">
                  {[]}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="expenses" title="Expense Tracking">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Operational Expenses</h3>
                <p className="text-sm text-slate-500">Monitor daily operational costs</p>
              </div>
               <Button variant="bordered" startContent={<Plus className="h-4 w-4" />}>
                Add Expense
              </Button>
            </CardHeader>
            <CardBody>
              <Table aria-label="Expenses Table" shadow="none">
                <TableHeader>
                  <TableColumn>CATEGORY</TableColumn>
                  <TableColumn>DESCRIPTION</TableColumn>
                  <TableColumn>AMOUNT</TableColumn>
                  <TableColumn>DATE</TableColumn>
                  <TableColumn>APPROVED BY</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No recent expenses.">
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

export default Budgeting
