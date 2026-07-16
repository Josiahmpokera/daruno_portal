import { api, buildUrl, getAuthHeaders } from './client.js'

// ── Super Admin Platform ──────────────────────────────────────────
export const platformDashboard = () => api.get('/api/v1/platform/dashboard')
export const platformSchools = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return api.get(`/api/v1/platform/schools${q ? `?${q}` : ''}`)
}
export const platformCreateSchool = (payload) =>
  api.post('/api/v1/platform/schools', payload)
export const platformUpdateSchool = (id, payload) =>
  api.patch(`/api/v1/platform/schools/${id}`, payload)
export const platformPlans = () => api.get('/api/v1/platform/plans')
export const platformCreatePlan = (payload) =>
  api.post('/api/v1/platform/plans', payload)
export const platformUpdatePlan = (id, payload) =>
  api.patch(`/api/v1/platform/plans/${id}`, payload)
export const platformDeletePlan = (id) =>
  api.delete(`/api/v1/platform/plans/${id}`)
export const platformSubscriptions = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return api.get(`/api/v1/platform/subscriptions${q ? `?${q}` : ''}`)
}
export const platformUpdateSubscription = (id, payload) =>
  api.patch(`/api/v1/platform/subscriptions/${id}`, payload)
export const platformUsers = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return api.get(`/api/v1/platform/users${q ? `?${q}` : ''}`)
}
export const platformCreateUser = (payload) =>
  api.post('/api/v1/platform/users', payload)
export const platformRoles = () => api.get('/api/v1/platform/roles')
export const platformBilling = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return api.get(`/api/v1/platform/billing${q ? `?${q}` : ''}`)
}
export const platformCreateInvoice = (payload) =>
  api.post('/api/v1/platform/billing', payload)
export const platformMarkInvoicePaid = (id) =>
  api.post(`/api/v1/platform/billing/${id}/pay`, {})
export const platformNotifications = () =>
  api.get('/api/v1/platform/notifications')
export const platformCreateNotification = (payload) =>
  api.post('/api/v1/platform/notifications', payload)
export const platformSettings = () => api.get('/api/v1/platform/settings')
export const platformAuditLogs = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return api.get(`/api/v1/platform/audit-logs${q ? `?${q}` : ''}`)
}

// ── School profile (tenant) ───────────────────────────────────────
export const getSchoolProfile = () => api.get('/api/v1/school/profile')
export const updateSchoolProfile = (payload) =>
  api.patch('/api/v1/school/profile', payload)

// ── Students ──────────────────────────────────────────────────────
const toQuery = (params = {}) =>
  new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(
        ([, v]) => v !== undefined && v !== null && v !== '',
      ),
    ),
  ).toString()

export const listStudents = (params = {}) => {
  const q = toQuery(params)
  return api.get(`/api/v1/students${q ? `?${q}` : ''}`)
}
export const getStudent = (id) => api.get(`/api/v1/students/${id}`)
/** Active learners by education level: boys / girls / total */
export const studentHeadcountByLevel = () =>
  api.get('/api/v1/students/headcount-by-level')
export const createStudent = (payload) => api.post('/api/v1/students', payload)
export const updateStudent = (id, payload) => api.patch(`/api/v1/students/${id}`, payload)
export const deleteStudent = (id) => api.delete(`/api/v1/students/${id}`)

/** Update many students (status, etc.) — sequential with partial success */
export const bulkUpdateStudents = async (ids, payload) => {
  const results = { ok: [], failed: [] }
  for (const id of ids) {
    try {
      await updateStudent(id, payload)
      results.ok.push(id)
    } catch {
      results.failed.push(id)
    }
  }
  return results
}

// ── Staff (non-teaching) ──────────────────────────────────────────
export const listStaff = (params = {}) => {
  const q = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
    ),
  ).toString()
  return api.get(`/api/v1/staff${q ? `?${q}` : ''}`)
}
export const createStaff = (payload) => api.post('/api/v1/staff', payload)
export const updateStaff = (id, payload) => api.patch(`/api/v1/staff/${id}`, payload)
export const deleteStaff = (id) => api.delete(`/api/v1/staff/${id}`)

export const listDepartments = () => api.get('/api/v1/staff-departments')
export const createDepartment = (payload) => api.post('/api/v1/staff-departments', payload)
export const updateDepartment = (id, payload) =>
  api.patch(`/api/v1/staff-departments/${id}`, payload)
export const deleteDepartment = (id) => api.delete(`/api/v1/staff-departments/${id}`)

