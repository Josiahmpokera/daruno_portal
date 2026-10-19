import { EDUCATION_STAGES } from '../../config/educationStages.js'

/**
 * Multi-select checklist for TAMISEMI education stages.
 * titlesOnly: compact chips with title only (registration form).
 */
export default function EducationStagesPicker({
  value = [],
  onChange,
  required = false,
  disabled = false,
  className = '',
  titlesOnly = false,
  hint = 'Select every level your school operates. You can change this later under School profile or Academic → Education levels.',
}) {
  const selected = Array.isArray(value) ? value : []

  const toggle = (key) => {
    if (disabled) return
    const has = selected.includes(key)
    const next = has
      ? selected.filter((v) => v !== key)
      : [...selected, key]
    onChange?.(next)
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-[11px] font-medium text-zinc-600">
          Education levels
          {required ? <span className="text-rose-500"> *</span> : null}
        </label>
        {selected.length ? (
          <span className="text-[10px] text-zinc-400">
            {selected.length} selected
          </span>
        ) : null}
      </div>
      {titlesOnly ? (
        <div className="flex flex-wrap gap-2">
          {EDUCATION_STAGES.map((stage) => {
            const checked = selected.includes(stage.value)
            return (
              <button
                key={stage.value}
                type="button"
                disabled={disabled}
                onClick={() => toggle(stage.value)}
                className={`rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${
                  checked
                    ? 'border-[#0B3D2E] bg-[#0B3D2E] text-white shadow-sm'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-[#0B3D2E]/40 hover:text-[#0B3D2E]'
                } ${disabled ? 'opacity-60' : ''}`}
              >
                {stage.shortLabel || stage.label}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {EDUCATION_STAGES.map((stage) => {
            const checked = selected.includes(stage.value)
            return (
              <button
                key={stage.value}
                type="button"
                disabled={disabled}
                onClick={() => toggle(stage.value)}
                className={`flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-left transition-colors ${
                  checked
                    ? 'border-[#0B3D2E] bg-[#0B3D2E]/[0.06]'
                    : 'border-zinc-200 bg-white hover:border-zinc-300'
                } ${disabled ? 'opacity-60' : ''}`}
              >
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                    checked
                      ? 'border-[#0B3D2E] bg-[#0B3D2E] text-white'
                      : 'border-zinc-300 bg-white text-transparent'
                  }`}
                  aria-hidden
                >
                  ✓
                </span>
                <span className="min-w-0">
                  <span className="block text-[12px] font-medium text-zinc-900">
                    {stage.label}
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-snug text-zinc-500">
                    {stage.description}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}
      {hint ? <p className="text-[10px] text-zinc-400">{hint}</p> : null}
    </div>
  )
}
