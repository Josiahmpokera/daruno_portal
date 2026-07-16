import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

/**
 * Page header used across dashboard screens.
 * Layout: title (smaller) + actions on the right; breadcrumb below title.
 *
 * breadcrumbs: [{ label, href? }] — last item is active (primary color, no link)
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
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl">
          {title}
        </h1>

        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mt-1.5">
            <ol className="flex flex-wrap items-center gap-1 text-[12px]">
              {crumbs.map((crumb, index) => {
                const isLast = index === crumbs.length - 1
                return (
                  <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                    {index > 0 && (
                      <ChevronRight
                        className="h-3 w-3 shrink-0 text-zinc-300"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                    )}
                    {isLast || !crumb.href ? (
                      <span
                        className={
                          isLast
                            ? 'font-medium text-[#0B3D2E]'
                            : 'text-zinc-400'
                        }
                        aria-current={isLast ? 'page' : undefined}
                      >
                        {crumb.label}
                      </span>
                    ) : (
                      <Link
                        to={crumb.href}
                        className="text-zinc-400 transition-colors hover:text-[#0B3D2E]"
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
          <p className="mt-1 text-[12px] text-zinc-500">{description}</p>
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
