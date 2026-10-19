import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  applyMeToSession,
  clearAuth,
  fetchMe,
  getStoredAuth,
  hydrateSessionFromServer,
  login as apiLogin,
  logout as apiLogout,
  registerSchool as apiRegisterSchool,
  saveAuth,
} from '../api/auth.js'
import {
  AUDIENCE,
  isPlatformSession,
  isSchoolSession,
} from './sessionStorage.js'
import { canAccess, canAccessPath } from './permissions.js'

const AuthContext = createContext(null)

const AUTH_QUERY_KEY = ['auth', 'session']

function syncQuerySession(queryClient, session) {
  queryClient.setQueryData(AUTH_QUERY_KEY, session)
}

/**
 * Industrial auth boundary:
 * - One identity at a time
 * - Server /me revalidation on boot
 * - Full React Query cache wipe on login / logout (no cross-tenant bleed)
 */
export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState(() => getStoredAuth())
  const [status, setStatus] = useState(() =>
    getStoredAuth()?.access_token ? 'hydrating' : 'unauthenticated',
  )
  const [error, setError] = useState(null)

  const commitSession = useCallback(
    (next) => {
      setSession(next)
      syncQuerySession(queryClient, next)
      setStatus(next?.access_token && next?.user ? 'authenticated' : 'unauthenticated')
    },
    [queryClient],
  )

  const wipeEverything = useCallback(() => {
    clearAuth()
    // Drop ALL cached school/platform data from the previous identity
    queryClient.clear()
    syncQuerySession(queryClient, null)
    setSession(null)
    setStatus('unauthenticated')
    setError(null)
  }, [queryClient])

  // Boot: revalidate identity from server so refresh never shows the wrong user
  useEffect(() => {
    let cancelled = false

    async function boot() {
      const stored = getStoredAuth()
      if (!stored?.access_token) {
        if (!cancelled) {
          setSession(null)
          setStatus('unauthenticated')
          syncQuerySession(queryClient, null)
        }
        return
      }

      // Show stored user briefly only while hydrating (optional UX)
      if (!cancelled) {
        setSession(stored)
        setStatus('hydrating')
        syncQuerySession(queryClient, stored)
      }

      const result = await hydrateSessionFromServer()
      if (cancelled) return

      if (result.status === 'authenticated' && result.session) {
        commitSession(result.session)
        setError(null)
      } else {
        wipeEverything()
        if (result.error) setError(result.error)
      }
    }

    boot()

    const onExpired = () => {
      wipeEverything()
    }
    window.addEventListener('shengena:auth-expired', onExpired)

    return () => {
      cancelled = true
      window.removeEventListener('shengena:auth-expired', onExpired)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(
    async (credentials) => {
      // Always leave the previous identity completely
      wipeEverything()

      const data = await apiLogin(credentials)
      const saved = saveAuth(data)
      if (!saved?.access_token) {
        throw new Error('Login succeeded but no access token was returned')
      }
      if (!saved.user) {
        throw new Error('Login succeeded but no user identity was returned')
      }

      // Confirm with /me so we never trust a stale client blob
      try {
        const me = await fetchMe(saved.access_token)
        const confirmed = applyMeToSession(me) || saved
        if (
          confirmed.user?.id != null &&
          saved.user?.id != null &&
          String(confirmed.user.id) !== String(saved.user.id)
        ) {
          wipeEverything()
          throw new Error('Identity verification failed after login')
        }
        commitSession(confirmed)
        return confirmed
      } catch (err) {
        if (err?.message === 'Identity verification failed after login') throw err
        // If /me fails for network reasons, still use login payload if present
        if (saved.user) {
          commitSession(saved)
          return saved
        }
        wipeEverything()
        throw err
      }
    },
    [commitSession, wipeEverything],
  )

  const registerSchool = useCallback(
    async (payload) => {
      wipeEverything()
      const data = await apiRegisterSchool(payload)
      const saved = saveAuth(data)
      if (!saved?.access_token || !saved?.user) {
        wipeEverything()
        throw new Error('Registration incomplete — missing session')
      }
      commitSession(saved)
      return saved
    },
    [commitSession, wipeEverything],
  )

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } finally {
      wipeEverything()
    }
  }, [wipeEverything])

  const refreshIdentity = useCallback(async () => {
    const stored = getStoredAuth()
    if (!stored?.access_token) {
      wipeEverything()
      return null
    }
    const me = await fetchMe(stored.access_token)
    const next = applyMeToSession(me)
    if (!next) {
      wipeEverything()
      return null
    }
    commitSession(next)
    return next
  }, [commitSession, wipeEverything])

  const value = useMemo(() => {
    const user = session?.user || null
    const audience = session?.audience || null
    return {
      session,
      user,
      status,
      error,
      isAuthenticated: status === 'authenticated' && Boolean(session?.access_token),
      isHydrating: status === 'hydrating',
      isPlatform: isPlatformSession(session),
      isSchool: isSchoolSession(session),
      audience,
      school: session?.school || user?.school || null,
      permissions: user?.permissions || null,
      can: (area, mode = 'read') => canAccess(user?.permissions, area, mode),
      canPath: (pathname) => canAccessPath(user?.permissions, pathname),
      login,
      logout,
      registerSchool,
      refreshIdentity,
      wipeEverything,
    }
  }, [
    session,
    status,
    error,
    login,
    logout,
    registerSchool,
    refreshIdentity,
    wipeEverything,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}

export { AUTH_QUERY_KEY, AUDIENCE }
