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
  Progress,
} from '@heroui/react'
import { Plus, Upload, BookOpen } from 'lucide-react'

function CurriculumLessonPlanning() {
  const [activeTab, setActiveTab] = useState('lesson-plans')

  return (
    <div className="flex w-full flex-col">
      <Tabs
        aria-label="Curriculum Modules"
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
        <Tab key="lesson-plans" title="Lesson Plans">
          <Card className="mt-4 rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Lesson Plans</h3>
                <p className="text-sm text-slate-500">Upload and manage weekly teaching plans</p>
              </div>
              <Button color="primary" startContent={<Upload className="h-4 w-4" />} className="bg-[#12544f]">
                Upload Plan
              </Button>
            </CardHeader>
            <CardBody>
              <Table aria-label="Lesson Plans Table" shadow="none">
                <TableHeader>
                  <TableColumn>WEEK</TableColumn>
                  <TableColumn>SUBJECT</TableColumn>
                  <TableColumn>CLASS</TableColumn>
                  <TableColumn>TOPIC</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No lesson plans uploaded.">
                  {[]}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="syllabus-tracking" title="Syllabus Tracking">
          <Card className="mt-4 rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Syllabus Tracking</h3>
                <p className="text-sm text-slate-500">Monitor curriculum coverage</p>
              </div>
              <Select className="w-40" placeholder="Select Subject" size="sm">
                <SelectItem key="math">Mathematics</SelectItem>
                <SelectItem key="eng">English</SelectItem>
              </Select>
            </CardHeader>
            <CardBody>
               <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Mathematics - Standard I</span>
                      <span className="text-slate-500">45%</span>
                    </div>
                    <Progress value={45} color="primary" className="h-2" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between">
                      <span className="font-medium">English - Standard I</span>
                      <span className="text-slate-500">60%</span>
                    </div>
                    <Progress value={60} color="success" className="h-2" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Science - Standard I</span>
                      <span className="text-slate-500">30%</span>
                    </div>
                    <Progress value={30} color="warning" className="h-2" />
                  </div>
               </div>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  )
}

export default CurriculumLessonPlanning