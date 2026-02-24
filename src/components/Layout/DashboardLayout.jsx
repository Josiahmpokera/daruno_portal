import { Button, Input, Avatar } from '@heroui/react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  BookOpen,
  BarChart3,
  Settings,
  Plus,
  Banknote,
  GraduationCap,
} from 'lucide-react'
import logo from '../../assets/logo/daruno_red.png'

const navItems = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
  { key: 'students', label: 'Students', icon: Users, path: '/students' },
  { key: 'teachers', label: 'Teachers', icon: UserCheck, path: '/teachers' },
  { key: 'classes', label: 'Classes', icon: BookOpen, path: '/classes' },
  { key: 'academic', label: 'Academic', icon: GraduationCap, path: '/academic' },
  { key: 'finance', label: 'Finance', icon: Banknote, path: '/finance' },
  { key: 'reports', label: 'Reports', icon: BarChart3, path: '/reports' },
  { key: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
]

function DashboardLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()

  const { data: session } = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: async () => null,
    initialData: null,
    enabled: false,
  })

  const user = session?.user || null
  const displayName = user?.name || user?.email || 'Admin'

  const currentPath = location.pathname
  const activeItem = navItems.find((item) => item.path === currentPath)?.key || 
                     (currentPath === '/dashboard' ? 'overview' : '')

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex h-screen flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center border-b border-slate-200 bg-white px-4 shadow-sm">
          <div className="flex min-w-[240px] items-center gap-2">
            <img
              src={logo}
              alt="Daruno logo"
              className="h-8 w-auto"
            />
          </div>

          <div className="mx-4 hidden flex-1 max-w-xl items-center md:flex">
            <Input
              radius="full"
              size="sm"
              variant="bordered"
              placeholder="Search classes, students, teachers..."
              classNames={{
                base: 'w-full',
                inputWrapper: 'bg-slate-50 border-slate-200 group-data-[focus=true]:border-[#d41f1f]',
              }}
            />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <Button
              color="primary"
              size="sm"
              className="hidden md:inline-flex bg-[#d41f1f] font-medium"
              onPress={() => navigate('/settings')}
            >
              New
            </Button>
            <Avatar
              name={displayName}
              className="h-9 w-9 text-sm bg-[#d41f1f] text-white"
            />
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <aside className="hidden w-20 flex-col items-center bg-[#111827] text-slate-100 md:flex py-4">
            <div className="flex flex-1 flex-col items-center gap-6">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = activeItem === item.key
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      navigate(item.path)
                    }}
                    className={`flex flex-col items-center gap-1 text-xs transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 hover:text-slate-100'
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm ${
                        isActive
                          ? 'border-[#d41f1f] bg-[#d41f1f]/20'
                          : 'border-slate-600 bg-[#111827]'
                      }`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <span className="max-w-[4rem] text-center leading-tight">{item.label}</span>
                  </button>
                )
              })}
            </div>
            <div className="mt-8 flex flex-col items-center gap-2 text-xs text-slate-400">
              <button
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-600"
              >
                <span className="text-base leading-none">…</span>
              </button>
              <span>More</span>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-slate-50 p-2 sm:p-3">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
