import { api, buildUrl, getAuthHeaders } from './client.js'

// ── Super Admin Platform ──────────────────────────────────────────
export const platformDashboard = () => api.get('/api/v1/platform/dashboard')
export const platformSchools = (params = {}) => {
  const q = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(
        ([, v]) => v !== undefined && v !== null && v !== '',
      ),
    ),
  ).toString()
  return api.get(`/api/v1/platform/schools${q ? `?${q}` : ''}`)
}
export const platformCreateSchool = (payload) =>
  api.post('/api/v1/platform/schools', payload)
export const platformBulkImportSchools = (payload) =>
  api.post('/api/v1/platform/schools/bulk-import', payload)
export const platformUpdateSchool = (id, payload) =>
  api.patch(`/api/v1/platform/schools/${id}`, payload)
export const platformPlans = () => api.get('/api/v1/platform/plans')
export const platformCreatePlan = (payload) =>
  api.post('/api/v1/platform/plans', payload)
export const platformUpdatePlan = (id, payload) =>
  api.patch(`/api/v1/platform/plans/${id}`, payload)
export const platformDeletePlan = (id) =>
  api.delete(`/api/v1/platform/plans/${id}`)

/** Public marketing pricing — active plans only (no auth). */
export const publicPricingPlans = () => api.get('/api/v1/pricing/plans')

// ── Super Admin Platform Reports ─────────────────────────────────
const reportQuery = (params = {}) =>
  new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(
        ([, v]) => v !== undefined && v !== null && v !== '',
      ),
    ),
  ).toString()

export const platformReportCatalog = () =>
  api.get('/api/v1/platform/reports/catalog')
export const platformReportOverview = () =>
  api.get('/api/v1/platform/reports/overview')
export const platformReportSchools = (params = {}) => {
  const q = reportQuery(params)
  return api.get(`/api/v1/platform/reports/schools${q ? `?${q}` : ''}`)
}
export const platformReportSubscriptions = (params = {}) => {
  const q = reportQuery(params)
  return api.get(`/api/v1/platform/reports/subscriptions${q ? `?${q}` : ''}`)
}
export const platformReportRevenue = (params = {}) => {
  const q = reportQuery(params)
  return api.get(`/api/v1/platform/reports/revenue${q ? `?${q}` : ''}`)
}
export const platformReportUsers = (params = {}) => {
  const q = reportQuery(params)
  return api.get(`/api/v1/platform/reports/users${q ? `?${q}` : ''}`)
}
export const platformReportGrowth = (params = {}) => {
  const q = reportQuery(params)
  return api.get(`/api/v1/platform/reports/growth${q ? `?${q}` : ''}`)
}
export const platformReportTanzaniaRegistry = (params = {}) => {
  const q = reportQuery(params)
  return api.get(
    `/api/v1/platform/reports/tanzania-registry${q ? `?${q}` : ''}`,
  )
}
export const platformReportAudit = (params = {}) => {
  const q = reportQuery(params)
  return api.get(`/api/v1/platform/reports/audit${q ? `?${q}` : ''}`)
}
export const platformSubscriptions = (params = {}) => {
  const q = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(
        ([, v]) => v !== undefined && v !== null && v !== '',
      ),
    ),
  ).toString()
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
export const platformUpdateSettings = (payload) =>
  api.patch('/api/v1/platform/settings', payload)
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

/** Server-side bulk status update */
export const bulkUpdateStudentStatus = (payload) =>
  api.post('/api/v1/students/bulk-status', payload)
export const studentStatusSummary = () =>
  api.get('/api/v1/students/status-summary')

// ── Student identity (ID cards / QR / barcode) ────────────────────
export const listIdCardTemplates = () =>
  api.get('/api/v1/students/identity/templates')
export const getIdCardSettings = () =>
  api.get('/api/v1/students/identity/settings')
export const updateIdCardSettings = (payload) =>
  api.patch('/api/v1/students/identity/settings', payload)
