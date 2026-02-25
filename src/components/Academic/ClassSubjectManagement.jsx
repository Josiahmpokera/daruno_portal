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
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
  Switch,
  Divider,
} from '@heroui/react'
import { Plus, BookOpen, Users, UserCheck, Calendar, Check, X } from 'lucide-react'

// Mock Data
const initialAcademicYears = [
  { id: 1, name: '2024/2025', start_date: '2024-09-01', end_date: '2025-07-31', is_active: true },
  { id: 2, name: '2023/2024', start_date: '2023-09-01', end_date: '2024-07-31', is_active: false },
]

const initialTerms = [
  { id: 1, academic_year_id: 1, name: 'Term 1', start_date: '2024-09-01', end_date: '2024-12-15' },
  { id: 2, academic_year_id: 1, name: 'Term 2', start_date: '2025-01-06', end_date: '2025-04-10' },
  { id: 3, academic_year_id: 1, name: 'Term 3', start_date: '2025-04-28', end_date: '2025-07-31' },
]

const initialClasses = [
  { id: 1, name: 'Grade 5', section: 'A', teacher: 'Mrs. Sarah Jones', students_count: 28, academic_year: '2024/2025' },
  { id: 2, name: 'Grade 6', section: 'B', teacher: 'Mr. David Smith', students_count: 30, academic_year: '2024/2025' },
]

