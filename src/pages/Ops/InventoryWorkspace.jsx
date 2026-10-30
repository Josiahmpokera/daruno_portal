import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardBody, CardHeader, Chip, Spinner, useDisclosure } from '@heroui/react'
import {
  AlertTriangle,
  Boxes,
  Building2,
  ClipboardList,
  Package,
  Plus,
  RefreshCw,
  ShoppingCart,
  Truck,
  Warehouse,
} from 'lucide-react'
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
  createInvAsset,
  createInvCategory,
  createInvSupplier,
  createPurchaseOrder,
  createStockItem,
  createStockMovement,
  getInvReports,
  listInvAlerts,
  listInvAssets,
  listInvCategories,
  listInvSuppliers,
  listPurchaseOrders,
  listStockItems,
  listStockMovements,
  updateInvAsset,
  updatePurchaseOrder,
  updateStockItem,
} from '../../api/domain.js'
import { SectionSkeleton, ValueSkeleton } from '../../components/Loading'

const money = (n) =>
  Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })

const META = {
  '/inventory': { title: 'Inventory', section: 'overview', desc: 'Assets, stock, suppliers and purchase orders' },
  '/inventory/assets': { title: 'Assets', section: 'assets', desc: 'Fixed assets register' },
  '/inventory/categories': { title: 'Categories', section: 'categories', desc: 'Asset and stock categories' },
  '/inventory/suppliers': { title: 'Suppliers', section: 'suppliers', desc: 'Vendors and suppliers' },
  '/inventory/stock-in': { title: 'Stock In', section: 'stock-in', desc: 'Receive stock into inventory' },
  '/inventory/stock-out': { title: 'Stock Out', section: 'stock-out', desc: 'Issue stock from inventory' },
  '/inventory/purchase-orders': { title: 'Purchase Orders', section: 'pos', desc: 'Create and receive purchase orders' },
  '/inventory/alerts': { title: 'Low Stock Alerts', section: 'alerts', desc: 'Items at or below reorder level' },
  '/inventory/reports': { title: 'Inventory Reports', section: 'reports', desc: 'Stock value and movement summary' },
}

