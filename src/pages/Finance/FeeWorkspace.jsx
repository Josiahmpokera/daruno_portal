import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Spinner,
  Switch,
  useDisclosure,
} from '@heroui/react'
import {
  ArrowLeft,
  Banknote,
  CircleAlert,
  FileSpreadsheet,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import PageHeader from '../../components/Layout/PageHeader.jsx'
import ModulePlaceholder from '../../components/Layout/ModulePlaceholder.jsx'
import SideSheet from '../../components/Layout/SideSheet.jsx'
import DataTable from '../../components/Tables/DataTable.jsx'
import RowActionsMenu from '../../components/Tables/RowActionsMenu.jsx'
import {
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  FormButton,
} from '../../components/Form'
import { toastSuccess, toastError } from '../../components/Toast'
import {
  listFeeCategories,
  createFeeCategory,
  listFeeStructures,
  createFeeStructure,
  listInvoices,
  generateInvoices,
  listPayments,
  createPayment,
  listPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  listStudentFees,
  getStudentFees,
  listYears,
  listClasses,
  listTerms,
  listStudents,
  getFinancialReports,
} from '../../api/domain.js'

const money = (n) =>
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

const statusColor = {
  paid: 'success',
  partial: 'warning',
  unpaid: 'danger',
  none: 'default',
  completed: 'success',
}

const METHOD_TYPES = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank' },
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' },
]

const sectionMeta = {
  '/finance': {
    title: 'Finance & Fees',
    description: 'Fee structure, billing, payment methods and student fee records',
    section: 'overview',
  },
  '/finance/structures': {
    title: 'Fee Structure',
    description: 'Categories and class/term fee lines',
    section: 'structures',
  },
  '/finance/billing': {
    title: 'Billing',
    description: 'Generate student invoices from active fee structures',
    section: 'billing',
  },
  '/finance/methods': {
    title: 'Payment Methods',
    description: 'Cash, bank, mobile money and other collection channels',
    section: 'methods',
  },
  '/finance/student-fees': {
    title: 'Student Fees',
    description: 'Per-student billed, paid and outstanding fee records',
    section: 'student-fees',
  },
  '/finance/invoices': {
    title: 'Invoices',
    description: 'All fee invoices for the school',
    section: 'invoices',
  },
  '/finance/payments': {
    title: 'Payments',
    description: 'Record and review fee payments',
    section: 'payments',
  },
}

function resolveSection(pathname) {
  if (pathname.startsWith('/finance/student-fees/')) {
    return {
      title: 'Student fee record',
      description: 'Invoices and payment history for this student',
      section: 'student-fee-detail',
    }
  }
  return (
    sectionMeta[pathname] || {
      title: 'Finance',
      description: '',
      section: 'placeholder',
    }
  )
}

function FinanceAnalyticsCard({ label, value, hint, icon: Icon, tone, onPress }) {
  return (
    <Card
      isPressable={Boolean(onPress)}
      className="border border-slate-200 shadow-none transition-colors hover:border-[#0B3D2E]/30"
      onPress={onPress}
    >
      <CardBody className="flex flex-row items-start gap-3 p-3.5">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-400">
            {label}
          </p>
          <p className="mt-0.5 truncate text-lg font-semibold tabular-nums text-slate-900">
            {value}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-slate-500">{hint}</p>
        </div>
      </CardBody>
    </Card>
  )
}

