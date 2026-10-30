import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, CardBody } from '@heroui/react'
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Inbox,
  Mail,
  Megaphone,
  MessageSquare,
  MessagesSquare,
  Monitor,
  Send,
  Smartphone,
} from 'lucide-react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import PageHeader from '../../components/Layout/PageHeader.jsx'
import DataTable from '../../components/Tables/DataTable.jsx'
import { FormButton } from '../../components/Form'
import { useAuth } from '../../auth'
import { getCommunicationOverview, getDeliveryLog, getNoticeBoard, listParentThreads } from '../../api/domain.js'
import MessagingInbox from './MessagingInbox.jsx'
import Announcements from './Announcements.jsx'
import NoticeBoard from './NoticeBoard.jsx'
import { CategoryPill, EmptyState } from './commComponents.jsx'
import { fullTime, initials, shortTime } from './commConstants.js'
import { ValueSkeleton } from '../../components/Loading'

const META = {
  '/communication': { title: 'Communication', section: 'overview', desc: 'Parent messaging, announcements and the notice board' },
  '/communication/messages': { title: 'Parent Messaging', section: 'messages', desc: 'Conversations with parents and guardians' },
  '/communication/announcements': { title: 'Announcements', section: 'announcements', desc: 'Broadcast updates to parents, guardians and staff' },
  '/communication/notice-board': { title: 'Notice Board', section: 'notice-board', desc: 'Notices for the school community' },
  '/communication/sms': { title: 'SMS', section: 'channel', channel: 'sms', desc: 'SMS delivery for messages and announcements' },
  '/communication/email': { title: 'Email', section: 'channel', channel: 'email', desc: 'Email delivery for messages and announcements' },
  '/communication/whatsapp': { title: 'WhatsApp', section: 'channel', channel: 'whatsapp', desc: 'WhatsApp messaging' },
  '/communication/push': { title: 'Push Notifications', section: 'channel', channel: 'push', desc: 'Mobile push notifications' },
}

function Stat({ label, value, icon, tone, onPress, hint }) {
  const Icon = icon
  return (
    <Card isPressable={Boolean(onPress)} onPress={onPress} className="h-full rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)] transition-colors hover:border-[#12544f]/30">
      <CardBody className="flex h-full flex-row items-center gap-3 p-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
        <div className="min-w-0 text-left">
          <p className="truncate text-[10px] font-medium uppercase tracking-wide text-zinc-400">{label}</p>
          <p className="text-base font-semibold tabular-nums text-zinc-900">{value}</p>
          {hint ? <p className="truncate text-[11px] text-zinc-400">{hint}</p> : null}
        </div>
      </CardBody>
    </Card>
  )
}

