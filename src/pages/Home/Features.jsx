import { useNavigate } from 'react-router-dom'
import { Button } from '@heroui/react'
import {
  BookOpen,
  Bus,
  ClipboardCheck,
  GraduationCap,
  IdCard,
  Library,
  Package,
  School,
  Users,
  Wallet,
} from 'lucide-react'
import MarketingLayout from '../../components/Marketing/MarketingLayout.jsx'

const FEATURE_GROUPS = [
  {
    title: 'People',
    description: 'Students, parents, teachers and staff in one directory.',
    items: [
      {
        icon: Users,
        title: 'Students & parents',
        body: 'Admissions, profiles, guardians, transfers, alumni and identity cards with QR verification.',
      },
      {
        icon: GraduationCap,
        title: 'Teachers & staff',
        body: 'HR onboarding, contracts, leave, attendance and department structure.',
      },
      {
        icon: IdCard,
        title: 'IDs & identity',
        body: 'Printable student ID cards, templates, and public verify links.',
      },
    ],
  },
  {
    title: 'Academics & learning',
    description: 'TAMISEMI curriculum, grading, exams and promotions.',
    items: [
      {
        icon: School,
        title: 'Academic setup',
        body: 'Years, terms, levels, classes, streams, subjects and combinations (NECTA packages).',
      },
      {
        icon: BookOpen,
        title: 'Curriculum & grading',
        body: 'Stage frameworks, topics, and NECTA / primary grade bands used on report cards.',
      },
      {
        icon: ClipboardCheck,
        title: 'Exams & report cards',
        body: 'CA, terminal exams, marks entry, divisions, rankings and bulk report printing.',
      },
      {
        icon: GraduationCap,
        title: 'Promotions',
        body: 'Rules, automatic and manual promotion, repeat class and year-end reports.',
      },
    ],
  },
  {
    title: 'Finance',
    description: 'Fee structures, collections and accounting.',
    items: [
      {
        icon: Wallet,
        title: 'Fees & student ledger',
        body: 'Structure by class and term, billing, payments, receipts, refunds and outstanding.',
      },
      {
        icon: Package,
        title: 'Accounting ops',
        body: 'Chart of accounts, journals, banks, budgets and financial reports.',
      },
    ],
  },
  {
    title: 'Operations',
    description: 'Day-to-day campus services.',
    items: [
      {
        icon: Library,
        title: 'Library',
        body: 'Catalogue, loans, reservations and returns.',
      },
      {
        icon: Package,
        title: 'Inventory',
        body: 'Stock items, movements, vendors and purchase orders.',
      },
      {
        icon: Bus,
        title: 'Transport & hostel',
        body: 'Routes, vehicles, boarding allocations and occupancy.',
      },
    ],
  },
]

function Features() {
  const navigate = useNavigate()

  return (
    <MarketingLayout activeKey="features">
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B3D2E]">
            Features
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-zinc-900 md:text-5xl">
            Everything your school needs — in one platform
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-zinc-500">
            Shengena covers people, academics, finance and operations with workflows that match
            Tanzanian school practice (TAMISEMI / NECTA).
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              radius="full"
              className="bg-[#0B3D2E] px-7 font-semibold text-white"
              onPress={() => navigate('/register-school')}
            >
              Start free trial
            </Button>
            <Button
              radius="full"
              variant="bordered"
              className="border-[#0B3D2E]/30 font-semibold text-[#0B3D2E]"
              onPress={() => navigate('/#pricing')}
            >
              View pricing
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6">
        <hr className="border-0 border-t border-zinc-200" />
      </div>

      {FEATURE_GROUPS.map((group, gi) => (
        <section
          key={group.title}
          className={gi % 2 === 1 ? 'bg-[#0B3D2E] py-16 text-emerald-50' : 'bg-white py-16'}
        >
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-8 max-w-2xl">
              <h2
                className={`text-2xl font-bold tracking-tight md:text-3xl ${
                  gi % 2 === 1 ? 'text-white' : 'text-zinc-900'
                }`}
              >
                {group.title}
              </h2>
              <p
                className={`mt-2 text-sm md:text-base ${
                  gi % 2 === 1 ? 'text-emerald-100/80' : 'text-zinc-500'
                }`}
              >
                {group.description}
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.title}
                    className={
                      gi % 2 === 1
                        ? 'rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm'
                        : 'rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 shadow-sm'
                    }
                  >
                    <div
                      className={
                        gi % 2 === 1
                          ? 'mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white'
                          : 'mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#0B3D2E]/10 text-[#0B3D2E]'
                      }
                    >
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <h3
                      className={`text-base font-bold ${
                        gi % 2 === 1 ? 'text-white' : 'text-zinc-900'
                      }`}
                    >
                      {item.title}
                    </h3>
                    <p
                      className={`mt-1.5 text-sm leading-relaxed ${
                        gi % 2 === 1 ? 'text-emerald-100/75' : 'text-zinc-500'
                      }`}
                    >
                      {item.body}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
          {gi < FEATURE_GROUPS.length - 1 ? (
            <div className="mx-auto mt-16 max-w-6xl px-6">
              <hr
                className={
                  gi % 2 === 1
                    ? 'border-0 border-t border-white/15'
                    : 'border-0 border-t border-zinc-200'
                }
              />
            </div>
          ) : null}
        </section>
      ))}

      <section className="border-t border-zinc-200 bg-zinc-50 py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-bold text-zinc-900">Ready to run your school on Shengena?</h2>
          <p className="mt-2 text-zinc-500">
            Register your school, invite staff, and start with a free trial.
          </p>
          <Button
            radius="full"
            className="mt-6 bg-[#0B3D2E] px-8 font-semibold text-white"
            onPress={() => navigate('/register-school')}
          >
            Register school
          </Button>
        </div>
      </section>
    </MarketingLayout>
  )
}

export default Features
