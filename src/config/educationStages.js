/**
 * TAMISEMI education stages — shared by registration, school profile,
 * Academic → Levels, subjects, and combinations.
 */
export const EDUCATION_STAGES = [
  {
    value: 'pre_primary',
    label: 'Pre-primary',
    shortLabel: 'Pre-primary',
    description: 'Nursery / pre-primary (before Std I)',
  },
  {
    value: 'primary',
    label: 'Primary (Std I–VII)',
    shortLabel: 'Primary',
    description: 'Primary school Standard 1 to Standard 7',
  },
  {
    value: 'ordinary_level',
    label: 'O-Level (Form 1–4)',
    shortLabel: 'O-Level',
    description: 'Ordinary level secondary (CSEE)',
  },
  {
    value: 'advanced_level',
    label: 'A-Level (Form 5–6)',
    shortLabel: 'A-Level',
    description: 'Advanced level secondary (ACSEE combinations)',
  },
]

export const stageLabel = (value) =>
  EDUCATION_STAGES.find((s) => s.value === value)?.label || value || '—'

export const stageShortLabel = (value) =>
  EDUCATION_STAGES.find((s) => s.value === value)?.shortLabel || value || '—'

/**
 * Stages available for subject/combo filters for this school.
 * Always includes "all" for subjects that apply to every stage.
 */
export function stagesForSchool(educationStages) {
  const offered = Array.isArray(educationStages) ? educationStages : []
  if (!offered.length) {
    return EDUCATION_STAGES
  }
  return EDUCATION_STAGES.filter((s) => offered.includes(s.value))
}

export function formatStagesSummary(educationStages) {
  const labels = stagesForSchool(educationStages).map((s) => s.shortLabel)
  return labels.length ? labels.join(' · ') : 'Not set'
}

/**
 * Subject Combinations (NECTA packages / secondary packages) only apply when
 * the school runs O-Level and/or A-Level — not pre-primary/primary-only.
 */
export function schoolOffersSubjectCombinations(educationStages) {
  const stages = Array.isArray(educationStages) ? educationStages : []
  if (!stages.length) return true // unknown → keep visible until profile loads
  return (
    stages.includes('ordinary_level') || stages.includes('advanced_level')
  )
}

/**
 * Map education_levels code/name → stage key (mirrors backend EducationStages).
 */
export function stageFromLevelCodeOrName(code, name) {
  const c = String(code || '')
    .trim()
    .toUpperCase()
  const n = String(name || '')
    .trim()
    .toLowerCase()

  if (
    ['PP', 'PRE', 'PRE-P'].includes(c) ||
    n.includes('pre-primary') ||
    n.includes('pre primary') ||
    n.includes('nursery')
  ) {
    return 'pre_primary'
  }
  if (
    ['PR', 'PR-L', 'PRI', 'PRIM'].includes(c) ||
    (n.includes('primary') && !n.includes('pre'))
  ) {
    return 'primary'
  }
  if (
    ['O', 'OL', 'O-LEVEL', 'OLEVEL'].includes(c) ||
    n.includes('ordinary') ||
    n.includes('o-level') ||
    n.includes('o level')
  ) {
    return 'ordinary_level'
  }
  if (
    ['A', 'AL', 'A-LEVEL', 'ALEVEL'].includes(c) ||
    n.includes('advanced') ||
    n.includes('a-level') ||
    n.includes('a level')
  ) {
    return 'advanced_level'
  }
  return null
}

/**
 * Keep classrooms that belong to education stages the school operates.
 * If stages are empty/unset, return all classes (legacy).
 */
export function filterClassesBySchoolStages(classes, educationStages) {
  const list = Array.isArray(classes) ? classes : []
  const offered = Array.isArray(educationStages) ? educationStages : []
  if (!offered.length) return list

  return list.filter((c) => {
    const level = c.education_level || c.educationLevel || null
    const code = level?.code ?? c.education_level_code ?? null
    const name = level?.name ?? c.education_level_name ?? null
    const stage = stageFromLevelCodeOrName(code, name)
    return stage && offered.includes(stage)
  })
}

/** Label for class dropdown including level short name when available */
export function classSelectLabel(classroom) {
  if (!classroom) return ''
  const level = classroom.education_level || classroom.educationLevel
  const levelBit = level?.name ? ` · ${level.name}` : ''
  const codeBit = classroom.code ? ` (${classroom.code})` : ''
  return `${classroom.name}${codeBit}${levelBit}`
}
