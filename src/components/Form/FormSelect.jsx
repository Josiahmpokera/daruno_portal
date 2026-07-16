import { Select, SelectItem } from '@heroui/react'
import { FIELD_RADIUS, selectClassNames } from './formStyles.js'

/**
 * App-standard select (HeroUI, not native).
 * options: string[] | { value, label }[]
 */
function FormSelect({
  label,
  placeholder = 'Select',
  value,
  onChange,
  options = [],
  isRequired,
  className = '',
  isDisabled,
  classNames,
}) {
  return (
    <Select
      size="sm"
      radius={FIELD_RADIUS}
      variant="bordered"
      placeholder={placeholder}
      selectedKeys={value ? new Set([String(value)]) : new Set()}
      onSelectionChange={(keys) => {
        const v = Array.from(keys)[0]
        onChange?.(v != null ? String(v) : '')
      }}
      className={`w-full ${className}`}
      classNames={{ ...selectClassNames, ...classNames }}
      aria-label={label || placeholder}
      isRequired={isRequired}
      isDisabled={isDisabled}
      disallowEmptySelection={false}
    >
      {options.map((opt) => {
        const key = typeof opt === 'object' ? String(opt.value) : String(opt)
        const text = typeof opt === 'object' ? opt.label : opt
        return (
          <SelectItem key={key} textValue={text}>
            {text}
          </SelectItem>
        )
      })}
    </Select>
  )
}

export default FormSelect
