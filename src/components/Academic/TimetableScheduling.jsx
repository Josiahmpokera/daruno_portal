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
} from '@heroui/react'
import { Plus, Calendar, Clock } from 'lucide-react'

function TimetableScheduling() {
  const [activeTab, setActiveTab] = useState('class-timetables')

  return (
    <div className="flex w-full flex-col">
      <Tabs
        aria-label="Timetable Modules"
        selectedKey={activeTab}
        onSelectionChange={setActiveTab}
        color="primary"
        variant="underlined"
        classNames={{
          tabList: 'gap-6 w-full relative rounded-none p-0 border-b border-divider',
          cursor: 'w-full bg-[#12544f]',
          tab: 'max-w-fit px-0 h-12',
          tabContent: 'group-data-[selected=true]:text-[#12544f]',
        }}
      >
        <Tab key="class-timetables" title="Class Timetables">
          <Card className="mt-4 rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Class Timetables</h3>
                <p className="text-sm text-slate-500">Manage schedules for each grade</p>
              </div>
              <div className="flex gap-2">
                <Select className="w-40" placeholder="Select Class" size="sm">
                  <SelectItem key="std1">Standard I</SelectItem>
                  <SelectItem key="std2">Standard II</SelectItem>
                </Select>
                <Button color="primary" startContent={<Plus className="h-4 w-4" />} className="bg-[#12544f]">
                  Create Schedule
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Calendar className="h-16 w-16 mb-4 opacity-50" />
                <p>Select a class to view its timetable</p>
              </div>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="teacher-schedules" title="Teacher Schedules">
          <Card className="mt-4 rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Teacher Schedules</h3>
                <p className="text-sm text-slate-500">View staff teaching hours</p>
              </div>
              <Select className="w-40" placeholder="Select Teacher" size="sm">
                <SelectItem key="t1">Teacher 1</SelectItem>
                <SelectItem key="t2">Teacher 2</SelectItem>
              </Select>
            </CardHeader>
            <CardBody>
               <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Clock className="h-16 w-16 mb-4 opacity-50" />
                <p>Select a teacher to view their schedule</p>
              </div>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="resource-allocation" title="Resource Allocation">
          <Card className="mt-4 rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Resource Allocation</h3>
                <p className="text-sm text-slate-500">Track special rooms usage</p>
              </div>
              <Button color="primary" startContent={<Plus className="h-4 w-4" />} className="bg-[#12544f]">
                Book Resource
              </Button>
            </CardHeader>
            <CardBody>
              <Table aria-label="Resources Table" shadow="none">
                <TableHeader>
                  <TableColumn>RESOURCE</TableColumn>
                  <TableColumn>TYPE</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>CURRENT CLASS</TableColumn>
                  <TableColumn>NEXT FREE SLOT</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No resources allocated.">
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

export default TimetableScheduling