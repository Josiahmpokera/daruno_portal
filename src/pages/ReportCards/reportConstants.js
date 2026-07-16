/** Report card kinds (TAMISEMI / school SIS) */
export const REPORT_KIND_OPTIONS = [
  {
    value: 'terminal',
    label: 'Terminal report',
    description: 'End-of-term NECTA-style card with subject grades and division',
  },
  {
    value: 'annual',
    label: 'Annual report',
    description: 'Full-year summary across terms (published results only)',
  },
  {
    value: 'progress',
    label: 'Progress report',
    description: 'Mid-cycle progress for parents and remedial planning',
  },
  {
    value: 'transcript',
    label: 'Transcript',
    description: 'Official academic transcript for transfers and archives',
  },
]

export const REPORT_KIND_LABEL = Object.fromEntries(
  REPORT_KIND_OPTIONS.map((k) => [k.value, k.label]),
)

/**
 * Path → workspace section
 * Keeps nav lean: generate (by type), positions, bulk, remarks, extras, overview
 */
export function reportSectionFromPath(pathname) {
  if (!pathname) return 'overview'
  if (pathname === '/report-cards' || pathname === '/report-cards/') {
    return 'overview'
  }
  if (pathname.includes('/positions') || pathname.includes('/subject-ranking')) {
    return 'positions'
  }
  if (pathname.includes('/bulk') || pathname.includes('/pdf')) {
    return 'bulk'
  }
  if (
    pathname.includes('/remarks') ||
    pathname.includes('/teacher-remarks') ||
    pathname.includes('/head-remarks')
  ) {
    return 'remarks'
  }
  if (
    pathname.includes('/extras') ||
    pathname.includes('/attendance') ||
    pathname.includes('/fee-balance')
  ) {
    return 'extras'
  }
  if (pathname.includes('/annual')) return 'generate'
  if (pathname.includes('/progress')) return 'generate'
  if (pathname.includes('/transcript')) return 'generate'
  if (pathname.includes('/terminal')) return 'generate'
  if (pathname.includes('/generate') || pathname.includes('/cards')) {
    return 'generate'
  }
  return 'overview'
}

export function reportKindFromPath(pathname) {
  if (!pathname) return 'terminal'
  if (pathname.includes('/annual')) return 'annual'
  if (pathname.includes('/progress')) return 'progress'
  if (pathname.includes('/transcript')) return 'transcript'
  if (pathname.includes('/terminal')) return 'terminal'
  return 'terminal'
}

export const REPORT_SECTION_META = {
  overview: {
    title: 'Report cards',
    description:
      'TAMISEMI / NECTA-oriented learner reports — generate by class, positions, bulk print',
  },
  generate: {
    title: 'Generate report cards',
    description:
      'Select year, term, class and learner(s). Grades use published assessments only.',
  },
  positions: {
    title: 'Class positions',
    description:
      'Division and position list for the class (NECTA points — lower average is better)',
  },
  bulk: {
    title: 'Bulk print / export',
    description:
      'Print or export an entire class set of report cards in one document',
  },
  remarks: {
    title: 'Remarks on reports',
    description:
      'Class teacher and head teacher remarks appear on NECTA-style report cards',
  },
  extras: {
    title: 'Report extras',
    description:
      'Optional attendance and fee balance sections for printed report cards',
  },
}

/** Industrial workflow for report cards */
export const REPORT_WORKFLOW = [
  {
    key: 'publish',
    label: '1. Publish marks',
    path: '/examinations/approval',
    hint: 'Only published assessments count',
  },
  {
    key: 'generate',
    label: '2. Generate',
    path: '/report-cards/generate',
    hint: 'Class → learner(s)',
  },
  {
    key: 'positions',
    label: '3. Positions',
    path: '/report-cards/positions',
    hint: 'Division & ranking',
  },
  {
    key: 'bulk',
    label: '4. Bulk print',
    path: '/report-cards/bulk',
    hint: 'Whole class PDF',
  },
]
