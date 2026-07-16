import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card, CardBody, CardHeader, Button, Chip } from '@heroui/react'
import { ChevronRight, LayoutGrid } from 'lucide-react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import { getModuleByPath, flattenFeatures } from '../../config/modules.js'

/**
 * Universal module page: overview grid + feature placeholders.
 * Driven by the modules registry (docs/MODULES.md).
 */
function ModulePage() {
  const location = useLocation()
  const navigate = useNavigate()

  const module = useMemo(
    () => getModuleByPath(location.pathname),
    [location.pathname],
  )

  const features = useMemo(
    () => (module ? flattenFeatures(module) : []),
    [module],
  )

  const isRoot = module && location.pathname === module.path

  const activeFeature = useMemo(() => {
    if (!module || isRoot) return null
    return (
      features.find((f) => f.path === location.pathname) || {
        label: location.pathname.split('/').filter(Boolean).slice(-1)[0],
        path: location.pathname,
      }
    )
  }, [module, isRoot, features, location.pathname])

  if (!module) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-2 p-4">
          <h1 className="text-xl font-bold text-slate-900">Module not found</h1>
          <Button size="sm" variant="flat" onPress={() => navigate('/dashboard')}>
            Back to dashboard
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Chip size="sm" variant="flat" color="primary" className="capitalize">
                {module.key.replace(/-/g, ' ')}
              </Chip>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isRoot ? module.label : activeFeature?.label || module.label}
            </h1>
            <p className="text-sm text-slate-500">
              {isRoot
                ? module.description
                : `${module.label} · ${activeFeature?.group || 'Feature'}`}
            </p>
          </div>
          {!isRoot && (
            <Button
              size="sm"
              variant="bordered"
              onPress={() => navigate(module.path)}
            >
              Module overview
            </Button>
          )}
        </div>

        {isRoot ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {features.map((f) => (
              <Card
                key={f.path}
                isPressable
                className="border border-slate-200 shadow-none transition-colors hover:border-[#0B3D2E]/40"
                onPress={() => navigate(f.path)}
              >
                <CardHeader className="flex flex-row items-start justify-between gap-2 pb-1">
                  <div>
                    {f.group && (
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        {f.group}
                      </p>
                    )}
                    <h3 className="text-sm font-semibold text-slate-900">
                      {f.label}
                    </h3>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                </CardHeader>
                <CardBody className="pt-0">
                  <p className="text-xs text-slate-500">{f.path}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border border-slate-200 shadow-none">
            <CardBody className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0B3D2E]/10 text-[#0B3D2E]">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-2">
                <h2 className="text-base font-semibold text-slate-900">
                  {activeFeature?.label}
                </h2>
                <p className="text-sm text-slate-600">
                  This feature is part of the{' '}
                  <strong>{module.label}</strong> module and is documented in
                  the Shengena module catalog. API scaffolding is available under{' '}
                  <code className="rounded bg-slate-100 px-1 text-xs">
                    /api/v1/modules/{module.key}
                  </code>
                  . Domain UI and business logic will be completed incrementally.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Chip size="sm" variant="flat">
                    Documented
                  </Chip>
                  <Chip size="sm" variant="flat" color="primary">
                    UI route live
                  </Chip>
                  <Chip size="sm" variant="flat" color="success">
                    API catalog
                  </Chip>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

export default ModulePage