function ChannelStatus({ channels = {} }) {
  const navigate = useNavigate()
  const rows = [
    { key: 'portal', icon: Monitor, label: 'Portal', ...channels.portal },
    { key: 'email', icon: Mail, label: 'Email', ...channels.email },
    { key: 'sms', icon: MessageSquare, label: 'SMS', ...channels.sms, setup: '/admin/sms' },
    { key: 'whatsapp', icon: MessagesSquare, label: 'WhatsApp', available: false, note: 'Not integrated yet', setup: '/admin/whatsapp' },
  ]
  return (
    <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
      <CardBody className="p-0">
        <div className="border-b border-zinc-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-zinc-900">Delivery channels</h3>
        </div>
        <ul className="divide-y divide-zinc-100">
          {rows.map((r) => (
            <li key={r.key} className="flex items-center gap-3 px-4 py-2.5">
              <r.icon className="h-4 w-4 shrink-0 text-zinc-400" strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-zinc-900">{r.label}</p>
                {r.note ? <p className="truncate text-[11px] text-zinc-500">{r.note}</p> : null}
              </div>
              {r.available ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Ready
                </span>
              ) : r.setup ? (
                <button type="button" onClick={() => navigate(r.setup)} className="text-[11px] font-medium text-[#12544f] hover:underline">
                  Set up
                </button>
              ) : (
                <span className="text-[11px] text-zinc-400">Unavailable</span>
              )}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  )
}

function Overview() {
  const navigate = useNavigate()
  const { can } = useAuth()
  const canMessage = can('messaging', 'read')
  const canAnnounce = can('announcements', 'write')

  const overviewQ = useQuery({ queryKey: ['comm', 'overview'], queryFn: getCommunicationOverview, enabled: canMessage, refetchInterval: 30_000 })
  const boardQ = useQuery({ queryKey: ['comm', 'board', '', ''], queryFn: () => getNoticeBoard({}) })
  const threadsQ = useQuery({ queryKey: ['comm', 'threads', '', ''], queryFn: () => listParentThreads({}), enabled: canMessage })
  const s = overviewQ.data?.summary || {}
  const v = (x) => (overviewQ.isLoading ? <ValueSkeleton /> : String(x ?? 0))

  return (
    <div className="space-y-4">
      {canMessage ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6 [&>*]:min-w-0">
          <Stat label="Unread replies" value={v(s.unread_replies)} icon={Inbox} tone="bg-rose-50 text-rose-600" onPress={() => navigate('/communication/messages')} />
          <Stat label="Open conversations" value={v(s.open_threads)} icon={MessageSquare} tone="bg-emerald-50 text-emerald-700" onPress={() => navigate('/communication/messages')} />
          <Stat label="Messages sent" value={v(s.messages_sent_30d)} hint="Last 30 days" icon={Send} tone="bg-sky-50 text-sky-700" />
          <Stat label="Announcements" value={v(s.announcements_published)} hint="Published" icon={Megaphone} tone="bg-indigo-50 text-indigo-700" onPress={() => navigate('/communication/announcements')} />
          <Stat label="Scheduled" value={v(s.announcements_scheduled)} hint={s.announcements_draft ? `${s.announcements_draft} drafts` : undefined} icon={CalendarClock} tone="bg-amber-50 text-amber-800" onPress={() => navigate('/communication/announcements')} />
          <Stat label="Active notices" value={v(s.notices_active)} icon={ClipboardList} tone="bg-violet-50 text-violet-700" onPress={() => navigate('/communication/notice-board')} />
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_320px] [&>*]:min-w-0">
        {canMessage ? (
          <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
            <CardBody className="p-0">
              <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-zinc-900">Recent conversations</h3>
                <button type="button" onClick={() => navigate('/communication/messages')} className="text-[11px] font-medium text-[#12544f] hover:underline">
                  Open inbox
                </button>
              </div>
              {(threadsQ.data?.threads || []).length === 0 ? (
                <EmptyState icon={Inbox} title="No conversations yet" hint="Messages with parents appear here." />
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {threadsQ.data.threads.slice(0, 6).map((t) => (
                    <li key={t.id}>
                      <button type="button" onClick={() => navigate(`/communication/messages?thread=${t.id}`)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-zinc-50">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#12544f] text-[11px] font-semibold text-white">
                          {initials(t.guardian?.full_name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-[13px] ${t.unread_count ? 'font-semibold' : 'font-medium'} text-zinc-900`}>{t.guardian?.full_name}</p>
                          <p className="truncate text-[11px] text-zinc-500">{t.subject}</p>
                        </div>
                        <span className="shrink-0 text-[10px] text-zinc-400">{shortTime(t.last_message_at)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        ) : null}

        <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
          <CardBody className="p-0">
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-zinc-900">On the notice board</h3>
              <button type="button" onClick={() => navigate('/communication/notice-board')} className="text-[11px] font-medium text-[#12544f] hover:underline">
                View board
              </button>
            </div>
            {(boardQ.data?.items || []).length === 0 ? (
              <EmptyState icon={ClipboardList} title="No active notices" />
            ) : (
              <ul className="divide-y divide-zinc-100">
                {boardQ.data.items.slice(0, 6).map((n) => (
                  <li key={n.id} className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <CategoryPill category={n.category} />
                      <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-zinc-900">{n.title}</p>
                      <span className="shrink-0 text-[10px] text-zinc-400">{shortTime(n.published_at)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
            <CardBody className="space-y-2 p-4">
              <h3 className="text-sm font-semibold text-zinc-900">Quick actions</h3>
              {canMessage ? (
                <FormButton className="w-full justify-start" appearance="bordered" startContent={<MessageSquare className="h-4 w-4" />} onPress={() => navigate('/communication/messages')}>
                  Message a parent
                </FormButton>
              ) : null}
              {canAnnounce ? (
                <>
                  <FormButton className="w-full justify-start" appearance="bordered" startContent={<Megaphone className="h-4 w-4" />} onPress={() => navigate('/communication/announcements')}>
                    Send an announcement
                  </FormButton>
                  <FormButton className="w-full justify-start" appearance="bordered" startContent={<ClipboardList className="h-4 w-4" />} onPress={() => navigate('/communication/notice-board')}>
                    Post a notice
                  </FormButton>
                </>
              ) : null}
            </CardBody>
          </Card>
          {canMessage ? <ChannelStatus channels={overviewQ.data?.channels} /> : null}
        </div>
      </div>
    </div>
  )
}

function ChannelPage({ channel }) {
  const navigate = useNavigate()
  const overviewQ = useQuery({ queryKey: ['comm', 'overview'], queryFn: getCommunicationOverview })
  const hasLog = channel === 'email' || channel === 'sms'
  const logQ = useQuery({ queryKey: ['comm', 'delivery', channel], queryFn: () => getDeliveryLog({ channel }), enabled: hasLog })
  const info = overviewQ.data?.channels?.[channel]
  const counts = logQ.data?.counts || {}

  const columns = useMemo(
    () => [
      { accessorKey: 'recipient', header: 'Recipient', meta: { filter: false } },
      { accessorKey: 'title', header: 'Subject', Cell: ({ row }) => <span className="line-clamp-1">{row.original.title || '—'}</span> },
      {
        accessorKey: 'source_type',
        header: 'Source',
        Cell: ({ row }) => (row.original.source_type === 'announcement' ? 'Announcement' : 'Parent message'),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => {
          const st = row.original.status
          const cls = st === 'sent' ? 'bg-emerald-50 text-emerald-700' : st === 'queued' ? 'bg-sky-50 text-sky-700' : 'bg-rose-50 text-rose-700'
          return (
            <span title={row.original.error || ''} className={`inline-flex h-5 items-center rounded px-1.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
              {st}
            </span>
          )
        },
      },
      { accessorKey: 'sent_at', header: 'Time', Cell: ({ row }) => fullTime(row.original.sent_at) },
    ],
    [],
  )

  const unavailable = channel === 'whatsapp' || channel === 'push'
  const ready = !unavailable && info?.available

  return (
    <div className="space-y-4">
      <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
        <CardBody className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${ready ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
              {channel === 'email' ? <Mail className="h-5 w-5" /> : channel === 'push' ? <Smartphone className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
                {ready ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-zinc-400" />}
                {ready ? 'Connected' : unavailable ? 'Not available yet' : 'Not connected'}
              </p>
              <p className="text-[12px] text-zinc-500">
                {unavailable
                  ? channel === 'push'
                    ? 'Push notifications need the parent mobile app, which is not released yet.'
                    : 'WhatsApp Business API is not integrated yet. Use email and portal messages meanwhile.'
                  : info?.note || 'Checking…'}
              </p>
            </div>
          </div>
          {channel === 'sms' || channel === 'whatsapp' || channel === 'email' ? (
            <FormButton appearance="bordered" className="h-8 min-h-8 shrink-0" onPress={() => navigate(`/admin/${channel}`)}>
              Gateway settings
            </FormButton>
          ) : null}
        </CardBody>
      </Card>

      {hasLog ? (
        <>
          <div className="flex flex-wrap gap-2 text-[12px] text-zinc-600">
            {Object.entries(counts).map(([k, n]) => (
              <span key={k} className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 capitalize">
                {k}: <strong className="tabular-nums text-zinc-900">{n}</strong>
              </span>
            ))}
          </div>
          <DataTable
            columns={columns}
            data={logQ.data?.logs || []}
            isLoading={logQ.isLoading}
            enableRowSelection={false}
            emptyMessage={`No ${channel === 'sms' ? 'SMS' : 'email'} deliveries yet`}
            searchPlaceholder="Search recipient or subject…"
            onRefresh={() => logQ.refetch()}
            isRefreshing={logQ.isFetching}
          />
        </>
      ) : null}
    </div>
  )
}

export default function CommunicationWorkspace() {
  const { pathname } = useLocation()
  const meta = META[pathname] || META['/communication']

  let body
  switch (meta.section) {
    case 'messages':
      body = <MessagingInbox />
      break
    case 'announcements':
      body = <Announcements />
      break
    case 'notice-board':
      body = <NoticeBoard />
      break
    case 'channel':
      body = <ChannelPage key={meta.channel} channel={meta.channel} />
      break
    default:
      body = <Overview />
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title={meta.title}
          description={meta.desc}
          breadcrumbs={
            meta.section === 'overview'
              ? [{ label: 'Communication' }]
              : [{ label: 'Communication', href: '/communication' }, { label: meta.title }]
          }
        />
        {body}
      </div>
    </DashboardLayout>
  )
}
