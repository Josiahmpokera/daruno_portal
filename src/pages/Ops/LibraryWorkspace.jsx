import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardBody, CardHeader, Chip, useDisclosure } from '@heroui/react'
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
  createLibBook,
  createLibCategory,
  createLibLoan,
  createLibReservation,
  getLibReports,
  listLibBooks,
  listLibCategories,
  listLibFines,
  listLibLoans,
  listLibOverdue,
  listLibReservations,
  listStudents,
  returnLibLoan,
  updateLibReservation,
} from '../../api/domain.js'
import { SectionSkeleton } from '../../components/Loading'

const money = (n) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })
const studentLabel = (s) =>
  s
    ? `${[s.first_name, s.last_name].filter(Boolean).join(' ')}${s.admission_number ? ` (${s.admission_number})` : ''}`
    : '—'

const META = {
  '/library': { title: 'Library', section: 'overview', desc: 'Catalogue, circulation, overdue and fines' },
  '/library/catalogue': { title: 'Book Catalogue', section: 'catalogue', desc: 'All titles and copies' },
  '/library/categories': { title: 'Categories', section: 'categories', desc: 'Library subject categories' },
  '/library/isbn': { title: 'ISBN', section: 'isbn', desc: 'Search and manage books by ISBN' },
  '/library/borrow': { title: 'Borrow Books', section: 'borrow', desc: 'Issue books to students' },
  '/library/return': { title: 'Return Books', section: 'return', desc: 'Return issued books and apply fines' },
  '/library/reservations': { title: 'Reservations', section: 'reservations', desc: 'Hold requests for titles' },
  '/library/overdue': { title: 'Overdue', section: 'overdue', desc: 'Loans past due date' },
  '/library/fines': { title: 'Fines', section: 'fines', desc: 'Library fine register' },
  '/library/reports': { title: 'Library Reports', section: 'reports', desc: 'Circulation summary' },
}

function useStudents() {
  return useQuery({
    queryKey: ['students', 'ops-lib'],
    queryFn: () => listStudents({ per_page: 100, status: 'active' }),
    staleTime: 60_000,
  })
}

function Overview() {
  const navigate = useNavigate()
  const q = useQuery({ queryKey: ['library', 'reports'], queryFn: getLibReports })
  const s = q.data?.summary || {}
  const cards = [
    { t: 'Catalogue', d: `${s.titles ?? 0} titles · ${s.total_copies ?? 0} copies`, p: '/library/catalogue' },
    { t: 'On loan', d: `${s.on_loan ?? 0} active loans`, p: '/library/borrow' },
    { t: 'Overdue', d: `${s.overdue ?? 0} past due`, p: '/library/overdue' },
    { t: 'Fines', d: `TZS ${money(s.total_fines)}`, p: '/library/fines' },
    { t: 'Reservations', d: `${s.active_reservations ?? 0} active`, p: '/library/reservations' },
    { t: 'Reports', d: 'Circulation analytics', p: '/library/reports' },
  ]
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((c) => (
        <Card key={c.p} isPressable className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]" onPress={() => navigate(c.p)}>
          <CardHeader className="pb-1"><h3 className="text-sm font-semibold">{c.t}</h3></CardHeader>
          <CardBody className="pt-0"><p className="text-xs text-slate-500">{c.d}</p></CardBody>
        </Card>
      ))}
    </div>
  )
}

function CategoriesSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [form, setForm] = useState({ name: '', code: '', description: '' })
  const listQ = useQuery({ queryKey: ['library', 'categories'], queryFn: listLibCategories })
  const mut = useMutation({
    mutationFn: createLibCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library', 'categories'] })
      toastSuccess('Category created')
      sheet.onClose()
      setForm({ name: '', code: '', description: '' })
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  const columns = useMemo(
    () => [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'code', header: 'Code', Cell: ({ row }) => row.original.code || '—' },
      { accessorKey: 'books_count', header: 'Books', Cell: ({ row }) => row.original.books_count ?? 0 },
    ],
    [],
  )
  return (
    <Shell onAdd={() => sheet.onOpen()} addLabel="Add category" loading={listQ.isLoading} onRefresh={() => listQ.refetch()}>
      <DataTable columns={columns} data={listQ.data?.categories || []} emptyMessage="No categories." />
      <SideSheet isOpen={sheet.isOpen} onOpenChange={sheet.onOpenChange} title="New category" size="md">
        <div className="space-y-3">
          <FormField label="Name" required><FormInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></FormField>
          <FormField label="Code"><FormInput value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} /></FormField>
          <FormField label="Description"><FormTextarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></FormField>
          <FormButton className="w-full bg-[#12544f]" color="primary" isLoading={mut.isPending} onPress={() => mut.mutate(form)}>Save</FormButton>
        </div>
      </SideSheet>
    </Shell>
  )
}