export const listIdentityRoster = (params = {}) => {
  const q = toQuery(params)
  return api.get(`/api/v1/students/identity/roster${q ? `?${q}` : ''}`)
}
export const listStudentIdCards = (params = {}) => {
  const q = toQuery(params)
  return api.get(`/api/v1/students/identity/cards${q ? `?${q}` : ''}`)
}
export const issueStudentIdCards = (payload) =>
  api.post('/api/v1/students/identity/cards/issue', payload)
export const getStudentIdCard = (id) =>
  api.get(`/api/v1/students/identity/cards/${id}`)
export const updateStudentIdCard = (id, payload) =>
  api.patch(`/api/v1/students/identity/cards/${id}`, payload)
export const markIdCardsPrinted = (cardIds) =>
  api.post('/api/v1/students/identity/cards/mark-printed', { card_ids: cardIds })

// ── Guardians / parents ───────────────────────────────────────────
export const listGuardians = (params = {}) => {
  const q = toQuery(params)
  return api.get(`/api/v1/guardians${q ? `?${q}` : ''}`)
}
export const createGuardian = (payload) => api.post('/api/v1/guardians', payload)
export const updateGuardian = (id, payload) =>
  api.patch(`/api/v1/guardians/${id}`, payload)
export const deleteGuardian = (id) => api.delete(`/api/v1/guardians/${id}`)

// ── Medical ───────────────────────────────────────────────────────
export const listMedicalRecords = (params = {}) => {
  const q = toQuery(params)
  return api.get(`/api/v1/students/medical${q ? `?${q}` : ''}`)
}
export const getMedicalRecord = (studentId) =>
  api.get(`/api/v1/students/${studentId}/medical`)
export const saveMedicalRecord = (studentId, payload) =>
  api.put(`/api/v1/students/${studentId}/medical`, payload)

// ── Previous school ───────────────────────────────────────────────
export const listPreviousSchools = (params = {}) => {
  const q = toQuery(params)
  return api.get(`/api/v1/students/previous-school${q ? `?${q}` : ''}`)
}
export const updatePreviousSchool = (studentId, payload) =>
  api.patch(`/api/v1/students/${studentId}/previous-school`, payload)

// ── Student documents ─────────────────────────────────────────────
export const listStudentDocuments = (params = {}) => {
  const q = toQuery(params)
  return api.get(`/api/v1/students/documents${q ? `?${q}` : ''}`)
}
export const createStudentDocument = (payload) =>
  api.post('/api/v1/students/documents', payload)
export const updateStudentDocument = (id, payload) =>
  api.patch(`/api/v1/students/documents/${id}`, payload)
export const deleteStudentDocument = (id) =>
  api.delete(`/api/v1/students/documents/${id}`)

// ── Lifecycle: transfers, graduation, alumni ──────────────────────
export const listTransfers = (params = {}) => {
  const q = toQuery(params)
  return api.get(`/api/v1/students/transfers${q ? `?${q}` : ''}`)
}
export const createTransfer = (payload) =>
  api.post('/api/v1/students/transfers', payload)
export const updateTransfer = (id, payload) =>
  api.patch(`/api/v1/students/transfers/${id}`, payload)
export const deleteTransfer = (id) =>
  api.delete(`/api/v1/students/transfers/${id}`)

export const listGraduations = (params = {}) => {
  const q = toQuery(params)
  return api.get(`/api/v1/students/graduations${q ? `?${q}` : ''}`)
}
export const createGraduation = (payload) =>
  api.post('/api/v1/students/graduations', payload)
export const updateGraduation = (id, payload) =>
  api.patch(`/api/v1/students/graduations/${id}`, payload)
export const deleteGraduation = (id) =>
  api.delete(`/api/v1/students/graduations/${id}`)

export const listAlumni = (params = {}) => {
  const q = toQuery(params)
  return api.get(`/api/v1/students/alumni${q ? `?${q}` : ''}`)
}
export const updateAlumni = (studentId, payload) =>
  api.patch(`/api/v1/students/alumni/${studentId}`, payload)

// ── Admissions / join applications ────────────────────────────────
export const listAdmissions = (params = {}) => {
  const q = toQuery(params)
  return api.get(`/api/v1/admissions${q ? `?${q}` : ''}`)
}
export const getAdmission = (id) => api.get(`/api/v1/admissions/${id}`)
export const createAdmission = (payload) =>
  api.post('/api/v1/admissions', payload)
