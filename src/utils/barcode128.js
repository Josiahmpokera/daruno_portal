/**
 * Minimal Code 128-B barcode → SVG path bars.
 * Industrial enough for student admission numbers / card numbers.
 */

const START_B = 104
const STOP = 106
const PATTERNS = [
  '212222','222122','222221','121223','121322','131222','122213','122312','132212','221213',
  '221312','231212','112232','122132','122231','113222','123122','123221','223211','221132',
  '221231','213212','223112','312131','311222','321122','321221','312212','322112','322211',
  '212123','212321','232121','111323','131123','131321','112313','132113','132311','211313',
  '231113','231311','112133','112331','132131','113123','113321','133121','313121','211331',
  '231131','213113','213311','213131','311123','311321','331121','312113','312311','332111',
  '314111','221411','431111','111224','111422','121124','121421','141122','141221','112214',
  '112412','122114','122411','142112','142211','241211','221114','413111','241112','134111',
  '111242','121142','121241','114212','124112','124211','411212','421112','421211','212141',
  '214121','412121','111143','111341','131141','114113','114311','411113','411311','113141',
  '114131','311141','411131','211412','211214','211232','2331112',
]

function codeValue(ch) {
  const c = ch.charCodeAt(0)
  if (c < 32 || c > 127) return 0 // fallback
  return c - 32
}

/**
 * @param {string} text
 * @param {{ height?: number, moduleWidth?: number, showText?: boolean }} [opts]
 * @returns {string} SVG markup
 */
export function code128Svg(text, opts = {}) {
  const value = String(text || '').trim() || '0'
  const height = opts.height ?? 48
  const mw = opts.moduleWidth ?? 1.4
  const showText = opts.showText !== false

  const codes = [START_B]
  let checksum = START_B
  for (let i = 0; i < value.length; i++) {
    const v = codeValue(value[i])
    codes.push(v)
    checksum += v * (i + 1)
  }
  codes.push(checksum % 103)
  codes.push(STOP)

  let bars = ''
  let x = 10
  for (const code of codes) {
    const pattern = PATTERNS[code] || PATTERNS[0]
    let bar = true
    for (const d of pattern) {
      const w = Number(d) * mw
      if (bar) {
        bars += `<rect x="${x.toFixed(2)}" y="4" width="${w.toFixed(2)}" height="${height}" fill="#0f172a"/>`
      }
      x += w
      bar = !bar
    }
  }

  const width = Math.ceil(x + 10)
  const totalH = showText ? height + 22 : height + 8
  const label = showText
    ? `<text x="${(width / 2).toFixed(1)}" y="${height + 18}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="10" fill="#0f172a">${escapeXml(value)}</text>`
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${totalH}" viewBox="0 0 ${width} ${totalH}" role="img" aria-label="Barcode ${escapeXml(value)}">${bars}${label}</svg>`
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
