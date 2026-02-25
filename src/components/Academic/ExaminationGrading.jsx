import { useState } from 'react'
import {
  Tabs,
  Tab,
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Progress,
} from '@heroui/react'
import { Plus, FileText, Calendar, Printer, Settings, Award, CheckCircle, XCircle } from 'lucide-react'

// Mock Data
const assessments = [
  { id: 1, title: 'Math Homework 1', type: 'HOMEWORK', class: 'Grade 5 A', subject: 'Mathematics', date: '2024-09-10', total_marks: 20, weight: 10, status: 'completed' },
  { id: 2, title: 'Weekly Quiz 1', type: 'QUIZ', class: 'Grade 5 A', subject: 'Science', date: '2024-09-15', total_marks: 10, weight: 10, status: 'pending' },
  { id: 3, title: 'Mid-Term Exam', type: 'MID_TERM', class: 'Grade 6 B', subject: 'English', date: '2024-10-20', total_marks: 100, weight: 20, status: 'scheduled' },
]

const promotionList = [
  { id: 1, name: 'John Doe', class: 'Grade 5 A', final_average: 85.5, status: 'promoted', remarks: 'Excellent performance' },
  { id: 2, name: 'Jane Smith', class: 'Grade 5 A', final_average: 92.0, status: 'promoted', remarks: 'Outstanding' },
  { id: 3, name: 'Michael Brown', class: 'Grade 5 A', final_average: 45.0, status: 'retained', remarks: 'Needs improvement' },
]

