import { useNavigate } from 'react-router-dom'
import {
  Button,
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from '@heroui/react'
import ShengenaLogo from '../../components/Brand/ShengenaLogo.jsx'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '../../auth'

function Home() {
  const navigate = useNavigate()
  const { session, isAuthenticated, isPlatform, logout } = useAuth()

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSettled: () => {
      navigate('/login', { replace: true })
    },
  })

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      {/* Adobe-style Navbar: Sticky, white, subtle border */}
      <Navbar
        maxWidth="xl"
        className="h-16 border-b border-zinc-100 bg-white/95 backdrop-blur-sm"
        isBordered={false}
      >
        <NavbarBrand className="gap-3">
          <ShengenaLogo
            variant="full"
            iconClassName="h-8 w-8 object-contain"
            wordClassName="h-7 w-auto object-contain"
          />
        </NavbarBrand>
        
        {/* Added Menu Items as requested */}
        <NavbarContent className="hidden gap-6 sm:flex" justify="center">
          <NavbarItem>
            <Link color="foreground" href="#" className="text-sm font-medium hover:text-[#0B3D2E]">
              Pricing
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link color="foreground" href="#" className="text-sm font-medium hover:text-[#0B3D2E]">
              Contact us
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link color="foreground" href="#" className="text-sm font-medium hover:text-[#0B3D2E]">
              Support
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link color="foreground" href="#" className="text-sm font-medium hover:text-[#0B3D2E]">
              Features
            </Link>
          </NavbarItem>
        </NavbarContent>

        <NavbarContent justify="end" className="gap-4">
          <NavbarItem>
            <Button
              size="sm"
              variant="light"
              className="font-medium text-zinc-600 data-[hover=true]:bg-zinc-100 hover:text-zinc-900"
              onPress={() => window.open('https://heroui.com', '_blank')}
            >
              Help
            </Button>
          </NavbarItem>
          {isAuthenticated && session?.user ? (
            <>
              <NavbarItem>
                <div className="text-sm font-medium text-zinc-600">
                  {session.user.name || session.user.email}
                </div>
              </NavbarItem>
              <NavbarItem>
                <Button
                  size="sm"
                  variant="flat"
                  radius="full"
                  className="font-medium"
                  onPress={() =>
                    navigate(isPlatform ? '/platform' : '/dashboard')
                  }
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
                  className="bg-[#0B3D2E] px-6 font-semibold"
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
                  className="font-medium text-zinc-900 hover:text-[#0B3D2E]"
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
                  className="bg-[#0B3D2E] px-6 font-semibold shadow-sm"
                  onPress={() => navigate('/register-school')}
                >
                  Register School
                </Button>
              </NavbarItem>
            </>
          )}
        </NavbarContent>
      </Navbar>

      <main className="w-full">
        {/* Hero Section: Adobe marketing style (Clean, large type, centered or split) */}
        <section className="container mx-auto flex max-w-6xl flex-col items-center px-6 py-24 text-center md:py-32">
          <h1 className="mb-6 text-5xl font-bold tracking-tighter text-zinc-900 leading-[1.1] md:text-7xl">
            Creativity for all.
          </h1>
          <p className="mb-10 max-w-3xl text-xl font-light leading-relaxed text-zinc-500 md:text-2xl">
            Shengena Portal gives you everything you need to manage your school, students, and
            curriculum in one beautiful place.
          </p>
          <div className="flex w-full flex-col justify-center gap-4 sm:flex-row">
            <Button
              color="primary"
              size="md"
              radius="full"
              className="h-10 bg-[#0B3D2E] px-8 text-base font-bold text-white shadow-md transition-transform hover:opacity-90 active:scale-95"
              onPress={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </Button>
            <Button
              variant="bordered"
              size="md"
              radius="full"
              className="h-10 border-zinc-300 px-8 text-base font-bold text-zinc-900 transition-colors hover:border-zinc-900 hover:bg-transparent"
              onPress={() => navigate('/settings')}
            >
              Configure Workspace
            </Button>
          </div>
        </section>

        {/* Features Grid: Minimalist cards */}
        <section className="border-t border-zinc-100 bg-zinc-50 py-24">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* Card 1 */}
              <div className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-[#0B3D2E]">
                  <span className="text-xl font-bold">Aa</span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-zinc-900">Modern Design</h3>
                <p className="mb-6 leading-relaxed text-zinc-500">
                  Experience a fluid, responsive interface built with the latest web standards.
                </p>
                <Link
                  href="https://heroui.com"
                  isExternal
                  className="text-sm font-semibold text-[#0B3D2E] hover:underline"
                >
                  View Guidelines
                </Link>
              </div>

              {/* Card 2 */}
              <div className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-[#0B3D2E]">
                  <span className="text-xl font-bold">Px</span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-zinc-900">Powerful Tools</h3>
                <p className="mb-6 leading-relaxed text-zinc-500">
                  Access a comprehensive suite of components for all your educational needs.
                </p>
                <Link
                  href="#"
                  onPress={() => navigate('/dashboard')}
                  className="text-sm font-semibold text-[#0B3D2E] hover:underline"
                >
                  Browse Features
                </Link>
              </div>

              {/* Card 3 */}
              <div className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-[#0B3D2E]">
                  <span className="text-xl font-bold">Th</span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-zinc-900">Customizable</h3>
                <p className="mb-6 leading-relaxed text-zinc-500">
                  Adapt the portal to your school's unique brand identity and colors.
                </p>
                <Link
                  href="#"
                  onPress={() => navigate('/settings')}
                  className="text-sm font-semibold text-[#0B3D2E] hover:underline"
                >
                  Adjust Theme
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Home
