import { Input } from '@heroui/react'
import { FIELD_RADIUS, fieldClassNames } from './formStyles.js'

function FormInput({ classNames, ...props }) {
  return (
    <Input
      size="sm"
      radius={FIELD_RADIUS}
      variant="bordered"
      classNames={{ ...fieldClassNames, ...classNames }}
      {...props}
    />
  )
}

export default FormInput
