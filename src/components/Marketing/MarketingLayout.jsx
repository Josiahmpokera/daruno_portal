import { useMemo } from 'react'
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Button,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from '@heroui/react'
import { useState } from 'react'
import ShengenaLogo from '../Brand/ShengenaLogo.jsx'
import { useAuth } from '../../auth'
import { getPublicSite } from '../../api/domain.js'

const NAV_ITEMS = [
  { key: 'features', label: 'Features', path: '/features' },
  { key: 'pricing', label: 'Pricing', path: '/#pricing', homeHash: 'pricing' },
  { key: 'apply', label: 'Join a school', path: '/apply' },
  { key: 'contact', label: 'Contact', path: '/#contact', homeHash: 'contact' },
  { key: 'support', label: 'Support', path: '/#support', homeHash: 'support' },
]

const PRIMARY = '#0B3D2E'

function isNavActive(item, pathname, hash) {
  if (item.path === '/features') {
    return pathname === '/features' || pathname.startsWith('/features/')
  }
  if (item.homeHash) {
    return pathname === '/' && (hash === `#${item.homeHash}` || (!hash && item.homeHash === 'pricing' && false))
  }
  if (item.path === '/apply') {
    return pathname === '/apply' || pathname.startsWith('/apply/')
  }
  return pathname === item.path
}

/**
 * Shared marketing chrome: primary-coloured nav (active state) + multi-column footer.
 */
