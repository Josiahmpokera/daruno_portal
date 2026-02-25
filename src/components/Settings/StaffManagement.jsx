import { useState } from 'react'
import {
  Tabs,
  Tab,
  Card,
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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
  Textarea,
  Divider,
  Form,
  RadioGroup,
  Radio
} from '@heroui/react'
import { Plus, Search, Filter, MoreVertical, Mail, Phone, Calendar, BookOpen } from 'lucide-react'

// Mock Data for Teachers
const initialTeachers = [
  {
    id: 'T001',
    name: 'Sarah Johnson',
    designation: 'Senior Teacher',
    subject: 'Mathematics',
    email: 'sarah.j@school.com',
    phone: '+1 234 567 8901',
    role: 'Teacher',
    status: 'Active'
  },
  {
    id: 'T002',
    name: 'Michael Chen',
    designation: 'Teacher',
    subject: 'Science',
    email: 'michael.c@school.com',
    phone: '+1 234 567 8902',
    role: 'Teacher',
    status: 'Active'
  }
]

// Mock Data for Staff
const initialStaff = [
  {
    id: 'S001',
    name: 'David Wilson',
    role: 'Admin Assistant',
    department: 'Administration',
    contractType: 'Full-time',
    email: 'david.w@school.com',
    phone: '+1 234 567 8903',
    status: 'Active'
  }
]

