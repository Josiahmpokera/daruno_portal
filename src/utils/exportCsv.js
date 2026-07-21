/**
 * Download rows as a CSV file in the browser.
 * @param {string} filename
 * @param {string[]} headers
 * @param {Array<Array<string|number|null|undefined>>} rows
 */
export function exportCsv(filename, headers, rows) {
  const escape = (cell) => {
    if (cell === null || cell === undefined) return ''
    const s = String(cell)
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }

  const lines = [
    headers.map(escape).join(','),
    ...rows.map((row) => row.map(escape).join(',')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function stampFilename(prefix) {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${prefix}_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`
}
