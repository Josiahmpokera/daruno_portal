import { useState } from 'react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
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
  Avatar,
  AvatarGroup,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react'
import {
  Plus,
  Search,
  MoreVertical,
  Users,
  BookOpen,
  GraduationCap,
  Calendar,
  Filter,
  ArrowRightLeft,
  UserPlus,
} from 'lucide-react'

// Mock Data
const academicYears = [
  { id: 1, name: '2024/2025', status: 'active' },
  { id: 2, name: '2023/2024', status: 'archived' },
]

const educationalLevels = [
  { id: 1, name: 'Primary' },
  { id: 2, name: 'Secondary' },
]

const initialClasses = [
  { id: 1, name: 'Grade 1 A', level: 'Primary', academic_year: '2024/2025', teacher: 'Mrs. Sarah Jones', students: 25, subjects: 8, status: 'active' },
  { id: 2, name: 'Grade 1 B', level: 'Primary', academic_year: '2024/2025', teacher: 'Mr. David Smith', students: 24, subjects: 8, status: 'active' },
  { id: 3, name: 'Grade 5 A', level: 'Primary', academic_year: '2024/2025', teacher: 'Ms. Emily White', students: 30, subjects: 10, status: 'active' },
]

function Classes() {
  const [selectedYear, setSelectedYear] = useState('2024/2025')
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [modalType, setModalType] = useState('') // 'create', 'enroll', 'transfer', 'subjects'
  const [selectedClass, setSelectedClass] = useState(null)

  const handleOpenModal = (type, classItem = null) => {
    setModalType(type)
    setSelectedClass(classItem)
    onOpen()
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Classes Management</h1>
            <p className="text-slate-500">Manage academic classes, student enrollments, and subject allocations.</p>
          </div>
          <div className="flex items-center gap-3">
            <Select 
              className="w-40" 
              defaultSelectedKeys={['2024/2025']} 
              size="sm" 
              variant="bordered"
              startContent={<Calendar className="h-4 w-4 text-slate-500" />}
            >
              {academicYears.map((year) => (
                <SelectItem key={year.name} value={year.name}>
                  {year.name}
                </SelectItem>
              ))}
            </Select>
            <Button color="primary" startContent={<Plus className="h-4 w-4" />} className="bg-[#d41f1f]" onPress={() => handleOpenModal('create')}>
              Create Class
            </Button>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs 
          aria-label="Class Options" 
          color="danger" 
          variant="underlined"
          classNames={{
            tabList: 'gap-6 w-full relative rounded-none p-0 border-b border-divider',
            cursor: 'w-full bg-[#d41f1f]',
            tab: 'max-w-fit px-0 h-12',
            tabContent: 'group-data-[selected=true]:text-[#d41f1f]',
          }}
        >
          <Tab key="directory" title="Class Directory">
            <Card className="mt-4 border border-slate-200 shadow-none">
              <CardHeader className="flex justify-between gap-3 p-4">
                <Input
                  classNames={{
                    base: "w-full sm:max-w-[44%]",
                    inputWrapper: "border-1",
                  }}
                  placeholder="Search by class name..."
                  size="sm"
                  startContent={<Search className="text-slate-500" size={16} />}
                  variant="bordered"
                />
                <div className="flex gap-2">
                  <Button variant="flat" startContent={<Filter className="h-4 w-4" />} size="sm">
                    Filter
                  </Button>
                </div>
              </CardHeader>
              <CardBody className="px-4 pb-4">
                <Table aria-label="Classes Table" shadow="none">
                  <TableHeader>
                    <TableColumn>CLASS NAME</TableColumn>
                    <TableColumn>EDUCATION LEVEL</TableColumn>
                    <TableColumn>CLASS TEACHER</TableColumn>
                    <TableColumn>STUDENTS</TableColumn>
                    <TableColumn>SUBJECTS</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody items={initialClasses}>
                    {(item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-semibold">{item.name}</div>
                          <div className="text-xs text-slate-500">{item.academic_year}</div>
                        </TableCell>
                        <TableCell>{item.level}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar size="sm" name={item.teacher} />
                            <span>{item.teacher}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-slate-400" />
                            <span>{item.students}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-slate-400" />
                            <span>{item.subjects}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Chip color={item.status === 'active' ? "success" : "default"} size="sm" variant="flat" className="capitalize">
                            {item.status}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <Dropdown>
                            <DropdownTrigger>
                              <Button isIconOnly size="sm" variant="light">
                                <MoreVertical className="h-4 w-4 text-slate-500" />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Class Actions">
                              <DropdownItem key="view">View Details</DropdownItem>
                              <DropdownItem key="edit">Edit Class</DropdownItem>
                              <DropdownItem key="enroll" onPress={() => handleOpenModal('enroll', item)}>Enroll Students</DropdownItem>
                              <DropdownItem key="subjects" onPress={() => handleOpenModal('subjects', item)}>Manage Subjects</DropdownItem>
                              <DropdownItem key="attendance">View Attendance</DropdownItem>
                              <DropdownItem key="deactivate" className="text-danger" color="danger">Deactivate Class</DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          </Tab>

          <Tab key="enrollments" title="Enrollments & Transfers">
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border border-slate-200 shadow-none">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      <UserPlus className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">New Enrollment</h3>
                      <p className="text-sm text-slate-500">Assign students to classes for the current year</p>
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <p className="text-sm text-slate-600 mb-4">
                    Students must be assigned to exactly one class per academic year. Use this tool to enroll new students or assign existing unassigned students.
                  </p>
                  <Button color="primary" className="w-full" onPress={() => handleOpenModal('enroll')}>
                    Enroll Student
                  </Button>
                </CardBody>
              </Card>

              <Card className="border border-slate-200 shadow-none">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                      <ArrowRightLeft className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Transfer Student</h3>
                      <p className="text-sm text-slate-500">Move a student from one class to another</p>
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <p className="text-sm text-slate-600 mb-4">
                    Transferring a student maintains their academic history. Attendance and assessment records will be preserved.
                  </p>
                  <Button variant="bordered" className="w-full" onPress={() => handleOpenModal('transfer')}>
                    Initiate Transfer
                  </Button>
                </CardBody>
              </Card>
            </div>
          </Tab>

          <Tab key="promotions" title="Promotions">
             <Card className="mt-4 border border-slate-200 shadow-none">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg text-green-600">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">End of Year Processing</h3>
                      <p className="text-sm text-slate-500">Promote students to the next academic level</p>
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="text-center py-8 text-slate-500">
                    <p>Select an academic year to begin promotion processing.</p>
                    <Button color="primary" className="mt-4 bg-[#d41f1f]">
                      Start Promotion Wizard
                    </Button>
                  </div>
                </CardBody>
             </Card>
          </Tab>
        </Tabs>

        {/* Modal for Create/Enroll/Transfer */}
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  {modalType === 'create' && 'Create New Class'}
                  {modalType === 'enroll' && 'Enroll Student into Class'}
                  {modalType === 'transfer' && 'Transfer Student'}
                  {modalType === 'subjects' && 'Manage Class Subjects'}
                </ModalHeader>
                <ModalBody>
                  {modalType === 'create' && (
                    <div className="flex flex-col gap-4">
                      <Input label="Class Name" placeholder="e.g. Grade 1 A" variant="bordered" />
                      <Select label="Education Level" placeholder="Select level" variant="bordered">
                        {educationalLevels.map((level) => (
                          <SelectItem key={level.id} value={level.id}>{level.name}</SelectItem>
                        ))}
                      </Select>
                      <Select label="Academic Year" placeholder="Select year" defaultSelectedKeys={['2024/2025']} variant="bordered">
                        {academicYears.map((year) => (
                          <SelectItem key={year.name} value={year.name}>{year.name}</SelectItem>
                        ))}
                      </Select>
                      <Select label="Class Teacher" placeholder="Assign a teacher" variant="bordered">
                        <SelectItem key="t1">Mrs. Sarah Jones</SelectItem>
                        <SelectItem key="t2">Mr. David Smith</SelectItem>
                      </Select>
                    </div>
                  )}

                  {modalType === 'subjects' && (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-semibold">{selectedClass?.name}</p>
                          <p className="text-sm text-slate-500">{selectedClass?.academic_year}</p>
                        </div>
                        <Chip size="sm" color="primary">{selectedClass?.subjects} Subjects Assigned</Chip>
                      </div>
                      
                      <p className="text-sm text-slate-600">Assign subjects to this class. All enrolled students will automatically be registered for these subjects.</p>
                      
                      <div className="flex gap-2">
                         <Select placeholder="Select Subject" className="flex-1" size="sm" variant="bordered">
                           <SelectItem key="math">Mathematics</SelectItem>
                           <SelectItem key="eng">English Language</SelectItem>
                           <SelectItem key="sci">General Science</SelectItem>
                         </Select>
                         <Select placeholder="Responsible Teacher" className="flex-1" size="sm" variant="bordered">
                           <SelectItem key="t1">Mrs. Sarah Jones</SelectItem>
                           <SelectItem key="t2">Mr. David Smith</SelectItem>
                         </Select>
                         <Button isIconOnly color="primary" className="bg-[#d41f1f]" size="sm">
                           <Plus className="h-4 w-4" />
                         </Button>
                      </div>

                      <div className="border rounded-lg overflow-hidden">
                        <Table aria-label="Class Subjects" shadow="none" removeWrapper>
                          <TableHeader>
                            <TableColumn>SUBJECT</TableColumn>
                            <TableColumn>TEACHER</TableColumn>
                            <TableColumn>ACTIONS</TableColumn>
                          </TableHeader>
                          <TableBody>
                            <TableRow key="1">
                              <TableCell>Mathematics</TableCell>
                              <TableCell>Mrs. Sarah Jones</TableCell>
                              <TableCell>
                                <Button size="sm" variant="light" color="danger">Remove</Button>
                              </TableCell>
                            </TableRow>
                            <TableRow key="2">
                              <TableCell>English</TableCell>
                              <TableCell>Ms. Emily White</TableCell>
                              <TableCell>
                                <Button size="sm" variant="light" color="danger">Remove</Button>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {modalType === 'enroll' && (
                    <div className="flex flex-col gap-4">
                      <Select label="Select Student" placeholder="Search student..." variant="bordered">
                        <SelectItem key="s1">John Doe (Unassigned)</SelectItem>
                        <SelectItem key="s2">Jane Smith (Unassigned)</SelectItem>
                      </Select>
                      <Select label="Target Class" placeholder="Select class" variant="bordered">
                        {initialClasses.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                        ))}
                      </Select>
                      <Input type="date" label="Enrollment Date" variant="bordered" labelPlacement="outside" />
                    </div>
                  )}

                  {modalType === 'transfer' && (
                    <div className="flex flex-col gap-4">
                      <Select label="Select Student" placeholder="Search student..." variant="bordered">
                        <SelectItem key="s3">Michael Brown (Grade 1 A)</SelectItem>
                      </Select>
                      <Input label="Current Class" value="Grade 1 A" isReadOnly variant="flat" />
                      <Select label="New Class" placeholder="Select destination class" variant="bordered">
                        {initialClasses.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                        ))}
                      </Select>
                      <Input type="date" label="Transfer Date" variant="bordered" labelPlacement="outside" />
                      <Input label="Reason for Transfer" placeholder="e.g. Parent Request" variant="bordered" />
                    </div>
                  )}
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    Cancel
                  </Button>
                  <Button color="primary" className="bg-[#d41f1f]" onPress={onClose}>
                    {modalType === 'create' && 'Create Class'}
                    {modalType === 'enroll' && 'Confirm Enrollment'}
                    {modalType === 'transfer' && 'Process Transfer'}
                    {modalType === 'subjects' && 'Save Changes'}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </DashboardLayout>
  )
}

export default Classes
