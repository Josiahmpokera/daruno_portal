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
} from '@heroui/react'
import { Plus, BookOpen, Users, UserCheck } from 'lucide-react'

function ClassSubjectManagement() {
  const [activeTab, setActiveTab] = useState('classes')
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

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
        <Tab key="classes" title="Class/Grade Allocation">
          <Card className="mt-4 border border-slate-200 shadow-none">
            <CardHeader className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Class Allocation</h3>
                <p className="text-sm text-slate-500">Manage classes and student allocation</p>
              </div>
              <Button color="primary" startContent={<Plus className="h-4 w-4" />} className="bg-[#d41f1f]" onPress={onOpen}>
                Add Class
              </Button>
            </CardHeader>
            <CardBody>
              <Table aria-label="Classes Table" shadow="none">
                <TableHeader>
                  <TableColumn>CLASS NAME</TableColumn>
                  <TableColumn>SECTION</TableColumn>
                  <TableColumn>TEACHER</TableColumn>
                  <TableColumn>STUDENTS</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No classes defined.">
                  {[]}
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
              <ModalHeader className="flex flex-col gap-1">Add New Class</ModalHeader>
              <ModalBody>
                <Input label="Class Name" placeholder="e.g. Standard I" variant="bordered" />
                <Input label="Section" placeholder="e.g. A" variant="bordered" />
                <Select label="Class Teacher" placeholder="Select teacher" variant="bordered">
                  <SelectItem key="t1">Teacher 1</SelectItem>
                  <SelectItem key="t2">Teacher 2</SelectItem>
                </Select>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" className="bg-[#d41f1f]" onPress={onClose}>
                  Save Class
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