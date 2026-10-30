/**
 * Auth API + session lifecycle for Shengena.
 *
 * Rules (industrial isolation):
 * 1. Only one active identity in the browser at a time.
 * 2. Login always wipes previous storage before writing the new session.
 * 3. On app boot the UI revalidates identity via GET /auth/me (server is source of truth).
 * 4. Logout clears storage + caller must clear React Query cache.
 */

import {
  AUTH_STORAGE_KEY,
  getAccessToken,
  normalizeSession,
  readRawSession,
  wipeSessionStorage,
  writeSession,
  isPlatformSession,
  isSchoolSession,
  AUDIENCE,
} from '../auth/sessionStorage.js'
import { AUTH_TIMEOUT_MS, fetchWithTimeout } from './http.js'

const BASE_URL = import.meta.env.VITE_BASE_URL || ''

export { AUTH_STORAGE_KEY, isPlatformSession, isSchoolSession, AUDIENCE }
export {
  getAccessToken,
  readRawSession as getStoredAuth,
  wipeSessionStorage as clearAuth,
} from '../auth/sessionStorage.js'

const normalizeBaseUrl = (value) => {
  if (!value) return ''
  return String(value).replace(/\/+$/, '')
}

const API_BASE = normalizeBaseUrl(BASE_URL)

const buildUrl = (path) => {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${p}`
}

/**
 * Persist a login/register/refresh payload. Replaces any prior identity.
 */
export const saveAuth = (authPayload) => {
  const normalized = normalizeSession(authPayload)
  if (!normalized?.access_token) {
    console.warn('[auth] saveAuth called without access_token', authPayload)
    return null
  }
  if (!normalized.user) {
    console.warn('[auth] saveAuth called without user identity', authPayload)
  }
  // Hard replace — never merge with a previous super-admin / school session
  wipeSessionStorage()
  return writeSession(normalized)
}

/**
 * Merge server /me user into the current token session and persist.
 */
export const applyMeToSession = (mePayload) => {
  const current = readRawSession()
  if (!current?.access_token) return null

  const meUser =
    mePayload?.user ||
    mePayload?.data?.user ||
    (mePayload?.id && mePayload?.email ? mePayload : null)

  if (!meUser?.id) {
    console.warn('[auth] /me response missing user', mePayload)
    return current
  }

  // Identity mismatch: token sub vs /me user must match if we have prior user id
  if (
    current.user?.id != null &&
    meUser.id != null &&
    String(current.user.id) !== String(meUser.id)
  ) {
    console.error(
      '[auth] identity mismatch between stored user and /me — clearing session',
      { stored: current.user.id, me: meUser.id },
    )
    wipeSessionStorage()
    return null
  }

  const merged = normalizeSession({
    access_token: current.access_token,
    token_type: current.token_type,
    expires_in: current.expires_in,
    expires_at: current.expires_at,
    user: meUser,
    school: meUser.school || current.school,
  })

  return writeSession(merged)
}

const authHeaders = (tokenOverride) => {
  const token = tokenOverride || getAccessToken()
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

const request = async (path, options = {}) => {
  const headers = {
    ...authHeaders(options.token),
    ...(options.headers || {}),
  }

  // Sign-in must never spin forever: fail with a clear message after AUTH_TIMEOUT_MS
  const { token: _token, ...fetchOptions } = options
  const response = await fetchWithTimeout(buildUrl(path), {
    timeout: AUTH_TIMEOUT_MS,
    ...fetchOptions,
    headers,
  })

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const body = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const message =
      (isJson && body && (body.message || body.error)) ||
      (response.status === 401 ? 'Invalid credentials' : 'Request failed')
    const error = new Error(message)
    error.status = response.status
    error.body = body
    throw error
  }

  if (isJson && body && typeof body === 'object' && 'success' in body) {
    if (!body.success) {
      const error = new Error(body.error || 'Request failed')
      error.status = response.status
      error.body = body
      throw error
    }
    return body.data ?? body
  }

  return body
}

export const registerSchool = async (payload) => {
  const data = await request('/api/v1/auth/register-school', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data
}

export const login = async (payload) => {
  const data = await request('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data
}

// ---- Sign in with Shengena (single sign-on) ----

const SSO_LOGOUT_KEY = 'shengena.sso_logout_url'

/** Whether the API offers Sign in with Shengena. */
export const fetchSsoConfig = async () => {
  try {
    const data = await request('/api/v1/auth/oidc/config', { method: 'GET' })
    return { enabled: data?.enabled === true }
  } catch {
    return { enabled: false }
  }
}

/** Full-page URL that starts Sign in with Shengena. */
export const ssoStartUrl = () => buildUrl('/api/v1/auth/oidc/redirect')

/** Swap the one-time code from the SSO callback for a portal session. */
export const loginWithSso = async (code) => {
  const data = await request('/api/v1/auth/oidc/exchange', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
  // Remember where to end the Shengena session on logout (only for SSO sessions).
  try {
    if (data?.sso?.logout_url) localStorage.setItem(SSO_LOGOUT_KEY, data.sso.logout_url)
  } catch {
    // Storage blocked: logout still ends the portal session
  }
  return data
}

/** Read and forget the Shengena logout URL saved at SSO sign-in. */
export const takeSsoLogoutUrl = () => {
  try {
    const url = localStorage.getItem(SSO_LOGOUT_KEY)
    localStorage.removeItem(SSO_LOGOUT_KEY)
    return url
  } catch {
    return null
  }
}

/**
 * Server source of truth for the current identity.
 * Pass token explicitly during hydrate so we never race with storage.
 */
export const fetchMe = async (token) => {
  const data = await request('/api/v1/auth/me', {
    method: 'GET',
    token: token || undefined,
  })
  return data
}

export const logout = async () => {
  try {
    await request('/api/v1/auth/logout', {
      method: 'POST',
    })
  } catch {
    // Always wipe client session even if the API call fails
  } finally {
    wipeSessionStorage()
  }
}

export const refreshToken = async () => {
  const data = await request('/api/v1/auth/refresh', {
    method: 'POST',
  })
  // Full replace from refresh response (includes user)
  if (data?.access_token || data?.token) {
    return saveAuth(data)
  }
  return data
}

/**
 * Boot-time hydrate: token from storage → /me → authoritative session.
 * Returns { session, status } where status is authenticated | unauthenticated | error
 */
export async function hydrateSessionFromServer() {
  const stored = readRawSession()
  if (!stored?.access_token) {
    wipeSessionStorage()
    return { session: null, status: 'unauthenticated' }
  }

  try {
    const me = await fetchMe(stored.access_token)
    const session = applyMeToSession(me)
    if (!session?.user) {
      wipeSessionStorage()
      return { session: null, status: 'unauthenticated' }
    }
    return { session, status: 'authenticated' }
  } catch (err) {
    if (err?.status === 401 || err?.status === 403) {
      wipeSessionStorage()
      return { session: null, status: 'unauthenticated' }
    }
    // Network blip: keep stored session but mark as degraded
    if (stored.user) {
      return { session: stored, status: 'authenticated', offline: true }
    }
    wipeSessionStorage()
    return { session: null, status: 'error', error: err }
  }
}
