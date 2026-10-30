import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardBody } from '@heroui/react'
import { ClipboardList, Clock, Pin, PinOff, Plus, Search } from 'lucide-react'
import DataTable from '../../components/Tables/DataTable.jsx'
import RowActionsMenu from '../../components/Tables/RowActionsMenu.jsx'
import SideSheet from '../../components/Layout/SideSheet.jsx'
import { FormButton } from '../../components/Form'
import { toastError, toastSuccess } from '../../components/Toast'
import { useAuth } from '../../auth'
import {
  archiveAnnouncement,
  deleteAnnouncement,
  getNoticeBoard,
  listAnnouncements,
  publishAnnouncement,
  updateAnnouncement,
} from '../../api/domain.js'
import AnnouncementComposer from './AnnouncementComposer.jsx'
import { CategoryPill, EmptyState, PriorityPill, SegmentedControl, StatusPill } from './commComponents.jsx'
import { CATEGORIES, categoryMeta, expiryLabel, fullTime, shortTime } from './commConstants.js'

function useDebounced(value, ms = 250) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

function NoticeCard({ n, canWrite, onOpen, onPin, onEdit, onArchive }) {
  const cat = categoryMeta(n.category)
  const exp = expiryLabel(n.expires_at)
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-sm">
      <div className={`h-1 w-full ${n.priority === 'urgent' ? 'bg-rose-500' : cat.bar}`} aria-hidden="true" />
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <CategoryPill category={n.category} />
            <PriorityPill priority={n.priority} />
            {n.kind === 'announcement' ? (
              <span className="inline-flex h-5 items-center rounded bg-zinc-100 px-1.5 text-[10px] font-semibold text-zinc-600">Announcement</span>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {n.is_pinned ? <Pin className="h-3.5 w-3.5 text-[#12544f]" aria-label="Pinned" /> : null}
            {canWrite ? (
              <RowActionsMenu
                label=""
                ariaLabel="Notice actions"
                items={[
                  { key: 'pin', label: n.is_pinned ? 'Unpin' : 'Pin to top', onPress: () => onPin(n) },
                  { key: 'edit', label: n.kind === 'notice' ? 'Edit' : 'Board settings', onPress: () => onEdit(n) },
                  { key: 'archive', label: 'Remove from board', color: 'warning', onPress: () => onArchive(n) },
                ]}
              />
            ) : null}
          </div>
        </div>
        <button type="button" onClick={() => onOpen(n)} className="text-left">
          <h3 className="text-[14px] font-semibold leading-snug text-zinc-900 group-hover:text-[#12544f]">{n.title}</h3>
          <p className="mt-1.5 line-clamp-5 whitespace-pre-line text-[13px] leading-relaxed text-zinc-600">{n.body}</p>
        </button>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3 text-[11px] text-zinc-400">
          <span title={fullTime(n.published_at)}>
            {shortTime(n.published_at)}
            {n.author?.name ? ` · ${n.author.name}` : ''}
          </span>
          {exp ? (
            <span className={`inline-flex items-center gap-1 ${exp.includes('today') || exp.includes('tomorrow') ? 'text-amber-700' : ''}`}>
              <Clock className="h-3 w-3" />
              {exp}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function Board({ canWrite, onCompose, onEdit }) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [reading, setReading] = useState(null)
  const q = useDebounced(search.trim())

  const boardQ = useQuery({
    queryKey: ['comm', 'board', q, category],
    queryFn: () => getNoticeBoard({ q: q || undefined, category: category || undefined }),
    placeholderData: (prev) => prev,
    refetchInterval: 60_000,
  })
  const items = boardQ.data?.items || []

  const act = useMutation({
    mutationFn: ({ n, action }) =>
      action === 'archive' ? archiveAnnouncement(n.id) : updateAnnouncement(n.id, { is_pinned: !n.is_pinned }),
    onSuccess: (_, { n, action }) => {
      qc.invalidateQueries({ queryKey: ['comm'] })
      toastSuccess(action === 'archive' ? 'Removed from the board' : n.is_pinned ? 'Unpinned' : 'Pinned to top')
    },
    onError: (e) => toastError(e?.message || 'Action failed'),
  })

  return (
    <div className="space-y-4">
      <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
        <CardBody className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notices…"
              aria-label="Search notices"
              className="h-8 w-full rounded-md border border-zinc-200 bg-white pl-8 pr-3 text-[12px] outline-none focus:border-[#12544f] focus:ring-2 focus:ring-[#12544f]/10"
            />
          </div>
          <div className="flex flex-1 flex-wrap gap-1.5" role="tablist" aria-label="Category">
            {[{ value: '', label: 'All' }, ...CATEGORIES].map((c) => (
              <button
                key={c.value}
                type="button"
                role="tab"
                aria-selected={category === c.value}
                onClick={() => setCategory(c.value)}
                className={`h-7 rounded-full px-3 text-[11px] font-medium transition-colors ${
                  category === c.value ? 'bg-[#12544f] text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          {canWrite ? (
            <FormButton className="h-8 min-h-8 shrink-0" startContent={<Plus className="h-3.5 w-3.5" />} onPress={onCompose}>
              Post notice
            </FormButton>
          ) : null}
        </CardBody>
      </Card>

      {boardQ.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl border border-zinc-200 bg-white" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white">
          <EmptyState
            icon={ClipboardList}
            title={q || category ? 'No notices match' : 'The notice board is empty'}
            hint={q || category ? 'Try another search or category.' : 'Post a notice for parents and staff — exam dates, events, fee reminders and more.'}
            action={
              canWrite && !q && !category ? (
                <FormButton startContent={<Plus className="h-4 w-4" />} onPress={onCompose}>
                  Post notice
                </FormButton>
              ) : null
            }
          />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((n) => (
            <NoticeCard
              key={n.id}
              n={n}
              canWrite={canWrite}
              onOpen={setReading}
              onPin={(x) => act.mutate({ n: x, action: 'pin' })}
              onEdit={onEdit}
              onArchive={(x) => window.confirm(`Remove “${x.title}” from the board?`) && act.mutate({ n: x, action: 'archive' })}
            />
          ))}
        </div>
      )}

      <SideSheet isOpen={Boolean(reading)} onOpenChange={(o) => !o && setReading(null)} title="Notice" size="lg">
        {reading ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <CategoryPill category={reading.category} />
              <PriorityPill priority={reading.priority} />
              {reading.is_pinned ? (
                <span className="inline-flex h-5 items-center gap-1 rounded bg-zinc-100 px-1.5 text-[10px] font-semibold text-zinc-600">
                  <Pin className="h-3 w-3" /> Pinned
                </span>
              ) : null}
            </div>
            <h3 className="text-lg font-semibold text-zinc-900">{reading.title}</h3>
            <p className="text-[11px] text-zinc-500">
              Posted {fullTime(reading.published_at)}
              {reading.author?.name ? ` by ${reading.author.name}` : ''}
              {reading.expires_at ? ` · ${expiryLabel(reading.expires_at)}` : ''}
            </p>
            <div className="whitespace-pre-wrap text-[14px] leading-relaxed text-zinc-800">{reading.body}</div>
          </div>
        ) : null}
      </SideSheet>
    </div>
  )
}

function ManageNotices({ canWrite, onCompose, onEdit }) {
  const qc = useQueryClient()
  const listQ = useQuery({ queryKey: ['comm', 'notices'], queryFn: () => listAnnouncements({ kind: 'notice' }) })
  const act = useMutation({
    mutationFn: ({ action, n }) =>
      action === 'publish'
        ? publishAnnouncement(n.id)
        : action === 'archive'
          ? archiveAnnouncement(n.id)
          : action === 'pin'
            ? updateAnnouncement(n.id, { is_pinned: !n.is_pinned })
            : deleteAnnouncement(n.id),
    onSuccess: (_, { action }) => {
      qc.invalidateQueries({ queryKey: ['comm'] })
      toastSuccess({ publish: 'Notice published', archive: 'Notice archived', pin: 'Pin updated', delete: 'Notice deleted' }[action])
    },
    onError: (e) => toastError(e?.message || 'Action failed'),
  })

  const columns = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Notice',
        size: 280,
        Cell: ({ row }) => (
          <span className="flex min-w-0 max-w-[26rem] items-center gap-1.5" title={row.original.title}>
            {row.original.is_pinned ? <Pin className="h-3 w-3 shrink-0 text-zinc-400" /> : null}
            <span className="truncate font-medium text-zinc-900">{row.original.title}</span>
            <PriorityPill priority={row.original.priority} />
          </span>
        ),
      },
      { accessorKey: 'category', header: 'Category', size: 110, Cell: ({ row }) => <CategoryPill category={row.original.category} /> },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 100,
        Cell: ({ row }) =>
          row.original.status === 'published' && row.original.is_expired ? (
            <span className="inline-flex h-5 items-center rounded bg-amber-50 px-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">Expired</span>
          ) : (
            <StatusPill status={row.original.status} />
          ),
      },
      {
        id: 'published',
        header: 'Posted',
        size: 100,
        accessorFn: (r) => r.published_at || r.publish_at || r.updated_at,
        Cell: ({ row }) => {
          const n = row.original
          const iso = n.status === 'scheduled' ? n.publish_at : n.published_at || n.updated_at
          return <span title={fullTime(iso)}>{n.status === 'scheduled' ? 'Posts ' : ''}{shortTime(iso)}</span>
        },
      },
      { id: 'expires', header: 'Expires', size: 150, accessorFn: (r) => r.expires_at, Cell: ({ row }) => (row.original.expires_at ? fullTime(row.original.expires_at) : 'Never') },
      {
        id: 'actions',
        header: '',
        size: 60,
        enableSorting: false,
        Cell: ({ row }) => {
          const n = row.original
          const pending = n.status === 'draft' || n.status === 'scheduled'
          return (
            <RowActionsMenu
              items={[
                { key: 'edit', label: 'Edit', show: canWrite && n.status !== 'archived', onPress: () => onEdit(n) },
                { key: 'publish', label: 'Publish now', color: 'primary', show: canWrite && pending, onPress: () => act.mutate({ action: 'publish', n }) },
                { key: 'pin', label: n.is_pinned ? 'Unpin' : 'Pin to top', show: canWrite && n.status === 'published', onPress: () => act.mutate({ action: 'pin', n }) },
                { key: 'archive', label: 'Archive', color: 'warning', show: canWrite && n.status === 'published', onPress: () => act.mutate({ action: 'archive', n }) },
                { key: 'delete', label: 'Delete', color: 'danger', show: canWrite && pending, onPress: () => window.confirm(`Delete “${n.title}”?`) && act.mutate({ action: 'delete', n }) },
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
    <DataTable
      columns={columns}
      data={listQ.data?.items || []}
      isLoading={listQ.isLoading}
      enableRowSelection={false}
      emptyMessage="No notices yet"
      searchPlaceholder="Search notices…"
      onRefresh={() => listQ.refetch()}
      isRefreshing={listQ.isFetching}
      toolbarActions={
        canWrite ? (
          <FormButton className="h-8 min-h-8" startContent={<Plus className="h-3.5 w-3.5" />} onPress={onCompose}>
            Post notice
          </FormButton>
        ) : null
      }
    />
  )
}

export default function NoticeBoard() {
  const { can } = useAuth()
  const canWrite = can('announcements', 'write')
  const [view, setView] = useState('board')
  const [composer, setComposer] = useState({ open: false, item: null, kind: 'notice', n: 0 })

  const compose = () => setComposer((c) => ({ open: true, item: null, kind: 'notice', n: c.n + 1 }))
  const edit = (item) => setComposer((c) => ({ open: true, item, kind: item.kind || 'notice', n: c.n + 1 }))

  return (
    <div className="space-y-4">
      {canWrite ? (
        <SegmentedControl
          value={view}
          onChange={setView}
          options={[
            { value: 'board', label: 'Board' },
            { value: 'manage', label: 'Manage notices' },
          ]}
        />
      ) : null}
      {view === 'board' ? (
        <Board canWrite={canWrite} onCompose={compose} onEdit={edit} />
      ) : (
        <ManageNotices canWrite={canWrite} onCompose={compose} onEdit={edit} />
      )}
      <AnnouncementComposer
        key={`notice-${composer.n}`}
        kind={composer.kind}
        isOpen={composer.open}
        item={composer.item}
        onOpenChange={(open) => setComposer((c) => ({ ...c, open }))}
      />
    </div>
  )
}
