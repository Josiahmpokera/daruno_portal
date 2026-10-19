import { Tooltip } from '@heroui/react'
import { Check, CheckCheck, Clock, Mail, MessageSquare, Monitor, X } from 'lucide-react'
import { STATUS_META, categoryMeta } from './commConstants.js'

const CHANNEL_ICON = { portal: Monitor, email: Mail, sms: MessageSquare }

export function StatusPill({ status }) {
  const m = STATUS_META[status] || { label: status, cls: 'bg-slate-100 text-slate-700' }
  return (
    <span className={`inline-flex h-5 items-center rounded px-1.5 text-[10px] font-semibold uppercase tracking-wide ${m.cls}`}>
      {m.label}
    </span>
  )
}

export function PriorityPill({ priority }) {
  if (priority === 'urgent') {
    return <span className="inline-flex h-5 items-center rounded bg-rose-50 px-1.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700">Urgent</span>
  }
  if (priority === 'important') {
    return <span className="inline-flex h-5 items-center rounded bg-amber-50 px-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">Important</span>
  }
  return null
}

export function CategoryPill({ category }) {
  const m = categoryMeta(category)
  return <span className={`inline-flex h-5 items-center rounded px-1.5 text-[10px] font-semibold ${m.chip}`}>{m.label}</span>
}

export function ChannelIcons({ channels = [] }) {
  return (
    <span className="inline-flex items-center gap-1 text-zinc-400">
      {channels.map((c) => {
        const Icon = CHANNEL_ICON[c]
        return Icon ? <Icon key={c} className="h-3.5 w-3.5" strokeWidth={1.75} aria-label={c} /> : null
      })}
    </span>
  )
}

/**
 * Channel toggles. `channels` comes from /communication/channels.
 * `disabledReasons` lets the caller block a channel (e.g. guardian has no email).
 */
export function ChannelPicker({ value = [], onChange, channels = {}, disabledReasons = {} }) {
  const order = ['portal', 'email', 'sms']
  const toggle = (c) => {
    if (c === 'portal') return
    onChange(value.includes(c) ? value.filter((x) => x !== c) : [...value, c])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {order.map((c) => {
        const meta = channels[c] || { label: c, available: c === 'portal' }
        const Icon = CHANNEL_ICON[c]
        const reason = !meta.available ? meta.note : disabledReasons[c]
        const disabled = Boolean(reason) && c !== 'portal'
        const checked = c === 'portal' || (value.includes(c) && !disabled)
        const pill = (
          <button
            key={c}
            type="button"
            role="checkbox"
            aria-checked={checked}
            aria-disabled={disabled}
            disabled={disabled}
            onClick={() => toggle(c)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[12px] font-medium transition-colors ${
              checked
                ? 'border-[#0B3D2E]/40 bg-[#0B3D2E]/[0.06] text-[#0B3D2E]'
                : disabled
                  ? 'cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-400'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
            } ${c === 'portal' ? 'cursor-default' : ''}`}
          >
            <span
              className={`flex h-3.5 w-3.5 items-center justify-center rounded-sm border ${
                checked ? 'border-[#0B3D2E] bg-[#0B3D2E] text-white' : 'border-zinc-300 bg-white'
              }`}
              aria-hidden="true"
            >
              {checked ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : null}
            </span>
            {Icon ? <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> : null}
            {meta.label}
          </button>
        )
        return reason ? (
          <Tooltip key={c} content={reason} placement="top" delay={200} closeDelay={0} className="max-w-xs text-[11px]">
            <span>{pill}</span>
          </Tooltip>
        ) : (
          pill
        )
      })}
    </div>
  )
}

/** Per-channel delivery result for one outbound message. */
export function DeliveryBadges({ delivery = {}, channels = [] }) {
  const items = channels.filter((c) => c !== 'portal' && delivery[c])
  if (!items.length) return null
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {items.map((c) => {
        const d = delivery[c]
        const Icon = CHANNEL_ICON[c]
        const tone =
          d.status === 'sent'
            ? 'text-emerald-600'
            : d.status === 'queued'
              ? 'text-sky-600'
              : 'text-rose-600'
        const StatusIcon = d.status === 'sent' ? CheckCheck : d.status === 'queued' ? Clock : X
        const label =
          d.status === 'sent' ? 'Sent' : d.status === 'queued' ? 'Queued for gateway' : d.error || 'Not sent'
        return (
          <Tooltip key={c} content={`${c.toUpperCase()}: ${label}`} placement="top" delay={150} closeDelay={0} className="text-[11px]">
            <span className={`inline-flex items-center gap-0.5 ${tone}`}>
              {Icon ? <Icon className="h-3 w-3" strokeWidth={2} /> : null}
              <StatusIcon className="h-3 w-3" strokeWidth={2.25} />
            </span>
          </Tooltip>
        )
      })}
    </span>
  )
}

export function SegmentedControl({ value, onChange, options, size = 'md' }) {
  return (
    <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5" role="radiogroup">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`rounded-md px-3 font-medium transition-colors ${size === 'sm' ? 'h-7 text-[11px]' : 'h-8 text-[12px]'} ${
              active ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200' : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function EmptyState({ icon, title, hint, action = null }) {
  const Icon = icon
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {Icon ? (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100">
          <Icon className="h-5 w-5 text-zinc-400" strokeWidth={1.75} />
        </div>
      ) : null}
      <p className="text-sm font-medium text-zinc-900">{title}</p>
      {hint ? <p className="mt-1 max-w-sm text-xs text-zinc-500">{hint}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
