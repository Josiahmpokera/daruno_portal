/**
 * Copy text to the clipboard.
 * navigator.clipboard only exists on HTTPS / localhost; on plain http://<server-ip>
 * fall back to a hidden textarea + execCommand('copy'), which browsers still allow
 * inside a click handler.
 * @param {string} text
 * @returns {Promise<void>} rejects when copying is not possible
 */
export async function copyText(text) {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const el = document.createElement('textarea')
  el.value = text
  el.setAttribute('readonly', '')
  el.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none'
  document.body.appendChild(el)
  el.select()
  el.setSelectionRange(0, text.length)
  const ok = document.execCommand('copy')
  el.remove()
  if (!ok) throw new Error('Copy not supported')
}
