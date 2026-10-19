import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Spinner } from '@heroui/react'
import dayjs from 'dayjs'
import { Send, Users } from 'lucide-react'
import SideSheet from '../../components/Layout/SideSheet.jsx'
import {
  FormButton,
  FormField,
  FormInput,
  FormMultiSelect,
  FormSelect,
  FormTextarea,
  ToggleRow,
} from '../../components/Form'
import { toastError, toastSuccess } from '../../components/Toast'
import {
  createAnnouncement,
  getCommunicationChannels,
  listClasses,
  previewAudience,
  updateAnnouncement,
} from '../../api/domain.js'
import { ChannelPicker, SegmentedControl } from './commComponents.jsx'
import { AUDIENCES, CATEGORIES, PRIORITIES, toLocalInput } from './commConstants.js'

const emptyDraft = (kind) => ({
  title: '',
  body: '',
  category: 'general',
  audience: kind === 'notice' ? 'all' : 'parents',
  classroom_ids: [],
  priority: 'normal',
  channels: kind === 'notice' ? ['portal'] : ['portal', 'email'],
  is_pinned: false,
  show_on_board: false,
  timing: 'now', // now | schedule
  publish_at: '',
  expires_at: '',
})

const fromItem = (item) => ({
  title: item.title || '',
  body: item.body || '',
  category: item.category || 'general',
  audience: item.audience || 'all',
  classroom_ids: (item.classroom_ids || []).map(String),
  priority: item.priority || 'normal',
  channels: item.channels || ['portal'],
  is_pinned: Boolean(item.is_pinned),
  show_on_board: Boolean(item.show_on_board),
  timing: item.status === 'scheduled' ? 'schedule' : 'now',
  publish_at: toLocalInput(item.publish_at),
  expires_at: toLocalInput(item.expires_at),
})

/**
 * Mount with a `key` per item so the form starts fresh each time it opens.
 *
 * Create / edit an announcement (kind="announcement") or notice-board post (kind="notice").
 */
