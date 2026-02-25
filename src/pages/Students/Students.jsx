import { useState } from 'react'
import {
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
  Pagination,
} from '@heroui/react'
import { Plus, Search, Filter, MoreVertical, FileDown } from 'lucide-react'
import DashboardLayout from '../../components/Layout/DashboardLayout'

// Mock Data matching Requirement 5
const initialStudents = [
  {
    id: 'STU-2024-001',
    admission_no: 'ADM001',
    first_name: 'John',
    last_name: 'Doe',
    gender: 'Male',
    date_of_birth: '2015-05-15',
    parent_id: 'P001',
    status: 'active',
    class: 'Grade 5 A'
  },
  {
    id: 'STU-2024-002',
    admission_no: 'ADM002',
    first_name: 'Jane',
    last_name: 'Smith',
    gender: 'Female',
    date_of_birth: '2015-08-22',
    parent_id: 'P002',
    status: 'active',
    class: 'Grade 5 A'
  },
  {
    id: 'STU-2024-003',
    admission_no: 'ADM003',
    first_name: 'Michael',
    last_name: 'Brown',
    gender: 'Male',
    date_of_birth: '2014-11-10',
    parent_id: 'P003',
    status: 'transferred',
    class: 'Grade 6 B'
  },
]

const statusColorMap = {
  active: 'success',
  transferred: 'warning',
  graduated: 'primary',
  inactive: 'danger',
}

function Students() {
  const [students, setStudents] = useState(initialStudents)
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [filterValue, setFilterValue] = useState('')

  // Filter logic
  const filteredStudents = students.filter((student) =>
    student.first_name.toLowerCase().includes(filterValue.toLowerCase()) ||
    student.last_name.toLowerCase().includes(filterValue.toLowerCase()) ||
    student.admission_no.toLowerCase().includes(filterValue.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="text-sm text-slate-500">
            Manage student records, admissions, and status
          </p>
        </div>

        <Card className="border border-slate-200 shadow-none">
          <CardHeader className="flex justify-between gap-4 p-4">
            <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center">
              <Input
                isClearable
                className="w-full sm:max-w-[44%]"
                placeholder="Search by name or admission no..."
                startContent={<Search className="h-4 w-4 text-slate-400" />}
                value={filterValue}
                onValueChange={setFilterValue}
                variant="bordered"
                size="sm"
              />
              <div className="flex gap-2">
                <Button variant="flat" startContent={<Filter className="h-4 w-4" />} size="sm">
                  Filters
                </Button>
                <Button variant="flat" startContent={<FileDown className="h-4 w-4" />} size="sm">
                  Export
                </Button>
              </div>
            </div>
            <Button color="primary" startContent={<Plus className="h-4 w-4" />} className="bg-[#d41f1f]" onPress={onOpen}>
              Add Student
            </Button>
          </CardHeader>
          <CardBody className="px-4 pb-4">
            <Table aria-label="Students Table" shadow="none" selectionMode="multiple">
              <TableHeader>
                <TableColumn>STUDENT INFO</TableColumn>
                <TableColumn>ADMISSION NO</TableColumn>
                <TableColumn>CLASS</TableColumn>
                <TableColumn>GENDER</TableColumn>
                <TableColumn>DOB</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody items={filteredStudents} emptyContent="No students found.">
                {(item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{item.first_name} {item.last_name}</span>
                        <span className="text-xs text-slate-500">ID: {item.id}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.admission_no}</TableCell>
                    <TableCell>{item.class}</TableCell>
                    <TableCell>{item.gender}</TableCell>
                    <TableCell>{item.date_of_birth}</TableCell>
                    <TableCell>
                      <Chip className="capitalize" color={statusColorMap[item.status]} size="sm" variant="flat">
                        {item.status}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Button isIconOnly size="sm" variant="light">
                        <MoreVertical className="h-4 w-4 text-slate-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="flex w-full justify-center mt-4">
              <Pagination total={10} initialPage={1} color="danger" />
            </div>
          </CardBody>
        </Card>

        {/* Add Student Modal */}
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">Add New Student</ModalHeader>
                <ModalBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="First Name" placeholder="Enter first name" variant="bordered" labelPlacement="outside" isRequired />
                    <Input label="Last Name" placeholder="Enter last name" variant="bordered" labelPlacement="outside" isRequired />
                    <Input label="Admission No" placeholder="e.g. ADM001" variant="bordered" labelPlacement="outside" isRequired />
                    <Select label="Gender" placeholder="Select gender" variant="bordered" labelPlacement="outside" isRequired>
                      <SelectItem key="male">Male</SelectItem>
                      <SelectItem key="female">Female</SelectItem>
                    </Select>
                    <Input type="date" label="Date of Birth" placeholder="Select date" variant="bordered" labelPlacement="outside" isRequired />
                    <Input label="Parent ID" placeholder="Link parent account" variant="bordered" labelPlacement="outside" />
                    <Select label="Class" placeholder="Assign class" variant="bordered" labelPlacement="outside">
                      <SelectItem key="g5a">Grade 5 A</SelectItem>
                      <SelectItem key="g6b">Grade 6 B</SelectItem>
                    </Select>
                    <Select label="Status" placeholder="Select status" defaultSelectedKeys={['active']} variant="bordered" labelPlacement="outside">
                      <SelectItem key="active">Active</SelectItem>
                      <SelectItem key="transferred">Transferred</SelectItem>
                      <SelectItem key="graduated">Graduated</SelectItem>
                    </Select>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    Cancel
                  </Button>
                  <Button color="primary" className="bg-[#d41f1f]" onPress={onClose}>
                    Save Student
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

export default Students
