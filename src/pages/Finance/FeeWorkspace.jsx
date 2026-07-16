import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Tabs,
  Tab,
  Card,
  CardHeader,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Spinner,
} from '@heroui/react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import PageHeader from '../../components/Layout/PageHeader.jsx'
import {
  FormField,
  FormInput,
  FormSelect,
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
  listYears,
  listClasses,
  listTerms,
  listStudents,
} from '../../api/domain.js'

function FeeWorkspace() {
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
  const [genForm, setGenForm] = useState({
    academic_year_id: '',
    term_id: '',
    classroom_id: '',
    due_date: '',
  })
  const [payForm, setPayForm] = useState({
    student_id: '',
    invoice_id: '',
    amount: '',
    method: 'cash',
    reference: '',
  })

  const catsQ = useQuery({ queryKey: ['finance', 'categories'], queryFn: listFeeCategories })
  const structsQ = useQuery({ queryKey: ['finance', 'structures'], queryFn: listFeeStructures })
  const invQ = useQuery({ queryKey: ['finance', 'invoices'], queryFn: () => listInvoices({ per_page: 50 }) })
  const payQ = useQuery({ queryKey: ['finance', 'payments'], queryFn: listPayments })
  const yearsQ = useQuery({ queryKey: ['academic', 'years'], queryFn: listYears })
  const classesQ = useQuery({ queryKey: ['academic', 'classes'], queryFn: listClasses })
  const termsQ = useQuery({ queryKey: ['academic', 'terms'], queryFn: listTerms })
  const studentsQ = useQuery({ queryKey: ['students', 'mini'], queryFn: () => listStudents({ per_page: 100 }) })

  const catMut = useMutation({
    mutationFn: createFeeCategory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance', 'categories'] }); setCatForm({ name: '', code: '' }); setError(''); toastSuccess('Fee category added') },
    onError: (e) => { setError(e.message); toastError('Could not add category', e.message) },
  })
  const structMut = useMutation({
    mutationFn: createFeeStructure,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance', 'structures'] }); setError(''); toastSuccess('Fee structure line added') },
    onError: (e) => { setError(e.message); toastError('Could not add structure', e.message) },
  })
  const genMut = useMutation({
    mutationFn: generateInvoices,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance', 'invoices'] }); setError(''); toastSuccess('Invoices generated') },
    onError: (e) => { setError(e.message); toastError('Could not generate invoices', e.message) },
  })
  const payMut = useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'payments'] })
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      setPayForm({ student_id: '', invoice_id: '', amount: '', method: 'cash', reference: '' })
      setError('')
      toastSuccess('Payment recorded')
    },
    onError: (e) => { setError(e.message); toastError('Could not save payment', e.message) },
  })

  const categories = catsQ.data?.categories || []
  const structures = structsQ.data?.structures || []
  const invoices = invQ.data?.invoices || []
  const payments = payQ.data?.payments || []
  const years = yearsQ.data?.academic_years || []
  const classes = classesQ.data?.classes || []
  const terms = termsQ.data?.terms || []
  const students = studentsQ.data?.students || []

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Finance & Fees"
          breadcrumbs={[
            { label: 'Money', href: '/finance' },
            { label: 'Fees' },
          ]}
          description="Structure → invoices → payments"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}

        <Tabs color="primary" classNames={{ cursor: 'bg-[#0B3D2E]', tabContent: 'group-data-[selected=true]:text-white' }}>
          <Tab key="structure" title="Fee structure">
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <Card className="border border-slate-200 shadow-none">
                <CardHeader className="font-semibold">Category</CardHeader>
                <CardBody className="flex flex-col gap-3">
                  <FormField label="Name">
                    <FormInput value={catForm.name} onValueChange={(v) => setCatForm((f) => ({ ...f, name: v }))} />
                  </FormField>
                  <FormField label="Code">
                    <FormInput value={catForm.code} onValueChange={(v) => setCatForm((f) => ({ ...f, code: v }))} />
                  </FormField>
                  <FormButton isLoading={catMut.isPending} onPress={() => catMut.mutate(catForm)}>Add category</FormButton>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {categories.map((c) => <Chip key={c.id} size="sm" variant="flat">{c.name}</Chip>)}
                  </div>
                </CardBody>
              </Card>
              <Card className="border border-slate-200 shadow-none">
                <CardHeader className="font-semibold">Structure line</CardHeader>
                <CardBody className="flex flex-col gap-3">
                  <FormField label="Academic year">
                    <FormSelect label="Year" placeholder="Academic year" value={structForm.academic_year_id} onChange={(v) => setStructForm((f) => ({ ...f, academic_year_id: v }))} options={years.map((y) => ({ value: String(y.id), label: y.name }))} />
                  </FormField>
                  <FormField label="Term">
                    <FormSelect label="Term" placeholder="Term (optional)" value={structForm.term_id} onChange={(v) => setStructForm((f) => ({ ...f, term_id: v }))} options={terms.map((t) => ({ value: String(t.id), label: t.name }))} />
                  </FormField>
                  <FormField label="Class">
                    <FormSelect label="Class" placeholder="Class (optional / all)" value={structForm.classroom_id} onChange={(v) => setStructForm((f) => ({ ...f, classroom_id: v }))} options={classes.map((c) => ({ value: String(c.id), label: c.name }))} />
                  </FormField>
                  <FormField label="Category">
                    <FormSelect label="Category" placeholder="Category" value={structForm.fee_category_id} onChange={(v) => setStructForm((f) => ({ ...f, fee_category_id: v }))} options={categories.map((c) => ({ value: String(c.id), label: c.name }))} />
                  </FormField>
                  <FormField label="Amount (TZS)">
                    <FormInput type="number" value={structForm.amount} onValueChange={(v) => setStructForm((f) => ({ ...f, amount: v }))} />
                  </FormField>
                  <FormField label="Due date">
                    <FormInput type="date" value={structForm.due_date} onValueChange={(v) => setStructForm((f) => ({ ...f, due_date: v }))} />
                  </FormField>
                  <FormButton isLoading={structMut.isPending} onPress={() => structMut.mutate({
                    academic_year_id: Number(structForm.academic_year_id),
                    term_id: structForm.term_id ? Number(structForm.term_id) : null,
                    classroom_id: structForm.classroom_id ? Number(structForm.classroom_id) : null,
                    fee_category_id: Number(structForm.fee_category_id),
                    amount: Number(structForm.amount),
                    due_date: structForm.due_date || null,
                    currency: 'TZS',
                  })}>Add structure</FormButton>
                </CardBody>
              </Card>
              <Card className="border border-slate-200 shadow-none lg:col-span-2">
                <CardBody>
                  {structsQ.isLoading ? <Spinner color="primary" /> : (
                    <Table shadow="none" aria-label="Structures">
                      <TableHeader>
                        <TableColumn>CATEGORY</TableColumn>
                        <TableColumn>YEAR</TableColumn>
                        <TableColumn>CLASS</TableColumn>
                        <TableColumn>AMOUNT</TableColumn>
                      </TableHeader>
                      <TableBody emptyContent="No structures">
                        {structures.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell>{s.category?.name}</TableCell>
                            <TableCell>{s.academic_year?.name}</TableCell>
                            <TableCell>{s.classroom?.name || 'All'}</TableCell>
                            <TableCell>{Number(s.amount).toLocaleString()} {s.currency}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardBody>
              </Card>
            </div>
          </Tab>

          <Tab key="invoices" title="Invoices">
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <Card className="border border-slate-200 shadow-none">
                <CardHeader className="font-semibold">Generate from structure</CardHeader>
                <CardBody className="flex flex-col gap-3">
                  <FormField label="Academic year">
                    <FormSelect label="Year" placeholder="Academic year" value={genForm.academic_year_id} onChange={(v) => setGenForm((f) => ({ ...f, academic_year_id: v }))} options={years.map((y) => ({ value: String(y.id), label: y.name }))} />
                  </FormField>
                  <FormField label="Term">
                    <FormSelect label="Term" placeholder="Term (optional)" value={genForm.term_id} onChange={(v) => setGenForm((f) => ({ ...f, term_id: v }))} options={terms.map((t) => ({ value: String(t.id), label: t.name }))} />
                  </FormField>
                  <FormField label="Class">
                    <FormSelect label="Class" placeholder="Class" value={genForm.classroom_id} onChange={(v) => setGenForm((f) => ({ ...f, classroom_id: v }))} options={classes.map((c) => ({ value: String(c.id), label: c.name }))} />
                  </FormField>
                  <FormField label="Due date">
                    <FormInput type="date" value={genForm.due_date} onValueChange={(v) => setGenForm((f) => ({ ...f, due_date: v }))} />
                  </FormField>
                  <FormButton isLoading={genMut.isPending} onPress={() => genMut.mutate({
                    academic_year_id: Number(genForm.academic_year_id),
                    term_id: genForm.term_id ? Number(genForm.term_id) : null,
                    classroom_id: genForm.classroom_id ? Number(genForm.classroom_id) : null,
                    due_date: genForm.due_date || null,
                  })}>Generate invoices</FormButton>
                </CardBody>
              </Card>
              <Card className="border border-slate-200 shadow-none lg:col-span-2">
                <CardBody>
                  <Table shadow="none" aria-label="Invoices">
                    <TableHeader>
                      <TableColumn>REF</TableColumn>
                      <TableColumn>STUDENT</TableColumn>
                      <TableColumn>TOTAL</TableColumn>
                      <TableColumn>BALANCE</TableColumn>
                      <TableColumn>STATUS</TableColumn>
                    </TableHeader>
                    <TableBody emptyContent="No invoices">
                      {invoices.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell className="text-xs font-mono">{inv.reference}</TableCell>
                          <TableCell>{inv.student ? `${inv.student.first_name} ${inv.student.last_name}` : inv.student_id}</TableCell>
                          <TableCell>{Number(inv.total_amount).toLocaleString()}</TableCell>
                          <TableCell>{Number(inv.balance_amount).toLocaleString()}</TableCell>
                          <TableCell><Chip size="sm" variant="flat" className="capitalize">{inv.status}</Chip></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardBody>
              </Card>
            </div>
          </Tab>

          <Tab key="payments" title="Payments">
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <Card className="border border-slate-200 shadow-none">
                <CardHeader className="font-semibold">Record payment</CardHeader>
                <CardBody className="flex flex-col gap-3">
                  <FormField label="Student">
                    <FormSelect label="Student" placeholder="Student" value={payForm.student_id} onChange={(v) => setPayForm((f) => ({ ...f, student_id: v }))} options={students.map((s) => ({ value: String(s.id), label: s.full_name }))} />
                  </FormField>
                  <FormField label="Invoice">
                    <FormSelect label="Invoice" placeholder="Invoice (optional)" value={payForm.invoice_id} onChange={(v) => setPayForm((f) => ({ ...f, invoice_id: v }))} options={invoices.filter((i) => !payForm.student_id || String(i.student_id) === payForm.student_id).map((i) => ({ value: String(i.id), label: `${i.reference} — bal ${i.balance_amount}` }))} />
                  </FormField>
                  <FormField label="Amount">
                    <FormInput type="number" value={payForm.amount} onValueChange={(v) => setPayForm((f) => ({ ...f, amount: v }))} />
                  </FormField>
                  <FormField label="Method">
                    <FormInput value={payForm.method} onValueChange={(v) => setPayForm((f) => ({ ...f, method: v }))} />
                  </FormField>
                  <FormField label="Reference">
                    <FormInput value={payForm.reference} onValueChange={(v) => setPayForm((f) => ({ ...f, reference: v }))} />
                  </FormField>
                  <FormButton isLoading={payMut.isPending} onPress={() => payMut.mutate({
                    student_id: Number(payForm.student_id),
                    invoice_id: payForm.invoice_id ? Number(payForm.invoice_id) : null,
                    amount: Number(payForm.amount),
                    method: payForm.method,
                    reference: payForm.reference || undefined,
                  })}>Save payment</FormButton>
                </CardBody>
              </Card>
              <Card className="border border-slate-200 shadow-none lg:col-span-2">
                <CardBody>
                  <Table shadow="none" aria-label="Payments">
                    <TableHeader>
                      <TableColumn>DATE</TableColumn>
                      <TableColumn>STUDENT</TableColumn>
                      <TableColumn>AMOUNT</TableColumn>
                      <TableColumn>METHOD</TableColumn>
                      <TableColumn>REF</TableColumn>
                    </TableHeader>
                    <TableBody emptyContent="No payments">
                      {payments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="text-xs">{p.paid_at || '—'}</TableCell>
                          <TableCell>{p.student ? `${p.student.first_name} ${p.student.last_name}` : p.student_id}</TableCell>
                          <TableCell>{Number(p.amount).toLocaleString()}</TableCell>
                          <TableCell>{p.method}</TableCell>
                          <TableCell className="text-xs font-mono">{p.reference}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardBody>
              </Card>
            </div>
          </Tab>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

export default FeeWorkspace