export const updateAdmission = (id, payload) =>
  api.patch(`/api/v1/admissions/${id}`, payload)
export const approveAdmission = (id, payload = {}) =>
  api.post(`/api/v1/admissions/${id}/approve`, payload)
export const rejectAdmission = (id, payload = {}) =>
  api.post(`/api/v1/admissions/${id}/reject`, payload)

/** Public join form (no auth) */
export const publicSchoolInfo = (code) =>
  api.get(`/api/v1/public/schools/${encodeURIComponent(code)}`)
export const publicSubmitApplication = (code, payload) =>
  api.post(
    `/api/v1/public/schools/${encodeURIComponent(code)}/applications`,
    payload,
  )

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

export const listPaymentMethods = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return api.get(`/api/v1/finance/methods${q ? `?${q}` : ''}`)
}
export const createPaymentMethod = (payload) =>
  api.post('/api/v1/finance/methods', payload)
export const updatePaymentMethod = (id, payload) =>
  api.patch(`/api/v1/finance/methods/${id}`, payload)
export const deletePaymentMethod = (id) =>
  api.delete(`/api/v1/finance/methods/${id}`)

export const listStudentFees = (params = {}) => {
  const q = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(
        ([, v]) => v !== undefined && v !== null && v !== '',
      ),
    ),
  ).toString()
  return api.get(`/api/v1/finance/student-fees${q ? `?${q}` : ''}`)
}
export const getStudentFees = (id) =>
  api.get(`/api/v1/finance/student-fees/${id}`)

const financeQ = (params = {}) =>
  new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(
        ([, v]) => v !== undefined && v !== null && v !== '',
      ),
    ),
  ).toString()

// Receipts, refunds, adjustments, outstanding, reports
export const listReceipts = (params = {}) => {
  const q = financeQ(params)
  return api.get(`/api/v1/finance/receipts${q ? `?${q}` : ''}`)
}
export const listRefunds = (params = {}) => {
  const q = financeQ(params)
  return api.get(`/api/v1/finance/refunds${q ? `?${q}` : ''}`)
}
export const createRefund = (payload) =>
  api.post('/api/v1/finance/refunds', payload)
export const listAdjustments = (params = {}) => {
  const q = financeQ(params)
  return api.get(`/api/v1/finance/adjustments${q ? `?${q}` : ''}`)
}
export const createAdjustment = (payload) =>
  api.post('/api/v1/finance/adjustments', payload)
export const voidAdjustment = (id) =>
  api.post(`/api/v1/finance/adjustments/${id}/void`)
export const listOutstandingFees = (params = {}) => {
  const q = financeQ(params)
  return api.get(`/api/v1/finance/outstanding${q ? `?${q}` : ''}`)
}
export const listFeeStatements = (params = {}) => {
  const q = financeQ(params)
  return api.get(`/api/v1/finance/statements${q ? `?${q}` : ''}`)
}
export const getFinancialReports = (params = {}) => {
  const q = financeQ(params)
  return api.get(`/api/v1/finance/reports${q ? `?${q}` : ''}`)
}

// ── Accounting ────────────────────────────────────────────────────
export const listChartOfAccounts = (params = {}) => {
  const q = financeQ(params)
  return api.get(`/api/v1/accounting/coa${q ? `?${q}` : ''}`)
}
export const createChartOfAccount = (payload) =>
  api.post('/api/v1/accounting/coa', payload)
export const updateChartOfAccount = (id, payload) =>
  api.patch(`/api/v1/accounting/coa/${id}`, payload)

export const listBankAccounts = () => api.get('/api/v1/accounting/banks')
export const createBankAccount = (payload) =>
  api.post('/api/v1/accounting/banks', payload)
export const updateBankAccount = (id, payload) =>
  api.patch(`/api/v1/accounting/banks/${id}`, payload)

export const listBudgets = () => api.get('/api/v1/accounting/budgets')
export const createBudget = (payload) =>
  api.post('/api/v1/accounting/budgets', payload)
