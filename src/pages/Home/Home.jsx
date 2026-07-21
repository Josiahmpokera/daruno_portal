import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Button,
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Spinner,
} from '@heroui/react'
import { Check } from 'lucide-react'
import ShengenaLogo from '../../components/Brand/ShengenaLogo.jsx'
import { useAuth } from '../../auth'
import { publicPricingPlans } from '../../api/domain.js'
import { formatPlanPrice } from '../../utils/money.js'

function Home() {
  const navigate = useNavigate()
  const { session, isAuthenticated, isPlatform, logout } = useAuth()

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSettled: () => {
      navigate('/login', { replace: true })
    },
  })

  const pricingQ = useQuery({
    queryKey: ['public', 'pricing', 'plans'],
    queryFn: publicPricingPlans,
    staleTime: 30_000,
  })

  const plans = pricingQ.data?.plans || []

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      <Navbar
        maxWidth="xl"
        className="h-16 border-b border-zinc-100 bg-white/95 backdrop-blur-sm"
        isBordered={false}
      >
        <NavbarBrand className="gap-3">
          <button
            type="button"
            className="flex items-center gap-2"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <ShengenaLogo
              variant="full"
              iconClassName="h-8 w-32 object-contain"
              wordClassName="h-7 w-auto object-contain"
            />
          </button>
        </NavbarBrand>

        <NavbarContent className="hidden gap-6 sm:flex" justify="center">
          <NavbarItem>
            <Link
              color="foreground"
              href="#pricing"
              className="text-sm font-medium hover:text-[#0B3D2E]"
            >
              Pricing
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link
              color="foreground"
              href="#features"
              className="text-sm font-medium hover:text-[#0B3D2E]"
            >
              Features
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link
              color="foreground"
              href="/apply"
              className="text-sm font-medium hover:text-[#0B3D2E]"
            >
              Join a school
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link
              color="foreground"
              href="#contact"
              className="text-sm font-medium hover:text-[#0B3D2E]"
            >
              Contact us
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link
              color="foreground"
              href="#support"
              className="text-sm font-medium hover:text-[#0B3D2E]"
            >
              Support
            </Link>
          </NavbarItem>
        </NavbarContent>

        <NavbarContent justify="end" className="gap-4">
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
        <section className="container mx-auto flex max-w-6xl flex-col items-center px-6 py-24 text-center md:py-32">
          <h1 className="mb-6 text-5xl font-bold tracking-tighter text-zinc-900 leading-[1.1] md:text-7xl">
            One classroom, one system.
          </h1>
          <p className="mb-10 max-w-3xl text-xl font-light leading-relaxed text-zinc-500 md:text-2xl">
            Shengena gives private schools everything they need to manage
            students, staff, fees, exams, and parent communication — in one
            place.
          </p>
          <div className="flex w-full flex-col justify-center gap-4 sm:flex-row">
            <Button
              color="primary"
              size="md"
              radius="full"
              className="h-10 bg-[#0B3D2E] px-8 text-base font-bold text-white shadow-md transition-transform hover:opacity-90 active:scale-95"
              onPress={() => navigate('/register-school')}
            >
              Start free trial
            </Button>
            <Button
              variant="bordered"
              size="md"
              radius="full"
              className="h-10 border-zinc-300 px-8 text-base font-bold text-zinc-900 transition-colors hover:border-zinc-900 hover:bg-transparent"
              onPress={() => {
                document
                  .getElementById('pricing')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              View pricing
            </Button>
          </div>
        </section>

        <section id="features" className="border-t border-zinc-100 bg-zinc-50 py-24">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
                Built for schools
              </h2>
              <p className="mt-2 text-zinc-500">
                Academics, finance, and operations — designed for Tanzania.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                {
                  title: 'Students & academics',
                  body: 'Registration, attendance, subjects, exams, and NECTA-style report cards.',
                },
                {
                  title: 'Fees & finance',
                  body: 'Structures, invoices, payments, and balances that finance teams can trust.',
                },
                {
                  title: 'Multi-school SaaS',
                  body: 'Tenant isolation, plans, and super-admin controls for platform operators.',
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md"
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-[#0B3D2E]">
                    <Check className="h-5 w-5" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-zinc-900">
                    {card.title}
                  </h3>
                  <p className="leading-relaxed text-zinc-500">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Live pricing — fed from subscription plans API */}
        <section id="pricing" className="border-t border-zinc-100 bg-white py-24">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="mb-12 text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-[#0B3D2E]">
                Pricing
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
                Simple plans for every school
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-zinc-500">
                Prices below are live from the platform. When a super admin
                updates a plan, this page updates automatically.
              </p>
            </div>

            {pricingQ.isLoading ? (
              <div className="flex justify-center py-16">
                <Spinner color="success" label="Loading plans…" />
              </div>
            ) : pricingQ.isError ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
                {pricingQ.error?.message ||
                  'Could not load pricing. Please try again later.'}
              </p>
            ) : plans.length === 0 ? (
              <p className="text-center text-sm text-zinc-500">
                No active plans published yet.
              </p>
            ) : (
              <div
                className={`mx-auto grid max-w-5xl gap-6 ${
                  plans.length === 1
                    ? 'md:grid-cols-1 md:max-w-md'
                    : plans.length === 2
                      ? 'md:grid-cols-2'
                      : 'md:grid-cols-3'
                }`}
              >
                {plans.map((plan, index) => {
                  const featured = index === Math.min(1, plans.length - 1)
                  const features = Array.isArray(plan.features)
                    ? plan.features
                    : []
                  return (
                    <div
                      key={plan.id}
                      className={[
                        'relative flex flex-col rounded-2xl border p-6 shadow-sm transition hover:shadow-md',
                        featured
                          ? 'border-[#0B3D2E] bg-emerald-50/40 ring-1 ring-[#0B3D2E]/20'
                          : 'border-zinc-200 bg-white',
                      ].join(' ')}
                    >
                      {featured && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#0B3D2E] px-3 py-0.5 text-[11px] font-semibold text-white">
                          Popular
                        </span>
                      )}
                      <h3 className="text-lg font-bold text-zinc-900">
                        {plan.name}
                      </h3>
                      <p className="mt-1 text-[12px] capitalize text-zinc-500">
                        {plan.billing_cycle} billing
                        {plan.trial_days
                          ? ` · ${plan.trial_days}-day trial`
                          : ''}
                      </p>
                      <p className="mt-5 text-3xl font-bold tracking-tight text-zinc-900 tabular-nums">
                        {formatPlanPrice(plan)}
                      </p>

                      <ul className="mt-6 flex-1 space-y-2.5 text-sm text-zinc-600">
                        {plan.max_students != null && (
                          <li className="flex items-start gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0B3D2E]" />
                            Up to {plan.max_students.toLocaleString()} students
                          </li>
                        )}
                        {plan.max_staff != null && (
                          <li className="flex items-start gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0B3D2E]" />
                            Up to {plan.max_staff.toLocaleString()} staff
                          </li>
                        )}
                        {features.length > 0 ? (
                          features.map((f) => (
                            <li key={f} className="flex items-start gap-2">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0B3D2E]" />
                              <span className="capitalize">
                                {String(f).replaceAll('_', ' ')}
                              </span>
                            </li>
                          ))
                        ) : (
                          <li className="flex items-start gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0B3D2E]" />
                            Core school management modules
                          </li>
                        )}
                      </ul>

                      <Button
                        className={[
                          'mt-8 w-full font-semibold',
                          featured
                            ? 'bg-[#0B3D2E] text-white'
                            : 'border border-zinc-200 bg-white text-zinc-900',
                        ].join(' ')}
                        radius="full"
                        variant={featured ? 'solid' : 'bordered'}
                        onPress={() => navigate('/register-school')}
                      >
                        Get started
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        <section
          id="contact"
          className="border-t border-zinc-100 bg-zinc-50 py-16"
        >
          <div className="container mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-2xl font-bold text-zinc-900">Contact us</h2>
            <p className="mt-2 text-zinc-500">
              Questions about onboarding or enterprise pricing? Reach the
              Shengena team.
            </p>
            <p className="mt-4 text-sm font-medium text-[#0B3D2E]">
              support@shengena.app
            </p>
          </div>
        </section>

        <section id="support" className="border-t border-zinc-100 bg-white py-12">
          <div className="container mx-auto max-w-3xl px-6 text-center text-sm text-zinc-500">
            <p>
              Need help signing in?{' '}
              <button
                type="button"
                className="font-medium text-[#0B3D2E] hover:underline"
                onClick={() => navigate('/login')}
              >
                Go to sign in
              </button>
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Home