export default function StaffManagement() {
  const [selectedTab, setSelectedTab] = useState('teachers')
  const { isOpen: isTeacherModalOpen, onOpen: onTeacherModalOpen, onOpenChange: onTeacherModalOpenChange } = useDisclosure()
  const { isOpen: isStaffModalOpen, onOpen: onStaffModalOpen, onOpenChange: onStaffModalOpenChange } = useDisclosure()

  // Form States (simplified for demo)
  const [teacherFormData, setTeacherFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    dob: '',
    email: '',
    phone: '',
    employeeId: '',
    designation: '',
    joiningDate: '',
    qualification: '',
    expertise: '',
    role: 'teacher'
  })

  const [staffFormData, setStaffFormData] = useState({
    firstName: '',
    lastName: '',
    role: '',
    contractType: '',
    startDate: '',
    endDate: '',
    email: '',
    phone: ''
  })

  const handleTeacherSubmit = (e, onClose) => {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.currentTarget))
    
    // Handle submission logic here
    // In a real app, this would trigger an API call to create the user and generate credentials
    console.log('Teacher Data:', data)
    console.log('Generating credentials for:', data.email)
    onClose()
  }

  const handleStaffSubmit = (onClose) => {
    // Handle submission logic here
    console.log('Staff Data:', staffFormData)
    onClose()
  }

  const renderTeacherTable = () => (
    <Table aria-label="Teachers Table" shadow="none" selectionMode="multiple">
      <TableHeader>
        <TableColumn>NAME</TableColumn>
        <TableColumn>DESIGNATION</TableColumn>
        <TableColumn>SUBJECT</TableColumn>
        <TableColumn>CONTACT</TableColumn>
        <TableColumn>ROLE</TableColumn>
        <TableColumn>STATUS</TableColumn>
        <TableColumn>ACTIONS</TableColumn>
      </TableHeader>
      <TableBody>
        {initialTeachers.map((teacher) => (
          <TableRow key={teacher.id}>
            <TableCell>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{teacher.name}</span>
                <span className="text-xs text-slate-500">{teacher.id}</span>
              </div>
            </TableCell>
            <TableCell>{teacher.designation}</TableCell>
            <TableCell>
              <Chip size="sm" variant="flat" color="primary">{teacher.subject}</Chip>
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Mail className="h-3 w-3" /> {teacher.email}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Phone className="h-3 w-3" /> {teacher.phone}
                </div>
              </div>
            </TableCell>
            <TableCell>{teacher.role}</TableCell>
            <TableCell>
              <Chip size="sm" color="success" variant="dot">
                {teacher.status}
              </Chip>
            </TableCell>
            <TableCell>
              <Button isIconOnly size="sm" variant="light">
                <MoreVertical className="h-4 w-4 text-slate-500" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  const renderStaffTable = () => (
    <Table aria-label="Staff Table" shadow="none" selectionMode="multiple">
      <TableHeader>
        <TableColumn>NAME</TableColumn>
        <TableColumn>ROLE</TableColumn>
        <TableColumn>DEPARTMENT</TableColumn>
        <TableColumn>CONTRACT</TableColumn>
        <TableColumn>CONTACT</TableColumn>
        <TableColumn>STATUS</TableColumn>
        <TableColumn>ACTIONS</TableColumn>
      </TableHeader>
      <TableBody>
        {initialStaff.map((staff) => (
          <TableRow key={staff.id}>
            <TableCell>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{staff.name}</span>
                <span className="text-xs text-slate-500">{staff.id}</span>
              </div>
            </TableCell>
            <TableCell>{staff.role}</TableCell>
            <TableCell>{staff.department}</TableCell>
            <TableCell>
              <Chip size="sm" variant="flat" color="warning">{staff.contractType}</Chip>
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Mail className="h-3 w-3" /> {staff.email}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Phone className="h-3 w-3" /> {staff.phone}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Chip size="sm" color="success" variant="dot">
                {staff.status}
              </Chip>
            </TableCell>
            <TableCell>
              <Button isIconOnly size="sm" variant="light">
                <MoreVertical className="h-4 w-4 text-slate-500" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Staff Management</h2>
        <Button 
          color="primary" 
          className="bg-[#d41f1f] text-white"
          startContent={<Plus className="h-4 w-4" />}
          onPress={selectedTab === 'teachers' ? onTeacherModalOpen : onStaffModalOpen}
        >
          Add {selectedTab === 'teachers' ? 'Teacher' : 'Staff'}
        </Button>
      </div>

      <Card className="border border-slate-200 shadow-none">
        <CardBody className="p-0">
          <Tabs
            aria-label="Staff Options"
            selectedKey={selectedTab}
            onSelectionChange={setSelectedTab}
            color="danger"
            variant="underlined"
            classNames={{
              tabList: 'gap-6 w-full relative rounded-none p-0 border-b border-divider px-6',
              cursor: 'w-full bg-[#d41f1f]',
              tab: 'max-w-fit px-0 h-12',
              tabContent: 'group-data-[selected=true]:text-[#d41f1f] font-medium',
            }}
          >
            <Tab key="teachers" title="Teachers">
              <div className="p-4">
                <div className="mb-4 flex gap-4">
                  <Input
                    placeholder="Search teachers..."
                    startContent={<Search className="h-4 w-4 text-slate-400" />}
                    className="w-full sm:max-w-[300px]"
                    variant="bordered"
                    size="sm"
                  />
                  <Button isIconOnly variant="flat" size="sm">
                    <Filter className="h-4 w-4 text-slate-500" />
                  </Button>
                </div>
                {renderTeacherTable()}
              </div>
            </Tab>
            <Tab key="staff" title="Support Staff">
              <div className="p-4">
                <div className="mb-4 flex gap-4">
                  <Input
                    placeholder="Search staff..."
                    startContent={<Search className="h-4 w-4 text-slate-400" />}
                    className="w-full sm:max-w-[300px]"
                    variant="bordered"
                    size="sm"
                  />
                   <Button isIconOnly variant="flat" size="sm">
                    <Filter className="h-4 w-4 text-slate-500" />
                  </Button>
                </div>
                {renderStaffTable()}
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* Add Teacher Modal */}
      <Modal 
        isOpen={isTeacherModalOpen} 
        onOpenChange={onTeacherModalOpenChange}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Add New Teacher</ModalHeader>
              <ModalBody>
                <Form
                  className="flex flex-col gap-6 w-full"
                  validationBehavior="native"
                  id="teacher-form"
                  onSubmit={(e) => handleTeacherSubmit(e, onClose)}
                >
                  {/* Personal Info */}
                  <div className="flex flex-col gap-4 w-full">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input 
                        isRequired 
                        errorMessage="Please enter a first name" 
                        label="First Name" 
                        labelPlacement="outside" 
                        name="firstName" 
                        placeholder="Enter first name" 
                        variant="bordered" 
                      />
                      <Input 
                        isRequired 
                        errorMessage="Please enter a last name" 
                        label="Last Name" 
                        labelPlacement="outside" 
                        name="lastName" 
                        placeholder="Enter last name" 
                        variant="bordered" 
                      />
                      <RadioGroup
                        isRequired
                        errorMessage="Please select a gender"
                        label="Gender"
                        name="gender"
                        orientation="horizontal"
                      >
                        <Radio value="male">Male</Radio>
                        <Radio value="female">Female</Radio>
                      </RadioGroup>
                      <Input 
                        isRequired 
                        errorMessage="Please select a date of birth" 
                        type="date" 
                        label="Date of Birth" 
                        labelPlacement="outside" 
                        name="dob" 
                        placeholder="Select date" 
                        variant="bordered" 
                      />
                      <Input 
                        isRequired 
                        errorMessage="Please enter a valid email" 
                        label="Email" 
                        labelPlacement="outside" 
                        name="email" 
                        placeholder="Enter email address" 
                        type="email" 
                        variant="bordered" 
                      />
                      <Input 
                        isRequired 
                        errorMessage="Please enter a phone number" 
                        label="Phone" 
                        labelPlacement="outside" 
                        name="phone" 
                        placeholder="Enter phone number" 
                        variant="bordered" 
                      />
                    </div>
                  </div>

                  <Divider className="my-2" />

                  {/* Professional Info */}
                  <div className="flex flex-col gap-4 w-full">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Professional Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input 
                        isRequired 
                        errorMessage="Please enter an employee ID" 
                        label="Employee ID" 
                        labelPlacement="outside" 
                        name="employeeId" 
                        placeholder="e.g. T-2024-001" 
                        variant="bordered" 
                      />
                      <Input 
                        isRequired 
                        errorMessage="Please enter a designation" 
                        label="Designation" 
                        labelPlacement="outside" 
                        name="designation" 
                        placeholder="e.g. Senior Teacher" 
                        variant="bordered" 
                      />
                      <Input 
                        isRequired 
                        errorMessage="Please select a joining date" 
                        type="date" 
                        label="Date of Joining" 
                        labelPlacement="outside" 
                        name="joiningDate" 
                        placeholder="Select date" 
                        variant="bordered" 
                      />
                    </div>
                  </div>

                  <Divider className="my-2" />

                  {/* Academic Info */}
                  <div className="flex flex-col gap-4 w-full">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Academic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input 
                        label="Highest Qualification" 
                        labelPlacement="outside" 
                        name="qualification" 
                        placeholder="e.g. Masters in Education" 
                        variant="bordered" 
                      />
                      <Input 
                        label="Subject Expertise" 
                        labelPlacement="outside" 
                        name="expertise" 
                        placeholder="e.g. Mathematics, Physics" 
                        variant="bordered" 
                      />
                    </div>
                  </div>

                   <Divider className="my-2" />

                  {/* Assign Roles */}
                  <div className="flex flex-col gap-4 w-full">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">System Access</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <Select 
                        isRequired 
                        errorMessage="Please select a system role" 
                        label="System Role" 
                        name="role" 
                        placeholder="Select role" 
                        defaultSelectedKeys={['teacher']} 
                        variant="bordered"
                        className="mt-2"
                      >
                        <SelectItem key="teacher">Teacher (Standard Access)</SelectItem>
                        <SelectItem key="head_teacher">Head Teacher (Expanded Access)</SelectItem>
                        <SelectItem key="admin">Administrator</SelectItem>
                      </Select>
                      <p className="text-xs text-slate-500">
                        * Assigning the "Teacher" role ensures they can log in and manage their assigned classes.
                      </p>
                    </div>
                  </div>
                </Form>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  form="teacher-form" 
                  color="primary" 
                  className="bg-[#d41f1f]"
                >
                  Save Teacher
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Add Staff Modal */}
      <Modal 
        isOpen={isStaffModalOpen} 
        onOpenChange={onStaffModalOpenChange}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Add New Staff Member</ModalHeader>
              <ModalBody>
                 <div className="flex flex-col gap-6">
                  {/* Basic Info */}
                  <div className="flex flex-col gap-4">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="First Name" placeholder="Enter first name" variant="bordered" />
                      <Input label="Last Name" placeholder="Enter last name" variant="bordered" />
                      <Input label="Email" placeholder="Enter email address" type="email" variant="bordered" />
                      <Input label="Phone" placeholder="Enter phone number" variant="bordered" />
                       <Input label="Role/Title" placeholder="e.g. Admin Assistant" variant="bordered" />
                       <Select label="Department" placeholder="Select department" variant="bordered">
                        <SelectItem key="admin">Administration</SelectItem>
                        <SelectItem key="maintenance">Maintenance</SelectItem>
                        <SelectItem key="transport">Transport</SelectItem>
                        <SelectItem key="security">Security</SelectItem>
                      </Select>
                    </div>
                  </div>

                  <Divider className="my-2" />

                  {/* Contract Details */}
                  <div className="flex flex-col gap-4">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Contract Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select label="Contract Type" placeholder="Select type" variant="bordered">
                        <SelectItem key="full-time">Full-time</SelectItem>
                        <SelectItem key="part-time">Part-time</SelectItem>
                        <SelectItem key="contract">Contract</SelectItem>
                      </Select>
                      <Input type="date" label="Start Date" placeholder="Select date" variant="bordered" labelPlacement="outside" />
                      <Input type="date" label="End Date (Optional)" placeholder="Select date" variant="bordered" labelPlacement="outside" />
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" className="bg-[#d41f1f]" onPress={() => handleStaffSubmit(onClose)}>
                  Save Staff
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}
