import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Spinner } from '@heroui/react'
import { Megaphone, Pin, Plus } from 'lucide-react'
import DataTable from '../../components/Tables/DataTable.jsx'
import RowActionsMenu from '../../components/Tables/RowActionsMenu.jsx'
import SideSheet from '../../components/Layout/SideSheet.jsx'
import { FormButton } from '../../components/Form'
import { toastError, toastSuccess } from '../../components/Toast'
import { useAuth } from '../../auth'
import {
  archiveAnnouncement,
  deleteAnnouncement,
  getAnnouncement,
  listAnnouncements,
  publishAnnouncement,
} from '../../api/domain.js'
import AnnouncementComposer from './AnnouncementComposer.jsx'
import { CategoryPill, ChannelIcons, EmptyState, PriorityPill, StatusPill } from './commComponents.jsx'
import { audienceLabel, fullTime, shortTime } from './commConstants.js'

/** Delivery results for a published announcement. */
function DeliverySummary({ item }) {
  const d = item.delivery_summary || {}
  const cards = [
    { label: 'Audience', value: d.audience?.total ?? item.recipients_count, hint: [d.audience?.guardians ? `${d.audience.guardians} guardians` : null, d.audience?.staff ? `${d.audience.staff} staff` : null].filter(Boolean).join(' · ') },
    { label: 'Portal', value: d.portal?.recorded ?? '—', hint: 'Recorded on the school portal' },
  ]
  if (d.email) {
    cards.push({
      label: 'Email',
      value: d.email.pending ? 'Sending…' : `${d.email.sent ?? 0} sent`,
      hint: [d.email.failed ? `${d.email.failed} failed` : null, d.email.no_address ? `${d.email.no_address} without email` : null].filter(Boolean).join(' · ') || 'All delivered',
      tone: d.email.failed ? 'text-rose-600' : 'text-emerald-700',
    })
  }
  if (d.sms) {
    cards.push(
      d.sms.status === 'not_connected'
        ? { label: 'SMS', value: 'Not sent', hint: 'SMS gateway not connected', tone: 'text-zinc-500' }
        : {
            label: 'SMS',
            value: d.sms.pending ? 'Queuing…' : `${d.sms.queued ?? 0} queued`,
            hint: [d.sms.no_number ? `${d.sms.no_number} without a phone` : null, 'Awaiting gateway dispatch'].filter(Boolean).join(' · '),
            tone: 'text-sky-700',
          },
    )
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border border-zinc-200 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{c.label}</p>
          <p className={`text-base font-semibold tabular-nums ${c.tone || 'text-zinc-900'}`}>{c.value}</p>
          {c.hint ? <p className="truncate text-[11px] text-zinc-500">{c.hint}</p> : null}
        </div>
      ))}
    </div>
  )
}

function AnnouncementDetail({ id, isOpen, onOpenChange, onEdit }) {
  const detailQ = useQuery({
    queryKey: ['comm', 'announcement', id],
    queryFn: () => getAnnouncement(id),
    enabled: isOpen && Boolean(id),
    // Poll while email delivery is still running in the background
    refetchInterval: (q) => (q.state.data?.item?.delivery_summary?.email?.pending ? 2000 : false),
  })
  const item = detailQ.data?.item

  return (
    <SideSheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="lg"
      title="Announcement details"
      footer={(onClose) => (
        <>
          <FormButton appearance="light" onPress={onClose}>
            Close
          </FormButton>
          {item && item.status !== 'archived' ? (
            <FormButton appearance="bordered" onPress={() => onEdit(item)}>
              {item.status === 'published' ? 'Board settings' : 'Edit'}
            </FormButton>
          ) : null}
        </>
      )}
    >
      {!item ? (
        <div className="flex justify-center py-10">
          <Spinner size="sm" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusPill status={item.status} />
            <PriorityPill priority={item.priority} />
            {item.show_on_board ? <CategoryPill category={item.category} /> : null}
            {item.is_pinned ? (
              <span className="inline-flex h-5 items-center gap-1 rounded bg-zinc-100 px-1.5 text-[10px] font-semibold text-zinc-600">
                <Pin className="h-3 w-3" /> Pinned
              </span>
            ) : null}
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-900">{item.title}</h3>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              {audienceLabel(item.audience)}
              {item.audience === 'classes' ? ` (${item.classroom_ids.length})` : ''}
              {' · '}
              {item.status === 'scheduled' ? `Scheduled for ${fullTime(item.publish_at)}` : item.published_at ? `Published ${fullTime(item.published_at)}` : `Draft by ${item.author?.name || '—'}`}
              {item.publisher?.name ? ` by ${item.publisher.name}` : ''}
            </p>
          </div>
          <div className="whitespace-pre-wrap rounded-lg bg-zinc-50 px-3.5 py-3 text-[13px] leading-relaxed text-zinc-800">{item.body}</div>
          {item.status === 'published' ? (
            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Delivery</h4>
              <DeliverySummary item={item} />
            </div>
          ) : null}
        </div>
      )}
    </SideSheet>
  )
}

