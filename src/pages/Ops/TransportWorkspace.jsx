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
  createDriver,
  createTransportAllocation,
  createTransportFee,
  createTransportRoute,
  createTransportStop,
  createVehicle,
  createVehicleMaintenance,
  deleteTransportAllocation,
  getTransportOverview,
  listDrivers,
  listStudents,
  listTransportAllocations,
  listTransportFees,
  listTransportRoutes,
  listTransportStops,
  listVehicleMaintenance,
  listVehicles,
} from '../../api/domain.js'

const money = (n) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })
const studentLabel = (s) =>
  s
    ? `${[s.first_name, s.last_name].filter(Boolean).join(' ')}${s.admission_number ? ` (${s.admission_number})` : ''}`
    : '—'

const META = {
  '/transport': { title: 'Transport', section: 'overview', desc: 'Fleet, routes, drivers and student allocation' },
  '/transport/students': { title: 'Student Allocation', section: 'allocations', desc: 'Assign students to routes and stops' },
  '/transport/vehicles': { title: 'Vehicles', section: 'vehicles', desc: 'School bus and vehicle register' },
  '/transport/drivers': { title: 'Drivers', section: 'drivers', desc: 'Driver records and licenses' },
  '/transport/maintenance': { title: 'Maintenance', section: 'maintenance', desc: 'Service and repair log' },
  '/transport/routes': { title: 'Routes', section: 'routes', desc: 'Transport routes' },
  '/transport/stops': { title: 'Stops', section: 'stops', desc: 'Pickup and drop-off points' },
  '/transport/fees': { title: 'Transport Fees', section: 'fees', desc: 'Route and student transport charges' },
  '/transport/gps': { title: 'GPS (Future)', section: 'gps', desc: 'Live tracking — coming soon' },
}

function Overview() {
  const navigate = useNavigate()
  const q = useQuery({ queryKey: ['transport', 'overview'], queryFn: getTransportOverview })
  const s = q.data?.summary || {}
  const cards = [
    { t: 'Vehicles', d: `${s.vehicles ?? 0} in fleet`, p: '/transport/vehicles' },
    { t: 'Drivers', d: `${s.drivers ?? 0} registered`, p: '/transport/drivers' },
    { t: 'Routes', d: `${s.routes ?? 0} routes`, p: '/transport/routes' },
    { t: 'Students allocated', d: `${s.students_allocated ?? 0}`, p: '/transport/students' },
    { t: 'Maintenance due', d: `${s.open_maintenances ?? 0} within 30 days`, p: '/transport/maintenance' },
    { t: 'Fees', d: 'Route transport fees', p: '/transport/fees' },
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

function VehiclesSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [form, setForm] = useState({ name: '', plate_number: '', capacity: '', status: 'active' })
  const listQ = useQuery({ queryKey: ['transport', 'vehicles'], queryFn: listVehicles })
  const mut = useMutation({
    mutationFn: createVehicle,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transport'] })
      toastSuccess('Vehicle added')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  const columns = useMemo(
    () => [
      { accessorKey: 'name', header: 'Name', Cell: ({ row }) => row.original.name || '—' },
      { accessorKey: 'plate_number', header: 'Plate', Cell: ({ row }) => <span className="font-mono text-xs font-semibold">{row.original.plate_number}</span> },
      { accessorKey: 'capacity', header: 'Capacity', Cell: ({ row }) => row.original.capacity ?? '—' },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => <Chip size="sm" variant="flat" color={row.original.status === 'active' ? 'success' : 'default'}>{row.original.status}</Chip>,
      },
    ],
    [],
  )
  return (
    <Shell onAdd={() => sheet.onOpen()} addLabel="Add vehicle" loading={listQ.isLoading} onRefresh={() => listQ.refetch()}>
      <DataTable columns={columns} data={listQ.data?.vehicles || []} emptyMessage="No vehicles." />
      <SideSheet isOpen={sheet.isOpen} onOpenChange={sheet.onOpenChange} title="Add vehicle" size="md">
        <div className="space-y-3">
          <FormField label="Name"><FormInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Bus 1" /></FormField>
          <FormField label="Plate number" required><FormInput value={form.plate_number} onChange={(e) => setForm((f) => ({ ...f, plate_number: e.target.value }))} /></FormField>
          <FormField label="Capacity"><FormInput type="number" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} /></FormField>
          <FormButton
            className="w-full bg-[#0B3D2E]"
            color="primary"
            isLoading={mut.isPending}
            onPress={() => mut.mutate({ ...form, capacity: form.capacity ? Number(form.capacity) : null })}
          >
            Save
          </FormButton>
        </div>
      </SideSheet>
    </Shell>
  )
}

function DriversSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [form, setForm] = useState({ name: '', phone: '', license_number: '', status: 'active' })
  const listQ = useQuery({ queryKey: ['transport', 'drivers'], queryFn: listDrivers })
  const mut = useMutation({
    mutationFn: createDriver,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transport', 'drivers'] })
      toastSuccess('Driver added')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  const columns = useMemo(
    () => [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'phone', header: 'Phone', Cell: ({ row }) => row.original.phone || '—' },
      { accessorKey: 'license_number', header: 'License', Cell: ({ row }) => row.original.license_number || '—' },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => <Chip size="sm" variant="flat">{row.original.status}</Chip>,
      },
    ],
    [],
  )
  return (
    <Shell onAdd={() => sheet.onOpen()} addLabel="Add driver" loading={listQ.isLoading} onRefresh={() => listQ.refetch()}>
      <DataTable columns={columns} data={listQ.data?.drivers || []} emptyMessage="No drivers." />
      <SideSheet isOpen={sheet.isOpen} onOpenChange={sheet.onOpenChange} title="Add driver" size="md">
        <div className="space-y-3">
          <FormField label="Name" required><FormInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></FormField>
          <FormField label="Phone"><FormInput value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></FormField>
          <FormField label="License number"><FormInput value={form.license_number} onChange={(e) => setForm((f) => ({ ...f, license_number: e.target.value }))} /></FormField>
          <FormButton className="w-full bg-[#0B3D2E]" color="primary" isLoading={mut.isPending} onPress={() => mut.mutate(form)}>Save</FormButton>
        </div>
      </SideSheet>
    </Shell>
  )
}

function RoutesSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [form, setForm] = useState({ name: '', code: '' })
  const listQ = useQuery({ queryKey: ['transport', 'routes'], queryFn: listTransportRoutes })
  const mut = useMutation({
    mutationFn: createTransportRoute,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transport', 'routes'] })
      toastSuccess('Route created')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  const columns = useMemo(
    () => [
      { accessorKey: 'name', header: 'Route' },
      { accessorKey: 'code', header: 'Code', Cell: ({ row }) => row.original.code || '—' },
      { accessorKey: 'stops_count', header: 'Stops', Cell: ({ row }) => row.original.stops_count ?? 0 },
      { accessorKey: 'student_routes_count', header: 'Students', Cell: ({ row }) => row.original.student_routes_count ?? 0 },
    ],
    [],
  )
  return (
    <Shell onAdd={() => sheet.onOpen()} addLabel="Add route" loading={listQ.isLoading} onRefresh={() => listQ.refetch()}>
      <DataTable columns={columns} data={listQ.data?.routes || []} emptyMessage="No routes." />
      <SideSheet isOpen={sheet.isOpen} onOpenChange={sheet.onOpenChange} title="New route" size="md">
        <div className="space-y-3">
          <FormField label="Name" required><FormInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></FormField>
          <FormField label="Code"><FormInput value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} /></FormField>
          <FormButton className="w-full bg-[#0B3D2E]" color="primary" isLoading={mut.isPending} onPress={() => mut.mutate(form)}>Save</FormButton>
        </div>
      </SideSheet>
    </Shell>
  )
}

function StopsSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const routesQ = useQuery({ queryKey: ['transport', 'routes'], queryFn: listTransportRoutes })
  const listQ = useQuery({ queryKey: ['transport', 'stops'], queryFn: () => listTransportStops() })
  const [form, setForm] = useState({ route_id: '', name: '', sequence: '0', pickup_time: '', drop_time: '' })
  const mut = useMutation({
    mutationFn: createTransportStop,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transport'] })
      toastSuccess('Stop added')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  const columns = useMemo(
    () => [
      { accessorKey: 'route', header: 'Route', Cell: ({ row }) => row.original.route?.name || '—' },
      { accessorKey: 'name', header: 'Stop' },
      { accessorKey: 'sequence', header: 'Seq' },
      { accessorKey: 'pickup_time', header: 'Pickup', Cell: ({ row }) => row.original.pickup_time || '—' },
      { accessorKey: 'drop_time', header: 'Drop', Cell: ({ row }) => row.original.drop_time || '—' },
    ],
    [],
  )
  return (
    <Shell onAdd={() => sheet.onOpen()} addLabel="Add stop" loading={listQ.isLoading} onRefresh={() => listQ.refetch()}>
      <DataTable columns={columns} data={listQ.data?.stops || []} emptyMessage="No stops." />
      <SideSheet isOpen={sheet.isOpen} onOpenChange={sheet.onOpenChange} title="Add stop" size="md">
        <div className="space-y-3">
          <FormField label="Route" required>
            <FormSelect
              options={(routesQ.data?.routes || []).map((r) => ({ value: String(r.id), label: r.name }))}
              value={form.route_id}
              onChange={(v) => setForm((f) => ({ ...f, route_id: v }))}
            />
          </FormField>
          <FormField label="Stop name" required><FormInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></FormField>
          <FormField label="Sequence"><FormInput type="number" value={form.sequence} onChange={(e) => setForm((f) => ({ ...f, sequence: e.target.value }))} /></FormField>
          <FormField label="Pickup time"><FormInput type="time" value={form.pickup_time} onChange={(e) => setForm((f) => ({ ...f, pickup_time: e.target.value }))} /></FormField>
          <FormField label="Drop time"><FormInput type="time" value={form.drop_time} onChange={(e) => setForm((f) => ({ ...f, drop_time: e.target.value }))} /></FormField>
          <FormButton
            className="w-full bg-[#0B3D2E]"
            color="primary"
            isLoading={mut.isPending}
            onPress={() =>
              mut.mutate({
                route_id: Number(form.route_id),
                name: form.name,
                sequence: Number(form.sequence || 0),
                pickup_time: form.pickup_time || null,
                drop_time: form.drop_time || null,
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

function AllocationsSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const studentsQ = useQuery({
    queryKey: ['students', 'ops-transport'],
    queryFn: () => listStudents({ per_page: 100, status: 'active' }),
    staleTime: 60_000,
  })
  const routesQ = useQuery({ queryKey: ['transport', 'routes'], queryFn: listTransportRoutes })
  const stopsQ = useQuery({ queryKey: ['transport', 'stops'], queryFn: () => listTransportStops() })
  const listQ = useQuery({ queryKey: ['transport', 'allocations'], queryFn: listTransportAllocations })
  const [form, setForm] = useState({ student_id: '', route_id: '', stop_id: '', direction: 'both' })
  const mut = useMutation({
    mutationFn: createTransportAllocation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transport'] })
      toastSuccess('Student allocated')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  const delMut = useMutation({
    mutationFn: deleteTransportAllocation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transport', 'allocations'] })
      toastSuccess('Allocation removed')
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  const stopOptions = (stopsQ.data?.stops || [])
    .filter((s) => !form.route_id || String(s.route_id) === form.route_id)
    .map((s) => ({ value: String(s.id), label: s.name }))

  const columns = useMemo(
    () => [
      { accessorKey: 'student', header: 'Student', Cell: ({ row }) => studentLabel(row.original.student) },
      { accessorKey: 'route', header: 'Route', Cell: ({ row }) => row.original.route?.name || '—' },
      { accessorKey: 'stop', header: 'Stop', Cell: ({ row }) => row.original.stop?.name || '—' },
      { accessorKey: 'direction', header: 'Direction' },
      {
        id: 'actions',
        header: '',
        Cell: ({ row }) => (
          <FormButton size="sm" appearance="flat" color="danger" onPress={() => delMut.mutate(row.original.id)}>
            Remove
          </FormButton>
        ),
      },
    ],
    [delMut],
  )
  return (
    <Shell onAdd={() => sheet.onOpen()} addLabel="Allocate student" loading={listQ.isLoading} onRefresh={() => listQ.refetch()}>
      <DataTable columns={columns} data={listQ.data?.allocations || []} emptyMessage="No allocations." />
      <SideSheet isOpen={sheet.isOpen} onOpenChange={sheet.onOpenChange} title="Allocate student" size="md">
        <div className="space-y-3">
          <FormField label="Student" required>
            <FormSelect
              options={(studentsQ.data?.students || []).map((s) => ({ value: String(s.id), label: studentLabel(s) }))}
              value={form.student_id}
              onChange={(v) => setForm((f) => ({ ...f, student_id: v }))}
            />
          </FormField>
          <FormField label="Route" required>
            <FormSelect
              options={(routesQ.data?.routes || []).map((r) => ({ value: String(r.id), label: r.name }))}
              value={form.route_id}
              onChange={(v) => setForm((f) => ({ ...f, route_id: v, stop_id: '' }))}
            />
          </FormField>
          <FormField label="Stop">
            <FormSelect options={stopOptions} value={form.stop_id} onChange={(v) => setForm((f) => ({ ...f, stop_id: v }))} placeholder="Optional" />
          </FormField>
          <FormField label="Direction">
            <FormSelect
              options={[
                { value: 'both', label: 'Both ways' },
                { value: 'to', label: 'To school' },
                { value: 'from', label: 'From school' },
              ]}
              value={form.direction}
              onChange={(v) => setForm((f) => ({ ...f, direction: v }))}
            />
          </FormField>
          <FormButton
            className="w-full bg-[#0B3D2E]"
            color="primary"
            isLoading={mut.isPending}
            onPress={() =>
              mut.mutate({
                student_id: Number(form.student_id),
                route_id: Number(form.route_id),
                stop_id: form.stop_id ? Number(form.stop_id) : null,
                direction: form.direction,
              })
            }
          >
            Save allocation
          </FormButton>
        </div>
      </SideSheet>
    </Shell>
  )
}

function MaintenanceSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const vehiclesQ = useQuery({ queryKey: ['transport', 'vehicles'], queryFn: listVehicles })
  const listQ = useQuery({ queryKey: ['transport', 'maintenance'], queryFn: listVehicleMaintenance })
  const [form, setForm] = useState({
    vehicle_id: '', serviced_on: new Date().toISOString().slice(0, 10),
    type: 'service', description: '', cost: '', vendor: '', next_service_on: '',
  })
  const mut = useMutation({
    mutationFn: createVehicleMaintenance,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transport'] })
      toastSuccess('Maintenance recorded')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  const columns = useMemo(
    () => [
      { accessorKey: 'vehicle', header: 'Vehicle', Cell: ({ row }) => row.original.vehicle?.plate_number || row.original.vehicle?.name || '—' },
      { accessorKey: 'serviced_on', header: 'Date', Cell: ({ row }) => String(row.original.serviced_on || '').slice(0, 10) },
      { accessorKey: 'type', header: 'Type' },
      { accessorKey: 'description', header: 'Description', Cell: ({ row }) => row.original.description || '—' },
      { accessorKey: 'cost', header: 'Cost (TZS)', Cell: ({ row }) => money(row.original.cost) },
      { accessorKey: 'next_service_on', header: 'Next', Cell: ({ row }) => String(row.original.next_service_on || '').slice(0, 10) || '—' },
    ],
    [],
  )
  return (
    <Shell onAdd={() => sheet.onOpen()} addLabel="Log maintenance" loading={listQ.isLoading} onRefresh={() => listQ.refetch()}>
      <DataTable columns={columns} data={listQ.data?.maintenances || []} emptyMessage="No maintenance records." />
      <SideSheet isOpen={sheet.isOpen} onOpenChange={sheet.onOpenChange} title="Vehicle maintenance" size="md">
        <div className="space-y-3">
          <FormField label="Vehicle" required>
            <FormSelect
              options={(vehiclesQ.data?.vehicles || []).map((v) => ({
                value: String(v.id),
                label: `${v.plate_number}${v.name ? ` · ${v.name}` : ''}`,
              }))}
              value={form.vehicle_id}
              onChange={(v) => setForm((f) => ({ ...f, vehicle_id: v }))}
            />
          </FormField>
          <FormField label="Service date" required><FormInput type="date" value={form.serviced_on} onChange={(e) => setForm((f) => ({ ...f, serviced_on: e.target.value }))} /></FormField>
          <FormField label="Type">
            <FormSelect
              options={[
                { value: 'service', label: 'Service' },
                { value: 'repair', label: 'Repair' },
                { value: 'inspection', label: 'Inspection' },
              ]}
              value={form.type}
              onChange={(v) => setForm((f) => ({ ...f, type: v }))}
            />
          </FormField>
          <FormField label="Description"><FormInput value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></FormField>
          <FormField label="Cost (TZS)"><FormInput type="number" value={form.cost} onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))} /></FormField>
          <FormField label="Vendor"><FormInput value={form.vendor} onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))} /></FormField>
          <FormField label="Next service"><FormInput type="date" value={form.next_service_on} onChange={(e) => setForm((f) => ({ ...f, next_service_on: e.target.value }))} /></FormField>
          <FormButton
            className="w-full bg-[#0B3D2E]"
            color="primary"
            isLoading={mut.isPending}
            onPress={() =>
              mut.mutate({
                vehicle_id: Number(form.vehicle_id),
                serviced_on: form.serviced_on,
                type: form.type,
                description: form.description || null,
                cost: form.cost ? Number(form.cost) : 0,
                vendor: form.vendor || null,
                next_service_on: form.next_service_on || null,
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

function FeesSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const routesQ = useQuery({ queryKey: ['transport', 'routes'], queryFn: listTransportRoutes })
  const listQ = useQuery({ queryKey: ['transport', 'fees'], queryFn: listTransportFees })
  const [form, setForm] = useState({ title: '', amount: '', route_id: '', period: 'term', status: 'active' })
  const mut = useMutation({
    mutationFn: createTransportFee,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transport', 'fees'] })
      toastSuccess('Fee created')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  const columns = useMemo(
    () => [
      { accessorKey: 'title', header: 'Title' },
      { accessorKey: 'route', header: 'Route', Cell: ({ row }) => row.original.route?.name || 'All routes' },
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
      <DataTable columns={columns} data={listQ.data?.fees || []} emptyMessage="No transport fees." />
      <SideSheet isOpen={sheet.isOpen} onOpenChange={sheet.onOpenChange} title="Transport fee" size="md">
        <div className="space-y-3">
          <FormField label="Title" required><FormInput value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></FormField>
          <FormField label="Amount (TZS)" required><FormInput type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} /></FormField>
          <FormField label="Route">
            <FormSelect
              options={(routesQ.data?.routes || []).map((r) => ({ value: String(r.id), label: r.name }))}
              value={form.route_id}
              onChange={(v) => setForm((f) => ({ ...f, route_id: v }))}
              placeholder="All routes"
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
                route_id: form.route_id ? Number(form.route_id) : null,
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

function GpsPlaceholder() {
  return (
    <Card className="border border-dashed border-slate-300 shadow-none">
      <CardBody className="py-10 text-center">
        <p className="text-sm font-semibold text-slate-800">GPS tracking</p>
        <p className="mt-1 text-sm text-slate-500">
          Live vehicle GPS is planned for a future release. Fleet, routes and allocations are available today.
        </p>
      </CardBody>
    </Card>
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

export default function TransportWorkspace() {
  const { pathname } = useLocation()
  const meta = META[pathname] || META['/transport']
  let body
  switch (meta.section) {
    case 'overview': body = <Overview />; break
    case 'vehicles': body = <VehiclesSection />; break
    case 'drivers': body = <DriversSection />; break
    case 'routes': body = <RoutesSection />; break
    case 'stops': body = <StopsSection />; break
    case 'allocations': body = <AllocationsSection />; break
    case 'maintenance': body = <MaintenanceSection />; break
    case 'fees': body = <FeesSection />; break
    case 'gps': body = <GpsPlaceholder />; break
    default: body = <Overview />
  }
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title={meta.title}
          description={meta.desc}
          breadcrumbs={[{ label: 'Ops', href: '/inventory' }, { label: 'Transport', href: '/transport' }, { label: meta.title }]}
        />
        {body}
      </div>
    </DashboardLayout>
  )
}
