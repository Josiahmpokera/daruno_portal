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
import { Plus, FileText, Upload } from 'lucide-react'

function Accounting() {
  const [activeTab, setActiveTab] = useState('chart')

  return (
    <div className="flex w-full flex-col">
      <Tabs
        aria-label="Accounting Modules"
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
        <Tab key="chart" title="Chart of Accounts">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Chart of Accounts</h3>
                <p className="text-sm text-slate-500">Categorize financial transactions</p>
              </div>
              <Button color="primary" startContent={<Plus className="h-4 w-4" />} className="bg-[#d41f1f]">
                Add Account
              </Button>
            </CardHeader>
            <CardBody>
              <Table aria-label="Chart of Accounts Table" shadow="none">
                <TableHeader>
                  <TableColumn>CODE</TableColumn>
                  <TableColumn>ACCOUNT NAME</TableColumn>
                  <TableColumn>TYPE</TableColumn>
                  <TableColumn>BALANCE</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No accounts found.">
                  {[]}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="vouchers" title="Vouchers">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Voucher Management</h3>
                <p className="text-sm text-slate-500">Journal, contra, debit, and credit vouchers</p>
              </div>
              <Button color="primary" startContent={<Plus className="h-4 w-4" />} className="bg-[#d41f1f]">
                Create Voucher
              </Button>
            </CardHeader>
            <CardBody>
               <Table aria-label="Vouchers Table" shadow="none">
                <TableHeader>
                  <TableColumn>VOUCHER #</TableColumn>
                  <TableColumn>DATE</TableColumn>
                  <TableColumn>TYPE</TableColumn>
                  <TableColumn>DESCRIPTION</TableColumn>
                  <TableColumn>AMOUNT</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No vouchers recorded.">
                  {[]}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="payables" title="Payables & Receivables">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Accounts Payable & Receivable</h3>
                <p className="text-sm text-slate-500">Track debts and owed money</p>
              </div>
              <div className="flex gap-2">
                 <Button variant="bordered">Record Expense</Button>
                 <Button variant="bordered">Record Income</Button>
              </div>
            </CardHeader>
            <CardBody>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                       <h4 className="font-semibold mb-2">Payables (To Suppliers)</h4>
                       <Table aria-label="Payables Table" shadow="none">
                        <TableHeader>
                          <TableColumn>SUPPLIER</TableColumn>
                          <TableColumn>DUE DATE</TableColumn>
                          <TableColumn>AMOUNT</TableColumn>
                        </TableHeader>
                        <TableBody emptyContent="No payables.">
                          {[]}
                        </TableBody>
                      </Table>
                   </div>
                   <div>
                       <h4 className="font-semibold mb-2">Receivables (From Others)</h4>
                       <Table aria-label="Receivables Table" shadow="none">
                        <TableHeader>
                          <TableColumn>ENTITY</TableColumn>
                          <TableColumn>DUE DATE</TableColumn>
                          <TableColumn>AMOUNT</TableColumn>
                        </TableHeader>
                        <TableBody emptyContent="No receivables.">
                          {[]}
                        </TableBody>
                      </Table>
                   </div>
               </div>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="reconciliation" title="Bank Reconciliation">
           <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Bank Reconciliation</h3>
                <p className="text-sm text-slate-500">Match system records with bank statements</p>
              </div>
              <Button variant="bordered" startContent={<Upload className="h-4 w-4" />}>
                Upload Statement
              </Button>
            </CardHeader>
            <CardBody>
              <div className="text-center py-8 text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>Upload a bank statement to start reconciliation</p>
              </div>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  )
}

export default Accounting