function OverviewPanel() {
  const navigate = useNavigate()

  const monthStart = useMemo(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
  }, [])
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const reportsQ = useQuery({
    queryKey: ['finance', 'overview-analytics', monthStart, today],
    queryFn: () => getFinancialReports({ from: monthStart, to: today }),
    staleTime: 30_000,
  })

  const summary = reportsQ.data?.summary || {}
  const loading = reportsQ.isLoading

  const analytics = [
    {
      label: 'Collections',
      value: loading ? '…' : `TZS ${money(summary.collections)}`,
      hint: 'Received this month',
      icon: Wallet,
      tone: 'bg-emerald-50 text-emerald-700',
      path: '/finance/payments',
    },
    {
      label: 'Outstanding',
      value: loading ? '…' : `TZS ${money(summary.outstanding)}`,
      hint: 'Open balances (all time)',
      icon: CircleAlert,
      tone: 'bg-rose-50 text-rose-700',
      path: '/finance/outstanding',
    },
    {
      label: 'Net collections',
      value: loading ? '…' : `TZS ${money(summary.net_collections)}`,
      hint: 'Collections minus refunds',
      icon: TrendingUp,
      tone: 'bg-sky-50 text-sky-700',
      path: '/finance/reports',
    },
    {
      label: 'Billed',
      value: loading ? '…' : `TZS ${money(summary.billed)}`,
      hint: 'Invoices issued this month',
      icon: FileSpreadsheet,
      tone: 'bg-amber-50 text-amber-800',
      path: '/finance/invoices',
    },
  ]

  const cards = [
    {
      title: 'Fee Structure',
      desc: 'Categories and amounts by class / term',
      path: '/finance/structures',
      icon: FileSpreadsheet,
    },
    {
      title: 'Billing',
      desc: 'Generate invoices from fee structure',
      path: '/finance/billing',
      icon: Receipt,
    },
    {
      title: 'Payment Methods',
      desc: 'Configure how parents pay (cash, M-Pesa…)',
      path: '/finance/methods',
      icon: Banknote,
    },
    {
      title: 'Student Fees',
      desc: 'See each learner’s fee payments & balances',
      path: '/finance/student-fees',
      icon: Wallet,
    },
    {
      title: 'Invoices',
      desc: 'Browse all invoices',
      path: '/finance/invoices',
      icon: FileSpreadsheet,
    },
    {
      title: 'Payments',
      desc: 'Record a new payment',
      path: '/finance/payments',
      icon: Banknote,
    },
    {
      title: 'Receipts',
      desc: 'Official receipts for completed payments',
      path: '/finance/receipts',
      icon: Receipt,
    },
    {
      title: 'Refunds',
      desc: 'Process fee refunds',
      path: '/finance/refunds',
      icon: RefreshCw,
    },
    {
      title: 'Discounts',
      desc: 'Post fee discounts to invoices',
      path: '/finance/discounts',
      icon: TrendingUp,
    },
    {
      title: 'Fines / Penalties',
      desc: 'Late fees and other penalties',
      path: '/finance/fines',
      icon: CircleAlert,
    },
    {
      title: 'Outstanding Fees',
      desc: 'Open balances and overdue invoices',
      path: '/finance/outstanding',
      icon: CircleAlert,
    },
    {
      title: 'Financial Reports',
      desc: 'Collections, refunds and period summary',
      path: '/finance/reports',
      icon: FileSpreadsheet,
    },
  ]

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">At a glance</h2>
            <p className="text-xs text-slate-500">
              Live fee analytics for this month
            </p>
          </div>
          {reportsQ.isFetching && !loading ? (
            <Spinner size="sm" color="success" />
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {analytics.map((a) => (
            <FinanceAnalyticsCard
              key={a.label}
              label={a.label}
              value={a.value}
              hint={a.hint}
              icon={a.icon}
              tone={a.tone}
              onPress={() => navigate(a.path)}
            />
          ))}
        </div>
        {reportsQ.isError ? (
          <p className="mt-2 text-xs text-rose-600">
            Could not load analytics. {reportsQ.error?.message || ''}
          </p>
        ) : null}
      </div>

      <div>
        <div className="mb-2">
          <h2 className="text-sm font-semibold text-slate-900">Modules</h2>
          <p className="text-xs text-slate-500">
            Jump into fee setup, collections and reports
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((c) => {
            const Icon = c.icon
            return (
              <Card
                key={c.path}
                isPressable
                className="border border-slate-200 shadow-none transition-colors hover:border-[#0B3D2E]/40"
                onPress={() => navigate(c.path)}
              >
                <CardBody className="flex flex-row items-start gap-3 p-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0B3D2E]/8 text-[#0B3D2E]">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {c.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">{c.desc}</p>
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

function StructuresPanel() {
  const qc = useQueryClient()
  const [error, setError] = useState('')
  const [catForm, setCatForm] = useState({ name: '', code: '' })
  const [structForm, setStructForm] = useState({
    academic_year_id: '',
    term_id: '',
    classroom_id: '',
    fee_category_id: '',
    amount: '',
    due_date: '',
  })

  const catsQ = useQuery({
    queryKey: ['finance', 'categories'],
    queryFn: listFeeCategories,
  })
  const structsQ = useQuery({
    queryKey: ['finance', 'structures'],
    queryFn: listFeeStructures,
  })
  const yearsQ = useQuery({ queryKey: ['academic', 'years'], queryFn: listYears })
  const classesQ = useQuery({
    queryKey: ['academic', 'classes'],
    queryFn: listClasses,
  })
  const termsQ = useQuery({ queryKey: ['academic', 'terms'], queryFn: listTerms })

  const categories = catsQ.data?.categories || []
  const structures = structsQ.data?.structures || []
  const years = yearsQ.data?.academic_years || []
  const classes = classesQ.data?.classes || []
  const terms = termsQ.data?.terms || []

  const catMut = useMutation({
    mutationFn: createFeeCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'categories'] })
      setCatForm({ name: '', code: '' })
      setError('')
      toastSuccess('Fee category added')
    },
    onError: (e) => {
      setError(e.message)
      toastError('Could not add category', e.message)
    },
  })

  const structMut = useMutation({
    mutationFn: createFeeStructure,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'structures'] })
      setError('')
      toastSuccess('Fee structure line added')
    },
    onError: (e) => {
      setError(e.message)
      toastError('Could not add structure', e.message)
    },
  })

  const columns = useMemo(
    () => [
      {
        accessorKey: 'category',
        header: 'Category',
        Cell: ({ row }) => row.original.category?.name || '—',
      },
      {
        accessorKey: 'academic_year',
        header: 'Year',
        Cell: ({ row }) => row.original.academic_year?.name || '—',
      },
      {
        accessorKey: 'classroom',
        header: 'Class',
        Cell: ({ row }) => row.original.classroom?.name || 'All',
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        Cell: ({ row }) =>
          `${money(row.original.amount)} ${row.original.currency || 'TZS'}`,
      },
    ],
    [],
  )

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border border-slate-200 shadow-none">
          <CardHeader className="font-semibold">Category</CardHeader>
          <CardBody className="flex flex-col gap-3">
            <FormField label="Name" required>
              <FormInput
                value={catForm.name}
                onValueChange={(v) => setCatForm((f) => ({ ...f, name: v }))}
              />
            </FormField>
            <FormField label="Code">
              <FormInput
                value={catForm.code}
                onValueChange={(v) => setCatForm((f) => ({ ...f, code: v }))}
              />
            </FormField>
            <FormButton
              isLoading={catMut.isPending}
              onPress={() => {
                if (!catForm.name.trim()) {
                  setError('Category name is required')
                  return
                }
                catMut.mutate({
                  name: catForm.name.trim(),
                  code: catForm.code.trim() || null,
                })
              }}
            >
              Add category
            </FormButton>
            <div className="mt-1 flex flex-wrap gap-1">
              {categories.map((c) => (
                <Chip key={c.id} size="sm" variant="flat">
                  {c.name}
                </Chip>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="border border-slate-200 shadow-none">
          <CardHeader className="font-semibold">Structure line</CardHeader>
          <CardBody className="flex flex-col gap-3">
            <FormField label="Academic year" required>
              <FormSelect
                label="Year"
                placeholder="Academic year"
                value={structForm.academic_year_id}
                onChange={(v) =>
                  setStructForm((f) => ({ ...f, academic_year_id: v }))
                }
                options={years.map((y) => ({
                  value: String(y.id),
                  label: y.name,
                }))}
              />
            </FormField>
            <FormField label="Term">
              <FormSelect
                label="Term"
                placeholder="Term (optional)"
                value={structForm.term_id}
                onChange={(v) => setStructForm((f) => ({ ...f, term_id: v }))}
                options={terms.map((t) => ({
                  value: String(t.id),
                  label: t.name,
                }))}
              />
            </FormField>
            <FormField label="Class">
              <FormSelect
                label="Class"
                placeholder="Class (optional / all)"
                value={structForm.classroom_id}
                onChange={(v) =>
                  setStructForm((f) => ({ ...f, classroom_id: v }))
                }
                options={classes.map((c) => ({
                  value: String(c.id),
                  label: c.name,
                }))}
              />
            </FormField>
            <FormField label="Category" required>
              <FormSelect
                label="Category"
                placeholder="Category"
                value={structForm.fee_category_id}
                onChange={(v) =>
                  setStructForm((f) => ({ ...f, fee_category_id: v }))
                }
                options={categories.map((c) => ({
                  value: String(c.id),
                  label: c.name,
                }))}
              />
            </FormField>
            <FormField label="Amount (TZS)" required>
              <FormInput
                type="number"
                value={structForm.amount}
                onValueChange={(v) =>
                  setStructForm((f) => ({ ...f, amount: v }))
                }
              />
            </FormField>
            <FormField label="Due date">
              <FormInput
                type="date"
                value={structForm.due_date}
                onValueChange={(v) =>
                  setStructForm((f) => ({ ...f, due_date: v }))
                }
              />
            </FormField>
            <FormButton
              isLoading={structMut.isPending}
              onPress={() => {
                if (
                  !structForm.academic_year_id ||
                  !structForm.fee_category_id ||
                  !structForm.amount
                ) {
                  setError('Year, category and amount are required')
                  return
                }
                structMut.mutate({
                  academic_year_id: Number(structForm.academic_year_id),
                  term_id: structForm.term_id
                    ? Number(structForm.term_id)
                    : null,
                  classroom_id: structForm.classroom_id
                    ? Number(structForm.classroom_id)
                    : null,
                  fee_category_id: Number(structForm.fee_category_id),
                  amount: Number(structForm.amount),
                  due_date: structForm.due_date || null,
                  currency: 'TZS',
                })
              }}
            >
              Add structure
            </FormButton>
          </CardBody>
        </Card>
      </div>

      <Card className="border border-slate-200 shadow-none">
        <CardHeader className="font-semibold">Active structure lines</CardHeader>
        <CardBody>
          {structsQ.isLoading ? (
            <Spinner color="primary" />
          ) : (
            <DataTable
              columns={columns}
              data={structures}
              enableRowSelection={false}
              emptyMessage="No fee structures yet"
            />
          )}
        </CardBody>
      </Card>
    </div>
  )
}

function BillingPanel() {
  const qc = useQueryClient()
  const [error, setError] = useState('')
  const [genForm, setGenForm] = useState({
    academic_year_id: '',
    term_id: '',
    classroom_id: '',
    due_date: '',
  })
  const [statusFilter, setStatusFilter] = useState('')

  const yearsQ = useQuery({ queryKey: ['academic', 'years'], queryFn: listYears })
  const classesQ = useQuery({
    queryKey: ['academic', 'classes'],
    queryFn: listClasses,
  })
  const termsQ = useQuery({ queryKey: ['academic', 'terms'], queryFn: listTerms })
  const invQ = useQuery({
    queryKey: ['finance', 'invoices', statusFilter],
    queryFn: () =>
      listInvoices({
        per_page: 100,
        status: statusFilter || undefined,
      }),
  })

  const years = yearsQ.data?.academic_years || []
  const classes = classesQ.data?.classes || []
  const terms = termsQ.data?.terms || []
  const invoices = invQ.data?.invoices || []

  const genMut = useMutation({
    mutationFn: generateInvoices,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      qc.invalidateQueries({ queryKey: ['finance', 'student-fees'] })
      setError('')
      toastSuccess(
        `Generated ${data?.count ?? data?.invoices?.length ?? 0} invoice(s)`,
      )
    },
    onError: (e) => {
      setError(e.message)
      toastError('Could not generate invoices', e.message)
    },
  })

  const columns = useMemo(
    () => [
      {
        accessorKey: 'reference',
        header: 'Reference',
        size: 140,
        Cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.reference}</span>
        ),
      },
      {
        accessorKey: 'student',
        header: 'Student',
        Cell: ({ row }) => {
          const s = row.original.student
          return s
            ? `${s.first_name || ''} ${s.last_name || ''}`.trim()
            : row.original.student_id
        },
      },
      {
        accessorKey: 'total_amount',
        header: 'Total',
        Cell: ({ row }) => money(row.original.total_amount),
      },
      {
        accessorKey: 'balance_amount',
        header: 'Balance',
        Cell: ({ row }) => money(row.original.balance_amount),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => (
          <Chip
            size="sm"
            variant="flat"
            color={statusColor[row.original.status] || 'default'}
            className="capitalize"
          >
            {row.original.status}
          </Chip>
        ),
      },
      {
        accessorKey: 'due_date',
        header: 'Due',
        Cell: ({ row }) => row.original.due_date || '—',
      },
    ],
    [],
  )

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border border-slate-200 shadow-none">
          <CardHeader className="font-semibold">
            Generate invoices (billing run)
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <p className="text-xs text-slate-500">
              Creates one invoice per enrolled student from active fee structure
              lines for the selected year / class.
            </p>
            <FormField label="Academic year" required>
              <FormSelect
                label="Year"
                placeholder="Academic year"
                value={genForm.academic_year_id}
                onChange={(v) =>
                  setGenForm((f) => ({ ...f, academic_year_id: v }))
                }
                options={years.map((y) => ({
                  value: String(y.id),
                  label: y.name,
                }))}
              />
            </FormField>
            <FormField label="Term">
              <FormSelect
                label="Term"
                placeholder="Term (optional)"
                value={genForm.term_id}
                onChange={(v) => setGenForm((f) => ({ ...f, term_id: v }))}
                options={terms.map((t) => ({
                  value: String(t.id),
                  label: t.name,
                }))}
              />
            </FormField>
            <FormField label="Class" required>
              <FormSelect
                label="Class"
                placeholder="Class"
                value={genForm.classroom_id}
                onChange={(v) =>
                  setGenForm((f) => ({ ...f, classroom_id: v }))
                }
                options={classes.map((c) => ({
                  value: String(c.id),
                  label: c.name,
                }))}
              />
            </FormField>
            <FormField label="Due date">
              <FormInput
                type="date"
                value={genForm.due_date}
                onValueChange={(v) =>
                  setGenForm((f) => ({ ...f, due_date: v }))
                }
              />
            </FormField>
            <FormButton
              isLoading={genMut.isPending}
              onPress={() => {
                if (!genForm.academic_year_id || !genForm.classroom_id) {
                  setError('Academic year and class are required')
                  return
                }
                genMut.mutate({
                  academic_year_id: Number(genForm.academic_year_id),
                  term_id: genForm.term_id ? Number(genForm.term_id) : null,
                  classroom_id: Number(genForm.classroom_id),
                  due_date: genForm.due_date || null,
                })
              }}
            >
              Run billing
            </FormButton>
          </CardBody>
        </Card>

        <Card className="border border-slate-200 shadow-none lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <span className="font-semibold">Recent invoices</span>
            <div className="flex items-center gap-2">
              <FormSelect
                label="Status"
                placeholder="All statuses"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: '', label: 'All statuses' },
                  { value: 'unpaid', label: 'Unpaid' },
                  { value: 'partial', label: 'Partial' },
                  { value: 'paid', label: 'Paid' },
                ]}
              />
              <button
                type="button"
                className="rounded-md border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                onClick={() => invQ.refetch()}
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>
          <CardBody>
            {invQ.isLoading ? (
              <Spinner color="primary" />
            ) : (
              <DataTable
                columns={columns}
                data={invoices}
                enableRowSelection={false}
                emptyMessage="No invoices yet — run a billing cycle"
              />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

function MethodsPanel() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    name: '',
    code: '',
    type: 'cash',
    description: '',
    is_active: true,
    sort_order: '0',
  })

  const methodsQ = useQuery({
    queryKey: ['finance', 'methods'],
    queryFn: () => listPaymentMethods(),
  })
  const methods = methodsQ.data?.payment_methods || []

  const saveMut = useMutation({
    mutationFn: (payload) =>
      editingId
        ? updatePaymentMethod(editingId, payload)
        : createPaymentMethod(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'methods'] })
      setError('')
      toastSuccess(editingId ? 'Payment method updated' : 'Payment method added')
      setEditingId(null)
      sheet.onClose()
    },
    onError: (e) => {
      setError(e.message)
      toastError('Could not save payment method', e.message)
    },
  })

  const deleteMut = useMutation({
    mutationFn: deletePaymentMethod,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['finance', 'methods'] })
      toastSuccess(
        data?.deactivated
          ? 'Method deactivated (used by payments)'
          : 'Payment method deleted',
      )
    },
    onError: (e) => toastError('Could not delete method', e.message),
  })

  const openCreate = () => {
    setEditingId(null)
    setForm({
      name: '',
      code: '',
      type: 'cash',
      description: '',
      is_active: true,
      sort_order: '0',
    })
    setError('')
    sheet.onOpen()
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    setForm({
      name: row.name || '',
      code: row.code || '',
      type: row.type || 'other',
      description: row.description || '',
      is_active: row.is_active !== false,
      sort_order: String(row.sort_order ?? 0),
    })
    setError('')
    sheet.onOpen()
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Method',
        Cell: ({ row }) => (
          <div>
            <div className="font-medium text-zinc-900">{row.original.name}</div>
            <div className="font-mono text-[10px] text-zinc-400">
              {row.original.code || '—'}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        Cell: ({ row }) => (
          <Chip size="sm" variant="flat" className="capitalize">
            {(row.original.type || 'other').replace(/_/g, ' ')}
          </Chip>
        ),
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        Cell: ({ row }) => (
          <Chip
            size="sm"
            variant="flat"
            color={row.original.is_active ? 'success' : 'default'}
          >
            {row.original.is_active ? 'Active' : 'Inactive'}
          </Chip>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 48,
        Cell: ({ row }) => {
          const r = row.original
          return (
            <RowActionsMenu
              actions={[
                { key: 'edit', label: 'Edit', onPress: () => openEdit(r) },
                {
                  key: 'toggle',
                  label: r.is_active ? 'Deactivate' : 'Activate',
                  color: r.is_active ? 'warning' : 'default',
                  onPress: () =>
                    updatePaymentMethod(r.id, {
                      is_active: !r.is_active,
                    }).then(() =>
                      qc.invalidateQueries({ queryKey: ['finance', 'methods'] }),
                    ),
                },
                {
                  key: 'delete',
                  label: 'Delete',
                  color: 'danger',
                  onPress: () => {
                    if (window.confirm(`Remove “${r.name}”?`)) {
                      deleteMut.mutate(r.id)
                    }
                  },
                },
              ]}
            />
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500">
          Default channels (Cash, M-Pesa, Bank…) are created automatically the
          first time you open this page.
        </p>
        <FormButton onPress={openCreate}>
          <Plus className="mr-1 h-4 w-4" />
          Add method
        </FormButton>
      </div>

      {methodsQ.isLoading ? (
        <Spinner color="primary" />
      ) : methodsQ.error ? (
        <p className="text-sm text-red-600">{methodsQ.error.message}</p>
      ) : (
        <DataTable
          columns={columns}
          data={methods}
          enableRowSelection={false}
          emptyMessage="No payment methods"
        />
      )}

      <SideSheet
        isOpen={sheet.isOpen}
        onClose={sheet.onClose}
        title={editingId ? 'Edit payment method' : 'New payment method'}
        footer={
          <FormButton
            isLoading={saveMut.isPending}
            onPress={() => {
              if (!form.name.trim()) {
                setError('Name is required')
                return
              }
              saveMut.mutate({
                name: form.name.trim(),
                code: form.code.trim() || null,
                type: form.type || 'other',
                description: form.description.trim() || null,
                is_active: Boolean(form.is_active),
                sort_order: Number(form.sort_order) || 0,
              })
            }}
          >
            {editingId ? 'Save changes' : 'Create method'}
          </FormButton>
        }
      >
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-col gap-3">
          <FormField label="Name" required>
            <FormInput
              placeholder="e.g. M-Pesa"
              value={form.name}
              onValueChange={(v) => setForm((f) => ({ ...f, name: v }))}
            />
          </FormField>
          <FormField label="Code">
            <FormInput
              placeholder="MPESA"
              value={form.code}
              onValueChange={(v) => setForm((f) => ({ ...f, code: v }))}
            />
          </FormField>
          <FormField label="Type">
            <FormSelect
              label="Type"
              value={form.type}
              onChange={(v) => setForm((f) => ({ ...f, type: v }))}
              options={METHOD_TYPES}
            />
          </FormField>
          <FormField label="Sort order">
            <FormInput
              type="number"
              value={form.sort_order}
              onValueChange={(v) => setForm((f) => ({ ...f, sort_order: v }))}
            />
          </FormField>
          <FormField label="Description">
            <FormTextarea
              minRows={2}
              value={form.description}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, description: v }))
              }
            />
          </FormField>
          <Switch
            size="sm"
            isSelected={form.is_active}
            onValueChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
          >
            Active
          </Switch>
        </div>
      </SideSheet>
    </div>
  )
}

