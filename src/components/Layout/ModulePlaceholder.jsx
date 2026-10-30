import { Card, CardBody } from '@heroui/react'
import DashboardLayout from './DashboardLayout'
import PageHeader from './PageHeader.jsx'

/**
 * Shared shell for module sub-pages that are not fully built yet.
 */
function ModulePlaceholder({
  title,
  description,
  breadcrumbs,
  actions = null,
  children,
  wrapLayout = true,
  showHeader = true,
}) {
  const body = children || (
    <Card className="rounded-lg border-0 shadow-[0_0_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.14)]">
      <CardBody className="p-8">
        <p className="text-sm text-zinc-600">
          This section is ready in the navigation. Content and API wiring will
          land here next.
        </p>
      </CardBody>
    </Card>
  )

  const crumbs =
    breadcrumbs ||
    (title
      ? [
          { label: 'Home', href: '/dashboard' },
          { label: title },
        ]
      : [])

  const content = showHeader ? (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={title}
        breadcrumbs={crumbs}
        description={description}
        actions={actions}
      />
      {body}
    </div>
  ) : (
    body
  )

  if (!wrapLayout) return content
  return <DashboardLayout>{content}</DashboardLayout>
}

export default ModulePlaceholder
