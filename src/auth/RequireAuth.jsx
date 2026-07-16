import { Navigate, useLocation } from 'react-router-dom'
import { Spinner } from '@heroui/react'
import { useAuth } from './AuthProvider.jsx'
import { AUDIENCE } from './sessionStorage.js'

function AuthLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-50">
      <Spinner color="primary" />
      <p className="text-sm text-zinc-500">Verifying your session…</p>
    </div>
  )
}

/**
 * Requires a valid authenticated session (after /me hydrate).
 */
export function RequireAuth({ children }) {
  const { isAuthenticated, isHydrating, status } = useAuth()
  const location = useLocation()

  if (isHydrating || status === 'hydrating') {
    return <AuthLoading />
  }

  if (!isAuthenticated) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    )
  }

  return children
}

/**
 * Platform (super admin) only. School users are sent to the school dashboard.
 */
export function RequirePlatform({ children }) {
  const { isAuthenticated, isHydrating, isPlatform, status } = useAuth()
  const location = useLocation()

  if (isHydrating || status === 'hydrating') {
    return <AuthLoading />
  }

  if (!isAuthenticated) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    )
  }

  if (!isPlatform) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

/**
 * School tenant portal only. Super admins are sent to the platform console.
 */
export function RequireSchool({ children }) {
  const { isAuthenticated, isHydrating, isSchool, isPlatform, status } =
    useAuth()
  const location = useLocation()

  if (isHydrating || status === 'hydrating') {
    return <AuthLoading />
  }

  if (!isAuthenticated) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    )
  }

  if (isPlatform || !isSchool) {
    return <Navigate to="/platform" replace />
  }

  return children
}

/**
 * Guest-only pages (login / register). Authenticated users bounce home.
 */
export function RedirectIfAuthenticated({ children }) {
  const { isAuthenticated, isHydrating, isPlatform, status } = useAuth()

  if (isHydrating || status === 'hydrating') {
    return <AuthLoading />
  }

  if (isAuthenticated) {
    return (
      <Navigate
        to={isPlatform ? '/platform' : '/dashboard'}
        replace
      />
    )
  }

  return children
}

export { AUDIENCE }