function ExaminationGrading() {
  const [activeTab, setActiveTab] = useState('assessments')
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [modalType, setModalType] = useState('') // 'assessment', 'weight'

  const handleOpenModal = (type) => {
    setModalType(type)
    onOpen()
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'success'
      case 'pending': return 'warning'
      case 'scheduled': return 'primary'
      case 'promoted': return 'success'
      case 'retained': return 'danger'
      default: return 'default'
    }
  }

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
        <Tab key="assessments" title="Assessments">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Assessments</h3>
                <p className="text-sm text-slate-500">Manage homework, quizzes, and exams</p>
              </div>
              <Button color="primary" startContent={<Plus className="h-4 w-4" />} className="bg-[#d41f1f]" onPress={() => handleOpenModal('assessment')}>
                Create Assessment
              </Button>
            </CardHeader>
            <CardBody>
              <Table aria-label="Assessments Table" shadow="none">
                <TableHeader>
                  <TableColumn>TITLE</TableColumn>
                  <TableColumn>TYPE</TableColumn>
                  <TableColumn>CLASS & SUBJECT</TableColumn>
                  <TableColumn>DATE</TableColumn>
                  <TableColumn>WEIGHT</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody items={assessments}>
                  {(item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>
                        <Chip size="sm" variant="dot" color="primary">{item.type}</Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{item.subject}</span>
                          <span className="text-xs text-slate-500">{item.class}</span>
                        </div>
                      </TableCell>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>{item.weight}%</TableCell>
                      <TableCell>
                        <Chip color={getStatusColor(item.status)} size="sm" variant="flat" className="capitalize">
                          {item.status}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="light" className="text-primary">
                          Enter Marks
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="grading-config" title="Grading Configuration">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Assessment Weights</h3>
                <p className="text-sm text-slate-500">Configure weightage for final score calculation</p>
              </div>
              <Button variant="flat" startContent={<Settings className="h-4 w-4" />} onPress={() => handleOpenModal('weight')}>
                Default Settings
              </Button>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-medium">Primary Level Weights</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span>Homework</span><span>10%</span></div>
                    <Progress value={10} color="primary" className="h-2" />
                    <div className="flex justify-between text-sm"><span>Quizzes</span><span>10%</span></div>
                    <Progress value={10} color="primary" className="h-2" />
                    <div className="flex justify-between text-sm"><span>Weekly Tests</span><span>20%</span></div>
                    <Progress value={20} color="warning" className="h-2" />
                    <div className="flex justify-between text-sm"><span>Mid-Term</span><span>20%</span></div>
                    <Progress value={20} color="warning" className="h-2" />
                    <div className="flex justify-between text-sm"><span>Final Exam</span><span>40%</span></div>
                    <Progress value={40} color="danger" className="h-2" />
                  </div>
                  <Button size="sm" variant="bordered" className="w-full mt-2" onPress={() => handleOpenModal('weight')}>Edit Weights</Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="promotions" title="Promotions">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Student Promotions</h3>
                <p className="text-sm text-slate-500">Process end-of-year promotions based on final averages</p>
              </div>
              <div className="flex gap-2">
                <Select placeholder="Select Class" className="w-40" size="sm" defaultSelectedKeys={['g5a']}>
                  <SelectItem key="g5a">Grade 5 A</SelectItem>
                </Select>
                <Button color="primary" startContent={<Award className="h-4 w-4" />} className="bg-[#d41f1f]">
                  Process Promotion
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              <Table aria-label="Promotion Table" shadow="none">
                <TableHeader>
                  <TableColumn>STUDENT</TableColumn>
                  <TableColumn>CLASS</TableColumn>
                  <TableColumn>FINAL AVERAGE</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>REMARKS</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody items={promotionList}>
                  {(item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.class}</TableCell>
                      <TableCell>
                        <span className={`font-bold ${item.final_average >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.final_average}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Chip color={getStatusColor(item.status)} size="sm" variant="flat" className="capitalize">
                          {item.status}
                        </Chip>
                      </TableCell>
                      <TableCell>{item.remarks}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button isIconOnly size="sm" variant="light" color="success">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button isIconOnly size="sm" variant="light" color="danger">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="report-cards" title="Report Cards">
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

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {modalType === 'assessment' ? 'Create New Assessment' : 'Configure Weights'}
              </ModalHeader>
              <ModalBody>
                {modalType === 'assessment' && (
                  <>
                    <Input label="Assessment Title" placeholder="e.g. Math Quiz 1" variant="bordered" />
                    <Select label="Assessment Type" placeholder="Select type" variant="bordered">
                      <SelectItem key="homework">Homework</SelectItem>
                      <SelectItem key="quiz">Quiz</SelectItem>
                      <SelectItem key="weekly">Weekly Test</SelectItem>
                      <SelectItem key="midterm">Mid-Term Exam</SelectItem>
                      <SelectItem key="quarterly">Quarterly Exam</SelectItem>
                      <SelectItem key="annual">Annual Exam</SelectItem>
                      <SelectItem key="final">Final Exam</SelectItem>
                    </Select>
                    <div className="flex gap-4">
                      <Select label="Class" placeholder="Select class" className="flex-1" variant="bordered">
                        <SelectItem key="g5a">Grade 5 A</SelectItem>
                      </Select>
                      <Select label="Subject" placeholder="Select subject" className="flex-1" variant="bordered">
                        <SelectItem key="math">Mathematics</SelectItem>
                      </Select>
                    </div>
                    <div className="flex gap-4">
                      <Input type="date" label="Date" variant="bordered" labelPlacement="outside" className="flex-1" />
                      <Input type="number" label="Total Marks" placeholder="100" variant="bordered" className="flex-1" />
                    </div>
                    <Input type="number" label="Weight (%)" placeholder="e.g. 10" variant="bordered" description="Percentage contribution to final score" />
                  </>
                )}
                {modalType === 'weight' && (
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-slate-500">Configure default weights for Primary Level. Total must equal 100%.</p>
                    <div className="grid grid-cols-2 gap-4 items-center">
                      <Input label="Homework" placeholder="10" endContent="%" variant="bordered" defaultValue="10" />
                      <Input label="Quizzes" placeholder="10" endContent="%" variant="bordered" defaultValue="10" />
                      <Input label="Weekly Tests" placeholder="20" endContent="%" variant="bordered" defaultValue="20" />
                      <Input label="Mid-Term" placeholder="20" endContent="%" variant="bordered" defaultValue="20" />
                      <Input label="Final Exam" placeholder="40" endContent="%" variant="bordered" defaultValue="40" />
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-100 rounded">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-success">100%</span>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" className="bg-[#d41f1f]" onPress={onClose}>
                  {modalType === 'assessment' ? 'Save Assessment' : 'Save Weights'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}

export default ExaminationGrading
