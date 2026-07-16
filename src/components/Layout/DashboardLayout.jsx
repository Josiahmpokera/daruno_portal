import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Input,
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
import {
  LayoutDashboard,
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
  settings: Settings2,
}

/** Compact secondary panel width (px) */
const PANEL_WIDTH = 196
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
  return `flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] font-normal leading-5 transition-colors ${
    active
      ? 'bg-[#0B3D2E]/[0.08] text-[#072A20]'
      : 'text-zinc-800 hover:bg-zinc-100 hover:text-zinc-950'
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
    <div className="space-y-0.5 py-0.5 pb-1 pl-3">
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
                className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] font-normal leading-5 transition-colors ${
                  groupActive
                    ? 'text-zinc-950'
                    : 'text-zinc-800 hover:bg-zinc-100 hover:text-zinc-950'
                }`}
              >
                <GroupIcon
                  className={`h-3.5 w-3.5 shrink-0 ${
                    groupActive ? 'text-zinc-700' : 'text-zinc-400'
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
                  <div className="ml-3 space-y-0.5 border-l border-zinc-200 pl-2">
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
                            className={`h-3.5 w-3.5 shrink-0 ${
                              active ? 'text-[#072A20]' : 'text-zinc-400'
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
              className={`h-3.5 w-3.5 shrink-0 ${
                active ? 'text-[#072A20]' : 'text-zinc-400'
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
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {categories.map((category, catIndex) => {
          const catKey = `cat-${catIndex}`

          return (
            <div
              key={category.title || catIndex}
              className={catIndex > 0 ? 'mt-2' : ''}
            >
              {/* Category title — left-aligned, no icon; line ABOVE the title */}
              <div className="px-2">
                {catIndex > 0 && (
                  <div
                    className="mb-1.5 h-px w-full bg-zinc-200"
                    role="separator"
                  />
                )}
                <p className="mb-1 text-[11px] font-normal uppercase tracking-[0.06em] text-zinc-500">
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

function formatRunningTime(date) {
  return date.toLocaleString(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function DashboardLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [panelWidth, setPanelWidth] = useState(0)
  const [contentReady, setContentReady] = useState(false)
  const [animatePanel, setAnimatePanel] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const closeTimerRef = useRef(0)

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const {
    session,
    user,
    isPlatform,
    logout: authLogout,
    isHydrating,
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

  const primaryNav = isSuperAdmin ? superAdminNav : schoolPrimaryNav
  const moduleMenus = isSuperAdmin ? superAdminModuleMenus : schoolModuleMenus

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

  // Super admin: keep module panel open for Platform / Settings routes
  useEffect(() => {
    if (!isSuperAdmin) return
    if (activeKey === 'platform' || activeKey === 'settings') {
      openPanelInstant()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin, location.pathname, activeKey])

  const handleModuleNavigate = (path) => {
    navigate(path)
  }

  const showBorder = panelWidth > 0

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      {/* ── Module rail: full height from top, logo here ── */}
      <aside className="hidden w-[4.75rem] shrink-0 flex-col bg-[#0f172a] text-white md:flex">
        <div className="flex h-14 shrink-0 items-center justify-center border-b border-white/10 px-2">
          <button
            type="button"
            onClick={() => {
              closePanelAnimated()
              navigate(isSuperAdmin ? '/platform' : '/dashboard')
            }}
            className="flex cursor-pointer items-center justify-center"
            title="Shengena home"
          >
            <ShengenaLogo
              variant="icon"
              iconClassName="h-8 w-8 object-contain"
            />
          </button>
        </div>

        <nav className="flex flex-1 flex-col items-center gap-3 px-1 pt-4">
          {primaryNav.map((item) => {
            const Icon = iconMap[item.key] || LayoutDashboard
            const isActive = activeKey === item.key
            return (
              <button
                key={item.key}
                type="button"
                title={item.label}
                onClick={() => handlePrimaryClick(item)}
                className={`flex w-full cursor-pointer flex-col items-center gap-1 px-0.5 transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'text-white/55 hover:text-white'
                }`}
              >
                <Icon
                  className="h-[18px] w-[18px]"
                  strokeWidth={isActive ? 2.25 : 1.75}
                />
                <span className="max-w-[4.25rem] text-center text-[9px] font-normal leading-tight">
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* ── White children panel: full height from top ── */}
      <aside
        className={`relative hidden shrink-0 overflow-hidden border-zinc-200 bg-white md:block ${
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
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 px-3">
              <span className="truncate text-[13px] font-normal text-zinc-900">
                {activePrimary?.label && activePrimary.key !== 'overview'
                  ? activePrimary.label
                  : 'Menu'}
              </span>
              <button
                type="button"
                onClick={collapsePanelInstant}
                className="inline-flex cursor-pointer items-center gap-1 rounded px-1.5 py-1 text-[11px] font-normal text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
                title="Collapse menu"
              >
                <PanelLeftClose className="h-3.5 w-3.5" />
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
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-zinc-200 bg-white px-4">
          <div className="hidden max-w-xl flex-1 items-center md:flex">
            <Input
              radius="md"
              size="sm"
              variant="bordered"
              placeholder="Search classes, students, teachers..."
              classNames={{
                base: 'w-full',
                inputWrapper:
                  'bg-zinc-50 border-zinc-200 rounded-md group-data-[focus=true]:border-[#0B3D2E]',
              }}
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div
              className="hidden items-center sm:flex"
              title="Current date and time"
            >
              <time
                dateTime={now.toISOString()}
                className="tabular-nums text-[12px] font-medium tracking-tight text-zinc-600"
              >
                {formatRunningTime(now)}
              </time>
            </div>

            <div className="hidden h-5 w-px bg-zinc-200 sm:block" aria-hidden />

            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <button
                  type="button"
                  className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B3D2E]/30"
                  aria-label="Open profile menu"
                >
                  <Avatar
                    name={displayName}
                    getInitials={() => avatarLetter}
                    showFallback
                    className="h-8 w-8 bg-[#0B3D2E] text-sm font-semibold text-white"
                    classNames={{
                      name: 'text-[13px] font-semibold leading-none',
                    }}
                  />
                  <span className="hidden max-w-[9rem] truncate text-left text-[12px] font-normal text-zinc-800 sm:block">
                    {displayName}
                  </span>
                  <ChevronDown className="hidden h-3.5 w-3.5 text-zinc-400 sm:block" />
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

        <main className="flex-1 overflow-y-auto bg-zinc-50 p-3 pb-20 sm:p-4 md:pb-4">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-zinc-200 bg-white md:hidden">
        {primaryNav.map((item) => {
          const Icon = iconMap[item.key] || LayoutDashboard
          const isActive = activeKey === item.key
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handlePrimaryClick(item)}
              className={`flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-0.5 px-0.5 py-2 text-[9px] font-normal ${
                isActive ? 'text-zinc-900' : 'text-zinc-500'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              <span className="truncate">{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default DashboardLayout
