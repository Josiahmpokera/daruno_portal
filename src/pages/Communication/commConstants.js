import dayjs from 'dayjs'

export const CATEGORIES = [
  { value: 'general', label: 'General', bar: 'bg-slate-400', chip: 'bg-slate-100 text-slate-700' },
  { value: 'academic', label: 'Academic', bar: 'bg-indigo-500', chip: 'bg-indigo-50 text-indigo-700' },
  { value: 'exams', label: 'Exams', bar: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700' },
  { value: 'fees', label: 'Fees', bar: 'bg-amber-500', chip: 'bg-amber-50 text-amber-800' },
  { value: 'events', label: 'Events', bar: 'bg-sky-500', chip: 'bg-sky-50 text-sky-700' },
  { value: 'sports', label: 'Sports', bar: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700' },
  { value: 'health', label: 'Health', bar: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700' },
  { value: 'transport', label: 'Transport', bar: 'bg-orange-500', chip: 'bg-orange-50 text-orange-700' },
]
export const categoryMeta = (v) => CATEGORIES.find((c) => c.value === v) || CATEGORIES[0]

export const PRIORITIES = [
  { value: 'normal', label: 'Normal' },
  { value: 'important', label: 'Important' },
  { value: 'urgent', label: 'Urgent' },
]

export const AUDIENCES = [
  { value: 'all', label: 'Whole school', hint: 'Parents, guardians and staff' },
  { value: 'parents', label: 'Parents & guardians', hint: 'Guardians of all active learners' },
  { value: 'staff', label: 'Staff', hint: 'All active staff members' },
  { value: 'classes', label: 'Specific classes', hint: 'Guardians of learners in chosen classes' },
]
export const audienceLabel = (v) => AUDIENCES.find((a) => a.value === v)?.label || v

export const STATUS_META = {
  draft: { label: 'Draft', cls: 'bg-slate-100 text-slate-700' },
  scheduled: { label: 'Scheduled', cls: 'bg-sky-50 text-sky-700' },
  published: { label: 'Published', cls: 'bg-emerald-50 text-emerald-700' },
  archived: { label: 'Archived', cls: 'bg-zinc-100 text-zinc-500' },
  open: { label: 'Open', cls: 'bg-emerald-50 text-emerald-700' },
  closed: { label: 'Closed', cls: 'bg-zinc-100 text-zinc-500' },
}

export const INBOUND_CHANNELS = [
  { value: 'phone', label: 'Phone call' },
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'in_person', label: 'In person' },
]
export const inboundLabel = (v) => INBOUND_CHANNELS.find((c) => c.value === v)?.label || v

export const initials = (name = '') => {
  const p = String(name).trim().split(/\s+/).filter(Boolean)
  if (!p.length) return '?'
  return ((p[0][0] || '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase()
}

/** "just now", "5m", "3h", "Yesterday", "Mon", "12 Oct" */
export function shortTime(iso) {
  if (!iso) return ''
  const d = dayjs(iso)
  const now = dayjs()
  const mins = now.diff(d, 'minute')
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  if (now.isSame(d, 'day')) return d.format('HH:mm')
  if (now.subtract(1, 'day').isSame(d, 'day')) return 'Yesterday'
  if (now.diff(d, 'day') < 7) return d.format('ddd')
  return d.format(now.isSame(d, 'year') ? 'D MMM' : 'D MMM YYYY')
}

export const fullTime = (iso) => (iso ? dayjs(iso).format('D MMM YYYY, HH:mm') : '—')

export function dayLabel(iso) {
  const d = dayjs(iso)
  if (d.isSame(dayjs(), 'day')) return 'Today'
  if (d.isSame(dayjs().subtract(1, 'day'), 'day')) return 'Yesterday'
  return d.format('dddd, D MMMM YYYY')
}

/** "Expires in 3 days" / "Expires today" / null */
export function expiryLabel(iso) {
  if (!iso) return null
  const days = dayjs(iso).startOf('day').diff(dayjs().startOf('day'), 'day')
  if (days < 0) return 'Expired'
  if (days === 0) return 'Expires today'
  if (days === 1) return 'Expires tomorrow'
  return `Expires in ${days} days`
}

/** SMS segments for a message body (GSM 160 / 153 per part). */
export const smsSegments = (text = '') => (text.length <= 160 ? 1 : Math.ceil(text.length / 153))

/** Local value for <input type="datetime-local"> */
export const toLocalInput = (iso) => (iso ? dayjs(iso).format('YYYY-MM-DDTHH:mm') : '')