export const listStaffPositions = () => api.get('/api/v1/staff-positions')
export const createStaffPosition = (payload) => api.post('/api/v1/staff-positions', payload)
export const updateStaffPosition = (id, payload) =>
  api.patch(`/api/v1/staff-positions/${id}`, payload)
export const deleteStaffPosition = (id) => api.delete(`/api/v1/staff-positions/${id}`)

// ── Academic ──────────────────────────────────────────────────────
const academicQuery = (params = {}) =>
  new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(
        ([, v]) => v !== undefined && v !== null && v !== '',
      ),
    ),
  ).toString()

export const listYears = () => api.get('/api/v1/academic/years')
export const createYear = (payload) => api.post('/api/v1/academic/years', payload)
export const updateYear = (id, payload) => api.patch(`/api/v1/academic/years/${id}`, payload)
export const deleteYear = (id) => api.delete(`/api/v1/academic/years/${id}`)

export const listTerms = (params = {}) => {
  const q = academicQuery(params)
  return api.get(`/api/v1/academic/terms${q ? `?${q}` : ''}`)
}
export const createTerm = (payload) => api.post('/api/v1/academic/terms', payload)
export const updateTerm = (id, payload) => api.patch(`/api/v1/academic/terms/${id}`, payload)
export const deleteTerm = (id) => api.delete(`/api/v1/academic/terms/${id}`)

export const listLevels = () => api.get('/api/v1/academic/levels')
export const createLevel = (payload) => api.post('/api/v1/academic/levels', payload)
export const updateLevel = (id, payload) => api.patch(`/api/v1/academic/levels/${id}`, payload)
export const deleteLevel = (id) => api.delete(`/api/v1/academic/levels/${id}`)

export const listStreams = () => api.get('/api/v1/academic/streams')
export const createStream = (payload) => api.post('/api/v1/academic/streams', payload)
export const updateStream = (id, payload) => api.patch(`/api/v1/academic/streams/${id}`, payload)
export const deleteStream = (id) => api.delete(`/api/v1/academic/streams/${id}`)

export const listClasses = () => api.get('/api/v1/academic/classes')
export const createClass = (payload) => api.post('/api/v1/academic/classes', payload)
export const updateClass = (id, payload) => api.patch(`/api/v1/academic/classes/${id}`, payload)
export const deleteClass = (id) => api.delete(`/api/v1/academic/classes/${id}`)

export const listSubjects = (params = {}) => {
  const q = academicQuery(params)
  return api.get(`/api/v1/academic/subjects${q ? `?${q}` : ''}`)
}
export const createSubject = (payload) => api.post('/api/v1/academic/subjects', payload)
export const updateSubject = (id, payload) => api.patch(`/api/v1/academic/subjects/${id}`, payload)
export const deleteSubject = (id) => api.delete(`/api/v1/academic/subjects/${id}`)

export const listSubjectCategories = () =>
  api.get('/api/v1/academic/subject-categories')
export const createSubjectCategory = (payload) =>
  api.post('/api/v1/academic/subject-categories', payload)
export const updateSubjectCategory = (id, payload) =>
  api.patch(`/api/v1/academic/subject-categories/${id}`, payload)
export const deleteSubjectCategory = (id) =>
  api.delete(`/api/v1/academic/subject-categories/${id}`)

export const listSubjectCombinations = () =>
  api.get('/api/v1/academic/subject-combinations')
export const createSubjectCombination = (payload) =>
  api.post('/api/v1/academic/subject-combinations', payload)
export const updateSubjectCombination = (id, payload) =>
  api.patch(`/api/v1/academic/subject-combinations/${id}`, payload)
export const deleteSubjectCombination = (id) =>
  api.delete(`/api/v1/academic/subject-combinations/${id}`)

export const listClassSubjects = (params = {}) => {
  const q = academicQuery(params)
  return api.get(`/api/v1/academic/class-subjects${q ? `?${q}` : ''}`)
}
export const createClassSubject = (payload) =>
  api.post('/api/v1/academic/class-subjects', payload)
export const updateClassSubject = (id, payload) =>
  api.patch(`/api/v1/academic/class-subjects/${id}`, payload)
export const deleteClassSubject = (id) =>
  api.delete(`/api/v1/academic/class-subjects/${id}`)

export const listTeacherAllocations = (params = {}) => {
  const q = academicQuery(params)
  return api.get(`/api/v1/academic/teacher-allocations${q ? `?${q}` : ''}`)
}
export const createTeacherAllocation = (payload) =>
  api.post('/api/v1/academic/teacher-allocations', payload)
