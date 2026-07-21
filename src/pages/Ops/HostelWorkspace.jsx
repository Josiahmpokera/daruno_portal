import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardBody, CardHeader, Chip, Spinner, useDisclosure } from '@heroui/react'
import { Plus, RefreshCw } from 'lucide-react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import PageHeader from '../../components/Layout/PageHeader.jsx'
import SideSheet from '../../components/Layout/SideSheet.jsx'
import DataTable from '../../components/Tables/DataTable.jsx'
import {
  FormButton,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
} from '../../components/Form'
import { toastError, toastSuccess } from '../../components/Toast'
import {
  createHostel,
  createHostelBed,
  createHostelFee,
  createHostelRoom,
  getHostelOccupancy,
  getHostelOverview,
  hostelCheckIn,
  hostelCheckOut,
  listHostelAllocations,
  listHostelBeds,
  listHostelFees,
  listHostelRooms,
  listHostels,
  listStudents,
} from '../../api/domain.js'

const money = (n) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })
const studentLabel = (s) =>
  s
    ? `${[s.first_name, s.last_name].filter(Boolean).join(' ')}${s.admission_number ? ` (${s.admission_number})` : ''}`
    : '—'

const META = {
  '/hostel': { title: 'Hostel', section: 'overview', desc: 'Hostels, rooms, beds and occupancy' },
  '/hostel/check-in': { title: 'Check-in / Check-out', section: 'check-in', desc: 'Allocate beds and manage occupancy' },
  '/hostel/hostels': { title: 'Hostels', section: 'hostels', desc: 'Hostel facilities' },
  '/hostel/rooms': { title: 'Rooms', section: 'rooms', desc: 'Rooms and capacity' },
  '/hostel/beds': { title: 'Bed Allocation', section: 'beds', desc: 'Beds and availability' },
  '/hostel/fees': { title: 'Hostel Fees', section: 'fees', desc: 'Boarding fee structures' },
  '/hostel/occupancy': { title: 'Occupancy Reports', section: 'occupancy', desc: 'Occupancy by hostel' },
}

function Overview() {
  const navigate = useNavigate()
  const q = useQuery({ queryKey: ['hostel', 'overview'], queryFn: getHostelOverview })
  const s = q.data?.summary || {}
  const cards = [
    { t: 'Hostels', d: `${s.hostels ?? 0} facilities`, p: '/hostel/hostels' },
    { t: 'Rooms', d: `${s.rooms ?? 0} rooms`, p: '/hostel/rooms' },
    { t: 'Beds', d: `${s.beds_available ?? 0} free of ${s.beds ?? 0}`, p: '/hostel/beds' },
    { t: 'Checked in', d: `${s.checked_in ?? 0} students`, p: '/hostel/check-in' },
    { t: 'Occupancy', d: `${s.occupancy_rate ?? 0}% occupied`, p: '/hostel/occupancy' },
    { t: 'Fees', d: 'Boarding fee plans', p: '/hostel/fees' },
  ]
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((c) => (
        <Card key={c.p} isPressable className="border border-slate-200 shadow-none" onPress={() => navigate(c.p)}>
          <CardHeader className="pb-1"><h3 className="text-sm font-semibold">{c.t}</h3></CardHeader>
          <CardBody className="pt-0"><p className="text-xs text-slate-500">{c.d}</p></CardBody>
        </Card>
      ))}
    </div>
  )
}

function HostelsSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [form, setForm] = useState({
    name: '', code: '', gender: 'mixed', warden_name: '', phone: '', capacity: '', notes: '',
  })
  const listQ = useQuery({ queryKey: ['hostel', 'hostels'], queryFn: listHostels })
  const mut = useMutation({
    mutationFn: createHostel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hostel'] })
      toastSuccess('Hostel created')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  const columns = useMemo(
    () => [
      { accessorKey: 'name', header: 'Hostel' },
      { accessorKey: 'code', header: 'Code', Cell: ({ row }) => row.original.code || '—' },
      { accessorKey: 'gender', header: 'Gender' },
      { accessorKey: 'warden_name', header: 'Warden', Cell: ({ row }) => row.original.warden_name || '—' },
      { accessorKey: 'rooms_count', header: 'Rooms', Cell: ({ row }) => row.original.rooms_count ?? 0 },
      { accessorKey: 'capacity', header: 'Capacity' },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => <Chip size="sm" variant="flat">{row.original.status}</Chip>,
      },
    ],
    [],
  )
  return (
    <Shell onAdd={() => sheet.onOpen()} addLabel="Add hostel" loading={listQ.isLoading} onRefresh={() => listQ.refetch()}>
      <DataTable columns={columns} data={listQ.data?.hostels || []} emptyMessage="No hostels yet." />
      <SideSheet isOpen={sheet.isOpen} onOpenChange={sheet.onOpenChange} title="New hostel" size="md">
        <div className="space-y-3">
          <FormField label="Name" required><FormInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></FormField>
          <FormField label="Code"><FormInput value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} /></FormField>
          <FormField label="Gender">
            <FormSelect
              options={[
                { value: 'mixed', label: 'Mixed' },
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
              ]}
              value={form.gender}
              onChange={(v) => setForm((f) => ({ ...f, gender: v }))}
            />
          </FormField>
          <FormField label="Warden"><FormInput value={form.warden_name} onChange={(e) => setForm((f) => ({ ...f, warden_name: e.target.value }))} /></FormField>
          <FormField label="Phone"><FormInput value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></FormField>
          <FormField label="Capacity"><FormInput type="number" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} /></FormField>
          <FormField label="Notes"><FormTextarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></FormField>
          <FormButton
            className="w-full bg-[#0B3D2E]"
            color="primary"
            isLoading={mut.isPending}
            onPress={() =>
              mut.mutate({
                ...form,
                capacity: form.capacity ? Number(form.capacity) : 0,
              })
            }
          >
            Save
          </FormButton>
        </div>
      </SideSheet>
    </Shell>
  )
}

function RoomsSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const hostelsQ = useQuery({ queryKey: ['hostel', 'hostels'], queryFn: listHostels })
  const listQ = useQuery({ queryKey: ['hostel', 'rooms'], queryFn: () => listHostelRooms() })
  const [form, setForm] = useState({
    hostel_id: '', name: '', floor: '', capacity: '4', create_beds: true,
  })
  const mut = useMutation({
    mutationFn: createHostelRoom,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hostel'] })
      toastSuccess('Room created')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  const columns = useMemo(
    () => [
      { accessorKey: 'hostel', header: 'Hostel', Cell: ({ row }) => row.original.hostel?.name || '—' },
      { accessorKey: 'name', header: 'Room' },
      { accessorKey: 'floor', header: 'Floor', Cell: ({ row }) => row.original.floor || '—' },
      { accessorKey: 'capacity', header: 'Capacity' },
      { accessorKey: 'beds_count', header: 'Beds', Cell: ({ row }) => row.original.beds_count ?? row.original.beds?.length ?? 0 },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => <Chip size="sm" variant="flat">{row.original.status}</Chip>,
      },
    ],
    [],
  )
  return (
    <Shell onAdd={() => sheet.onOpen()} addLabel="Add room" loading={listQ.isLoading} onRefresh={() => listQ.refetch()}>
      <DataTable columns={columns} data={listQ.data?.rooms || []} emptyMessage="No rooms." />
      <SideSheet isOpen={sheet.isOpen} onOpenChange={sheet.onOpenChange} title="New room" size="md">
        <div className="space-y-3">
          <FormField label="Hostel" required>
            <FormSelect
              options={(hostelsQ.data?.hostels || []).map((h) => ({ value: String(h.id), label: h.name }))}
              value={form.hostel_id}
              onChange={(v) => setForm((f) => ({ ...f, hostel_id: v }))}
            />
          </FormField>
          <FormField label="Room name" required><FormInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="A-12" /></FormField>
          <FormField label="Floor"><FormInput value={form.floor} onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))} /></FormField>
          <FormField label="Capacity (beds)"><FormInput type="number" min="1" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} /></FormField>
          <FormButton
            className="w-full bg-[#0B3D2E]"
            color="primary"
            isLoading={mut.isPending}
            onPress={() =>
              mut.mutate({
                hostel_id: Number(form.hostel_id),
                name: form.name,
                floor: form.floor || null,
                capacity: Number(form.capacity || 1),
                create_beds: true,
              })
            }
          >
            Save room + beds
          </FormButton>
        </div>
      </SideSheet>
    </Shell>
  )
}

function BedsSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const roomsQ = useQuery({ queryKey: ['hostel', 'rooms'], queryFn: () => listHostelRooms() })
  const listQ = useQuery({ queryKey: ['hostel', 'beds'], queryFn: () => listHostelBeds() })
  const [form, setForm] = useState({ room_id: '', label: '' })
  const mut = useMutation({
    mutationFn: createHostelBed,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hostel'] })
      toastSuccess('Bed added')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  const columns = useMemo(
    () => [
      { accessorKey: 'hostel', header: 'Hostel', Cell: ({ row }) => row.original.room?.hostel?.name || '—' },
      { accessorKey: 'room', header: 'Room', Cell: ({ row }) => row.original.room?.name || '—' },
      { accessorKey: 'label', header: 'Bed' },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => (
          <Chip
            size="sm"
            variant="flat"
            color={
              row.original.status === 'available'
                ? 'success'
                : row.original.status === 'occupied'
                  ? 'warning'
                  : 'default'
            }
          >
            {row.original.status}
          </Chip>
        ),
      },
    ],
    [],
  )
  return (
    <Shell onAdd={() => sheet.onOpen()} addLabel="Add bed" loading={listQ.isLoading} onRefresh={() => listQ.refetch()}>
      <DataTable columns={columns} data={listQ.data?.beds || []} emptyMessage="No beds." />
      <SideSheet isOpen={sheet.isOpen} onOpenChange={sheet.onOpenChange} title="Add bed" size="md">
        <div className="space-y-3">
          <FormField label="Room" required>
            <FormSelect
              options={(roomsQ.data?.rooms || []).map((r) => ({
                value: String(r.id),
                label: `${r.hostel?.name || ''} · ${r.name}`,
              }))}
              value={form.room_id}
              onChange={(v) => setForm((f) => ({ ...f, room_id: v }))}
            />
          </FormField>
          <FormField label="Label" required><FormInput value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="Bed 1" /></FormField>
          <FormButton
            className="w-full bg-[#0B3D2E]"
            color="primary"
            isLoading={mut.isPending}
            onPress={() => mut.mutate({ room_id: Number(form.room_id), label: form.label })}
          >
            Save
          </FormButton>
        </div>
      </SideSheet>
    </Shell>
  )
}

function CheckInSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const studentsQ = useQuery({
    queryKey: ['students', 'ops-hostel'],
    queryFn: () => listStudents({ per_page: 100, status: 'active' }),
    staleTime: 60_000,
  })
  const hostelsQ = useQuery({ queryKey: ['hostel', 'hostels'], queryFn: listHostels })
  const roomsQ = useQuery({ queryKey: ['hostel', 'rooms'], queryFn: () => listHostelRooms() })
  const bedsQ = useQuery({ queryKey: ['hostel', 'beds', 'available'], queryFn: () => listHostelBeds({ status: 'available' }) })
  const listQ = useQuery({
    queryKey: ['hostel', 'allocations', 'checked_in'],
    queryFn: () => listHostelAllocations({ status: 'checked_in' }),
  })
  const [form, setForm] = useState({
    student_id: '', hostel_id: '', room_id: '', bed_id: '', fee_amount: '', notes: '',
    check_in_on: new Date().toISOString().slice(0, 10),
  })

  const inMut = useMutation({
    mutationFn: hostelCheckIn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hostel'] })
      toastSuccess('Student checked in')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  const outMut = useMutation({
    mutationFn: hostelCheckOut,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hostel'] })
      toastSuccess('Student checked out')
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })

  const roomOptions = (roomsQ.data?.rooms || [])
    .filter((r) => !form.hostel_id || String(r.hostel_id) === form.hostel_id)
    .map((r) => ({ value: String(r.id), label: r.name }))
  const bedOptions = (bedsQ.data?.beds || [])
    .filter((b) => !form.room_id || String(b.room_id) === form.room_id)
    .map((b) => ({ value: String(b.id), label: b.label }))

  const columns = useMemo(
    () => [
      { accessorKey: 'student', header: 'Student', Cell: ({ row }) => studentLabel(row.original.student) },
      { accessorKey: 'hostel', header: 'Hostel', Cell: ({ row }) => row.original.hostel?.name || '—' },
      { accessorKey: 'room', header: 'Room', Cell: ({ row }) => row.original.room?.name || '—' },
      { accessorKey: 'bed', header: 'Bed', Cell: ({ row }) => row.original.bed?.label || '—' },
      { accessorKey: 'check_in_on', header: 'Check-in', Cell: ({ row }) => String(row.original.check_in_on || '').slice(0, 10) },
      {
        id: 'actions',
        header: '',
        Cell: ({ row }) => (
          <FormButton size="sm" appearance="flat" color="warning" onPress={() => outMut.mutate(row.original.id)}>
            Check out
          </FormButton>
        ),
      },
    ],
    [outMut],
  )

  return (
    <Shell onAdd={() => sheet.onOpen()} addLabel="Check in student" loading={listQ.isLoading} onRefresh={() => listQ.refetch()}>
      <DataTable columns={columns} data={listQ.data?.allocations || []} emptyMessage="No students checked in." />
      <SideSheet isOpen={sheet.isOpen} onOpenChange={sheet.onOpenChange} title="Check in" size="md">
        <div className="space-y-3">
          <FormField label="Student" required>
            <FormSelect
              options={(studentsQ.data?.students || []).map((s) => ({ value: String(s.id), label: studentLabel(s) }))}
              value={form.student_id}
              onChange={(v) => setForm((f) => ({ ...f, student_id: v }))}
            />
          </FormField>
          <FormField label="Hostel" required>
            <FormSelect
              options={(hostelsQ.data?.hostels || []).map((h) => ({ value: String(h.id), label: h.name }))}
              value={form.hostel_id}
              onChange={(v) => setForm((f) => ({ ...f, hostel_id: v, room_id: '', bed_id: '' }))}
            />
          </FormField>
          <FormField label="Room">
            <FormSelect
              options={roomOptions}
              value={form.room_id}
              onChange={(v) => setForm((f) => ({ ...f, room_id: v, bed_id: '' }))}
              placeholder="Optional"
            />
          </FormField>
          <FormField label="Bed">
            <FormSelect options={bedOptions} value={form.bed_id} onChange={(v) => setForm((f) => ({ ...f, bed_id: v }))} placeholder="Optional" />
          </FormField>
          <FormField label="Check-in date"><FormInput type="date" value={form.check_in_on} onChange={(e) => setForm((f) => ({ ...f, check_in_on: e.target.value }))} /></FormField>
          <FormField label="Fee amount"><FormInput type="number" value={form.fee_amount} onChange={(e) => setForm((f) => ({ ...f, fee_amount: e.target.value }))} /></FormField>
          <FormField label="Notes"><FormTextarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></FormField>
          <FormButton
            className="w-full bg-[#0B3D2E]"
            color="primary"
            isLoading={inMut.isPending}
            onPress={() =>
              inMut.mutate({
                student_id: Number(form.student_id),
                hostel_id: Number(form.hostel_id),
                room_id: form.room_id ? Number(form.room_id) : null,
                bed_id: form.bed_id ? Number(form.bed_id) : null,
                check_in_on: form.check_in_on,
                fee_amount: form.fee_amount ? Number(form.fee_amount) : 0,
                notes: form.notes || null,
              })
            }
          >
            Check in
          </FormButton>
        </div>
      </SideSheet>
    </Shell>
  )
}

function FeesSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const hostelsQ = useQuery({ queryKey: ['hostel', 'hostels'], queryFn: listHostels })
  const listQ = useQuery({ queryKey: ['hostel', 'fees'], queryFn: listHostelFees })
  const [form, setForm] = useState({ title: '', amount: '', hostel_id: '', period: 'term' })
  const mut = useMutation({
    mutationFn: createHostelFee,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hostel', 'fees'] })
      toastSuccess('Fee created')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  const columns = useMemo(
    () => [
      { accessorKey: 'title', header: 'Title' },
      { accessorKey: 'hostel', header: 'Hostel', Cell: ({ row }) => row.original.hostel?.name || 'All hostels' },
      { accessorKey: 'amount', header: 'Amount (TZS)', Cell: ({ row }) => money(row.original.amount) },
      { accessorKey: 'period', header: 'Period' },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => <Chip size="sm" variant="flat">{row.original.status}</Chip>,
      },
    ],
    [],
  )
  return (
    <Shell onAdd={() => sheet.onOpen()} addLabel="Add fee" loading={listQ.isLoading} onRefresh={() => listQ.refetch()}>
      <DataTable columns={columns} data={listQ.data?.fees || []} emptyMessage="No hostel fees." />
      <SideSheet isOpen={sheet.isOpen} onOpenChange={sheet.onOpenChange} title="Hostel fee" size="md">
        <div className="space-y-3">
          <FormField label="Title" required><FormInput value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></FormField>
          <FormField label="Amount (TZS)" required><FormInput type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} /></FormField>
          <FormField label="Hostel">
            <FormSelect
              options={(hostelsQ.data?.hostels || []).map((h) => ({ value: String(h.id), label: h.name }))}
              value={form.hostel_id}
              onChange={(v) => setForm((f) => ({ ...f, hostel_id: v }))}
              placeholder="All hostels"
            />
          </FormField>
          <FormField label="Period">
            <FormSelect
              options={[
                { value: 'term', label: 'Per term' },
                { value: 'month', label: 'Per month' },
                { value: 'year', label: 'Per year' },
                { value: 'once', label: 'One-time' },
              ]}
              value={form.period}
              onChange={(v) => setForm((f) => ({ ...f, period: v }))}
            />
          </FormField>
          <FormButton
            className="w-full bg-[#0B3D2E]"
            color="primary"
            isLoading={mut.isPending}
            onPress={() =>
              mut.mutate({
                title: form.title,
                amount: Number(form.amount),
                hostel_id: form.hostel_id ? Number(form.hostel_id) : null,
                period: form.period,
              })
            }
          >
            Save
          </FormButton>
        </div>
      </SideSheet>
    </Shell>
  )
}

