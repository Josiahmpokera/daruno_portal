/**
 * Single source of truth for the portal session blob in localStorage.
 * Never keep more than one active identity. Super-admin (platform) and
 * school users are separated by `audience`.
 */

export const AUTH_STORAGE_KEY = 'shengena_auth_v2'
/** @deprecated legacy key — migrated once then removed */
export const LEGACY_AUTH_STORAGE_KEY = 'daruno_auth'

export const SESSION_VERSION = 2

export const AUDIENCE = {
  PLATFORM: 'platform',
  SCHOOL: 'school',
}

/**
 * @param {object|null} user
 * @returns {'platform'|'school'|null}
 */
export function audienceFromUser(user) {
  const role = user?.role?.name || user?.role || null
  if (!role) return null
  if (role === 'super_admin') return AUDIENCE.PLATFORM
  return AUDIENCE.SCHOOL
}

/**
 * @returns {object|null}
 */
export function readRawSession() {
  if (typeof window === 'undefined') return null

  // Prefer v2; migrate legacy once
  const v2 = window.localStorage.getItem(AUTH_STORAGE_KEY)
  if (v2) {
    try {
      return JSON.parse(v2)
    } catch {
      window.localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }

  const legacy = window.localStorage.getItem(LEGACY_AUTH_STORAGE_KEY)
  if (legacy) {
    try {
      const parsed = JSON.parse(legacy)
      const migrated = normalizeSession(parsed)
      if (migrated?.access_token) {
        writeSession(migrated)
      }
      window.localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY)
      return migrated
    } catch {
      window.localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY)
    }
  }

  return null
}

/**
 * Normalize any login/me/refresh payload into a stable session shape.
 * Accepts flat token responses or { data: ... } envelopes.
 */
export function normalizeSession(payload) {
  if (!payload || typeof payload !== 'object') return null

  const raw =
    payload.access_token || payload.token
      ? payload
      : payload.data && (payload.data.access_token || payload.data.token || payload.data.user)
        ? payload.data
        : payload

  // /me returns { user } without token — merge handled by caller
  const access_token = raw.access_token || raw.token || null
  let user = raw.user || null
  if (!access_token && !user) return null

  let school = user?.school || raw.school || null
  // Registration may attach subscription/invoice alongside the token payload
  if (school && raw.subscription && !school.subscription) {
    school = { ...school, subscription: raw.subscription }
  }
  if (user && school) {
    user = { ...user, school }
  }
  const audience = audienceFromUser(user) || raw.audience || null
  const expires_in =
    raw.expires_in != null && raw.expires_in !== ''
      ? Number(raw.expires_in)
      : null
  const saved_at = Date.now()

  return {
    version: SESSION_VERSION,
    access_token,
    token_type: raw.token_type || 'bearer',
    expires_in,
    expires_at:
      expires_in != null && Number.isFinite(expires_in)
        ? saved_at + expires_in * 1000
        : raw.expires_at ?? null,
    audience,
    // Preserve registration extras for one-shot UI (trial toast, invoice)
    subscription: raw.subscription || school?.subscription || null,
    invoice: raw.invoice || null,
    registration_mode: raw.registration_mode || null,
    user: user
      ? {
          id: user.id,
          name: user.name || '',
          email: user.email || '',
          role: user.role
            ? {
                id: user.role.id ?? null,
                name: user.role.name || user.role,
                label: user.role.label || user.role.name || user.role,
              }
            : null,
          school: school
            ? {
                id: school.id,
                name: school.name,
                code: school.code ?? null,
                slug: school.slug ?? null,
                education_stages: Array.isArray(school.education_stages)
                  ? school.education_stages
                  : [],
                education_level: school.education_level ?? null,
                status: school.status ?? null,
              }
            : null,
          school_id: user.school_id ?? school?.id ?? null,
          // RBAC area map from the API: { finance: { read, write }, ... }
          permissions:
            user.permissions && typeof user.permissions === 'object'
              ? user.permissions
              : null,
        }
      : null,
    school: school
      ? {
          id: school.id,
          name: school.name,
          code: school.code ?? null,
          slug: school.slug ?? null,
          education_stages: Array.isArray(school.education_stages)
            ? school.education_stages
            : [],
          education_level: school.education_level ?? null,
          status: school.status ?? null,
        }
      : null,
    saved_at,
  }
}

/**
 * Persist session. Always overwrites the previous identity completely.
 */
export function writeSession(session) {
  if (typeof window === 'undefined') return null
  if (!session?.access_token) {
    console.warn('[auth] refuse to persist session without access_token')
    return null
  }
  const normalized = {
    ...session,
    version: SESSION_VERSION,
    saved_at: session.saved_at || Date.now(),
  }
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalized))
  // Remove legacy so it can never resurrect a previous user
  window.localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY)
  return normalized
}

/**
 * Wipe every known auth key. Call on logout AND before login.
 */
export function wipeSessionStorage() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
  window.localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY)
}

export function getAccessToken() {
  const s = readRawSession()
  return s?.access_token || null
}

export function isPlatformSession(session) {
  if (!session) return false
  if (session.audience === AUDIENCE.PLATFORM) return true
  return session?.user?.role?.name === 'super_admin'
}

export function isSchoolSession(session) {
  if (!session?.user) return false
  if (session.audience === AUDIENCE.SCHOOL) return true
  const role = session.user?.role?.name
  return Boolean(role && role !== 'super_admin')
}
