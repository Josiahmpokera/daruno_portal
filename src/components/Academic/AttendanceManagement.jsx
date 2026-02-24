import { useState } from 'react'
import {
  Tabs,
  Tab,
  Card,
  CardHeader,
  CardBody,
  Button,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Chip,
  Switch,
} from '@heroui/react'
import { Plus, Bell, CalendarCheck } from 'lucide-react'

function AttendanceManagement() {
  const [activeTab, setActiveTab] = useState('student-attendance')

  return (
    <div className="flex w-full flex-col">
      <Tabs
        aria-label="Attendance Modules"
        selectedKey={activeTab}
        onSelectionChange={setActiveTab}
        color="danger"
        variant="underlined"
        classNames={{
          tabList: 'gap-6 w-full relative rounded-none p-0 border-b border-divider',
          cursor: 'w-full bg-[#d41f1f]',
          tab: 'max-w-fit px-0 h-12',
          tabContent: 'group-data-[selected=true]:text-[#d41f1f]',
        }}
      >
        <Tab key="student-attendance" title="Student Attendance">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Student Attendance</h3>
                <p className="text-sm text-slate-500">Mark daily participation</p>
              </div>
              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                <Input type="date" className="w-full md:w-40" />
                <Select className="w-full md:w-40" placeholder="Select Class">
                  <SelectItem key="std1">Standard I</SelectItem>
                  <SelectItem key="std2">Standard II</SelectItem>
                </Select>
                <Button color="primary" className="bg-[#d41f1f]">
                  Mark Attendance
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              <Table aria-label="Attendance Table" shadow="none">
                <TableHeader>
                  <TableColumn>STUDENT NAME</TableColumn>
                  <TableColumn>ROLL NO</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>REMARKS</TableColumn>
                </TableHeader>
                <TableBody emptyContent="Select a class and date to view/mark attendance.">
                  {[]}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="automated-alerts" title="Automated Alerts">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Automated Alerts</h3>
                <p className="text-sm text-slate-500">SMS or push notifications for absence</p>
              </div>
              <Button color="primary" startContent={<Bell className="h-4 w-4" />} className="bg-[#d41f1f]">
                Configure Alerts
              </Button>
            </CardHeader>
            <CardBody>
               <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Absentee SMS Alert</h4>
                      <p className="text-sm text-slate-500">Send SMS to parents when student is marked absent</p>
                    </div>
                    <Switch defaultSelected color="danger" />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Late Arrival Notification</h4>
                      <p className="text-sm text-slate-500">Notify parents if student arrives late</p>
                    </div>
                    <Switch color="danger" />
                  </div>
               </div>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  )
}

export default AttendanceManagement