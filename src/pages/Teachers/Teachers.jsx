import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Chip } from '@heroui/react'
import { Plus, Search } from 'lucide-react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import ModulePlaceholder from '../../components/Layout/ModulePlaceholder'
import PageHeader from '../../components/Layout/PageHeader.jsx'
import DataTable from '../../components/Tables/DataTable.jsx'
import RowActionsMenu from '../../components/Tables/RowActionsMenu.jsx'
import { FormInput, FormButton } from '../../components/Form'

const teachers = [
  {
    id: 'T-001',
    name: 'Sarah Jones',
    email: 'sarah.jones@school.edu',
    subject: 'Mathematics',
    classes: 3,
    status: 'active',
  },
  {
    id: 'T-002',
    name: 'David Smith',
    email: 'david.smith@school.edu',
    subject: 'English',
    classes: 2,
    status: 'active',
  },
  {
    id: 'T-003',
    name: 'Emily White',
    email: 'emily.white@school.edu',
    subject: 'Science',
    classes: 4,
    status: 'on_leave',
  },
]

const sectionMeta = {
  '/teachers': {
    title: 'Teachers',
    description: 'Manage teaching staff, assignments, and workload',
  },
  '/teachers/assignments': {
    title: 'Teacher Assignments',
    description: 'Assign teachers to classes and subjects',
  },
  '/teachers/workload': {
    title: 'Workload',
    description: 'View teaching load across the school',
  },
  '/teachers/leave': {
    title: 'Leave',
    description: 'Track teacher leave requests and history',
  },
  '/teachers/performance': {
    title: 'Performance',
    description: 'Teacher performance reviews and notes',
  },
}

function TeachersList() {
  const [filter, setFilter] = useState('')
  const filtered = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(filter.toLowerCase()) ||
      t.subject.toLowerCase().includes(filter.toLowerCase()),
  )

  const columns = useMemo(
    () => [
      { accessorKey: 'name', header: 'Name', size: 180 },
      { accessorKey: 'email', header: 'Email', size: 220 },
      { accessorKey: 'subject', header: 'Subject', size: 140 },
      { accessorKey: 'classes', header: 'Classes', size: 90 },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 100,
        Cell: ({ cell }) => (
          <Chip
            size="sm"
            variant="flat"
            color={cell.getValue() === 'active' ? 'success' : 'warning'}
            className="h-5 capitalize text-[10px]"
          >
            {String(cell.getValue()).replace('_', ' ')}
          </Chip>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 96,
        enableSorting: false,
        Cell: ({ row }) => {
          const t = row.original
          return (
            <RowActionsMenu
              ariaLabel={`Actions for ${t.name}`}
              items={[
                {
                  key: 'view',
                  label: 'View profile',
                  onPress: () => window.alert(`View ${t.name}`),
                },
                {
                  key: 'edit',
                  label: 'Edit',
                  onPress: () => window.alert(`Edit ${t.name}`),
                },
                {
                  key: 'assign',
                  label: 'Assign classes',
                  onPress: () => window.alert(`Assign classes for ${t.name}`),
                },
                {
                  key: 'leave',
                  label: 'Leave',
                  onPress: () => window.alert(`Leave for ${t.name}`),
                },
                {
                  key: 'deactivate',
                  label: t.status === 'active' ? 'Set on leave' : 'Mark active',
                  color: t.status === 'active' ? 'warning' : 'default',
                  onPress: () =>
                    window.alert(`Update status for ${t.name}`),
                },
              ]}
            />
          )
        },
      },
    ],
    [],
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <FormInput
          isClearable
          className="w-full sm:max-w-sm"
          placeholder="Search teachers..."
          startContent={<Search className="h-4 w-4 text-zinc-400" />}
          value={filter}
          onValueChange={setFilter}
        />
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        emptyMessage="No teachers found."
      />
    </div>
  )
}

function Teachers() {
  const location = useLocation()
  const meta = useMemo(
    () =>
      sectionMeta[location.pathname] || {
        title: 'Teachers',
        description: 'Manage teaching staff',
      },
    [location.pathname],
  )

  const isList = location.pathname === '/teachers'

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title={meta.title}
          breadcrumbs={[
            { label: 'People', href: '/teachers' },
            { label: meta.title },
          ]}
          description={meta.description}
          actions={
            isList ? (
              <FormButton startContent={<Plus className="h-4 w-4" />}>
                Add teacher
              </FormButton>
            ) : null
          }
        />
        {isList ? (
          <TeachersList />
        ) : (
          <ModulePlaceholder
            title={meta.title}
            description={meta.description}
            wrapLayout={false}
            showHeader={false}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

export default Teachers
