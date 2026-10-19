import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button, Spinner } from '@heroui/react'
import {
  BookOpen,
  Check,
  GraduationCap,
  Layers,
  School,
  Shield,
  Wallet,
} from 'lucide-react'
import MarketingLayout from '../../components/Marketing/MarketingLayout.jsx'
import { getPublicSite, publicPricingPlans } from '../../api/domain.js'
import { formatPlanPrice } from '../../utils/money.js'

function SectionDivider({ light = false }) {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <hr
        className={
          light
            ? 'border-0 border-t border-white/15'
            : 'border-0 border-t border-zinc-200'
        }
      />
    </div>
  )
}

function Home() {
  const navigate = useNavigate()
  const location = useLocation()

  const pricingQ = useQuery({
    queryKey: ['public', 'pricing', 'plans'],
    queryFn: publicPricingPlans,
    staleTime: 30_000,
  })
  const siteQ = useQuery({
    queryKey: ['public', 'site'],
    queryFn: getPublicSite,
    staleTime: 60_000,
  })

  const plans = pricingQ.data?.plans || []
  const site = siteQ.data?.site || {}

  // Scroll to hash after navigation from other pages
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '')
      const t = setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }, 80)
      return () => clearTimeout(t)
    }
  }, [location.hash])

  const highlightFeatures = [
    {
      title: 'Students & academics',
      body: 'Registration, attendance, subjects, exams, and NECTA-style report cards.',
      icon: GraduationCap,
    },
    {
      title: 'Fees & finance',
      body: 'Structures, invoices, payments, and balances that finance teams can trust.',
      icon: Wallet,
    },
    {
      title: 'Multi-school SaaS',
      body: 'Tenant isolation, plans, and super-admin controls for platform operators.',
      icon: Layers,
    },
  ]

  return (
    <MarketingLayout activeKey={location.hash === '#pricing' ? 'pricing' : null}>
      {/* Hero */}
      <section className="bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-6 py-20 text-center md:py-28">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#0B3D2E]">
            School management SaaS
          </p>
          <h1 className="mb-6 max-w-4xl text-4xl font-bold tracking-tighter text-zinc-900 leading-[1.1] md:text-6xl lg:text-7xl">
            {site.tagline || 'One classroom, one system.'}
          </h1>
          <p className="mb-10 max-w-3xl text-lg font-light leading-relaxed text-zinc-500 md:text-xl">
            {site.subtitle ||
              'Shengena gives private schools everything they need to manage students, staff, fees, exams, and parent communication — in one place.'}
          </p>
          <div className="flex w-full flex-col justify-center gap-3 sm:flex-row">
            <Button
              color="primary"
              size="md"
              radius="full"
              className="h-11 bg-[#0B3D2E] px-8 text-base font-bold text-white shadow-md"
              onPress={() => navigate('/register-school?mode=trial')}
            >
              Start 15-day free trial
            </Button>
            <Button
              variant="bordered"
              size="md"
              radius="full"
              className="h-11 border-[#0B3D2E]/30 px-8 text-base font-bold text-[#0B3D2E]"
              onPress={() => {
                document
                  .getElementById('pricing')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              View packages
            </Button>
          </div>
          <p className="mt-4 text-xs text-zinc-400">
            Trial: full access for 15 days — we start counting from the day you
            register. Packages: create account and complete payment.
          </p>
        </div>
      </section>

      <SectionDivider />

      {/* Dark green band — value props */}
      <section id="about" className="bg-[#0B3D2E] py-16 text-emerald-50 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 md:grid-cols-3">
            {[
              {
                icon: School,
                title: 'TAMISEMI-ready',
                body: 'Curriculum, grading, promotions and report cards aligned with Tanzanian school practice.',
              },
              {
                icon: Shield,
                title: 'Secure multi-tenant',
                body: 'Each school is isolated. Super admins run the platform; schools run their campus.',
              },
              {
                icon: BookOpen,
                title: 'All modules, one login',
                body: 'People, learning, finance, ops, exams and identity — without spreadsheet chaos.',
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="text-center md:text-left">
                  <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white md:mx-0">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <h3 className="text-lg font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-emerald-100/80">{item.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <SectionDivider light />

      {/* Features preview */}
      <section id="features-preview" className="bg-zinc-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-[#0B3D2E]">
              Product
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
              Built for real schools
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-zinc-500">
              Academics, finance, and operations — designed for Tanzania. See the full catalogue
              on the features page.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {highlightFeatures.map((card) => {
              const Icon = card.icon
              return (
                <div
                  key={card.title}
                  className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-[#0B3D2E]/30 hover:shadow-md"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#0B3D2E]/8 text-[#0B3D2E]">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-zinc-900">{card.title}</h3>
                  <p className="leading-relaxed text-zinc-500">{card.body}</p>
                </div>
              )
            })}
          </div>
          <div className="mt-10 text-center">
            <Button
              radius="full"
              className="bg-[#0B3D2E] px-8 font-semibold text-white"
              onPress={() => navigate('/features')}
            >
              View all features
            </Button>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* Pricing */}
      <section id="pricing" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-[#0B3D2E]">
              Pricing
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
              Simple plans for every school
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-zinc-500">
              Choose a package to register and pay, or start a{' '}
              <button
                type="button"
                className="font-semibold text-[#0B3D2E] hover:underline"
                onClick={() => navigate('/register-school?mode=trial')}
              >
                15-day free trial
              </button>
              . Super admins manage plans in the platform console.
            </p>
          </div>

          {pricingQ.isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner color="success" label="Loading plans…" />
            </div>
          ) : pricingQ.isError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
              {pricingQ.error?.message || 'Could not load pricing. Please try again later.'}
            </p>
          ) : plans.length === 0 ? (
            <p className="text-center text-sm text-zinc-500">No active plans published yet.</p>
          ) : (
            <div
              className={`mx-auto grid max-w-5xl gap-6 ${
                plans.length === 1
                  ? 'md:max-w-md md:grid-cols-1'
                  : plans.length === 2
                    ? 'md:grid-cols-2'
                    : 'md:grid-cols-3'
              }`}
            >
              {plans.map((plan, index) => {
                const featured = index === Math.min(1, plans.length - 1)
                const features = Array.isArray(plan.features) ? plan.features : []
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
                    {featured ? (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#0B3D2E] px-3 py-0.5 text-[11px] font-semibold text-white">
                        Popular
                      </span>
                    ) : null}
                    <h3 className="text-lg font-bold text-zinc-900">{plan.name}</h3>
                    <p className="mt-1 text-[12px] capitalize text-zinc-500">
                      {plan.billing_cycle} billing
                      {plan.trial_days ? ` · ${plan.trial_days}-day trial` : ''}
                    </p>
                    <p className="mt-5 text-3xl font-bold tracking-tight text-zinc-900 tabular-nums">
                      {formatPlanPrice(plan)}
                    </p>
                    <ul className="mt-6 flex-1 space-y-2.5 text-sm text-zinc-600">
                      {plan.max_students != null ? (
                        <li className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0B3D2E]" />
                          Up to {plan.max_students.toLocaleString()} students
                        </li>
                      ) : null}
                      {plan.max_staff != null ? (
                        <li className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0B3D2E]" />
                          Up to {plan.max_staff.toLocaleString()} staff
                        </li>
                      ) : null}
                      {features.length > 0 ? (
                        features.map((f) => (
                          <li key={f} className="flex items-start gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0B3D2E]" />
                            <span className="capitalize">{String(f).replaceAll('_', ' ')}</span>
                          </li>
                        ))
                      ) : (
                        <li className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0B3D2E]" />
                          Core school management modules
                        </li>
                      )}
                    </ul>
                    <div className="mt-8 flex flex-col gap-2">
                      <Button
                        className={[
                          'w-full font-semibold',
                          featured
                            ? 'bg-[#0B3D2E] text-white'
                            : 'border border-zinc-200 bg-white text-zinc-900',
                        ].join(' ')}
                        radius="full"
                        variant={featured ? 'solid' : 'bordered'}
                        onPress={() =>
                          navigate(
                            `/register-school?mode=paid&plan_id=${plan.id}`,
                          )
                        }
                      >
                        Choose package & pay
                      </Button>
                      <Button
                        radius="full"
                        variant="light"
                        className="w-full text-xs font-semibold text-[#0B3D2E]"
                        onPress={() => navigate('/register-school?mode=trial')}
                      >
                        Or start 15-day trial
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <SectionDivider />

      {/* Contact — soft surface */}
      <section id="contact" className="bg-zinc-50 py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-[#0B3D2E]">Contact</p>
          <h2 className="mt-2 text-2xl font-bold text-zinc-900">Talk to the Shengena team</h2>
          <p className="mt-2 text-zinc-500">
            Questions about onboarding, TAMISEMI compliance, or enterprise pricing?
          </p>
          <p className="mt-5 text-base font-semibold text-[#0B3D2E]">
            {site.support_email || 'support@shengena.app'}
          </p>
          {site.phone ? <p className="mt-1 text-sm text-zinc-600">{site.phone}</p> : null}
        </div>
      </section>

      <SectionDivider />

      {/* Support — dark strip */}
      <section id="support" className="bg-[#0A2F24] py-14 text-emerald-50">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-xl font-bold text-white">Need help signing in?</h2>
          <p className="mt-2 text-sm text-emerald-100/75">
            School staff and parents use the same secure portal. Super admins open the platform
            console.
          </p>
          <Button
            radius="full"
            className="mt-6 bg-white font-semibold text-[#0B3D2E]"
            onPress={() => navigate('/login')}
          >
            Go to sign in
          </Button>
        </div>
      </section>

      {/* Privacy / terms anchors for footer links */}
      <section id="privacy" className="sr-only" aria-hidden>
        Privacy
      </section>
      <section id="terms" className="sr-only" aria-hidden>
        Terms
      </section>
    </MarketingLayout>
  )
}

export default Home
