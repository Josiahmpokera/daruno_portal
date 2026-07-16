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
    <Card className="border border-zinc-200 shadow-none">
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
