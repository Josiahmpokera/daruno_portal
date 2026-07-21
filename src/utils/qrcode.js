import QRCode from 'qrcode'

/**
 * @param {string} text
 * @param {{ size?: number, margin?: number, dark?: string, light?: string }} [opts]
 * @returns {Promise<string>} data URL
 */
export async function qrDataUrl(text, opts = {}) {
  const value = String(text || '').trim() || ' '
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: 'M',
    margin: opts.margin ?? 1,
    width: opts.size ?? 128,
    color: {
      dark: opts.dark ?? '#0f172a',
      light: opts.light ?? '#ffffff',
    },
  })
}
