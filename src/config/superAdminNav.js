/**
 * Super Admin SaaS navigation.
 * Left rail: Overview · Platform · Reports · Settings
 */

export const superAdminNav = [
  {
    key: 'overview',
    label: 'Overview',
    path: '/platform',
    hasPanel: false,
  },
  {
    key: 'platform',
    label: 'Platform',
    path: '/platform/schools',
    hasPanel: true,
    prefixes: [
      '/platform/schools',
      '/platform/subscriptions',
      '/platform/users',
      '/platform/roles',
      '/platform/billing',
      '/platform/notifications',
    ],
    categories: [
      {
        title: 'Tenant management',
        items: [
          { type: 'link', label: 'Schools', path: '/platform/schools' },
        ],
      },
      {
        title: 'Subscription management',
        items: [
          { type: 'link', label: 'Subscriptions', path: '/platform/subscriptions' },
          { type: 'link', label: 'Plans', path: '/platform/subscriptions?tab=plans' },
        ],
      },
      {
        title: 'Billing',
        items: [
          { type: 'link', label: 'Invoices', path: '/platform/billing' },
        ],
      },
      {
        title: 'Authentication',
        items: [
          { type: 'link', label: 'Users', path: '/platform/users' },
          { type: 'link', label: 'Roles', path: '/platform/roles' },
        ],
      },
      {
        title: 'Communications',
        items: [
          { type: 'link', label: 'Notifications', path: '/platform/notifications' },
        ],
      },
    ],
  },
  {
    key: 'reports',
    label: 'Reports',
    path: '/platform/reports/growth',
    hasPanel: true,
    prefixes: ['/platform/reports'],
    categories: [
      {
        title: 'Platform insights',
        items: [
          {
            type: 'link',
            label: 'Growth & adoption',
            path: '/platform/reports/growth',
          },
        ],
      },
      {
        title: 'Tenant reports',
        items: [
          { type: 'link', label: 'Schools report', path: '/platform/reports/schools' },
        ],
      },
      {
        title: 'Commercial',
        items: [
          {
            type: 'link',
            label: 'Subscriptions report',
            path: '/platform/reports/subscriptions',
          },
          {
            type: 'link',
            label: 'Revenue & billing',
            path: '/platform/reports/revenue',
          },
        ],
      },
      {
        title: 'Access & security',
        items: [
          { type: 'link', label: 'Users & access', path: '/platform/reports/users' },
          { type: 'link', label: 'Audit activity', path: '/platform/reports/audit' },
        ],
      },
    ],
  },
  {
    key: 'settings',
    label: 'Settings',
    path: '/platform/settings',
    hasPanel: true,
    prefixes: [
      '/platform/settings',
      '/platform/audit-logs',
    ],
    categories: [
      {
        title: 'Configuration',
        items: [
          { type: 'link', label: 'General', path: '/platform/settings' },
          {
            type: 'link',
            label: 'Tanzania Schools',
            path: '/platform/settings/tanzania-schools',
          },
          { type: 'link', label: 'Authentication', path: '/platform/settings/auth' },
          { type: 'link', label: 'Security', path: '/platform/settings/security' },
        ],
      },
      {
        title: 'Operations',
        items: [
          { type: 'link', label: 'Audit Logs', path: '/platform/audit-logs' },
          { type: 'link', label: 'Integrations', path: '/platform/settings/integrations' },
        ],
      },
      {
        title: 'System',
        items: [
          { type: 'link', label: 'Branding', path: '/platform/settings/branding' },
          { type: 'link', label: 'Maintenance', path: '/platform/settings/maintenance' },
        ],
      },
    ],
  },
]

export const superAdminModuleMenus = {
  platform: {
    title: 'Platform',
    categories: superAdminNav.find((n) => n.key === 'platform')?.categories || [],
  },
  reports: {
    title: 'Reports',
    categories: superAdminNav.find((n) => n.key === 'reports')?.categories || [],
  },
  settings: {
    title: 'Settings',
    categories: superAdminNav.find((n) => n.key === 'settings')?.categories || [],
  },
}

export function matchSuperAdminKey(pathname) {
  if (pathname === '/platform' || pathname === '/platform/') return 'overview'

  if (pathname.startsWith('/platform/reports')) {
    return 'reports'
  }

  if (
    pathname.startsWith('/platform/settings') ||
    pathname.startsWith('/platform/audit-logs')
  ) {
    return 'settings'
  }

  if (pathname.startsWith('/platform/')) return 'platform'
  return 'overview'
}

export function isSuperAdminSession(session) {
  if (!session) return false
  if (session.audience === 'platform') return true
  return session?.user?.role?.name === 'super_admin'
}
