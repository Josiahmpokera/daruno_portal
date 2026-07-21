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
  createBankAccount,
  createBudget,
  createCashMovement,
  createChartOfAccount,
  createJournalEntry,
  getBalanceSheet,
  getGeneralLedger,
  getProfitAndLoss,
  getTrialBalance,
  listBankAccounts,
  listBudgets,
  listCashMovements,
  listChartOfAccounts,
  listJournalEntries,
  listYears,
  updateBankAccount,
  updateBudget,
  updateChartOfAccount,
} from '../../api/domain.js'

const money = (n) =>
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

const ACCOUNT_TYPES = [
  { value: 'asset', label: 'Asset' },
  { value: 'liability', label: 'Liability' },
  { value: 'equity', label: 'Equity' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
]

const typeColor = {
  asset: 'primary',
  liability: 'warning',
  equity: 'secondary',
  income: 'success',
  expense: 'danger',
}

const sectionMeta = {
  '/accounting': {
    title: 'Accounting',
    description: 'Chart of accounts, banks, budgets, cashbook and financial statements',
    section: 'overview',
  },
  '/accounting/coa': {
    title: 'Chart of Accounts',
    description: 'Double-entry account codes for your school',
    section: 'coa',
  },
  '/accounting/banks': {
    title: 'Bank Accounts',
    description: 'School bank and cash accounts with running balances',
    section: 'banks',
  },
  '/accounting/budget': {
    title: 'Budget',
    description: 'Annual and period budgets by account line',
    section: 'budget',
  },
  '/accounting/income': {
    title: 'Income',
    description: 'Non-fee and other cash income (grants, donations, sales)',
    section: 'income',
  },
  '/accounting/expenses': {
    title: 'Expenses',
    description: 'Operating expenses paid from cash or bank',
    section: 'expenses',
  },
  '/accounting/cashbook': {
    title: 'Cashbook',
    description: 'Combined income and expense cash movements',
    section: 'cashbook',
  },
  '/accounting/journals': {
    title: 'Journal Entries',
    description: 'Manual double-entry journals (debits = credits)',
    section: 'journals',
  },
  '/accounting/ledger': {
    title: 'General Ledger',
    description: 'Account activity with running balance',
    section: 'ledger',
  },
  '/accounting/trial-balance': {
    title: 'Trial Balance',
    description: 'Debit and credit totals by account',
    section: 'trial-balance',
  },
  '/accounting/pnl': {
    title: 'Profit & Loss',
    description: 'Income versus expenses for a period',
    section: 'pnl',
  },
  '/accounting/balance-sheet': {
    title: 'Balance Sheet',
    description: 'Assets, liabilities and equity as of a date',
    section: 'balance-sheet',
  },
}

function useCoaOptions(type) {
  return useQuery({
    queryKey: ['accounting', 'coa', type || 'all'],
    queryFn: () =>
      listChartOfAccounts({
        active_only: 1,
        ...(type ? { type } : {}),
      }),
    staleTime: 60_000,
  })
}

function coaSelectOptions(data) {
  return (data?.accounts || []).map((a) => ({
    value: String(a.id),
    label: `${a.code} — ${a.name}`,
  }))
}

// ── Overview ─────────────────────────────────────────────────────

function OverviewPanel() {
  const navigate = useNavigate()
  const cards = [
    { title: 'Chart of Accounts', desc: 'Asset, liability, equity, income & expense codes', path: '/accounting/coa' },
    { title: 'Bank Accounts', desc: 'Bank and cash balances', path: '/accounting/banks' },
    { title: 'Budget', desc: 'Plan annual spend by account', path: '/accounting/budget' },
    { title: 'Income', desc: 'Record cash income', path: '/accounting/income' },
    { title: 'Expenses', desc: 'Record operating expenses', path: '/accounting/expenses' },
    { title: 'Cashbook', desc: 'Full cash movement register', path: '/accounting/cashbook' },
    { title: 'Journal Entries', desc: 'Balanced double-entry posts', path: '/accounting/journals' },
    { title: 'General Ledger', desc: 'Account detail with running balance', path: '/accounting/ledger' },
    { title: 'Trial Balance', desc: 'Debits vs credits check', path: '/accounting/trial-balance' },
    { title: 'Profit & Loss', desc: 'Period performance', path: '/accounting/pnl' },
    { title: 'Balance Sheet', desc: 'Position as of a date', path: '/accounting/balance-sheet' },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((c) => (
        <Card
          key={c.path}
          isPressable
          className="border border-slate-200 shadow-none transition-colors hover:border-[#0B3D2E]/40"
          onPress={() => navigate(c.path)}
        >
          <CardHeader className="pb-1">
            <h3 className="text-sm font-semibold text-slate-900">{c.title}</h3>
          </CardHeader>
          <CardBody className="pt-0">
            <p className="text-xs text-slate-500">{c.desc}</p>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

// ── Chart of Accounts ────────────────────────────────────────────

function CoaSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [typeFilter, setTypeFilter] = useState('')
  const [form, setForm] = useState({
    id: null,
    code: '',
    name: '',
    type: 'expense',
    subtype: '',
    description: '',
    is_active: true,
  })

  const listQ = useQuery({
    queryKey: ['accounting', 'coa', typeFilter],
    queryFn: () =>
      listChartOfAccounts({
        type: typeFilter || undefined,
      }),
  })

  const saveMut = useMutation({
    mutationFn: (payload) =>
      payload.id
        ? updateChartOfAccount(payload.id, payload)
        : createChartOfAccount(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting', 'coa'] })
      toastSuccess(form.id ? 'Account updated' : 'Account created')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Save failed'),
  })

  const openCreate = () => {
    setForm({
      id: null,
      code: '',
      name: '',
      type: 'expense',
      subtype: '',
      description: '',
      is_active: true,
    })
    sheet.onOpen()
  }

  const openEdit = (row) => {
    setForm({
      id: row.id,
      code: row.code || '',
      name: row.name || '',
      type: row.type || 'expense',
      subtype: row.subtype || '',
      description: row.description || '',
      is_active: row.is_active !== false,
    })
    sheet.onOpen()
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'code',
        header: 'Code',
        Cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold">{row.original.code}</span>
        ),
      },
      { accessorKey: 'name', header: 'Name' },
      {
        accessorKey: 'type',
        header: 'Type',
        Cell: ({ row }) => (
          <Chip size="sm" variant="flat" color={typeColor[row.original.type] || 'default'}>
            {row.original.type}
          </Chip>
        ),
      },
      {
        accessorKey: 'subtype',
        header: 'Subtype',
        Cell: ({ row }) => row.original.subtype || '—',
      },
      {
        accessorKey: 'is_active',
        header: 'Active',
        Cell: ({ row }) => (
          <Chip size="sm" variant="flat" color={row.original.is_active ? 'success' : 'default'}>
            {row.original.is_active ? 'Yes' : 'No'}
          </Chip>
        ),
      },
      {
        id: 'actions',
        header: '',
        Cell: ({ row }) => (
          <FormButton size="sm" appearance="light" onPress={() => openEdit(row.original)}>
            Edit
          </FormButton>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <FormSelect
          className="w-44"
          options={[{ value: '', label: 'All types' }, ...ACCOUNT_TYPES]}
          value={typeFilter}
          onChange={setTypeFilter}
        />
        <div className="flex-1" />
        <FormButton
          appearance="bordered"
          startContent={<RefreshCw className="h-4 w-4" />}
          onPress={() => listQ.refetch()}
        >
          Refresh
        </FormButton>
        <FormButton
          color="primary"
          className="bg-[#0B3D2E]"
          startContent={<Plus className="h-4 w-4" />}
          onPress={openCreate}
        >
          Add account
        </FormButton>
      </div>

      {listQ.isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner color="success" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={listQ.data?.accounts || []}
          emptyMessage="No accounts. Defaults are created on first open."
        />
      )}

      <SideSheet
        isOpen={sheet.isOpen}
        onOpenChange={sheet.onOpenChange}
        title={form.id ? 'Edit account' : 'New account'}
        size="md"
      >
        <div className="space-y-3 p-1">
          <FormField label="Code" required>
            <FormInput
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="e.g. 5400"
            />
          </FormField>
          <FormField label="Name" required>
            <FormInput
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </FormField>
          <FormField label="Type" required>
            <FormSelect
              options={ACCOUNT_TYPES}
              value={form.type}
              onChange={(v) => setForm((f) => ({ ...f, type: v }))}
            />
          </FormField>
          <FormField label="Subtype">
            <FormInput
              value={form.subtype}
              onChange={(e) => setForm((f) => ({ ...f, subtype: e.target.value }))}
              placeholder="cash, bank, fees…"
            />
          </FormField>
          <FormField label="Description">
            <FormTextarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </FormField>
          <FormButton
            color="primary"
            className="w-full bg-[#0B3D2E]"
            isLoading={saveMut.isPending}
            onPress={() =>
              saveMut.mutate({
                id: form.id,
                code: form.code,
                name: form.name,
                type: form.type,
                subtype: form.subtype || null,
                description: form.description || null,
                is_active: form.is_active,
              })
            }
          >
            Save account
          </FormButton>
        </div>
      </SideSheet>
    </div>
  )
}

// ── Bank accounts ────────────────────────────────────────────────

function BanksSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const coaQ = useCoaOptions('asset')
  const [form, setForm] = useState({
    id: null,
    name: '',
    bank_name: '',
    account_number: '',
    currency: 'TZS',
    opening_balance: '0',
    coa_id: '',
    notes: '',
  })

  const listQ = useQuery({
    queryKey: ['accounting', 'banks'],
    queryFn: listBankAccounts,
  })

  const saveMut = useMutation({
    mutationFn: (payload) =>
      payload.id
        ? updateBankAccount(payload.id, payload)
        : createBankAccount(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting', 'banks'] })
      toastSuccess(form.id ? 'Bank account updated' : 'Bank account created')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Save failed'),
  })

  const openCreate = () => {
    setForm({
      id: null,
      name: '',
      bank_name: '',
      account_number: '',
      currency: 'TZS',
      opening_balance: '0',
      coa_id: '',
      notes: '',
    })
    sheet.onOpen()
  }

  const openEdit = (row) => {
    setForm({
      id: row.id,
      name: row.name || '',
      bank_name: row.bank_name || '',
      account_number: row.account_number || '',
      currency: row.currency || 'TZS',
      opening_balance: String(row.opening_balance ?? 0),
      coa_id: row.coa_id ? String(row.coa_id) : '',
      notes: row.notes || '',
    })
    sheet.onOpen()
  }

  const columns = useMemo(
    () => [
      { accessorKey: 'name', header: 'Name' },
      {
        accessorKey: 'bank_name',
        header: 'Bank',
        Cell: ({ row }) => row.original.bank_name || '—',
      },
      {
        accessorKey: 'account_number',
        header: 'Account #',
        Cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.account_number || '—'}</span>
        ),
      },
      {
        accessorKey: 'coa',
        header: 'GL account',
        Cell: ({ row }) =>
          row.original.coa
            ? `${row.original.coa.code} ${row.original.coa.name}`
            : '—',
      },
      {
        accessorKey: 'opening_balance',
        header: 'Opening',
        Cell: ({ row }) => money(row.original.opening_balance),
      },
      {
        accessorKey: 'current_balance',
        header: 'Balance (TZS)',
        Cell: ({ row }) => (
          <span className="font-semibold">{money(row.original.current_balance)}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        Cell: ({ row }) => (
          <FormButton size="sm" appearance="light" onPress={() => openEdit(row.original)}>
            Edit
          </FormButton>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <FormButton
          appearance="bordered"
          startContent={<RefreshCw className="h-4 w-4" />}
          onPress={() => listQ.refetch()}
        >
          Refresh
        </FormButton>
        <FormButton
          color="primary"
          className="bg-[#0B3D2E]"
          startContent={<Plus className="h-4 w-4" />}
          onPress={openCreate}
        >
          Add bank account
        </FormButton>
      </div>

      {listQ.isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner color="success" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={listQ.data?.bank_accounts || []}
          emptyMessage="No bank accounts configured."
        />
      )}

      <SideSheet
        isOpen={sheet.isOpen}
        onOpenChange={sheet.onOpenChange}
        title={form.id ? 'Edit bank account' : 'New bank account'}
        size="md"
      >
        <div className="space-y-3 p-1">
          <FormField label="Display name" required>
            <FormInput
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Main operations account"
            />
          </FormField>
          <FormField label="Bank name">
            <FormInput
              value={form.bank_name}
              onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))}
              placeholder="CRDB, NMB…"
            />
          </FormField>
          <FormField label="Account number">
            <FormInput
              value={form.account_number}
              onChange={(e) => setForm((f) => ({ ...f, account_number: e.target.value }))}
            />
          </FormField>
          <FormField label="Opening balance (TZS)">
            <FormInput
              type="number"
              value={form.opening_balance}
              onChange={(e) => setForm((f) => ({ ...f, opening_balance: e.target.value }))}
            />
          </FormField>
          <FormField label="Linked GL account">
            <FormSelect
              options={coaSelectOptions(coaQ.data)}
              value={form.coa_id}
              onChange={(v) => setForm((f) => ({ ...f, coa_id: v }))}
              placeholder="Optional asset account"
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
            className="w-full bg-[#0B3D2E]"
            isLoading={saveMut.isPending}
            onPress={() =>
              saveMut.mutate({
                id: form.id,
                name: form.name,
                bank_name: form.bank_name || null,
                account_number: form.account_number || null,
                currency: form.currency || 'TZS',
                opening_balance: Number(form.opening_balance || 0),
                coa_id: form.coa_id ? Number(form.coa_id) : null,
                notes: form.notes || null,
              })
            }
          >
            Save
          </FormButton>
        </div>
      </SideSheet>
    </div>
  )
}

// ── Budget ───────────────────────────────────────────────────────

function BudgetSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const coaQ = useCoaOptions()
  const yearsQ = useQuery({ queryKey: ['academic', 'years'], queryFn: listYears })
  const [form, setForm] = useState({
    name: '',
    fiscal_year: String(new Date().getFullYear()),
    academic_year_id: '',
    status: 'draft',
    notes: '',
    line_label: '',
    line_amount: '',
    line_coa_id: '',
  })
  const [lines, setLines] = useState([])

  const listQ = useQuery({
    queryKey: ['accounting', 'budgets'],
    queryFn: listBudgets,
  })

  const createMut = useMutation({
    mutationFn: createBudget,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting', 'budgets'] })
      toastSuccess('Budget created')
      sheet.onClose()
      setLines([])
      setForm({
        name: '',
        fiscal_year: String(new Date().getFullYear()),
        academic_year_id: '',
        status: 'draft',
        notes: '',
        line_label: '',
        line_amount: '',
        line_coa_id: '',
      })
    },
    onError: (e) => toastError(e?.message || 'Create failed'),
  })

  const statusMut = useMutation({
    mutationFn: ({ id, status }) => updateBudget(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting', 'budgets'] })
      toastSuccess('Budget updated')
    },
    onError: (e) => toastError(e?.message || 'Update failed'),
  })

  const yearOptions = (yearsQ.data?.academic_years || []).map((y) => ({
    value: String(y.id),
    label: y.name,
  }))

  const columns = useMemo(
    () => [
      { accessorKey: 'name', header: 'Budget' },
      {
        accessorKey: 'fiscal_year',
        header: 'Fiscal year',
        Cell: ({ row }) => row.original.fiscal_year || '—',
      },
      {
        accessorKey: 'total_amount',
        header: 'Total (TZS)',
        Cell: ({ row }) => money(row.original.total_amount),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => (
          <Chip
            size="sm"
            variant="flat"
            color={
              row.original.status === 'active'
                ? 'success'
                : row.original.status === 'closed'
                  ? 'default'
                  : 'warning'
            }
          >
            {row.original.status}
          </Chip>
        ),
      },
      {
        accessorKey: 'lines',
        header: 'Lines',
        Cell: ({ row }) => (row.original.lines || []).length,
      },
      {
        id: 'actions',
        header: '',
        Cell: ({ row }) =>
          row.original.status === 'draft' ? (
            <FormButton
              size="sm"
              appearance="flat"
              color="success"
              onPress={() => statusMut.mutate({ id: row.original.id, status: 'active' })}
            >
              Activate
            </FormButton>
          ) : row.original.status === 'active' ? (
            <FormButton
              size="sm"
              appearance="flat"
              onPress={() => statusMut.mutate({ id: row.original.id, status: 'closed' })}
            >
              Close
            </FormButton>
          ) : null,
      },
    ],
    [statusMut],
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <FormButton
          color="primary"
          className="bg-[#0B3D2E]"
          startContent={<Plus className="h-4 w-4" />}
          onPress={() => {
            setLines([])
            sheet.onOpen()
          }}
        >
          New budget
        </FormButton>
      </div>

      {listQ.isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner color="success" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={listQ.data?.budgets || []}
          emptyMessage="No budgets yet."
        />
      )}

      <SideSheet isOpen={sheet.isOpen} onOpenChange={sheet.onOpenChange} title="Create budget" size="lg">
        <div className="space-y-3 p-1">
          <FormField label="Name" required>
            <FormInput
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="FY 2026 Operating Budget"
            />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Fiscal year">
              <FormInput
                type="number"
                value={form.fiscal_year}
                onChange={(e) => setForm((f) => ({ ...f, fiscal_year: e.target.value }))}
              />
            </FormField>
            <FormField label="Academic year">
              <FormSelect
                options={yearOptions}
                value={form.academic_year_id}
                onChange={(v) => setForm((f) => ({ ...f, academic_year_id: v }))}
                placeholder="Optional"
              />
            </FormField>
          </div>

          <div className="rounded-lg border border-slate-200 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Budget lines
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              <FormInput
                placeholder="Line label"
                value={form.line_label}
                onChange={(e) => setForm((f) => ({ ...f, line_label: e.target.value }))}
              />
              <FormInput
                type="number"
                placeholder="Amount"
                value={form.line_amount}
                onChange={(e) => setForm((f) => ({ ...f, line_amount: e.target.value }))}
              />
              <FormSelect
                options={coaSelectOptions(coaQ.data)}
                value={form.line_coa_id}
                onChange={(v) => setForm((f) => ({ ...f, line_coa_id: v }))}
                placeholder="GL account"
              />
            </div>
            <FormButton
              className="mt-2"
              size="sm"
              appearance="bordered"
              onPress={() => {
                if (!form.line_label || !form.line_amount) return
                setLines((prev) => [
                  ...prev,
                  {
                    label: form.line_label,
                    amount: Number(form.line_amount),
                    coa_id: form.line_coa_id ? Number(form.line_coa_id) : null,
                    period: 'annual',
                  },
                ])
                setForm((f) => ({ ...f, line_label: '', line_amount: '', line_coa_id: '' }))
              }}
            >
              Add line
            </FormButton>
            {lines.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm">
                {lines.map((l, i) => (
                  <li key={i} className="flex justify-between gap-2 border-b border-slate-50 py-1">
                    <span>{l.label}</span>
                    <span className="font-medium">TZS {money(l.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <FormButton
            color="primary"
            className="w-full bg-[#0B3D2E]"
            isLoading={createMut.isPending}
            onPress={() =>
              createMut.mutate({
                name: form.name,
                fiscal_year: Number(form.fiscal_year) || null,
                academic_year_id: form.academic_year_id
                  ? Number(form.academic_year_id)
                  : null,
                status: form.status,
                notes: form.notes || null,
                lines,
              })
            }
          >
            Create budget
          </FormButton>
        </div>
      </SideSheet>
    </div>
  )
}

// ── Cash: income / expenses / cashbook ───────────────────────────

function CashSection({ mode }) {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const typeFilter = mode === 'income' ? 'income' : mode === 'expenses' ? 'expense' : ''
  const coaQ = useCoaOptions(typeFilter === 'income' ? 'income' : typeFilter === 'expense' ? 'expense' : undefined)
  const banksQ = useQuery({
    queryKey: ['accounting', 'banks'],
    queryFn: listBankAccounts,
    staleTime: 60_000,
  })

  const [form, setForm] = useState({
    type: typeFilter || 'income',
    amount: '',
    occurred_on: new Date().toISOString().slice(0, 10),
    payee: '',
    method: 'cash',
    description: '',
    bank_account_id: '',
    coa_id: '',
  })

  const listQ = useQuery({
    queryKey: ['accounting', 'cash', typeFilter],
    queryFn: () =>
      listCashMovements({
        type: typeFilter || undefined,
        per_page: 50,
      }),
  })

  const mut = useMutation({
    mutationFn: createCashMovement,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting', 'cash'] })
      qc.invalidateQueries({ queryKey: ['accounting', 'banks'] })
      toastSuccess(form.type === 'income' ? 'Income recorded' : 'Expense recorded')
      sheet.onClose()
      setForm((f) => ({
        ...f,
        amount: '',
        payee: '',
        description: '',
        coa_id: '',
        bank_account_id: '',
      }))
    },
    onError: (e) => toastError(e?.message || 'Save failed'),
  })

  const summary = listQ.data?.summary || {}
  const bankOptions = (banksQ.data?.bank_accounts || []).map((b) => ({
    value: String(b.id),
    label: b.name,
  }))

  const columns = useMemo(
    () => [
      {
        accessorKey: 'reference',
        header: 'Ref',
        Cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.reference}</span>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        Cell: ({ row }) => (
          <Chip
            size="sm"
            variant="flat"
            color={row.original.type === 'income' ? 'success' : 'danger'}
          >
            {row.original.type}
          </Chip>
        ),
      },
      {
        accessorKey: 'occurred_on',
        header: 'Date',
        Cell: ({ row }) =>
          row.original.occurred_on
            ? String(row.original.occurred_on).slice(0, 10)
            : '—',
      },
      {
        accessorKey: 'description',
        header: 'Description',
        Cell: ({ row }) => row.original.description || row.original.payee || '—',
      },
      {
        accessorKey: 'amount',
        header: 'Amount (TZS)',
        Cell: ({ row }) => (
          <span
            className={
              row.original.type === 'income'
                ? 'font-medium text-emerald-700'
                : 'font-medium text-rose-700'
            }
          >
            {row.original.type === 'income' ? '+' : '−'}
            {money(row.original.amount)}
          </span>
        ),
      },
      {
        accessorKey: 'method',
        header: 'Method',
        Cell: ({ row }) => row.original.method || '—',
      },
      {
        accessorKey: 'bank',
        header: 'Bank',
        Cell: ({ row }) => row.original.bank_account?.name || '—',
      },
      {
        accessorKey: 'coa',
        header: 'Account',
        Cell: ({ row }) =>
          row.original.coa
            ? `${row.original.coa.code}`
            : '—',
      },
    ],
    [],
  )

  const title =
    mode === 'income' ? 'Record income' : mode === 'expenses' ? 'Record expense' : 'Record movement'

  return (
    <div className="space-y-4">
      {mode === 'cashbook' && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border border-slate-200 shadow-none">
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Total income</p>
              <p className="text-lg font-semibold text-emerald-700">
                TZS {money(summary.total_income)}
              </p>
            </CardBody>
          </Card>
          <Card className="border border-slate-200 shadow-none">
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Total expenses</p>
              <p className="text-lg font-semibold text-rose-700">
                TZS {money(summary.total_expense)}
              </p>
            </CardBody>
          </Card>
          <Card className="border border-slate-200 shadow-none">
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">Net cash</p>
              <p className="text-lg font-semibold text-slate-900">TZS {money(summary.net)}</p>
            </CardBody>
          </Card>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <FormButton
          appearance="bordered"
          startContent={<RefreshCw className="h-4 w-4" />}
          onPress={() => listQ.refetch()}
        >
          Refresh
        </FormButton>
        <FormButton
          color="primary"
          className="bg-[#0B3D2E]"
          startContent={<Plus className="h-4 w-4" />}
          onPress={() => {
            setForm((f) => ({
              ...f,
              type: typeFilter || f.type || 'income',
            }))
            sheet.onOpen()
          }}
        >
          {title}
        </FormButton>
      </div>

      {listQ.isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner color="success" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={listQ.data?.movements || []}
          emptyMessage="No cash movements yet."
        />
      )}

      <SideSheet isOpen={sheet.isOpen} onOpenChange={sheet.onOpenChange} title={title} size="md">
        <div className="space-y-3 p-1">
          {mode === 'cashbook' && (
            <FormField label="Type" required>
              <FormSelect
                options={[
                  { value: 'income', label: 'Income' },
                  { value: 'expense', label: 'Expense' },
                ]}
                value={form.type}
                onChange={(v) => setForm((f) => ({ ...f, type: v, coa_id: '' }))}
              />
            </FormField>
          )}
          <FormField label="Amount (TZS)" required>
            <FormInput
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </FormField>
          <FormField label="Date">
            <FormInput
              type="date"
              value={form.occurred_on}
              onChange={(e) => setForm((f) => ({ ...f, occurred_on: e.target.value }))}
            />
          </FormField>
          <FormField label={form.type === 'income' ? 'Received from' : 'Payee / supplier'}>
            <FormInput
              value={form.payee}
              onChange={(e) => setForm((f) => ({ ...f, payee: e.target.value }))}
            />
          </FormField>
          <FormField label="Description">
            <FormInput
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </FormField>
          <FormField label="Method">
            <FormSelect
              options={[
                { value: 'cash', label: 'Cash' },
                { value: 'bank', label: 'Bank' },
                { value: 'mobile_money', label: 'Mobile money' },
                { value: 'cheque', label: 'Cheque' },
                { value: 'other', label: 'Other' },
              ]}
              value={form.method}
              onChange={(v) => setForm((f) => ({ ...f, method: v }))}
            />
          </FormField>
          <FormField label="Bank account">
            <FormSelect
              options={bankOptions}
              value={form.bank_account_id}
              onChange={(v) => setForm((f) => ({ ...f, bank_account_id: v }))}
              placeholder="Optional"
            />
          </FormField>
          <FormField label="GL account">
            <FormSelect
              options={coaSelectOptions(coaQ.data)}
              value={form.coa_id}
              onChange={(v) => setForm((f) => ({ ...f, coa_id: v }))}
              placeholder="Optional"
            />
          </FormField>
          <FormButton
            color="primary"
            className="w-full bg-[#0B3D2E]"
            isLoading={mut.isPending}
            onPress={() =>
              mut.mutate({
                type: form.type,
                amount: Number(form.amount),
                occurred_on: form.occurred_on || null,
                payee: form.payee || null,
                method: form.method,
                description: form.description || null,
                bank_account_id: form.bank_account_id
                  ? Number(form.bank_account_id)
                  : null,
                coa_id: form.coa_id ? Number(form.coa_id) : null,
              })
            }
          >
            Save
          </FormButton>
        </div>
      </SideSheet>
    </div>
  )
}

// ── Journal entries ──────────────────────────────────────────────

function JournalsSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const coaQ = useCoaOptions()
  const [memo, setMemo] = useState('')
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10))
  const [lines, setLines] = useState([
    { coa_id: '', debit: '', credit: '', description: '' },
    { coa_id: '', debit: '', credit: '', description: '' },
  ])

  const listQ = useQuery({
    queryKey: ['accounting', 'journals'],
    queryFn: () => listJournalEntries({ per_page: 40 }),
  })

  const mut = useMutation({
    mutationFn: createJournalEntry,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting'] })
      toastSuccess('Journal entry posted')
      sheet.onClose()
      setMemo('')
      setLines([
        { coa_id: '', debit: '', credit: '', description: '' },
        { coa_id: '', debit: '', credit: '', description: '' },
      ])
    },
    onError: (e) => toastError(e?.message || 'Post failed'),
  })

  const debitTotal = lines.reduce((s, l) => s + Number(l.debit || 0), 0)
  const creditTotal = lines.reduce((s, l) => s + Number(l.credit || 0), 0)
  const balanced = Math.abs(debitTotal - creditTotal) < 0.02 && debitTotal > 0

  const columns = useMemo(
    () => [
      {
        accessorKey: 'entry_number',
        header: 'Entry #',
        Cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold">
            {row.original.entry_number}
          </span>
        ),
      },
      {
        accessorKey: 'entry_date',
        header: 'Date',
        Cell: ({ row }) =>
          row.original.entry_date
            ? String(row.original.entry_date).slice(0, 10)
            : '—',
      },
      {
        accessorKey: 'memo',
        header: 'Memo',
        Cell: ({ row }) => row.original.memo || '—',
      },
      {
        accessorKey: 'lines',
        header: 'Lines',
        Cell: ({ row }) => (row.original.lines || []).length,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => (
          <Chip size="sm" variant="flat" color="success">
            {row.original.status}
          </Chip>
        ),
      },
      {
        id: 'detail',
        header: 'Detail',
        Cell: ({ row }) => {
          const ls = row.original.lines || []
          return (
            <div className="max-w-xs space-y-0.5 text-xs text-slate-600">
              {ls.slice(0, 4).map((l) => (
                <div key={l.id} className="flex justify-between gap-2">
                  <span>{l.account?.code || l.coa_id}</span>
                  <span>
                    Dr {money(l.debit)} / Cr {money(l.credit)}
                  </span>
                </div>
              ))}
            </div>
          )
        },
      },
    ],
    [],
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <FormButton
          appearance="bordered"
          startContent={<RefreshCw className="h-4 w-4" />}
          onPress={() => listQ.refetch()}
        >
          Refresh
        </FormButton>
        <FormButton
          color="primary"
          className="bg-[#0B3D2E]"
          startContent={<Plus className="h-4 w-4" />}
          onPress={() => sheet.onOpen()}
        >
          New journal entry
        </FormButton>
      </div>

      {listQ.isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner color="success" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={listQ.data?.entries || []}
          emptyMessage="No journal entries posted."
        />
      )}

      <SideSheet
        isOpen={sheet.isOpen}
        onOpenChange={sheet.onOpenChange}
        title="Post journal entry"
        size="lg"
      >
        <div className="space-y-3 p-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Entry date" required>
              <FormInput
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
              />
            </FormField>
            <FormField label="Memo">
              <FormInput value={memo} onChange={(e) => setMemo(e.target.value)} />
            </FormField>
          </div>

          <div className="space-y-2 rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Lines (debits must equal credits)
            </p>
            {lines.map((line, idx) => (
              <div key={idx} className="grid gap-2 sm:grid-cols-4">
                <FormSelect
                  options={coaSelectOptions(coaQ.data)}
                  value={line.coa_id}
                  onChange={(v) =>
                    setLines((prev) =>
                      prev.map((l, i) => (i === idx ? { ...l, coa_id: v } : l)),
                    )
                  }
                  placeholder="Account"
                />
                <FormInput
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Debit"
                  value={line.debit}
                  onChange={(e) =>
                    setLines((prev) =>
                      prev.map((l, i) =>
                        i === idx ? { ...l, debit: e.target.value, credit: '' } : l,
                      ),
                    )
                  }
                />
                <FormInput
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Credit"
                  value={line.credit}
                  onChange={(e) =>
                    setLines((prev) =>
                      prev.map((l, i) =>
                        i === idx ? { ...l, credit: e.target.value, debit: '' } : l,
                      ),
                    )
                  }
                />
                <FormInput
                  placeholder="Description"
                  value={line.description}
                  onChange={(e) =>
                    setLines((prev) =>
                      prev.map((l, i) =>
                        i === idx ? { ...l, description: e.target.value } : l,
                      ),
                    )
                  }
                />
              </div>
            ))}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <FormButton
                size="sm"
                appearance="bordered"
                onPress={() =>
                  setLines((prev) => [
                    ...prev,
                    { coa_id: '', debit: '', credit: '', description: '' },
                  ])
                }
              >
                Add line
              </FormButton>
              <p className="text-sm">
                Dr <strong>{money(debitTotal)}</strong> · Cr{' '}
                <strong>{money(creditTotal)}</strong>{' '}
                {balanced ? (
                  <Chip size="sm" color="success" variant="flat">
                    Balanced
                  </Chip>
                ) : (
                  <Chip size="sm" color="warning" variant="flat">
                    Unbalanced
                  </Chip>
                )}
              </p>
            </div>
          </div>

          <FormButton
            color="primary"
            className="w-full bg-[#0B3D2E]"
            isLoading={mut.isPending}
            isDisabled={!balanced}
            onPress={() =>
              mut.mutate({
                entry_date: entryDate,
                memo: memo || null,
                lines: lines
                  .filter((l) => l.coa_id && (Number(l.debit) > 0 || Number(l.credit) > 0))
                  .map((l) => ({
                    coa_id: Number(l.coa_id),
                    debit: Number(l.debit || 0),
                    credit: Number(l.credit || 0),
                    description: l.description || null,
                  })),
              })
            }
          >
            Post entry
          </FormButton>
        </div>
      </SideSheet>
    </div>
  )
}