export const updateBudget = (id, payload) =>
  api.patch(`/api/v1/accounting/budgets/${id}`, payload)

export const listCashMovements = (params = {}) => {
  const q = financeQ(params)
  return api.get(`/api/v1/accounting/cash${q ? `?${q}` : ''}`)
}
export const createCashMovement = (payload) =>
  api.post('/api/v1/accounting/cash', payload)

export const listJournalEntries = (params = {}) => {
  const q = financeQ(params)
  return api.get(`/api/v1/accounting/journals${q ? `?${q}` : ''}`)
}
export const createJournalEntry = (payload) =>
  api.post('/api/v1/accounting/journals', payload)

export const getGeneralLedger = (params = {}) => {
  const q = financeQ(params)
  return api.get(`/api/v1/accounting/ledger${q ? `?${q}` : ''}`)
}
export const getTrialBalance = (params = {}) => {
  const q = financeQ(params)
  return api.get(`/api/v1/accounting/trial-balance${q ? `?${q}` : ''}`)
}
export const getProfitAndLoss = (params = {}) => {
  const q = financeQ(params)
  return api.get(`/api/v1/accounting/pnl${q ? `?${q}` : ''}`)
}
export const getBalanceSheet = (params = {}) => {
  const q = financeQ(params)
  return api.get(`/api/v1/accounting/balance-sheet${q ? `?${q}` : ''}`)
}

// ── Ops: Inventory ────────────────────────────────────────────────
export const listInvCategories = () => api.get('/api/v1/inventory/categories')
export const createInvCategory = (payload) =>
  api.post('/api/v1/inventory/categories', payload)
export const updateInvCategory = (id, payload) =>
  api.patch(`/api/v1/inventory/categories/${id}`, payload)
export const listInvSuppliers = () => api.get('/api/v1/inventory/suppliers')
export const createInvSupplier = (payload) =>
  api.post('/api/v1/inventory/suppliers', payload)
export const updateInvSupplier = (id, payload) =>
  api.patch(`/api/v1/inventory/suppliers/${id}`, payload)
export const listInvAssets = (params = {}) => {
  const q = financeQ(params)
  return api.get(`/api/v1/inventory/assets${q ? `?${q}` : ''}`)
}
export const createInvAsset = (payload) =>
  api.post('/api/v1/inventory/assets', payload)
export const updateInvAsset = (id, payload) =>
  api.patch(`/api/v1/inventory/assets/${id}`, payload)
export const listStockItems = () => api.get('/api/v1/inventory/stock-items')
export const createStockItem = (payload) =>
  api.post('/api/v1/inventory/stock-items', payload)
export const updateStockItem = (id, payload) =>
  api.patch(`/api/v1/inventory/stock-items/${id}`, payload)
export const listStockMovements = (params = {}) => {
  const q = financeQ(params)
  return api.get(`/api/v1/inventory/movements${q ? `?${q}` : ''}`)
}
export const createStockMovement = (payload) =>
  api.post('/api/v1/inventory/movements', payload)
export const listPurchaseOrders = () =>
  api.get('/api/v1/inventory/purchase-orders')
export const createPurchaseOrder = (payload) =>
  api.post('/api/v1/inventory/purchase-orders', payload)
export const updatePurchaseOrder = (id, payload) =>
  api.patch(`/api/v1/inventory/purchase-orders/${id}`, payload)
export const listInvAlerts = () => api.get('/api/v1/inventory/alerts')
export const getInvReports = () => api.get('/api/v1/inventory/reports')

// ── Ops: Library ──────────────────────────────────────────────────
export const listLibCategories = () => api.get('/api/v1/library/categories')
export const createLibCategory = (payload) =>
  api.post('/api/v1/library/categories', payload)
export const updateLibCategory = (id, payload) =>
  api.patch(`/api/v1/library/categories/${id}`, payload)
export const listLibBooks = (params = {}) => {
  const q = financeQ(params)
  return api.get(`/api/v1/library/books${q ? `?${q}` : ''}`)
}
export const createLibBook = (payload) =>
  api.post('/api/v1/library/books', payload)
