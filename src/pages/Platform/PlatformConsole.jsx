import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Chip,
  Spinner,
  useDisclosure,
} from '@heroui/react'
import { Plus } from 'lucide-react'
import { toastSuccess, toastError } from '../../components/Toast'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import PageHeader from '../../components/Layout/PageHeader.jsx'
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
import PlatformOverview from './PlatformOverview.jsx'
import {
  platformDashboard,
  platformSchools,
  platformCreateSchool,
  platformUpdateSchool,
  platformPlans,
  platformCreatePlan,
  platformUpdatePlan,
  platformDeletePlan,
  platformSubscriptions,
  platformUpdateSubscription,
  platformUsers,
  platformCreateUser,
  platformRoles,
  platformBilling,
  platformCreateInvoice,
  platformMarkInvoicePaid,
  platformNotifications,
  platformCreateNotification,
  platformSettings,
  platformAuditLogs,
} from '../../api/domain.js'

const emptyPlanForm = () => ({
  id: null,
  name: '',
  code: '',
  billing_cycle: 'monthly',
  price: '',
  currency: 'USD',
  trial_days: '14',
  max_students: '',
  max_staff: '',
  features: '',
  is_active: true,
})

function sectionFromPath(pathname, search) {
  if (pathname === '/platform' || pathname === '/platform/') return 'overview'
  if (pathname.startsWith('/platform/schools')) return 'schools'
  if (pathname.startsWith('/platform/subscriptions')) {
    const tab = new URLSearchParams(search).get('tab')
    return tab === 'plans' ? 'plans' : 'subscriptions'
  }
  if (pathname.startsWith('/platform/users')) return 'users'
  if (pathname.startsWith('/platform/roles')) return 'roles'
  if (pathname.startsWith('/platform/billing')) return 'billing'
  if (pathname.startsWith('/platform/notifications')) return 'notifications'
  if (pathname.startsWith('/platform/audit-logs')) return 'audit'
  if (pathname.startsWith('/platform/settings/auth')) return 'settings-auth'
  if (pathname.startsWith('/platform/settings/security')) return 'settings-security'
  if (pathname.startsWith('/platform/settings/integrations')) return 'settings-integrations'
  if (pathname.startsWith('/platform/settings/branding')) return 'settings-branding'
  if (pathname.startsWith('/platform/settings/maintenance')) return 'settings-maintenance'
  if (pathname.startsWith('/platform/settings')) return 'settings'
  return 'overview'
}

const statusColor = {
  active: 'success',
  trial: 'primary',
  pending: 'warning',
  suspended: 'danger',
  rejected: 'danger',
  unpaid: 'warning',
  paid: 'success',
  cancelled: 'default',
  expired: 'danger',
  past_due: 'warning',
  sent: 'success',
  draft: 'default',
}

function StatusChip({ value }) {
  if (!value) return <span className="text-zinc-400">—</span>
  return (
    <Chip
      size="sm"
      variant="flat"
      color={statusColor[value] || 'default'}
      className="capitalize"
    >
      {value}
    </Chip>
  )
}

