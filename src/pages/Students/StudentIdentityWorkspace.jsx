import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardBody, Chip, Spinner } from '@heroui/react'
import {
  Check,
  IdCard,
  Printer,
  QrCode,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import PageHeader from '../../components/Layout/PageHeader.jsx'
import {
  FormButton,
  FormField,
  FormInput,
  FormSelect,
} from '../../components/Form'
import { toastError, toastSuccess } from '../../components/Toast'
import {
  getIdCardSettings,
  issueStudentIdCards,
  listClasses,
  listIdCardTemplates,
  listIdentityRoster,
  markIdCardsPrinted,
  updateIdCardSettings,
} from '../../api/domain.js'
import { code128Svg } from '../../utils/barcode128.js'
import { qrDataUrl } from '../../utils/qrcode.js'

const META = {
  '/students/qr': {
    title: 'QR / Barcode',
    section: 'qr',
    desc: 'Generate scannable QR codes and Code-128 barcodes for student identity',
  },
  '/students/id-cards': {
    title: 'ID Cards',
    section: 'cards',
    desc: 'Design templates and print industrial student identity cards',
  },
}

const TEMPLATE_STYLES = {
  classic_green: {
    shell: 'bg-white text-slate-900 border border-slate-200',
    header: 'bg-[#0B3D2E] text-white',
    accent: 'text-[#0B3D2E]',
    stripe: 'bg-[#0B3D2E]',
    chip: 'bg-emerald-50 text-emerald-800',
    photo: 'bg-[#0B3D2E]/10 text-[#0B3D2E]',
    footer: 'bg-slate-50 text-slate-500',
  },
  modern_navy: {
    shell: 'bg-white text-slate-900 border border-slate-200',
    header: 'bg-[#1E3A5F] text-white',
    accent: 'text-[#1E3A5F]',
    stripe: 'bg-[#1E3A5F]',
    chip: 'bg-sky-50 text-sky-800',
    photo: 'bg-sky-100 text-sky-900',
    footer: 'bg-slate-50 text-slate-500',
  },
  tanzania_pride: {
    shell: 'bg-white text-slate-900 border border-slate-200',
    header: 'bg-gradient-to-r from-[#1EB53A] via-[#FCD116] to-[#00A3DD] text-slate-900',
    accent: 'text-[#0B3D2E]',
    stripe: 'bg-[#1EB53A]',
    chip: 'bg-amber-50 text-amber-900',
    photo: 'bg-emerald-50 text-emerald-800',
    footer: 'bg-slate-50 text-slate-600',
  },
  minimal_slate: {
    shell: 'bg-slate-50 text-slate-900 border border-slate-300',
    header: 'bg-slate-700 text-white',
    accent: 'text-slate-800',
    stripe: 'bg-slate-500',
    chip: 'bg-slate-200 text-slate-800',
    photo: 'bg-slate-200 text-slate-700',
    footer: 'bg-white text-slate-500',
  },
  premium_gold: {
    shell: 'bg-stone-900 text-stone-50 border border-amber-600/50',
    header: 'bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-amber-300 border-b border-amber-600/40',
    accent: 'text-amber-300',
    stripe: 'bg-amber-500',
    chip: 'bg-amber-500/15 text-amber-200',
    photo: 'bg-stone-800 text-amber-200 border border-amber-600/30',
    footer: 'bg-stone-950 text-stone-400',
  },
}

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?'
}

function QrImage({ payload, size = 96, dark }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    let live = true
    qrDataUrl(payload, { size, dark: dark || '#0f172a' })
      .then((url) => {
        if (live) setSrc(url)
      })
      .catch(() => {
        if (live) setSrc('')
      })
    return () => {
      live = false
    }
  }, [payload, size, dark])

  if (!src) {
    return (
      <div
        className="flex items-center justify-center rounded bg-white text-[9px] text-slate-400"
        style={{ width: size, height: size }}
      >
        QR…
      </div>
    )
  }
  return (
    <img
      src={src}
      alt="QR code"
      width={size}
      height={size}
      className="rounded bg-white"
    />
  )
}

