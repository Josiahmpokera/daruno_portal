/**
 * Portal side of school RBAC. The API is the authority
 * (daruno_backend/config/daruno_access.php); this only hides what the
 * signed-in role cannot open, so users don't land on pages full of 403s.
 */

/** Portal path prefix → API access area. Longest prefix wins. */
const PATH_AREAS = [
  ['/students/admissions', 'admissions'],
  ['/students', 'students'],
  ['/parents', 'students'],
  ['/teachers', 'staff'],
  ['/staff', 'staff'],
  ['/school-profile', 'school-profile'],
  ['/academic', 'academic'],
  ['/classes', 'academic'],
  ['/attendance', 'attendance'],
  ['/examinations', 'examinations'],
  ['/report-cards', 'report-cards'],
  ['/promotions', 'promotions'],
  ['/learning', 'learning'],
  ['/homework', 'learning'],
  ['/finance', 'finance'],
  ['/accounting', 'accounting'],
  ['/inventory', 'inventory'],
  ['/library', 'library'],
  ['/transport', 'transport'],
  ['/hostel', 'hostel'],
  ['/reports', 'reports'],
  ['/users', 'users'],
  ['/compliance', 'compliance'],
  ['/admin', 'admin'],
  ['/settings', 'admin'],
  ['/communication/messages', 'messaging'],
  ['/communication/sms', 'messaging'],
  ['/communication/email', 'messaging'],
  ['/communication', 'announcements'],
].sort((a, b) => b[0].length - a[0].length)

/** Paths every signed-in school user may open. */
const OPEN_PATHS = ['/dashboard']

/**
 * @param {string} pathname
 * @returns {string|null} area key, 'modules' for other module pages, null if open
 */
export function areaForPath(pathname = '') {
  const path = String(pathname).split(/[?#]/)[0]
  if (OPEN_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) return null
  const hit = PATH_AREAS.find(
    ([prefix]) => path === prefix || path.startsWith(`${prefix}/`),
  )
  return hit ? hit[1] : 'modules'
}

/**
 * @param {Record<string, {read: boolean, write: boolean}>|null} permissions
 * @param {string|null} area
 * @param {'read'|'write'} mode
 */
export function canAccess(permissions, area, mode = 'read') {
  if (!area) return true
  // Sessions saved before permissions existed: let the API decide.
  if (!permissions) return true
  const entry = permissions[area]
  if (!entry) return false
  return mode === 'write' ? Boolean(entry.write) : Boolean(entry.read || entry.write)
}

export function canAccessPath(permissions, pathname) {
  return canAccess(permissions, areaForPath(pathname), 'read')
}

/** True when the role has no staff-portal area at all (e.g. parent, student). */
export function hasNoPortalAccess(permissions) {
  if (!permissions) return false
  return !Object.values(permissions).some((p) => p?.read || p?.write)
}
