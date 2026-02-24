const BASE_URL = import.meta.env.VITE_BASE_URL || ''

const AUTH_STORAGE_KEY = 'daruno_auth'

const normalizeBaseUrl = (value) => {
  if (!value) return ''
  return value.endsWith('/') ? value.slice(0, -1) : value
}

const API_BASE = normalizeBaseUrl(BASE_URL)

const buildUrl = (path) => `${API_BASE}${path}`

export const getStoredAuth = () => {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const saveAuth = (authPayload) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authPayload))
}

export const clearAuth = () => {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}

const getAccessToken = () => {
  const stored = getStoredAuth()
  return stored?.access_token || null
}

const authHeaders = () => {
  const token = getAccessToken()
  if (!token) return {}
  return {
    Authorization: `Bearer ${token}`,
  }
}

const request = async (path, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
  })

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const body = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const error = new Error(
      isJson && body && body.message ? body.message : 'Request failed',
    )
    error.status = response.status
    error.body = body
    throw error
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

export const fetchMe = async () => {
  const data = await request('/api/v1/auth/me', {
    method: 'GET',
    headers: authHeaders(),
  })
  return data
}

export const logout = async () => {
  const data = await request('/api/v1/auth/logout', {
    method: 'POST',
    headers: authHeaders(),
  })
  return data
}

export const refreshToken = async () => {
  const data = await request('/api/v1/auth/refresh', {
    method: 'POST',
    headers: authHeaders(),
  })
  return data
}