export default function Announcements() {
  const qc = useQueryClient()
  const { can } = useAuth()
  const canWrite = can('announcements', 'write')
  const [composer, setComposer] = useState({ open: false, item: null, n: 0 })
  const [detailId, setDetailId] = useState(null)

  const listQ = useQuery({ queryKey: ['comm', 'announcements'], queryFn: () => listAnnouncements({ kind: 'announcement' }) })
  const items = listQ.data?.items || []

  const act = useMutation({
    mutationFn: ({ action, id }) =>
      action === 'publish' ? publishAnnouncement(id) : action === 'archive' ? archiveAnnouncement(id) : deleteAnnouncement(id),
    onSuccess: (data, { action }) => {
      qc.invalidateQueries({ queryKey: ['comm'] })
      toastSuccess(
        action === 'publish' ? 'Announcement published' : action === 'archive' ? 'Announcement archived' : 'Draft deleted',
        action === 'publish' && data?.item?.recipients_count ? `Reaching ${data.item.recipients_count} people` : undefined,
      )
    },
    onError: (e) => toastError(e?.message || 'Action failed'),
  })

  const openComposer = (item = null) => setComposer((c) => ({ open: true, item, n: c.n + 1 }))

  const columns = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Announcement',
        size: 280,
        Cell: ({ row }) => {
          const a = row.original
          return (
            <button type="button" onClick={() => setDetailId(a.id)} className="block w-full min-w-0 max-w-[20rem] text-left" title={a.title}>
              <span className="flex min-w-0 items-center gap-1.5">
                {a.is_pinned ? <Pin className="h-3 w-3 shrink-0 text-zinc-400" /> : null}
                <span className="truncate font-medium text-zinc-900 hover:text-[#0B3D2E] hover:underline">{a.title}</span>
                <PriorityPill priority={a.priority} />
              </span>
              <span className="block truncate text-[11px] text-zinc-500">{a.body}</span>
            </button>
          )
        },
      },
      {
        accessorKey: 'audience',
        header: 'Audience',
        size: 130,
        Cell: ({ row }) => (
          <span>
            {audienceLabel(row.original.audience)}
            {row.original.audience === 'classes' ? ` (${row.original.classroom_ids.length})` : ''}
          </span>
        ),
      },
      { accessorKey: 'channels', header: 'Channels', size: 80, enableSorting: false, Cell: ({ row }) => <ChannelIcons channels={row.original.channels} /> },
      { accessorKey: 'status', header: 'Status', size: 100, Cell: ({ row }) => <StatusPill status={row.original.status} /> },
      {
        accessorKey: 'recipients_count',
        header: 'Reached',
        size: 80,
        Cell: ({ row }) => (row.original.status === 'published' ? <span className="tabular-nums">{row.original.recipients_count}</span> : '—'),
      },
      {
        id: 'when',
        header: 'Date',
        size: 100,
        accessorFn: (r) => r.published_at || r.publish_at || r.updated_at,
        Cell: ({ row }) => {
          const a = row.original
          const iso = a.status === 'scheduled' ? a.publish_at : a.published_at || a.updated_at
          return (
            <span title={fullTime(iso)} className="whitespace-nowrap">
              {a.status === 'scheduled' ? 'Sends ' : ''}
              {shortTime(iso)}
            </span>
          )
        },
      },
      {
        id: 'author',
        header: 'By',
        size: 130,
        accessorFn: (r) => r.author?.name || '—',
        Cell: ({ row }) => (
          <span className="block max-w-[9rem] truncate" title={row.original.author?.name}>
            {row.original.author?.name || '—'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 60,
        enableSorting: false,
        Cell: ({ row }) => {
          const a = row.original
          const pending = a.status === 'draft' || a.status === 'scheduled'
          return (
            <RowActionsMenu
              items={[
                { key: 'view', label: 'View details', onPress: () => setDetailId(a.id) },
                { key: 'edit', label: 'Edit', show: canWrite && pending, onPress: () => openComposer(a) },
                {
                  key: 'publish',
                  label: 'Publish now',
                  color: 'primary',
                  show: canWrite && pending,
                  onPress: () => {
                    if (window.confirm(`Publish “${a.title}” now? It will be delivered to its audience immediately.`)) act.mutate({ action: 'publish', id: a.id })
                  },
                },
                { key: 'board', label: 'Board settings', show: canWrite && a.status === 'published', onPress: () => openComposer(a) },
                { key: 'archive', label: 'Archive', color: 'warning', show: canWrite && a.status === 'published', onPress: () => act.mutate({ action: 'archive', id: a.id }) },
                {
                  key: 'delete',
                  label: 'Delete',
                  color: 'danger',
                  show: canWrite && pending,
                  onPress: () => window.confirm(`Delete “${a.title}”?`) && act.mutate({ action: 'delete', id: a.id }),
                },
              ]}
            />
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canWrite],
  )

  return (
    <>
      {!listQ.isLoading && items.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white">
          <EmptyState
            icon={Megaphone}
            title="No announcements yet"
            hint="Send school-wide or class updates to parents and staff by portal and email, and optionally post them on the notice board."
            action={
              canWrite ? (
                <FormButton startContent={<Plus className="h-4 w-4" />} onPress={() => openComposer()}>
                  New announcement
                </FormButton>
              ) : null
            }
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={items}
          isLoading={listQ.isLoading}
          enableRowSelection={false}
          emptyMessage="No announcements"
          searchPlaceholder="Search announcements…"
          onRefresh={() => listQ.refetch()}
          isRefreshing={listQ.isFetching}
          toolbarActions={
            canWrite ? (
              <FormButton className="h-8 min-h-8" startContent={<Plus className="h-3.5 w-3.5" />} onPress={() => openComposer()}>
                New announcement
              </FormButton>
            ) : null
          }
        />
      )}

      <AnnouncementComposer
        key={`composer-${composer.n}`}
        kind="announcement"
        isOpen={composer.open}
        item={composer.item}
        onOpenChange={(open) => setComposer((c) => ({ ...c, open }))}
      />
      <AnnouncementDetail
        id={detailId}
        isOpen={Boolean(detailId)}
        onOpenChange={(open) => !open && setDetailId(null)}
        onEdit={(item) => {
          setDetailId(null)
          openComposer(item)
        }}
      />
    </>
  )
}
