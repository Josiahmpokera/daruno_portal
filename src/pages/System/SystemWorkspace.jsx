import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardBody, Chip, Spinner, Switch, useDisclosure } from '@heroui/react'
import {
  BarChart3,
  Download,
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Users,
  Wallet,
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
  createSchoolUser,
  createWebhook,
  deleteWebhook,
  getAdminSettings,
  getApiKeys,
  getBackupStatus,
  getComplianceCensus,
  getComplianceEnrollment,
  getComplianceExport,
  getComplianceOverview,
  getComplianceProfile,
  getGatewayConfig,
  getPasswordPolicy,
  getSchoolReportsAttendance,
  getSchoolReportsFinance,
  getSchoolReportsInventory,
  getSchoolReportsOverview,
  getSchoolReportsStudents,
  getSchoolReportsTeachers,
  getTwoFactorSettings,
  listNotificationTemplates,
  listSchoolAuditLogs,
  listSchoolLoginHistory,
  listSchoolPermissions,
  listSchoolRoles,
  listSchoolUsers,
  listSystemLogs,
  listWebhooks,
  requestBackup,
  rotateApiKeys,
  saveNotificationTemplate,
  updateAdminSettings,
  updateGatewayConfig,
  updatePasswordPolicy,
  updateSchoolRole,
  updateSchoolUser,
  updateTwoFactorSettings,
} from '../../api/domain.js'

function money(n) {
  return Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })
}

function downloadCsv(filename, rows) {
  if (!rows?.length) {
    toastError('Nothing to export')
    return
  }
  const headers = Object.keys(rows[0])
  const esc = (v) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  toastSuccess('Export ready', filename)
}