function PlatformConsole() {
  const location = useLocation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const section = sectionFromPath(location.pathname, location.search)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const schoolSheet = useDisclosure()
  const userSheet = useDisclosure()
  const invoiceSheet = useDisclosure()
  const notifSheet = useDisclosure()
  const planSheet = useDisclosure()

  const [schoolForm, setSchoolForm] = useState({
    name: '',
    code: '',
    contact_email: '',
    status: 'pending',
    plan_id: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
  })
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role_id: '',
  })
  const [invoiceForm, setInvoiceForm] = useState({
    school_id: '',
    amount: '',
    description: '',
  })
  const [notifForm, setNotifForm] = useState({
    title: '',
    body: '',
    channel: 'system',
    audience: 'all',
  })
  const [planForm, setPlanForm] = useState(emptyPlanForm)

  const dashQ = useQuery({
    queryKey: ['platform', 'dashboard'],
    queryFn: platformDashboard,
    enabled: section === 'overview',
  })
  const schoolsQ = useQuery({
    queryKey: ['platform', 'schools'],
    queryFn: () => platformSchools({ per_page: 100 }),
    enabled: ['schools', 'billing', 'overview'].includes(section),
  })
  const plansQ = useQuery({
    queryKey: ['platform', 'plans'],
    queryFn: platformPlans,
    enabled: ['plans', 'subscriptions', 'schools', 'overview'].includes(section),
  })
  const subsQ = useQuery({
    queryKey: ['platform', 'subscriptions'],
    queryFn: () => platformSubscriptions({ per_page: 100 }),
    enabled: section === 'subscriptions',
  })
  const usersQ = useQuery({
    queryKey: ['platform', 'users'],
    queryFn: () => platformUsers({ per_page: 100 }),
    enabled: section === 'users',
  })
  const rolesQ = useQuery({
    queryKey: ['platform', 'roles'],
    queryFn: platformRoles,
    enabled: ['roles', 'users'].includes(section),
  })
  const billingQ = useQuery({
    queryKey: ['platform', 'billing'],
    queryFn: () => platformBilling({ per_page: 100 }),
    enabled: section === 'billing',
  })
  const notifQ = useQuery({
    queryKey: ['platform', 'notifications'],
    queryFn: platformNotifications,
    enabled: section === 'notifications',
  })
  const settingsQ = useQuery({
    queryKey: ['platform', 'settings'],
    queryFn: platformSettings,
    enabled: section === 'settings' || section.startsWith('settings-'),
  })
  const auditQ = useQuery({
    queryKey: ['platform', 'audit'],
    queryFn: () => platformAuditLogs({ per_page: 100 }),
    enabled: section === 'audit',
  })

  const resetSchoolForm = () =>
    setSchoolForm({
      name: '',
      code: '',
      contact_email: '',
      status: 'pending',
      plan_id: '',
      admin_name: '',
      admin_email: '',
      admin_password: '',
    })

  const createSchoolMut = useMutation({
    mutationFn: platformCreateSchool,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform', 'schools'] })
      setMessage('School created')
      toastSuccess('School created')
      setError('')
      resetSchoolForm()
      schoolSheet.onClose()
    },
    onError: (e) => {
      setError(e.message)
      toastError('Action failed', e.message)
    },
  })
  const updateSchoolMut = useMutation({
    mutationFn: ({ id, payload }) => platformUpdateSchool(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform', 'schools'] })
      setMessage('School updated')
      toastSuccess('School updated')
    },
    onError: (e) => {
      setError(e.message)
      toastError('Action failed', e.message)
    },
  })
  const updateSubMut = useMutation({
    mutationFn: ({ id, payload }) => platformUpdateSubscription(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform', 'subscriptions'] })
      setMessage('Subscription updated')
      toastSuccess('Subscription updated')
    },
    onError: (e) => {
      setError(e.message)
      toastError('Action failed', e.message)
    },
  })
  const createUserMut = useMutation({
    mutationFn: platformCreateUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform', 'users'] })
      setMessage('User created')
      toastSuccess('User created')
      setUserForm({ name: '', email: '', password: '', role_id: '' })
      userSheet.onClose()
    },
    onError: (e) => {
      setError(e.message)
      toastError('Action failed', e.message)
    },
  })
  const createInvoiceMut = useMutation({
    mutationFn: platformCreateInvoice,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform', 'billing'] })
      setMessage('Invoice created')
      toastSuccess('Invoice created')
      setInvoiceForm({ school_id: '', amount: '', description: '' })
      invoiceSheet.onClose()
    },
    onError: (e) => {
      setError(e.message)
      toastError('Action failed', e.message)
    },
  })
  const payMut = useMutation({
    mutationFn: platformMarkInvoicePaid,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform', 'billing'] })
      setMessage('Invoice marked paid')
      toastSuccess('Invoice marked paid')
    },
    onError: (e) => {
      setError(e.message)
      toastError('Action failed', e.message)
    },
  })
  const notifMut = useMutation({
    mutationFn: platformCreateNotification,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform', 'notifications'] })
      setMessage('Notification saved')
      toastSuccess('Notification saved')
      setNotifForm({ title: '', body: '', channel: 'system', audience: 'all' })
      notifSheet.onClose()
    },
    onError: (e) => {
      setError(e.message)
      toastError('Action failed', e.message)
    },
  })

  const openCreatePlan = () => {
    setPlanForm(emptyPlanForm())
    setError('')
    planSheet.onOpen()
  }

  const openEditPlan = (plan) => {
    setPlanForm({
      id: plan.id,
      name: plan.name || '',
      code: plan.code || '',
      billing_cycle: plan.billing_cycle || 'monthly',
      price: String(plan.price ?? ''),
      currency: plan.currency || 'USD',
      trial_days: String(plan.trial_days ?? 14),
      max_students: plan.max_students != null ? String(plan.max_students) : '',
      max_staff: plan.max_staff != null ? String(plan.max_staff) : '',
      features: Array.isArray(plan.features) ? plan.features.join(', ') : '',
      is_active: plan.is_active !== false,
    })
    setError('')
    planSheet.onOpen()
  }

  const planPayload = () => {
    const features = planForm.features
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    return {
      name: planForm.name.trim(),
      code: planForm.code.trim() || planForm.name.trim().toLowerCase().replace(/\s+/g, '_'),
      billing_cycle: planForm.billing_cycle,
      price: Number(planForm.price),
      currency: (planForm.currency || 'USD').toUpperCase(),
      trial_days: Number(planForm.trial_days || 0),
      max_students: planForm.max_students ? Number(planForm.max_students) : null,
      max_staff: planForm.max_staff ? Number(planForm.max_staff) : null,
      features,
      is_active: Boolean(planForm.is_active),
    }
  }

  const createPlanMut = useMutation({
    mutationFn: platformCreatePlan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform', 'plans'] })
      qc.invalidateQueries({ queryKey: ['platform', 'dashboard'] })
      setMessage('Plan created')
      toastSuccess('Plan created')
      setError('')
      setPlanForm(emptyPlanForm())
      planSheet.onClose()
    },
    onError: (e) => {
      setError(e.message)
      toastError('Action failed', e.message)
    },
  })

  const updatePlanMut = useMutation({
    mutationFn: ({ id, payload }) => platformUpdatePlan(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform', 'plans'] })
      qc.invalidateQueries({ queryKey: ['platform', 'dashboard'] })
      setMessage('Plan updated')
      toastSuccess('Plan updated')
      setError('')
      setPlanForm(emptyPlanForm())
      planSheet.onClose()
    },
    onError: (e) => {
      setError(e.message)
      toastError('Action failed', e.message)
    },
  })

  const deletePlanMut = useMutation({
    mutationFn: platformDeletePlan,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['platform', 'plans'] })
      qc.invalidateQueries({ queryKey: ['platform', 'dashboard'] })
      const msg = data?.deactivated
        ? 'Plan deactivated (still has active subscriptions)'
        : 'Plan deleted'
      setMessage(msg)
      toastSuccess(msg)
      setError('')
    },
    onError: (e) => {
      setError(e.message)
      toastError('Action failed', e.message)
    },
  })

  const savePlan = () => {
    setError('')
    if (!planForm.name.trim()) {
      setError('Plan name is required')
      return
    }
    if (planForm.price === '' || Number.isNaN(Number(planForm.price))) {
      setError('Valid price is required')
      return
    }
    const payload = planPayload()
    if (planForm.id) {
      updatePlanMut.mutate({ id: planForm.id, payload })
    } else {
      createPlanMut.mutate(payload)
    }
  }

  const pageMeta = useMemo(() => {
    const map = {
      overview: {
        title: 'Platform Overview',
        crumbs: [
          { label: 'Platform', href: '/platform' },
          { label: 'Overview' },
        ],
      },
      schools: {
        title: 'Schools (Tenants)',
        crumbs: [
          { label: 'Platform', href: '/platform' },
          { label: 'Schools' },
        ],
      },
      subscriptions: {
        title: 'Subscriptions',
        crumbs: [
          { label: 'Platform', href: '/platform' },
          { label: 'Subscriptions' },
        ],
      },
      plans: {
        title: 'Subscription Plans',
        crumbs: [
          { label: 'Platform', href: '/platform' },
          { label: 'Subscriptions', href: '/platform/subscriptions' },
          { label: 'Plans' },
        ],
      },
      users: {
        title: 'Platform Users',
        crumbs: [
          { label: 'Platform', href: '/platform' },
          { label: 'Users' },
        ],
      },
      roles: {
        title: 'Roles',
        crumbs: [
          { label: 'Platform', href: '/platform' },
          { label: 'Roles' },
        ],
      },
      billing: {
        title: 'Billing',
        crumbs: [
          { label: 'Platform', href: '/platform' },
          { label: 'Billing' },
        ],
      },
      notifications: {
        title: 'Notifications',
        crumbs: [
          { label: 'Platform', href: '/platform' },
          { label: 'Notifications' },
        ],
      },
      settings: {
        title: 'General Settings',
        crumbs: [
          { label: 'Settings', href: '/platform/settings' },
          { label: 'General' },
        ],
      },
      'settings-auth': {
        title: 'Authentication Settings',
        crumbs: [
          { label: 'Settings', href: '/platform/settings' },
          { label: 'Authentication' },
        ],
      },
      'settings-security': {
        title: 'Security Settings',
        crumbs: [
          { label: 'Settings', href: '/platform/settings' },
          { label: 'Security' },
        ],
      },
      'settings-integrations': {
        title: 'Integrations',
        crumbs: [
          { label: 'Settings', href: '/platform/settings' },
          { label: 'Integrations' },
        ],
      },
      'settings-branding': {
        title: 'Platform Branding',
        crumbs: [
          { label: 'Settings', href: '/platform/settings' },
          { label: 'Branding' },
        ],
      },
      'settings-maintenance': {
        title: 'Maintenance',
        crumbs: [
          { label: 'Settings', href: '/platform/settings' },
          { label: 'Maintenance' },
        ],
      },
      audit: {
        title: 'Audit Logs',
        crumbs: [
          { label: 'Settings', href: '/platform/settings' },
          { label: 'Audit Logs' },
        ],
      },
    }
    return map[section] || { title: 'Platform', crumbs: [{ label: 'Platform' }] }
  }, [section])

  const schools = schoolsQ.data?.schools || []
  const plans = plansQ.data?.plans || []
  const subs = subsQ.data?.subscriptions || []
  const users = usersQ.data?.users || []
  const roles = rolesQ.data?.roles || []
  const invoices = billingQ.data?.invoices || []
  const notifications = notifQ.data?.notifications || []
  const logs = auditQ.data?.logs || []
  const stats = dashQ.data?.stats

  const schoolColumns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'School',
        size: 260,
        Cell: ({ row }) => (
          <div>
            <div className="font-medium text-zinc-900">{row.original.name}</div>
            <div className="text-[11px] text-zinc-400">
              {row.original.code || '—'} · {row.original.contact_email || '—'}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 110,
        Cell: ({ cell }) => <StatusChip value={cell.getValue()} />,
      },
      {
        id: 'plan',
        header: 'Plan',
        size: 130,
        accessorFn: (r) => r.current_subscription?.plan?.name || '—',
      },
      {
        accessorKey: 'users_count',
        header: 'Users',
        size: 80,
        Cell: ({ cell }) => cell.getValue() ?? '—',
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 96,
        enableSorting: false,
        Cell: ({ row }) => {
          const s = row.original
          return (
            <RowActionsMenu
              ariaLabel={`Actions for ${s.name}`}
              items={[
                {
                  key: 'view',
                  label: 'View details',
                  onPress: () => window.alert(s.name),
                },
                {
                  key: 'activate',
                  label: 'Activate',
                  show: s.status !== 'active',
                  onPress: () =>
                    updateSchoolMut.mutate({
                      id: s.id,
                      payload: { status: 'active' },
                    }),
                },
                {
                  key: 'suspend',
                  label: 'Suspend',
                  color: 'warning',
                  show: s.status === 'active',
                  onPress: () =>
                    updateSchoolMut.mutate({
                      id: s.id,
                      payload: { status: 'suspended' },
                    }),
                },
                {
                  key: 'reject',
                  label: 'Reject',
                  color: 'danger',
                  show: s.status === 'pending',
                  onPress: () =>
                    updateSchoolMut.mutate({
                      id: s.id,
                      payload: { status: 'rejected' },
                    }),
                },
              ]}
            />
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateSchoolMut.isPending],
  )

  const planColumns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Plan',
        size: 180,
        Cell: ({ row }) => (
          <div>
            <div className="font-medium text-zinc-900">{row.original.name}</div>
            <div className="font-mono text-[11px] text-zinc-400">
              {row.original.code}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'billing_cycle',
        header: 'Cycle',
        size: 100,
        Cell: ({ cell }) => (
          <span className="capitalize">{cell.getValue()}</span>
        ),
      },
      {
        accessorKey: 'price',
        header: 'Price',
        size: 120,
        Cell: ({ row }) =>
          `$${Number(row.original.price).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })} ${row.original.currency || 'USD'}`.trim(),
      },
      {
        accessorKey: 'trial_days',
        header: 'Trial',
        size: 80,
        Cell: ({ cell }) => `${cell.getValue() ?? 0}d`,
      },
      {
        id: 'limits',
        header: 'Limits',
        size: 160,
        Cell: ({ row }) => (
          <span className="text-[12px] text-zinc-600">
            Students: {row.original.max_students ?? '∞'}
            <br />
            Staff: {row.original.max_staff ?? '∞'}
          </span>
        ),
      },
      {
        id: 'subscribers',
        header: 'Subscribers',
        size: 110,
        Cell: ({ row }) => (
          <div className="tabular-nums">
            <span className="font-medium text-zinc-900">
              {row.original.active_subscriptions_count ?? 0}
            </span>
            <span className="text-[11px] text-zinc-400">
              {' '}
              active
              {(row.original.trial_subscriptions_count || 0) > 0
                ? ` · ${row.original.trial_subscriptions_count} trial`
                : ''}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        size: 100,
        Cell: ({ cell }) => (
          <Chip
            size="sm"
            variant="flat"
            color={cell.getValue() ? 'success' : 'default'}
          >
            {cell.getValue() ? 'Active' : 'Inactive'}
          </Chip>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 96,
        enableSorting: false,
        Cell: ({ row }) => {
          const p = row.original
          return (
            <RowActionsMenu
              ariaLabel={`Actions for ${p.name}`}
              items={[
                {
                  key: 'edit',
                  label: 'Edit plan',
                  onPress: () => openEditPlan(p),
                },
                {
                  key: 'toggle',
                  label: p.is_active ? 'Deactivate' : 'Activate',
                  color: p.is_active ? 'warning' : 'default',
                  onPress: () =>
                    updatePlanMut.mutate({
                      id: p.id,
                      payload: { is_active: !p.is_active },
                    }),
                },
                {
                  key: 'delete',
                  label: 'Delete',
                  color: 'danger',
                  onPress: () => {
                    if (
                      window.confirm(
                        `Remove plan “${p.name}”? Active subscriptions will deactivate the plan instead of deleting it.`,
                      )
                    ) {
                      deletePlanMut.mutate(p.id)
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
    [updatePlanMut.isPending, deletePlanMut.isPending],
  )

  const subColumns = useMemo(
    () => [
      {
        id: 'school',
        header: 'School',
        size: 200,
        accessorFn: (s) => s.school?.name || s.school_id,
      },
      {
        id: 'plan',
        header: 'Plan',
        size: 140,
        accessorFn: (s) => s.plan?.name || '—',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 110,
        Cell: ({ cell }) => <StatusChip value={cell.getValue()} />,
      },
      {
        accessorKey: 'ends_on',
        header: 'Ends',
        size: 120,
        Cell: ({ cell }) => cell.getValue() || '—',
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 96,
        enableSorting: false,
        Cell: ({ row }) => {
          const s = row.original
          return (
            <RowActionsMenu
              ariaLabel="Subscription actions"
              items={[
                {
                  key: 'activate',
                  label: 'Activate',
                  onPress: () =>
                    updateSubMut.mutate({
                      id: s.id,
                      payload: { status: 'active' },
                    }),
                },
                {
                  key: 'cancel',
                  label: 'Cancel',
                  color: 'danger',
                  onPress: () =>
                    updateSubMut.mutate({
                      id: s.id,
                      payload: { status: 'cancelled' },
                    }),
                },
              ]}
            />
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateSubMut.isPending],
  )

  const userColumns = useMemo(
    () => [
      { accessorKey: 'name', header: 'Name', size: 160 },
      { accessorKey: 'email', header: 'Email', size: 220 },
      {
        id: 'role',
        header: 'Role',
        size: 140,
        accessorFn: (u) => u.role?.label || u.role?.name || '—',
      },
      {
        id: 'school',
        header: 'School',
        size: 160,
        accessorFn: (u) => u.school?.name || 'Platform',
      },
    ],
    [],
  )

  const roleColumns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        size: 160,
        Cell: ({ cell }) => (
          <span className="font-mono text-xs">{cell.getValue()}</span>
        ),
      },
      { accessorKey: 'label', header: 'Label', size: 180 },
      {
        accessorKey: 'users_count',
        header: 'Users',
        size: 90,
        Cell: ({ cell }) => cell.getValue() ?? 0,
      },
    ],
    [],
  )

  const invoiceColumns = useMemo(
    () => [
      {
        accessorKey: 'reference',
        header: 'Ref',
        size: 140,
        Cell: ({ cell }) => (
          <span className="font-mono text-xs">{cell.getValue()}</span>
        ),
      },
      {
        id: 'school',
        header: 'School',
        size: 180,
        accessorFn: (inv) => inv.school?.name || '—',
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        size: 110,
        Cell: ({ cell }) => `$${Number(cell.getValue()).toLocaleString()}`,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 100,
        Cell: ({ cell }) => <StatusChip value={cell.getValue()} />,
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 96,
        enableSorting: false,
        Cell: ({ row }) => {
          const inv = row.original
          return (
            <RowActionsMenu
              ariaLabel="Invoice actions"
              items={[
                {
                  key: 'pay',
                  label: 'Mark paid',
                  show: inv.status !== 'paid',
                  onPress: () => payMut.mutate(inv.id),
                },
                {
                  key: 'view',
                  label: 'View invoice',
                  onPress: () => window.alert(inv.reference),
                },
              ]}
            />
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [payMut.isPending],
  )

  const notifColumns = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Title',
        size: 260,
        Cell: ({ row }) => (
          <div>
            <div className="text-sm">{row.original.title}</div>
            <div className="line-clamp-1 text-[11px] text-zinc-400">
              {row.original.body}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'channel',
        header: 'Channel',
        size: 100,
        Cell: ({ cell }) => (
          <span className="capitalize">{cell.getValue()}</span>
        ),
      },
      {
        accessorKey: 'audience',
        header: 'Audience',
        size: 120,
        Cell: ({ cell }) => (
          <span className="capitalize">{cell.getValue()}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 100,
        Cell: ({ cell }) => <StatusChip value={cell.getValue()} />,
      },
    ],
    [],
  )

  const auditColumns = useMemo(
    () => [
      {
        accessorKey: 'created_at',
        header: 'When',
        size: 170,
        Cell: ({ cell }) => (
          <span className="text-xs">{cell.getValue() || '—'}</span>
        ),
      },
      {
        id: 'user',
        header: 'User',
        size: 180,
        accessorFn: (log) => log.user?.email || '—',
      },
      {
        accessorKey: 'action',
        header: 'Action',
        size: 160,
        Cell: ({ cell }) => (
          <span className="font-mono text-xs">{cell.getValue()}</span>
        ),
      },
      {
        id: 'entity',
        header: 'Entity',
        size: 160,
        accessorFn: (log) =>
          `${log.entity_type || '—'}${log.entity_id ? ` #${log.entity_id}` : ''}`,
      },
    ],
    [],
  )

  const headerActions = useMemo(() => {
    if (section === 'schools') {
      return (
        <FormButton
          startContent={<Plus className="h-4 w-4" />}
          onPress={schoolSheet.onOpen}
        >
          Register school
        </FormButton>
      )
    }
    if (section === 'users') {
      return (
        <FormButton
          startContent={<Plus className="h-4 w-4" />}
          onPress={userSheet.onOpen}
        >
          Create user
        </FormButton>
      )
    }
    if (section === 'billing') {
      return (
        <FormButton
          startContent={<Plus className="h-4 w-4" />}
          onPress={invoiceSheet.onOpen}
        >
          Create invoice
        </FormButton>
      )
    }
    if (section === 'notifications') {
      return (
        <FormButton
          startContent={<Plus className="h-4 w-4" />}
          onPress={notifSheet.onOpen}
        >
          Send notification
        </FormButton>
      )
    }
    if (section === 'subscriptions' || section === 'plans') {
      return (
        <div className="flex flex-wrap gap-2">
          <FormButton
            appearance={section === 'subscriptions' ? 'solid' : 'bordered'}
            onPress={() => navigate('/platform/subscriptions')}
          >
            Subscriptions
          </FormButton>
          <FormButton
            appearance={section === 'plans' ? 'solid' : 'bordered'}
            onPress={() => navigate('/platform/subscriptions?tab=plans')}
          >
            Plans
          </FormButton>
          {section === 'plans' && (
            <FormButton
              startContent={<Plus className="h-4 w-4" />}
              onPress={openCreatePlan}
            >
              New plan
            </FormButton>
          )}
        </div>
      )
    }
    return null
  }, [
    section,
    schoolSheet.onOpen,
    userSheet.onOpen,
    invoiceSheet.onOpen,
    notifSheet.onOpen,
    navigate,
  ])

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title={pageMeta.title}
          breadcrumbs={pageMeta.crumbs}
          actions={headerActions}
        />

        {error && (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {message}
          </p>
        )}

        {section === 'overview' && (
          <PlatformOverview
            liveStats={stats}
            planMix={dashQ.data?.plan_mix || plansQ.data?.plans || []}
            loading={dashQ.isLoading}
          />
        )}

        {section === 'schools' && (
          <div className="min-w-0">
            {schoolsQ.isLoading ? (
              <div className="flex justify-center py-16">
                <Spinner color="primary" />
              </div>
            ) : (
              <DataTable
                columns={schoolColumns}
                data={schools}
                emptyMessage="No schools registered yet"
              />
            )}
          </div>
        )}

        {section === 'plans' && (
          <div className="flex flex-col gap-3">
            {plansQ.data?.summary && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                    Total plans
                  </p>
                  <p className="text-lg font-semibold tabular-nums text-zinc-900">
                    {plansQ.data.summary.total_plans}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                    Active plans
                  </p>
                  <p className="text-lg font-semibold tabular-nums text-emerald-700">
                    {plansQ.data.summary.active_plans}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                    All subscriptions
                  </p>
                  <p className="text-lg font-semibold tabular-nums text-zinc-900">
                    {plansQ.data.summary.total_subscriptions}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                    Active + trial
                  </p>
                  <p className="text-lg font-semibold tabular-nums text-[#0B3D2E]">
                    {plansQ.data.summary.active_subscriptions}
                  </p>
                </div>
              </div>
            )}
            {plansQ.isError ? (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {plansQ.error?.message || 'Failed to load plans'}
              </p>
            ) : (
              <DataTable
                columns={planColumns}
                data={plans}
                isLoading={plansQ.isLoading}
                emptyMessage="No subscription plans yet. Create your first plan."
              />
            )}
          </div>
        )}

        {section === 'subscriptions' && (
          <DataTable
            columns={subColumns}
            data={subs}
            isLoading={subsQ.isLoading}
            emptyMessage="No subscriptions"
          />
        )}

        {section === 'users' && (
          <DataTable
            columns={userColumns}
            data={users}
            isLoading={usersQ.isLoading}
            emptyMessage="No users"
          />
        )}

        {section === 'roles' && (
          <DataTable
            columns={roleColumns}
            data={roles}
            isLoading={rolesQ.isLoading}
            emptyMessage="No roles"
          />
        )}

        {section === 'billing' && (
          <div className="flex flex-col gap-3">
            {billingQ.data?.summary && (
              <div className="flex flex-wrap gap-3 text-[12px] text-zinc-600">
                <span className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5">
                  Paid:{' '}
                  <strong className="text-emerald-700">
                    ${Number(billingQ.data.summary.paid).toLocaleString()}
                  </strong>
                </span>
                <span className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5">
                  Unpaid:{' '}
                  <strong className="text-amber-700">
                    ${Number(billingQ.data.summary.unpaid).toLocaleString()}
                  </strong>
                </span>
              </div>
            )}
            <DataTable
              columns={invoiceColumns}
              data={invoices}
              isLoading={billingQ.isLoading}
              emptyMessage="No invoices"
            />
          </div>
        )}

        {section === 'notifications' && (
          <DataTable
            columns={notifColumns}
            data={notifications}
            isLoading={notifQ.isLoading}
            emptyMessage="No notifications"
          />
        )}

        {section === 'settings' && (
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="mb-3 text-sm font-medium text-zinc-800">
              Platform configuration
            </p>
            {settingsQ.isLoading ? (
              <Spinner color="primary" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(settingsQ.data?.settings || {}).map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="rounded-lg border border-zinc-200 p-3"
                    >
                      <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                        {key.replaceAll('_', ' ')}
                      </p>
                      <pre className="mt-1 whitespace-pre-wrap text-sm text-zinc-800">
                        {typeof value === 'object'
                          ? JSON.stringify(value, null, 2)
                          : String(value)}
                      </pre>
                    </div>
                  ),
                )}
                {!Object.keys(settingsQ.data?.settings || {}).length && (
                  <p className="text-sm text-zinc-500 sm:col-span-2">
                    No settings returned from the API yet.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {section === 'settings-auth' && (
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                title: 'JWT lifetime',
                body: 'Access token expiry and refresh rotation for portal sessions.',
                value: 'Access 60m · Refresh 7d',
              },
              {
                title: 'Password policy',
                body: 'Minimum length, complexity, and reset flow for tenant admins.',
                value: 'Min 8 chars · reset link 24h',
              },
              {
                title: 'MFA',
                body: 'Optional multi-factor for super admins and school owners.',
                value: 'Optional · TOTP',
              },
              {
                title: 'Session limits',
                body: 'Concurrent sessions per user across web and mobile.',
                value: '5 concurrent',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-zinc-200 bg-white p-4"
              >
                <p className="text-sm font-medium text-zinc-900">{card.title}</p>
                <p className="mt-1 text-[12px] text-zinc-500">{card.body}</p>
                <p className="mt-3 text-[12px] font-medium text-[#0B3D2E]">
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {section === 'settings-security' && (
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                title: 'IP allowlist',
                body: 'Restrict super-admin console access by network.',
                value: 'Disabled',
              },
              {
                title: 'Rate limiting',
                body: 'API throttling for login and public registration.',
                value: '60 req/min',
              },
              {
                title: 'Audit retention',
                body: 'How long platform audit events are kept.',
                value: '180 days',
              },
              {
                title: 'Data export',
                body: 'Tenant data export and wipe policies.',
                value: 'Self-service + support',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-zinc-200 bg-white p-4"
              >
                <p className="text-sm font-medium text-zinc-900">{card.title}</p>
                <p className="mt-1 text-[12px] text-zinc-500">{card.body}</p>
                <p className="mt-3 text-[12px] font-medium text-[#0B3D2E]">
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {section === 'settings-integrations' && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'Email (SMTP)', status: 'Connected' },
              { name: 'SMS gateway', status: 'Not configured' },
              { name: 'Payment provider', status: 'Sandbox' },
              { name: 'Storage (S3)', status: 'Connected' },
              { name: 'Analytics', status: 'Optional' },
              { name: 'Webhooks', status: '2 endpoints' },
            ].map((item) => (
              <div
                key={item.name}
                className="rounded-xl border border-zinc-200 bg-white p-4"
              >
                <p className="text-sm font-medium text-zinc-900">{item.name}</p>
                <p className="mt-2 text-[12px] text-zinc-500">{item.status}</p>
              </div>
            ))}
          </div>
        )}

        {section === 'settings-branding' && (
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-sm font-medium text-zinc-900">Platform branding</p>
            <p className="mt-1 text-[12px] text-zinc-500">
              Default product name, logo, and primary color used across the SaaS
              console and tenant onboarding.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                  Product name
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-900">Shengena</p>
              </div>
              <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                  Primary color
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm font-medium text-zinc-900">
                  <span className="inline-block h-4 w-4 rounded bg-[#0B3D2E]" />
                  #0B3D2E
                </p>
              </div>
              <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                  Support email
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-900">
                  support@shengena.app
                </p>
              </div>
            </div>
          </div>
        )}

        {section === 'settings-maintenance' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-sm font-medium text-zinc-900">Maintenance mode</p>
              <p className="mt-1 text-[12px] text-zinc-500">
                Temporarily block tenant portals while showing a status page.
              </p>
              <p className="mt-3 text-[12px] font-medium text-emerald-700">
                Off · all tenants online
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-sm font-medium text-zinc-900">Scheduled jobs</p>
              <p className="mt-1 text-[12px] text-zinc-500">
                Billing renewals, trial expiry notices, and audit cleanup.
              </p>
              <p className="mt-3 text-[12px] font-medium text-[#0B3D2E]">
                Healthy · last run 12 min ago
              </p>
            </div>
          </div>
        )}

        {section === 'audit' && (
          <DataTable
            columns={auditColumns}
            data={logs}
            isLoading={auditQ.isLoading}
            emptyMessage="No audit logs"
          />
        )}
      </div>

      {/* School form — right sheet */}
      <SideSheet
        isOpen={schoolSheet.isOpen}
        onOpenChange={schoolSheet.onOpenChange}
        title="Register school"
        size="lg"
        footer={(onClose) => (
          <>
            <FormButton appearance="light" onPress={onClose}>
              Cancel
            </FormButton>
            <FormButton
              isLoading={createSchoolMut.isPending}
              onPress={() =>
                createSchoolMut.mutate({
                  ...schoolForm,
                  plan_id: schoolForm.plan_id
                    ? Number(schoolForm.plan_id)
                    : undefined,
                  admin_email: schoolForm.admin_email || undefined,
                  admin_password: schoolForm.admin_password || undefined,
                })
              }
            >
              Create school
            </FormButton>
          </>
        )}
      >
        <div className="flex flex-col gap-3">
          <FormField label="Name" required>
            <FormInput
              value={schoolForm.name}
              onValueChange={(v) => setSchoolForm((f) => ({ ...f, name: v }))}
            />
          </FormField>
          <FormField label="Code (optional)">
            <FormInput
              value={schoolForm.code}
              onValueChange={(v) => setSchoolForm((f) => ({ ...f, code: v }))}
            />
          </FormField>
          <FormField label="Contact email">
            <FormInput
              value={schoolForm.contact_email}
              onValueChange={(v) =>
                setSchoolForm((f) => ({ ...f, contact_email: v }))
              }
            />
          </FormField>
          <FormField label="Status">
            <FormSelect
              label="Status"
              value={schoolForm.status}
              onChange={(v) => setSchoolForm((f) => ({ ...f, status: v }))}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'active', label: 'Active' },
                { value: 'suspended', label: 'Suspended' },
              ]}
            />
          </FormField>
          <FormField label="Plan">
            <FormSelect
              label="Plan"
              placeholder="Plan (optional)"
              value={schoolForm.plan_id}
              onChange={(v) => setSchoolForm((f) => ({ ...f, plan_id: v }))}
              options={plans.map((pl) => ({
                value: String(pl.id),
                label: `${pl.name} — $${pl.price}/${pl.billing_cycle}`,
              }))}
            />
          </FormField>
          <div className="my-1 border-t border-zinc-100 pt-3">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              School admin (optional)
            </p>
            <div className="flex flex-col gap-3">
              <FormField label="Admin name">
                <FormInput
                  value={schoolForm.admin_name}
                  onValueChange={(v) =>
                    setSchoolForm((f) => ({ ...f, admin_name: v }))
                  }
                />
              </FormField>
              <FormField label="Admin email">
                <FormInput
                  value={schoolForm.admin_email}
                  onValueChange={(v) =>
                    setSchoolForm((f) => ({ ...f, admin_email: v }))
                  }
                />
              </FormField>
              <FormField label="Admin password">
                <FormInput
                  type="password"
                  value={schoolForm.admin_password}
                  onValueChange={(v) =>
                    setSchoolForm((f) => ({ ...f, admin_password: v }))
                  }
                />
              </FormField>
            </div>
          </div>
        </div>
      </SideSheet>

      {/* User form */}
      <SideSheet
        isOpen={userSheet.isOpen}
        onOpenChange={userSheet.onOpenChange}
        title="Create platform user"
        footer={(onClose) => (
          <>
            <FormButton appearance="light" onPress={onClose}>
              Cancel
            </FormButton>
            <FormButton
              isLoading={createUserMut.isPending}
              onPress={() =>
                createUserMut.mutate({
                  ...userForm,
                  role_id: Number(userForm.role_id),
                })
              }
            >
              Create user
            </FormButton>
          </>
        )}
      >
        <div className="flex flex-col gap-3">
          <FormField label="Name">
            <FormInput
              value={userForm.name}
              onValueChange={(v) => setUserForm((f) => ({ ...f, name: v }))}
            />
          </FormField>
          <FormField label="Email">
            <FormInput
              value={userForm.email}
              onValueChange={(v) => setUserForm((f) => ({ ...f, email: v }))}
            />
          </FormField>
          <FormField label="Password">
            <FormInput
              type="password"
              value={userForm.password}
              onValueChange={(v) => setUserForm((f) => ({ ...f, password: v }))}
            />
          </FormField>
          <FormField label="Role">
            <FormSelect
              label="Role"
              placeholder="Role"
              value={userForm.role_id}
              onChange={(v) => setUserForm((f) => ({ ...f, role_id: v }))}
              options={roles.map((r) => ({
                value: String(r.id),
                label: r.label || r.name,
              }))}
            />
          </FormField>
        </div>
      </SideSheet>

      {/* Invoice form */}
      <SideSheet
        isOpen={invoiceSheet.isOpen}
        onOpenChange={invoiceSheet.onOpenChange}
        title="Create invoice"
        footer={(onClose) => (
          <>
            <FormButton appearance="light" onPress={onClose}>
              Cancel
            </FormButton>
            <FormButton
              isLoading={createInvoiceMut.isPending}
              onPress={() =>
                createInvoiceMut.mutate({
                  school_id: Number(invoiceForm.school_id),
                  amount: Number(invoiceForm.amount),
                  description: invoiceForm.description || undefined,
                })
              }
            >
              Create invoice
            </FormButton>
          </>
        )}
      >
        <div className="flex flex-col gap-3">
          <FormField label="School">
            <FormSelect
              label="School"
              placeholder="School"
              value={invoiceForm.school_id}
              onChange={(v) => setInvoiceForm((f) => ({ ...f, school_id: v }))}
              options={schools.map((s) => ({
                value: String(s.id),
                label: s.name,
              }))}
            />
          </FormField>
          <FormField label="Amount">
            <FormInput
              type="number"
              value={invoiceForm.amount}
              onValueChange={(v) => setInvoiceForm((f) => ({ ...f, amount: v }))}
            />
          </FormField>
          <FormField label="Description">
            <FormInput
              value={invoiceForm.description}
              onValueChange={(v) =>
                setInvoiceForm((f) => ({ ...f, description: v }))
              }
            />
          </FormField>
        </div>
      </SideSheet>

      {/* Notification form */}
      <SideSheet
        isOpen={notifSheet.isOpen}
        onOpenChange={notifSheet.onOpenChange}
        title="Send notification"
        footer={(onClose) => (
          <>
            <FormButton appearance="light" onPress={onClose}>
              Cancel
            </FormButton>
            <FormButton
              isLoading={notifMut.isPending}
              onPress={() => notifMut.mutate({ ...notifForm, status: 'sent' })}
            >
              Send
            </FormButton>
          </>
        )}
      >
        <div className="flex flex-col gap-3">
          <FormField label="Title">
            <FormInput
              value={notifForm.title}
              onValueChange={(v) => setNotifForm((f) => ({ ...f, title: v }))}
            />
          </FormField>
          <FormField label="Body">
            <FormTextarea
              value={notifForm.body}
              onValueChange={(v) => setNotifForm((f) => ({ ...f, body: v }))}
            />
          </FormField>
          <FormField label="Channel">
            <FormSelect
              label="Channel"
              value={notifForm.channel}
              onChange={(v) => setNotifForm((f) => ({ ...f, channel: v }))}
              options={[
                { value: 'system', label: 'System' },
                { value: 'email', label: 'Email' },
                { value: 'sms', label: 'SMS' },
              ]}
            />
          </FormField>
          <FormField label="Audience">
            <FormSelect
              label="Audience"
              value={notifForm.audience}
              onChange={(v) => setNotifForm((f) => ({ ...f, audience: v }))}
              options={[
                { value: 'all', label: 'All' },
                { value: 'super_admin', label: 'Super admins' },
                { value: 'school', label: 'Schools' },
              ]}
            />
          </FormField>
        </div>
      </SideSheet>

      {/* Plan form — create / edit */}
      <SideSheet
        isOpen={planSheet.isOpen}
        onOpenChange={planSheet.onOpenChange}
        title={planForm.id ? 'Edit subscription plan' : 'New subscription plan'}
        size="lg"
        footer={(onClose) => (
          <>
            <FormButton appearance="light" onPress={onClose}>
              Cancel
            </FormButton>
            <FormButton
              isLoading={createPlanMut.isPending || updatePlanMut.isPending}
              onPress={savePlan}
            >
              {planForm.id ? 'Save changes' : 'Create plan'}
            </FormButton>
          </>
        )}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Name" required className="sm:col-span-2">
            <FormInput
              value={planForm.name}
              onValueChange={(v) => setPlanForm((f) => ({ ...f, name: v }))}
            />
          </FormField>
          <FormField label="Code">
            <FormInput
              placeholder="auto from name if empty"
              value={planForm.code}
              onValueChange={(v) => setPlanForm((f) => ({ ...f, code: v }))}
            />
          </FormField>
          <FormField label="Billing cycle">
            <FormSelect
              label="Billing cycle"
              value={planForm.billing_cycle}
              onChange={(v) =>
                setPlanForm((f) => ({ ...f, billing_cycle: v }))
              }
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'annual', label: 'Annual' },
              ]}
            />
          </FormField>
          <FormField label="Price" required>
            <FormInput
              type="number"
              value={planForm.price}
              onValueChange={(v) => setPlanForm((f) => ({ ...f, price: v }))}
            />
          </FormField>
          <FormField label="Currency">
            <FormInput
              value={planForm.currency}
              onValueChange={(v) => setPlanForm((f) => ({ ...f, currency: v }))}
            />
          </FormField>
          <FormField label="Trial days">
            <FormInput
              type="number"
              value={planForm.trial_days}
              onValueChange={(v) =>
                setPlanForm((f) => ({ ...f, trial_days: v }))
              }
            />
          </FormField>
          <FormField label="Max students">
            <FormInput
              type="number"
              placeholder="Unlimited if empty"
              value={planForm.max_students}
              onValueChange={(v) =>
                setPlanForm((f) => ({ ...f, max_students: v }))
              }
            />
          </FormField>
          <FormField label="Max staff">
            <FormInput
              type="number"
              placeholder="Unlimited if empty"
              value={planForm.max_staff}
              onValueChange={(v) =>
                setPlanForm((f) => ({ ...f, max_staff: v }))
              }
            />
          </FormField>
          <FormField label="Features" className="sm:col-span-2">
            <FormInput
              placeholder="students, fees, exams (comma-separated)"
              value={planForm.features}
              onValueChange={(v) => setPlanForm((f) => ({ ...f, features: v }))}
            />
          </FormField>
          <FormField label="Status" className="sm:col-span-2">
            <FormSelect
              label="Status"
              value={planForm.is_active ? 'active' : 'inactive'}
              onChange={(v) =>
                setPlanForm((f) => ({ ...f, is_active: v === 'active' }))
              }
              options={[
                { value: 'active', label: 'Active (available for sale)' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </FormField>
        </div>
      </SideSheet>
    </DashboardLayout>
  )
}

export default PlatformConsole