export const updateTeacherAllocation = (id, payload) =>
  api.patch(`/api/v1/academic/teacher-allocations/${id}`, payload)
export const deleteTeacherAllocation = (id) =>
  api.delete(`/api/v1/academic/teacher-allocations/${id}`)

// ── Finance ───────────────────────────────────────────────────────
export const listFeeCategories = () => api.get('/api/v1/finance/categories')
export const createFeeCategory = (payload) => api.post('/api/v1/finance/categories', payload)
export const listFeeStructures = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return api.get(`/api/v1/finance/structures${q ? `?${q}` : ''}`)
}
export const createFeeStructure = (payload) => api.post('/api/v1/finance/structures', payload)
export const listInvoices = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return api.get(`/api/v1/finance/invoices${q ? `?${q}` : ''}`)
}
export const generateInvoices = (payload) =>
  api.post('/api/v1/finance/invoices/generate', payload)
export const listPayments = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return api.get(`/api/v1/finance/payments${q ? `?${q}` : ''}`)
}
export const createPayment = (payload) => api.post('/api/v1/finance/payments', payload)

// ── Attendance ────────────────────────────────────────────────────
export const getAttendanceRoster = (params) => {
  const q = new URLSearchParams(params).toString()
  return api.get(`/api/v1/attendance/roster?${q}`)
}
export const markAttendance = (payload) => api.post('/api/v1/attendance/mark', payload)

// ── Examinations / report cards ───────────────────────────────────
const examQ = (params = {}) =>
  new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(
        ([, v]) => v !== undefined && v !== null && v !== '',
      ),
    ),
  ).toString()

export const listExamTypes = () => api.get('/api/v1/examinations/types')
export const listAssessments = (params = {}) => {
  const q = examQ(params)
  return api.get(`/api/v1/examinations/assessments${q ? `?${q}` : ''}`)
}
export const createAssessment = (payload) =>
  api.post('/api/v1/examinations/assessments', payload)
export const updateAssessment = (id, payload) =>
  api.patch(`/api/v1/examinations/assessments/${id}`, payload)
export const deleteAssessment = (id) =>
  api.delete(`/api/v1/examinations/assessments/${id}`)
export const getAssessmentResults = (id) =>
  api.get(`/api/v1/examinations/assessments/${id}/results`)
export const saveAssessmentResults = (id, payload) =>
  api.post(`/api/v1/examinations/assessments/${id}/results`, payload)
export const publishAssessment = (id) =>
  api.post(`/api/v1/examinations/assessments/${id}/publish`, {})
export const unpublishAssessment = (id) =>
  api.post(`/api/v1/examinations/assessments/${id}/unpublish`, {})
export const lockAssessment = (id) =>
  api.post(`/api/v1/examinations/assessments/${id}/lock`, {})
export const unlockAssessment = (id) =>
  api.post(`/api/v1/examinations/assessments/${id}/unlock`, {})
export const examRanking = (params = {}) => {
  const q = examQ(params)
  return api.get(`/api/v1/examinations/ranking${q ? `?${q}` : ''}`)
}
export const examSubjectAnalysis = (params = {}) => {
  const q = examQ(params)
  return api.get(`/api/v1/examinations/subject-analysis${q ? `?${q}` : ''}`)
}
export const getReportCard = (params) => {
  const q = examQ(params)
  return api.get(`/api/v1/report-cards?${q}`)
}
export const reportCardHtmlUrl = (params) => {
  const q = examQ(params)
  return buildUrl(`/api/v1/report-cards/html?${q}`)
}

/**
 * Fetch printable HTML for one report card (auth + school headers).
 */
export async function fetchReportCardHtml(params) {
  const headers = {
    ...getAuthHeaders(),
    Accept: 'text/html, application/json;q=0.9, */*;q=0.8',
  }
  // HTML responses should not force Content-Type: application/json semantics
  delete headers['Content-Type']

  const response = await fetch(reportCardHtmlUrl(params), { headers })
  const text = await response.text()

  if (!response.ok) {
    let message = 'Failed to load report card'
    try {
      const j = JSON.parse(text)
      message = j.error || j.message || message
    } catch {
      if (text && text.length < 240) message = text
    }
    throw new Error(message)
  }

  // API may return JSON envelope on validation failure with 200 in some cases
  if (text.trimStart().startsWith('{')) {
    try {
      const j = JSON.parse(text)
      if (j && j.success === false) {
        throw new Error(j.error || 'Failed to load report card')
      }
    } catch (e) {
      if (e.message && e.message !== 'Failed to load report card') throw e
    }
  }

  return text
}