function OccupancySection() {
  const q = useQuery({ queryKey: ['hostel', 'occupancy'], queryFn: getHostelOccupancy })
  if (q.isLoading) return <div className="flex justify-center py-12"><Spinner color="success" /></div>
  const s = q.data?.summary || {}
  const columns = useMemo(
    () => [
      { accessorKey: 'name', header: 'Hostel' },
      { accessorKey: 'gender', header: 'Gender' },
      { accessorKey: 'rooms', header: 'Rooms' },
      { accessorKey: 'beds', header: 'Beds' },
      { accessorKey: 'occupied', header: 'Occupied' },
      { accessorKey: 'available', header: 'Available' },
      {
        accessorKey: 'occupancy_rate',
        header: 'Rate',
        Cell: ({ row }) => `${row.original.occupancy_rate}%`,
      },
    ],
    [],
  )
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border border-slate-200 shadow-none"><CardBody className="py-3"><p className="text-xs text-slate-500">Total beds</p><p className="text-xl font-semibold">{s.beds ?? 0}</p></CardBody></Card>
        <Card className="border border-slate-200 shadow-none"><CardBody className="py-3"><p className="text-xs text-slate-500">Occupied</p><p className="text-xl font-semibold text-amber-700">{s.occupied ?? 0}</p></CardBody></Card>
        <Card className="border border-slate-200 shadow-none"><CardBody className="py-3"><p className="text-xs text-slate-500">Available</p><p className="text-xl font-semibold text-emerald-700">{s.available ?? 0}</p></CardBody></Card>
      </div>
      <DataTable columns={columns} data={q.data?.hostels || []} emptyMessage="No occupancy data." />
    </div>
  )
}

function Shell({ children, onAdd, addLabel, loading, onRefresh }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        {onRefresh && <FormButton appearance="bordered" startContent={<RefreshCw className="h-4 w-4" />} onPress={onRefresh}>Refresh</FormButton>}
        {onAdd && <FormButton className="bg-[#0B3D2E]" color="primary" startContent={<Plus className="h-4 w-4" />} onPress={onAdd}>{addLabel}</FormButton>}
      </div>
      {loading ? <div className="flex justify-center py-12"><Spinner color="success" /></div> : children}
    </div>
  )
}

export default function HostelWorkspace() {
  const { pathname } = useLocation()
  const meta = META[pathname] || META['/hostel']
  let body
  switch (meta.section) {
    case 'overview': body = <Overview />; break
    case 'hostels': body = <HostelsSection />; break
    case 'rooms': body = <RoomsSection />; break
    case 'beds': body = <BedsSection />; break
    case 'check-in': body = <CheckInSection />; break
    case 'fees': body = <FeesSection />; break
    case 'occupancy': body = <OccupancySection />; break
    default: body = <Overview />
  }
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title={meta.title}
          description={meta.desc}
          breadcrumbs={[{ label: 'Ops', href: '/inventory' }, { label: 'Hostel', href: '/hostel' }, { label: meta.title }]}
        />
        {body}
      </div>
    </DashboardLayout>
  )
}
