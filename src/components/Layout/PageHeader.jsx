import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

/**
 * Page header used across dashboard screens.
 * Layout: title (smaller) + actions on the right; breadcrumb below title.
 *
 * breadcrumbs: [{ label, href? }] — last item is the current page (no link)
 */
function PageHeader({ title, breadcrumbs = [], actions = null, description = null }) {
  const crumbs = breadcrumbs.length
    ? breadcrumbs
    : title
      ? [{ label: title }]
      : []

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="text-[18px] font-semibold leading-7 tracking-[-0.01em] text-[var(--sh-ink)]">
          {title}
        </h1>

        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mt-1.5">
            <ol className="flex flex-wrap items-center gap-1 text-[13px]">
              {crumbs.map((crumb, index) => {
                const isLast = index === crumbs.length - 1
                return (
                  <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                    {index > 0 && (
                      <ChevronRight
                        className="h-3 w-3 shrink-0 text-[var(--sh-muted)]"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                    )}
                    {isLast || !crumb.href ? (
                      <span
                        className={
                          isLast
                            ? 'font-medium text-[var(--sh-ink)]'
                            : 'text-[var(--sh-muted)]'
                        }
                        aria-current={isLast ? 'page' : undefined}
                      >
                        {crumb.label}
                      </span>
                    ) : (
                      <Link
                        to={crumb.href}
                        className="font-normal text-[var(--sh-muted)] transition-colors hover:text-[var(--sh-brand)]"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>
        )}

        {description ? (
          <p className="mt-1 text-[13px] text-[var(--sh-text)]">{description}</p>
        ) : null}
      </div>

      {actions ? (
        <div className="mt-2 flex shrink-0 flex-wrap items-center gap-2 sm:mt-0">
          {actions}
        </div>
      ) : null}
    </div>
  )
}

export default PageHeader