function StudentFeesPanel() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')

  const listQ = useQuery({
    queryKey: ['finance', 'student-fees', q, status],
    queryFn: () =>
      listStudentFees({
        q: q || undefined,
        status: status || undefined,
      }),
  })

  const rows = listQ.data?.student_fees || []
  const summary = listQ.data?.summary || {}

  const columns = useMemo(
    () => [
      {
        accessorKey: 'full_name',
        header: 'Student',
        Cell: ({ row }) => (
          <div>
            <div className="font-medium text-zinc-900">
              {row.original.full_name}
            </div>
            <div className="font-mono text-[10px] text-zinc-400">
              {row.original.admission_number || '—'}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'total_billed',
        header: 'Billed',
        Cell: ({ row }) => money(row.original.total_billed),
      },
      {
        accessorKey: 'total_paid',
        header: 'Paid',
        Cell: ({ row }) => money(row.original.total_paid),
      },
      {
        accessorKey: 'total_balance',
        header: 'Balance',
        Cell: ({ row }) => (
          <span
            className={
              Number(row.original.total_balance) > 0
                ? 'font-medium text-amber-700'
                : 'text-zinc-700'
            }
          >
            {money(row.original.total_balance)}
          </span>
        ),
      },
      {
        accessorKey: 'payment_count',
        header: 'Payments',
        size: 80,
      },
      {
        accessorKey: 'fee_status',
        header: 'Status',
        Cell: ({ row }) => (
          <Chip
            size="sm"
            variant="flat"
            color={statusColor[row.original.fee_status] || 'default'}
            className="capitalize"
          >
            {row.original.fee_status === 'none'
              ? 'No invoices'
              : row.original.fee_status}
          </Chip>
        ),
      },
      {
        id: 'open',
        header: '',
        size: 90,
        Cell: ({ row }) => (
          <button
            type="button"
            className="text-xs font-medium text-[#0B3D2E] hover:underline"
            onClick={() =>
              navigate(`/finance/student-fees/${row.original.student_id}`)
            }
          >
            View record
          </button>
        ),
      },
    ],
    [navigate],
  )

  return (
    <div className="flex flex-col gap-4">
  <div className="grid gap-3 sm:grid-cols-3">
    <Card className="border border-slate-200 shadow-none">
      <CardBody className="py-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Total billed
        </p>
        <p className="text-lg font-semibold text-slate-900">
          {money(summary.total_billed)}{' '}
          <span className="text-xs font-normal text-slate-400">TZS</span>
        </p>
      </CardBody>
    </Card>
    <Card className="border border-slate-200 shadow-none">
      <CardBody className="py-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Total paid
        </p>
        <p className="text-lg font-semibold text-emerald-700">
          {money(summary.total_paid)}{' '}
          <span className="text-xs font-normal text-slate-400">TZS</span>
        </p>
      </CardBody>
    </Card>
    <Card className="border border-slate-200 shadow-none">
      <CardBody className="py-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Outstanding
        </p>
        <p className="text-lg font-semibold text-amber-700">
          {money(summary.total_balance)}{' '}
          <span className="text-xs font-normal text-slate-400">TZS</span>
        </p>
      </CardBody>
    </Card>
  </div>

  {/* Search and Filter Row */}
  <div className="flex items-center gap-3">
    {/* Search - 80% */}
    <div className="relative flex-[8] min-w-[200px]">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-[#0B3D2E]"
        placeholder="Search student name or admission no."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
    </div>
    
    {/* Filter - 20% */}
    <div className="flex-[2] min-w-[140px]">
      <FormSelect
        label="Status"
        placeholder="All"
        value={status}
        onChange={setStatus}
        options={[
          { value: '', label: 'All statuses' },
          { value: 'unpaid', label: 'Unpaid' },
          { value: 'partial', label: 'Partial' },
          { value: 'paid', label: 'Paid' },
          { value: 'none', label: 'No invoices' },
        ]}
      />
    </div>
  </div>

      {listQ.isLoading ? (
        <Spinner color="primary" />
      ) : listQ.error ? (
        <p className="text-sm text-red-600">{listQ.error.message}</p>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          enableRowSelection={false}
          emptyMessage="No student fee records"
        />
      )}
    </div>
  )
}

function StudentFeeDetailPanel({ studentId }) {
  const navigate = useNavigate()
  const detailQ = useQuery({
    queryKey: ['finance', 'student-fees', studentId],
    queryFn: () => getStudentFees(studentId),
    enabled: Boolean(studentId),
  })

  const student = detailQ.data?.student
  const summary = detailQ.data?.summary || {}
  const invoices = detailQ.data?.invoices || []
  const payments = detailQ.data?.payments || []

  const invColumns = useMemo(
    () => [
      {
        accessorKey: 'reference',
        header: 'Reference',
        Cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.reference}</span>
        ),
      },
      {
        accessorKey: 'total_amount',
        header: 'Total',
        Cell: ({ row }) => money(row.original.total_amount),
      },
      {
        accessorKey: 'balance_amount',
        header: 'Balance',
        Cell: ({ row }) => money(row.original.balance_amount),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => (
          <Chip
            size="sm"
            variant="flat"
            color={statusColor[row.original.status] || 'default'}
            className="capitalize"
          >
            {row.original.status}
          </Chip>
        ),
      },
      {
        accessorKey: 'issue_date',
        header: 'Issued',
        Cell: ({ row }) => row.original.issue_date || '—',
      },
      {
        accessorKey: 'due_date',
        header: 'Due',
        Cell: ({ row }) => row.original.due_date || '—',
      },
    ],
    [],
  )

  const payColumns = useMemo(
    () => [
      {
        accessorKey: 'paid_at',
        header: 'Date',
        Cell: ({ row }) => {
          const v = row.original.paid_at
          if (!v) return '—'
          return String(v).slice(0, 16).replace('T', ' ')
        },
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        Cell: ({ row }) => money(row.original.amount),
      },
      {
        accessorKey: 'method',
        header: 'Method',
      },
      {
        accessorKey: 'reference',
        header: 'Reference',
        Cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.reference}</span>
        ),
      },
      {
        accessorKey: 'invoice',
        header: 'Invoice',
        Cell: ({ row }) =>
          row.original.invoice?.reference ||
          (row.original.invoice_id ? `#${row.original.invoice_id}` : '—'),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => (
          <Chip size="sm" variant="flat" className="capitalize">
            {row.original.status}
          </Chip>
        ),
      },
    ],
    [],
  )

  if (detailQ.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner color="primary" />
      </div>
    )
  }

  if (detailQ.error) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">{detailQ.error.message}</p>
        <FormButton variant="bordered" onPress={() => navigate('/finance/student-fees')}>
          Back to student fees
        </FormButton>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button
            type="button"
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[#0B3D2E]"
            onClick={() => navigate('/finance/student-fees')}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All student fees
          </button>
          <h2 className="text-lg font-semibold text-slate-900">
            {student?.full_name}
          </h2>
          <p className="text-sm text-slate-500">
            {student?.admission_number || 'No admission number'} ·{' '}
            <span className="capitalize">{student?.status}</span>
          </p>
        </div>
        <FormButton
          variant="bordered"
          onPress={() =>
            navigate(`/finance/payments?student_id=${studentId}`)
          }
        >
          Record payment
        </FormButton>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border border-slate-200 shadow-none">
          <CardBody className="py-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Billed
            </p>
            <p className="text-lg font-semibold">{money(summary.total_billed)}</p>
          </CardBody>
        </Card>
        <Card className="border border-slate-200 shadow-none">
          <CardBody className="py-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Paid
            </p>
            <p className="text-lg font-semibold text-emerald-700">
              {money(summary.total_paid)}
            </p>
          </CardBody>
        </Card>
        <Card className="border border-slate-200 shadow-none">
          <CardBody className="py-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Balance
            </p>
            <p className="text-lg font-semibold text-amber-700">
              {money(summary.total_balance)}
            </p>
          </CardBody>
        </Card>
      </div>

      <Card className="border border-slate-200 shadow-none">
        <CardHeader className="font-semibold">
          Invoices ({invoices.length})
        </CardHeader>
        <CardBody>
          <DataTable
            columns={invColumns}
            data={invoices}
            enableRowSelection={false}
            emptyMessage="No invoices for this student"
          />
        </CardBody>
      </Card>

      <Card className="border border-slate-200 shadow-none">
        <CardHeader className="font-semibold">
          Payment history ({payments.length})
        </CardHeader>
        <CardBody>
          <DataTable
            columns={payColumns}
            data={payments}
            enableRowSelection={false}
            emptyMessage="No fee payments recorded yet"
          />
        </CardBody>
      </Card>
    </div>
  )
}