export const updateLibBook = (id, payload) =>
  api.patch(`/api/v1/library/books/${id}`, payload)
export const listLibLoans = (params = {}) => {
  const q = financeQ(params)
  return api.get(`/api/v1/library/loans${q ? `?${q}` : ''}`)
}
export const createLibLoan = (payload) =>
  api.post('/api/v1/library/loans', payload)
export const returnLibLoan = (id, payload = {}) =>
  api.post(`/api/v1/library/loans/${id}/return`, payload)
export const listLibReservations = () =>
  api.get('/api/v1/library/reservations')
export const createLibReservation = (payload) =>
  api.post('/api/v1/library/reservations', payload)
export const updateLibReservation = (id, payload) =>
  api.patch(`/api/v1/library/reservations/${id}`, payload)
export const listLibOverdue = () => api.get('/api/v1/library/overdue')
export const listLibFines = () => api.get('/api/v1/library/fines')
export const getLibReports = () => api.get('/api/v1/library/reports')

// ── Ops: Transport ────────────────────────────────────────────────
export const getTransportOverview = () =>
  api.get('/api/v1/transport/overview')
export const listVehicles = () => api.get('/api/v1/transport/vehicles')
export const createVehicle = (payload) =>
  api.post('/api/v1/transport/vehicles', payload)
export const updateVehicle = (id, payload) =>
  api.patch(`/api/v1/transport/vehicles/${id}`, payload)
export const listDrivers = () => api.get('/api/v1/transport/drivers')
export const createDriver = (payload) =>
  api.post('/api/v1/transport/drivers', payload)
export const updateDriver = (id, payload) =>
  api.patch(`/api/v1/transport/drivers/${id}`, payload)
export const listTransportRoutes = () => api.get('/api/v1/transport/routes')
export const createTransportRoute = (payload) =>
  api.post('/api/v1/transport/routes', payload)
export const updateTransportRoute = (id, payload) =>
  api.patch(`/api/v1/transport/routes/${id}`, payload)
export const listTransportStops = (params = {}) => {
  const q = financeQ(params)
  return api.get(`/api/v1/transport/stops${q ? `?${q}` : ''}`)
}
export const createTransportStop = (payload) =>
  api.post('/api/v1/transport/stops', payload)
export const updateTransportStop = (id, payload) =>
  api.patch(`/api/v1/transport/stops/${id}`, payload)
export const listTransportAllocations = () =>
  api.get('/api/v1/transport/allocations')
export const createTransportAllocation = (payload) =>
  api.post('/api/v1/transport/allocations', payload)
export const deleteTransportAllocation = (id) =>
  api.delete(`/api/v1/transport/allocations/${id}`)
export const listVehicleMaintenance = () =>
  api.get('/api/v1/transport/maintenance')
export const createVehicleMaintenance = (payload) =>
  api.post('/api/v1/transport/maintenance', payload)
export const listTransportFees = () => api.get('/api/v1/transport/fees')
export const createTransportFee = (payload) =>
  api.post('/api/v1/transport/fees', payload)
export const updateTransportFee = (id, payload) =>
  api.patch(`/api/v1/transport/fees/${id}`, payload)

// ── Ops: Hostel ───────────────────────────────────────────────────
export const getHostelOverview = () => api.get('/api/v1/hostel/overview')
export const listHostels = () => api.get('/api/v1/hostel/hostels')
export const createHostel = (payload) =>
  api.post('/api/v1/hostel/hostels', payload)
export const updateHostel = (id, payload) =>
  api.patch(`/api/v1/hostel/hostels/${id}`, payload)
export const listHostelRooms = (params = {}) => {
  const q = financeQ(params)
  return api.get(`/api/v1/hostel/rooms${q ? `?${q}` : ''}`)
}
export const createHostelRoom = (payload) =>
  api.post('/api/v1/hostel/rooms', payload)
export const updateHostelRoom = (id, payload) =>
  api.patch(`/api/v1/hostel/rooms/${id}`, payload)
