/** TAMISEMI / NECTA exam type labels for UI */
export const EXAM_TYPE_OPTIONS = [
  { value: 'continuous', label: 'Continuous Assessment (CA)', group: 'formative' },
  { value: 'homework', label: 'Homework / assignment', group: 'formative' },
  { value: 'practical', label: 'Practical assessment', group: 'formative' },
  { value: 'weekly', label: 'Weekly / unit test', group: 'formative' },
  { value: 'midterm', label: 'Mid-term examination', group: 'summative' },
  { value: 'terminal', label: 'Terminal examination', group: 'summative' },
  { value: 'mock', label: 'Mock examination', group: 'summative' },
  { value: 'final', label: 'Final / annual examination', group: 'summative' },
  { value: 'project', label: 'Project / portfolio', group: 'formative' },
]

export const TYPE_LABEL = Object.fromEntries(
  EXAM_TYPE_OPTIONS.map((t) => [t.value, t.label]),
)

/** NECTA-oriented bands (mirrors backend NectaGrading) */
export const NECTA_BANDS = [
  { grade: 'A', min_percent: 75, points: 1, remark: 'Excellent' },
  { grade: 'B', min_percent: 65, points: 2, remark: 'Very Good' },
  { grade: 'C', min_percent: 45, points: 3, remark: 'Good' },
  { grade: 'D', min_percent: 30, points: 4, remark: 'Satisfactory' },
  { grade: 'F', min_percent: 0, points: 5, remark: 'Fail' },
]

export function gradeFromPercent(percent) {
  if (percent == null || Number.isNaN(percent)) {
    return { grade: '—', points: null, remark: '—' }
  }
  const p = Math.max(0, Math.min(100, Number(percent)))
  for (const b of NECTA_BANDS) {
    if (p >= b.min_percent) {
      return { grade: b.grade, points: b.points, remark: b.remark }
    }
  }
  return { grade: 'F', points: 5, remark: 'Fail' }
}

export function divisionFromAveragePoints(avgPoints) {
  if (avgPoints == null || Number.isNaN(avgPoints)) return '—'
  if (avgPoints <= 1.5) return 'I'
  if (avgPoints <= 2.5) return 'II'
  if (avgPoints <= 3.5) return 'III'
  if (avgPoints <= 4.5) return 'IV'
  return '0'
}

/** Industrial exam workflow (TAMISEMI-oriented) */
export const WORKFLOW_STEPS = [
  {
    key: 'schedule',
    label: '1. Schedule',
    path: '/examinations/scheduling',
    hint: 'Create CA, mid-term, terminal exams',
  },
  {
    key: 'marks',
    label: '2. Enter marks',
    path: '/examinations/marks',
    hint: 'Score every learner',
  },
  {
    key: 'review',
    label: '3. Review grades',
    path: '/examinations/grades',
    hint: 'NECTA A–F bands apply',
  },
  {
    key: 'approve',
    label: '4. Approve',
    path: '/examinations/approval',
    hint: 'Publish for report cards',
  },
  {
    key: 'lock',
    label: '5. Lock',
    path: '/examinations/lock',
    hint: 'Freeze after verification',
  },
  {
    key: 'reports',
    label: '6. Report cards',
    path: '/report-cards',
    hint: 'Division & position',
  },
]

/** Map nav path → workspace section key */
export function sectionFromPath(pathname) {
  if (!pathname) return 'overview'
  if (pathname === '/examinations' || pathname === '/examinations/') return 'overview'
  if (pathname.startsWith('/report-cards')) return 'reports'
  // Order matters for overlapping segments
  if (pathname.includes('/homework-scores')) return 'homework'
  if (pathname.includes('/practical')) return 'practical'
  if (pathname.includes('/subject-ranking')) return 'ranking'
  if (pathname.includes('/marks')) return 'marks'
  if (pathname.includes('/types')) return 'types'
  if (pathname.includes('/scheduling')) return 'scheduling'
  if (pathname.includes('/grades')) return 'grades'
  if (pathname.includes('/gpa')) return 'gpa'
  if (pathname.includes('/division')) return 'division'
  if (pathname.includes('/ranking')) return 'ranking'
  if (pathname.includes('/merit')) return 'merit'
  if (pathname.includes('/analysis')) return 'analysis'
  if (pathname.includes('/trends')) return 'trends'
  if (pathname.includes('/lock')) return 'lock'
  if (pathname.includes('/approval')) return 'approval'
  if (pathname.includes('/ca')) return 'ca'
  return 'overview'
}

/** Default assessment type when opening a section */
export function defaultTypeForSection(section) {
  if (section === 'ca') return 'continuous'
  if (section === 'homework') return 'homework'
  if (section === 'practical') return 'practical'
  return null
}

export const SECTION_META = {
  overview: {
    title: 'Examinations',
    description:
      'TAMISEMI-oriented assessment workflow: schedule → marks → approve → lock → report cards',
  },
  scheduling: {
    title: 'Exam scheduling',
    description: 'Create and manage assessments for year, term, class and subject',
  },
  marks: {
    title: 'Marks entry',
    description: 'Enter scores; NECTA grades and remarks update live as you type',
  },
  types: {
    title: 'Exam types',
    description: 'Formative and summative assessment types used in Tanzanian schools',
  },
  ca: {
    title: 'Continuous assessment',
    description: 'CA components that contribute to terminal results (weight them carefully)',
  },
  homework: {
    title: 'Homework scores',
    description: 'Homework and assignment marks (formative)',
  },
  practical: {
    title: 'Practical assessment',
    description: 'Practical / lab / skills assessments',
  },
  grades: {
    title: 'Grade calculation',
    description: 'NECTA-style letter grades (A–F) and remarks from percent scores',
  },
  gpa: {
    title: 'Points / GPA',
    description: 'Average grade points — lower is better under NECTA style (1 = A … 5 = F)',
  },
  division: {
    title: 'Division summary',
    description: 'Class division distribution (I–IV, 0) from published results',
  },
  ranking: {
    title: 'Class ranking',
    description: 'Positions from published assessments (by average points)',
  },
  merit: {
    title: 'Merit list',
    description: 'Top 10 performers in the class',
  },
  analysis: {
    title: 'Subject analysis',
    description: 'Mean %, pass rate and grade distribution by subject',
  },
  trends: {
    title: 'Performance trends',
    description: 'How assessments are distributed by type and publication status',
  },
  lock: {
    title: 'Lock results',
    description: 'Prevent further mark edits after academic office verification',
  },
  approval: {
    title: 'Approval workflow',
    description: 'Publish assessments so they appear on rankings and report cards',
  },
  reports: {
    title: 'Report cards',
    description: 'NECTA-oriented learner report cards with division and class position',
  },
}
