/**
 * Loading placeholders, drawn like the Shengena ERP and HR desk: the page frame and headings
 * stay put and only the parts that wait for data show soft grey shapes of what is coming.
 *
 * Each region announces itself once to screen readers (role="status", aria-busy) and the
 * shapes are hidden from them. Motion stops for people who prefer reduced motion (index.css).
 */

/** One grey shape. Size it with className (h-4 w-32, h-24 w-full, …). */
export function Skeleton({ className = '', rounded = 'rounded' }) {
  return <span aria-hidden="true" className={`sh-skeleton block ${rounded} ${className}`} />
}

/** Wraps placeholders so assistive technology hears "Loading …" once. */
export function LoadingRegion({ label = 'Loading', className = '', children }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{label}…</span>
      {children}
    </div>
  )
}

/** Lines of text, the last one shorter. */
export function TextSkeleton({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={`h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  )
}

/** A table: header row and body rows, with widths that vary like real data. */
export function TableSkeleton({ rows = 6, columns = 4, label = 'Loading records', className = '' }) {
  const widths = ['w-3/4', 'w-1/2', 'w-2/3', 'w-1/3', 'w-5/6', 'w-2/5']
  return (
    <LoadingRegion label={label} className={`overflow-hidden ${className}`}>
      <div
        className="grid gap-4 border-b border-[#ededed] px-3 py-2.5"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }, (_, c) => (
          <Skeleton key={c} className="h-3 w-1/2" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div
          key={r}
          className="grid items-center gap-4 border-b border-[#f3f3f3] px-3 py-3 last:border-b-0"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton key={c} className={`h-3.5 ${widths[(r + c) % widths.length]}`} />
          ))}
        </div>
      ))}
    </LoadingRegion>
  )
}

/** A list: an avatar-sized mark and two lines per row. */
export function ListSkeleton({ rows = 5, label = 'Loading', className = '' }) {
  return (
    <LoadingRegion label={label} className={`divide-y divide-[#f3f3f3] ${className}`}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-1 py-3">
          <Skeleton className="h-8 w-8 shrink-0" rounded="rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className={`h-3.5 ${i % 2 ? 'w-1/3' : 'w-2/5'}`} />
            <Skeleton className={`h-3 ${i % 2 ? 'w-1/2' : 'w-3/5'}`} />
          </div>
        </div>
      ))}
    </LoadingRegion>
  )
}

/** Number cards: a label and a figure each, laid out in the same grid as the real cards. */
export function StatCardsSkeleton({ count = 4, className = 'grid grid-cols-2 gap-3 lg:grid-cols-4', label = 'Loading figures' }) {
  return (
    <LoadingRegion label={label} className={className}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="sh-card space-y-3 p-4">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-2.5 w-2/3" />
        </div>
      ))}
    </LoadingRegion>
  )
}

/** A chart or other large panel body. */
export function ChartSkeleton({ height = 'h-56', label = 'Loading chart', className = '' }) {
  return (
    <LoadingRegion label={label} className={`flex ${height} items-end gap-2 ${className}`}>
      {[45, 70, 55, 85, 40, 65, 75, 50, 90, 60].map((h, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="sh-skeleton block flex-1 rounded-sm"
          style={{ height: `${h}%` }}
        />
      ))}
    </LoadingRegion>
  )
}

/** A form or detail panel: label and field pairs. */
export function FormSkeleton({ fields = 4, label = 'Loading details', className = '' }) {
  return (
    <LoadingRegion label={label} className={`space-y-4 ${className}`}>
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-full" rounded="rounded-md" />
        </div>
      ))}
    </LoadingRegion>
  )
}

/**
 * Default placeholder for a section whose shape is not known: a few rows of a list.
 * Drop-in for the old centred spinner.
 */
export function SectionSkeleton({ label = 'Loading', rows = 4, className = 'py-2' }) {
  return <ListSkeleton rows={rows} label={label} className={className} />
}

/**
 * The app frame while the session is checked: the dark app rail, the top bar and grey
 * shapes where the page will be, so the screen never flashes blank or shows a lone spinner.
 */
export function AppShellSkeleton({ label = 'Opening Shengena' }) {
  return (
    <LoadingRegion label={label} className="flex h-screen overflow-hidden bg-white">
      <div className="hidden w-[81px] shrink-0 flex-col items-center gap-2 bg-[var(--sh-dock)] px-1.5 py-3 md:flex">
        <span className="mb-3 block h-9 w-9 rounded-md bg-white/90" aria-hidden="true" />
        {Array.from({ length: 7 }, (_, i) => (
          <span key={i} className="block h-[50px] w-[60px] rounded-lg bg-white/[0.06]" aria-hidden="true" />
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--sh-rule)] px-4 sm:px-6">
          <Skeleton className="hidden h-[38px] w-[330px] md:block" rounded="rounded-md" />
          <Skeleton className="ml-auto h-8 w-8" rounded="rounded-full" />
          <Skeleton className="hidden h-3.5 w-28 sm:block" />
        </div>
        <div className="space-y-5 px-4 pt-5 sm:px-6">
          <Skeleton className="h-5 w-48" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="sh-card space-y-3 p-4" aria-hidden="true">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-6 w-1/3" />
              </div>
            ))}
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {Array.from({ length: 2 }, (_, i) => (
              <div key={i} className="sh-card h-64 p-4" aria-hidden="true">
                <Skeleton className="h-3.5 w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </LoadingRegion>
  )
}

/** Stand-in for a figure (a count, an amount) inside a stat card while it loads. */
export function ValueSkeleton({ className = 'h-5 w-12' }) {
  return (
    <span role="status" aria-label="Loading" className="inline-flex align-middle">
      <span aria-hidden="true" className={`sh-skeleton inline-block rounded ${className}`} />
    </span>
  )
}
