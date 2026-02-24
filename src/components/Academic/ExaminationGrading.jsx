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
import { Plus, FileText, Calendar, Printer } from 'lucide-react'

function ExaminationGrading() {
  const [activeTab, setActiveTab] = useState('continuous-assessment')

  return (
    <div className="flex w-full flex-col">
      <Tabs
        aria-label="Exam Modules"
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
        <Tab key="continuous-assessment" title="Continuous Assessment (CA)">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Continuous Assessment</h3>
                <p className="text-sm text-slate-500">Record scores for tests and homework</p>
              </div>
              <Button color="primary" startContent={<Plus className="h-4 w-4" />} className="bg-[#d41f1f]">
                Record Scores
              </Button>
            </CardHeader>
            <CardBody>
              <Table aria-label="CA Table" shadow="none">
                <TableHeader>
                  <TableColumn>ASSESSMENT NAME</TableColumn>
                  <TableColumn>TYPE</TableColumn>
                  <TableColumn>CLASS</TableColumn>
                  <TableColumn>SUBJECT</TableColumn>
                  <TableColumn>DATE</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No assessments recorded.">
                  {[]}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="exam-scheduling" title="Exam Scheduling">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Exam Scheduling</h3>
                <p className="text-sm text-slate-500">Manage date sheets and room assignments</p>
              </div>
              <Button color="primary" startContent={<Plus className="h-4 w-4" />} className="bg-[#d41f1f]">
                Schedule Exam
              </Button>
            </CardHeader>
            <CardBody>
              <Table aria-label="Exam Schedule Table" shadow="none">
                <TableHeader>
                  <TableColumn>EXAM NAME</TableColumn>
                  <TableColumn>START DATE</TableColumn>
                  <TableColumn>END DATE</TableColumn>
                  <TableColumn>CLASSES</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No exams scheduled.">
                  {[]}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="report-cards" title="Report Card Generation">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Report Cards</h3>
                <p className="text-sm text-slate-500">Generate and print report cards</p>
              </div>
              <Button color="primary" startContent={<Printer className="h-4 w-4" />} className="bg-[#d41f1f]">
                Generate Reports
              </Button>
            </CardHeader>
            <CardBody>
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <FileText className="h-16 w-16 mb-4 opacity-50" />
                <p>Select an exam and class to generate report cards</p>
              </div>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  )
}

export default ExaminationGrading