/** Pull body inner HTML from a full document string */
function extractHtmlBody(html) {
  if (!html || typeof html !== 'string') return ''
  const m = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  return m ? m[1] : html
}

function extractHtmlHeadStyles(html) {
  if (!html || typeof html !== 'string') return ''
  const styles = []
  const re = /<style[^>]*>([\s\S]*?)<\/style>/gi
  let m
  while ((m = re.exec(html))) {
    styles.push(m[1])
  }
  return styles.join('\n')
}

/**
 * Combine multiple report-card HTML docs into one print-friendly page
 * (page-break between learners). Avoids multi-popup blockers.
 */
export function combineReportCardHtml(htmlList = []) {
  const docs = htmlList.filter(Boolean)
  if (!docs.length) return ''
  if (docs.length === 1) return docs[0]

  const styles = extractHtmlHeadStyles(docs[0])
  const bodies = docs.map((h, i) => {
    const body = extractHtmlBody(h)
    return `<section class="report-page" style="page-break-after:${
      i < docs.length - 1 ? 'always' : 'auto'
    }; break-after:${i < docs.length - 1 ? 'page' : 'auto'};">${body}</section>`
  })

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Class report cards (${docs.length})</title>
  <style>
    ${styles}
    .report-page { padding-bottom: 24px; }
    .batch-toolbar { font-family: system-ui, sans-serif; margin-bottom: 16px; }
    @media print {
      .batch-toolbar, .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="batch-toolbar no-print">
    <button type="button" onclick="window.print()" style="padding:8px 14px;cursor:pointer;">
      Print / Save PDF — all ${docs.length} cards
    </button>
    <span style="margin-left:12px;color:#666;font-size:13px;">${docs.length} report card(s)</span>
  </div>
  ${bodies.join('\n')}
</body>
</html>`
}

/**
 * Open one or many report cards for printing.
 * Opens a single tab (synchronous) so browsers do not block pop-ups after await.
 * @param {object|object[]} paramsOrList
 */
export async function openReportCardHtml(paramsOrList) {
  const list = Array.isArray(paramsOrList) ? paramsOrList : [paramsOrList]
  if (!list.length) {
    throw new Error('No students selected for printing')
  }

  // Must open before any await — keeps user-gesture so pop-up is allowed
  const win = window.open('about:blank', '_blank')
  if (!win) {
    throw new Error(
      'Pop-up blocked. Allow pop-ups for this site, then try again.',
    )
  }

  try {
    win.document.open()
    win.document.write(
      `<!DOCTYPE html><html><head><title>Loading…</title></head><body style="font-family:system-ui;padding:24px;color:#334155">
        <p>Loading report card${list.length > 1 ? 's' : ''}…</p>
        <p style="font-size:13px;color:#94a3b8">Please wait (${list.length} learner${list.length > 1 ? 's' : ''}).</p>
      </body></html>`,
    )
    win.document.close()
  } catch {
    // Cross-origin blank edge case — continue writing later
  }

  const htmlParts = []
  const errors = []
  for (const params of list) {
    try {
      const html = await fetchReportCardHtml(params)
      htmlParts.push(html)
    } catch (e) {
      errors.push(e?.message || 'Failed')
    }
  }

  if (!htmlParts.length) {
    const msg =
      errors[0] ||
      'Could not load any report cards. Check published marks and try again.'
    try {
      win.document.open()
      win.document.write(
        `<!DOCTYPE html><html><body style="font-family:system-ui;padding:24px;color:#b91c1c"><h2>Could not open report cards</h2><p>${msg}</p></body></html>`,
      )
      win.document.close()
    } catch {
      /* ignore */
    }
    throw new Error(msg)
  }

  const combined = combineReportCardHtml(htmlParts)
  try {
    win.document.open()
    win.document.write(combined)
    win.document.close()
    try {
      win.focus()
    } catch {
      /* ignore */
    }
  } catch {
    // Fallback: blob URL if document.write fails
    const blob = new Blob([combined], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    win.location.href = url
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  if (errors.length) {
    // Partial success — still opened what we could
    const partial = new Error(
      `Opened ${htmlParts.length} of ${list.length} cards. ${errors[0]}`,
    )
    partial.partial = true
    partial.opened = htmlParts.length
    partial.total = list.length
    throw partial
  }

  return { opened: htmlParts.length, total: list.length }
}
