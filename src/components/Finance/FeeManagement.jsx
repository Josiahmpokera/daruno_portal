import { useState } from 'react'
import {
  Tabs,
  Tab,
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@heroui/react'
import { Plus, Filter, Download, Mail } from 'lucide-react'

function FeeManagement() {
  const [activeTab, setActiveTab] = useState('structures')
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  return (
    <div className="flex w-full flex-col">
      <Tabs
        aria-label="Fee Management Modules"
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
        <Tab key="structures" title="Fee Structures">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Fee Structures</h3>
                <p className="text-sm text-slate-500">Define fees for different grades and categories</p>
              </div>
              <Button color="primary" startContent={<Plus className="h-4 w-4" />} className="bg-[#d41f1f]" onPress={onOpen}>
                Add Fee Structure
              </Button>
            </CardHeader>
            <CardBody>
              <Table aria-label="Fee Structures Table" shadow="none">
                <TableHeader>
                  <TableColumn>NAME</TableColumn>
                  <TableColumn>GRADE/CATEGORY</TableColumn>
                  <TableColumn>AMOUNT</TableColumn>
                  <TableColumn>FREQUENCY</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No fee structures defined yet.">
                  {[]}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="invoices" title="Invoices">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Invoices</h3>
                <p className="text-sm text-slate-500">Manage and generate student invoices</p>
              </div>
              <div className="flex gap-2">
                <Button variant="bordered" startContent={<Filter className="h-4 w-4" />}>
                  Filter
                </Button>
                <Button color="primary" startContent={<Plus className="h-4 w-4" />} className="bg-[#d41f1f]">
                  Generate Invoices
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              <Table aria-label="Invoices Table" shadow="none">
                <TableHeader>
                  <TableColumn>INVOICE #</TableColumn>
                  <TableColumn>STUDENT</TableColumn>
                  <TableColumn>DATE</TableColumn>
                  <TableColumn>DUE DATE</TableColumn>
                  <TableColumn>AMOUNT</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No invoices found.">
                  {[]}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="payments" title="Payments">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Payment History</h3>
                <p className="text-sm text-slate-500">Track all received payments</p>
              </div>
              <Button variant="bordered" startContent={<Download className="h-4 w-4" />}>
                Export Report
              </Button>
            </CardHeader>
            <CardBody>
              <Table aria-label="Payments Table" shadow="none">
                <TableHeader>
                  <TableColumn>RECEIPT #</TableColumn>
                  <TableColumn>STUDENT</TableColumn>
                  <TableColumn>DATE</TableColumn>
                  <TableColumn>METHOD</TableColumn>
                  <TableColumn>AMOUNT</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No payments recorded.">
                  {[]}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="scholarships" title="Scholarships & Discounts">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Scholarships & Discounts</h3>
                <p className="text-sm text-slate-500">Manage financial aid and fee waivers</p>
              </div>
              <Button color="primary" startContent={<Plus className="h-4 w-4" />} className="bg-[#d41f1f]">
                Add Scholarship
              </Button>
            </CardHeader>
            <CardBody>
               <Table aria-label="Scholarships Table" shadow="none">
                <TableHeader>
                  <TableColumn>NAME</TableColumn>
                  <TableColumn>TYPE</TableColumn>
                  <TableColumn>VALUE</TableColumn>
                  <TableColumn>CRITERIA</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No scholarships defined.">
                  {[]}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="reminders" title="Reminders">
           <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Debt Collection & Reminders</h3>
                <p className="text-sm text-slate-500">Automate reminders for overdue fees</p>
              </div>
              <Button color="primary" startContent={<Mail className="h-4 w-4" />} className="bg-[#d41f1f]">
                Send Reminders
              </Button>
            </CardHeader>
            <CardBody>
               <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-red-50 border-red-100 shadow-none">
                          <CardBody>
                              <p className="text-sm text-red-600 font-medium">Overdue Amount</p>
                              <h4 className="text-2xl font-bold text-red-700">$0.00</h4>
                          </CardBody>
                      </Card>
                       <Card className="bg-orange-50 border-orange-100 shadow-none">
                          <CardBody>
                              <p className="text-sm text-orange-600 font-medium">Overdue Accounts</p>
                              <h4 className="text-2xl font-bold text-orange-700">0</h4>
                          </CardBody>
                      </Card>
                  </div>
                   <Table aria-label="Overdue Accounts Table" shadow="none">
                    <TableHeader>
                      <TableColumn>STUDENT</TableColumn>
                      <TableColumn>CLASS</TableColumn>
                      <TableColumn>PARENT</TableColumn>
                      <TableColumn>OVERDUE AMOUNT</TableColumn>
                      <TableColumn>DAYS OVERDUE</TableColumn>
                      <TableColumn>LAST REMINDER</TableColumn>
                    </TableHeader>
                    <TableBody emptyContent="No overdue accounts.">
                      {[]}
                    </TableBody>
                  </Table>
               </div>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Add Fee Structure</ModalHeader>
              <ModalBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Fee Name" placeholder="e.g. Tuition Fee" variant="bordered" />
                  <Input label="Amount" placeholder="0.00" type="number" startContent="$" variant="bordered" />
                  <Select label="Frequency" placeholder="Select frequency" variant="bordered">
                    <SelectItem key="monthly">Monthly</SelectItem>
                    <SelectItem key="termly">Termly</SelectItem>
                    <SelectItem key="annually">Annually</SelectItem>
                    <SelectItem key="one-time">One-time</SelectItem>
                  </Select>
                  <Select label="Applicable Grade" placeholder="Select grade" variant="bordered">
                    <SelectItem key="grade-1">Grade 1</SelectItem>
                    <SelectItem key="grade-2">Grade 2</SelectItem>
                    <SelectItem key="grade-3">Grade 3</SelectItem>
                    <SelectItem key="all">All Grades</SelectItem>
                  </Select>
                  <div className="col-span-1 md:col-span-2">
                     <Textarea label="Description" placeholder="Enter description" variant="bordered" />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" className="bg-[#d41f1f]" onPress={onClose}>
                  Save Structure
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}

export default FeeManagement