// ── Ledger ───────────────────────────────────────────────────────

function LedgerSection() {
  const coaQ = useCoaOptions()
  const [coaId, setCoaId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const ledgerQ = useQuery({
    queryKey: ['accounting', 'ledger', coaId, from, to],
    queryFn: () =>
      getGeneralLedger({
        coa_id: coaId,
        from: from || undefined,
        to: to || undefined,
      }),
    enabled: !!coaId,
  })

  const columns = useMemo(
    () => [
      {
        accessorKey: 'entry_date',
        header: 'Date',
        Cell: ({ row }) => row.original.entry_date || '—',
      },
      {
        accessorKey: 'entry_number',
        header: 'Entry',
        Cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.entry_number}</span>
        ),
      },
      {
        accessorKey: 'memo',
        header: 'Memo',
        Cell: ({ row }) => row.original.memo || row.original.description || '—',
      },
      {
        accessorKey: 'debit',
        header: 'Debit',
        Cell: ({ row }) => money(row.original.debit),
      },
      {
        accessorKey: 'credit',
        header: 'Credit',
        Cell: ({ row }) => money(row.original.credit),
      },
      {
        accessorKey: 'balance',
        header: 'Balance',
        Cell: ({ row }) => (
          <span className="font-semibold">{money(row.original.balance)}</span>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <FormField label="Account" required>
          <FormSelect
            className="min-w-[240px]"
            options={coaSelectOptions(coaQ.data)}
            value={coaId}
            onChange={setCoaId}
            placeholder="Select account"
          />
        </FormField>
        <FormField label="From">
          <FormInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </FormField>
        <FormField label="To">
          <FormInput type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </FormField>
      </div>

      {!coaId ? (
        <p className="text-sm text-slate-500">Select an account to view the general ledger.</p>
      ) : ledgerQ.isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner color="success" />
        </div>
      ) : ledgerQ.isError ? (
        <p className="text-sm text-rose-600">{ledgerQ.error?.message}</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {ledgerQ.data?.account?.code} — {ledgerQ.data?.account?.name}
              </p>
              <p className="text-xs capitalize text-slate-500">{ledgerQ.data?.account?.type}</p>
            </div>
            <p className="text-sm">
              Closing balance:{' '}
              <strong className="text-slate-900">
                TZS {money(ledgerQ.data?.closing_balance)}
              </strong>
            </p>
          </div>
          <DataTable
            columns={columns}
            data={ledgerQ.data?.lines || []}
            emptyMessage="No postings for this account in the selected period."
          />
        </>
      )}
    </div>
  )
}

// ── Trial balance ────────────────────────────────────────────────

function TrialBalanceSection() {
  const q = useQuery({
    queryKey: ['accounting', 'trial-balance'],
    queryFn: getTrialBalance,
  })

  const totals = q.data?.totals || {}

  const columns = useMemo(
    () => [
      {
        accessorKey: 'code',
        header: 'Code',
        Cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold">{row.original.code}</span>
        ),
      },
      { accessorKey: 'name', header: 'Account' },
      {
        accessorKey: 'type',
        header: 'Type',
        Cell: ({ row }) => (
          <Chip size="sm" variant="flat" color={typeColor[row.original.type] || 'default'}>
            {row.original.type}
          </Chip>
        ),
      },
      {
        accessorKey: 'debit',
        header: 'Debit (TZS)',
        Cell: ({ row }) => money(row.original.debit),
      },
      {
        accessorKey: 'credit',
        header: 'Credit (TZS)',
        Cell: ({ row }) => money(row.original.credit),
      },
    ],
    [],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-3 text-sm">
          <span>
            Total debit: <strong>{money(totals.debit)}</strong>
          </span>
          <span>
            Total credit: <strong>{money(totals.credit)}</strong>
          </span>
          <Chip size="sm" color={totals.balanced ? 'success' : 'danger'} variant="flat">
            {totals.balanced ? 'Balanced' : 'Out of balance'}
          </Chip>
        </div>
        <FormButton
          appearance="bordered"
          startContent={<RefreshCw className="h-4 w-4" />}
          onPress={() => q.refetch()}
        >
          Refresh
        </FormButton>
      </div>

      {q.isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner color="success" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={q.data?.rows || []}
          emptyMessage="No journal activity yet. Post entries to populate the trial balance."
        />
      )}
    </div>
  )
}

