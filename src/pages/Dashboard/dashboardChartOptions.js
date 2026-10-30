/** Brand palette */
export const BRAND = {
  primary: '#12544f',
  primarySoft: '#1a5c45',
  accent: '#2d8a68',
  muted: '#94a3b8',
  amber: '#d97706',
  blue: '#2563eb',
  purple: '#7c3aed',
  rose: '#e11d48',
  sky: '#0ea5e9',
  slate: '#64748b',
}

const axisLabel = { color: '#64748b', fontSize: 10 }
const legendText = { color: '#475569', fontSize: 10 }

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const lineBase = {
  type: 'line',
  smooth: 0.35,
  showSymbol: false,
  symbol: 'circle',
  symbolSize: 6,
  emphasis: { focus: 'series', showSymbol: true },
}

const baseTooltip = {
  trigger: 'axis',
  backgroundColor: 'rgba(255,255,255,0.96)',
  borderColor: '#e2e8f0',
  borderWidth: 1,
  textStyle: { color: '#334155', fontSize: 12 },
  axisPointer: { type: 'cross', crossStyle: { color: '#cbd5e1' } },
}

/**
 * Fee payment trend vs Expenses — dual money lines (M TZS).
 * Clear series styling so payment vs spend is easy to compare.
 */
export function feePaymentVsExpensesOption() {
  // Sample monthly fee collections (payments received) and operating expenses
  const feePayments = [3.2, 2.8, 4.1, 3.6, 3.9, 2.5, 2.1, 3.4, 4.5, 3.8, 2.9, 4.2]
  const expenses = [2.4, 2.6, 2.9, 3.1, 3.0, 2.8, 2.7, 3.2, 3.4, 3.3, 3.1, 3.5]
  const net = feePayments.map((p, i) =>
    Number((p - expenses[i]).toFixed(2)),
  )

  return {
    color: [BRAND.primary, BRAND.rose, BRAND.sky],
    tooltip: {
      ...baseTooltip,
      valueFormatter: (v) =>
        v == null || Number.isNaN(Number(v))
          ? '—'
          : `${Number(v).toFixed(1)}M TZS`,
    },
    legend: {
      data: ['Fee payments', 'Expenses', 'Net (payments − expenses)'],
      bottom: 0,
      itemWidth: 16,
      itemHeight: 8,
      itemGap: 16,
      textStyle: legendText,
    },
    grid: { left: 52, right: 20, top: 28, bottom: 52 },
    xAxis: {
      type: 'category',
      data: months,
      boundaryGap: false,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel,
    },
    yAxis: {
      type: 'value',
      name: 'M TZS',
      nameTextStyle: axisLabel,
      nameGap: 10,
      min: 0,
      axisLabel: {
        ...axisLabel,
        formatter: (v) => `${v}`,
      },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
    },
    series: [
      {
        ...lineBase,
        name: 'Fee payments',
        z: 3,
        lineStyle: { width: 2.75, color: BRAND.primary },
        itemStyle: { color: BRAND.primary },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(11,61,46,0.18)' },
              { offset: 1, color: 'rgba(11,61,46,0.01)' },
            ],
          },
        },
        data: feePayments,
      },
      {
        ...lineBase,
        name: 'Expenses',
        z: 2,
        lineStyle: { width: 2.5, color: BRAND.rose },
        itemStyle: { color: BRAND.rose },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(225,29,72,0.12)' },
              { offset: 1, color: 'rgba(225,29,72,0.01)' },
            ],
          },
        },
        data: expenses,
      },
      {
        ...lineBase,
        name: 'Net (payments − expenses)',
        z: 4,
        lineStyle: { width: 2, type: 'dashed', color: BRAND.sky },
        itemStyle: { color: BRAND.sky },
        data: net,
      },
    ],
  }
}

/** @deprecated use feePaymentVsExpensesOption — kept for imports */
export function multipleXAxesOption() {
  return feePaymentVsExpensesOption()
}

