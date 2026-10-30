import { Select, SelectItem } from '@heroui/react'
import { FIELD_RADIUS, selectClassNames } from './formStyles.js'
import { POPOVER_MOTION } from '../motion.js'

/**
 * Multi-select in the app-standard style. value / onChange use string arrays.
 */
function FormMultiSelect({
  label,
  placeholder = 'Select',
  value = [],
  onChange,
  options = [],
  isInvalid,
  isDisabled,
  className = '',
  'aria-label': ariaLabel,
}) {
  return (
    <Select
      size="sm"
      radius={FIELD_RADIUS}
      variant="bordered"
      selectionMode="multiple"
      placeholder={placeholder}
      selectedKeys={new Set((value || []).map(String))}
      onSelectionChange={(keys) => onChange?.(Array.from(keys).map(String))}
      className={`w-full ${className}`}
      classNames={{
        ...selectClassNames,
        trigger: `${selectClassNames.trigger} !h-auto min-h-9 max-h-none py-1`,
      }}
      aria-label={ariaLabel || label || placeholder}
      isInvalid={isInvalid}
      isDisabled={isDisabled}
      popoverProps={{ motionProps: POPOVER_MOTION }}
      renderValue={(items) => (
        <div className="flex flex-wrap gap-1 py-0.5">
          {items.map((it) => (
            <span key={it.key} className="rounded bg-[#12544f]/[0.08] px-1.5 py-0.5 text-[11px] font-medium text-[#12544f]">
              {it.textValue}
            </span>
          ))}
        </div>
      )}
    >
      {options.map((opt) => (
        <SelectItem key={String(opt.value)} textValue={opt.label}>
          {opt.label}
        </SelectItem>
      ))}
    </Select>
  )
}

export default FormMultiSelect
