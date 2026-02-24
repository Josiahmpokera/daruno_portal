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
  Textarea,
  Input,
} from '@heroui/react'
import { Plus, ClipboardList, Activity } from 'lucide-react'

function BehavioralSkillsAssessment() {
  const [activeTab, setActiveTab] = useState('behavioral-logs')

  return (
    <div className="flex w-full flex-col">
      <Tabs
        aria-label="Behavioral Modules"
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
        <Tab key="behavioral-logs" title="Behavioral Logs">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Behavioral Logs</h3>
                <p className="text-sm text-slate-500">Track conduct and discipline</p>
              </div>
              <Button color="primary" startContent={<Plus className="h-4 w-4" />} className="bg-[#d41f1f]">
                Add Log
              </Button>
            </CardHeader>
            <CardBody>
              <Table aria-label="Behavioral Logs Table" shadow="none">
                <TableHeader>
                  <TableColumn>STUDENT</TableColumn>
                  <TableColumn>DATE</TableColumn>
                  <TableColumn>CATEGORY</TableColumn>
                  <TableColumn>DESCRIPTION</TableColumn>
                  <TableColumn>RECORDED BY</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No behavioral logs recorded.">
                  {[]}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="3rs-tracking" title="3Rs Tracking">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">3Rs Tracking</h3>
                <p className="text-sm text-slate-500">Monitor Reading, Writing, and Arithmetic</p>
              </div>
              <div className="flex gap-2">
                <Select className="w-40" placeholder="Select Class" size="sm">
                  <SelectItem key="std1">Standard I</SelectItem>
                  <SelectItem key="std2">Standard II</SelectItem>
                </Select>
                <Button color="primary" startContent={<Activity className="h-4 w-4" />} className="bg-[#d41f1f]">
                  Update Progress
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              <Table aria-label="3Rs Tracking Table" shadow="none">
                <TableHeader>
                  <TableColumn>STUDENT</TableColumn>
                  <TableColumn>READING LEVEL</TableColumn>
                  <TableColumn>WRITING LEVEL</TableColumn>
                  <TableColumn>ARITHMETIC LEVEL</TableColumn>
                  <TableColumn>LAST ASSESSED</TableColumn>
                </TableHeader>
                <TableBody emptyContent="Select a class to view 3Rs progress.">
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

export default BehavioralSkillsAssessment