export const listHostelBeds = (params = {}) => {
  const q = financeQ(params)
  return api.get(`/api/v1/hostel/beds${q ? `?${q}` : ''}`)
}
export const createHostelBed = (payload) =>
  api.post('/api/v1/hostel/beds', payload)
export const listHostelAllocations = (params = {}) => {
  const q = financeQ(params)
  return api.get(`/api/v1/hostel/allocations${q ? `?${q}` : ''}`)
}
export const hostelCheckIn = (payload) =>
  api.post('/api/v1/hostel/check-in', payload)
export const hostelCheckOut = (id) =>
  api.post(`/api/v1/hostel/allocations/${id}/check-out`)
export const listHostelFees = () => api.get('/api/v1/hostel/fees')
export const createHostelFee = (payload) =>
  api.post('/api/v1/hostel/fees', payload)
export const getHostelOccupancy = () => api.get('/api/v1/hostel/occupancy')

// ── Learning (TAMISEMI digital resources + classroom) ─────────────
export const getLearningOverview = () => api.get('/api/v1/learning/overview')
export const getLearningReports = () => api.get('/api/v1/learning/reports')
export const listLearningResources = (params = {}) => {
  const q = financeQ(params)
  return api.get(`/api/v1/learning/resources${q ? `?${q}` : ''}`)
}
export const createLearningResource = (payload) =>
  api.post('/api/v1/learning/resources', payload)
export const updateLearningResource = (id, payload) =>
  api.patch(`/api/v1/learning/resources/${id}`, payload)
export const archiveLearningResource = (id) =>
  api.delete(`/api/v1/learning/resources/${id}`)
export const trackLearningResource = (id, action = 'view') =>
  api.post(`/api/v1/learning/resources/${id}/track`, { action })

export const listCourses = (params = {}) => {
  const q = financeQ(params)
  return api.get(`/api/v1/learning/courses${q ? `?${q}` : ''}`)
}
export const getCourse = (id) => api.get(`/api/v1/learning/courses/${id}`)
export const createCourse = (payload) =>
  api.post('/api/v1/learning/courses', payload)
export const updateCourse = (id, payload) =>
  api.patch(`/api/v1/learning/courses/${id}`, payload)
export const createLesson = (payload) =>
  api.post('/api/v1/learning/lessons', payload)
export const updateLesson = (id, payload) =>
  api.patch(`/api/v1/learning/lessons/${id}`, payload)
export const deleteLesson = (id) =>
  api.delete(`/api/v1/learning/lessons/${id}`)

export const listAssignments = (params = {}) => {
  const q = financeQ(params)
  return api.get(`/api/v1/learning/assignments${q ? `?${q}` : ''}`)
}
export const getAssignment = (id) =>
  api.get(`/api/v1/learning/assignments/${id}`)
export const createAssignment = (payload) =>
  api.post('/api/v1/learning/assignments', payload)
export const updateAssignment = (id, payload) =>
  api.patch(`/api/v1/learning/assignments/${id}`, payload)
export const listAssignmentSubmissions = (params = {}) => {
  const q = financeQ(params)
  return api.get(`/api/v1/learning/submissions${q ? `?${q}` : ''}`)
}
export const createAssignmentSubmission = (payload) =>
  api.post('/api/v1/learning/submissions', payload)
export const gradeAssignmentSubmission = (id, payload) =>
  api.post(`/api/v1/learning/submissions/${id}/grade`, payload)

// Homework aliases
export const getHomeworkOverview = () => api.get('/api/v1/homework/overview')
export const getHomeworkReports = () => api.get('/api/v1/homework/reports')

// ── System (school reports, users, compliance, admin) ─────────────
const schoolQ = (params = {}) => toQuery(params)

export const getSchoolReportsOverview = () =>
  api.get('/api/v1/school/reports/overview')
export const getSchoolReportsStudents = () =>
  api.get('/api/v1/school/reports/students')
export const getSchoolReportsAttendance = (params = {}) => {
  const q = schoolQ(params)
  return api.get(`/api/v1/school/reports/attendance${q ? `?${q}` : ''}`)
}
export const getSchoolReportsExams = () =>
  api.get('/api/v1/school/reports/exams')