function InvoicesPanel() {
  const [statusFilter, setStatusFilter] = useState('')
  const invQ = useQuery({
    queryKey: ['finance', 'invoices', 'all', statusFilter],
    queryFn: () =>
      listInvoices({
        per_page: 100,
        status: statusFilter || undefined,
      }),
  })
  const invoices = invQ.data?.invoices || []

  const columns = useMemo(
    () => [
      {
        accessorKey: 'reference',
        header: 'Reference',
        Cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.reference}</span>
        ),
      },
      {
        accessorKey: 'student',
        header: 'Student',
        Cell: ({ row }) => {
          const s = row.original.student
          return s
            ? `${s.first_name || ''} ${s.last_name || ''}`.trim()
            : row.original.student_id
        },
      },
      {
        accessorKey: 'total_amount',
        header: 'Total',
        Cell: ({ row }) => money(row.original.total_amount),
      },
      {
        accessorKey: 'balance_amount',
        header: 'Balance',
        Cell: ({ row }) => money(row.original.balance_amount),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => (
          <Chip
            size="sm"
            variant="flat"
            color={statusColor[row.original.status] || 'default'}
            className="capitalize"
          >
            {row.original.status}
          </Chip>
        ),
      },
      {
        id: 'open',
        header: '',
        size: 90,
        Cell: ({ row }) =>
          row.original.student_id ? (
            <Link
              className="text-xs font-medium text-[#0B3D2E] hover:underline"
              to={`/finance/student-fees/${row.original.student_id}`}
            >
              Student
            </Link>
          ) : null,
      },
    ],
    [],
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <FormSelect
          label="Status"
          placeholder="All"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'unpaid', label: 'Unpaid' },
            { value: 'partial', label: 'Partial' },
            { value: 'paid', label: 'Paid' },
          ]}
        />
      </div>
      {invQ.isLoading ? (
        <Spinner color="primary" />
      ) : (
        <DataTable
          columns={columns}
          data={invoices}
          enableRowSelection={false}
          emptyMessage="No invoices"
        />
      )}
    </div>
  )
}