function Stat({ label, value, hint, icon: Icon, tone, onPress }) {
  return (
    <Card
      isPressable={Boolean(onPress)}
      className="border border-slate-200 shadow-none"
      onPress={onPress}
    >
      <CardBody className="flex flex-row items-center gap-2.5 p-2.5">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone || 'bg-slate-100 text-slate-700'}`}>
          {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
          <p className="truncate text-base font-semibold tabular-nums">{value}</p>
          {hint ? <p className="truncate text-[10px] text-slate-500">{hint}</p> : null}
        </div>
      </CardBody>
    </Card>
  )
}

function resolveMeta(pathname) {
  if (pathname.startsWith('/reports')) {
    const map = {
      '/reports': { title: 'Reports', section: 'reports-overview' },
      '/reports/dashboard': { title: 'Performance Dashboard', section: 'reports-overview' },
      '/reports/custom': { title: 'Custom Reports', section: 'reports-custom' },
      '/reports/students': { title: 'Student Reports', section: 'reports-students' },
      '/reports/attendance': { title: 'Attendance Reports', section: 'reports-attendance' },
      '/reports/exams': { title: 'Examination Reports', section: 'reports-exams' },
      '/reports/teachers': { title: 'Teacher Reports', section: 'reports-teachers' },
      '/reports/finance': { title: 'Financial Reports', section: 'reports-finance' },
      '/reports/inventory': { title: 'Inventory Reports', section: 'reports-inventory' },
      '/reports/excel': { title: 'Excel Export', section: 'reports-export' },
      '/reports/pdf': { title: 'PDF Export', section: 'reports-export' },
    }
    return map[pathname] || { title: 'Reports', section: 'reports-overview' }
  }
  if (pathname.startsWith('/users')) {
    const map = {
      '/users': { title: 'Users & Roles', section: 'users-overview' },
      '/users/list': { title: 'All Users', section: 'users-list' },
      '/users/permissions': { title: 'Permissions (RBAC)', section: 'users-permissions' },
      '/users/roles': { title: 'Role List', section: 'users-roles' },
      '/users/roles/super-admin': { title: 'Super Admin', section: 'users-roles-platform' },
      '/users/roles/school': { title: 'School Roles', section: 'users-roles-school' },
      '/users/roles/family': { title: 'Parent / Student Roles', section: 'users-roles-family' },
      '/users/password-policies': { title: 'Password Policies', section: 'users-password' },
      '/users/2fa': { title: 'Two-Factor Auth', section: 'users-2fa' },
      '/users/audit': { title: 'Audit Logs', section: 'users-audit' },
      '/users/login-history': { title: 'Login History', section: 'users-login' },
    }
    return map[pathname] || { title: 'Users', section: 'users-overview' }
  }
  if (pathname.startsWith('/compliance')) {
    const map = {
      '/compliance': { title: 'Compliance', section: 'compliance-overview' },
      '/compliance/necta': { title: 'NECTA Report Cards', section: 'compliance-necta' },
      '/compliance/ca': { title: 'Continuous Assessment', section: 'compliance-ca' },
      '/compliance/promotions': { title: 'Promotion Reports', section: 'compliance-promotions' },
      '/compliance/census': { title: 'School Census', section: 'compliance-census' },
      '/compliance/enrollment': { title: 'Enrollment Statistics', section: 'compliance-enrollment' },
      '/compliance/profile': { title: 'School Profile Export', section: 'compliance-profile' },
      '/compliance/ministry': { title: 'Ministry Reporting', section: 'compliance-ministry' },
      '/compliance/export': { title: 'Government Data Export', section: 'compliance-export' },
    }
    return map[pathname] || { title: 'Compliance', section: 'compliance-overview' }
  }
  if (pathname.startsWith('/admin')) {
    const map = {
      '/admin': { title: 'Administration', section: 'admin-overview' },
      '/admin/settings': { title: 'System Settings', section: 'admin-settings' },
      '/admin/email': { title: 'Email Settings', section: 'admin-email' },
      '/admin/sms': { title: 'SMS Gateway', section: 'admin-sms' },
      '/admin/whatsapp': { title: 'WhatsApp API', section: 'admin-whatsapp' },
      '/admin/templates': { title: 'Notification Templates', section: 'admin-templates' },
      '/admin/api-keys': { title: 'API Keys', section: 'admin-api-keys' },
      '/admin/webhooks': { title: 'Webhooks', section: 'admin-webhooks' },
      '/admin/backup': { title: 'Backup & Restore', section: 'admin-backup' },
      '/admin/logs': { title: 'System Logs', section: 'admin-logs' },
    }
    return map[pathname] || { title: 'Administration', section: 'admin-overview' }
  }
  return { title: 'System', section: 'reports-overview' }
}

// ── Reports ──────────────────────────────────────────────────────

function ReportsOverview() {
  const navigate = useNavigate()
  const q = useQuery({ queryKey: ['school', 'reports', 'overview'], queryFn: getSchoolReportsOverview })
  const s = q.data?.summary || {}
  if (q.isLoading) return <div className="flex justify-center py-16"><Spinner color="success" /></div>
  const cards = [
    { l: 'Active students', v: s.students_active ?? 0, p: '/reports/students', icon: Users, tone: 'bg-emerald-50 text-emerald-700' },
    { l: 'Staff', v: s.staff ?? 0, p: '/reports/teachers', icon: Users, tone: 'bg-sky-50 text-sky-700' },
    { l: 'Collections MTD', v: `TZS ${money(s.collections_mtd)}`, p: '/reports/finance', icon: Wallet, tone: 'bg-amber-50 text-amber-800' },
    { l: 'Outstanding', v: `TZS ${money(s.outstanding_fees)}`, p: '/reports/finance', icon: Wallet, tone: 'bg-rose-50 text-rose-700' },
    { l: 'Attendance today', v: s.attendance_today ?? 0, p: '/reports/attendance', icon: BarChart3, tone: 'bg-violet-50 text-violet-700' },
  ]
  const links = [
    { t: 'Student reports', p: '/reports/students' },
    { t: 'Attendance', p: '/reports/attendance' },
    { t: 'Examinations', p: '/reports/exams' },
    { t: 'Teachers', p: '/reports/teachers' },
    { t: 'Finance', p: '/reports/finance' },
    { t: 'Inventory', p: '/reports/inventory' },
    { t: 'Excel export', p: '/reports/excel' },
  ]
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => (
          <Stat key={c.l} label={c.l} value={c.v} icon={c.icon} tone={c.tone} onPress={() => navigate(c.p)} />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {links.map((l) => (
          <Card key={l.p} isPressable className="border border-slate-200 shadow-none" onPress={() => navigate(l.p)}>
            <CardBody className="p-3.5">
              <h3 className="text-sm font-semibold">{l.t}</h3>
              <p className="text-xs text-slate-500">Open live report</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}

function TableReport({ title, rows, columns }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <FormButton
          appearance="bordered"
          startContent={<Download className="h-4 w-4" />}
          onPress={() => downloadCsv(`${title.replace(/\s+/g, '-').toLowerCase()}.csv`, rows)}
        >
          Export CSV
        </FormButton>
      </div>
      <DataTable columns={columns} data={rows} emptyMessage="No data for this report." />
    </div>
  )
}

function ReportsStudents() {
  const q = useQuery({ queryKey: ['school', 'reports', 'students'], queryFn: getSchoolReportsStudents })
  if (q.isLoading) return <div className="flex justify-center py-12"><Spinner color="success" /></div>
  const byClass = q.data?.by_class || []
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label="Total" value={q.data?.total ?? 0} tone="bg-slate-100" />
        <Stat label="Active" value={q.data?.total_active ?? 0} tone="bg-emerald-50 text-emerald-700" />
        <Stat label="Classes" value={byClass.length} tone="bg-sky-50 text-sky-700" />
      </div>
      <TableReport
        title="Enrollment by class"
        rows={byClass}
        columns={[
          { accessorKey: 'classroom', header: 'Class' },
          { accessorKey: 'total', header: 'Learners' },
        ]}
      />
    </div>
  )
}

function ReportsAttendance() {
  const q = useQuery({ queryKey: ['school', 'reports', 'attendance'], queryFn: () => getSchoolReportsAttendance() })
  if (q.isLoading) return <div className="flex justify-center py-12"><Spinner color="success" /></div>
  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        Period {q.data?.period?.from} → {q.data?.period?.to} · {q.data?.total_marks ?? 0} marks
      </p>
      <TableReport
        title="Attendance by status"
        rows={q.data?.by_status || []}
        columns={[
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'total', header: 'Count' },
        ]}
      />
    </div>
  )
}

function ReportsFinance() {
  const q = useQuery({ queryKey: ['school', 'reports', 'finance'], queryFn: () => getSchoolReportsFinance() })
  if (q.isLoading) return <div className="flex justify-center py-12"><Spinner color="success" /></div>
  const s = q.data?.summary || {}
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Stat label="Billed" value={`TZS ${money(s.billed)}`} tone="bg-slate-100" />
      <Stat label="Collected" value={`TZS ${money(s.collections)}`} tone="bg-emerald-50 text-emerald-700" />
      <Stat label="Outstanding" value={`TZS ${money(s.outstanding)}`} tone="bg-rose-50 text-rose-700" />
    </div>
  )
}

function ReportsTeachers() {
  const q = useQuery({ queryKey: ['school', 'reports', 'teachers'], queryFn: getSchoolReportsTeachers })
  if (q.isLoading) return <div className="flex justify-center py-12"><Spinner color="success" /></div>
  return (
    <div className="space-y-4">
      <Stat label="Total staff" value={q.data?.total ?? 0} tone="bg-sky-50 text-sky-700" />
      <TableReport
        title="Staff by status"
        rows={q.data?.by_status || []}
        columns={[
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'total', header: 'Count' },
        ]}
      />
    </div>
  )
}

function ReportsInventory() {
  const q = useQuery({ queryKey: ['school', 'reports', 'inventory'], queryFn: getSchoolReportsInventory })
  if (q.isLoading) return <div className="flex justify-center py-12"><Spinner color="success" /></div>
  const s = q.data?.summary || {}
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Stat label="Stock items" value={s.stock_items ?? 0} />
      <Stat label="Stock value" value={`TZS ${money(s.stock_value)}`} />
      <Stat label="Low stock" value={s.low_stock ?? 0} tone="bg-rose-50 text-rose-700" />
    </div>
  )
}

function ReportsExport() {
  const navigate = useNavigate()
  return (
    <div className="space-y-3 max-w-xl">
      <p className="text-sm text-slate-600">
        Export live datasets as CSV from any report screen, or pull ministry-ready files from Compliance → Government Data Export.
      </p>
      <FormButton className="bg-[#0B3D2E]" color="primary" onPress={() => navigate('/compliance/export')}>
        Open government export
      </FormButton>
      <FormButton appearance="bordered" onPress={() => navigate('/reports/students')}>
        Student report CSV
      </FormButton>
    </div>
  )
}

// ── Users ────────────────────────────────────────────────────────

function UsersList() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const [q, setQ] = useState('')
  const rolesQ = useQuery({ queryKey: ['school', 'roles'], queryFn: () => listSchoolRoles({ scope: 'school' }) })
  const listQ = useQuery({
    queryKey: ['school', 'users', q],
    queryFn: () => listSchoolUsers({ q: q || undefined, per_page: 50 }),
  })
  const [form, setForm] = useState({
    id: null, name: '', email: '', phone: '', role_id: '', password: '',
  })

  const saveMut = useMutation({
    mutationFn: (p) => (p.id ? updateSchoolUser(p.id, p) : createSchoolUser(p)),
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ['school', 'users'] })
      toastSuccess(vars.id ? 'User updated' : 'User created')
      if (data?.temporary_password) {
        toastSuccess('Temporary password', data.temporary_password)
      }
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Save failed'),
  })

  const columns = useMemo(
    () => [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'email', header: 'Email' },
      { accessorKey: 'phone', header: 'Phone', Cell: ({ row }) => row.original.phone || '—' },
      {
        accessorKey: 'role',
        header: 'Role',
        Cell: ({ row }) => row.original.role?.label || row.original.role?.name || '—',
      },
      {
        id: 'actions',
        header: '',
        Cell: ({ row }) => (
          <FormButton
            size="sm"
            appearance="flat"
            onPress={() => {
              const u = row.original
              setForm({
                id: u.id,
                name: u.name || '',
                email: u.email || '',
                phone: u.phone || '',
                role_id: u.role_id ? String(u.role_id) : '',
                password: '',
              })
              sheet.onOpen()
            }}
          >
            Edit
          </FormButton>
        ),
      },
    ],
    [sheet],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
            placeholder="Search users…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <FormButton appearance="bordered" startContent={<RefreshCw className="h-4 w-4" />} onPress={() => listQ.refetch()}>
          Refresh
        </FormButton>
        <FormButton
          className="bg-[#0B3D2E]"
          color="primary"
          startContent={<Plus className="h-4 w-4" />}
          onPress={() => {
            setForm({ id: null, name: '', email: '', phone: '', role_id: '', password: '' })
            sheet.onOpen()
          }}
        >
          Add user
        </FormButton>
      </div>
      {listQ.isLoading ? (
        <div className="flex justify-center py-12"><Spinner color="success" /></div>
      ) : (
        <DataTable columns={columns} data={listQ.data?.users || []} emptyMessage="No school users yet." />
      )}
      <SideSheet isOpen={sheet.isOpen} onOpenChange={sheet.onOpenChange} title={form.id ? 'Edit user' : 'Add user'} size="md">
        <div className="space-y-3">
          <FormField label="Name" required>
            <FormInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </FormField>
          <FormField label="Email" required>
            <FormInput value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </FormField>
          <FormField label="Phone">
            <FormInput value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </FormField>
          <FormField label="Role" required>
            <FormSelect
              options={(rolesQ.data?.roles || []).map((r) => ({
                value: String(r.id),
                label: r.label || r.name,
              }))}
              value={form.role_id}
              onChange={(v) => setForm((f) => ({ ...f, role_id: v }))}
            />
          </FormField>
          <FormField label={form.id ? 'New password (optional)' : 'Password (optional)'}>
            <FormInput
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder={form.id ? 'Leave blank to keep' : 'Auto-generate if empty'}
            />
          </FormField>
          <FormButton
            className="w-full bg-[#0B3D2E]"
            color="primary"
            isLoading={saveMut.isPending}
            onPress={() =>
              saveMut.mutate({
                id: form.id || undefined,
                name: form.name,
                email: form.email,
                phone: form.phone || null,
                role_id: Number(form.role_id),
                password: form.password || undefined,
              })
            }
          >
            Save user
          </FormButton>
        </div>
      </SideSheet>
    </div>
  )
}

function RolesSection({ scope }) {
  const qc = useQueryClient()
  const listQ = useQuery({
    queryKey: ['school', 'roles', scope || 'all'],
    queryFn: () => listSchoolRoles(scope ? { scope } : {}),
  })
  const permsQ = useQuery({
    queryKey: ['school', 'permissions'],
    queryFn: listSchoolPermissions,
  })
  const sheet = useDisclosure()
  const [edit, setEdit] = useState({ id: null, label: '', permissions: [] })

  const saveMut = useMutation({
    mutationFn: ({ id, ...payload }) => updateSchoolRole(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['school', 'roles'] })
      toastSuccess('Role updated')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })

  const roles = (listQ.data?.roles || []).filter((r) => {
    if (scope === 'platform') return r.name === 'super_admin'
    if (scope) return r.scope === scope
    return true
  })

  const columns = useMemo(
    () => [
      { accessorKey: 'label', header: 'Role', Cell: ({ row }) => row.original.label || row.original.name },
      { accessorKey: 'name', header: 'Code', Cell: ({ row }) => <span className="font-mono text-xs">{row.original.name}</span> },
      { accessorKey: 'scope', header: 'Scope' },
      { accessorKey: 'users_count', header: 'Users' },
      {
        accessorKey: 'permissions',
        header: 'Perms',
        Cell: ({ row }) => (row.original.permissions || []).length,
      },
      {
        id: 'actions',
        header: '',
        Cell: ({ row }) =>
          row.original.name === 'super_admin' ? null : (
            <FormButton
              size="sm"
              appearance="flat"
              onPress={() => {
                setEdit({
                  id: row.original.id,
                  label: row.original.label || row.original.name,
                  permissions: row.original.permissions || [],
                })
                sheet.onOpen()
              }}
            >
              Edit
            </FormButton>
          ),
      },
    ],
    [sheet],
  )

  if (scope === 'platform') {
    return (
      <p className="text-sm text-slate-600 max-w-xl">
        Platform Super Admin is managed in the Super Admin console, not inside a school tenant.
        School users cannot be granted super_admin.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {listQ.isLoading ? (
        <div className="flex justify-center py-12"><Spinner color="success" /></div>
      ) : (
        <DataTable columns={columns} data={roles} emptyMessage="No roles." />
      )}
      <SideSheet isOpen={sheet.isOpen} onOpenChange={sheet.onOpenChange} title="Edit role" size="lg">
        <div className="space-y-3">
          <FormField label="Label">
            <FormInput value={edit.label} onChange={(e) => setEdit((f) => ({ ...f, label: e.target.value }))} />
          </FormField>
          <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
            {(permsQ.data?.permissions || []).map((p) => {
              const on = edit.permissions.includes(p.name)
              return (
                <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() =>
                      setEdit((f) => ({
                        ...f,
                        permissions: on
                          ? f.permissions.filter((x) => x !== p.name)
                          : [...f.permissions, p.name],
                      }))
                    }
                  />
                  <span className="font-mono text-xs text-slate-500">{p.module}</span>
                  <span>{p.label || p.name}</span>
                </label>
              )
            })}
          </div>
          <FormButton
            className="w-full bg-[#0B3D2E]"
            color="primary"
            isLoading={saveMut.isPending}
            onPress={() =>
              saveMut.mutate({
                id: edit.id,
                label: edit.label,
                permissions: edit.permissions,
              })
            }
          >
            Save role
          </FormButton>
        </div>
      </SideSheet>
    </div>
  )
}

function PermissionsSection() {
  const q = useQuery({ queryKey: ['school', 'permissions'], queryFn: listSchoolPermissions })
  if (q.isLoading) return <div className="flex justify-center py-12"><Spinner color="success" /></div>
  const byModule = q.data?.by_module || {}
  return (
    <div className="space-y-4">
      {Object.entries(byModule).map(([mod, perms]) => (
        <Card key={mod} className="border border-slate-200 shadow-none">
          <CardBody className="p-3">
            <h3 className="mb-2 text-sm font-semibold capitalize">{mod || 'general'}</h3>
            <div className="flex flex-wrap gap-2">
              {(perms || []).map((p) => (
                <Chip key={p.id} size="sm" variant="flat">
                  {p.label || p.name}
                </Chip>
              ))}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

function AuditSection() {
  const q = useQuery({
    queryKey: ['school', 'audit'],
    queryFn: () => listSchoolAuditLogs({ per_page: 50 }),
  })
  const columns = useMemo(
    () => [
      {
        accessorKey: 'created_at',
        header: 'When',
        Cell: ({ row }) => String(row.original.created_at || '').slice(0, 19).replace('T', ' '),
      },
      { accessorKey: 'action', header: 'Action' },
      {
        accessorKey: 'user',
        header: 'User',
        Cell: ({ row }) => row.original.user?.name || row.original.user?.email || '—',
      },
      {
        accessorKey: 'entity_type',
        header: 'Entity',
        Cell: ({ row }) =>
          row.original.entity_type
            ? `${row.original.entity_type}${row.original.entity_id ? ` #${row.original.entity_id}` : ''}`
            : '—',
      },
      { accessorKey: 'ip_address', header: 'IP', Cell: ({ row }) => row.original.ip_address || '—' },
    ],
    [],
  )
  if (q.isLoading) return <div className="flex justify-center py-12"><Spinner color="success" /></div>
  return <DataTable columns={columns} data={q.data?.logs || []} emptyMessage="No audit events yet." />
}

function LoginHistorySection() {
  const q = useQuery({
    queryKey: ['school', 'login-history'],
    queryFn: () => listSchoolLoginHistory({ per_page: 50 }),
  })
  const columns = useMemo(
    () => [
      {
        accessorKey: 'logged_in_at',
        header: 'When',
        Cell: ({ row }) =>
          String(row.original.logged_in_at || row.original.created_at || '')
            .slice(0, 19)
            .replace('T', ' '),
      },
      { accessorKey: 'email', header: 'Email' },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => (
          <Chip size="sm" variant="flat" color={row.original.status === 'success' ? 'success' : 'danger'}>
            {row.original.status}
          </Chip>
        ),
      },
      { accessorKey: 'ip_address', header: 'IP' },
    ],
    [],
  )
  if (q.isLoading) return <div className="flex justify-center py-12"><Spinner color="success" /></div>
  return <DataTable columns={columns} data={q.data?.history || []} emptyMessage="No login history yet." />
}

function PasswordPolicySection() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['school', 'password-policy'], queryFn: getPasswordPolicy })
  const [form, setForm] = useState(null)
  const policy = form || q.data?.policy || {}
  const mut = useMutation({
    mutationFn: updatePasswordPolicy,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['school', 'password-policy'] })
      toastSuccess('Password policy saved')
      setForm(null)
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  if (q.isLoading) return <div className="flex justify-center py-12"><Spinner color="success" /></div>
  const f = form || policy
  return (
    <Card className="max-w-lg border border-slate-200 shadow-none">
      <CardBody className="space-y-3 p-4">
        <FormField label="Minimum length">
          <FormInput
            type="number"
            value={String(f.min_length ?? 8)}
            onChange={(e) => setForm({ ...f, min_length: Number(e.target.value) })}
          />
        </FormField>
        <label className="flex items-center justify-between text-sm">
          Require uppercase
          <Switch
            size="sm"
            isSelected={Boolean(f.require_uppercase)}
            onValueChange={(v) => setForm({ ...f, require_uppercase: v })}
          />
        </label>
        <label className="flex items-center justify-between text-sm">
          Require number
          <Switch
            size="sm"
            isSelected={Boolean(f.require_number)}
            onValueChange={(v) => setForm({ ...f, require_number: v })}
          />
        </label>
        <label className="flex items-center justify-between text-sm">
          Require symbol
          <Switch
            size="sm"
            isSelected={Boolean(f.require_symbol)}
            onValueChange={(v) => setForm({ ...f, require_symbol: v })}
          />
        </label>
        <FormField label="Expiry days (0 = never)">
          <FormInput
            type="number"
            value={String(f.expiry_days ?? 0)}
            onChange={(e) => setForm({ ...f, expiry_days: Number(e.target.value) })}
          />
        </FormField>
        <FormButton className="bg-[#0B3D2E]" color="primary" isLoading={mut.isPending} onPress={() => mut.mutate(f)}>
          Save policy
        </FormButton>
      </CardBody>
    </Card>
  )
}

function TwoFactorSection() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['school', '2fa'], queryFn: getTwoFactorSettings })
  const mut = useMutation({
    mutationFn: updateTwoFactorSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['school', '2fa'] })
      toastSuccess('2FA settings saved')
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  if (q.isLoading) return <div className="flex justify-center py-12"><Spinner color="success" /></div>
  const t = q.data?.two_factor || {}
  return (
    <Card className="max-w-lg border border-slate-200 shadow-none">
      <CardBody className="space-y-3 p-4">
        <label className="flex items-center justify-between text-sm">
          Enable two-factor authentication
          <Switch
            size="sm"
            isSelected={Boolean(t.enabled)}
            onValueChange={(v) => mut.mutate({ enabled: v })}
          />
        </label>
        <label className="flex items-center justify-between text-sm">
          Require for school admins
          <Switch
            size="sm"
            isSelected={Boolean(t.required_for_admins)}
            onValueChange={(v) => mut.mutate({ required_for_admins: v })}
          />
        </label>
        <p className="text-xs text-slate-500">
          Methods: {(t.methods || []).join(', ') || 'authenticator, email'}
        </p>
      </CardBody>
    </Card>
  )
}

function UsersOverview() {
  const navigate = useNavigate()
  const usersQ = useQuery({ queryKey: ['school', 'users', 'overview'], queryFn: () => listSchoolUsers({ per_page: 1 }) })
  const rolesQ = useQuery({ queryKey: ['school', 'roles', 'overview'], queryFn: () => listSchoolRoles() })
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat label="Users" value={usersQ.data?.meta?.total ?? '—'} icon={Users} tone="bg-emerald-50 text-emerald-700" onPress={() => navigate('/users/list')} />
        <Stat label="Roles" value={(rolesQ.data?.roles || []).length} icon={Shield} tone="bg-sky-50 text-sky-700" onPress={() => navigate('/users/roles')} />
        <Stat label="Audit" value="Open" icon={Search} tone="bg-amber-50 text-amber-800" onPress={() => navigate('/users/audit')} />
        <Stat label="Security" value="2FA" icon={KeyRound} tone="bg-violet-50 text-violet-700" onPress={() => navigate('/users/2fa')} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { t: 'All Users', p: '/users/list' },
          { t: 'School Roles', p: '/users/roles/school' },
          { t: 'Permissions', p: '/users/permissions' },
          { t: 'Password policies', p: '/users/password-policies' },
          { t: 'Login history', p: '/users/login-history' },
          { t: 'Audit logs', p: '/users/audit' },
        ].map((c) => (
          <Card key={c.p} isPressable className="border border-slate-200 shadow-none" onPress={() => navigate(c.p)}>
            <CardBody className="p-3.5">
              <h3 className="text-sm font-semibold">{c.t}</h3>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ── Compliance ───────────────────────────────────────────────────

function ComplianceOverview() {
  const navigate = useNavigate()
  const q = useQuery({ queryKey: ['school', 'compliance', 'overview'], queryFn: getComplianceOverview })
  if (q.isLoading) return <div className="flex justify-center py-12"><Spinner color="success" /></div>
  const school = q.data?.school || {}
  const s = q.data?.summary || {}
  return (
    <div className="space-y-5">
      <Card className="border border-slate-200 shadow-none">
        <CardBody className="grid gap-2 p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-400">School</p>
            <p className="font-semibold">{school.name}</p>
            <p className="text-xs text-slate-500">EMIS {school.emis_code || '—'} · {school.region}/{school.district}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Enrollment" value={s.enrollment_active ?? 0} />
            <Stat label="Staff" value={s.staff ?? 0} />
            <Stat label="Classes" value={s.classes ?? 0} />
          </div>
        </CardBody>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { t: 'School census', p: '/compliance/census' },
          { t: 'Enrollment statistics', p: '/compliance/enrollment' },
          { t: 'School profile export', p: '/compliance/profile' },
          { t: 'Government export', p: '/compliance/export' },
          { t: 'NECTA / assessment', p: '/compliance/necta' },
          { t: 'Ministry reporting', p: '/compliance/ministry' },
        ].map((c) => (
          <Card key={c.p} isPressable className="border border-slate-200 shadow-none" onPress={() => navigate(c.p)}>
            <CardBody className="p-3.5">
              <h3 className="text-sm font-semibold">{c.t}</h3>
              <p className="text-xs text-slate-500">TAMISEMI-aligned dataset</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ComplianceEnrollment() {
  const q = useQuery({ queryKey: ['school', 'compliance', 'enrollment'], queryFn: getComplianceEnrollment })
  if (q.isLoading) return <div className="flex justify-center py-12"><Spinner color="success" /></div>
  const t = q.data?.totals || {}
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Boys" value={t.boys ?? 0} />
        <Stat label="Girls" value={t.girls ?? 0} />
        <Stat label="Total" value={t.total ?? 0} />
      </div>
      <TableReport
        title="Enrollment by class (boys / girls)"
        rows={q.data?.rows || []}
        columns={[
          { accessorKey: 'classroom', header: 'Class' },
          { accessorKey: 'boys', header: 'Boys' },
          { accessorKey: 'girls', header: 'Girls' },
          { accessorKey: 'total', header: 'Total' },
        ]}
      />
    </div>
  )
}

function ComplianceCensus() {
  const q = useQuery({ queryKey: ['school', 'compliance', 'census'], queryFn: getComplianceCensus })
  if (q.isLoading) return <div className="flex justify-center py-12"><Spinner color="success" /></div>
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        Census as of {q.data?.as_of} · EMIS {q.data?.school?.emis_code || '—'} · Total active {q.data?.total ?? 0}
      </p>
      <TableReport
        title="Census by level & gender"
        rows={q.data?.rows || []}
        columns={[
          { accessorKey: 'level', header: 'Level' },
          { accessorKey: 'gender', header: 'Gender' },
          { accessorKey: 'total', header: 'Count' },
        ]}
      />
    </div>
  )
}

function ComplianceProfile() {
  const q = useQuery({ queryKey: ['school', 'compliance', 'profile'], queryFn: getComplianceProfile })
  if (q.isLoading) return <div className="flex justify-center py-12"><Spinner color="success" /></div>
  const p = q.data?.profile || {}
  return (
    <div className="space-y-3">
      <FormButton
        appearance="bordered"
        startContent={<Download className="h-4 w-4" />}
        onPress={() => downloadCsv('school-profile.csv', [p])}
      >
        Export profile CSV
      </FormButton>
      <Card className="border border-slate-200 shadow-none max-w-2xl">
        <CardBody className="grid gap-2 p-4 sm:grid-cols-2 text-sm">
          {Object.entries(p).map(([k, v]) => (
            <div key={k}>
              <p className="text-[10px] uppercase text-slate-400">{k.replace(/_/g, ' ')}</p>
              <p className="font-medium">{Array.isArray(v) ? v.join(', ') : v || '—'}</p>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  )
}

function ComplianceExport() {
  const [type, setType] = useState('students')
  const q = useQuery({
    queryKey: ['school', 'compliance', 'export', type],
    queryFn: () => getComplianceExport({ type }),
  })
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <FormSelect
          className="w-48"
          options={[
            { value: 'students', label: 'Students (PREMS fields)' },
            { value: 'staff', label: 'Staff' },
            { value: 'enrollment', label: 'Enrollment summary' },
          ]}
          value={type}
          onChange={setType}
        />
        <FormButton
          appearance="bordered"
          startContent={<Download className="h-4 w-4" />}
          isLoading={q.isFetching}
          onPress={() => {
            const rows = q.data?.rows || []
            downloadCsv(`gov-export-${type}.csv`, rows)
          }}
        >
          Download CSV
        </FormButton>
      </div>
      {q.isLoading ? (
        <div className="flex justify-center py-12"><Spinner color="success" /></div>
      ) : (
        <p className="text-sm text-slate-600">
          {q.data?.count ?? 0} rows ready · exported at {String(q.data?.exported_at || '').slice(0, 19)}
        </p>
      )}
    </div>
  )
}

// ── Admin ────────────────────────────────────────────────────────

function AdminSettings() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['school', 'admin', 'settings'], queryFn: getAdminSettings })
  const [form, setForm] = useState(null)
  const mut = useMutation({
    mutationFn: updateAdminSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['school', 'admin', 'settings'] })
      toastSuccess('Settings saved')
      setForm(null)
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  if (q.isLoading) return <div className="flex justify-center py-12"><Spinner color="success" /></div>
  const s = form || q.data?.settings || {}
  return (
    <Card className="max-w-lg border border-slate-200 shadow-none">
      <CardBody className="space-y-3 p-4">
        <FormField label="Display name">
          <FormInput value={s.school_display_name || ''} onChange={(e) => setForm({ ...s, school_display_name: e.target.value })} />
        </FormField>
        <FormField label="Timezone">
          <FormInput value={s.timezone || ''} onChange={(e) => setForm({ ...s, timezone: e.target.value })} />
        </FormField>
        <FormField label="Locale">
          <FormSelect
            options={[
              { value: 'sw', label: 'Kiswahili' },
              { value: 'en', label: 'English' },
            ]}
            value={s.locale || 'sw'}
            onChange={(v) => setForm({ ...s, locale: v })}
          />
        </FormField>
        <FormField label="Currency">
          <FormInput value={s.currency || 'TZS'} onChange={(e) => setForm({ ...s, currency: e.target.value })} />
        </FormField>
        <label className="flex items-center justify-between text-sm">
          Parent portal
          <Switch size="sm" isSelected={Boolean(s.allow_parent_portal)} onValueChange={(v) => setForm({ ...s, allow_parent_portal: v })} />
        </label>
        <label className="flex items-center justify-between text-sm">
          Teacher portal
          <Switch size="sm" isSelected={Boolean(s.allow_teacher_portal)} onValueChange={(v) => setForm({ ...s, allow_teacher_portal: v })} />
        </label>
        <FormButton className="bg-[#0B3D2E]" color="primary" isLoading={mut.isPending} onPress={() => mut.mutate(s)}>
          Save settings
        </FormButton>
      </CardBody>
    </Card>
  )
}

function GatewaySection({ channel }) {
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: ['school', 'gateway', channel],
    queryFn: () => getGatewayConfig(channel),
  })
  const [form, setForm] = useState(null)
  const mut = useMutation({
    mutationFn: (p) => updateGatewayConfig(channel, p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['school', 'gateway', channel] })
      toastSuccess(`${channel} settings saved`)
      setForm(null)
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  if (q.isLoading) return <div className="flex justify-center py-12"><Spinner color="success" /></div>
  const c = form || q.data?.config || {}
  return (
    <Card className="max-w-lg border border-slate-200 shadow-none">
      <CardBody className="space-y-3 p-4">
        <label className="flex items-center justify-between text-sm">
          Enabled
          <Switch size="sm" isSelected={Boolean(c.enabled)} onValueChange={(v) => setForm({ ...c, enabled: v })} />
        </label>
        <FormField label="Provider">
          <FormInput value={c.provider || ''} onChange={(e) => setForm({ ...c, provider: e.target.value })} placeholder="e.g. Africa's Talking, SMTP" />
        </FormField>
        <FormField label="Sender ID / From">
          <FormInput value={c.sender_id || c.from_address || ''} onChange={(e) => setForm({ ...c, sender_id: e.target.value, from_address: e.target.value })} />
        </FormField>
        <FormField label="API key">
          <FormInput
            type="password"
            value={c.api_key || ''}
            onChange={(e) => setForm({ ...c, api_key: e.target.value })}
            placeholder={c.api_key_set ? '•••• set — enter to replace' : 'Optional'}
          />
        </FormField>
        <FormField label="Notes">
          <FormTextarea value={c.notes || ''} onChange={(e) => setForm({ ...c, notes: e.target.value })} />
        </FormField>
        <FormButton className="bg-[#0B3D2E]" color="primary" isLoading={mut.isPending} onPress={() => mut.mutate(c)}>
          Save {channel} gateway
        </FormButton>
      </CardBody>
    </Card>
  )
}

function TemplatesSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const listQ = useQuery({ queryKey: ['school', 'templates'], queryFn: listNotificationTemplates })
  const [form, setForm] = useState({ channel: 'sms', key: '', subject: '', body: '' })
  const mut = useMutation({
    mutationFn: saveNotificationTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['school', 'templates'] })
      toastSuccess('Template saved')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  const columns = useMemo(
    () => [
      { accessorKey: 'channel', header: 'Channel' },
      { accessorKey: 'key', header: 'Key' },
      { accessorKey: 'subject', header: 'Subject', Cell: ({ row }) => row.original.subject || '—' },
      {
        accessorKey: 'body',
        header: 'Body',
        Cell: ({ row }) => (
          <span className="line-clamp-1 max-w-xs text-xs">{row.original.body}</span>
        ),
      },
    ],
    [],
  )
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <FormButton className="bg-[#0B3D2E]" color="primary" startContent={<Plus className="h-4 w-4" />} onPress={() => sheet.onOpen()}>
          Add template
        </FormButton>
      </div>
      {listQ.isLoading ? (
        <div className="flex justify-center py-12"><Spinner color="success" /></div>
      ) : (
        <DataTable columns={columns} data={listQ.data?.templates || []} emptyMessage="No templates yet." />
      )}
      <SideSheet isOpen={sheet.isOpen} onOpenChange={sheet.onOpenChange} title="Notification template" size="md">
        <div className="space-y-3">
          <FormField label="Channel">
            <FormSelect
              options={[
                { value: 'sms', label: 'SMS' },
                { value: 'email', label: 'Email' },
                { value: 'whatsapp', label: 'WhatsApp' },
                { value: 'push', label: 'Push' },
              ]}
              value={form.channel}
              onChange={(v) => setForm((f) => ({ ...f, channel: v }))}
            />
          </FormField>
          <FormField label="Key" required>
            <FormInput value={form.key} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))} placeholder="fee_reminder" />
          </FormField>
          <FormField label="Subject">
            <FormInput value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
          </FormField>
          <FormField label="Body" required>
            <FormTextarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} placeholder="Habari {{name}}, …" />
          </FormField>
          <FormButton className="w-full bg-[#0B3D2E]" color="primary" isLoading={mut.isPending} onPress={() => mut.mutate(form)}>
            Save
          </FormButton>
        </div>
      </SideSheet>
    </div>
  )
}

function WebhooksSection() {
  const qc = useQueryClient()
  const sheet = useDisclosure()
  const listQ = useQuery({ queryKey: ['school', 'webhooks'], queryFn: listWebhooks })
  const [form, setForm] = useState({ name: '', url: '', is_active: true })
  const createMut = useMutation({
    mutationFn: createWebhook,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['school', 'webhooks'] })
      toastSuccess('Webhook created')
      sheet.onClose()
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  const delMut = useMutation({
    mutationFn: deleteWebhook,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['school', 'webhooks'] })
      toastSuccess('Webhook removed')
    },
  })
  const columns = useMemo(
    () => [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'url', header: 'URL' },
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
          <FormButton size="sm" appearance="flat" color="danger" onPress={() => delMut.mutate(row.original.id)}>
            Delete
          </FormButton>
        ),
      },
    ],
    [delMut],
  )
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <FormButton className="bg-[#0B3D2E]" color="primary" startContent={<Plus className="h-4 w-4" />} onPress={() => sheet.onOpen()}>
          Add webhook
        </FormButton>
      </div>
      {listQ.isLoading ? (
        <div className="flex justify-center py-12"><Spinner color="success" /></div>
      ) : (
        <DataTable columns={columns} data={listQ.data?.webhooks || []} emptyMessage="No webhooks." />
      )}
      <SideSheet isOpen={sheet.isOpen} onOpenChange={sheet.onOpenChange} title="New webhook" size="md">
        <div className="space-y-3">
          <FormField label="Name" required>
            <FormInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </FormField>
          <FormField label="URL" required>
            <FormInput value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://…" />
          </FormField>
          <FormButton className="w-full bg-[#0B3D2E]" color="primary" isLoading={createMut.isPending} onPress={() => createMut.mutate(form)}>
            Create
          </FormButton>
        </div>
      </SideSheet>
    </div>
  )
}

function BackupSection() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['school', 'backup'], queryFn: getBackupStatus })
  const mut = useMutation({
    mutationFn: requestBackup,
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['school', 'backup'] })
      toastSuccess(d?.message || 'Backup requested')
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  if (q.isLoading) return <div className="flex justify-center py-12"><Spinner color="success" /></div>
  const b = q.data?.backup || {}
  return (
    <Card className="max-w-lg border border-slate-200 shadow-none">
      <CardBody className="space-y-3 p-4">
        <p className="text-sm"><strong>Schedule:</strong> {b.schedule}</p>
        <p className="text-sm"><strong>Last backup:</strong> {b.last_backup_at || 'Not recorded'}</p>
        <p className="text-sm"><strong>Retention:</strong> {b.retention_days} days</p>
        <p className="text-xs text-slate-500">{b.note}</p>
        <FormButton className="bg-[#0B3D2E]" color="primary" isLoading={mut.isPending} onPress={() => mut.mutate()}>
          Request backup
        </FormButton>
      </CardBody>
    </Card>
  )
}

function ApiKeysSection() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['school', 'api-keys'], queryFn: getApiKeys })
  const [secret, setSecret] = useState(null)
  const mut = useMutation({
    mutationFn: rotateApiKeys,
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['school', 'api-keys'] })
      setSecret(d?.api_keys?.secret_key || null)
      toastSuccess('API keys rotated')
    },
    onError: (e) => toastError(e?.message || 'Failed'),
  })
  if (q.isLoading) return <div className="flex justify-center py-12"><Spinner color="success" /></div>
  const k = q.data?.api_keys || {}
  return (
    <Card className="max-w-lg border border-slate-200 shadow-none">
      <CardBody className="space-y-3 p-4">
        <p className="text-sm font-mono break-all"><strong>Public:</strong> {k.public_key || '—'}</p>
        <p className="text-sm"><strong>Secret:</strong> {k.has_secret ? 'Set' : 'Not set'}</p>
        {secret ? (
          <p className="rounded-md bg-amber-50 p-2 text-xs font-mono text-amber-900 break-all">
            New secret (copy now): {secret}
          </p>
        ) : null}
        <FormButton className="bg-[#0B3D2E]" color="primary" isLoading={mut.isPending} onPress={() => mut.mutate()}>
          Rotate keys
        </FormButton>
      </CardBody>
    </Card>
  )
}

function AdminOverview() {
  const navigate = useNavigate()
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {[
        { t: 'System settings', p: '/admin/settings' },
        { t: 'Email gateway', p: '/admin/email' },
        { t: 'SMS gateway', p: '/admin/sms' },
        { t: 'WhatsApp', p: '/admin/whatsapp' },
        { t: 'Templates', p: '/admin/templates' },
        { t: 'API keys', p: '/admin/api-keys' },
        { t: 'Webhooks', p: '/admin/webhooks' },
        { t: 'Backup', p: '/admin/backup' },
        { t: 'System logs', p: '/admin/logs' },
      ].map((c) => (
        <Card key={c.p} isPressable className="border border-slate-200 shadow-none" onPress={() => navigate(c.p)}>
          <CardBody className="p-3.5">
            <h3 className="text-sm font-semibold">{c.t}</h3>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

function LogsSection() {
  const q = useQuery({
    queryKey: ['school', 'admin', 'logs'],
    queryFn: () => listSystemLogs({ per_page: 50 }),
  })
  const columns = useMemo(
    () => [
      {
        accessorKey: 'created_at',
        header: 'When',
        Cell: ({ row }) => String(row.original.created_at || '').slice(0, 19).replace('T', ' '),
      },
      { accessorKey: 'action', header: 'Action' },
      {
        accessorKey: 'user',
        header: 'User',
        Cell: ({ row }) => row.original.user?.name || '—',
      },
    ],
    [],
  )
  if (q.isLoading) return <div className="flex justify-center py-12"><Spinner color="success" /></div>
  return <DataTable columns={columns} data={q.data?.logs || []} emptyMessage="No system logs." />
}

export default function SystemWorkspace() {
  const { pathname } = useLocation()
  const meta = resolveMeta(pathname)
  const hub =
    pathname.startsWith('/compliance')
      ? 'Compliance'
      : pathname.startsWith('/users')
        ? 'Users & roles'
        : pathname.startsWith('/admin')
          ? 'Administration'
          : 'Reports'

  let body
  switch (meta.section) {
    case 'reports-overview':
      body = <ReportsOverview />
      break
    case 'reports-students':
      body = <ReportsStudents />
      break
    case 'reports-attendance':
      body = <ReportsAttendance />
      break
    case 'reports-exams':
      body = (
        <p className="text-sm text-slate-600">
          Examination analytics live in Assess → Examinations. School summary assessments count is available from the reports API.
        </p>
      )
      break
    case 'reports-teachers':
      body = <ReportsTeachers />
      break
    case 'reports-finance':
      body = <ReportsFinance />
      break
    case 'reports-inventory':
      body = <ReportsInventory />
      break
    case 'reports-custom':
    case 'reports-export':
      body = <ReportsExport />
      break
    case 'users-overview':
      body = <UsersOverview />
      break
    case 'users-list':
      body = <UsersList />
      break
    case 'users-permissions':
      body = <PermissionsSection />
      break
    case 'users-roles':
      body = <RolesSection />
      break
    case 'users-roles-platform':
      body = <RolesSection scope="platform" />
      break
    case 'users-roles-school':
      body = <RolesSection scope="school" />
      break
    case 'users-roles-family':
      body = <RolesSection scope="family" />
      break
    case 'users-password':
      body = <PasswordPolicySection />
      break
    case 'users-2fa':
      body = <TwoFactorSection />
      break
    case 'users-audit':
      body = <AuditSection />
      break
    case 'users-login':
      body = <LoginHistorySection />
      break
    case 'compliance-overview':
    case 'compliance-ministry':
      body = <ComplianceOverview />
      break
    case 'compliance-census':
      body = <ComplianceCensus />
      break
    case 'compliance-enrollment':
    case 'compliance-necta':
    case 'compliance-promotions':
      body = <ComplianceEnrollment />
      break
    case 'compliance-ca':
      body = (
        <p className="text-sm text-slate-600">
          Continuous assessment and NECTA-linked results are managed under Examinations and Report Cards. Use Enrollment and Census for ministry headcount packs.
        </p>
      )
      break
    case 'compliance-profile':
      body = <ComplianceProfile />
      break
    case 'compliance-export':
      body = <ComplianceExport />
      break
    case 'admin-overview':
      body = <AdminOverview />
      break
    case 'admin-settings':
      body = <AdminSettings />
      break
    case 'admin-email':
      body = <GatewaySection channel="email" />
      break
    case 'admin-sms':
      body = <GatewaySection channel="sms" />
      break
    case 'admin-whatsapp':
      body = <GatewaySection channel="whatsapp" />
      break
    case 'admin-templates':
      body = <TemplatesSection />
      break
    case 'admin-webhooks':
      body = <WebhooksSection />
      break
    case 'admin-backup':
      body = <BackupSection />
      break
    case 'admin-logs':
      body = <LogsSection />
      break
    case 'admin-api-keys':
      body = <ApiKeysSection />
      break
    default:
      body = <ReportsOverview />
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title={meta.title}
          description="School system hub — reports, security, TAMISEMI compliance and administration"
          breadcrumbs={[
            { label: 'System', href: '/reports' },
            { label: hub },
            { label: meta.title },
          ]}
        />
        {body}
      </div>
    </DashboardLayout>
  )
}