export const getSchoolReportsTeachers = () =>
  api.get('/api/v1/school/reports/teachers')
export const getSchoolReportsFinance = (params = {}) => {
  const q = schoolQ(params)
  return api.get(`/api/v1/school/reports/finance${q ? `?${q}` : ''}`)
}
export const getSchoolReportsInventory = () =>
  api.get('/api/v1/school/reports/inventory')

export const listSchoolUsers = (params = {}) => {
  const q = schoolQ(params)
  return api.get(`/api/v1/school/users${q ? `?${q}` : ''}`)
}
export const createSchoolUser = (payload) =>
  api.post('/api/v1/school/users', payload)
export const updateSchoolUser = (id, payload) =>
  api.patch(`/api/v1/school/users/${id}`, payload)
export const listSchoolRoles = (params = {}) => {
  const q = schoolQ(params)
  return api.get(`/api/v1/school/roles${q ? `?${q}` : ''}`)
}
export const updateSchoolRole = (id, payload) =>
  api.patch(`/api/v1/school/roles/${id}`, payload)
export const listSchoolPermissions = () =>
  api.get('/api/v1/school/permissions')
export const listSchoolAuditLogs = (params = {}) => {
  const q = schoolQ(params)
  return api.get(`/api/v1/school/audit-logs${q ? `?${q}` : ''}`)
}
export const listSchoolLoginHistory = (params = {}) => {
  const q = schoolQ(params)
  return api.get(`/api/v1/school/login-history${q ? `?${q}` : ''}`)
}
export const getPasswordPolicy = () =>
  api.get('/api/v1/school/password-policy')
export const updatePasswordPolicy = (payload) =>
  api.put('/api/v1/school/password-policy', payload)
export const getTwoFactorSettings = () => api.get('/api/v1/school/2fa')
export const updateTwoFactorSettings = (payload) =>
  api.put('/api/v1/school/2fa', payload)

export const getComplianceOverview = () =>
  api.get('/api/v1/school/compliance/overview')
export const getComplianceCensus = () =>
  api.get('/api/v1/school/compliance/census')
export const getComplianceEnrollment = () =>
  api.get('/api/v1/school/compliance/enrollment')
export const getComplianceProfile = () =>
  api.get('/api/v1/school/compliance/profile')
export const getComplianceExport = (params = {}) => {
  const q = schoolQ(params)
  return api.get(`/api/v1/school/compliance/export${q ? `?${q}` : ''}`)
}

export const getAdminSettings = () =>
  api.get('/api/v1/school/admin/settings')
export const updateAdminSettings = (payload) =>
  api.put('/api/v1/school/admin/settings', payload)
export const getGatewayConfig = (channel) =>
  api.get(`/api/v1/school/admin/gateways/${channel}`)
export const updateGatewayConfig = (channel, payload) =>
  api.put(`/api/v1/school/admin/gateways/${channel}`, payload)
export const listNotificationTemplates = () =>
  api.get('/api/v1/school/admin/templates')
export const saveNotificationTemplate = (payload) =>
  api.post('/api/v1/school/admin/templates', payload)
export const listWebhooks = () => api.get('/api/v1/school/admin/webhooks')
export const createWebhook = (payload) =>
  api.post('/api/v1/school/admin/webhooks', payload)
export const updateWebhook = (id, payload) =>
  api.patch(`/api/v1/school/admin/webhooks/${id}`, payload)
export const deleteWebhook = (id) =>
  api.delete(`/api/v1/school/admin/webhooks/${id}`)
export const getBackupStatus = () => api.get('/api/v1/school/admin/backup')
export const requestBackup = () =>
  api.post('/api/v1/school/admin/backup/request')
export const listSystemLogs = (params = {}) => {
  const q = schoolQ(params)
  return api.get(`/api/v1/school/admin/logs${q ? `?${q}` : ''}`)
}
export const getApiKeys = () => api.get('/api/v1/school/admin/api-keys')
export const rotateApiKeys = () =>
  api.post('/api/v1/school/admin/api-keys/rotate')

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