function InvStatCard({ label, value, hint, icon: Icon, tone, onPress }) {
  return (
    <Card
      isPressable={Boolean(onPress)}
      className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)] transition-colors hover:border-[#12544f]/30"
      onPress={onPress}
    >
      <CardBody className="flex flex-row items-center gap-2.5 p-2.5">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone}`}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[10px] font-medium uppercase tracking-wide text-slate-400">
            {label}
          </p>
          <p className="truncate text-base font-semibold tabular-nums text-slate-900">
            {value}
          </p>
          {hint ? (
            <p className="truncate text-[10px] text-slate-500">{hint}</p>
          ) : null}
        </div>
      </CardBody>
    </Card>
  )
}

function Overview() {
  const navigate = useNavigate()
  const q = useQuery({
    queryKey: ['inventory', 'reports'],
    queryFn: getInvReports,
    staleTime: 30_000,
  })
  const s = q.data?.summary || {}
  const loading = q.isLoading

  const stats = [
    {
      label: 'Stock items',
      value: loading ? <ValueSkeleton /> : String(s.stock_items ?? 0),
      hint: 'Active SKUs',
      icon: Package,
      tone: 'bg-emerald-50 text-emerald-700',
      path: '/inventory/stock-in',
    },
    {
      label: 'Assets',
      value: loading ? <ValueSkeleton /> : String(s.assets ?? 0),
      hint: 'Fixed assets',
      icon: Building2,
      tone: 'bg-sky-50 text-sky-700',
      path: '/inventory/assets',
    },
    {
      label: 'Stock value',
      value: loading ? <ValueSkeleton /> : `TZS ${money(s.stock_value)}`,
      hint: 'On-hand inventory',
      icon: Warehouse,
      tone: 'bg-violet-50 text-violet-700',
      path: '/inventory/reports',
    },
    {
      label: 'Low stock',
      value: loading ? <ValueSkeleton /> : String(s.low_stock_count ?? 0),
      hint: 'Below reorder level',
      icon: AlertTriangle,
      tone: 'bg-rose-50 text-rose-700',
      path: '/inventory/alerts',
    },
    {
      label: 'Open POs',
      value: loading ? <ValueSkeleton /> : String(s.open_purchase_orders ?? 0),
      hint: 'Draft or ordered',
      icon: ShoppingCart,
      tone: 'bg-amber-50 text-amber-800',
      path: '/inventory/purchase-orders',
    },
  ]

  const modules = [
    { t: 'Assets', d: 'Fixed assets register', p: '/inventory/assets', icon: Building2 },
    { t: 'Categories', d: 'Asset and stock categories', p: '/inventory/categories', icon: Boxes },
    { t: 'Suppliers', d: `${s.suppliers ?? 0} vendors on file`, p: '/inventory/suppliers', icon: Truck },
    { t: 'Stock In', d: 'Receive stock into inventory', p: '/inventory/stock-in', icon: Package },
    { t: 'Stock Out', d: 'Issue stock from inventory', p: '/inventory/stock-out', icon: Package },
    { t: 'Purchase Orders', d: 'Create and receive POs', p: '/inventory/purchase-orders', icon: ShoppingCart },
    { t: 'Low Stock Alerts', d: 'Items at reorder level', p: '/inventory/alerts', icon: AlertTriangle },
    { t: 'Inventory Reports', d: 'Value & movement summary', p: '/inventory/reports', icon: ClipboardList },
  ]

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">At a glance</h2>
            <p className="text-xs text-slate-500">Live inventory statistics</p>
          </div>
          {q.isFetching && !loading ? (
            <Spinner size="sm" color="success" />
          ) : null}
        </div>
        <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 xl:grid-cols-5">
          {stats.map((stat) => (
            <InvStatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              hint={stat.hint}
              icon={stat.icon}
              tone={stat.tone}
              onPress={() => navigate(stat.path)}
            />
          ))}
        </div>
        {q.isError ? (
          <p className="mt-2 text-xs text-rose-600">
            Could not load stats. {q.error?.message || ''}
          </p>
        ) : null}
      </div>

      <div>
        <div className="mb-2">
          <h2 className="text-sm font-semibold text-slate-900">Modules</h2>
          <p className="text-xs text-slate-500">
            Jump into stock, assets and purchase orders
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((c) => {
            const Icon = c.icon
            return (
              <Card
                key={c.p}
                isPressable
                className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)] transition-colors hover:border-[#12544f]/40"
                onPress={() => navigate(c.p)}
              >
                <CardBody className="flex flex-row items-start gap-3 p-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#12544f]/8 text-[#12544f]">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900">{c.t}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">{c.d}</p>
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function CategoriesSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [form, setForm] = useState({ name: '', code: '' })
  const listQ = useQuery({ queryKey: ['inventory', 'categories'], queryFn: listInvCategories })
  const mut = useMutation({
    mutationFn: createInvCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', 'categories'] })
      toastSuccess('Category created')
      sheet.onClose()
      setForm({ name: '', code: '' })
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  const columns = useMemo(
    () => [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'code', header: 'Code', Cell: ({ row }) => row.original.code || '—' },
    ],
    [],
  )
  return (
    <SectionShell onAdd={() => sheet.onOpen()} addLabel="Add category" onRefresh={() => listQ.refetch()} loading={listQ.isLoading}>
      <DataTable columns={columns} data={listQ.data?.categories || []} emptyMessage="No categories yet." />
      <SideSheet isOpen={sheet.isOpen} onOpenChange={sheet.onOpenChange} title="New category" size="md">
        <div className="space-y-3">
          <FormField label="Name" required><FormInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></FormField>
          <FormField label="Code"><FormInput value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} /></FormField>
          <FormButton className="w-full bg-[#12544f]" color="primary" isLoading={mut.isPending} onPress={() => mut.mutate(form)}>Save</FormButton>
        </div>
      </SideSheet>
    </SectionShell>
  )
}

function SuppliersSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' })
  const listQ = useQuery({ queryKey: ['inventory', 'suppliers'], queryFn: listInvSuppliers })
  const mut = useMutation({
    mutationFn: createInvSupplier,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', 'suppliers'] })
      toastSuccess('Supplier created')
      sheet.onClose()
      setForm({ name: '', phone: '', email: '', address: '' })
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  const columns = useMemo(
    () => [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'phone', header: 'Phone', Cell: ({ row }) => row.original.phone || '—' },
      { accessorKey: 'email', header: 'Email', Cell: ({ row }) => row.original.email || '—' },
      { accessorKey: 'address', header: 'Address', Cell: ({ row }) => row.original.address || '—' },
    ],
    [],
  )
  return (
    <SectionShell onAdd={() => sheet.onOpen()} addLabel="Add supplier" onRefresh={() => listQ.refetch()} loading={listQ.isLoading}>
      <DataTable columns={columns} data={listQ.data?.suppliers || []} emptyMessage="No suppliers yet." />
      <SideSheet isOpen={sheet.isOpen} onOpenChange={sheet.onOpenChange} title="New supplier" size="md">
        <div className="space-y-3">
          <FormField label="Name" required><FormInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></FormField>
          <FormField label="Phone"><FormInput value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></FormField>
          <FormField label="Email"><FormInput value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></FormField>
          <FormField label="Address"><FormTextarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} /></FormField>
          <FormButton className="w-full bg-[#12544f]" color="primary" isLoading={mut.isPending} onPress={() => mut.mutate(form)}>Save</FormButton>
        </div>
      </SideSheet>
    </SectionShell>
  )
}

function AssetsSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const catsQ = useQuery({ queryKey: ['inventory', 'categories'], queryFn: listInvCategories })
  const suppliersQ = useQuery({ queryKey: ['inventory', 'suppliers'], queryFn: listInvSuppliers })
  const [form, setForm] = useState({
    name: '', code: '', serial_number: '', category_id: '', vendor_id: '',
    purchase_date: '', purchase_price: '', location: '', condition: 'good', status: 'active',
  })
  const listQ = useQuery({ queryKey: ['inventory', 'assets'], queryFn: () => listInvAssets({ per_page: 100 }) })
  const mut = useMutation({
    mutationFn: createInvAsset,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', 'assets'] })
      toastSuccess('Asset registered')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  const columns = useMemo(
    () => [
      { accessorKey: 'name', header: 'Asset' },
      { accessorKey: 'code', header: 'Code', Cell: ({ row }) => row.original.code || '—' },
      { accessorKey: 'category', header: 'Category', Cell: ({ row }) => row.original.category?.name || '—' },
      { accessorKey: 'serial_number', header: 'Serial', Cell: ({ row }) => row.original.serial_number || '—' },
      { accessorKey: 'purchase_price', header: 'Price (TZS)', Cell: ({ row }) => money(row.original.purchase_price) },
      { accessorKey: 'location', header: 'Location', Cell: ({ row }) => row.original.location || '—' },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => <Chip size="sm" variant="flat">{row.original.status}</Chip>,
      },
    ],
    [],
  )
  return (
    <SectionShell onAdd={() => sheet.onOpen()} addLabel="Register asset" onRefresh={() => listQ.refetch()} loading={listQ.isLoading}>
      <DataTable columns={columns} data={listQ.data?.assets || []} emptyMessage="No assets registered." />
      <SideSheet isOpen={sheet.isOpen} onOpenChange={sheet.onOpenChange} title="Register asset" size="md">
        <div className="space-y-3">
          <FormField label="Name" required><FormInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></FormField>
          <FormField label="Code"><FormInput value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} /></FormField>
          <FormField label="Serial number"><FormInput value={form.serial_number} onChange={(e) => setForm((f) => ({ ...f, serial_number: e.target.value }))} /></FormField>
          <FormField label="Category">
            <FormSelect
              options={(catsQ.data?.categories || []).map((c) => ({ value: String(c.id), label: c.name }))}
              value={form.category_id}
              onChange={(v) => setForm((f) => ({ ...f, category_id: v }))}
              placeholder="Optional"
            />
          </FormField>
          <FormField label="Supplier">
            <FormSelect
              options={(suppliersQ.data?.suppliers || []).map((s) => ({ value: String(s.id), label: s.name }))}
              value={form.vendor_id}
              onChange={(v) => setForm((f) => ({ ...f, vendor_id: v }))}
              placeholder="Optional"
            />
          </FormField>
          <FormField label="Purchase price"><FormInput type="number" value={form.purchase_price} onChange={(e) => setForm((f) => ({ ...f, purchase_price: e.target.value }))} /></FormField>
          <FormField label="Location"><FormInput value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} /></FormField>
          <FormButton
            className="w-full bg-[#12544f]"
            color="primary"
            isLoading={mut.isPending}
            onPress={() =>
              mut.mutate({
                ...form,
                category_id: form.category_id ? Number(form.category_id) : null,
                vendor_id: form.vendor_id ? Number(form.vendor_id) : null,
                purchase_price: form.purchase_price ? Number(form.purchase_price) : null,
              })
            }
          >
            Save asset
          </FormButton>
        </div>
      </SideSheet>
    </SectionShell>
  )
}

function StockMovementSection({ type }) {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const itemSheet = useDisclosure()
  const itemsQ = useQuery({ queryKey: ['inventory', 'stock-items'], queryFn: listStockItems })
  const listQ = useQuery({
    queryKey: ['inventory', 'movements', type],
    queryFn: () => listStockMovements({ type, per_page: 50 }),
  })
  const [form, setForm] = useState({
    stock_item_id: '', quantity: '', unit_cost: '', reference: '', notes: '',
    occurred_on: new Date().toISOString().slice(0, 10),
  })
  const [itemForm, setItemForm] = useState({
    name: '', code: '', unit: 'pcs', reorder_level: '5', unit_cost: '0',
  })

  const moveMut = useMutation({
    mutationFn: createStockMovement,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      toastSuccess(type === 'in' ? 'Stock received' : 'Stock issued')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  const itemMut = useMutation({
    mutationFn: createStockItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', 'stock-items'] })
      toastSuccess('Stock item created')
      itemSheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })

  const columns = useMemo(
    () => [
      { accessorKey: 'reference', header: 'Ref', Cell: ({ row }) => <span className="font-mono text-xs">{row.original.reference}</span> },
      { accessorKey: 'item', header: 'Item', Cell: ({ row }) => row.original.stock_item?.name || '—' },
      { accessorKey: 'quantity', header: 'Qty' },
      { accessorKey: 'occurred_on', header: 'Date', Cell: ({ row }) => String(row.original.occurred_on || '').slice(0, 10) },
      { accessorKey: 'notes', header: 'Notes', Cell: ({ row }) => row.original.notes || '—' },
    ],
    [],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2">
        <FormButton appearance="bordered" onPress={() => itemSheet.onOpen()}>New stock item</FormButton>
        <FormButton appearance="bordered" startContent={<RefreshCw className="h-4 w-4" />} onPress={() => listQ.refetch()}>Refresh</FormButton>
        <FormButton className="bg-[#12544f]" color="primary" startContent={<Plus className="h-4 w-4" />} onPress={() => sheet.onOpen()}>
          {type === 'in' ? 'Record stock in' : 'Record stock out'}
        </FormButton>
      </div>
      {itemsQ.data?.stock_items?.length > 0 && (
        <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
          <CardHeader className="pb-1"><h3 className="text-sm font-semibold">Stock levels</h3></CardHeader>
          <CardBody className="pt-0 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500">
                  <th className="py-1 pr-3">Item</th>
                  <th className="py-1 pr-3">On hand</th>
                  <th className="py-1 pr-3">Reorder</th>
                  <th className="py-1">Unit cost</th>
                </tr>
              </thead>
              <tbody>
                {(itemsQ.data?.stock_items || []).map((i) => (
                  <tr key={i.id} className="border-t border-slate-50">
                    <td className="py-1.5 pr-3">{i.name}</td>
                    <td className={`py-1.5 pr-3 font-medium ${i.is_low ? 'text-rose-600' : ''}`}>{i.quantity_on_hand} {i.unit || ''}</td>
                    <td className="py-1.5 pr-3">{i.reorder_level}</td>
                    <td className="py-1.5">{money(i.unit_cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
      {listQ.isLoading ? <SectionSkeleton /> : (
        <DataTable columns={columns} data={listQ.data?.movements || []} emptyMessage="No movements yet." />
      )}
      <SideSheet isOpen={sheet.isOpen} onOpenChange={sheet.onOpenChange} title={type === 'in' ? 'Stock in' : 'Stock out'} size="md">
        <div className="space-y-3">
          <FormField label="Stock item" required>
            <FormSelect
              options={(itemsQ.data?.stock_items || []).map((i) => ({
                value: String(i.id),
                label: `${i.name} (${i.quantity_on_hand} on hand)`,
              }))}
              value={form.stock_item_id}
              onChange={(v) => setForm((f) => ({ ...f, stock_item_id: v }))}
              placeholder="Select item"
            />
          </FormField>
          <FormField label="Quantity" required><FormInput type="number" min="1" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} /></FormField>
          {type === 'in' && (
            <FormField label="Unit cost"><FormInput type="number" value={form.unit_cost} onChange={(e) => setForm((f) => ({ ...f, unit_cost: e.target.value }))} /></FormField>
          )}
          <FormField label="Date"><FormInput type="date" value={form.occurred_on} onChange={(e) => setForm((f) => ({ ...f, occurred_on: e.target.value }))} /></FormField>
          <FormField label="Reference"><FormInput value={form.reference} onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} /></FormField>
          <FormField label="Notes"><FormTextarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></FormField>
          <FormButton
            className="w-full bg-[#12544f]"
            color="primary"
            isLoading={moveMut.isPending}
            onPress={() =>
              moveMut.mutate({
                type,
                stock_item_id: Number(form.stock_item_id),
                quantity: Number(form.quantity),
                unit_cost: form.unit_cost ? Number(form.unit_cost) : undefined,
                occurred_on: form.occurred_on,
                reference: form.reference || null,
                notes: form.notes || null,
              })
            }
          >
            Post movement
          </FormButton>
        </div>
      </SideSheet>
      <SideSheet isOpen={itemSheet.isOpen} onOpenChange={itemSheet.onOpenChange} title="New stock item" size="md">
        <div className="space-y-3">
          <FormField label="Name" required><FormInput value={itemForm.name} onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))} /></FormField>
          <FormField label="Code"><FormInput value={itemForm.code} onChange={(e) => setItemForm((f) => ({ ...f, code: e.target.value }))} /></FormField>
          <FormField label="Unit"><FormInput value={itemForm.unit} onChange={(e) => setItemForm((f) => ({ ...f, unit: e.target.value }))} /></FormField>
          <FormField label="Reorder level"><FormInput type="number" value={itemForm.reorder_level} onChange={(e) => setItemForm((f) => ({ ...f, reorder_level: e.target.value }))} /></FormField>
          <FormField label="Unit cost"><FormInput type="number" value={itemForm.unit_cost} onChange={(e) => setItemForm((f) => ({ ...f, unit_cost: e.target.value }))} /></FormField>
          <FormButton
            className="w-full bg-[#12544f]"
            color="primary"
            isLoading={itemMut.isPending}
            onPress={() =>
              itemMut.mutate({
                ...itemForm,
                reorder_level: Number(itemForm.reorder_level || 0),
                unit_cost: Number(itemForm.unit_cost || 0),
              })
            }
          >
            Save item
          </FormButton>
        </div>
      </SideSheet>
    </div>
  )
}

function POSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const suppliersQ = useQuery({ queryKey: ['inventory', 'suppliers'], queryFn: listInvSuppliers })
  const itemsQ = useQuery({ queryKey: ['inventory', 'stock-items'], queryFn: listStockItems })
  const listQ = useQuery({ queryKey: ['inventory', 'pos'], queryFn: listPurchaseOrders })
  const [form, setForm] = useState({
    vendor_id: '', description: '', quantity: '1', unit_price: '', stock_item_id: '',
  })
  const [lines, setLines] = useState([])

  const createMut = useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      toastSuccess('Purchase order created')
      sheet.onClose()
      setLines([])
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  const statusMut = useMutation({
    mutationFn: ({ id, status }) => updatePurchaseOrder(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      toastSuccess('PO updated')
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })

  const columns = useMemo(
    () => [
      { accessorKey: 'number', header: 'PO #', Cell: ({ row }) => <span className="font-mono text-xs font-semibold">{row.original.number}</span> },
      { accessorKey: 'vendor', header: 'Supplier', Cell: ({ row }) => row.original.vendor?.name || '—' },
      { accessorKey: 'total_amount', header: 'Total (TZS)', Cell: ({ row }) => money(row.original.total_amount) },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => <Chip size="sm" variant="flat" color={row.original.status === 'received' ? 'success' : 'warning'}>{row.original.status}</Chip>,
      },
      {
        id: 'actions',
        header: '',
        Cell: ({ row }) => {
          const s = row.original.status
          if (s === 'draft') {
            return (
              <FormButton size="sm" appearance="flat" onPress={() => statusMut.mutate({ id: row.original.id, status: 'ordered' })}>
                Mark ordered
              </FormButton>
            )
          }
          if (s === 'ordered') {
            return (
              <FormButton size="sm" appearance="flat" color="success" onPress={() => statusMut.mutate({ id: row.original.id, status: 'received' })}>
                Receive
              </FormButton>
            )
          }
          return null
        },
      },
    ],
    [statusMut],
  )

  return (
    <SectionShell onAdd={() => sheet.onOpen()} addLabel="New PO" onRefresh={() => listQ.refetch()} loading={listQ.isLoading}>
      <DataTable columns={columns} data={listQ.data?.purchase_orders || []} emptyMessage="No purchase orders." />
      <SideSheet isOpen={sheet.isOpen} onOpenChange={sheet.onOpenChange} title="Create purchase order" size="lg">
        <div className="space-y-3">
          <FormField label="Supplier">
            <FormSelect
              options={(suppliersQ.data?.suppliers || []).map((s) => ({ value: String(s.id), label: s.name }))}
              value={form.vendor_id}
              onChange={(v) => setForm((f) => ({ ...f, vendor_id: v }))}
              placeholder="Optional"
            />
          </FormField>
          <div className="rounded-lg border border-slate-200 p-3 space-y-2">
            <p className="text-xs font-semibold uppercase text-slate-500">Line items</p>
            <FormSelect
              options={(itemsQ.data?.stock_items || []).map((i) => ({ value: String(i.id), label: i.name }))}
              value={form.stock_item_id}
              onChange={(v) => {
                const item = (itemsQ.data?.stock_items || []).find((i) => String(i.id) === v)
                setForm((f) => ({
                  ...f,
                  stock_item_id: v,
                  description: item?.name || f.description,
                  unit_price: item ? String(item.unit_cost || '') : f.unit_price,
                }))
              }}
              placeholder="Stock item"
            />
            <FormInput placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <FormInput type="number" placeholder="Qty" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
              <FormInput type="number" placeholder="Unit price" value={form.unit_price} onChange={(e) => setForm((f) => ({ ...f, unit_price: e.target.value }))} />
            </div>
            <FormButton
              size="sm"
              appearance="bordered"
              onPress={() => {
                if (!form.description || !form.quantity || !form.unit_price) return
                setLines((prev) => [
                  ...prev,
                  {
                    description: form.description,
                    quantity: Number(form.quantity),
                    unit_price: Number(form.unit_price),
                    stock_item_id: form.stock_item_id ? Number(form.stock_item_id) : null,
                  },
                ])
                setForm((f) => ({ ...f, description: '', quantity: '1', unit_price: '', stock_item_id: '' }))
              }}
            >
              Add line
            </FormButton>
            {lines.map((l, i) => (
              <div key={i} className="flex justify-between text-sm border-b border-slate-50 py-1">
                <span>{l.description} × {l.quantity}</span>
                <span>{money(l.quantity * l.unit_price)}</span>
              </div>
            ))}
          </div>
          <FormButton
            className="w-full bg-[#12544f]"
            color="primary"
            isLoading={createMut.isPending}
            isDisabled={lines.length === 0}
            onPress={() =>
              createMut.mutate({
                vendor_id: form.vendor_id ? Number(form.vendor_id) : null,
                status: 'draft',
                items: lines,
              })
            }
          >
            Create PO
          </FormButton>
        </div>
      </SideSheet>
    </SectionShell>
  )
}

function AlertsSection() {
  const listQ = useQuery({ queryKey: ['inventory', 'alerts'], queryFn: listInvAlerts })
  const columns = useMemo(
    () => [
      { accessorKey: 'name', header: 'Item' },
      { accessorKey: 'quantity_on_hand', header: 'On hand' },
      { accessorKey: 'reorder_level', header: 'Reorder level' },
      { accessorKey: 'unit', header: 'Unit', Cell: ({ row }) => row.original.unit || '—' },
      {
        id: 'badge',
        header: '',
        Cell: () => <Chip size="sm" color="danger" variant="flat">Low stock</Chip>,
      },
    ],
    [],
  )
  return listQ.isLoading ? (
    <SectionSkeleton />
  ) : (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">{listQ.data?.summary?.low_stock_count ?? 0} item(s) at or below reorder level.</p>
      <DataTable columns={columns} data={listQ.data?.alerts || []} emptyMessage="All stock levels healthy." />
    </div>
  )
}

function ReportsSection() {
  const q = useQuery({ queryKey: ['inventory', 'reports'], queryFn: getInvReports })
  const s = q.data?.summary || {}
  if (q.isLoading) return <SectionSkeleton />
  const rows = [
    ['Stock items', s.stock_items],
    ['Assets', s.assets],
    ['Suppliers', s.suppliers],
    ['Stock value (TZS)', money(s.stock_value)],
    ['Asset value (TZS)', money(s.asset_value)],
    ['Open POs', s.open_purchase_orders],
    ['Low stock alerts', s.low_stock_count],
    ['Total stock in (qty)', s.total_stock_in],
    ['Total stock out (qty)', s.total_stock_out],
  ]
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map(([label, value]) => (
        <Card key={label} className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
          <CardBody className="py-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-lg font-semibold text-slate-900">{value ?? '—'}</p>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

function SectionShell({ children, onAdd, addLabel, onRefresh, loading }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        {onRefresh && (
          <FormButton appearance="bordered" startContent={<RefreshCw className="h-4 w-4" />} onPress={onRefresh}>Refresh</FormButton>
        )}
        {onAdd && (
          <FormButton className="bg-[#12544f]" color="primary" startContent={<Plus className="h-4 w-4" />} onPress={onAdd}>{addLabel}</FormButton>
        )}
      </div>
      {loading ? <SectionSkeleton /> : children}
    </div>
  )
}

export default function InventoryWorkspace() {
  const { pathname } = useLocation()
  const meta = META[pathname] || META['/inventory']
  let body
  switch (meta.section) {
    case 'overview': body = <Overview />; break
    case 'categories': body = <CategoriesSection />; break
    case 'suppliers': body = <SuppliersSection />; break
    case 'assets': body = <AssetsSection />; break
    case 'stock-in': body = <StockMovementSection type="in" />; break
    case 'stock-out': body = <StockMovementSection type="out" />; break
    case 'pos': body = <POSection />; break
    case 'alerts': body = <AlertsSection />; break
    case 'reports': body = <ReportsSection />; break
    default: body = <Overview />
  }
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title={meta.title}
          description={meta.desc}
          breadcrumbs={[{ label: 'Ops', href: '/inventory' }, { label: 'Inventory', href: '/inventory' }, { label: meta.title }]}
        />
        {body}
      </div>
    </DashboardLayout>
  )
}
