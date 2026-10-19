import { useNavigate } from 'react-router-dom'
import { Button } from '@heroui/react'
import { Lock } from 'lucide-react'
import DashboardLayout from './DashboardLayout'
import { useAuth } from '../../auth'

/**
 * Shown when the signed-in role cannot open a page (RBAC), or has no
 * staff-portal access at all (parent / student until their portals exist).
 */
function NoAccess({ portal = false }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const role = user?.role?.label || user?.role?.name?.replace(/_/g, ' ') || 'your role'

  const body = (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#0B3D2E]/[0.08]">
          <Lock className="h-5 w-5 text-[#0B3D2E]" strokeWidth={1.75} />
        </div>
        <h1 className="text-lg font-semibold text-slate-900">
          {portal ? 'Your portal is not ready yet' : 'You don’t have access to this page'}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {portal
            ? `Accounts with the ${role} role can’t use the staff portal. Your school will let you know when your portal is available.`
            : `This area isn’t available to the ${role} role. Ask your school administrator if you need access.`}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          {portal ? (
            <Button
              className="bg-[#0B3D2E] font-semibold text-white"
              onPress={async () => {
                await logout()
                navigate('/login', { replace: true })
              }}
            >
              Sign out
            </Button>
          ) : (
            <Button
              className="bg-[#0B3D2E] font-semibold text-white"
              onPress={() => navigate('/dashboard')}
            >
              Back to dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  )

  // Without any portal access the sidebar would be empty — show a bare page.
  if (portal) {
    return <div className="min-h-screen bg-slate-50">{body}</div>
  }

  return <DashboardLayout>{body}</DashboardLayout>
}

export default NoAccess
