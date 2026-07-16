import { Button } from '@heroui/react'
import {
  FIELD_RADIUS,
  btnSolid,
  btnBordered,
  btnLight,
  btnFlat,
} from './formStyles.js'

const variantMap = {
  solid: { variant: 'solid', className: btnSolid },
  bordered: { variant: 'bordered', className: btnBordered },
  light: { variant: 'light', className: btnLight },
  flat: { variant: 'flat', className: btnFlat },
}

/**
 * App-standard button — matches form field height & radius.
 * appearance: solid | bordered | light | flat
 */
function FormButton({
  appearance = 'solid',
  className = '',
  children,
  ...props
}) {
  const preset = variantMap[appearance] || variantMap.solid
  return (
    <Button
      size="sm"
      radius={FIELD_RADIUS}
      variant={preset.variant}
      className={`${preset.className} ${className}`.trim()}
      {...props}
    >
      {children}
    </Button>
  )
}

export default FormButton