function ClassSubjectManagement() {
  const [activeTab, setActiveTab] = useState('academic-setup')
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [modalType, setModalType] = useState('') // 'class', 'year', 'term'

  const handleOpenModal = (type) => {
    setModalType(type)
    onOpen()
  }

  return (
    <div className="flex w-full flex-col">
      <Tabs
        aria-label="Class & Subject Modules"
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
        <Tab key="academic-setup" title="Academic Setup">
          <div className="flex flex-col gap-4 mt-4">
            {/* Academic Years */}
            <Card className="border border-slate-200 shadow-none">
              <CardHeader className="flex justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Academic Years</h3>
                  <p className="text-sm text-slate-500">Manage academic sessions</p>
                </div>
                <Button color="primary" startContent={<Plus className="h-4 w-4" />} className="bg-[#d41f1f]" onPress={() => handleOpenModal('year')}>
                  Add Year
                </Button>
              </CardHeader>
              <CardBody>
                <Table aria-label="Academic Years Table" shadow="none">
                  <TableHeader>
                    <TableColumn>NAME</TableColumn>
                    <TableColumn>START DATE</TableColumn>
                    <TableColumn>END DATE</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody items={initialAcademicYears}>
                    {(item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.start_date}</TableCell>
                        <TableCell>{item.end_date}</TableCell>
                        <TableCell>
                          <Chip color={item.is_active ? "success" : "default"} size="sm" variant="flat">
                            {item.is_active ? "Active" : "Archived"}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <Button isIconOnly size="sm" variant="light">
                            <Calendar className="h-4 w-4 text-slate-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>

            {/* Terms / Quarters */}
            <Card className="border border-slate-200 shadow-none">
              <CardHeader className="flex justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Terms & Quarters</h3>
                  <p className="text-sm text-slate-500">Define terms for the active academic year</p>
                </div>
                <Button color="primary" startContent={<Plus className="h-4 w-4" />} className="bg-[#d41f1f]" onPress={() => handleOpenModal('term')}>
                  Add Term
                </Button>
              </CardHeader>
              <CardBody>
                <Table aria-label="Terms Table" shadow="none">
                  <TableHeader>
                    <TableColumn>TERM NAME</TableColumn>
                    <TableColumn>ACADEMIC YEAR</TableColumn>
                    <TableColumn>START DATE</TableColumn>
                    <TableColumn>END DATE</TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody items={initialTerms}>
                    {(item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>2024/2025</TableCell>
                        <TableCell>{item.start_date}</TableCell>
                        <TableCell>{item.end_date}</TableCell>
                        <TableCell>
                          <Button isIconOnly size="sm" variant="light">
                            <Calendar className="h-4 w-4 text-slate-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="classes" title="Class/Grade Allocation">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Class Allocation</h3>
                <p className="text-sm text-slate-500">Manage classes and student allocation</p>
              </div>
              <Button color="primary" startContent={<Plus className="h-4 w-4" />} className="bg-[#d41f1f]" onPress={() => handleOpenModal('class')}>
                Add Class
              </Button>
            </CardHeader>
            <CardBody>
              <Table aria-label="Classes Table" shadow="none">
                <TableHeader>
                  <TableColumn>CLASS NAME</TableColumn>
                  <TableColumn>SECTION</TableColumn>
                  <TableColumn>ACADEMIC YEAR</TableColumn>
                  <TableColumn>TEACHER</TableColumn>
                  <TableColumn>STUDENTS</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody items={initialClasses} emptyContent="No classes defined.">
                  {(item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.section}</TableCell>
                      <TableCell>{item.academic_year}</TableCell>
                      <TableCell>{item.teacher}</TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat">{item.students_count} Students</Chip>
                      </TableCell>
                      <TableCell>
                        <Button isIconOnly size="sm" variant="light">
                          <Users className="h-4 w-4 text-slate-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="subjects" title="Subject Mapping">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Subject Mapping</h3>
                <p className="text-sm text-slate-500">Assign subjects to classes</p>
              </div>
              <Button color="primary" startContent={<Plus className="h-4 w-4" />} className="bg-[#d41f1f]">
                Map Subject
              </Button>
            </CardHeader>
            <CardBody>
              <Table aria-label="Subjects Table" shadow="none">
                <TableHeader>
                  <TableColumn>SUBJECT</TableColumn>
                  <TableColumn>CODE</TableColumn>
                  <TableColumn>CLASSES</TableColumn>
                  <TableColumn>TYPE</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No subjects mapped.">
                  {[]}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="teachers" title="Teacher Assignment">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Teacher Assignment</h3>
                <p className="text-sm text-slate-500">Link teachers to subjects and classes</p>
              </div>
              <Button color="primary" startContent={<Plus className="h-4 w-4" />} className="bg-[#d41f1f]">
                Assign Teacher
              </Button>
            </CardHeader>
            <CardBody>
              <Table aria-label="Teacher Assignments Table" shadow="none">
                <TableHeader>
                  <TableColumn>TEACHER</TableColumn>
                  <TableColumn>SUBJECT</TableColumn>
                  <TableColumn>CLASS</TableColumn>
                  <TableColumn>HOURS/WEEK</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No assignments found.">
                  {[]}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {modalType === 'class' ? 'Add New Class' : 
                 modalType === 'year' ? 'Add Academic Year' : 'Add Term'}
              </ModalHeader>
              <ModalBody>
                {modalType === 'class' && (
                  <>
                    <Input label="Class Name" placeholder="e.g. Grade 5" variant="bordered" />
                    <Input label="Section" placeholder="e.g. A" variant="bordered" />
                    <Select label="Academic Year" placeholder="Select year" defaultSelectedKeys={['1']} variant="bordered">
                      <SelectItem key="1">2024/2025</SelectItem>
                      <SelectItem key="2">2023/2024</SelectItem>
                    </Select>
                    <Select label="Class Teacher" placeholder="Select teacher" variant="bordered">
                      <SelectItem key="t1">Teacher 1</SelectItem>
                      <SelectItem key="t2">Teacher 2</SelectItem>
                    </Select>
                  </>
                )}
                {modalType === 'year' && (
                  <>
                    <Input label="Name" placeholder="e.g. 2025/2026" variant="bordered" />
                    <Input type="date" label="Start Date" variant="bordered" labelPlacement="outside" />
                    <Input type="date" label="End Date" variant="bordered" labelPlacement="outside" />
                    <Switch defaultSelected color="success">Set as Active Year</Switch>
                  </>
                )}
                {modalType === 'term' && (
                  <>
                    <Select label="Academic Year" placeholder="Select year" defaultSelectedKeys={['1']} variant="bordered">
                      <SelectItem key="1">2024/2025</SelectItem>
                    </Select>
                    <Input label="Term Name" placeholder="e.g. Term 1" variant="bordered" />
                    <Input type="date" label="Start Date" variant="bordered" labelPlacement="outside" />
                    <Input type="date" label="End Date" variant="bordered" labelPlacement="outside" />
                  </>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" className="bg-[#d41f1f]" onPress={onClose}>
                  Save
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}

export default ClassSubjectManagement