function PaymentsPanel() {
  const qc = useQueryClient()
  const location = useLocation()
  const preselectedStudent = useMemo(() => {
    const sp = new URLSearchParams(location.search)
    return sp.get('student_id') || ''
  }, [location.search])

  const [error, setError] = useState('')
  const [payForm, setPayForm] = useState({
    student_id: preselectedStudent,
    invoice_id: '',
    amount: '',
    payment_method_id: '',
    reference: '',
    paid_at: '',
  })

  // Keep form in sync if navigated with ?student_id=
  useMemo(() => {
    if (preselectedStudent) {
      setPayForm((f) =>
        f.student_id === preselectedStudent
          ? f
          : { ...f, student_id: preselectedStudent, invoice_id: '' },
      )
    }
  }, [preselectedStudent])

  const studentsQ = useQuery({
    queryKey: ['students', 'mini'],
    queryFn: () => listStudents({ per_page: 100 }),
  })
  const methodsQ = useQuery({
    queryKey: ['finance', 'methods', 'active'],
    queryFn: () => listPaymentMethods({ active_only: 1 }),
  })
  const invQ = useQuery({
    queryKey: ['finance', 'invoices', 'for-pay', payForm.student_id],
    queryFn: () =>
      listInvoices({
        per_page: 50,
        student_id: payForm.student_id || undefined,
      }),
  })
  const payQ = useQuery({
    queryKey: ['finance', 'payments'],
    queryFn: () => listPayments({ per_page: 100 }),
  })

  const students = studentsQ.data?.students || []
  const methods = methodsQ.data?.payment_methods || []
  const invoices = invQ.data?.invoices || []
  const payments = payQ.data?.payments || []

  const payMut = useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'payments'] })
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      qc.invalidateQueries({ queryKey: ['finance', 'student-fees'] })
      setPayForm({
        student_id: '',
        invoice_id: '',
        amount: '',
        payment_method_id: '',
        reference: '',
        paid_at: '',
      })
      setError('')
      toastSuccess('Payment recorded')
    },
    onError: (e) => {
      setError(e.message)
      toastError('Could not save payment', e.message)
    },
  })

  const columns = useMemo(
    () => [
      {
        accessorKey: 'paid_at',
        header: 'Date',
        Cell: ({ row }) => {
          const v = row.original.paid_at
          return v ? String(v).slice(0, 16).replace('T', ' ') : '—'
        },
      },
      {
        accessorKey: 'student',
        header: 'Student',
        Cell: ({ row }) => {
          const s = row.original.student
          return s
            ? `${s.first_name || ''} ${s.last_name || ''}`.trim()
            : row.original.student_id
        },
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        Cell: ({ row }) => money(row.original.amount),
      },
      { accessorKey: 'method', header: 'Method' },
      {
        accessorKey: 'reference',
        header: 'Ref',
        Cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.reference}</span>
        ),
      },
    ],
    [],
  )

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="border border-slate-200 shadow-none">
        <CardHeader className="font-semibold">Record payment</CardHeader>
        <CardBody className="flex flex-col gap-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <FormField label="Student" required>
            <FormSelect
              label="Student"
              placeholder="Student"
              value={payForm.student_id}
              onChange={(v) =>
                setPayForm((f) => ({
                  ...f,
                  student_id: v,
                  invoice_id: '',
                }))
              }
              options={students.map((s) => ({
                value: String(s.id),
                label: s.full_name || `${s.first_name} ${s.last_name}`,
              }))}
            />
          </FormField>
          <FormField label="Invoice">
            <FormSelect
              label="Invoice"
              placeholder="Invoice (optional)"
              value={payForm.invoice_id}
              onChange={(v) => {
                const inv = invoices.find((i) => String(i.id) === String(v))
                setPayForm((f) => ({
                  ...f,
                  invoice_id: v,
                  amount:
                    inv && !f.amount
                      ? String(inv.balance_amount ?? '')
                      : f.amount,
                }))
              }}
              options={invoices
                .filter(
                  (i) =>
                    !payForm.student_id ||
                    String(i.student_id) === String(payForm.student_id),
                )
                .map((i) => ({
                  value: String(i.id),
                  label: `${i.reference} — bal ${money(i.balance_amount)}`,
                }))}
            />
          </FormField>
          <FormField label="Amount (TZS)" required>
            <FormInput
              type="number"
              value={payForm.amount}
              onValueChange={(v) => setPayForm((f) => ({ ...f, amount: v }))}
            />
          </FormField>
          <FormField label="Payment method" required>
            <FormSelect
              label="Method"
              placeholder="Select method"
              value={payForm.payment_method_id}
              onChange={(v) =>
                setPayForm((f) => ({ ...f, payment_method_id: v }))
              }
              options={methods
                .filter((m) => m.is_active !== false)
                .map((m) => ({
                  value: String(m.id),
                  label: m.name,
                }))}
            />
          </FormField>
          <FormField label="Reference">
            <FormInput
              placeholder="Txn / receipt no. (optional)"
              value={payForm.reference}
              onValueChange={(v) =>
                setPayForm((f) => ({ ...f, reference: v }))
              }
            />
          </FormField>
          <FormField label="Paid at">
            <FormInput
              type="date"
              value={payForm.paid_at}
              onValueChange={(v) => setPayForm((f) => ({ ...f, paid_at: v }))}
            />
          </FormField>
          <FormButton
            isLoading={payMut.isPending}
            onPress={() => {
              if (!payForm.student_id || !payForm.amount) {
                setError('Student and amount are required')
                return
              }
              if (!payForm.payment_method_id) {
                setError('Select a payment method')
                return
              }
              payMut.mutate({
                student_id: Number(payForm.student_id),
                invoice_id: payForm.invoice_id
                  ? Number(payForm.invoice_id)
                  : null,
                amount: Number(payForm.amount),
                payment_method_id: Number(payForm.payment_method_id),
                reference: payForm.reference || undefined,
                paid_at: payForm.paid_at || undefined,
              })
            }}
          >
            Save payment
          </FormButton>
        </CardBody>
      </Card>

      <Card className="border border-slate-200 shadow-none lg:col-span-2">
        <CardHeader className="font-semibold">Recent payments</CardHeader>
        <CardBody>
          {payQ.isLoading ? (
            <Spinner color="primary" />
          ) : (
            <DataTable
              columns={columns}
              data={payments}
              enableRowSelection={false}
              emptyMessage="No payments yet"
            />
          )}
        </CardBody>
      </Card>
    </div>
  )
}

function FeeWorkspace() {
  const location = useLocation()
  const { id: studentIdParam } = useParams()
  const meta = resolveSection(location.pathname)

  const body = (() => {
    switch (meta.section) {
      case 'overview':
        return <OverviewPanel />
      case 'structures':
        return <StructuresPanel />
      case 'billing':
        return <BillingPanel />
      case 'methods':
        return <MethodsPanel />
      case 'student-fees':
        return <StudentFeesPanel />
      case 'student-fee-detail':
        return (
          <StudentFeeDetailPanel studentId={Number(studentIdParam)} />
        )
      case 'invoices':
        return <InvoicesPanel />
      case 'payments':
        return <PaymentsPanel />
      default:
        return (
          <ModulePlaceholder
            wrapLayout={false}
            showHeader={false}
            title={meta.title}
            description={meta.description}
          />
        )
    }
  })()

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title={meta.title}
          breadcrumbs={[
            { label: 'Finance', href: '/finance' },
            { label: meta.title },
          ]}
          description={meta.description}
        />
        {body}
      </div>
    </DashboardLayout>
  )
}

export default FeeWorkspace
