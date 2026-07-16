/**
 * App-wide toast helpers (HeroUI Toast).
 * Use for every successful (and failed) user-facing mutation.
 */
import { addToast, closeAll } from '@heroui/toast'

const base = {
  timeout: 4200,
  shouldShowTimeoutProgress: true,
  classNames: {
    base: 'shadow-none border border-zinc-200',
  },
}

/**
 * @param {string} title
 * @param {string} [description]
 */
export function toastSuccess(title, description) {
  return addToast({
    ...base,
    title,
    description: description || undefined,
    color: 'success',
    severity: 'success',
  })
}

/**
 * @param {string} title
 * @param {string} [description]
 */
export function toastError(title, description) {
  return addToast({
    ...base,
    title,
    description: description || undefined,
    color: 'danger',
    severity: 'danger',
    timeout: 5500,
  })
}

/**
 * @param {string} title
 * @param {string} [description]
 */
export function toastInfo(title, description) {
  return addToast({
    ...base,
    title,
    description: description || undefined,
    color: 'primary',
    severity: 'primary',
  })
}

/**
 * @param {string} title
 * @param {string} [description]
 */
export function toastWarning(title, description) {
  return addToast({
    ...base,
    title,
    description: description || undefined,
    color: 'warning',
    severity: 'warning',
  })
}

export function toastCloseAll() {
  closeAll()
}

export { addToast }
