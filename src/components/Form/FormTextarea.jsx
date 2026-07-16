import { Textarea } from '@heroui/react'
import { FIELD_RADIUS, textareaClassNames } from './formStyles.js'

function FormTextarea({ classNames, minRows = 3, ...props }) {
  return (
    <Textarea
      size="sm"
      radius={FIELD_RADIUS}
      variant="bordered"
      minRows={minRows}
      classNames={{ ...textareaClassNames, ...classNames }}
      {...props}
    />
  )
}

export default FormTextarea
