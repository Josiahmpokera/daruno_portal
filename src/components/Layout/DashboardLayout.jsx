import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
} from '@heroui/react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '../../auth'
import { getSsoApps } from '../../api/auth.js'
import {
  LayoutDashboard,
  LayoutGrid,
  ExternalLink,
  Users,
  Banknote,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  School,
  ClipboardCheck,
  Package,
  MessageSquare,
  Settings2,
  FileText,
  Folder,
  User,
  LogOut,
  UserCircle,
  Settings,
  HelpCircle,
  UserPlus,
  Calendar,
  BookOpen,
  ClipboardList,
  BarChart3,
  CreditCard,
  Receipt,
  Bus,
  Library,
  BedDouble,
  Bell,
  Trophy,
  FileStack,
  Shield,
  Wrench,
  List,
  Hash,
  IdCard,
  HeartPulse,
  ArrowLeftRight,
  Search,
  QrCode,
  Layers,
  BookMarked,
  Clock,
  NotebookPen,
  Award,
  CircleDot,
} from 'lucide-react'
import ShengenaLogo from '../Brand/ShengenaLogo.jsx'
import {
  primaryNav as schoolPrimaryNav,
  moduleMenus as schoolModuleMenus,
  matchPrimaryKey as matchSchoolPrimaryKey,
  isPathActive,
} from './navConfig'
import {
  superAdminNav,
  superAdminModuleMenus,
  matchSuperAdminKey,
} from '../../config/superAdminNav.js'
import { POPOVER_MOTION } from '../motion.js'

const iconMap = {
  overview: LayoutDashboard,
  school: School,
  people: Users,
  staff: IdCard,
  learning: GraduationCap,
  academic: BookOpen,
  assessment: ClipboardCheck,
  money: Banknote,
  operations: Package,
  community: MessageSquare,
  system: Settings2,
  platform: Package,
  reports: BarChart3,
  settings: Settings2,
}

/** Compact secondary panel width (px) */
const PANEL_WIDTH = 224
const PANEL_COLLAPSED_WIDTH = 28
const PANEL_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'

const FALLBACK_ICONS = [
  FileText,
  List,
  CircleDot,
  BookOpen,
  ClipboardList,
  Layers,
  Hash,
  Calendar,
]

/** Pick a distinct icon from the item label (not the same icon for every row). */
function iconForLabel(label = '', isGroup = false) {
  const t = String(label).toLowerCase()

  if (isGroup) {
    if (t.includes('admission')) return UserPlus
    if (t.includes('subject')) return BookOpen
    if (t.includes('role')) return Shield
    if (t.includes('result') || t.includes('assess')) return ClipboardList
    if (t.includes('student')) return Users
    if (t.includes('record') || t.includes('lifecycle')) return FileStack
    return Folder
  }

  if (t.includes('overview') || t.includes('all ')) return LayoutDashboard
  if (t.includes('registration') || t.includes('register')) return UserPlus
  if (t.includes('admission')) return IdCard
  if (t.includes('profile')) return User
  if (t.includes('parent') || t.includes('guardian')) return Users
  if (t.includes('medical') || t.includes('health')) return HeartPulse
  if (t.includes('transfer')) return ArrowLeftRight
  if (t.includes('search')) return Search
  if (t.includes('qr') || t.includes('barcode') || t.includes('id card')) return QrCode
  if (t.includes('document') || t.includes('certificate')) return FileStack
  if (t.includes('year') || t.includes('term') || t.includes('semester')) return Calendar
  if (t.includes('class') || t.includes('stream') || t.includes('level')) return School
  if (t.includes('subject') || t.includes('curriculum')) return BookOpen
  if (t.includes('grading') || t.includes('grade')) return Award
  if (t.includes('timetable') || t.includes('schedule')) return Clock
  if (t.includes('homework') || t.includes('assignment')) return NotebookPen
  if (t.includes('resource') || t.includes('lesson') || t.includes('note')) return BookMarked
  if (t.includes('attendance') || t.includes('daily') || t.includes('session')) return ClipboardCheck
  if (t.includes('exam') || t.includes('mark') || t.includes('score')) return ClipboardList
  if (t.includes('report') || t.includes('analytics') || t.includes('dashboard')) return BarChart3
  if (t.includes('fee') || t.includes('invoice') || t.includes('payment') || t.includes('billing')) return CreditCard
  if (t.includes('receipt') || t.includes('refund') || t.includes('outstanding')) return Receipt
  if (t.includes('account') || t.includes('ledger') || t.includes('budget')) return Banknote
  if (t.includes('inventory') || t.includes('stock') || t.includes('asset') || t.includes('supplier')) return Package
  if (t.includes('library') || t.includes('book') || t.includes('borrow') || t.includes('isbn')) return Library
  if (t.includes('transport') || t.includes('vehicle') || t.includes('driver') || t.includes('route')) return Bus
  if (t.includes('hostel') || t.includes('room') || t.includes('bed')) return BedDouble
  if (t.includes('message') || t.includes('sms') || t.includes('email') || t.includes('announcement') || t.includes('notification')) return Bell
  if (t.includes('event') || t.includes('calendar') || t.includes('holiday') || t.includes('meeting')) return Calendar
  if (t.includes('sport') || t.includes('team') || t.includes('club') || t.includes('fixture')) return Trophy
  if (t.includes('user') || t.includes('permission') || t.includes('login') || t.includes('password') || t.includes('2fa')) return Users
  if (t.includes('compliance') || t.includes('necta') || t.includes('ministry') || t.includes('census')) return Shield
  if (t.includes('admin') || t.includes('setting') || t.includes('webhook') || t.includes('backup') || t.includes('api')) return Wrench
  if (t.includes('status') || t.includes('promotion') || t.includes('graduation') || t.includes('alumni')) return Layers
  if (t.includes('number')) return Hash

  // Stable variety by label hash so rows still differ when no keyword matches
  let hash = 0
  for (let i = 0; i < t.length; i += 1) hash = (hash + t.charCodeAt(i) * (i + 1)) % FALLBACK_ICONS.length
  return FALLBACK_ICONS[hash]
}

