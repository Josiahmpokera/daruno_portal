/**
 * fetch() with a timeout, so an unreachable API fails with a clear message
 * instead of leaving the UI loading forever.
 *
 * Errors thrown here have `status = 0` (no HTTP response) and
 * `code = 'TIMEOUT' | 'NETWORK'`.
 */

export const DEFAULT_TIMEOUT_MS = 20_000
export const AUTH_TIMEOUT_MS = 15_000

export const TIMEOUT_MESSAGE =
  'The server is taking too long to respond. Check your internet connection and try again.'
export const NETWORK_MESSAGE =
  'Cannot reach the server. Check your internet connection, or that the API is running and VITE_BASE_URL is correct.'

/**
 * @param {string} url
 * @param {RequestInit & { timeout?: number }} options  timeout in ms; 0 disables it
 */
export async function fetchWithTimeout(url, options = {}) {
  const { timeout = DEFAULT_TIMEOUT_MS, signal: callerSignal, ...init } = options

  const controller = new AbortController()
  let timedOut = false
  const timer =
    timeout > 0
      ? setTimeout(() => {
          timedOut = true
          controller.abort()
        }, timeout)
      : null

  // Respect a caller's own AbortSignal as well
  const onCallerAbort = () => controller.abort()
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort()
    else callerSignal.addEventListener('abort', onCallerAbort, { once: true })
  }

  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch (cause) {
    // Caller cancelled on purpose (e.g. component unmounted): pass it through
    if (callerSignal?.aborted && !timedOut) throw cause

    const error = new Error(timedOut ? TIMEOUT_MESSAGE : NETWORK_MESSAGE)
    error.status = 0
    error.code = timedOut ? 'TIMEOUT' : 'NETWORK'
    error.cause = cause
    throw error
  } finally {
    if (timer) clearTimeout(timer)
    callerSignal?.removeEventListener('abort', onCallerAbort)
  }
}