function BarcodeImage({ value, height = 36 }) {
  const svg = useMemo(
    () => code128Svg(value, { height, moduleWidth: 1.15, showText: true }),
    [value, height],
  )
  return (
    <div
      className="inline-block max-w-full overflow-hidden bg-white px-1 py-0.5"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

/** CR80-ish student ID card preview / print unit */
function StudentIdCardFace({
  student,
  school,
  templateKey,
  cardNumber,
  barcodeValue,
  qrPayload,
  expiresOn,
  issuedOn,
  settings,
  compact = false,
}) {
  const style = TEMPLATE_STYLES[templateKey] || TEMPLATE_STYLES.classic_green
  const name = student?.full_name || 'Student Name'
  const adm = student?.admission_number || '—'
  const klass = student?.classroom?.name || student?.classroom || '—'
  const schoolName = school?.name || 'School Name'
  const schoolCode = school?.code || school?.emis_code || ''
  // Slightly larger CR80-ish canvas so name, class, QR and barcode read clearly
  const w = compact ? 360 : 400
  const h = compact ? 228 : 252
  const qrSize = compact ? 72 : 80
  const photoH = compact ? 72 : 80
  const photoW = compact ? 64 : 70

  return (
    <div
      className={`id-card relative overflow-hidden rounded-xl shadow-md ${style.shell}`}
      style={{ width: w, height: h }}
    >
      <div className={`px-3.5 py-2.5 ${style.header}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-wider opacity-90">
              Student Identity Card
            </p>
            <p className="truncate text-[15px] font-bold leading-tight">{schoolName}</p>
            {schoolCode ? (
              <p className="truncate text-[11px] opacity-80">{schoolCode}</p>
            ) : null}
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px] font-bold">
            {(schoolName || 'S').slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>
      <div className={`h-1 w-full ${style.stripe}`} />

      <div className="flex gap-3 px-3.5 py-3">
        <div
          className={`flex shrink-0 items-center justify-center rounded-lg text-base font-bold ${style.photo}`}
          style={{ width: photoW, height: photoH }}
        >
          {initials(name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-[14px] font-bold leading-snug ${style.accent}`}>
            {name}
          </p>
          <p className="mt-0.5 font-mono text-[12px] opacity-80">{adm}</p>
          <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] leading-tight">
            <span className="opacity-60">Class</span>
            <span className="truncate font-medium">{klass}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-1">
          <QrImage
            payload={qrPayload || adm}
            size={qrSize}
            dark={templateKey === 'premium_gold' ? '#1c1917' : '#0f172a'}
          />
        </div>
      </div>

      <div
        className={`absolute bottom-0 left-0 right-0 flex items-center justify-between px-3.5 py-2 text-[10px] ${style.footer}`}
      >
        <span className="truncate max-w-[58%]">
          {settings?.front_footer || 'School property — return if found'}
        </span>
        <span className="shrink-0 opacity-80">
          {issuedOn ? `Iss ${String(issuedOn).slice(0, 10)}` : ''}
          {expiresOn ? ` · Exp ${String(expiresOn).slice(0, 10)}` : ''}
        </span>
      </div>
    </div>
  )
}

function TemplatePicker({ templates, value, onChange }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {(templates || []).map((t) => {
        const selected = value === t.key
        const colors = t.preview_colors || ['#0B3D2E', '#fff', '#e5e5e5']
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={`rounded-xl border p-3 text-left transition-all ${
              selected
                ? 'border-[#0B3D2E] ring-2 ring-[#0B3D2E]/25 shadow-sm'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="mb-2 flex h-10 overflow-hidden rounded-md">
              {colors.map((c, i) => (
                <div key={i} className="flex-1" style={{ background: c }} />
              ))}
            </div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                <p className="mt-0.5 text-[11px] text-slate-500 leading-snug">
                  {t.description}
                </p>
              </div>
              {selected ? (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0B3D2E] text-white">
                  <Check className="h-3 w-3" />
                </span>
              ) : null}
            </div>
          </button>
        )
      })}
    </div>
  )
}

const PAGE_SIZE_OPTIONS = [
  { value: '8', label: '8 / page' },
  { value: '12', label: '12 / page' },
  { value: '16', label: '16 / page' },
  { value: '24', label: '24 / page' },
]

function useIdentityData(classroomId, q, page, perPage) {
  return useQuery({
    queryKey: ['students', 'identity', 'roster', classroomId, q, page, perPage],
    queryFn: () =>
      listIdentityRoster({
        status: 'active',
        classroom_id: classroomId || undefined,
        q: q || undefined,
        page,
        per_page: perPage,
      }),
  })
}

function IdentityPage({ mode }) {
  const qc = useQueryClient()
  const [classroomId, setClassroomId] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(12)
  const [selected, setSelected] = useState(() => new Set())
  const [templateKey, setTemplateKey] = useState('classic_green')

  const classesQ = useQuery({
    queryKey: ['academic', 'classes'],
    queryFn: listClasses,
    staleTime: 60_000,
  })
  const templatesQ = useQuery({
    queryKey: ['identity', 'templates'],
    queryFn: listIdCardTemplates,
    staleTime: 120_000,
  })
  const settingsQ = useQuery({
    queryKey: ['identity', 'settings'],
    queryFn: getIdCardSettings,
    staleTime: 60_000,
  })
  const rosterQ = useIdentityData(classroomId, search, page, perPage)

  const templates = templatesQ.data?.templates || []
  const settings = settingsQ.data?.settings
  const school = rosterQ.data?.school
  const students = rosterQ.data?.students || []
  const summary = rosterQ.data?.summary || {}
  const meta = rosterQ.data?.meta || {
    current_page: 1,
    last_page: 1,
    per_page: perPage,
    total: 0,
    from: null,
    to: null,
  }

  useEffect(() => {
    if (settings?.default_template) {
      setTemplateKey(settings.default_template)
    }
  }, [settings?.default_template])

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1)
    setSelected(new Set())
  }, [classroomId, search, perPage])

  const issueMut = useMutation({
    mutationFn: issueStudentIdCards,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['students', 'identity'] })
      toastSuccess(`${data?.count ?? 0} ID card(s) issued`)
      setSelected(new Set())
    },
    onError: (e) => toastError(e?.message || 'Issue failed'),
  })

  const printMut = useMutation({
    mutationFn: markIdCardsPrinted,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students', 'identity'] })
    },
  })

  const settingsMut = useMutation({
    mutationFn: updateIdCardSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['identity', 'settings'] })
      toastSuccess('Default template saved')
    },
    onError: (e) => toastError(e?.message || 'Save failed'),
  })

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === students.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(students.map((s) => s.student_id)))
    }
  }

  const selectedRows = students.filter((s) => selected.has(s.student_id))

  const issueSelected = (reissue = false) => {
    const ids = [...selected]
    if (!ids.length) {
      toastError('Select at least one student')
      return
    }
    issueMut.mutate({
      student_ids: ids,
      template_key: templateKey,
      reissue,
    })
  }

  const handlePrint = () => {
    const cardIds = selectedRows
      .map((s) => s.card?.id)
      .filter(Boolean)
    if (cardIds.length) {
      printMut.mutate(cardIds)
    }
    window.print()
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 print:hidden">
        {[
          { l: 'In roster', v: summary.total ?? students.length, icon: IdCard },
          { l: 'With card', v: summary.with_card ?? 0, icon: ShieldCheck },
          { l: 'Without card', v: summary.without_card ?? 0, icon: QrCode },
          { l: 'Selected', v: selected.size, icon: Check },
        ].map((x) => {
          const Icon = x.icon
          return (
            <Card key={x.l} className="border border-slate-200 shadow-none">
              <CardBody className="flex flex-row items-center gap-2.5 p-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B3D2E]/8 text-[#0B3D2E]">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">{x.l}</p>
                  <p className="text-base font-semibold tabular-nums">{rosterQ.isLoading ? '…' : x.v}</p>
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>

      {/* Template picker — ID cards mode always; QR mode shows compact */}
      <div className="print:hidden space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {mode === 'cards' ? 'Choose card template' : 'Card style for QR sheets'}
            </h2>
            <p className="text-xs text-slate-500">
              Sample industrial designs — pick one before issuing or printing
            </p>
          </div>
          {mode === 'cards' ? (
            <FormButton
              appearance="bordered"
              size="sm"
              onPress={() =>
                settingsMut.mutate({ default_template: templateKey })
              }
              isLoading={settingsMut.isPending}
            >
              Save as school default
            </FormButton>
          ) : null}
        </div>
        <TemplatePicker
          templates={templates}
          value={templateKey}
          onChange={setTemplateKey}
        />
      </div>

      {/* Filters + actions */}
      <div className="flex flex-wrap items-end gap-2 print:hidden">
        <FormField label="Class" className="w-44">
          <FormSelect
            options={[
              { value: '', label: 'All classes' },
              ...(classesQ.data?.classes || []).map((c) => ({
                value: String(c.id),
                label: c.name,
              })),
            ]}
            value={classroomId}
            onChange={setClassroomId}
          />
        </FormField>
        <FormField label="Search" className="min-w-[180px] flex-1">
          <FormInput
            placeholder="Name or admission no…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </FormField>
        <FormField label="Per page" className="w-32">
          <FormSelect
            options={PAGE_SIZE_OPTIONS}
            value={String(perPage)}
            onChange={(v) => setPerPage(Number(v) || 12)}
          />
        </FormField>
        <FormButton
          appearance="bordered"
          startContent={<RefreshCw className="h-4 w-4" />}
          onPress={() => rosterQ.refetch()}
        >
          Refresh
        </FormButton>
        <FormButton appearance="bordered" onPress={selectAll}>
          {selected.size === students.length && students.length ? 'Clear' : 'Select page'}
        </FormButton>
        <FormButton
          className="bg-[#0B3D2E]"
          color="primary"
          isLoading={issueMut.isPending}
          onPress={() => issueSelected(false)}
        >
          Issue cards
        </FormButton>
        <FormButton
          appearance="bordered"
          isLoading={issueMut.isPending}
          onPress={() => issueSelected(true)}
        >
          Re-issue
        </FormButton>
        <FormButton
          appearance="bordered"
          startContent={<Printer className="h-4 w-4" />}
          onPress={handlePrint}
          isDisabled={!selected.size}
        >
          Print selected
        </FormButton>
      </div>

      {rosterQ.isLoading ? (
        <div className="flex justify-center py-16 print:hidden">
          <Spinner color="success" />
        </div>
      ) : students.length === 0 ? (
        <p className="text-sm text-slate-500 print:hidden">
          No active students match this filter.
        </p>
      ) : (
        <>
          {/* Screen grid */}
          <div
            className={
              mode === 'cards'
                ? 'grid grid-cols-1 gap-4 print:hidden md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3'
                : 'grid grid-cols-1 gap-3 print:hidden sm:grid-cols-2 xl:grid-cols-3'
            }
          >
            {students.map((row) => {
              const isOn = selected.has(row.student_id)
              return (
                <div
                  key={row.student_id}
                  className={`flex flex-col gap-3 rounded-xl border p-3 transition-colors ${
                    isOn
                      ? 'border-[#0B3D2E]/40 bg-[#0B3D2E]/[0.03]'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <label className="flex cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={isOn}
                      onChange={() => toggle(row.student_id)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {row.full_name}
                        </p>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={row.has_card ? 'success' : 'warning'}
                        >
                          {row.has_card ? 'Card issued' : 'No card yet'}
                        </Chip>
                      </div>
                      <p className="font-mono text-xs text-slate-500">
                        {row.admission_number || '—'}
                        {row.classroom?.name ? ` · ${row.classroom.name}` : ''}
                      </p>
                    </div>
                  </label>

                  <div className="flex justify-center">
                    {mode === 'qr' ? (
                      <div className="flex w-full flex-col items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                        <QrImage payload={row.qr_payload} size={120} />
                        <div className="w-full overflow-x-auto text-center">
                          <p className="mb-1 text-[10px] font-medium uppercase text-slate-400">
                            Code 128 barcode
                          </p>
                          <BarcodeImage value={row.barcode_value} height={42} />
                          {row.card?.card_number ? (
                            <p className="mt-1 font-mono text-[10px] text-slate-500">
                              {row.card.card_number}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <StudentIdCardFace
                        student={row}
                        school={school}
                        templateKey={row.card?.template_key || templateKey}
                        cardNumber={row.card?.card_number}
                        barcodeValue={row.barcode_value}
                        qrPayload={row.qr_payload}
                        issuedOn={row.card?.issued_on}
                        expiresOn={row.card?.expires_on}
                        settings={settings}
                        compact
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 print:hidden">
            <p className="text-xs text-slate-500">
              {meta.from != null && meta.to != null
                ? `Showing ${meta.from}–${meta.to} of ${meta.total}`
                : `${meta.total || 0} students`}
              {selected.size ? ` · ${selected.size} selected` : ''}
            </p>
            <div className="flex items-center gap-2">
              <FormButton
                appearance="bordered"
                isDisabled={page <= 1 || rosterQ.isFetching}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </FormButton>
              <span className="min-w-[5.5rem] text-center text-xs font-medium text-slate-700">
                Page {meta.current_page || page} / {meta.last_page || 1}
              </span>
              <FormButton
                appearance="bordered"
                isDisabled={
                  page >= (meta.last_page || 1) || rosterQ.isFetching
                }
                onPress={() =>
                  setPage((p) => Math.min(meta.last_page || 1, p + 1))
                }
              >
                Next
              </FormButton>
            </div>
          </div>

          {/* Print area */}
          <div className="hidden print:block">
            <div className="mb-4 text-center">
              <h1 className="text-lg font-bold">{school?.name}</h1>
              <p className="text-xs text-slate-600">
                {mode === 'qr' ? 'Student QR / Barcode sheet' : 'Student ID Cards'} ·{' '}
                {new Date().toLocaleDateString()}
              </p>
            </div>
            <div
              className={
                mode === 'cards'
                  ? 'grid grid-cols-2 gap-4'
                  : 'grid grid-cols-2 gap-3'
              }
            >
              {(selectedRows.length ? selectedRows : students.slice(0, 12)).map(
                (row) =>
                  mode === 'cards' ? (
                    <div key={row.student_id} className="break-inside-avoid flex justify-center">
                      <StudentIdCardFace
                        student={row}
                        school={school}
                        templateKey={row.card?.template_key || templateKey}
                        cardNumber={row.card?.card_number}
                        barcodeValue={row.barcode_value}
                        qrPayload={row.qr_payload}
                        issuedOn={row.card?.issued_on}
                        expiresOn={row.card?.expires_on}
                        settings={settings}
                      />
                    </div>
                  ) : (
                    <div
                      key={row.student_id}
                      className="break-inside-avoid rounded border border-slate-300 p-3"
                    >
                      <p className="text-sm font-bold">{row.full_name}</p>
                      <p className="font-mono text-xs">{row.admission_number}</p>
                      <p className="text-[11px] text-slate-600 mb-2">
                        {row.classroom?.name}
                      </p>
                      <div className="flex items-end gap-3">
                        <QrImage payload={row.qr_payload} size={90} />
                        <BarcodeImage value={row.barcode_value} height={36} />
                      </div>
                    </div>
                  ),
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          .print\\:block { position: absolute; left: 0; top: 0; width: 100%; }
          .id-card { box-shadow: none !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  )
}

export default function StudentIdentityWorkspace() {
  const { pathname } = useLocation()
  const meta = META[pathname] || META['/students/id-cards']
  const mode = meta.section === 'qr' ? 'qr' : 'cards'

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader
          title={meta.title}
          description={meta.desc}
          breadcrumbs={[
            { label: 'People', href: '/students' },
            { label: meta.title },
          ]}
        />
        <IdentityPage mode={mode} />
      </div>
    </DashboardLayout>
  )
}