/**
 * Fee collection breakdown — doughnut with rounded corners (ECharts gallery style).
 * Categories as share of total fee collections (sample %).
 */
export function feeCollectionDoughnutOption() {
  const slices = [
    { name: 'Tuition', value: 48 },
    { name: 'Boarding', value: 18 },
    { name: 'Transport', value: 12 },
    { name: 'Meals', value: 10 },
    { name: 'Exam / other', value: 12 },
  ]
  return {
    color: [
      BRAND.primary,
      BRAND.accent,
      BRAND.sky,
      BRAND.amber,
      BRAND.purple,
    ],
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#334155', fontSize: 12 },
      formatter: (p) =>
        `${p.name}<br/><b>${p.value}%</b> of fee collections`,
    },
    legend: {
      orient: 'vertical',
      right: 4,
      top: 'middle',
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 8,
      textStyle: { ...legendText, fontSize: 10 },
      formatter: (name) => {
        const row = slices.find((s) => s.name === name)
        return row ? `${name}  ${row.value}%` : name
      },
    },
    series: [
      {
        name: 'Fee collections',
        type: 'pie',
        radius: ['48%', '72%'],
        center: ['36%', '50%'],
        avoidLabelOverlap: true,
        padAngle: 2,
        itemStyle: {
          // Rounded doughnut segments (gallery: Doughnut with Rounded Corner)
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 3,
        },
        label: {
          show: true,
          position: 'center',
          formatter: '{a|Fees}\n{b|mix}',
          rich: {
            a: {
              fontSize: 14,
              fontWeight: 600,
              color: BRAND.primary,
              lineHeight: 18,
            },
            b: {
              fontSize: 10,
              color: '#94a3b8',
              lineHeight: 14,
            },
          },
        },
        emphasis: {
          scale: true,
          scaleSize: 6,
          itemStyle: {
            shadowBlur: 12,
            shadowColor: 'rgba(11,61,46,0.2)',
          },
          label: {
            show: true,
          },
        },
        labelLine: { show: false },
        data: slices,
      },
    ],
  }
}

/**
 * Fee trend — multi-line (invoiced, collected, outstanding).
 * Kept for other views; overview uses doughnut instead.
 */
export function feeTrendOption() {
  return {
    color: [BRAND.primary, BRAND.amber, BRAND.rose],
    tooltip: {
      ...baseTooltip,
      valueFormatter: (v) => `${Number(v).toFixed(1)}M TZS`,
    },
    legend: {
      data: ['Invoiced', 'Collected', 'Outstanding'],
      bottom: 0,
      itemWidth: 14,
      itemHeight: 8,
      textStyle: legendText,
    },
    grid: { left: 48, right: 16, top: 24, bottom: 48 },
    xAxis: {
      type: 'category',
      data: months,
      boundaryGap: false,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel,
    },
    yAxis: {
      type: 'value',
      name: 'M TZS',
      nameTextStyle: axisLabel,
      min: 0,
      axisLabel: { ...axisLabel, formatter: (v) => `${v}` },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
    },
    series: [
      {
        ...lineBase,
        name: 'Invoiced',
        lineStyle: { width: 2 },
        data: [4.0, 3.5, 4.8, 4.2, 4.5, 3.2, 2.8, 4.0, 5.1, 4.4, 3.6, 4.8],
      },
      {
        ...lineBase,
        name: 'Collected',
        lineStyle: { width: 2.5 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(217,119,6,0.16)' },
              { offset: 1, color: 'rgba(217,119,6,0.01)' },
            ],
          },
        },
        data: [3.2, 2.8, 4.1, 3.6, 3.9, 2.5, 2.1, 3.4, 4.5, 3.8, 2.9, 4.2],
      },
      {
        ...lineBase,
        name: 'Outstanding',
        lineStyle: { width: 2, type: 'dashed' },
        data: [0.8, 0.7, 0.7, 0.6, 0.6, 0.7, 0.7, 0.6, 0.6, 0.6, 0.7, 0.6],
      },
    ],
  }
}

