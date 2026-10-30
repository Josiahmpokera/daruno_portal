/** Small line-chart options for Super Admin report cards */

export const BRAND = {
  primary: '#12544f',
  accent: '#2d8a68',
  amber: '#d97706',
  sky: '#0ea5e9',
  rose: '#e11d48',
  purple: '#7c3aed',
  slate: '#94a3b8',
}

const tip = {
  trigger: 'axis',
  backgroundColor: 'rgba(255,255,255,0.96)',
  borderColor: '#e2e8f0',
  borderWidth: 1,
  textStyle: { color: '#334155', fontSize: 11 },
  extraCssText: 'box-shadow: 0 4px 12px rgba(15,23,42,0.08); border-radius: 8px;',
}

/**
 * Compact sparkline-style line chart for a KPI card.
 * @param {string[]} categories
 * @param {number[]} values
 * @param {object} opts
 */
export function sparkLineOption(categories = [], values = [], opts = {}) {
  const {
    color = BRAND.primary,
    area = true,
    smooth = 0.35,
  } = opts

  return {
    animationDuration: 400,
    grid: { left: 4, right: 4, top: 8, bottom: 4 },
    xAxis: {
      type: 'category',
      data: categories,
      show: false,
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      show: false,
      scale: true,
    },
    tooltip: {
      ...tip,
      axisPointer: { type: 'line', lineStyle: { color: '#cbd5e1' } },
    },
    series: [
      {
        type: 'line',
        data: values,
        smooth,
        showSymbol: false,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 2, color },
        itemStyle: { color },
        areaStyle: area
          ? {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: hexAlpha(color, 0.28) },
                  { offset: 1, color: hexAlpha(color, 0.02) },
                ],
              },
            }
          : undefined,
        emphasis: { focus: 'series', showSymbol: true },
      },
    ],
  }
}

/**
 * Multi-series line chart for a full-width (still compact) card.
 */
export function multiLineOption(categories = [], seriesList = [], opts = {}) {
  const { heightLegend = true } = opts
  const colors = seriesList.map((s, i) => s.color || [BRAND.primary, BRAND.sky, BRAND.amber, BRAND.purple][i % 4])

  return {
    color: colors,
    animationDuration: 450,
    tooltip: {
      ...tip,
      axisPointer: { type: 'cross', crossStyle: { color: '#cbd5e1' } },
    },
    legend: heightLegend
      ? {
          data: seriesList.map((s) => s.name),
          bottom: 0,
          itemWidth: 12,
          itemHeight: 6,
          textStyle: { color: '#64748b', fontSize: 10 },
        }
      : undefined,
    grid: {
      left: 40,
      right: 12,
      top: 16,
      bottom: heightLegend ? 36 : 20,
    },
    xAxis: {
      type: 'category',
      data: categories,
      boundaryGap: false,
      axisLabel: { color: '#94a3b8', fontSize: 10 },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#94a3b8', fontSize: 10 },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
    },
    series: seriesList.map((s) => ({
      name: s.name,
      type: 'line',
      data: s.data || [],
      smooth: 0.35,
      showSymbol: false,
      symbolSize: 5,
      lineStyle: { width: 2 },
      emphasis: { focus: 'series', showSymbol: true },
    })),
  }
}

function hexAlpha(hex, alpha) {
  const h = String(hex).replace('#', '')
  if (h.length !== 6) return hex
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
