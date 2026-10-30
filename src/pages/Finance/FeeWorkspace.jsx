import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Switch,
  useDisclosure,
} from '@heroui/react'
import {
  ArrowLeft,
  Banknote,
  CircleAlert,
  FileSpreadsheet,
  FolderPlus,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Tags,
  TrendingUp,
  Users,
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
  updateFeeStructure,
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
  getFinanceOverview,
} from '../../api/domain.js'
import { SectionSkeleton, TableSkeleton, ValueSkeleton } from '../../components/Loading'

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
      className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)] transition-colors hover:border-[#12544f]/30"
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

function OverviewPanel({ academicYearId = '' }) {
  const navigate = useNavigate()

  const overviewQ = useQuery({
    queryKey: ['finance', 'overview', academicYearId || 'current'],
    queryFn: () =>
      getFinanceOverview(
        academicYearId ? { academic_year_id: Number(academicYearId) } : {},
      ),
    staleTime: 30_000,
  })

  const summary = overviewQ.data?.summary || {}
  const yearName = overviewQ.data?.academic_year?.name || 'Academic year'
  const loading = overviewQ.isLoading
  const enrolled = summary.enrolled_students ?? 0
  const withStructure = summary.students_with_structure ?? 0
  const rate = summary.collection_rate ?? 0

  const analytics = [
    {
      label: 'Expected fees',
      value: loading ? <ValueSkeleton /> : `TZS ${money(summary.expected_fees ?? summary.billed)}`,
      hint: `${enrolled} enrolled · structure × students`,
      icon: FileSpreadsheet,
      tone: 'bg-amber-50 text-amber-800',
      path: '/finance/structures',
    },
    {
      label: 'Collected',
      value: loading ? <ValueSkeleton /> : `TZS ${money(summary.collections)}`,
      hint: loading
        ? <ValueSkeleton />
        : `${summary.students_paid ?? 0} students paid · ${rate}% of expected`,
      icon: Wallet,
      tone: 'bg-emerald-50 text-emerald-700',
      path: '/finance/payments',
    },
    {
      label: 'Outstanding',
      value: loading ? <ValueSkeleton /> : `TZS ${money(summary.outstanding)}`,
      hint: 'Expected minus collected',
      icon: CircleAlert,
      tone: 'bg-rose-50 text-rose-700',
      path: '/finance/student-fees',
    },
    {
      label: 'Students',
      value: loading ? <ValueSkeleton /> : String(enrolled),
      hint: loading
        ? <ValueSkeleton />
        : `${withStructure} with fee structure · ${summary.structure_lines ?? 0} lines`,
      icon: Users,
      tone: 'bg-sky-50 text-sky-700',
      path: '/finance/student-fees',
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
              Live fee analytics from fee structure × enrolled students
              {yearName ? ` · ${yearName}` : ''}
            </p>
          </div>
          {overviewQ.isFetching && !loading ? (
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
        {overviewQ.isError ? (
          <p className="mt-2 text-xs text-rose-600">
            Could not load analytics. {overviewQ.error?.message || ''}
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
                className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)] transition-colors hover:border-[#12544f]/40"
                onPress={() => navigate(c.path)}
              >
                <CardBody className="flex flex-row items-start gap-3 p-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#12544f]/8 text-[#12544f]">
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

const emptyStructForm = () => ({
  academic_year_id: '',
  term_id: '',
  classroom_id: '',
  fee_category_id: '',
  amount: '',
  due_date: '',
  is_active: true,
})

function StructuresPanel({ onRegisterActions } = {}) {
  const qc = useQueryClient()
  const categoryModal = useDisclosure()
  const structureModal = useDisclosure()
  const [catError, setCatError] = useState('')
  const [structError, setStructError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [catForm, setCatForm] = useState({ name: '', code: '' })
  const [structForm, setStructForm] = useState(emptyStructForm)

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
  const years = yearsQ.data?.academic_years || yearsQ.data?.years || []
  const classes = classesQ.data?.classes || []
  const allTerms = termsQ.data?.terms || []
  const terms = structForm.academic_year_id
    ? allTerms.filter(
        (t) => String(t.academic_year_id) === String(structForm.academic_year_id),
      )
    : allTerms

  const resetCatForm = () => setCatForm({ name: '', code: '' })
  const resetStructForm = () => {
    setStructForm(emptyStructForm())
    setEditingId(null)
    setStructError('')
  }

  const openCategoryModal = () => {
    setCatError('')
    resetCatForm()
    categoryModal.onOpen()
  }

  const openCreateStructure = () => {
    if (categories.length === 0) {
      toastError('Add a fee category first', 'Create at least one category before structure lines.')
      openCategoryModal()
      return
    }
    resetStructForm()
    // Prefer current academic year as default
    const current =
      years.find((y) => y.is_current) || years[0] || null
    setStructForm({
      ...emptyStructForm(),
      academic_year_id: current ? String(current.id) : '',
    })
    structureModal.onOpen()
  }

  const openEditStructure = (row) => {
    setEditingId(row.id)
    setStructError('')
    setStructForm({
      academic_year_id: row.academic_year_id
        ? String(row.academic_year_id)
        : row.academic_year?.id
          ? String(row.academic_year.id)
          : '',
      term_id: row.term_id
        ? String(row.term_id)
        : row.term?.id
          ? String(row.term.id)
          : '',
      classroom_id: row.classroom_id
        ? String(row.classroom_id)
        : row.classroom?.id
          ? String(row.classroom.id)
          : '',
      fee_category_id: row.fee_category_id
        ? String(row.fee_category_id)
        : row.category?.id
          ? String(row.category.id)
          : '',
      amount: row.amount != null ? String(row.amount) : '',
      due_date: row.due_date ? String(row.due_date).slice(0, 10) : '',
      is_active: row.is_active !== false,
    })
    structureModal.onOpen()
  }

  // Keep page-header actions in sync (ref assignment — no re-render)
  onRegisterActions?.({
    openCategoryModal,
    openCreateStructure,
    refresh: () => {
      catsQ.refetch()
      structsQ.refetch()
    },
  })

  const catMut = useMutation({
    mutationFn: createFeeCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'categories'] })
      resetCatForm()
      setCatError('')
      categoryModal.onClose()
      toastSuccess('Fee category added')
    },
    onError: (e) => {
      setCatError(e.message)
      toastError('Could not add category', e.message)
    },
  })

  const structMut = useMutation({
    mutationFn: (payload) =>
      editingId
        ? updateFeeStructure(editingId, payload)
        : createFeeStructure(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'structures'] })
      qc.invalidateQueries({ queryKey: ['finance', 'setup-status'] })
      toastSuccess(editingId ? 'Fee structure updated' : 'Fee structure line added')
      resetStructForm()
      structureModal.onClose()
    },
    onError: (e) => {
      const code = e?.body?.data?.code
      const existingId = e?.body?.data?.existing_id
      const existing = e?.body?.data?.structure
      const msg =
        e?.message ||
        'A fee structure already exists for this combination. Edit the existing line instead.'
      setStructError(msg)
      toastError(
        code === 'fee_structure_duplicate'
          ? 'Duplicate fee structure'
          : editingId
            ? 'Could not update structure'
            : 'Could not add structure',
        msg,
      )
      // Offer seamless switch to the existing line when create hits a duplicate
      if (code === 'fee_structure_duplicate' && existingId && !editingId) {
        const row =
          existing ||
          (structsQ.data?.structures || []).find((s) => s.id === existingId)
        if (row) {
          // Keep modal open with existing values so user can edit amount
          setEditingId(existingId)
          setStructForm({
            academic_year_id: row.academic_year_id
              ? String(row.academic_year_id)
              : row.academic_year?.id
                ? String(row.academic_year.id)
                : structForm.academic_year_id,
            term_id: row.term_id
              ? String(row.term_id)
              : row.term?.id
                ? String(row.term.id)
                : '',
            classroom_id: row.classroom_id
              ? String(row.classroom_id)
              : row.classroom?.id
                ? String(row.classroom.id)
                : '',
            fee_category_id: row.fee_category_id
              ? String(row.fee_category_id)
              : row.category?.id
                ? String(row.category.id)
                : structForm.fee_category_id,
            amount: row.amount != null ? String(row.amount) : '',
            due_date: row.due_date ? String(row.due_date).slice(0, 10) : '',
            is_active: row.is_active !== false,
          })
          qc.invalidateQueries({ queryKey: ['finance', 'structures'] })
        }
      }
    },
  })

  const toggleActiveMut = useMutation({
    mutationFn: ({ id, is_active }) => updateFeeStructure(id, { is_active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'structures'] })
      qc.invalidateQueries({ queryKey: ['finance', 'setup-status'] })
      toastSuccess('Structure status updated')
    },
    onError: (e) => toastError('Could not update status', e.message),
  })

  const submitCategory = () => {
    if (!catForm.name.trim()) {
      setCatError('Category name is required')
      return
    }
    catMut.mutate({
      name: catForm.name.trim(),
      code: catForm.code.trim() || null,
    })
  }

  const submitStructure = () => {
    if (
      !structForm.academic_year_id ||
      !structForm.fee_category_id ||
      structForm.amount === '' ||
      structForm.amount == null
    ) {
      setStructError('Year, category and amount are required')
      return
    }
    structMut.mutate({
      academic_year_id: Number(structForm.academic_year_id),
      term_id: structForm.term_id ? Number(structForm.term_id) : null,
      classroom_id: structForm.classroom_id
        ? Number(structForm.classroom_id)
        : null,
      fee_category_id: Number(structForm.fee_category_id),
      amount: Number(structForm.amount),
      due_date: structForm.due_date || null,
      currency: 'TZS',
      is_active: Boolean(structForm.is_active),
    })
  }

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
        accessorKey: 'term',
        header: 'Term',
        Cell: ({ row }) => row.original.term?.name || 'All',
      },
      {
        accessorKey: 'classroom',
        header: 'Class',
        Cell: ({ row }) => row.original.classroom?.name || 'All',
      },
      {
        accessorKey: 'due_date',
        header: 'Due date',
        Cell: ({ row }) => row.original.due_date || '—',
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        Cell: ({ row }) =>
          `${money(row.original.amount)} ${row.original.currency || 'TZS'}`,
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        size: 90,
        Cell: ({ row }) => (
          <Chip
            size="sm"
            variant="flat"
            color={row.original.is_active !== false ? 'success' : 'default'}
            className="h-5 text-[10px]"
          >
            {row.original.is_active !== false ? 'Active' : 'Inactive'}
          </Chip>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 90,
        enableSorting: false,
        Cell: ({ row }) => {
          const r = row.original
          return (
            <RowActionsMenu
              ariaLabel={`Actions for ${r.category?.name || 'structure'}`}
              items={[
                {
                  key: 'edit',
                  label: 'Edit',
                  onPress: () => openEditStructure(r),
                },
                {
                  key: 'toggle',
                  label: r.is_active !== false ? 'Deactivate' : 'Activate',
                  color: r.is_active !== false ? 'warning' : 'default',
                  onPress: () =>
                    toggleActiveMut.mutate({
                      id: r.id,
                      is_active: r.is_active === false,
                    }),
                },
              ]}
            />
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [toggleActiveMut.isPending],
  )

  return (
    <div className="flex flex-col gap-5">
      {/* Categories overview */}
      <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#12544f]/8 text-[#12544f]">
              <Tags className="h-4 w-4" strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Fee categories
              </p>
              <p className="text-xs text-slate-500">
                {catsQ.isLoading
                  ? 'Loading…'
                  : `${categories.length} categor${categories.length === 1 ? 'y' : 'ies'}`}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="flat"
            className="bg-[#12544f]/8 text-[#12544f]"
            startContent={<Plus className="h-3.5 w-3.5" />}
            onPress={openCategoryModal}
          >
            New category
          </Button>
        </CardHeader>
        <CardBody className="pt-2">
          {catsQ.isLoading ? (
            <div className="flex justify-center py-6">
              <Spinner color="primary" size="sm" />
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center">
              <Tags className="mb-2 h-8 w-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">
                No categories yet
              </p>
              <p className="mt-1 max-w-sm text-xs text-slate-500">
                Add categories such as Tuition, Transport, or Examination before
                defining structure amounts.
              </p>
              <Button
                size="sm"
                className="mt-4 bg-[#12544f] text-white"
                startContent={<FolderPlus className="h-3.5 w-3.5" />}
                onPress={openCategoryModal}
              >
                Add category
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Chip
                  key={c.id}
                  size="md"
                  variant="flat"
                  className="border border-slate-200 bg-white"
                  classNames={{ content: 'px-1' }}
                >
                  <span className="font-medium text-slate-800">{c.name}</span>
                  {c.code ? (
                    <span className="ml-1.5 text-xs text-slate-400">
                      {c.code}
                    </span>
                  ) : null}
                </Chip>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Active structure lines (full width) */}
      <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-1">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Active structure lines
            </p>
            <p className="text-xs text-slate-500">
              {structsQ.isLoading
                ? 'Loading…'
                : `${structures.length} line${structures.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              color="primary"
              className="bg-[#12544f]"
              startContent={<Plus className="h-3.5 w-3.5" />}
              onPress={openCreateStructure}
            >
              New structure line
            </Button>
            <Button
              size="sm"
              variant="bordered"
              className="border-slate-200"
              startContent={<RefreshCw className="h-3.5 w-3.5" />}
              onPress={() => {
                catsQ.refetch()
                structsQ.refetch()
              }}
            >
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardBody className="pt-2">
          {structsQ.isLoading ? (
            <SectionSkeleton />
          ) : (
            <DataTable
              columns={columns}
              data={structures}
              enableRowSelection={false}
              emptyMessage="No fee structure lines yet — click New structure line to add one"
            />
          )}
        </CardBody>
      </Card>

      {/* Structure create / edit modal */}
      <Modal
        isOpen={structureModal.isOpen}
        onOpenChange={(open) => {
          if (open) {
            structureModal.onOpen()
          } else {
            structureModal.onClose()
            resetStructForm()
          }
        }}
        placement="center"
        size="lg"
        scrollBehavior="inside"
        classNames={{
          base: 'border border-slate-200',
          header: 'border-b border-slate-100',
          footer: 'border-t border-slate-100',
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-0.5">
                <span className="text-base font-semibold text-slate-900">
                  {editingId ? 'Edit structure line' : 'New structure line'}
                </span>
                <span className="text-xs font-normal text-slate-500">
                  Link a category to year / term / class with an amount
                </span>
              </ModalHeader>
              <ModalBody className="gap-3 py-4">
                {structError ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                    <p className="font-medium">
                      {editingId ? 'Update note' : 'Cannot create duplicate'}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-snug text-amber-900/90">
                      {structError}
                    </p>
                    {editingId ? (
                      <p className="mt-1.5 text-[11px] text-amber-800/80">
                        You are now editing the existing line — change the
                        amount or due date, then save.
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <FormField label="Academic year" required>
                  <FormSelect
                    label="Year"
                    placeholder="Select year"
                    value={structForm.academic_year_id}
                    onChange={(v) =>
                      setStructForm((f) => ({
                        ...f,
                        academic_year_id: v,
                        term_id: '', // reset term when year changes
                      }))
                    }
                    options={years.map((y) => ({
                      value: String(y.id),
                      label: y.name,
                    }))}
                  />
                </FormField>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="Term">
                    <FormSelect
                      label="Term"
                      placeholder="All terms"
                      value={structForm.term_id}
                      onChange={(v) =>
                        setStructForm((f) => ({ ...f, term_id: v }))
                      }
                      options={[
                        { value: '', label: 'All terms' },
                        ...terms.map((t) => ({
                          value: String(t.id),
                          label: t.name,
                        })),
                      ]}
                    />
                  </FormField>
                  <FormField label="Class">
                    <FormSelect
                      label="Class"
                      placeholder="All classes"
                      value={structForm.classroom_id}
                      onChange={(v) =>
                        setStructForm((f) => ({ ...f, classroom_id: v }))
                      }
                      options={[
                        { value: '', label: 'All classes' },
                        ...classes.map((c) => ({
                          value: String(c.id),
                          label: c.name,
                        })),
                      ]}
                    />
                  </FormField>
                </div>
                <FormField label="Category" required>
                  <FormSelect
                    label="Category"
                    placeholder={
                      categories.length
                        ? 'Select category'
                        : 'Add a category first'
                    }
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
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="Amount (TZS)" required>
                    <FormInput
                      type="number"
                      min={0}
                      placeholder="0"
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
                </div>
                <FormField label="Status">
                  <FormSelect
                    label="Status"
                    value={structForm.is_active ? '1' : '0'}
                    onChange={(v) =>
                      setStructForm((f) => ({ ...f, is_active: v === '1' }))
                    }
                    options={[
                      { value: '1', label: 'Active' },
                      { value: '0', label: 'Inactive' },
                    ]}
                  />
                </FormField>
                {categories.length === 0 ? (
                  <p className="text-[11px] text-amber-700">
                    Create at least one fee category before adding structure
                    lines.
                  </p>
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  onPress={() => {
                    resetStructForm()
                    onClose()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  className="bg-[#12544f]"
                  isLoading={structMut.isPending}
                  isDisabled={categories.length === 0}
                  startContent={
                    structMut.isPending ? null : (
                      <Plus className="h-3.5 w-3.5" />
                    )
                  }
                  onPress={submitStructure}
                >
                  {editingId ? 'Save changes' : 'Add structure line'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Category form modal */}
      <Modal
        isOpen={categoryModal.isOpen}
        onOpenChange={(open) => {
          if (open) {
            categoryModal.onOpen()
          } else {
            categoryModal.onClose()
            setCatError('')
            resetCatForm()
          }
        }}
        placement="center"
        size="md"
        classNames={{
          base: 'border border-slate-200',
          header: 'border-b border-slate-100',
          footer: 'border-t border-slate-100',
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-0.5">
                <span className="text-base font-semibold text-slate-900">
                  New fee category
                </span>
                <span className="text-xs font-normal text-slate-500">
                  Categories group fee lines (e.g. Tuition, Transport)
                </span>
              </ModalHeader>
              <ModalBody className="gap-3 py-4">
                {catError ? (
                  <p className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {catError}
                  </p>
                ) : null}
                <FormField label="Category name" required>
                  <FormInput
                    autoFocus
                    placeholder="e.g. Tuition"
                    value={catForm.name}
                    onValueChange={(v) =>
                      setCatForm((f) => ({ ...f, name: v }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        submitCategory()
                      }
                    }}
                  />
                </FormField>
                <FormField label="Code">
                  <FormInput
                    placeholder="Optional short code (e.g. TUI)"
                    value={catForm.code}
                    onValueChange={(v) =>
                      setCatForm((f) => ({ ...f, code: v }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        submitCategory()
                      }
                    }}
                  />
                </FormField>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  onPress={() => {
                    setCatError('')
                    resetCatForm()
                    onClose()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  className="bg-[#12544f]"
                  isLoading={catMut.isPending}
                  startContent={
                    catMut.isPending ? null : (
                      <Plus className="h-3.5 w-3.5" />
                    )
                  }
                  onPress={submitCategory}
                >
                  Save category
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
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
    placeholderData: (prev) => prev,
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
        <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
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

        <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)] lg:col-span-2">
          <CardHeader className="font-semibold">Recent invoices</CardHeader>
          <CardBody>
            <DataTable
              columns={columns}
              data={invoices}
              isLoading={invQ.isLoading}
              enableRowSelection={false}
              emptyMessage="No invoices yet — run a billing cycle"
              searchPlaceholder="Search invoice or student…"
              filters={[
                  {
                    key: 'status',
                    label: 'Status',
                    value: statusFilter,
                    onChange: setStatusFilter,
                    options: [
                      { value: 'unpaid', label: 'Unpaid' },
                      { value: 'partial', label: 'Partial' },
                      { value: 'paid', label: 'Paid' },
                    ],
                  },
                ]}
              onRefresh={() => invQ.refetch()}
              isRefreshing={invQ.isFetching}
            />
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
        <TableSkeleton columns={4} rows={4} label="Loading payment methods" />
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

function feeStatusLabel(s) {
  if (s === 'paid') return 'Paid'
  if (s === 'partial') return 'Partial'
  if (s === 'unpaid') return 'Unpaid'
  if (s === 'none') return 'No fees'
  return s || '—'
}

function FeeStatusChip({ status }) {
  const map = {
    paid: { color: 'success', className: 'bg-emerald-50 text-emerald-800' },
    partial: { color: 'warning', className: 'bg-amber-50 text-amber-800' },
    unpaid: { color: 'danger', className: 'bg-rose-50 text-rose-800' },
    none: { color: 'default', className: '' },
  }
  const m = map[status] || map.none
  return (
    <Chip size="sm" variant="flat" color={m.color} className={`h-5 capitalize ${m.className}`}>
      {feeStatusLabel(status)}
    </Chip>
  )
}

function StudentFeesPanel() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [yearId, setYearId] = useState('')
  const [termId, setTermId] = useState('') // '' = All (whole year)
  const [classId, setClassId] = useState('')

  const yearsQ = useQuery({ queryKey: ['academic', 'years'], queryFn: listYears })
  const classesQ = useQuery({ queryKey: ['academic', 'classes'], queryFn: listClasses })
  const years = yearsQ.data?.academic_years || yearsQ.data?.years || []
  const classes = classesQ.data?.classes || []

  // Default year once loaded
  useEffect(() => {
    if (!yearId && years.length) {
      const current = years.find((y) => y.is_current) || years[0]
      if (current) setYearId(String(current.id))
    }
  }, [years, yearId])

  const listQ = useQuery({
    queryKey: ['finance', 'student-fees', q, status, yearId, termId, classId],
    queryFn: () =>
      listStudentFees({
        q: q || undefined,
        status: status || undefined,
        academic_year_id: yearId || undefined,
        // only send term_id when a specific term is chosen; omit for All
        term_id: termId || undefined,
        classroom_id: classId || undefined,
      }),
    enabled: Boolean(yearId) || years.length === 0,
  })

  const rows = listQ.data?.student_fees || []
  const summary = listQ.data?.summary || {}
  const terms = listQ.data?.terms || []
  const byTerm = listQ.data?.by_term || []
  const yearName = listQ.data?.filters?.academic_year?.name || ''

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
              {row.original.classroom?.name
                ? ` · ${row.original.classroom.name}`
                : ''}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'total_billed',
        header: 'Total fees',
        Cell: ({ row }) => (
          <span className="tabular-nums text-zinc-800">
            {money(row.original.total_billed)}
          </span>
        ),
      },
      {
        accessorKey: 'total_paid',
        header: 'Paid',
        Cell: ({ row }) => (
          <span
            className={`tabular-nums font-medium ${
              Number(row.original.total_paid) > 0
                ? 'text-emerald-700'
                : 'text-zinc-400'
            }`}
          >
            {money(row.original.total_paid)}
          </span>
        ),
      },
      {
        accessorKey: 'total_balance',
        header: 'Remaining',
        Cell: ({ row }) => {
          const bal = Number(row.original.total_balance || row.original.remaining || 0)
          return (
            <span
              className={`tabular-nums font-semibold ${
                bal > 0.009 ? 'text-rose-700' : 'text-emerald-700'
              }`}
            >
              {money(bal)}
            </span>
          )
        },
      },
      {
        accessorKey: 'fee_status',
        header: 'Status',
        Cell: ({ row }) => <FeeStatusChip status={row.original.fee_status} />,
      },
      {
        id: 'open',
        header: '',
        size: 96,
        Cell: ({ row }) => (
          <button
            type="button"
            className="text-xs font-medium text-[#12544f] hover:underline"
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
      {/* Scope: year + term tabs */}
      <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
        <CardBody className="flex flex-col gap-3 py-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Academic year">
              <FormSelect
                value={yearId}
                onChange={(v) => {
                  setYearId(v)
                  setTermId('') // reset to All when year changes
                }}
                options={[
                  { value: '', label: 'Select year' },
                  ...years.map((y) => ({ value: String(y.id), label: y.name })),
                ]}
              />
            </FormField>
            <FormField label="Class">
              <FormSelect
                value={classId}
                onChange={setClassId}
                options={[
                  { value: '', label: 'All classes' },
                  ...classes.map((c) => ({ value: String(c.id), label: c.name })),
                ]}
              />
            </FormField>
            <FormField label="Payment status">
              <FormSelect
                value={status}
                onChange={setStatus}
                options={[
                  { value: '', label: 'All statuses' },
                  { value: 'paid', label: 'Paid' },
                  { value: 'partial', label: 'Partial' },
                  { value: 'unpaid', label: 'Unpaid' },
                  { value: 'none', label: 'No fees' },
                ]}
              />
            </FormField>
            <FormField label="Search">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-[#12544f]"
                  placeholder="Name or admission no."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
            </FormField>
          </div>

          <div>
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Term breakdown {yearName ? `· ${yearName}` : ''}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setTermId('')}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  termId === ''
                    ? 'bg-[#12544f] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All (whole year)
              </button>
              {terms.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTermId(String(t.id))}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    termId === String(t.id)
                      ? 'bg-[#12544f] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {t.name}
                </button>
              ))}
              {!terms.length && yearId ? (
                <span className="text-[11px] text-slate-400">
                  No terms for this year — showing whole year totals
                </span>
              ) : null}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Summary cards */}
      <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
          <CardBody className="py-2.5 px-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Students
            </p>
            <p className="text-lg font-semibold tabular-nums text-slate-900">
              {listQ.isLoading ? <ValueSkeleton /> : summary.students ?? rows.length}
            </p>
          </CardBody>
        </Card>
        <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
          <CardBody className="py-2.5 px-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Total fees
            </p>
            <p className="text-lg font-semibold tabular-nums text-slate-900">
              {money(summary.total_billed)}
            </p>
          </CardBody>
        </Card>
        <Card className="border border-emerald-100 bg-emerald-50/40 shadow-none">
          <CardBody className="py-2.5 px-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-700/80">
              Paid
            </p>
            <p className="text-lg font-semibold tabular-nums text-emerald-700">
              {money(summary.total_paid)}
            </p>
            <p className="text-[10px] text-emerald-800/70">
              {summary.paid_count ?? 0} fully paid
            </p>
          </CardBody>
        </Card>
        <Card className="border border-rose-100 bg-rose-50/40 shadow-none">
          <CardBody className="py-2.5 px-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-rose-700/80">
              Remaining
            </p>
            <p className="text-lg font-semibold tabular-nums text-rose-700">
              {money(summary.total_balance)}
            </p>
            <p className="text-[10px] text-rose-800/70">
              {(summary.unpaid_count ?? 0) + (summary.partial_count ?? 0)} with balance
            </p>
          </CardBody>
        </Card>
        <Card className="border border-amber-100 bg-amber-50/30 shadow-none">
          <CardBody className="py-2.5 px-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-amber-800/80">
              Partial
            </p>
            <p className="text-lg font-semibold tabular-nums text-amber-800">
              {listQ.isLoading ? <ValueSkeleton /> : summary.partial_count ?? 0}
            </p>
            <p className="text-[10px] text-amber-900/60">students</p>
          </CardBody>
        </Card>
      </div>

      {/* Per-term snapshot when viewing All */}
      {termId === '' && byTerm.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {byTerm.map((t) => (
            <button
              key={t.term_id}
              type="button"
              onClick={() => setTermId(String(t.term_id))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-[#12544f]/40"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-800">{t.term}</p>
                <span className="text-[10px] text-slate-400">View →</span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]">
                <span className="text-slate-600">
                  Fees {money(t.total_billed)}
                </span>
                <span className="font-medium text-emerald-700">
                  Paid {money(t.total_paid)}
                </span>
                <span className="font-medium text-rose-700">
                  Due {money(t.total_balance)}
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          {termId
            ? `Showing ${terms.find((t) => String(t.id) === termId)?.name || 'term'} fees`
            : 'Showing whole-year fees (all terms)'}
          {classId
            ? ` · ${classes.find((c) => String(c.id) === classId)?.name || 'class'}`
            : ''}
        </p>
        <Button
          size="sm"
          variant="bordered"
          className="border-slate-200"
          startContent={<RefreshCw className="h-3.5 w-3.5" />}
          onPress={() => listQ.refetch()}
        >
          Refresh
        </Button>
      </div>

      {listQ.isLoading ? (
        <SectionSkeleton />
      ) : listQ.error ? (
        <p className="text-sm text-red-600">{listQ.error.message}</p>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          enableRowSelection={false}
          emptyMessage="No students found for this year / filters. Ensure enrollments and fee invoices exist."
          getRowId={(r) => String(r.student_id)}
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
  const byTerm = detailQ.data?.by_term || []
  const yearName = detailQ.data?.academic_year?.name
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
        id: 'term',
        header: 'Term',
        Cell: ({ row }) => row.original.term?.name || 'All / year',
      },
      {
        accessorKey: 'total_amount',
        header: 'Total',
        Cell: ({ row }) => (
          <span className="tabular-nums">{money(row.original.total_amount)}</span>
        ),
      },
      {
        accessorKey: 'balance_amount',
        header: 'Remaining',
        Cell: ({ row }) => {
          const bal = Number(row.original.balance_amount || 0)
          return (
            <span
              className={`tabular-nums font-semibold ${
                bal > 0.009 ? 'text-rose-700' : 'text-emerald-700'
              }`}
            >
              {money(bal)}
            </span>
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => (
          <FeeStatusChip
            status={
              row.original.status === 'paid'
                ? 'paid'
                : row.original.status === 'partial'
                  ? 'partial'
                  : row.original.status === 'unpaid'
                    ? 'unpaid'
                    : row.original.status
            }
          />
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
      <SectionSkeleton />
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
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[#12544f]"
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
            {yearName ? ` · ${yearName}` : ''}
          </p>
          {summary.fee_status ? (
            <div className="mt-1.5">
              <FeeStatusChip status={summary.fee_status} />
            </div>
          ) : null}
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
        <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
          <CardBody className="py-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Total fees (year)
            </p>
            <p className="text-lg font-semibold tabular-nums">{money(summary.total_billed)}</p>
          </CardBody>
        </Card>
        <Card className="border border-emerald-100 bg-emerald-50/40 shadow-none">
          <CardBody className="py-3">
            <p className="text-[11px] uppercase tracking-wide text-emerald-700/80">
              Paid
            </p>
            <p className="text-lg font-semibold tabular-nums text-emerald-700">
              {money(summary.total_paid)}
            </p>
          </CardBody>
        </Card>
        <Card className="border border-rose-100 bg-rose-50/40 shadow-none">
          <CardBody className="py-3">
            <p className="text-[11px] uppercase tracking-wide text-rose-700/80">
              Remaining
            </p>
            <p
              className={`text-lg font-semibold tabular-nums ${
                Number(summary.total_balance) > 0.009
                  ? 'text-rose-700'
                  : 'text-emerald-700'
              }`}
            >
              {money(summary.total_balance)}
            </p>
          </CardBody>
        </Card>
      </div>

      {byTerm.length > 0 ? (
        <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
          <CardHeader className="pb-1">
            <div>
              <p className="text-sm font-semibold text-slate-900">By term</p>
              <p className="text-xs text-slate-500">
                Fee status for each term in {yearName || 'this year'}
              </p>
            </div>
          </CardHeader>
          <CardBody className="pt-2">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {byTerm.map((t) => (
                <div
                  key={t.term_id}
                  className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-800">{t.term}</p>
                    <FeeStatusChip status={t.fee_status} />
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 text-[11px]">
                    <span className="text-slate-600">Fees {money(t.total_billed)}</span>
                    <span className="font-medium text-emerald-700">
                      Paid {money(t.total_paid)}
                    </span>
                    <span
                      className={`font-medium ${
                        Number(t.total_balance) > 0.009
                          ? 'text-rose-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      Due {money(t.total_balance)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      ) : null}

      <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
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

      <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
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
    placeholderData: (prev) => prev,
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
              className="text-xs font-medium text-[#12544f] hover:underline"
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
      <DataTable
        columns={columns}
        data={invoices}
        isLoading={invQ.isLoading}
        enableRowSelection={false}
        emptyMessage="No invoices"
        searchPlaceholder="Search invoice or student…"
        filters={[
            {
              key: 'status',
              label: 'Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'unpaid', label: 'Unpaid' },
                { value: 'partial', label: 'Partial' },
                { value: 'paid', label: 'Paid' },
              ],
            },
          ]}
        onRefresh={() => invQ.refetch()}
        isRefreshing={invQ.isFetching}
      />
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
      <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
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

      <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)] lg:col-span-2">
        <CardHeader className="font-semibold">Recent payments</CardHeader>
        <CardBody>
          {payQ.isLoading ? (
            <TableSkeleton columns={5} rows={6} label="Loading payments" />
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
  const structureActionsRef = useRef(null)
  const [financeYearId, setFinanceYearId] = useState('')

  const yearsQ = useQuery({
    queryKey: ['academic', 'years'],
    queryFn: listYears,
    staleTime: 60_000,
  })
  const years = yearsQ.data?.academic_years || yearsQ.data?.years || []

  // Default to current academic year once years load
  useEffect(() => {
    if (financeYearId || !years.length) return
    const current = years.find((y) => y.is_current) || years[0]
    if (current) setFinanceYearId(String(current.id))
  }, [years, financeYearId])

  const selectedYear = years.find((y) => String(y.id) === String(financeYearId))
  const yearLabel = selectedYear?.name || 'Academic year'

  const registerStructureActions = useCallback((actions) => {
    structureActionsRef.current = actions
  }, [])

  const yearFilter = (
    <div className="flex min-w-[160px] max-w-[220px] flex-col gap-0.5">
      <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
        Academic year
      </span>
      <FormSelect
        label="Academic year"
        placeholder="Select year"
        value={financeYearId}
        onChange={setFinanceYearId}
        options={years.map((y) => ({
          value: String(y.id),
          label: y.is_current ? `${y.name} (current)` : y.name,
        }))}
      />
    </div>
  )

  const body = (() => {
    switch (meta.section) {
      case 'overview':
        return <OverviewPanel academicYearId={financeYearId} />
      case 'structures':
        return (
          <StructuresPanel onRegisterActions={registerStructureActions} />
        )
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

  const pageActions =
    meta.section === 'overview' ? (
      <div className="flex flex-wrap items-end gap-2">{yearFilter}</div>
    ) : meta.section === 'structures' ? (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="bordered"
          className="border-slate-200"
          startContent={<RefreshCw className="h-3.5 w-3.5" />}
          onPress={() => structureActionsRef.current?.refresh?.()}
        >
          Refresh
        </Button>
        <Button
          size="sm"
          color="primary"
          className="bg-[#12544f]"
          startContent={<FolderPlus className="h-3.5 w-3.5" />}
          onPress={() => structureActionsRef.current?.openCategoryModal?.()}
        >
          Add category
        </Button>
      </div>
    ) : null

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title={meta.title}
          breadcrumbs={[
            { label: 'Finance', href: '/finance' },
            { label: meta.title },
            ...(meta.section === 'overview' && yearLabel
              ? [{ label: yearLabel }]
              : []),
          ]}
          description={
            meta.section === 'overview'
              ? `${meta.description}${yearLabel ? ` · ${yearLabel}` : ''}`
              : meta.description
          }
          actions={pageActions}
        />
        {body}
      </div>
    </DashboardLayout>
  )
}

export default FeeWorkspace