export default function MarketingLayout({ children, activeKey = null }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { session, isAuthenticated, isPlatform, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const siteQ = useQuery({
    queryKey: ['public', 'site'],
    queryFn: getPublicSite,
    staleTime: 60_000,
  })
  const site = siteQ.data?.site || {}

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSettled: () => navigate('/login', { replace: true }),
  })

  const navActive = useMemo(() => {
    return (item) => {
      if (activeKey && item.key === activeKey) return true
      return isNavActive(item, location.pathname, location.hash)
    }
  }, [activeKey, location.pathname, location.hash])

  const goNav = (item) => {
    setMenuOpen(false)
    if (item.homeHash) {
      if (location.pathname === '/') {
        document.getElementById(item.homeHash)?.scrollIntoView({ behavior: 'smooth' })
        window.history.replaceState(null, '', `/#${item.homeHash}`)
      } else {
        navigate(`/#${item.homeHash}`)
      }
      return
    }
    navigate(item.path)
  }

  const footerColumns = Array.isArray(site.footer_columns) ? site.footer_columns : []
  const social = site.social || {}
  const appName = site.app_name || 'Shengena'

  return (
    <div className="min-h-screen bg-white font-sans text-zinc-900">
      <Navbar
        maxWidth="xl"
        isMenuOpen={menuOpen}
        onMenuOpenChange={setMenuOpen}
        className="h-16 border-b border-zinc-100 bg-white/95 backdrop-blur-sm"
        isBordered={false}
      >
        <NavbarContent className="sm:hidden" justify="start">
          <NavbarMenuToggle aria-label={menuOpen ? 'Close menu' : 'Open menu'} />
        </NavbarContent>

        <NavbarBrand className="gap-3">
          <button
            type="button"
            className="flex items-center gap-2"
            onClick={() => {
              navigate('/')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            <ShengenaLogo
              variant="full"
              iconClassName="h-8 w-32 object-contain"
              wordClassName="h-7 w-auto object-contain"
            />
          </button>
        </NavbarBrand>

        <NavbarContent className="hidden gap-1 sm:flex" justify="center">
          {NAV_ITEMS.map((item) => {
            const active = navActive(item)
            return (
              <NavbarItem key={item.key} isActive={active}>
                <button
                  type="button"
                  onClick={() => goNav(item)}
                  className={[
                    'rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors',
                    active
                      ? 'bg-[#0B3D2E] text-white shadow-sm'
                      : 'text-[#0B3D2E]/85 hover:bg-[#0B3D2E]/10 hover:text-[#0B3D2E]',
                  ].join(' ')}
                >
                  {item.label}
                </button>
              </NavbarItem>
            )
          })}
        </NavbarContent>

        <NavbarContent justify="end" className="gap-3">
          {isAuthenticated && session?.user ? (
            <>
              <NavbarItem className="hidden md:flex">
                <span className="text-sm font-medium text-zinc-600">
                  {session.user.name || session.user.email}
                </span>
              </NavbarItem>
              <NavbarItem>
                <Button
                  size="sm"
                  variant="flat"
                  radius="full"
                  className="font-medium text-[#0B3D2E]"
                  onPress={() => navigate(isPlatform ? '/platform' : '/dashboard')}
                >
                  Open portal
                </Button>
              </NavbarItem>
              <NavbarItem>
                <Button
                  size="sm"
                  color="primary"
                  variant="solid"
                  radius="full"
                  className="bg-[#0B3D2E] px-5 font-semibold"
                  onPress={() => logoutMutation.mutate()}
                >
                  Sign Out
                </Button>
              </NavbarItem>
            </>
          ) : (
            <>
              <NavbarItem className="hidden sm:flex">
                <Button
                  size="sm"
                  variant="light"
                  className="font-semibold text-[#0B3D2E]"
                  onPress={() => navigate('/login')}
                >
                  Sign In
                </Button>
              </NavbarItem>
              <NavbarItem>
                <Button
                  size="sm"
                  color="primary"
                  variant="solid"
                  radius="full"
                  className="bg-[#0B3D2E] px-5 font-semibold shadow-sm"
                  onPress={() => navigate('/register-school')}
                >
                  Register School
                </Button>
              </NavbarItem>
            </>
          )}
        </NavbarContent>

        <NavbarMenu className="pt-4">
          {NAV_ITEMS.map((item) => {
            const active = navActive(item)
            return (
              <NavbarMenuItem key={item.key}>
                <button
                  type="button"
                  className={[
                    'w-full rounded-lg px-3 py-2.5 text-left text-base font-semibold',
                    active ? 'bg-[#0B3D2E] text-white' : 'text-[#0B3D2E]',
                  ].join(' ')}
                  onClick={() => goNav(item)}
                >
                  {item.label}
                </button>
              </NavbarMenuItem>
            )
          })}
          {!isAuthenticated ? (
            <>
              <NavbarMenuItem>
                <button
                  type="button"
                  className="w-full rounded-lg px-3 py-2.5 text-left text-base font-medium text-zinc-700"
                  onClick={() => {
                    setMenuOpen(false)
                    navigate('/login')
                  }}
                >
                  Sign In
                </button>
              </NavbarMenuItem>
              <NavbarMenuItem>
                <button
                  type="button"
                  className="w-full rounded-lg bg-[#0B3D2E] px-3 py-2.5 text-left text-base font-semibold text-white"
                  onClick={() => {
                    setMenuOpen(false)
                    navigate('/register-school')
                  }}
                >
                  Register School
                </button>
              </NavbarMenuItem>
            </>
          ) : null}
        </NavbarMenu>
      </Navbar>

      <main className="w-full">{children}</main>

      {/* Footer — multi-column, super-admin managed */}
      <footer className="border-t border-[#0B3D2E]/20 bg-[#0B3D2E] text-emerald-50">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="mb-3 brightness-0 invert">
                <ShengenaLogo
                  variant="full"
                  iconClassName="h-8 w-32 object-contain"
                  wordClassName="h-7 w-auto object-contain"
                />
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-emerald-100/80">
                {site.subtitle ||
                  'School management SaaS for Tanzania — academics, fees, and operations in one place.'}
              </p>
              <div className="mt-4 space-y-1 text-sm text-emerald-100/90">
                {site.support_email ? (
                  <p>
                    <a
                      href={`mailto:${site.support_email}`}
                      className="font-medium text-white hover:underline"
                    >
                      {site.support_email}
                    </a>
                  </p>
                ) : null}
                {site.phone ? <p>{site.phone}</p> : null}
                {site.address ? <p className="text-emerald-100/70">{site.address}</p> : null}
              </div>
              <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wide">
                {[
                  ['facebook', social.facebook],
                  ['twitter', social.twitter],
                  ['linkedin', social.linkedin],
                  ['instagram', social.instagram],
                ]
                  .filter(([, url]) => url)
                  .map(([name, url]) => (
                    <a
                      key={name}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-white/20 px-3 py-1 capitalize text-white/90 transition hover:bg-white/10"
                    >
                      {name}
                    </a>
                  ))}
              </div>
            </div>

            <div className="grid gap-8 sm:grid-cols-3 lg:col-span-8">
              {footerColumns.map((col) => (
                <div key={col.title || Math.random()}>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-200/90">
                    {col.title}
                  </h4>
                  <ul className="mt-3 space-y-2">
                    {(col.links || []).map((link) => (
                      <li key={`${col.title}-${link.label}`}>
                        {link.href?.startsWith('http') ? (
                          <a
                            href={link.href}
                            className="text-sm text-emerald-50/85 transition hover:text-white hover:underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {link.label}
                          </a>
                        ) : link.href?.startsWith('/#') || link.href?.startsWith('#') ? (
                          <button
                            type="button"
                            className="text-sm text-emerald-50/85 transition hover:text-white hover:underline"
                            onClick={() => {
                              const hash = link.href.replace(/^\/#/, '').replace(/^#/, '')
                              if (location.pathname === '/') {
                                document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' })
                              } else {
                                navigate(`/#${hash}`)
                              }
                            }}
                          >
                            {link.label}
                          </button>
                        ) : (
                          <RouterLink
                            to={link.href || '#'}
                            className="text-sm text-emerald-50/85 transition hover:text-white hover:underline"
                          >
                            {link.label}
                          </RouterLink>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-center text-xs text-emerald-100/60 sm:flex-row sm:text-left">
            <p>{site.copyright || `© ${new Date().getFullYear()} ${appName}. All rights reserved.`}</p>
            <p className="text-emerald-100/50">Built for Tanzanian schools · TAMISEMI-ready</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export { PRIMARY, NAV_ITEMS }
