import {
  clearAuth,
  getStoredAuth,
  saveAuth,
  getAccessToken,
} from './auth.js'
import { fetchWithTimeout } from './http.js'

const BASE_URL = import.meta.env.VITE_BASE_URL || ''

const normalizeBaseUrl = (value) => {
  if (!value) return ''
  return String(value).replace(/\/+$/, '')
}

const API_BASE = normalizeBaseUrl(BASE_URL)

export const buildUrl = (path) => {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${p}`
}

export const getAuthHeaders = () => {
  const stored = getStoredAuth()
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  const token = getAccessToken() || stored?.access_token || null
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  // Tenant header: only from the authenticated school user's own school.
  // Never invent or reuse a school id from another session.
  const schoolId =
    stored?.user?.school?.id ??
    stored?.user?.school_id ??
    stored?.school?.id ??
    null

  // Super admins have no school — do not send a stale X-School-ID
  const isPlatform = stored?.audience === 'platform' ||
    stored?.user?.role?.name === 'super_admin'

  if (schoolId && !isPlatform) {
    headers['X-School-ID'] = String(schoolId)
  }

  return headers
}

/**
 * JSON API request with Shengena envelope handling.
 * Returns `data` from { success, data, error } when present.
 */
export async function apiRequest(path, options = {}) {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  }

  Object.keys(headers).forEach((key) => {
    if (headers[key] === undefined || headers[key] === null) {
      delete headers[key]
    }
  })

  // Times out (status 0, code TIMEOUT) instead of hanging when the API is unreachable
  const response = await fetchWithTimeout(buildUrl(path), {
    ...options,
    headers,
  })

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  let body = null
  try {
    body = isJson ? await response.json() : await response.text()
  } catch {
    body = null
  }

  if (response.status === 401) {
    // True auth failure only when we sent a bearer token
    if (headers.Authorization) {
      clearAuth()
      // Notify auth layer if present
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('shengena:auth-expired'))
      }
    }
  }

  if (!response.ok) {
    const message =
      (isJson &&
        body &&
        (body.error || body.message || body?.data?.message)) ||
      (typeof body === 'string' && body && body.length < 200 ? body : null) ||
      (response.status === 401
        ? 'Unauthenticated. Please sign in again.'
        : `Request failed (${response.status})`)
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
    return body.data
  }

  return body
}

export const api = {
  get: (path) => apiRequest(path),
  post: (path, payload) =>
    apiRequest(path, { method: 'POST', body: JSON.stringify(payload) }),
  put: (path, payload) =>
    apiRequest(path, { method: 'PUT', body: JSON.stringify(payload) }),
  patch: (path, payload) =>
    apiRequest(path, { method: 'PATCH', body: JSON.stringify(payload) }),
  delete: (path) => apiRequest(path, { method: 'DELETE' }),
}

export { saveAuth, clearAuth, getStoredAuth, getAccessToken }