export default function AnnouncementComposer({ kind = 'announcement', isOpen, onOpenChange, item = null }) {
  const qc = useQueryClient()
  const isNotice = kind === 'notice'
  const [form, setForm] = useState(() => (item ? fromItem(item) : emptyDraft(kind)))
  const [errors, setErrors] = useState({})
  const [confirming, setConfirming] = useState(false)
  const set = (k) => (v) => {
    setForm((f) => ({ ...f, [k]: v }))
    setConfirming(false)
  }

  const channelsQ = useQuery({ queryKey: ['comm', 'channels'], queryFn: getCommunicationChannels, enabled: isOpen })
  const classesQ = useQuery({ queryKey: ['academic', 'classes'], queryFn: listClasses, enabled: isOpen })
  const classOptions = (classesQ.data?.classes || []).map((c) => ({ value: String(c.id), label: c.name }))

  const previewParams = useMemo(
    () => ({ audience: form.audience, classroom_ids: form.audience === 'classes' ? form.classroom_ids : undefined }),
    [form.audience, form.classroom_ids],
  )
  const reachQ = useQuery({
    queryKey: ['comm', 'reach', previewParams],
    queryFn: () => previewAudience(previewParams),
    enabled: isOpen && (form.audience !== 'classes' || form.classroom_ids.length > 0),
    placeholderData: (prev) => prev,
  })
  const reach = form.audience === 'classes' && !form.classroom_ids.length ? null : reachQ.data?.summary

  const validate = (action) => {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.body.trim()) e.body = 'Message is required'
    if (form.audience === 'classes' && !form.classroom_ids.length) e.classroom_ids = 'Choose at least one class'
    if (action === 'schedule') {
      if (!form.publish_at) e.publish_at = 'Choose when to publish'
      else if (dayjs(form.publish_at).isBefore(dayjs())) e.publish_at = 'Choose a time in the future'
    }
    if (form.expires_at && form.publish_at && action === 'schedule' && dayjs(form.expires_at).isBefore(dayjs(form.publish_at))) {
      e.expires_at = 'Expiry must be after the publish time'
    }
    if (form.expires_at && action === 'publish' && dayjs(form.expires_at).isBefore(dayjs())) {
      e.expires_at = 'Expiry is in the past'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const mut = useMutation({
    mutationFn: (action) => {
      const payload = {
        title: form.title.trim(),
        body: form.body.trim(),
        category: form.category,
        audience: form.audience,
        classroom_ids: form.audience === 'classes' ? form.classroom_ids.map(Number) : null,
        priority: form.priority,
        channels: isNotice ? ['portal'] : form.channels,
        is_pinned: form.is_pinned,
        show_on_board: isNotice ? false : form.show_on_board,
        publish_at: action === 'schedule' && form.publish_at ? new Date(form.publish_at).toISOString() : null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        action,
      }
      return item ? updateAnnouncement(item.id, payload) : createAnnouncement({ ...payload, kind })
    },
    onSuccess: (data, action) => {
      qc.invalidateQueries({ queryKey: ['comm'] })
      const label = isNotice ? 'Notice' : 'Announcement'
      toastSuccess(
        action === 'publish' ? `${label} published` : action === 'schedule' ? `${label} scheduled` : 'Draft saved',
        action === 'publish' && !isNotice && data?.item?.recipients_count
          ? `Reaching ${data.item.recipients_count} people`
          : undefined,
      )
      onOpenChange(false)
    },
    onError: (e) => toastError('Not saved', e?.message),
  })

  const submit = (action) => {
    if (!validate(action)) return
    // Mass send: require a second click to confirm
    if (action === 'publish' && !isNotice && !confirming) {
      setConfirming(true)
      return
    }
    mut.mutate(action)
  }

  const primaryAction = form.timing === 'schedule' ? 'schedule' : 'publish'
  const editingPublished = item && item.status === 'published'

  return (
    <SideSheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="xl"
      title={item ? `Edit ${isNotice ? 'notice' : 'announcement'}` : isNotice ? 'Post a notice' : 'New announcement'}
      footer={(onClose) => (
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <FormButton appearance="light" onPress={onClose}>
            Cancel
          </FormButton>
          <div className="flex flex-wrap items-center gap-2">
            {!editingPublished ? (
              <FormButton appearance="bordered" isDisabled={mut.isPending} onPress={() => submit('draft')}>
                Save draft
              </FormButton>
            ) : null}
            {editingPublished ? (
              <FormButton isLoading={mut.isPending} onPress={() => mut.mutate(undefined)}>
                Save changes
              </FormButton>
            ) : (
              <FormButton
                className={confirming ? '!bg-amber-600' : ''}
                isLoading={mut.isPending}
                startContent={mut.isPending ? null : <Send className="h-3.5 w-3.5" />}
                onPress={() => submit(primaryAction)}
              >
                {primaryAction === 'schedule'
                  ? 'Schedule'
                  : confirming
                    ? `Confirm — send to ${reach?.total ?? '…'} people`
                    : isNotice
                      ? 'Publish to board'
                      : 'Publish now'}
              </FormButton>
            )}
          </div>
        </div>
      )}
    >
      {editingPublished ? (
        <p className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
          This {isNotice ? 'notice' : 'announcement'} is already published. You can change board settings (pin and expiry); the message itself was already delivered.
        </p>
      ) : null}

      <FormField label="Title" required error={errors.title}>
        <FormInput value={form.title} onValueChange={set('title')} maxLength={200} isInvalid={!!errors.title} isDisabled={editingPublished} />
      </FormField>
      <FormField label="Message" required error={errors.body} hint={`${form.body.length} characters`}>
        <FormTextarea minRows={6} value={form.body} onValueChange={set('body')} maxLength={10000} isInvalid={!!errors.body} isDisabled={editingPublished} />
      </FormField>

      {!editingPublished ? (
        <>
          <FormField label={isNotice ? 'Visible to' : 'Send to'}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {AUDIENCES.filter((a) => !isNotice || a.value !== 'classes').map((a) => {
                const active = form.audience === a.value
                return (
                  <button
                    key={a.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => set('audience')(a.value)}
                    className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                      active ? 'border-[#0B3D2E] bg-[#0B3D2E]/[0.05] ring-1 ring-[#0B3D2E]/30' : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <span className="block text-[13px] font-medium text-zinc-900">{a.label}</span>
                    <span className="block text-[11px] text-zinc-500">{a.hint}</span>
                  </button>
                )
              })}
            </div>
          </FormField>

          {form.audience === 'classes' ? (
            <FormField label="Classes" required error={errors.classroom_ids}>
              <FormMultiSelect
                placeholder={classesQ.isLoading ? 'Loading classes…' : 'Choose classes'}
                value={form.classroom_ids}
                onChange={set('classroom_ids')}
                options={classOptions}
                isInvalid={!!errors.classroom_ids}
                aria-label="Classes"
              />
            </FormField>
          ) : null}

          {!isNotice ? (
            <div className="flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-[12px] text-zinc-600">
              <Users className="h-4 w-4 shrink-0 text-zinc-400" />
              {reachQ.isFetching && !reach ? (
                <Spinner size="sm" />
              ) : reach ? (
                <span>
                  Reaches <strong className="text-zinc-900">{reach.total}</strong> people
                  {reach.guardians ? ` · ${reach.guardians} parents/guardians` : ''}
                  {reach.staff ? ` · ${reach.staff} staff` : ''}
                  <span className="text-zinc-400"> · {reach.with_email} with email · {reach.with_phone} with phone</span>
                </span>
              ) : (
                <span>Choose classes to see who this reaches.</span>
              )}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Priority">
              <SegmentedControl value={form.priority} onChange={set('priority')} options={PRIORITIES} />
            </FormField>
            {isNotice ? (
              <FormField label="Category">
                <FormSelect value={form.category} onChange={(v) => set('category')(v || 'general')} options={CATEGORIES} />
              </FormField>
            ) : null}
          </div>

          {!isNotice ? (
            <FormField label="Send via" hint="Portal is always included. Email goes to everyone with an address on file.">
              <ChannelPicker value={form.channels} onChange={set('channels')} channels={channelsQ.data?.channels || {}} />
            </FormField>
          ) : null}

          <FormField label="When">
            <SegmentedControl
              value={form.timing}
              onChange={set('timing')}
              options={[
                { value: 'now', label: 'Publish now' },
                { value: 'schedule', label: 'Schedule' },
              ]}
            />
          </FormField>
          {form.timing === 'schedule' ? (
            <FormField label="Publish at" required error={errors.publish_at}>
              <FormInput
                type="datetime-local"
                value={form.publish_at}
                min={toLocalInput(new Date().toISOString())}
                onValueChange={set('publish_at')}
                isInvalid={!!errors.publish_at}
              />
            </FormField>
          ) : null}
        </>
      ) : null}

      <div className="space-y-3 border-t border-zinc-100 pt-3">
        {!isNotice ? (
          <ToggleRow
            checked={form.show_on_board}
            onChange={set('show_on_board')}
            label="Also post on the notice board"
            description="Keeps this announcement visible on the board until it expires."
          />
        ) : null}
        {isNotice || form.show_on_board ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {!isNotice ? (
              <FormField label="Board category">
                <FormSelect value={form.category} onChange={(v) => set('category')(v || 'general')} options={CATEGORIES} isDisabled={editingPublished} />
              </FormField>
            ) : null}
            <FormField label="Expires" error={errors.expires_at} hint="Leave empty to keep it until archived">
              <FormInput type="datetime-local" value={form.expires_at} onValueChange={set('expires_at')} isInvalid={!!errors.expires_at} />
            </FormField>
            <div className="sm:col-span-2">
              <ToggleRow checked={form.is_pinned} onChange={set('is_pinned')} label="Pin to the top of the board" />
            </div>
          </div>
        ) : null}
      </div>
    </SideSheet>
  )
}
