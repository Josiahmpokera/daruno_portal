import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Chip, Spinner } from '@heroui/react'
import { Search, RefreshCw, Hash } from 'lucide-react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import PageHeader from '../../components/Layout/PageHeader.jsx'
import DataTable from '../../components/Tables/DataTable.jsx'
import { FormInput, FormSelect, FormButton } from '../../components/Form'
import { listStudents } from '../../api/domain.js'

/**
 * Lists school admission numbers (real student registry data).
 * Path: /students/admission-numbers
 */
function AdmissionNumbers() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')

  const studentsQ = useQuery({
    queryKey: ['students', 'admission-numbers', q, statusFilter],
    queryFn: () =>
      listStudents({
        q: q || undefined,
        status: statusFilter || undefined,
        per_page: 100,
      }),
  })

  const students = studentsQ.data?.students || []

  const columns = useMemo(
    () => [
      {
        accessorKey: 'admission_number',
        header: 'Admission no.',
        size: 140,
        Cell: ({ cell, row }) => (
          <button
            type="button"
            className="font-mono text-[12px] font-semibold text-[#0B3D2E] hover:underline"
            onClick={() => navigate(`/students/${row.original.id}`)}
          >
            {cell.getValue() || '—'}
          </button>
        ),
      },
      {
        accessorKey: 'full_name',
        header: 'Student',
        size: 200,
        Cell: ({ row }) => (
          <button
            type="button"
            className="text-left text-[12px] font-medium text-zinc-900 hover:text-[#0B3D2E]"
            onClick={() => navigate(`/students/${row.original.id}`)}
          >
            {row.original.full_name}
          </button>
        ),
      },
      {
        accessorKey: 'prems_number',
        header: 'PREMS / EMIS',
        size: 130,
        Cell: ({ cell }) => (
          <span className="font-mono text-[11px] text-zinc-600">
            {cell.getValue() || '—'}
          </span>
        ),
      },
      {
        id: 'class',
        header: 'Class',
        size: 120,
        accessorFn: (r) => r.classroom?.name || '—',
      },
      {
        accessorKey: 'gender',
        header: 'Sex',
        size: 80,
        Cell: ({ cell }) => cell.getValue() || '—',
      },
      {
        accessorKey: 'admission_date',
        header: 'Admitted',
        size: 110,
        Cell: ({ cell }) => cell.getValue() || '—',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 100,
        Cell: ({ cell }) => (
          <Chip size="sm" variant="flat" className="h-5 capitalize text-[10px]">
            {cell.getValue() || '—'}
          </Chip>
        ),
      },
    ],
    [navigate],
  )

  const missingCount = students.filter((s) => !s.admission_number).length

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Admission numbers"
          breadcrumbs={[
            { label: 'People', href: '/students' },
            { label: 'Students', href: '/students' },
            { label: 'Admission numbers' },
          ]}
          description="School admission registry — numbers assigned at registration (TAMISEMI / PREMS)"
          actions={
            <FormButton
              startContent={<Hash className="h-4 w-4" />}
              onPress={() => navigate('/students/registration')}
            >
              Register learner
            </FormButton>
          }
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <FormInput
            isClearable
            className="w-full sm:max-w-xs"
            placeholder="Search name or admission no..."
            startContent={<Search className="h-4 w-4 text-zinc-400" />}
            value={q}
            onValueChange={setQ}
          />
          <FormSelect
            placeholder="Status"
            className="w-full sm:w-40"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'transferred', label: 'Transferred' },
              { value: 'graduated', label: 'Graduated' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
          <FormButton
            appearance="flat"
            isIconOnly
            onPress={() => studentsQ.refetch()}
          >
            <RefreshCw className="h-4 w-4" />
          </FormButton>
          <span className="text-[11px] text-zinc-400 sm:ml-auto">
            {studentsQ.data?.meta?.total ?? students.length} learner(s)
            {missingCount > 0
              ? ` · ${missingCount} without admission no.`
              : ''}
          </span>
        </div>

        {studentsQ.isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner color="primary" />
          </div>
        ) : studentsQ.isError ? (
          <p className="py-8 text-center text-sm text-rose-600">
            {studentsQ.error?.message || 'Failed to load admission numbers'}
          </p>
        ) : (
          <DataTable
            columns={columns}
            data={students}
            emptyMessage="No students found. Register a learner to generate an admission number."
            enableRowSelection
            getRowId={(row) => String(row.id)}
            renderBulkActions={(selected, { clearSelection }) => (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-zinc-500">
                  {selected.length} selected
                </span>
                <FormButton
                  appearance="bordered"
                  className="!h-7 min-h-7 text-[11px]"
                  onPress={() => {
                    if (selected[0]) {
                      navigate(`/students/${selected[0].id}`)
                    }
                  }}
                  isDisabled={selected.length !== 1}
                >
                  Open profile
                </FormButton>
                <FormButton
                  appearance="light"
                  className="!h-7 min-h-7 text-[11px]"
                  onPress={clearSelection}
                >
                  Clear
                </FormButton>
              </div>
            )}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

export default AdmissionNumbers
