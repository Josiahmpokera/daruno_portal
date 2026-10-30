import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Chip, useDisclosure } from '@heroui/react'
import { Check, Copy, Plus, Search, X } from 'lucide-react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import PageHeader from '../../components/Layout/PageHeader.jsx'
import SideSheet from '../../components/Layout/SideSheet.jsx'
import DataTable from '../../components/Tables/DataTable.jsx'
import RowActionsMenu from '../../components/Tables/RowActionsMenu.jsx'
import {
  FormButton,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
} from '../../components/Form'
import { copyText } from '../../utils/clipboard'
import { toastError, toastSuccess } from '../../components/Toast'
import { useAuth } from '../../auth'
import {
  approveAdmission,
  createAdmission,
  listAdmissions,
  listClasses,
  listYears,
  rejectAdmission,
} from '../../api/domain.js'
import { FormSkeleton } from '../../components/Loading'

const statusColor = {
  pending: 'warning',
  approved: 'primary',
  rejected: 'danger',
  enrolled: 'success',
  withdrawn: 'default',
}

const emptyForm = () => ({
  first_name: '',
  middle_name: '',
  last_name: '',
  date_of_birth: '',
  gender: '',
  phone: '',
  email: '',
  previous_school: '',
  previous_class: '',
  preferred_level: '',
  address: '',
  guardian_name: '',
  guardian_relationship: 'parent',
  guardian_phone: '',
  guardian_email: '',
  notes: '',
})

