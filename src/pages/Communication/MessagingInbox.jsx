import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, Spinner, useDisclosure } from '@heroui/react'
import {
  ArrowLeft,
  Inbox,
  Lock,
  Mail,
  MessageSquarePlus,
  Phone,
  PhoneIncoming,
  RotateCcw,
  Search,
  Send,
} from 'lucide-react'
import SideSheet from '../../components/Layout/SideSheet.jsx'
import { FormButton, FormField, FormInput, FormSelect, FormTextarea } from '../../components/Form'
import { toastError, toastSuccess } from '../../components/Toast'
import {
  createParentThread,
  getCommunicationChannels,
  getParentThread,
  listParentThreads,
  logParentReply,
  searchMessageRecipients,
  sendParentMessage,
  updateParentThread,
} from '../../api/domain.js'
import { ChannelPicker, DeliveryBadges, EmptyState, StatusPill } from './commComponents.jsx'
import {
  INBOUND_CHANNELS,
  dayLabel,
  fullTime,
  inboundLabel,
  initials,
  shortTime,
  smsSegments,
  toLocalInput,
} from './commConstants.js'

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
]

function useDebounced(value, ms = 250) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

/** Channels a guardian can actually receive on. */
function guardianBlocks(guardian) {
  return {
    email: guardian?.email ? null : 'No email address on file for this guardian',
    sms: guardian?.phone ? null : 'No phone number on file for this guardian',
  }
}

/* ── Thread list ─────────────────────────────────────────────────── */

