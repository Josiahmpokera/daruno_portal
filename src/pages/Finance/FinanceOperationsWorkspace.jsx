import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardBody, CardHeader, Chip, useDisclosure } from '@heroui/react'
import { Plus, RefreshCw, Search } from 'lucide-react'
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
import { toastError, toastSuccess } from '../../components/Toast'
import {
  createAdjustment,
  createRefund,
  getFinancialReports,
  listAdjustments,
  listInvoices,
  listOutstandingFees,
  listPayments,
  listReceipts,
  listRefunds,
  listStudents,
  voidAdjustment,
} from '../../api/domain.js'
import { SectionSkeleton } from '../../components/Loading'

const money = (n) =>
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

const studentLabel = (s) => {
  if (!s) return '—'
  const name = [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(' ')
  return s.admission_number ? `${name} (${s.admission_number})` : name || s.full_name || '—'
}

const sectionMeta = {
  '/finance/receipts': {
    title: 'Receipts',
    description: 'Official payment receipts issued to parents and guardians',
    section: 'receipts',
  },
  '/finance/refunds': {
    title: 'Refunds',
    description: 'Process fee refunds against payments or invoices',
    section: 'refunds',
  },
  '/finance/discounts': {
    title: 'Discounts',
    description: 'Post fee discounts (sibling, staff, bursary, etc.)',
    section: 'discounts',
  },
  '/finance/fines': {
    title: 'Fines / Penalties',
    description: 'Late fees, lost materials and other penalties',
    section: 'fines',
  },
  '/finance/outstanding': {
    title: 'Outstanding Fees',
    description: 'Unpaid and partially paid invoices with balances due',
    section: 'outstanding',
  },
  '/finance/statements': {
    title: 'Fee Statements',
    description: 'Balances and statements for student fee accounts',
    section: 'statements',
  },
  '/finance/reports': {
    title: 'Financial Reports',
    description: 'Collections, refunds, discounts, fines and outstanding summary',
    section: 'reports',
  },
}

function useStudentOptions() {
  return useQuery({
    queryKey: ['students', 'options', 'finance-ops'],
    queryFn: () => listStudents({ per_page: 100, status: 'active' }),
    staleTime: 60_000,
  })
}

function studentOptions(data) {
  return (data?.students || []).map((s) => ({
    value: String(s.id),
    label: studentLabel(s),
  }))
}

// ── Receipts ─────────────────────────────────────────────────────

function ReceiptsSection() {
  const [q, setQ] = useState('')
  const listQ = useQuery({
    queryKey: ['finance', 'receipts', q],
    queryFn: () => listReceipts({ q: q || undefined, per_page: 50 }),
    placeholderData: (prev) => prev,
  })

  const rows = listQ.data?.receipts || []
  const summary = listQ.data?.summary || {}

  const columns = useMemo(
    () => [
      {
        accessorKey: 'receipt_number',
        header: 'Receipt #',
        Cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-slate-800">
            {row.original.receipt_number || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'student',
        header: 'Student',
        Cell: ({ row }) => studentLabel(row.original.student),
      },
      {
        accessorKey: 'amount',
        header: 'Amount (TZS)',
        Cell: ({ row }) => money(row.original.amount),
      },
      {
        accessorKey: 'method',
        header: 'Method',
        Cell: ({ row }) => row.original.method || '—',
      },
      {
        accessorKey: 'reference',
        header: 'Reference',
        Cell: ({ row }) => row.original.reference || '—',
      },
      {
        accessorKey: 'paid_at',
        header: 'Paid at',
        Cell: ({ row }) =>
          row.original.paid_at
            ? String(row.original.paid_at).slice(0, 16).replace('T', ' ')
            : '—',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => (
          <Chip size="sm" variant="flat" color="success">
            {row.original.status || 'completed'}
          </Chip>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
          <CardBody className="py-3">
            <p className="text-xs text-slate-500">Receipts issued</p>
            <p className="text-xl font-semibold text-slate-900">{summary.count ?? rows.length}</p>
          </CardBody>
        </Card>
        <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
          <CardBody className="py-3">
            <p className="text-xs text-slate-500">Total collected (TZS)</p>
            <p className="text-xl font-semibold text-slate-900">{money(summary.total_amount)}</p>
          </CardBody>
        </Card>
      </div>

      <DataTable
        isLoading={listQ.isLoading} columns={columns} data={rows} emptyMessage="No receipts yet. Record a payment first."
        searchPlaceholder="Search receipt #, reference, student…"
        search={q}
        onSearchChange={setQ}
        onRefresh={() => listQ.refetch()}
        isRefreshing={listQ.isFetching}
      />
    </div>
  )
}

// ── Refunds ──────────────────────────────────────────────────────

function RefundsSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const studentsQ = useStudentOptions()
  const [form, setForm] = useState({
    student_id: '',
    payment_id: '',
    invoice_id: '',
    amount: '',
    method: 'cash',
    reason: '',
    notes: '',
  })

  const listQ = useQuery({
    queryKey: ['finance', 'refunds'],
    queryFn: () => listRefunds({ per_page: 50 }),
  })

  const paymentsQ = useQuery({
    queryKey: ['finance', 'payments', 'for-refund', form.student_id],
    queryFn: () =>
      listPayments({
        student_id: form.student_id || undefined,
        per_page: 40,
      }),
    enabled: sheet.isOpen && !!form.student_id,
  })

  const invoicesQ = useQuery({
    queryKey: ['finance', 'invoices', 'for-refund', form.student_id],
    queryFn: () =>
      listInvoices({
        student_id: form.student_id || undefined,
        per_page: 40,
      }),
    enabled: sheet.isOpen && !!form.student_id,
  })

  const mut = useMutation({
    mutationFn: createRefund,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance'] })
      toastSuccess('Refund recorded')
      sheet.onClose()
      setForm({
        student_id: '',
        payment_id: '',
        invoice_id: '',
        amount: '',
        method: 'cash',
        reason: '',
        notes: '',
      })
    },
    onError: (e) => toastError(e?.message || 'Refund failed'),
  })

  const paymentOptions = (paymentsQ.data?.payments || []).map((p) => {
    const refundable = Number(p.amount || 0) - Number(p.refunded_amount || 0)
    return {
      value: String(p.id),
      label: `${p.receipt_number || p.reference || `PAY-${p.id}`} · TZS ${money(refundable)} refundable`,
    }
  })

  const invoiceOptions = (invoicesQ.data?.invoices || []).map((inv) => ({
    value: String(inv.id),
    label: `${inv.reference} · bal ${money(inv.balance_amount)}`,
  }))

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
        Cell: ({ row }) => studentLabel(row.original.student),
      },
      {
        accessorKey: 'amount',
        header: 'Amount (TZS)',
        Cell: ({ row }) => money(row.original.amount),
      },
      { accessorKey: 'method', header: 'Method' },
      {
        accessorKey: 'reason',
        header: 'Reason',
        Cell: ({ row }) => row.original.reason || '—',
      },
      {
        accessorKey: 'refunded_at',
        header: 'Date',
        Cell: ({ row }) =>
          row.original.refunded_at
            ? String(row.original.refunded_at).slice(0, 10)
            : '—',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => (
          <Chip size="sm" variant="flat" color="warning">
            {row.original.status}
          </Chip>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <FormButton
          color="primary"
          className="bg-[#12544f]"
          startContent={<Plus className="h-4 w-4" />}
          onPress={() => sheet.onOpen()}
        >
          Record refund
        </FormButton>
      </div>

      {listQ.isLoading ? (
        <SectionSkeleton />
      ) : (
        <DataTable
          columns={columns}
          data={listQ.data?.refunds || []}
          emptyMessage="No refunds recorded."
        />
      )}

      <SideSheet
        isOpen={sheet.isOpen}
        onOpenChange={sheet.onOpenChange}
        title="Record refund"
        size="md"
      >
        <div className="space-y-3 p-1">
          <FormField label="Student" required>
            <FormSelect
              options={studentOptions(studentsQ.data)}
              value={form.student_id}
              onChange={(v) =>
                setForm((f) => ({
                  ...f,
                  student_id: v,
                  payment_id: '',
                  invoice_id: '',
                }))
              }
              placeholder="Select student"
            />
          </FormField>
          <FormField label="Linked payment (recommended)">
            <FormSelect
              options={paymentOptions}
              value={form.payment_id}
              onChange={(v) => setForm((f) => ({ ...f, payment_id: v }))}
              placeholder={form.student_id ? 'Optional payment' : 'Select student first'}
              isDisabled={!form.student_id}
            />
          </FormField>
          <FormField label="Linked invoice">
            <FormSelect
              options={invoiceOptions}
              value={form.invoice_id}
              onChange={(v) => setForm((f) => ({ ...f, invoice_id: v }))}
              placeholder="Optional invoice"
              isDisabled={!form.student_id}
            />
          </FormField>
          <FormField label="Amount (TZS)" required>
            <FormInput
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </FormField>
          <FormField label="Method">
            <FormSelect
              options={[
                { value: 'cash', label: 'Cash' },
                { value: 'bank', label: 'Bank transfer' },
                { value: 'mobile_money', label: 'Mobile money' },
                { value: 'other', label: 'Other' },
              ]}
              value={form.method}
              onChange={(v) => setForm((f) => ({ ...f, method: v }))}
            />
          </FormField>
          <FormField label="Reason">
            <FormInput
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="Overpayment, withdrawal…"
            />
          </FormField>
          <FormField label="Notes">
            <FormTextarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </FormField>
          <FormButton
            color="primary"
            className="w-full bg-[#12544f]"
            isLoading={mut.isPending}
            onPress={() =>
              mut.mutate({
                student_id: Number(form.student_id),
                payment_id: form.payment_id ? Number(form.payment_id) : null,
                invoice_id: form.invoice_id ? Number(form.invoice_id) : null,
                amount: Number(form.amount),
                method: form.method,
                reason: form.reason || null,
                notes: form.notes || null,
              })
            }
          >
            Post refund
          </FormButton>
        </div>
      </SideSheet>
    </div>
  )
}

// ── Discounts / Fines ────────────────────────────────────────────

function AdjustmentsSection({ type }) {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const studentsQ = useStudentOptions()
  const isDiscount = type === 'discount'
  const [form, setForm] = useState({
    student_id: '',
    invoice_id: '',
    title: '',
    amount: '',
    effective_on: new Date().toISOString().slice(0, 10),
    notes: '',
  })

  const listQ = useQuery({
    queryKey: ['finance', 'adjustments', type],
    queryFn: () => listAdjustments({ type, per_page: 50 }),
  })

  const invoicesQ = useQuery({
    queryKey: ['finance', 'invoices', 'adj', form.student_id],
    queryFn: () =>
      listInvoices({
        student_id: form.student_id || undefined,
        per_page: 40,
      }),
    enabled: sheet.isOpen && !!form.student_id,
  })

  const createMut = useMutation({
    mutationFn: createAdjustment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance'] })
      toastSuccess(isDiscount ? 'Discount posted' : 'Fine posted')
      sheet.onClose()
      setForm({
        student_id: '',
        invoice_id: '',
        title: '',
        amount: '',
        effective_on: new Date().toISOString().slice(0, 10),
        notes: '',
      })
    },
    onError: (e) => toastError(e?.message || 'Could not post adjustment'),
  })

  const voidMut = useMutation({
    mutationFn: voidAdjustment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'adjustments'] })
      toastSuccess('Adjustment voided')
    },
    onError: (e) => toastError(e?.message || 'Void failed'),
  })

  const invoiceOptions = (invoicesQ.data?.invoices || []).map((inv) => ({
    value: String(inv.id),
    label: `${inv.reference} · bal ${money(inv.balance_amount)}`,
  }))

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
        Cell: ({ row }) => studentLabel(row.original.student),
      },
      {
        accessorKey: 'title',
        header: 'Title',
      },
      {
        accessorKey: 'amount',
        header: 'Amount (TZS)',
        Cell: ({ row }) => money(row.original.amount),
      },
      {
        accessorKey: 'invoice',
        header: 'Invoice',
        Cell: ({ row }) => row.original.invoice?.reference || '—',
      },
      {
        accessorKey: 'effective_on',
        header: 'Effective',
        Cell: ({ row }) =>
          row.original.effective_on
            ? String(row.original.effective_on).slice(0, 10)
            : '—',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => (
          <Chip
            size="sm"
            variant="flat"
            color={row.original.status === 'void' ? 'default' : 'success'}
          >
            {row.original.status}
          </Chip>
        ),
      },
      {
        id: 'actions',
        header: '',
        Cell: ({ row }) =>
          row.original.status === 'posted' ? (
            <RowActionsMenu
              items={[
                {
                  key: 'void',
                  label: 'Void',
                  color: 'danger',
                  onPress: () => {
                    if (
                      window.confirm(
                        'Void this adjustment? Invoice balance will reverse.',
                      )
                    ) {
                      voidMut.mutate(row.original.id)
                    }
                  },
                },
              ]}
            />
          ) : null,
      },
    ],
    [voidMut],
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <FormButton
          color="primary"
          className="bg-[#12544f]"
          startContent={<Plus className="h-4 w-4" />}
          onPress={() => sheet.onOpen()}
        >
          {isDiscount ? 'Post discount' : 'Post fine'}
        </FormButton>
      </div>

      {listQ.isLoading ? (
        <SectionSkeleton />
      ) : (
        <DataTable
          columns={columns}
          data={listQ.data?.adjustments || []}
          emptyMessage={isDiscount ? 'No discounts yet.' : 'No fines yet.'}
        />
      )}

      <SideSheet
        isOpen={sheet.isOpen}
        onOpenChange={sheet.onOpenChange}
        title={isDiscount ? 'Post discount' : 'Post fine / penalty'}
        size="md"
      >
        <div className="space-y-3 p-1">
          <FormField label="Student" required>
            <FormSelect
              options={studentOptions(studentsQ.data)}
              value={form.student_id}
              onChange={(v) =>
                setForm((f) => ({ ...f, student_id: v, invoice_id: '' }))
              }
              placeholder="Select student"
            />
          </FormField>
          <FormField label="Apply to invoice (recommended)">
            <FormSelect
              options={invoiceOptions}
              value={form.invoice_id}
              onChange={(v) => setForm((f) => ({ ...f, invoice_id: v }))}
              placeholder={form.student_id ? 'Optional invoice' : 'Select student first'}
              isDisabled={!form.student_id}
            />
          </FormField>
          <FormField label="Title" required>
            <FormInput
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={
                isDiscount
                  ? 'e.g. Sibling discount 10%'
                  : 'e.g. Late payment penalty'
              }
            />
          </FormField>
          <FormField label="Amount (TZS)" required>
            <FormInput
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </FormField>
          <FormField label="Effective date">
            <FormInput
              type="date"
              value={form.effective_on}
              onChange={(e) =>
                setForm((f) => ({ ...f, effective_on: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Notes">
            <FormTextarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </FormField>
          <FormButton
            color="primary"
            className="w-full bg-[#12544f]"
            isLoading={createMut.isPending}
            onPress={() =>
              createMut.mutate({
                student_id: Number(form.student_id),
                invoice_id: form.invoice_id ? Number(form.invoice_id) : null,
                type,
                title: form.title,
                amount: Number(form.amount),
                effective_on: form.effective_on || null,
                notes: form.notes || null,
              })
            }
          >
            {isDiscount ? 'Post discount' : 'Post fine'}
          </FormButton>
        </div>
      </SideSheet>
    </div>
  )
}

// ── Outstanding / Statements ─────────────────────────────────────

function OutstandingSection({ mode = 'outstanding' }) {
  const [q, setQ] = useState('')
  const listQ = useQuery({
    queryKey: ['finance', 'outstanding', q, mode],
    queryFn: () => listOutstandingFees({ q: q || undefined, per_page: 50 }),
    placeholderData: (prev) => prev,
  })

  const rows = listQ.data?.invoices || []
  const summary = listQ.data?.summary || {}

  const columns = useMemo(
    () => [
      {
        accessorKey: 'reference',
        header: 'Invoice',
        Cell: ({ row }) => (
          <span className="font-mono text-xs font-medium">{row.original.reference}</span>
        ),
      },
      {
        accessorKey: 'student',
        header: 'Student',
        Cell: ({ row }) => studentLabel(row.original.student),
      },
      {
        accessorKey: 'total_amount',
        header: 'Billed (TZS)',
        Cell: ({ row }) => money(row.original.total_amount),
      },
      {
        accessorKey: 'balance_amount',
        header: 'Balance (TZS)',
        Cell: ({ row }) => (
          <span className="font-semibold text-rose-700">{money(row.original.balance_amount)}</span>
        ),
      },
      {
        accessorKey: 'due_date',
        header: 'Due date',
        Cell: ({ row }) =>
          row.original.due_date ? String(row.original.due_date).slice(0, 10) : '—',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => {
          const s = row.original.status
          const color =
            s === 'overdue' ? 'danger' : s === 'partial' ? 'warning' : 'default'
          return (
            <Chip size="sm" variant="flat" color={color}>
              {s}
            </Chip>
          )
        },
      },
    ],
    [],
  )

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
          <CardBody className="py-3">
            <p className="text-xs text-slate-500">Open invoices</p>
            <p className="text-xl font-semibold text-slate-900">
              {summary.invoice_count ?? rows.length}
            </p>
          </CardBody>
        </Card>
        <Card className="border border-rose-100 bg-rose-50/40 shadow-none">
          <CardBody className="py-3">
            <p className="text-xs text-rose-700">Total outstanding (TZS)</p>
            <p className="text-xl font-semibold text-rose-800">
              {money(summary.total_outstanding)}
            </p>
          </CardBody>
        </Card>
      </div>

      {mode === 'statements' && (
        <p className="text-sm text-slate-600">
          Fee statements show every open balance. Use Outstanding Fees for collections
          follow-up, or filter by student name / admission number below.
        </p>
      )}

      <DataTable
        isLoading={listQ.isLoading}
        columns={columns}
        data={rows}
        emptyMessage="No outstanding balances. All invoices are settled."
        searchPlaceholder="Search student or invoice reference…"
        search={q}
        onSearchChange={setQ}
        onRefresh={() => listQ.refetch()}
        isRefreshing={listQ.isFetching}
      />
    </div>
  )
}

// ── Financial reports ────────────────────────────────────────────

function ReportsSection() {
  const today = new Date().toISOString().slice(0, 10)
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10)
  const [from, setFrom] = useState(monthStart)
  const [to, setTo] = useState(today)

  const reportQ = useQuery({
    queryKey: ['finance', 'reports', from, to],
    queryFn: () => getFinancialReports({ from, to }),
  })

  const s = reportQ.data?.summary || {}
  const methods = reportQ.data?.collections_by_method || []

  const cards = [
    { label: 'Billed', value: s.billed, tone: 'slate' },
    { label: 'Collections', value: s.collections, tone: 'green' },
    { label: 'Refunds', value: s.refunds, tone: 'amber' },
    { label: 'Net collections', value: s.net_collections, tone: 'green' },
    { label: 'Discounts', value: s.discounts, tone: 'blue' },
    { label: 'Fines', value: s.fines, tone: 'violet' },
    { label: 'Outstanding (all time)', value: s.outstanding, tone: 'rose' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <FormField label="From">
          <FormInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </FormField>
        <FormField label="To">
          <FormInput type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </FormField>
        <FormButton
          appearance="bordered"
          startContent={<RefreshCw className="h-4 w-4" />}
          onPress={() => reportQ.refetch()}
        >
          Run report
        </FormButton>
      </div>

      {reportQ.isLoading ? (
        <SectionSkeleton />
      ) : reportQ.isError ? (
        <p className="text-sm text-rose-600">{reportQ.error?.message || 'Failed to load report'}</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((c) => (
              <Card key={c.label} className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
                <CardBody className="py-3">
                  <p className="text-xs text-slate-500">{c.label}</p>
                  <p className="text-lg font-semibold text-slate-900">TZS {money(c.value)}</p>
                </CardBody>
              </Card>
            ))}
          </div>

          <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
            <CardHeader className="pb-1">
              <h3 className="text-sm font-semibold text-slate-900">Collections by method</h3>
            </CardHeader>
            <CardBody className="pt-0">
              {methods.length === 0 ? (
                <p className="text-sm text-slate-500">No collections in this period.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="py-2 pr-4">Method</th>
                        <th className="py-2 pr-4">Count</th>
                        <th className="py-2">Total (TZS)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {methods.map((m) => (
                        <tr key={m.method || 'n/a'} className="border-b border-slate-50">
                          <td className="py-2 pr-4 capitalize">{m.method || '—'}</td>
                          <td className="py-2 pr-4">{m.count}</td>
                          <td className="py-2 font-medium">{money(m.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  )
}

export default function FinanceOperationsWorkspace() {
  const { pathname } = useLocation()
  const meta = sectionMeta[pathname] || {
    title: 'Finance',
    description: '',
    section: 'receipts',
  }

  let body = null
  switch (meta.section) {
    case 'receipts':
      body = <ReceiptsSection />
      break
    case 'refunds':
      body = <RefundsSection />
      break
    case 'discounts':
      body = <AdjustmentsSection type="discount" />
      break
    case 'fines':
      body = <AdjustmentsSection type="fine" />
      break
    case 'outstanding':
      body = <OutstandingSection mode="outstanding" />
      break
    case 'statements':
      body = <OutstandingSection mode="statements" />
      break
    case 'reports':
      body = <ReportsSection />
      break
    default:
      body = <ReceiptsSection />
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title={meta.title}
          description={meta.description}
          breadcrumbs={[
            { label: 'Finance', href: '/finance' },
            { label: meta.title },
          ]}
        />
        {body}
      </div>
    </DashboardLayout>
  )
}