function CatalogueSection({ isbnMode = false }) {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [q, setQ] = useState('')
  const [isbn, setIsbn] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const catsQ = useQuery({ queryKey: ['library', 'categories'], queryFn: listLibCategories })
  const listQ = useQuery({
    queryKey: ['library', 'books', q, isbn, isbnMode, categoryId],
    queryFn: () =>
      listLibBooks({
        q: isbnMode ? undefined : q || undefined,
        isbn: isbnMode ? isbn || undefined : undefined,
        category_id: categoryId || undefined,
        per_page: 50,
      }),
    placeholderData: (prev) => prev,
  })
  const [form, setForm] = useState({
    title: '', author: '', isbn: '', category_id: '', total_copies: '1', shelf_location: '', publisher: '',
  })
  const mut = useMutation({
    mutationFn: createLibBook,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library'] })
      toastSuccess('Book added')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  const columns = useMemo(
    () => [
      { accessorKey: 'title', header: 'Title' },
      { accessorKey: 'author', header: 'Author', Cell: ({ row }) => row.original.author || '—' },
      { accessorKey: 'isbn', header: 'ISBN', Cell: ({ row }) => row.original.isbn || '—' },
      { accessorKey: 'category', header: 'Category', Cell: ({ row }) => row.original.library_category?.name || row.original.category || '—' },
      { accessorKey: 'total_copies', header: 'Copies' },
      { accessorKey: 'available_copies', header: 'Available' },
      { accessorKey: 'shelf_location', header: 'Shelf', Cell: ({ row }) => row.original.shelf_location || '—' },
    ],
    [],
  )
  return (
    <div className="space-y-4">
      <DataTable
        key={isbnMode ? 'isbn' : 'catalogue'}
        columns={columns}
        data={listQ.data?.books || []}
        isLoading={listQ.isLoading}
        emptyMessage="No books found."
        searchPlaceholder={isbnMode ? 'Search by ISBN…' : 'Search title, author, ISBN…'}
        search={isbnMode ? isbn : q}
        onSearchChange={isbnMode ? setIsbn : setQ}
        filters={[
          {
            key: 'category_id',
            label: 'Category',
            value: categoryId,
            onChange: setCategoryId,
            options: (catsQ.data?.categories || []).map((c) => ({ value: String(c.id), label: c.name })),
          },
        ]}
        onRefresh={() => listQ.refetch()}
        isRefreshing={listQ.isFetching}
        toolbarActions={
          <FormButton className="h-8 min-h-8 bg-[#12544f]" color="primary" startContent={<Plus className="h-4 w-4" />} onPress={() => sheet.onOpen()}>
            Add book
          </FormButton>
        }
      />
      <SideSheet isOpen={sheet.isOpen} onOpenChange={sheet.onOpenChange} title="Add book" size="md">
        <div className="space-y-3">
          <FormField label="Title" required><FormInput value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></FormField>
          <FormField label="Author"><FormInput value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} /></FormField>
          <FormField label="ISBN"><FormInput value={form.isbn} onChange={(e) => setForm((f) => ({ ...f, isbn: e.target.value }))} /></FormField>
          <FormField label="Category">
            <FormSelect
              options={(catsQ.data?.categories || []).map((c) => ({ value: String(c.id), label: c.name }))}
              value={form.category_id}
              onChange={(v) => setForm((f) => ({ ...f, category_id: v }))}
              placeholder="Optional"
            />
          </FormField>
          <FormField label="Copies"><FormInput type="number" min="1" value={form.total_copies} onChange={(e) => setForm((f) => ({ ...f, total_copies: e.target.value }))} /></FormField>
          <FormField label="Shelf"><FormInput value={form.shelf_location} onChange={(e) => setForm((f) => ({ ...f, shelf_location: e.target.value }))} /></FormField>
          <FormField label="Publisher"><FormInput value={form.publisher} onChange={(e) => setForm((f) => ({ ...f, publisher: e.target.value }))} /></FormField>
          <FormButton
            className="w-full bg-[#12544f]"
            color="primary"
            isLoading={mut.isPending}
            onPress={() =>
              mut.mutate({
                ...form,
                category_id: form.category_id ? Number(form.category_id) : null,
                total_copies: Number(form.total_copies || 1),
              })
            }
          >
            Save book
          </FormButton>
        </div>
      </SideSheet>
    </div>
  )
}

function BorrowSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const studentsQ = useStudents()
  const booksQ = useQuery({ queryKey: ['library', 'books', 'avail'], queryFn: () => listLibBooks({ per_page: 100 }) })
  const listQ = useQuery({ queryKey: ['library', 'loans', 'issued'], queryFn: () => listLibLoans({ status: 'issued', per_page: 50 }) })
  const [form, setForm] = useState({ book_id: '', student_id: '', days: '14' })
  const mut = useMutation({
    mutationFn: createLibLoan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library'] })
      toastSuccess('Book issued')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  const columns = useMemo(
    () => [
      { accessorKey: 'book', header: 'Book', Cell: ({ row }) => row.original.book?.title || '—' },
      { accessorKey: 'student', header: 'Student', Cell: ({ row }) => studentLabel(row.original.student) },
      { accessorKey: 'issued_at', header: 'Issued', Cell: ({ row }) => String(row.original.issued_at || '').slice(0, 10) },
      { accessorKey: 'due_at', header: 'Due', Cell: ({ row }) => String(row.original.due_at || '').slice(0, 10) },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => <Chip size="sm" variant="flat" color={row.original.status === 'overdue' ? 'danger' : 'success'}>{row.original.status}</Chip>,
      },
    ],
    [],
  )
  return (
    <Shell onAdd={() => sheet.onOpen()} addLabel="Issue book" loading={listQ.isLoading} onRefresh={() => listQ.refetch()}>
      <DataTable columns={columns} data={listQ.data?.loans || []} emptyMessage="No active loans." />
      <SideSheet isOpen={sheet.isOpen} onOpenChange={sheet.onOpenChange} title="Issue book" size="md">
        <div className="space-y-3">
          <FormField label="Student" required>
            <FormSelect
              options={(studentsQ.data?.students || []).map((s) => ({ value: String(s.id), label: studentLabel(s) }))}
              value={form.student_id}
              onChange={(v) => setForm((f) => ({ ...f, student_id: v }))}
              placeholder="Select student"
            />
          </FormField>
          <FormField label="Book" required>
            <FormSelect
              options={(booksQ.data?.books || [])
                .filter((b) => (b.available_copies ?? 0) > 0)
                .map((b) => ({ value: String(b.id), label: `${b.title} (${b.available_copies} avail)` }))}
              value={form.book_id}
              onChange={(v) => setForm((f) => ({ ...f, book_id: v }))}
              placeholder="Select book"
            />
          </FormField>
          <FormField label="Loan days"><FormInput type="number" min="1" value={form.days} onChange={(e) => setForm((f) => ({ ...f, days: e.target.value }))} /></FormField>
          <FormButton
            className="w-full bg-[#12544f]"
            color="primary"
            isLoading={mut.isPending}
            onPress={() =>
              mut.mutate({
                student_id: Number(form.student_id),
                book_id: Number(form.book_id),
                days: Number(form.days || 14),
              })
            }
          >
            Issue
          </FormButton>
        </div>
      </SideSheet>
    </Shell>
  )
}

function ReturnSection() {
  const qc = useQueryClient()
  const listQ = useQuery({
    queryKey: ['library', 'loans', 'open'],
    queryFn: () => listLibLoans({ per_page: 50 }),
  })
  const mut = useMutation({
    mutationFn: (id) => returnLibLoan(id, { fine_per_day: 500 }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['library'] })
      const fine = data?.loan?.fine_amount
      toastSuccess(fine > 0 ? `Returned — fine TZS ${money(fine)}` : 'Book returned')
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  const open = (listQ.data?.loans || []).filter((l) => l.status === 'issued' || l.status === 'overdue')
  const columns = useMemo(
    () => [
      { accessorKey: 'book', header: 'Book', Cell: ({ row }) => row.original.book?.title || '—' },
      { accessorKey: 'student', header: 'Student', Cell: ({ row }) => studentLabel(row.original.student) },
      { accessorKey: 'due_at', header: 'Due', Cell: ({ row }) => String(row.original.due_at || '').slice(0, 10) },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => <Chip size="sm" variant="flat" color={row.original.status === 'overdue' ? 'danger' : 'warning'}>{row.original.status}</Chip>,
      },
      {
        id: 'actions',
        header: '',
        Cell: ({ row }) => (
          <FormButton size="sm" appearance="flat" color="success" isLoading={mut.isPending} onPress={() => mut.mutate(row.original.id)}>
            Return
          </FormButton>
        ),
      },
    ],
    [mut],
  )
  return listQ.isLoading ? (
    <SectionSkeleton />
  ) : (
    <DataTable columns={columns} data={open} emptyMessage="No books out for return." />
  )
}

function ReservationsSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const studentsQ = useStudents()
  const booksQ = useQuery({ queryKey: ['library', 'books', 'res'], queryFn: () => listLibBooks({ per_page: 100 }) })
  const listQ = useQuery({ queryKey: ['library', 'reservations'], queryFn: listLibReservations })
  const [form, setForm] = useState({ book_id: '', student_id: '', notes: '' })
  const mut = useMutation({
    mutationFn: createLibReservation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library', 'reservations'] })
      toastSuccess('Reservation created')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  const cancelMut = useMutation({
    mutationFn: (id) => updateLibReservation(id, { status: 'cancelled' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library', 'reservations'] })
      toastSuccess('Reservation cancelled')
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  const columns = useMemo(
    () => [
      { accessorKey: 'book', header: 'Book', Cell: ({ row }) => row.original.book?.title || '—' },
      { accessorKey: 'student', header: 'Student', Cell: ({ row }) => studentLabel(row.original.student) },
      { accessorKey: 'reserved_on', header: 'Reserved', Cell: ({ row }) => String(row.original.reserved_on || '').slice(0, 10) },
      { accessorKey: 'expires_on', header: 'Expires', Cell: ({ row }) => String(row.original.expires_on || '').slice(0, 10) },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => <Chip size="sm" variant="flat">{row.original.status}</Chip>,
      },
      {
        id: 'actions',
        header: '',
        Cell: ({ row }) =>
          row.original.status === 'active' ? (
            <FormButton size="sm" appearance="flat" onPress={() => cancelMut.mutate(row.original.id)}>Cancel</FormButton>
          ) : null,
      },
    ],
    [cancelMut],
  )
  return (
    <Shell onAdd={() => sheet.onOpen()} addLabel="New reservation" loading={listQ.isLoading} onRefresh={() => listQ.refetch()}>
      <DataTable columns={columns} data={listQ.data?.reservations || []} emptyMessage="No reservations." />
      <SideSheet isOpen={sheet.isOpen} onOpenChange={sheet.onOpenChange} title="Reserve book" size="md">
        <div className="space-y-3">
          <FormField label="Student" required>
            <FormSelect
              options={(studentsQ.data?.students || []).map((s) => ({ value: String(s.id), label: studentLabel(s) }))}
              value={form.student_id}
              onChange={(v) => setForm((f) => ({ ...f, student_id: v }))}
            />
          </FormField>
          <FormField label="Book" required>
            <FormSelect
              options={(booksQ.data?.books || []).map((b) => ({ value: String(b.id), label: b.title }))}
              value={form.book_id}
              onChange={(v) => setForm((f) => ({ ...f, book_id: v }))}
            />
          </FormField>
          <FormField label="Notes"><FormTextarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></FormField>
          <FormButton
            className="w-full bg-[#12544f]"
            color="primary"
            isLoading={mut.isPending}
            onPress={() =>
              mut.mutate({
                student_id: Number(form.student_id),
                book_id: Number(form.book_id),
                notes: form.notes || null,
              })
            }
          >
            Reserve
          </FormButton>
        </div>
      </SideSheet>
    </Shell>
  )
}

function OverdueSection() {
  const listQ = useQuery({ queryKey: ['library', 'overdue'], queryFn: listLibOverdue })
  const columns = useMemo(
    () => [
      { accessorKey: 'book', header: 'Book', Cell: ({ row }) => row.original.book?.title || '—' },
      { accessorKey: 'student', header: 'Student', Cell: ({ row }) => studentLabel(row.original.student) },
      { accessorKey: 'due_at', header: 'Due', Cell: ({ row }) => String(row.original.due_at || '').slice(0, 10) },
      {
        id: 'badge',
        header: '',
        Cell: () => <Chip size="sm" color="danger" variant="flat">Overdue</Chip>,
      },
    ],
    [],
  )
  return listQ.isLoading ? (
    <SectionSkeleton />
  ) : (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">{listQ.data?.summary?.count ?? 0} overdue loan(s).</p>
      <DataTable columns={columns} data={listQ.data?.loans || []} emptyMessage="No overdue loans." />
    </div>
  )
}

function FinesSection() {
  const listQ = useQuery({ queryKey: ['library', 'fines'], queryFn: listLibFines })
  const columns = useMemo(
    () => [
      { accessorKey: 'book', header: 'Book', Cell: ({ row }) => row.original.book?.title || '—' },
      { accessorKey: 'student', header: 'Student', Cell: ({ row }) => studentLabel(row.original.student) },
      { accessorKey: 'fine_amount', header: 'Fine (TZS)', Cell: ({ row }) => money(row.original.fine_amount) },
      { accessorKey: 'returned_at', header: 'Returned', Cell: ({ row }) => String(row.original.returned_at || '').slice(0, 10) || '—' },
    ],
    [],
  )
  return listQ.isLoading ? (
    <SectionSkeleton />
  ) : (
    <div className="space-y-3">
      <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)] max-w-sm">
        <CardBody className="py-3">
          <p className="text-xs text-slate-500">Total fines</p>
          <p className="text-xl font-semibold">TZS {money(listQ.data?.summary?.total_fines)}</p>
        </CardBody>
      </Card>
      <DataTable columns={columns} data={listQ.data?.fines || []} emptyMessage="No fines recorded." />
    </div>
  )
}

function ReportsSection() {
  const q = useQuery({ queryKey: ['library', 'reports'], queryFn: getLibReports })
  const s = q.data?.summary || {}
  if (q.isLoading) return <SectionSkeleton />
  const rows = [
    ['Titles', s.titles],
    ['Total copies', s.total_copies],
    ['Available', s.available_copies],
    ['On loan', s.on_loan],
    ['Overdue', s.overdue],
    ['Total fines (TZS)', money(s.total_fines)],
    ['Active reservations', s.active_reservations],
  ]
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map(([label, value]) => (
        <Card key={label} className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
          <CardBody className="py-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-lg font-semibold">{value ?? '—'}</p>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

function Shell({ children, onAdd, addLabel, loading, onRefresh }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        {onRefresh && <FormButton appearance="bordered" startContent={<RefreshCw className="h-4 w-4" />} onPress={onRefresh}>Refresh</FormButton>}
        {onAdd && <FormButton className="bg-[#12544f]" color="primary" startContent={<Plus className="h-4 w-4" />} onPress={onAdd}>{addLabel}</FormButton>}
      </div>
      {loading ? <SectionSkeleton /> : children}
    </div>
  )
}

export default function LibraryWorkspace() {
  const { pathname } = useLocation()
  const meta = META[pathname] || META['/library']
  let body
  switch (meta.section) {
    case 'overview': body = <Overview />; break
    case 'catalogue': body = <CatalogueSection />; break
    case 'isbn': body = <CatalogueSection isbnMode />; break
    case 'categories': body = <CategoriesSection />; break
    case 'borrow': body = <BorrowSection />; break
    case 'return': body = <ReturnSection />; break
    case 'reservations': body = <ReservationsSection />; break
    case 'overdue': body = <OverdueSection />; break
    case 'fines': body = <FinesSection />; break
    case 'reports': body = <ReportsSection />; break
    default: body = <Overview />
  }
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title={meta.title}
          description={meta.desc}
          breadcrumbs={[{ label: 'Ops', href: '/inventory' }, { label: 'Library', href: '/library' }, { label: meta.title }]}
        />
        {body}
      </div>
    </DashboardLayout>
  )
}