function ThreadList({ selectedId, onSelect, onNew, className = '' }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const q = useDebounced(search.trim())

  const listQ = useQuery({
    queryKey: ['comm', 'threads', q, filter],
    queryFn: () => listParentThreads({ q: q || undefined, status: filter || undefined }),
    placeholderData: (prev) => prev,
    refetchInterval: 15_000,
  })
  const threads = listQ.data?.threads || []
  const counts = listQ.data?.counts || {}

  return (
    <div className={`flex min-h-0 flex-col border-zinc-200 bg-white ${className}`}>
      <div className="space-y-2.5 border-b border-zinc-100 p-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-900">Conversations</h2>
          <FormButton className="h-8 min-h-8" startContent={<MessageSquarePlus className="h-3.5 w-3.5" />} onPress={onNew}>
            New message
          </FormButton>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search parent, learner, subject…"
            aria-label="Search conversations"
            className="h-8 w-full rounded-md border border-zinc-200 bg-white pl-8 pr-3 text-[12px] text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#0B3D2E] focus:ring-2 focus:ring-[#0B3D2E]/10"
          />
        </div>
        <div className="flex gap-1" role="tablist" aria-label="Filter conversations">
          {FILTERS.map((f) => {
            const n = f.value === 'unread' ? counts.unread : f.value === 'open' ? counts.open : null
            const active = filter === f.value
            return (
              <button
                key={f.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.value)}
                className={`inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-[11px] font-medium transition-colors ${
                  active ? 'bg-[#0B3D2E] text-white' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                {f.label}
                {n ? (
                  <span className={`rounded-full px-1.5 text-[10px] tabular-nums ${active ? 'bg-white/20' : 'bg-zinc-100 text-zinc-600'}`}>
                    {n}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {listQ.isLoading ? (
          <ul className="space-y-1 p-2" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex gap-3 rounded-lg p-2.5">
                <div className="h-9 w-9 animate-pulse rounded-full bg-zinc-100" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-100" />
                  <div className="h-2.5 w-4/5 animate-pulse rounded bg-zinc-100" />
                </div>
              </li>
            ))}
          </ul>
        ) : threads.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={q || filter ? 'No conversations match' : 'No conversations yet'}
            hint={q || filter ? 'Try another search or filter.' : 'Start a conversation with a parent or guardian.'}
          />
        ) : (
          <ul className="p-1.5">
            {threads.map((t) => {
              const active = String(t.id) === String(selectedId)
              const g = t.guardian || {}
              const unread = t.unread_count > 0
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(String(t.id))}
                    aria-current={active ? 'true' : undefined}
                    className={`flex w-full gap-3 rounded-lg p-2.5 text-left transition-colors ${
                      active ? 'bg-[#0B3D2E]/[0.07]' : 'hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0B3D2E] text-[12px] font-semibold text-white">
                      {initials(g.full_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className={`truncate text-[13px] ${unread ? 'font-semibold text-zinc-900' : 'font-medium text-zinc-800'}`}>
                          {g.full_name || 'Guardian'}
                        </p>
                        <span className={`shrink-0 text-[10px] tabular-nums ${unread ? 'font-semibold text-[#0B3D2E]' : 'text-zinc-400'}`}>
                          {shortTime(t.last_message_at)}
                        </span>
                      </div>
                      <p className="truncate text-[11px] text-zinc-500">
                        {[g.student?.full_name, g.student?.classroom].filter(Boolean).join(' · ') || g.relationship}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        {t.status === 'closed' ? <Lock className="h-3 w-3 shrink-0 text-zinc-400" /> : null}
                        <p className={`min-w-0 flex-1 truncate text-[12px] ${unread ? 'text-zinc-800' : 'text-zinc-500'}`}>
                          <span className="font-medium">{t.subject}</span>
                          {t.last_message_preview ? (
                            <span className="text-zinc-400">
                              {' — '}
                              {t.last_direction === 'outbound' ? 'You: ' : ''}
                              {t.last_message_preview}
                            </span>
                          ) : null}
                        </p>
                        {unread ? (
                          <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-[#0B3D2E] px-1 text-[10px] font-semibold text-white">
                            {t.unread_count}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

/* ── Conversation view ───────────────────────────────────────────── */

function Conversation({ threadId, onBack }) {
  const qc = useQueryClient()
  const replySheet = useDisclosure()
  const [body, setBody] = useState('')
  const [channels, setChannels] = useState(['portal'])
  const [reply, setReply] = useState({ channel: 'phone', body: '', received_at: '' })
  const scrollRef = useRef(null)

  const threadQ = useQuery({
    queryKey: ['comm', 'thread', threadId],
    queryFn: () => getParentThread(threadId),
    refetchInterval: 15_000,
  })
  const thread = threadQ.data?.thread
  const messages = useMemo(() => threadQ.data?.messages || [], [threadQ.data])
  // Day separator before the first message of each day
  const rows = useMemo(
    () => messages.map((m, i) => ({ m, day: dayLabel(m.sent_at), showDay: i === 0 || dayLabel(messages[i - 1].sent_at) !== dayLabel(m.sent_at) })),
    [messages],
  )
  const availability = threadQ.data?.channels || {}
  const guardian = thread?.guardian
  const blocks = guardianBlocks(guardian)

  // Keep the newest message in view
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length, threadId])

  const refresh = (data) => {
    if (data) qc.setQueryData(['comm', 'thread', threadId], data)
    qc.invalidateQueries({ queryKey: ['comm', 'threads'] })
    qc.invalidateQueries({ queryKey: ['comm', 'overview'] })
  }

  const sendMut = useMutation({
    mutationFn: () => sendParentMessage(threadId, { body: body.trim(), channels }),
    onSuccess: (data) => {
      setBody('')
      refresh(data)
      const email = data?.messages?.at(-1)?.delivery?.email
      if (email && email.status !== 'sent') toastError('Email not delivered', email.error || 'Check the email address')
    },
    onError: (e) => toastError('Message not sent', e?.message),
  })

  const statusMut = useMutation({
    mutationFn: (status) => updateParentThread(threadId, { status }),
    onSuccess: (_, status) => {
      toastSuccess(status === 'closed' ? 'Conversation closed' : 'Conversation reopened')
      qc.invalidateQueries({ queryKey: ['comm'] })
    },
    onError: (e) => toastError(e?.message || 'Update failed'),
  })

  const replyMut = useMutation({
    mutationFn: () =>
      logParentReply(threadId, {
        body: reply.body.trim(),
        channel: reply.channel,
        received_at: reply.received_at ? new Date(reply.received_at).toISOString() : undefined,
      }),
    onSuccess: (data) => {
      refresh(data)
      toastSuccess('Parent reply recorded')
      setReply({ channel: 'phone', body: '', received_at: '' })
      replySheet.onClose()
    },
    onError: (e) => toastError('Could not record reply', e?.message),
  })

  const canSend = body.trim().length > 0 && !sendMut.isPending
  const send = () => canSend && sendMut.mutate()

  if (threadQ.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner size="sm" color="primary" />
      </div>
    )
  }
  if (!thread) {
    return <EmptyState icon={Inbox} title="Conversation not found" hint={threadQ.error?.message} />
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3">
        <div className="flex min-w-0 items-start gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="-ml-1 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 lg:hidden"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : null}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0B3D2E] text-sm font-semibold text-white">
            {initials(guardian?.full_name)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-zinc-900">{guardian?.full_name}</h3>
              <span className="text-[11px] capitalize text-zinc-500">{guardian?.relationship}</span>
              <StatusPill status={thread.status} />
            </div>
            <p className="truncate text-[12px] text-zinc-600">
              {thread.subject}
              {guardian?.student ? (
                <span className="text-zinc-400">
                  {' · '}
                  {guardian.student.full_name}
                  {guardian.student.classroom ? ` (${guardian.student.classroom})` : ''}
                </span>
              ) : null}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-zinc-500">
              {guardian?.phone ? (
                <a href={`tel:${guardian.phone}`} className="inline-flex items-center gap-1 hover:text-[#0B3D2E]">
                  <Phone className="h-3 w-3" />
                  {guardian.phone}
                </a>
              ) : null}
              {guardian?.email ? (
                <a href={`mailto:${guardian.email}`} className="inline-flex items-center gap-1 hover:text-[#0B3D2E]">
                  <Mail className="h-3 w-3" />
                  {guardian.email}
                </a>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <FormButton
            appearance="bordered"
            className="h-8 min-h-8"
            startContent={<PhoneIncoming className="h-3.5 w-3.5" />}
            onPress={() => {
              setReply({ channel: 'phone', body: '', received_at: '' })
              replySheet.onOpen()
            }}
          >
            Log parent reply
          </FormButton>
          <FormButton
            appearance="light"
            className="h-8 min-h-8"
            isLoading={statusMut.isPending}
            startContent={statusMut.isPending ? null : thread.status === 'open' ? <Lock className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
            onPress={() => statusMut.mutate(thread.status === 'open' ? 'closed' : 'open')}
          >
            {thread.status === 'open' ? 'Close' : 'Reopen'}
          </FormButton>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-zinc-50/60 px-4 py-4" aria-live="polite">
        {rows.map(({ m, day, showDay }) => {
          const out = m.direction === 'outbound'
          return (
            <Fragment key={m.id}>
              {showDay ? (
                <div className="flex items-center gap-3 py-1" role="separator">
                  <div className="h-px flex-1 bg-zinc-200" />
                  <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">{day}</span>
                  <div className="h-px flex-1 bg-zinc-200" />
                </div>
              ) : null}
              <div className={`flex ${out ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[min(36rem,85%)] ${out ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div
                    className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${
                      out
                        ? 'rounded-br-md bg-[#0B3D2E] text-white'
                        : 'rounded-bl-md border border-zinc-200 bg-white text-zinc-800'
                    }`}
                  >
                    {m.body}
                  </div>
                  <div className={`flex items-center gap-2 px-1 text-[10px] text-zinc-400 ${out ? 'flex-row-reverse' : ''}`}>
                    <span title={fullTime(m.sent_at)}>{shortTime(m.sent_at)}</span>
                    {out ? (
                      <>
                        <span>{m.sender?.name}</span>
                        <DeliveryBadges delivery={m.delivery} channels={m.channels} />
                      </>
                    ) : (
                      <span>
                        Parent reply · {inboundLabel(m.channels?.[0])}
                        {m.delivery?.logged_by ? ` · logged by ${m.delivery.logged_by}` : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Fragment>
          )
        })}
      </div>

      {/* Composer */}
      <div className="border-t border-zinc-200 bg-white p-3">
        {thread.status === 'closed' ? (
          <p className="mb-2 text-[11px] text-zinc-500">This conversation is closed. Sending a message will reopen it.</p>
        ) : null}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              send()
            }
          }}
          rows={3}
          maxLength={5000}
          placeholder={`Message ${guardian?.full_name?.split(' ')[0] || 'the parent'}…`}
          aria-label="Message"
          className="block w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-[13px] text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#0B3D2E] focus:ring-2 focus:ring-[#0B3D2E]/10"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <ChannelPicker value={channels} onChange={setChannels} channels={availability} disabledReasons={blocks} />
          <div className="flex items-center gap-3">
            <span className="text-[11px] tabular-nums text-zinc-400">
              {body.length}
              {channels.includes('sms') ? ` · ${smsSegments(body)} SMS` : ''}
              <span className="ml-2 hidden sm:inline">Ctrl + Enter to send</span>
            </span>
            <FormButton
              className="h-8 min-h-8"
              isDisabled={!canSend}
              isLoading={sendMut.isPending}
              startContent={sendMut.isPending ? null : <Send className="h-3.5 w-3.5" />}
              onPress={send}
            >
              Send
            </FormButton>
          </div>
        </div>
      </div>

      <SideSheet
        isOpen={replySheet.isOpen}
        onOpenChange={replySheet.onOpenChange}
        title="Log parent reply"
        footer={(onClose) => (
          <>
            <FormButton appearance="light" onPress={onClose}>
              Cancel
            </FormButton>
            <FormButton isLoading={replyMut.isPending} isDisabled={!reply.body.trim()} onPress={() => replyMut.mutate()}>
              Save reply
            </FormButton>
          </>
        )}
      >
        <p className="text-xs text-zinc-500">
          Record what {guardian?.full_name || 'the parent'} said by phone, SMS, WhatsApp or in person so the whole team sees the full conversation.
        </p>
        <FormField label="Received via">
          <FormSelect value={reply.channel} onChange={(v) => setReply((r) => ({ ...r, channel: v || 'phone' }))} options={INBOUND_CHANNELS} />
        </FormField>
        <FormField label="Received at" hint="Leave empty if the parent replied just now">
          <FormInput
            type="datetime-local"
            value={reply.received_at}
            max={toLocalInput(new Date().toISOString())}
            onValueChange={(v) => setReply((r) => ({ ...r, received_at: v }))}
          />
        </FormField>
        <FormField label="What the parent said" required>
          <FormTextarea minRows={5} value={reply.body} onValueChange={(v) => setReply((r) => ({ ...r, body: v }))} />
        </FormField>
      </SideSheet>
    </div>
  )
}

/* ── New conversation sheet ──────────────────────────────────────── */

function NewConversationSheet({ isOpen, onOpenChange, onCreated }) {
  const [search, setSearch] = useState('')
  const [picked, setPicked] = useState(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [channels, setChannels] = useState(['portal', 'email'])
  const q = useDebounced(search.trim())

  const recipientsQ = useQuery({
    queryKey: ['comm', 'recipients', q],
    queryFn: () => searchMessageRecipients(q || undefined),
    enabled: isOpen && !picked,
    placeholderData: (prev) => prev,
  })
  const channelsQ = useQuery({ queryKey: ['comm', 'channels'], queryFn: getCommunicationChannels, enabled: isOpen })

  const reset = () => {
    setSearch('')
    setPicked(null)
    setSubject('')
    setBody('')
    setChannels(['portal', 'email'])
  }

  const mut = useMutation({
    mutationFn: () =>
      createParentThread({ guardian_id: picked.id, subject: subject.trim(), body: body.trim(), channels }),
    onSuccess: (data) => {
      toastSuccess('Message sent', picked?.full_name)
      onCreated(data)
      reset()
      onOpenChange(false)
    },
    onError: (e) => toastError('Message not sent', e?.message),
  })

  const blocks = guardianBlocks(picked)
  const valid = picked && subject.trim() && body.trim()

  return (
    <SideSheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) reset()
        onOpenChange(open)
      }}
      title="New message to parent"
      size="lg"
      footer={(onClose) => (
        <>
          <FormButton appearance="light" onPress={onClose}>
            Cancel
          </FormButton>
          <FormButton isDisabled={!valid} isLoading={mut.isPending} startContent={<Send className="h-3.5 w-3.5" />} onPress={() => mut.mutate()}>
            Send message
          </FormButton>
        </>
      )}
    >
      <FormField label="To" required>
        {picked ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-[#0B3D2E]/30 bg-[#0B3D2E]/[0.04] px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-zinc-900">
                {picked.full_name} <span className="font-normal capitalize text-zinc-500">· {picked.relationship}</span>
              </p>
              <p className="truncate text-[11px] text-zinc-500">
                {[picked.student?.full_name, picked.student?.classroom, picked.phone, picked.email].filter(Boolean).join(' · ')}
              </p>
            </div>
            <button type="button" onClick={() => setPicked(null)} className="shrink-0 text-[12px] font-medium text-[#0B3D2E] hover:underline">
              Change
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <FormInput
              value={search}
              onValueChange={setSearch}
              placeholder="Search parent name, phone, learner or admission no…"
              startContent={<Search className="h-3.5 w-3.5 text-zinc-400" />}
              autoFocus
            />
            <div className="max-h-64 overflow-y-auto rounded-lg border border-zinc-200">
              {recipientsQ.isLoading ? (
                <div className="flex justify-center py-6">
                  <Spinner size="sm" />
                </div>
              ) : (recipientsQ.data?.recipients || []).length === 0 ? (
                <p className="px-3 py-6 text-center text-[12px] text-zinc-500">No parents or guardians found.</p>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {recipientsQ.data.recipients.map((r) => (
                    <li key={r.id}>
                      <button type="button" onClick={() => setPicked(r)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-zinc-50">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-600">
                          {initials(r.full_name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-zinc-900">
                            {r.full_name} <span className="font-normal capitalize text-zinc-500">· {r.relationship}</span>
                          </p>
                          <p className="truncate text-[11px] text-zinc-500">
                            {[r.student?.full_name, r.student?.classroom, r.phone].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </FormField>
      <FormField label="Subject" required>
        <FormInput value={subject} onValueChange={setSubject} maxLength={200} placeholder="e.g. Homework follow-up" />
      </FormField>
      <FormField label="Message" required hint={`${body.length} characters${channels.includes('sms') ? ` · ${smsSegments(body)} SMS` : ''}`}>
        <FormTextarea minRows={6} value={body} onValueChange={setBody} maxLength={5000} />
      </FormField>
      <FormField label="Send via">
        <ChannelPicker value={channels} onChange={setChannels} channels={channelsQ.data?.channels || {}} disabledReasons={picked ? blocks : {}} />
      </FormField>
    </SideSheet>
  )
}

/* ── Page ────────────────────────────────────────────────────────── */

export default function MessagingInbox() {
  const location = useLocation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const newSheet = useDisclosure()
  const selectedId = new URLSearchParams(location.search).get('thread') || ''

  const select = (id) => {
    const params = new URLSearchParams(location.search)
    if (id) params.set('thread', id)
    else params.delete('thread')
    navigate(`${location.pathname}${params.toString() ? `?${params}` : ''}`, { replace: true })
  }

  return (
    <Card className="grid h-[calc(100dvh-15.5rem)] min-h-[460px] md:h-[calc(100vh-11.5rem)] md:min-h-[520px] overflow-hidden border border-zinc-200 shadow-none lg:grid-cols-[340px_minmax(0,1fr)]">
      <ThreadList
        selectedId={selectedId}
        onSelect={select}
        onNew={newSheet.onOpen}
        className={`lg:flex lg:border-r ${selectedId ? 'hidden' : 'flex'}`}
      />
      <div className={`min-h-0 min-w-0 flex-col ${selectedId ? 'flex' : 'hidden lg:flex'}`}>
        {selectedId ? (
          <Conversation key={selectedId} threadId={selectedId} onBack={() => select('')} />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              icon={MessageSquarePlus}
              title="Select a conversation"
              hint="Choose a conversation on the left, or start a new message to a parent or guardian."
              action={
                <FormButton className="h-8 min-h-8" startContent={<MessageSquarePlus className="h-3.5 w-3.5" />} onPress={newSheet.onOpen}>
                  New message
                </FormButton>
              }
            />
          </div>
        )}
      </div>

      <NewConversationSheet
        isOpen={newSheet.isOpen}
        onOpenChange={(open) => (open ? newSheet.onOpen() : newSheet.onClose())}
        onCreated={(data) => {
          qc.invalidateQueries({ queryKey: ['comm'] })
          if (data?.thread?.id) {
            qc.setQueryData(['comm', 'thread', String(data.thread.id)], data)
            select(String(data.thread.id))
          }
        }}
      />
    </Card>
  )
}