export default function Applications() {
  const qc = useQueryClient()
  const { session } = useAuth()
  const school = session?.user?.school || session?.school
  const schoolCode = school?.code || school?.slug || ''
  const applyUrl =
    typeof window !== 'undefined' && schoolCode
      ? `${window.location.origin}/apply/${encodeURIComponent(schoolCode)}`
      : schoolCode
        ? `/apply/${encodeURIComponent(schoolCode)}`
        : ''

  const sheet = useDisclosure()
  const detailSheet = useDisclosure()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [form, setForm] = useState(emptyForm())
  const [selected, setSelected] = useState(null)
  const [approveClassId, setApproveClassId] = useState('')

  const listQ = useQuery({
    queryKey: ['admissions', q, status],
    queryFn: () =>
      listAdmissions({
        q: q || undefined,
        status: status || undefined,
        per_page: 50,
      }),
    placeholderData: (prev) => prev,
  })

  const classesQ = useQuery({
    queryKey: ['academic', 'classes', 'admissions'],
    queryFn: () => listClasses({ per_page: 100 }),
    staleTime: 60_000,
  })

  const yearsQ = useQuery({
    queryKey: ['academic', 'years', 'admissions'],
    queryFn: listYears,
    staleTime: 60_000,
  })

  const createMut = useMutation({
    mutationFn: createAdmission,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admissions'] })
      toastSuccess('Application recorded')
      sheet.onClose()
      setForm(emptyForm())
    },
    onError: (e) => toastError(e?.message || 'Could not save'),
  })

  const approveMut = useMutation({
    mutationFn: ({ id, payload }) => approveAdmission(id, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admissions'] })
      qc.invalidateQueries({ queryKey: ['students'] })
      toastSuccess(
        `Enrolled as ${data?.student?.admission_number || 'student'}`,
      )
      detailSheet.onClose()
      setSelected(null)
    },
    onError: (e) => toastError(e?.message || 'Approve failed'),
  })

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }) =>
      rejectAdmission(id, { rejection_reason: reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admissions'] })
      toastSuccess('Application rejected')
      detailSheet.onClose()
      setSelected(null)
    },
    onError: (e) => toastError(e?.message || 'Reject failed'),
  })

  const classes = useMemo(() => {
    const d = classesQ.data
    if (Array.isArray(d?.classes)) return d.classes
    if (Array.isArray(d)) return d
    return []
  }, [classesQ.data])

  const summary = listQ.data?.summary || {}

  const columns = useMemo(
    () => [
      {
        accessorKey: 'application_number',
        header: 'App #',
        size: 120,
        Cell: ({ cell }) => (
          <span className="font-mono text-[11px]">{cell.getValue() || '—'}</span>
        ),
      },
      {
        id: 'name',
        header: 'Applicant',
        size: 180,
        Cell: ({ row }) => (
          <div>
            <div className="font-medium text-zinc-900">
              {row.original.full_name}
            </div>
            <div className="text-[11px] text-zinc-400">
              {row.original.gender || '—'}
              {row.original.date_of_birth
                ? ` · ${row.original.date_of_birth}`
                : ''}
            </div>
          </div>
        ),
      },
      {
        id: 'contact',
        header: 'Contact',
        size: 140,
        Cell: ({ row }) => (
          <div className="text-[12px] text-zinc-600">
            <div>{row.original.phone || '—'}</div>
            <div className="text-[11px] text-zinc-400">
              {row.original.email || ''}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'source',
        header: 'Source',
        size: 100,
        Cell: ({ cell }) => (
          <span className="text-[12px] capitalize text-zinc-600">
            {String(cell.getValue() || '').replaceAll('_', ' ')}
          </span>
        ),
      },
      {
        accessorKey: 'applied_at',
        header: 'Applied',
        size: 100,
        Cell: ({ cell }) => cell.getValue() || '—',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 100,
        Cell: ({ cell }) => (
          <Chip
            size="sm"
            variant="flat"
            color={statusColor[cell.getValue()] || 'default'}
            className="capitalize"
          >
            {cell.getValue()}
          </Chip>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 100,
        enableSorting: false,
        Cell: ({ row }) => {
          const a = row.original
          return (
            <RowActionsMenu
              items={[
                {
                  key: 'view',
                  label: 'View details',
                  onPress: () => {
                    setSelected(a)
                    setApproveClassId(
                      a.classroom?.id ? String(a.classroom.id) : '',
                    )
                    detailSheet.onOpen()
                  },
                },
                {
                  key: 'approve',
                  label: 'Approve & enroll',
                  show: a.status === 'pending' || a.status === 'approved',
                  onPress: () => {
                    setSelected(a)
                    setApproveClassId('')
                    detailSheet.onOpen()
                  },
                },
                {
                  key: 'reject',
                  label: 'Reject',
                  color: 'danger',
                  show: a.status === 'pending' || a.status === 'approved',
                  onPress: () => {
                    const reason = window.prompt('Rejection reason (optional)')
                    if (reason === null) return
                    rejectMut.mutate({ id: a.id, reason })
                  },
                },
              ]}
            />
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rejectMut.isPending],
  )

  const copyLink = async () => {
    if (!applyUrl) {
      toastError('School code not available')
      return
    }
    try {
      await copyText(applyUrl)
      toastSuccess('Join link copied')
    } catch {
      toastError('Could not copy link')
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Applications"
          description="Join applications from the public form and school portal"
          breadcrumbs={[
            { label: 'People', href: '/students' },
            { label: 'Students', href: '/students' },
            { label: 'Applications' },
          ]}
          actions={
            <div className="flex flex-wrap gap-2">
              {applyUrl ? (
                <FormButton appearance="bordered" onPress={copyLink}>
                  <Copy className="mr-1 h-3.5 w-3.5" />
                  Copy public join link
                </FormButton>
              ) : null}
              <FormButton
                onPress={() => {
                  setForm(emptyForm())
                  sheet.onOpen()
                }}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add application
              </FormButton>
            </div>
          }
        />

        {applyUrl ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2.5 text-[13px] text-emerald-900">
            <p className="font-medium">Public join form</p>
            <p className="mt-0.5 break-all text-[12px] text-emerald-800/90">
              Parents apply at:{' '}
              <a
                href={applyUrl}
                target="_blank"
                rel="noreferrer"
                className="font-mono underline"
              >
                {applyUrl}
              </a>
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[
            ['Total', summary.total],
            ['Pending', summary.pending],
            ['Approved', summary.approved],
            ['Enrolled', summary.enrolled],
            ['Rejected', summary.rejected],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5"
            >
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                {label}
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-900">
                {(value ?? 0).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        <DataTable
          columns={columns}
          data={listQ.data?.applications || []}
          isLoading={listQ.isLoading}
          emptyMessage="No applications yet — share the public join link"
          enableRowSelection={false}
          maxHeight="min(55vh, 480px)"
          searchPlaceholder="Search name, app #, phone…"
          search={q}
          onSearchChange={setQ}
          filters={[
            {
              key: 'status',
              label: 'Status',
              value: status,
              onChange: setStatus,
              options: [
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'enrolled', label: 'Enrolled' },
                { value: 'rejected', label: 'Rejected' },
              ],
            },
          ]}
          onRefresh={() => listQ.refetch()}
          isRefreshing={listQ.isFetching}
        />

        {/* Create application */}
        <SideSheet
          isOpen={sheet.isOpen}
          onOpenChange={sheet.onOpenChange}
          title="Add application"
          size="lg"
          footer={(onClose) => (
            <>
              <FormButton appearance="light" onPress={onClose}>
                Cancel
              </FormButton>
              <FormButton
                isLoading={createMut.isPending}
                onPress={() => {
                  if (!form.first_name.trim() || !form.last_name.trim()) {
                    toastError('First and last name are required')
                    return
                  }
                  createMut.mutate(form)
                }}
              >
                Save
              </FormButton>
            </>
          )}
        >
          <div className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="First name" required>
                <FormInput
                  value={form.first_name}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, first_name: v }))
                  }
                />
              </FormField>
              <FormField label="Last name" required>
                <FormInput
                  value={form.last_name}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, last_name: v }))
                  }
                />
              </FormField>
              <FormField label="Middle name">
                <FormInput
                  value={form.middle_name}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, middle_name: v }))
                  }
                />
              </FormField>
              <FormField label="Date of birth">
                <FormInput
                  type="date"
                  value={form.date_of_birth}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, date_of_birth: v }))
                  }
                />
              </FormField>
              <FormField label="Gender">
                <FormSelect
                  value={form.gender || 'none'}
                  onChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      gender: v === 'none' ? '' : v,
                    }))
                  }
                  options={[
                    { value: 'none', label: 'Not set' },
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                  ]}
                />
              </FormField>
              <FormField label="Phone">
                <FormInput
                  value={form.phone}
                  onValueChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                />
              </FormField>
            </div>
            <FormField label="Guardian name">
              <FormInput
                value={form.guardian_name}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, guardian_name: v }))
                }
              />
            </FormField>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Guardian phone">
                <FormInput
                  value={form.guardian_phone}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, guardian_phone: v }))
                  }
                />
              </FormField>
              <FormField label="Previous school">
                <FormInput
                  value={form.previous_school}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, previous_school: v }))
                  }
                />
              </FormField>
            </div>
            <FormField label="Notes">
              <FormTextarea
                value={form.notes}
                onValueChange={(v) => setForm((f) => ({ ...f, notes: v }))}
              />
            </FormField>
          </div>
        </SideSheet>

        {/* Detail / approve */}
        <SideSheet
          isOpen={detailSheet.isOpen}
          onOpenChange={detailSheet.onOpenChange}
          title={selected?.full_name || 'Application'}
          size="lg"
          footer={(onClose) => (
            <>
              <FormButton appearance="light" onPress={onClose}>
                Close
              </FormButton>
              {selected &&
                (selected.status === 'pending' ||
                  selected.status === 'approved') && (
                  <>
                    <FormButton
                      appearance="bordered"
                      className="text-red-700"
                      isLoading={rejectMut.isPending}
                      onPress={() => {
                        const reason = window.prompt(
                          'Rejection reason (optional)',
                        )
                        if (reason === null) return
                        rejectMut.mutate({ id: selected.id, reason })
                      }}
                    >
                      <X className="mr-1 h-3.5 w-3.5" />
                      Reject
                    </FormButton>
                    <FormButton
                      isLoading={approveMut.isPending}
                      onPress={() =>
                        approveMut.mutate({
                          id: selected.id,
                          payload: {
                            classroom_id: approveClassId
                              ? Number(approveClassId)
                              : undefined,
                          },
                        })
                      }
                    >
                      <Check className="mr-1 h-3.5 w-3.5" />
                      Approve & enroll
                    </FormButton>
                  </>
                )}
            </>
          )}
        >
          {selected ? (
            <div className="flex flex-col gap-4 text-[13px]">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] uppercase text-zinc-400">App #</p>
                  <p className="font-mono">{selected.application_number}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-zinc-400">Status</p>
                  <Chip
                    size="sm"
                    variant="flat"
                    color={statusColor[selected.status] || 'default'}
                    className="capitalize"
                  >
                    {selected.status}
                  </Chip>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-zinc-400">Gender</p>
                  <p className="capitalize">{selected.gender || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-zinc-400">DOB</p>
                  <p>{selected.date_of_birth || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-zinc-400">Phone</p>
                  <p>{selected.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-zinc-400">Email</p>
                  <p>{selected.email || '—'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] uppercase text-zinc-400">
                    Previous school
                  </p>
                  <p>
                    {selected.previous_school || '—'}
                    {selected.previous_class
                      ? ` · ${selected.previous_class}`
                      : ''}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] uppercase text-zinc-400">Address</p>
                  <p>{selected.address || '—'}</p>
                </div>
              </div>

              {selected.guardians?.length > 0 && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase text-zinc-400">
                    Guardians
                  </p>
                  <ul className="space-y-1 rounded-lg border border-zinc-100 p-2">
                    {selected.guardians.map((g) => (
                      <li key={g.id || g.name} className="text-zinc-700">
                        <span className="font-medium">{g.name}</span>
                        {g.relationship ? ` (${g.relationship})` : ''}
                        {g.phone ? ` · ${g.phone}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(selected.status === 'pending' ||
                selected.status === 'approved') && (
                <FormField
                  label="Assign class on enroll (optional)"
                  hint="Student will be enrolled in this class"
                >
                  <FormSelect
                    placeholder="Class"
                    value={approveClassId || 'none'}
                    onChange={(v) =>
                      setApproveClassId(v === 'none' ? '' : v)
                    }
                    options={[
                      { value: 'none', label: 'No class yet' },
                      ...classes.map((c) => ({
                        value: String(c.id),
                        label: c.name,
                      })),
                    ]}
                  />
                </FormField>
              )}

              {selected.student?.admission_number && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">
                  Enrolled as{' '}
                  <span className="font-mono font-medium">
                    {selected.student.admission_number}
                  </span>
                </p>
              )}
            </div>
          ) : (
            <FormSkeleton fields={5} label="Loading application" />
          )}
        </SideSheet>
      </div>
    </DashboardLayout>
  )
}