/**
 * School performance — line chart with fisheye-style lens (hover magnifies nearby points).
 * Inspired by Apache ECharts “Fisheye Lens on Line”.
 *
 * Returns { option, enableFisheye: true } so the chart wrapper can wire mouse move.
 * Base option uses showSymbol + large emphasis; runtime fisheye updates symbolSize.
 */
export function schoolPerformanceFisheyeOption() {
  // Composite performance index (0–100) — attendance, academics, fee collection health
  const performance = [68, 71, 69, 74, 76, 73, 70, 78, 81, 79, 82, 84]
  const attendance = [88, 90, 89, 91, 92, 90, 87, 93, 94, 92, 93, 95]
  const academic = [62, 65, 64, 70, 72, 69, 66, 74, 77, 75, 78, 80]

  return {
    color: [BRAND.primary, BRAND.sky, BRAND.amber],
    tooltip: {
      ...baseTooltip,
      valueFormatter: (v) => `${v}`,
    },
    legend: {
      data: ['Performance index', 'Attendance %', 'Academic mean'],
      bottom: 0,
      itemWidth: 12,
      itemHeight: 8,
      itemGap: 10,
      textStyle: { ...legendText, fontSize: 9 },
    },
    grid: { left: 36, right: 12, top: 16, bottom: 36 },
    xAxis: {
      type: 'category',
      data: months,
      boundaryGap: false,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { ...axisLabel, fontSize: 9 },
    },
    yAxis: {
      type: 'value',
      min: 50,
      max: 100,
      axisLabel: { ...axisLabel, fontSize: 9 },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
    },
    series: [
      {
        name: 'Performance index',
        type: 'line',
        smooth: 0.4,
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 2.5, color: BRAND.primary },
        itemStyle: { color: BRAND.primary, borderColor: '#fff', borderWidth: 1 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(11,61,46,0.2)' },
              { offset: 1, color: 'rgba(11,61,46,0.02)' },
            ],
          },
        },
        emphasis: {
          scale: true,
          focus: 'series',
          itemStyle: {
            borderWidth: 2,
            shadowBlur: 10,
            shadowColor: 'rgba(11,61,46,0.35)',
          },
        },
        data: performance,
      },
      {
        name: 'Attendance %',
        type: 'line',
        smooth: 0.4,
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 1.75, color: BRAND.sky },
        itemStyle: { color: BRAND.sky, borderColor: '#fff', borderWidth: 1 },
        emphasis: { scale: true, focus: 'series' },
        data: attendance,
      },
      {
        name: 'Academic mean',
        type: 'line',
        smooth: 0.4,
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 1.75, type: 'dashed', color: BRAND.amber },
        itemStyle: { color: BRAND.amber, borderColor: '#fff', borderWidth: 1 },
        emphasis: { scale: true, focus: 'series' },
        data: academic,
      },
    ],
  }
}

/**
 * Apply fisheye lens to a line option: magnify points near hover dataIndex.
 * @param {object} baseOption
 * @param {number|null} focusIndex category index under the lens (null = reset)
 * @param {number} radius how many neighbours the lens covers
 */
export function applyFisheyeLens(baseOption, focusIndex, radius = 2) {
  if (focusIndex == null || focusIndex < 0) {
    return baseOption
  }

  const next = {
    ...baseOption,
    series: (baseOption.series || []).map((s) => {
      if (s.type !== 'line' || !Array.isArray(s.data)) return s
      const sizes = s.data.map((_, i) => {
        const d = Math.abs(i - focusIndex)
        if (d === 0) return 16
        if (d === 1) return 11
        if (d <= radius) return 8
        return 4
      })
      return {
        ...s,
        symbolSize: (val, params) => sizes[params.dataIndex] ?? 4,
        showSymbol: true,
      }
    }),
  }
  return next
}

/**
 * Bar Chart with Negative Value — surplus vs deficit by department.
 * Inspired by ECharts "Bar Chart with Negative Value".
 */
