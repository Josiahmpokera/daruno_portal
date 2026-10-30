import { Card, CardBody } from '@heroui/react'
import { CheckCircle2, Circle } from 'lucide-react'

/**
 * Building blocks for long data-entry pages (onboarding, registration…):
 * full-width numbered sections + a sticky side panel with a progress checklist.
 */

/** Section card: title and help on the left, fields on the right (stacks on small screens). */
export function FormSection({ id, index, title, description, icon, optional = false, children }) {
  const Icon = icon
  return (
    <Card id={id} className="scroll-mt-4 rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
      <CardBody className="grid gap-5 p-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            {Icon ? (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#12544f]/[0.08] text-[#12544f]">
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
            ) : null}
            <div className="min-w-0">
              {index ? (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Step {index}
                  {optional ? ' · Optional' : ''}
                </p>
              ) : null}
              <h3 className="truncate text-sm font-semibold text-slate-900">{title}</h3>
            </div>
          </div>
          {description ? (
            <p className="mt-2 text-xs leading-relaxed text-slate-500">{description}</p>
          ) : null}
        </div>
        <div className="min-w-0">{children}</div>
      </CardBody>
    </Card>
  )
}

/** Responsive field grid: 1 → 2 → 3 columns. */
export function FieldGrid({ children, columns = 3 }) {
  const cols = columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 2xl:grid-cols-3'
  return <div className={`grid grid-cols-1 gap-x-4 gap-y-3.5 ${cols}`}>{children}</div>
}

/** Sub-heading inside a section (e.g. Father / Mother). */
export function FieldGroupTitle({ children, aside = null }) {
  return (
    <div className="mb-2.5 flex items-center justify-between gap-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{children}</h4>
      {aside}
    </div>
  )
}

/** Accessible on/off switch row. */
export function ToggleRow({ checked, onChange, disabled, label, description }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start justify-between gap-4 rounded-lg border border-slate-200 px-3.5 py-3 text-left transition-colors hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-slate-900">{label}</span>
        {description ? <span className="mt-0.5 block text-xs text-slate-500">{description}</span> : null}
      </span>
      <span
        className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-[#12544f]' : 'bg-slate-300'
        }`}
        aria-hidden="true"
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-[18px]' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  )
}

/**
 * Progress checklist for the side panel.
 * items: [{ key, title, done, required, hasError }]
 */
export function ProgressChecklist({ title = 'Checklist', items, onSelect }) {
  const done = items.filter((i) => i.done && !i.hasError).length
  return (
    <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
      <CardBody className="p-0">
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            <span className="text-[11px] tabular-nums text-slate-500">
              {done}/{items.length}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#12544f] transition-all"
              style={{ width: `${(done / Math.max(items.length, 1)) * 100}%` }}
            />
          </div>
        </div>
        <ul className="p-2">
          {items.map((it, i) => (
            <li key={it.key}>
              <button
                type="button"
                onClick={() => onSelect?.(it.key)}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-slate-50"
              >
                {it.done && !it.hasError ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2} />
                ) : (
                  <Circle className={`h-4 w-4 shrink-0 ${it.hasError ? 'text-rose-500' : 'text-slate-300'}`} strokeWidth={2} />
                )}
                <span
                  className={`min-w-0 flex-1 truncate ${
                    it.hasError ? 'text-rose-600' : it.done ? 'text-slate-900' : 'text-slate-600'
                  }`}
                >
                  {i + 1}. {it.title}
                </span>
                {it.required && !it.done ? (
                  <span className="text-[10px] font-medium uppercase tracking-wide text-rose-500">Required</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  )
}

/** Label / value lines for a summary card. */
export function SummaryList({ rows }) {
  return (
    <dl className="space-y-1.5 text-xs">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3">
          <dt className="shrink-0 text-slate-500">{k}</dt>
          <dd className="min-w-0 truncate text-right font-medium text-slate-900">{v || '—'}</dd>
        </div>
      ))}
    </dl>
  )
}