// ── P&L ──────────────────────────────────────────────────────────

function PnLSection() {
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10)
  const today = new Date().toISOString().slice(0, 10)
  const [from, setFrom] = useState(yearStart)
  const [to, setTo] = useState(today)

  const q = useQuery({
    queryKey: ['accounting', 'pnl', from, to],
    queryFn: () => getProfitAndLoss({ from, to }),
  })

  const d = q.data || {}

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <FormField label="From">
          <FormInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </FormField>
        <FormField label="To">
          <FormInput type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </FormField>
        <FormButton appearance="bordered" onPress={() => q.refetch()}>
          Run
        </FormButton>
      </div>

      {q.isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner color="success" />
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="border border-slate-200 shadow-none">
              <CardBody className="py-3">
                <p className="text-xs text-slate-500">Total income</p>
                <p className="text-xl font-semibold text-emerald-700">
                  TZS {money(d.total_income)}
                </p>
              </CardBody>
            </Card>
            <Card className="border border-slate-200 shadow-none">
              <CardBody className="py-3">
                <p className="text-xs text-slate-500">Total expenses</p>
                <p className="text-xl font-semibold text-rose-700">
                  TZS {money(d.total_expenses)}
                </p>
              </CardBody>
            </Card>
            <Card className="border border-slate-200 shadow-none">
              <CardBody className="py-3">
                <p className="text-xs text-slate-500">Net profit / (loss)</p>
                <p
                  className={`text-xl font-semibold ${
                    Number(d.net_profit) >= 0 ? 'text-emerald-800' : 'text-rose-800'
                  }`}
                >
                  TZS {money(d.net_profit)}
                </p>
              </CardBody>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border border-slate-200 shadow-none">
              <CardHeader>
                <h3 className="text-sm font-semibold">Income</h3>
              </CardHeader>
              <CardBody className="pt-0">
                <StatementLines rows={d.income || []} />
              </CardBody>
            </Card>
            <Card className="border border-slate-200 shadow-none">
              <CardHeader>
                <h3 className="text-sm font-semibold">Expenses</h3>
              </CardHeader>
              <CardBody className="pt-0">
                <StatementLines rows={d.expenses || []} />
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

function StatementLines({ rows, cashExtra, cashLabel }) {
  if ((!rows || rows.length === 0) && !cashExtra) {
    return <p className="text-sm text-slate-500">No activity in this period.</p>
  }
  return (
    <ul className="space-y-1 text-sm">
      {(rows || []).map((r) => (
        <li key={r.coa_id} className="flex justify-between gap-2 border-b border-slate-50 py-1.5">
          <span>
            <span className="font-mono text-xs text-slate-500">{r.code}</span> {r.name}
          </span>
          <span className="font-medium">{money(r.amount ?? r.balance)}</span>
        </li>
      ))}
      {Number(cashExtra) > 0 && (
        <li className="flex justify-between gap-2 border-b border-slate-50 py-1.5 text-slate-600">
          <span>{cashLabel}</span>
          <span className="font-medium">{money(cashExtra)}</span>
        </li>
      )}
    </ul>
  )
}

// ── Balance sheet ────────────────────────────────────────────────

function BalanceSheetSection() {
  const today = new Date().toISOString().slice(0, 10)
  const [asOf, setAsOf] = useState(today)

  const q = useQuery({
    queryKey: ['accounting', 'balance-sheet', asOf],
    queryFn: () => getBalanceSheet({ as_of: asOf }),
  })

  const d = q.data || {}
  const t = d.totals || {}

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <FormField label="As of">
          <FormInput type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} />
        </FormField>
        <FormButton appearance="bordered" onPress={() => q.refetch()}>
          Run
        </FormButton>
      </div>

      {q.isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner color="success" />
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="border border-slate-200 shadow-none">
              <CardBody className="py-3">
                <p className="text-xs text-slate-500">Total assets</p>
                <p className="text-xl font-semibold">TZS {money(t.assets)}</p>
              </CardBody>
            </Card>
            <Card className="border border-slate-200 shadow-none">
              <CardBody className="py-3">
                <p className="text-xs text-slate-500">Total liabilities</p>
                <p className="text-xl font-semibold">TZS {money(t.liabilities)}</p>
              </CardBody>
            </Card>
            <Card className="border border-slate-200 shadow-none">
              <CardBody className="py-3">
                <p className="text-xs text-slate-500">Equity</p>
                <p className="text-xl font-semibold">TZS {money(t.equity)}</p>
              </CardBody>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="border border-slate-200 shadow-none">
              <CardHeader>
                <h3 className="text-sm font-semibold">Assets</h3>
              </CardHeader>
              <CardBody className="pt-0">
                <StatementLines rows={d.assets || []} />
              </CardBody>
            </Card>
            <Card className="border border-slate-200 shadow-none">
              <CardHeader>
                <h3 className="text-sm font-semibold">Liabilities</h3>
              </CardHeader>
              <CardBody className="pt-0">
                <StatementLines rows={d.liabilities || []} />
              </CardBody>
            </Card>
            <Card className="border border-slate-200 shadow-none">
              <CardHeader>
                <h3 className="text-sm font-semibold">Equity</h3>
              </CardHeader>
              <CardBody className="pt-0">
                <StatementLines rows={d.equity || []} />
              </CardBody>
            </Card>
          </div>

          <p className="text-xs text-slate-500">
            Liabilities + equity: TZS {money(t.liabilities_and_equity)} · Assets: TZS{' '}
            {money(t.assets)}
            {Math.abs(Number(t.assets || 0) - Number(t.liabilities_and_equity || 0)) < 0.02
              ? ' · Equation holds'
              : ' · Equation may differ until full double-entry is posted for all cash activity'}
          </p>
        </>
      )}
    </div>
  )
}

export default function AccountingWorkspace() {
  const { pathname } = useLocation()
  const meta = sectionMeta[pathname] || sectionMeta['/accounting']

  let body
  switch (meta.section) {
    case 'overview':
      body = <OverviewPanel />
      break
    case 'coa':
      body = <CoaSection />
      break
    case 'banks':
      body = <BanksSection />
      break
    case 'budget':
      body = <BudgetSection />
      break
    case 'income':
      body = <CashSection mode="income" />
      break
    case 'expenses':
      body = <CashSection mode="expenses" />
      break
    case 'cashbook':
      body = <CashSection mode="cashbook" />
      break
    case 'journals':
      body = <JournalsSection />
      break
    case 'ledger':
      body = <LedgerSection />
      break
    case 'trial-balance':
      body = <TrialBalanceSection />
      break
    case 'pnl':
      body = <PnLSection />
      break
    case 'balance-sheet':
      body = <BalanceSheetSection />
      break
    default:
      body = <OverviewPanel />
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title={meta.title}
          description={meta.description}
          breadcrumbs={[
            { label: 'Accounting', href: '/accounting' },
            { label: meta.title },
          ]}
        />
        {body}
      </div>
    </DashboardLayout>
  )
}