export function negativeValueBarOption() {
  const categories = [
    'Tuition',
    'Transport',
    'Meals',
    'Library',
    'Sports',
    'Lab',
    'Boarding',
    'Events',
  ]
  // positive = surplus, negative = shortfall vs budget (dummy, TZS '000)
  const values = [420, -180, 95, -45, 120, -210, 310, -75]

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const p = params[0]
        const v = p.value
        const label = v >= 0 ? 'Surplus' : 'Shortfall'
        return `${p.name}<br/>${label}: ${Math.abs(v)}k TZS`
      },
    },
    grid: { left: 72, right: 24, top: 16, bottom: 28 },
    xAxis: {
      type: 'value',
      axisLabel: {
        ...axisLabel,
        formatter: (v) => `${v}k`,
      },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
    },
    yAxis: {
      type: 'category',
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel,
      data: categories,
    },
    series: [
      {
        name: 'Budget variance',
        type: 'bar',
        label: {
          show: true,
          position: 'right',
          fontSize: 10,
          color: '#64748b',
          formatter: (p) => (p.value >= 0 ? `+${p.value}` : `${p.value}`),
        },
        itemStyle: {
          borderRadius: [0, 3, 3, 0],
          color: (params) =>
            params.value >= 0 ? BRAND.primary : BRAND.rose,
        },
        data: values,
      },
    ],
  }
}

/**
 * World Population–style horizontal bar (class sizes / headcount).
 * Inspired by ECharts "World Population" bar chart.
 */
export function worldPopulationStyleOption() {
  const classes = [
    'Form 4B',
    'Form 4A',
    'Form 3B',
    'Form 3A',
    'Form 2B',
    'Form 2A',
    'Form 1B',
    'Form 1A',
  ]
  const boys = [48, 52, 45, 50, 55, 49, 58, 54]
  const girls = [51, 47, 53, 48, 50, 52, 46, 49]

  return {
    color: [BRAND.primary, BRAND.sky],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    legend: {
      data: ['Boys', 'Girls'],
      bottom: 0,
      textStyle: legendText,
    },
    grid: { left: 56, right: 24, top: 12, bottom: 36 },
    xAxis: {
      type: 'value',
      boundaryGap: [0, 0.01],
      axisLabel,
      splitLine: { lineStyle: { color: '#f1f5f9' } },
    },
    yAxis: {
      type: 'category',
      data: classes,
      axisLabel,
      axisTick: { show: false },
      axisLine: { show: false },
    },
    series: [
      {
        name: 'Boys',
        type: 'bar',
        barWidth: '35%',
        itemStyle: { borderRadius: [0, 3, 3, 0] },
        data: boys,
      },
      {
        name: 'Girls',
        type: 'bar',
        barWidth: '35%',
        itemStyle: { borderRadius: [0, 3, 3, 0] },
        data: girls,
      },
    ],
  }
}

/** Secondary: stacked term performance (supports density of data) */
export function subjectMeanOption() {
  return {
    color: [BRAND.primary, BRAND.accent, BRAND.amber],
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['Term 1', 'Term 2', 'Term 3'],
      bottom: 0,
      textStyle: legendText,
    },
    grid: { left: 40, right: 12, top: 16, bottom: 40 },
    xAxis: {
      type: 'category',
      data: ['Math', 'Eng', 'Kisw', 'Phy', 'Chem', 'Bio', 'Hist', 'Geog'],
      axisLabel: { ...axisLabel, rotate: 30 },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel,
      splitLine: { lineStyle: { color: '#f1f5f9' } },
    },
    series: [
      {
        name: 'Term 1',
        type: 'bar',
        emphasis: { focus: 'series' },
        data: [72, 78, 81, 68, 70, 74, 79, 76],
      },
      {
        name: 'Term 2',
        type: 'bar',
        emphasis: { focus: 'series' },
        data: [75, 80, 83, 71, 69, 77, 80, 78],
      },
      {
        name: 'Term 3',
        type: 'bar',
        emphasis: { focus: 'series' },
        data: [78, 82, 85, 73, 72, 79, 82, 80],
      },
    ],
  }
}