function itemMatchesPath(item, pathname, search) {
  if (item.type === 'group') {
    return item.children?.some((child) =>
      isPathActive(pathname, search, child.path),
    )
  }
  return isPathActive(pathname, search, item.path)
}

function categoryMatchesPath(category, pathname, search) {
  return category.items?.some((item) => itemMatchesPath(item, pathname, search))
}

/** Leaf / nested link styles — regular weight, darker text */
function linkClass(active) {
  return `flex min-h-[34px] w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left text-[14px] font-normal leading-5 text-[var(--sh-ink)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sh-brand)]/40 ${
    active ? 'bg-[var(--sh-selected)] font-medium' : 'hover:bg-[var(--sh-hover)]'
  }`
}

function itemVisibleForStages(item, schoolStages) {
  const required = item?.requiresAnyStage
  if (!required?.length) return true
  // Empty stages = not loaded yet → show to avoid flicker; after load, filter strictly
  if (!schoolStages?.length) return true
  return required.some((s) => schoolStages.includes(s))
}

/** Nested feature list — indented with varied icons (category titles stay left, no icons) */
function FeatureItems({ items, openKeys, toggleKey, onNavigate, keyPrefix }) {
  const location = useLocation()
  const { school, session } = useAuth()
  const schoolStages =
    school?.education_stages ||
    session?.school?.education_stages ||
    session?.user?.school?.education_stages ||
    []

  return (
    <div className="space-y-px py-0.5 pb-1">
      {items.map((item, index) => {
        const itemKey = `${keyPrefix}-item-${index}`

        if (item.type === 'group') {
          const visibleChildren = (item.children || []).filter((child) =>
            itemVisibleForStages(child, schoolStages),
          )
          if (!visibleChildren.length && item.children?.length) {
            // Entire group only had stage-gated children — still show group if it had other structure
          }
          const isOpen = openKeys[itemKey] === true
          const groupActive = itemMatchesPath(
            { ...item, children: visibleChildren },
            location.pathname,
            location.search,
          )
          const GroupIcon = iconForLabel(item.label, true)

          return (
            <div key={itemKey}>
              <button
                type="button"
                onClick={() => toggleKey(itemKey)}
                className={`flex min-h-[34px] w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left text-[14px] leading-5 text-[var(--sh-ink)] transition-colors hover:bg-[var(--sh-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sh-brand)]/40 ${
                  groupActive ? 'font-medium' : 'font-normal'
                }`}
              >
                <GroupIcon
                  className={`h-4 w-4 shrink-0 ${
                    groupActive ? 'text-[var(--sh-ink)]' : 'text-[var(--sh-text)]'
                  }`}
                  strokeWidth={1.75}
                />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform duration-200 ${
                    isOpen ? 'rotate-0' : '-rotate-90'
                  }`}
                />
              </button>
              <div
                className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                  isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="ml-4 space-y-px border-l border-[var(--sh-rule)] pl-2">
                    {visibleChildren.map((child) => {
                      const active = isPathActive(
                        location.pathname,
                        location.search,
                        child.path,
                      )
                      const ChildIcon = iconForLabel(child.label, false)
                      return (
                        <button
                          key={child.path}
                          type="button"
                          onClick={() => onNavigate(child.path)}
                          className={linkClass(active)}
                        >
                          <ChildIcon
                            className={`h-4 w-4 shrink-0 ${
                              active ? 'text-[var(--sh-ink)]' : 'text-[var(--sh-text)]'
                            }`}
                            strokeWidth={1.75}
                          />
                          <span className="min-w-0 truncate">{child.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )
        }

        if (!itemVisibleForStages(item, schoolStages)) {
          return null
        }

        const active = isPathActive(
          location.pathname,
          location.search,
          item.path,
        )
        const ItemIcon = iconForLabel(item.label, false)
        return (
          <button
            key={item.path}
            type="button"
            onClick={() => onNavigate(item.path)}
            className={linkClass(active)}
          >
            <ItemIcon
              className={`h-4 w-4 shrink-0 ${
                active ? 'text-[var(--sh-ink)]' : 'text-[var(--sh-text)]'
              }`}
              strokeWidth={1.75}
            />
            <span className="min-w-0 truncate">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/**
 * White sidebar categories:
 * - Title (not a dropdown)
 * - Horizontal line BELOW the title
 * - Items always visible: plain links + only nested groups as dropdowns
 */
function ModulePanel({ moduleKey, onNavigate, menus }) {
  const location = useLocation()
  const menu = menus?.[moduleKey]
  const [openKeys, setOpenKeys] = useState({})

  // Open only the route-matching dropdown (or the first group) — one at a time
  useEffect(() => {
    if (!menu?.categories) return
    let firstGroupKey = null
    let matchedKey = null

    menu.categories.forEach((cat, catIndex) => {
      const catKey = `cat-${catIndex}`
      cat.items?.forEach((item, index) => {
        if (item.type !== 'group') return
        const itemKey = `${catKey}-item-${index}`
        if (firstGroupKey === null) firstGroupKey = itemKey
        if (
          !matchedKey &&
          itemMatchesPath(item, location.pathname, location.search)
        ) {
          matchedKey = itemKey
        }
      })
    })

    const openKey = matchedKey || firstGroupKey
    setOpenKeys(openKey ? { [openKey]: true } : {})
  }, [location.pathname, location.search, menu, moduleKey])

  if (!menu) return null

  /** Accordion: open this group and close every other dropdown */
  const toggleKey = (key) => {
    setOpenKeys((prev) => {
      if (prev[key]) {
        return {}
      }
      return { [key]: true }
    })
  }

  const categories = menu.categories || []

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <nav className="flex-1 overflow-y-auto px-2 pb-10 pt-2">
        {categories.map((category, catIndex) => {
          const catKey = `cat-${catIndex}`

          return (
            <div
              key={category.title || catIndex}
              className={catIndex > 0 ? 'mt-2' : ''}
            >
              {/* Category title — left-aligned, no icon; line ABOVE the title */}
              <div>
                {catIndex > 0 && (
                  <div
                    className="mb-2 h-px w-full bg-[var(--sh-rule)]"
                    role="separator"
                  />
                )}
                <p className="mb-1 px-2 text-[12px] font-medium text-[var(--sh-muted)]">
                  {category.title}
                </p>
              </div>

              {/* Items always visible; only nested groups are dropdowns */}
              <FeatureItems
                items={category.items || []}
                openKeys={openKeys}
                toggleKey={toggleKey}
                onNavigate={onNavigate}
                keyPrefix={catKey}
              />
            </div>
          )
        })}
      </nav>
    </div>
  )
}

/**
 * Drop menu links the role cannot read, then empty groups / categories / hubs.
 * A hub whose landing page is off-limits points at its first allowed link.
 */
function filterSchoolNav(primaryNav, moduleMenus, canPath) {
  const allowed = (path) => !path || canPath(path)
  const menus = {}

  Object.entries(moduleMenus).forEach(([key, menu]) => {
    const categories = (menu.categories || [])
      .map((cat) => ({
        ...cat,
        items: (cat.items || [])
          .map((item) =>
            item.type === 'group'
              ? { ...item, children: (item.children || []).filter((c) => allowed(c.path)) }
              : item,
          )
          .filter((item) =>
            item.type === 'group' ? item.children.length > 0 : allowed(item.path),
          ),
      }))
      .filter((cat) => cat.items.length > 0)
    if (categories.length) menus[key] = { ...menu, categories }
  })

  const firstPath = (menu) => {
    for (const cat of menu?.categories || []) {
      for (const item of cat.items) {
        if (item.type === 'group') return item.children[0]?.path
        if (item.path) return item.path
      }
    }
    return null
  }

  const nav = primaryNav
    .map((item) => {
      if (item.key === 'overview') return item
      const menu = menus[item.key]
      if (canPath(item.path)) return item
      const fallback = firstPath(menu)
      return fallback ? { ...item, path: fallback } : null
    })
    .filter(Boolean)

  return { primaryNav: nav, moduleMenus: menus }
}

function DashboardLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [panelWidth, setPanelWidth] = useState(0)
  const [contentReady, setContentReady] = useState(false)
  const [animatePanel, setAnimatePanel] = useState(false)
  const closeTimerRef = useRef(0)

  const {
    session,
    user,
    isPlatform,
    logout: authLogout,
    isHydrating,
    canPath,
  } = useAuth()

  // Never fall back to a generic "Admin" label — that confuses school users
  // with the platform owner after a refresh.
  const displayName =
    user?.name?.trim() ||
    user?.email?.trim() ||
    (isHydrating ? 'Loading…' : 'Signed-in user')
  /** Single character for the header avatar (not multi-initials) */
  const avatarLetter = (() => {
    const raw = (user?.name?.trim() || user?.email?.trim() || '').trim()
    if (!raw) return isHydrating ? '…' : '?'
    const match = raw.match(/[A-Za-z0-9]/)
    return (match ? match[0] : raw.charAt(0)).toUpperCase()
  })()
  const displayEmail = user?.email || ''
  const schoolName = user?.school?.name || session?.school?.name || ''
  const roleLabel =
    user?.role?.label ||
    (user?.role?.name ? String(user.role.name).replace(/_/g, ' ') : '') ||
    ''
  const isSuperAdmin = isPlatform

  // School users only see hubs / links their role can open (RBAC from /me).
  const { primaryNav, moduleMenus } = useMemo(() => {
    if (isSuperAdmin) {
      return { primaryNav: superAdminNav, moduleMenus: superAdminModuleMenus }
    }
    return filterSchoolNav(schoolPrimaryNav, schoolModuleMenus, canPath)
  }, [isSuperAdmin, canPath])

  // Other Shengena systems this person may open (from Sign in with Shengena).
  const [ssoApps] = useState(getSsoApps)
  // Signed in with Shengena and allowed into ERP or HR: the logo goes back to the Shengena
  // desk, where every system this person has is a tile (ERP and HR share that desk).
  const [deskUrl] = useState(() => {
    const app = ssoApps.find((a) => a.key === 'erp') || ssoApps.find((a) => a.key === 'hr')
    return app ? new URL(app.url).origin + '/desk' : ''
  })

  const logoutMutation = useMutation({
    mutationFn: () => authLogout(),
    onSettled: () => {
      navigate('/login', { replace: true })
    },
  })

  const activeKey = useMemo(
    () =>
      isSuperAdmin
        ? matchSuperAdminKey(location.pathname)
        : matchSchoolPrimaryKey(location.pathname),
    [location.pathname, isSuperAdmin],
  )

  const activePrimary = primaryNav.find((item) => item.key === activeKey)
  const panelAvailable = Boolean(activePrimary?.hasPanel)
  const panelCollapsed = panelAvailable && panelWidth === PANEL_COLLAPSED_WIDTH
  const panelOpen = panelAvailable && panelWidth === PANEL_WIDTH

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = 0
    }
  }

  const openPanelInstant = () => {
    clearCloseTimer()
    setAnimatePanel(false)
    setPanelWidth(PANEL_WIDTH)
    setContentReady(true)
  }

  const closePanelAnimated = () => {
    clearCloseTimer()
    setContentReady(false)
    setAnimatePanel(true)
    setPanelWidth(0)
    closeTimerRef.current = window.setTimeout(() => {
      setAnimatePanel(false)
      closeTimerRef.current = 0
    }, 340)
  }

  const collapsePanelInstant = () => {
    clearCloseTimer()
    setAnimatePanel(false)
    setContentReady(false)
    setPanelWidth(PANEL_COLLAPSED_WIDTH)
  }

  useEffect(() => {
    if (panelAvailable) {
      openPanelInstant()
    } else if (activeKey === 'overview') {
      if (panelWidth !== 0 && !animatePanel) {
        setPanelWidth(0)
        setContentReady(false)
      }
    }
    return clearCloseTimer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, panelAvailable])

  const handlePrimaryClick = (item) => {
    if (item.key === 'overview') {
      closePanelAnimated()
      navigate(item.path)
      return
    }
    openPanelInstant()
    navigate(item.path)
  }

  // Super admin: keep module panel open for Platform / Reports / Settings routes
  useEffect(() => {
    if (!isSuperAdmin) return
    if (
      activeKey === 'platform' ||
      activeKey === 'reports' ||
      activeKey === 'settings'
    ) {
      openPanelInstant()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin, location.pathname, activeKey])

  const handleModuleNavigate = (path) => {
    navigate(path)
  }

  const showBorder = panelWidth > 0

  // The logo: back to the Shengena desk when this person has one, else this portal's home
  const goHome = () => {
    if (deskUrl) {
      window.location.assign(deskUrl)
      return
    }
    closePanelAnimated()
    navigate(isSuperAdmin ? '/platform' : '/dashboard')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white text-[var(--sh-text)]">
      {/* ── Module rail: full height from top, logo here ── */}
      <aside className="hidden w-[81px] shrink-0 flex-col bg-[var(--sh-dock)] text-white md:flex">
        <div className="flex h-[60px] shrink-0 items-center justify-center px-2">
          <button
            type="button"
            onClick={goHome}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md bg-white p-1.5 transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            title={deskUrl ? 'Shengena desk' : 'Shengena home'}
            aria-label={deskUrl ? 'Shengena desk' : 'Shengena home'}
          >
            <ShengenaLogo
              variant="icon"
              iconClassName="h-full w-full object-contain"
            />
          </button>
        </div>

        <nav
          className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-1.5 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Main navigation"
        >
          {primaryNav.map((item) => {
            const Icon = iconMap[item.key] || LayoutDashboard
            const isActive = activeKey === item.key
            return (
              <button
                key={item.key}
                type="button"
                title={item.label}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => handlePrimaryClick(item)}
                className={`flex min-h-[58px] w-full shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                  isActive
                    ? 'bg-white/[0.14] text-white'
                    : 'text-white/[0.68] hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                <Icon className="h-[22px] w-[22px] shrink-0" strokeWidth={1.5} />
                <span
                  className={`w-full truncate text-center text-[11px] leading-tight ${
                    isActive ? 'font-semibold' : 'font-normal'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* ── White children panel: full height from top ── */}
      <aside
        className={`relative hidden shrink-0 overflow-hidden border-[var(--sh-rule)] bg-white md:block ${
          showBorder ? 'border-r' : 'border-r-0'
        }`}
        style={{
          width: panelWidth,
          transition: animatePanel ? `width 320ms ${PANEL_EASE}` : 'none',
        }}
        aria-hidden={!panelOpen && !panelCollapsed}
      >
        <div
          className="relative flex h-full flex-col bg-white"
          style={{ width: PANEL_WIDTH }}
        >
          <div
            className="absolute inset-y-0 left-0 flex h-full flex-col bg-white"
            style={{
              width: PANEL_WIDTH,
              opacity: panelOpen && contentReady ? 1 : 0,
              pointerEvents: panelOpen && contentReady ? 'auto' : 'none',
            }}
          >
            {/* Top bar aligned with logo / main header height */}
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--sh-rule)] pl-4 pr-3">
              <span className="truncate text-[15px] font-semibold text-[var(--sh-ink)]">
                {activePrimary?.label && activePrimary.key !== 'overview'
                  ? activePrimary.label
                  : 'Menu'}
              </span>
              <button
                type="button"
                onClick={collapsePanelInstant}
                className="inline-flex cursor-pointer items-center gap-1 rounded px-1.5 py-1 text-[var(--sh-text)] transition-colors hover:bg-[var(--sh-hover)] hover:text-[var(--sh-ink)]"
                title="Collapse menu"
                aria-label="Collapse menu"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>
            {panelAvailable && (
              <ModulePanel
                moduleKey={activeKey}
                onNavigate={handleModuleNavigate}
                menus={moduleMenus}
              />
            )}
          </div>

          <button
            type="button"
            onClick={openPanelInstant}
            className="absolute inset-y-0 left-0 flex cursor-pointer items-center justify-center bg-white text-zinc-500 transition-colors hover:text-zinc-900"
            style={{
              width: PANEL_COLLAPSED_WIDTH,
              opacity: panelCollapsed ? 1 : 0,
              pointerEvents: panelCollapsed ? 'auto' : 'none',
            }}
            title="Open menu"
            tabIndex={panelCollapsed ? 0 : -1}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* ── Main column: header starts after sidebars ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--sh-rule)] bg-white px-4 sm:px-6">
          <button
            type="button"
            onClick={goHome}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md md:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sh-brand)]/40"
            title={deskUrl ? 'Shengena desk' : 'Shengena home'}
            aria-label={deskUrl ? 'Shengena desk' : 'Shengena home'}
          >
            <ShengenaLogo variant="icon" iconClassName="h-7 w-7 object-contain" />
          </button>

          <label className="hidden h-[38px] w-full max-w-[330px] items-center gap-2 rounded-md border border-[var(--sh-stroke)] bg-white pl-3 pr-2 text-[14px] text-[var(--sh-muted)] transition-colors focus-within:border-[var(--sh-brand)] hover:border-[#c7c7c7] md:flex">
            <Search className="h-4 w-4 shrink-0" aria-hidden />
            <span className="sr-only">Search</span>
            <input
              type="search"
              placeholder="Search classes, students, teachers…"
              className="min-w-0 flex-1 bg-transparent text-[var(--sh-ink)] outline-none placeholder:text-[var(--sh-muted)]"
            />
          </label>

          <div className="ml-auto flex items-center gap-2">

            {ssoApps.length > 0 ? (
              <Dropdown placement="bottom-end" motionProps={POPOVER_MOTION}>
                <DropdownTrigger>
                  <button
                    type="button"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-[var(--sh-text)] transition-colors hover:bg-[var(--sh-hover)] hover:text-[var(--sh-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sh-brand)]/40"
                    aria-label="Shengena apps"
                    title="Shengena apps"
                  >
                    <LayoutGrid className="h-[18px] w-[18px]" />
                  </button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Shengena apps"
                  variant="flat"
                  className="min-w-[220px]"
                  onAction={(key) => {
                    const app = ssoApps.find((a) => a.key === key)
                    if (app) window.open(app.url, '_blank', 'noopener')
                  }}
                >
                  <DropdownSection title="Shengena apps" showDivider>
                    <DropdownItem
                      key="current"
                      isReadOnly
                      className="cursor-default opacity-100"
                      startContent={<School className="h-4 w-4 text-[#12544f]" />}
                      textValue="School management"
                    >
                      <span className="text-[13px] font-medium text-zinc-900">School management</span>
                      <span className="ml-2 text-[11px] text-zinc-400">You are here</span>
                    </DropdownItem>
                  </DropdownSection>
                  <DropdownSection>
                    {ssoApps.map((app) => (
                      <DropdownItem
                        key={app.key}
                        textValue={app.name}
                        startContent={<LayoutGrid className="h-4 w-4 text-zinc-500" />}
                        endContent={<ExternalLink className="h-3.5 w-3.5 text-zinc-400" />}
                      >
                        {app.name}
                      </DropdownItem>
                    ))}
                  </DropdownSection>
                </DropdownMenu>
              </Dropdown>
            ) : null}

            <Dropdown placement="bottom-end" motionProps={POPOVER_MOTION}>
              <DropdownTrigger>
                <button
                  type="button"
                  className="flex cursor-pointer items-center gap-2 rounded-md py-1 pl-1 pr-2 transition-colors hover:bg-[var(--sh-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sh-brand)]/40"
                  aria-label="Open profile menu"
                >
                  <Avatar
                    name={displayName}
                    getInitials={() => avatarLetter}
                    showFallback
                    className="h-8 w-8 bg-[#12544f] text-sm font-semibold text-white"
                    classNames={{
                      name: 'text-[13px] font-semibold leading-none',
                    }}
                  />
                  <span
                    className="hidden max-w-[9rem] truncate text-left text-[14px] font-medium text-[var(--sh-ink)] sm:block lg:max-w-[15rem]"
                    title={displayName}
                  >
                    {displayName}
                  </span>
                  <ChevronDown className="hidden h-4 w-4 text-[var(--sh-text)] sm:block" aria-hidden />
                </button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Profile actions"
                variant="flat"
                className="min-w-[220px]"
                onAction={(key) => {
                  if (key === 'profile') navigate('/users')
                  if (key === 'settings') navigate('/admin/settings')
                  if (key === 'school') navigate('/school-profile')
                  if (key === 'help') navigate('/admin')
                  if (key === 'logout') logoutMutation.mutate()
                }}
              >
                <DropdownSection showDivider>
                  <DropdownItem
                    key="user-info"
                    isReadOnly
                    className="cursor-default opacity-100"
                    textValue={displayName}
                  >
                    <div className="flex flex-col gap-0.5 py-0.5">
                      <span className="text-[13px] font-normal text-zinc-900">
                        {displayName}
                      </span>
                      {displayEmail ? (
                        <span className="text-[11px] text-zinc-500">
                          {displayEmail}
                        </span>
                      ) : null}
                      {roleLabel ? (
                        <span className="text-[11px] capitalize text-zinc-400">
                          {roleLabel}
                        </span>
                      ) : null}
                      {schoolName ? (
                        <span className="text-[11px] text-zinc-400">
                          {schoolName}
                        </span>
                      ) : isSuperAdmin ? (
                        <span className="text-[11px] text-zinc-400">
                          Platform console
                        </span>
                      ) : null}
                    </div>
                  </DropdownItem>
                </DropdownSection>
                <DropdownSection showDivider>
                  <DropdownItem
                    key="profile"
                    startContent={<UserCircle className="h-4 w-4 text-zinc-500" />}
                  >
                    My profile
                  </DropdownItem>
                  <DropdownItem
                    key="school"
                    startContent={<School className="h-4 w-4 text-zinc-500" />}
                  >
                    School profile
                  </DropdownItem>
                  <DropdownItem
                    key="settings"
                    startContent={<Settings className="h-4 w-4 text-zinc-500" />}
                  >
                    Settings
                  </DropdownItem>
                  <DropdownItem
                    key="help"
                    startContent={<HelpCircle className="h-4 w-4 text-zinc-500" />}
                  >
                    Help & support
                  </DropdownItem>
                </DropdownSection>
                <DropdownSection>
                  <DropdownItem
                    key="logout"
                    color="primary"
                    className="text-danger"
                    startContent={<LogOut className="h-4 w-4" />}
                  >
                    {logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
                  </DropdownItem>
                </DropdownSection>
              </DropdownMenu>
            </Dropdown>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-white px-4 pb-20 pt-4 sm:px-6 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex overflow-x-auto border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)] [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden"
        aria-label="Main navigation"
      >
        {primaryNav.map((item) => {
          const Icon = iconMap[item.key] || LayoutDashboard
          const isActive = activeKey === item.key
          return (
            <button
              key={item.key}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => handlePrimaryClick(item)}
              className={`relative flex min-w-[4.25rem] flex-1 shrink-0 cursor-pointer flex-col items-center gap-1 px-1 py-2 text-[10px] font-medium ${
                isActive ? 'text-[#12544f]' : 'text-zinc-500'
              }`}
            >
              {isActive && (
                <span
                  className="absolute inset-x-3 top-0 h-0.5 rounded-b-full bg-[#12544f]"
                  aria-hidden="true"
                />
              )}
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={isActive ? 2.25 : 1.75} />
              <span className="max-w-full truncate">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default DashboardLayout
