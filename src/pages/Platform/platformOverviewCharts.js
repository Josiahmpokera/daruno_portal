/** ECharts for Super Admin Platform Overview — polished line charts */

export const BRAND = {
  primary: '#0B3D2E',
  accent: '#2d8a68',
  amber: '#d97706',
  sky: '#0ea5e9',
  rose: '#e11d48',
  purple: '#7c3aed',
  slate: '#64748b',
}

const axisLabel = { color: '#94a3b8', fontSize: 10 }
const legendText = { color: '#64748b', fontSize: 11 }
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const baseTooltip = {
  trigger: 'axis',
  backgroundColor: 'rgba(255,255,255,0.96)',
  borderColor: '#e2e8f0',
  borderWidth: 1,
  textStyle: { color: '#334155', fontSize: 12 },
  extraCssText: 'box-shadow: 0 4px 16px rgba(15,23,42,0.08); border-radius: 8px;',
}

const lineBase = {
  type: 'line',
  smooth: 0.35,
  showSymbol: false,
  symbol: 'circle',
  symbolSize: 6,
  emphasis: { focus: 'series', showSymbol: true },
}

/** MRR + collected revenue + outstanding — dual Y-axis lines */
export function revenueTrendOption() {
  return {
    color: [BRAND.primary, BRAND.accent, BRAND.amber],
    tooltip: {
      ...baseTooltip,
      axisPointer: { type: 'cross', crossStyle: { color: '#cbd5e1' } },
      valueFormatter: (v) => `$${Number(v).toLocaleString()}k`,
    },
    legend: {
      data: ['MRR', 'Collected', 'Outstanding'],
      bottom: 0,
      itemWidth: 14,
      itemHeight: 8,
      textStyle: legendText,
    },
    grid: { left: 52, right: 48, top: 24, bottom: 48 },
    xAxis: {
      type: 'category',
      data: months,
      boundaryGap: false,
      axisLabel,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: 'value',
        name: '$k',
        nameTextStyle: { ...axisLabel, padding: [0, 0, 0, 8] },
        axisLabel: { ...axisLabel, formatter: (v) => `$${v}k` },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      },
      {
        type: 'value',
        name: 'Open $k',
        nameTextStyle: axisLabel,
        axisLabel: { ...axisLabel, formatter: (v) => `$${v}k` },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        ...lineBase,
        name: 'MRR',
        yAxisIndex: 0,
        lineStyle: { width: 2.5 },
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
        data: [42, 48, 51, 55, 58, 62, 68, 71, 76, 80, 84, 89],
      },
      {
        ...lineBase,
        name: 'Collected',
        yAxisIndex: 0,
        lineStyle: { width: 2 },
        data: [38, 44, 47, 50, 54, 58, 63, 66, 70, 74, 78, 85],
      },
      {
        ...lineBase,
        name: 'Outstanding',
        yAxisIndex: 1,
        lineStyle: { width: 2, type: 'dashed' },
        data: [18, 16, 15, 14, 16, 15, 13, 14, 12, 13, 12, 12],
      },
    ],
  }
}

/** Revenue by region over months — multi-line */
export function revenueByRegionLineOption() {
  return {
    color: [BRAND.primary, BRAND.sky, BRAND.amber, BRAND.purple, BRAND.rose],
    tooltip: {
      ...baseTooltip,
      valueFormatter: (v) => `$${v}k`,
    },
    legend: {
      data: ['Dar', 'Arusha', 'Kilimanjaro', 'Mwanza', 'Dodoma'],
      bottom: 0,
      itemWidth: 12,
      itemHeight: 8,
      textStyle: legendText,
    },
    grid: { left: 48, right: 16, top: 16, bottom: 48 },
    xAxis: {
      type: 'category',
      data: months,
      boundaryGap: false,
      axisLabel,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { ...axisLabel, formatter: (v) => `$${v}k` },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
    },
    series: [
      {
        ...lineBase,
        name: 'Dar',
        lineStyle: { width: 2.5 },
        data: [18, 19, 20, 21, 22, 24, 25, 26, 28, 29, 30, 32],
      },
      {
        ...lineBase,
        name: 'Arusha',
        data: [8, 8.5, 9, 9.5, 10, 11, 11.5, 12, 12.5, 13, 14, 14.5],
      },
      {
        ...lineBase,
        name: 'Kilimanjaro',
        data: [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.8],
      },
      {
        ...lineBase,
        name: 'Mwanza',
        data: [4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.2, 8.6, 9, 9.4],
      },
      {
        ...lineBase,
        name: 'Dodoma',
        data: [3, 3.2, 3.5, 3.8, 4, 4.3, 4.6, 4.9, 5.2, 5.5, 5.8, 6.2],
      },
    ],
  }
}

/** Collection rate trend — single area line */
export function collectionRateOption() {
  return {
    color: [BRAND.primary],
    tooltip: {
      ...baseTooltip,
      valueFormatter: (v) => `${v}%`,
    },
    grid: { left: 40, right: 16, top: 20, bottom: 28 },
    xAxis: {
      type: 'category',
      data: months,
      boundaryGap: false,
      axisLabel,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      min: 80,
      max: 100,
      axisLabel: { ...axisLabel, formatter: (v) => `${v}%` },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
    },
    series: [
      {
        ...lineBase,
        name: 'Collection rate',
        lineStyle: { width: 2.5 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(11,61,46,0.16)' },
              { offset: 1, color: 'rgba(11,61,46,0.01)' },
            ],
          },
        },
        markLine: {
          silent: true,
          symbol: 'none',
          label: { formatter: 'Target 90%', fontSize: 10, color: '#94a3b8' },
          lineStyle: { color: '#cbd5e1', type: 'dashed' },
          data: [{ yAxis: 90 }],
        },
        data: [86, 87, 88, 89, 88, 90, 91, 90, 91, 92, 91, 91.2],
      },
    ],
  }
}

/** Plan mix over months — multi-line (demo or live plan names) */
export function schoolsByPlanLineOption(planMix = []) {
  const colors = [BRAND.sky, BRAND.primary, BRAND.purple, BRAND.amber, BRAND.rose, BRAND.accent]
  const live = Array.isArray(planMix) ? planMix.filter((p) => p && p.name) : []

  if (live.length > 0) {
    // Snapshot: active subscribers per plan (line across plan names)
    const names = live.map((p) => p.name)
    const active = live.map((p) => Number(p.active_subscriptions_count ?? 0))
    const all = live.map((p) => Number(p.subscriptions_count ?? 0))
    return {
      color: [BRAND.primary, BRAND.sky],
      tooltip: { ...baseTooltip },
      legend: {
        data: ['Active + trial', 'All time'],
        bottom: 0,
        itemWidth: 12,
        itemHeight: 8,
        textStyle: legendText,
      },
      grid: { left: 40, right: 16, top: 16, bottom: 48 },
      xAxis: {
        type: 'category',
        data: names,
        boundaryGap: false,
        axisLabel,
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: 'Schools',
        nameTextStyle: axisLabel,
        minInterval: 1,
        axisLabel,
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      },
      series: [
        {
          ...lineBase,
          name: 'Active + trial',
          showSymbol: true,
          symbolSize: 7,
          lineStyle: { width: 2.5 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(11,61,46,0.16)' },
                { offset: 1, color: 'rgba(11,61,46,0.01)' },
              ],
            },
          },
          data: active,
        },
        {
          ...lineBase,
          name: 'All time',
          showSymbol: true,
          symbolSize: 5,
          lineStyle: { width: 2, type: 'dashed' },
          data: all,
        },
      ],
    }
  }

  return {
    color: colors,
    tooltip: { ...baseTooltip },
    legend: {
      data: ['Trial', 'Basic', 'Professional', 'Enterprise'],
      bottom: 0,
      itemWidth: 12,
      itemHeight: 8,
      textStyle: legendText,
    },
    grid: { left: 40, right: 16, top: 16, bottom: 48 },
    xAxis: {
      type: 'category',
      data: months,
      boundaryGap: false,
      axisLabel,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: 'Schools',
      nameTextStyle: axisLabel,
      axisLabel,
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
    },
    series: [
      {
        ...lineBase,
        name: 'Trial',
        lineStyle: { width: 2, type: 'dashed' },
        data: [14, 12, 15, 11, 10, 13, 9, 12, 10, 8, 9, 8],
      },
      {
        ...lineBase,
        name: 'Basic',
        lineStyle: { width: 2.5 },
        data: [30, 35, 38, 42, 45, 48, 50, 52, 55, 58, 60, 62],
      },
      {
        ...lineBase,
        name: 'Professional',
        lineStyle: { width: 2.5 },
        data: [18, 22, 26, 30, 34, 38, 42, 45, 48, 50, 52, 54],
      },
      {
        ...lineBase,
        name: 'Enterprise',
        lineStyle: { width: 2.5 },
        data: [4, 5, 6, 8, 9, 11, 12, 14, 15, 16, 17, 18],
      },
    ],
  }
}

/** Renewals vs churn — dual line */
export function renewalsChurnOption() {
  return {
    color: [BRAND.primary, BRAND.rose],
    tooltip: {
      ...baseTooltip,
      axisPointer: { type: 'line' },
    },
    legend: {
      data: ['Renewals', 'Churned'],
      bottom: 0,
      itemWidth: 12,
      itemHeight: 8,
      textStyle: legendText,
    },
    grid: { left: 40, right: 16, top: 16, bottom: 48 },
    xAxis: {
      type: 'category',
      data: months,
      boundaryGap: false,
      axisLabel,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel,
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
    },
    series: [
      {
        ...lineBase,
        name: 'Renewals',
        lineStyle: { width: 2.5 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(11,61,46,0.14)' },
              { offset: 1, color: 'rgba(11,61,46,0.01)' },
            ],
          },
        },
        data: [14, 16, 15, 18, 17, 20, 19, 21, 22, 20, 24, 22],
      },
      {
        ...lineBase,
        name: 'Churned',
        lineStyle: { width: 2 },
        data: [4, 3, 5, 2, 4, 3, 2, 3, 2, 4, 2, 3],
      },
    ],
  }
}

/** New schools per month — area line */
export function newSchoolsPerMonthOption() {
  return {
    color: [BRAND.primary],
    tooltip: { ...baseTooltip },
    grid: { left: 40, right: 16, top: 20, bottom: 28 },
    xAxis: {
      type: 'category',
      data: months,
      boundaryGap: false,
      axisLabel,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel,
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
    },
    series: [
      {
        ...lineBase,
        name: 'New schools',
        showSymbol: true,
        symbolSize: 5,
        lineStyle: { width: 2.5 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(11,61,46,0.16)' },
              { offset: 1, color: 'rgba(11,61,46,0.01)' },
            ],
          },
        },
        data: [8, 12, 9, 14, 11, 16, 13, 10, 15, 12, 9, 18],
      },
    ],
  }
}

/** Net growth by region — line with zero mark */
export function regionGrowthLineOption() {
  const regions = ['Dar', 'Arusha', 'Kilimanjaro', 'Mwanza', 'Dodoma', 'Mbeya']
  const values = [12, 5, 4, 3, -2, 1]
  return {
    color: [BRAND.primary],
    tooltip: {
      ...baseTooltip,
      formatter: (p) => {
        const v = p[0].value
        return `<strong>${p[0].name}</strong><br/>Net change: ${v >= 0 ? '+' : ''}${v} schools`
      },
    },
    grid: { left: 44, right: 20, top: 24, bottom: 36 },
    xAxis: {
      type: 'category',
      data: regions,
      axisLabel,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel,
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
    },
    visualMap: {
      show: false,
      pieces: [
        { lte: -0.01, color: BRAND.rose },
        { gte: 0, color: BRAND.primary },
      ],
    },
    series: [
      {
        type: 'line',
        smooth: 0.35,
        symbol: 'circle',
        symbolSize: 8,
        showSymbol: true,
        lineStyle: { width: 2.5 },
        areaStyle: { color: 'rgba(11,61,46,0.08)' },
        markLine: {
          silent: true,
          symbol: 'none',
          label: { show: false },
          lineStyle: { color: '#cbd5e1', type: 'dashed' },
          data: [{ yAxis: 0 }],
        },
        data: values,
      },
    ],
  }
}

/** DAU / WAU / API — dual Y-axis lines */
export function usageMultiAxisOption() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return {
    color: [BRAND.primary, BRAND.sky, BRAND.amber],
    tooltip: {
      ...baseTooltip,
      axisPointer: { type: 'cross', crossStyle: { color: '#cbd5e1' } },
    },
    legend: {
      data: ['DAU schools', 'WAU schools', 'API (k)'],
      bottom: 0,
      itemWidth: 12,
      itemHeight: 8,
      textStyle: legendText,
    },
    grid: { left: 48, right: 48, top: 16, bottom: 48 },
    xAxis: {
      type: 'category',
      data: days,
      boundaryGap: false,
      axisLabel,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: 'value',
        name: 'Schools',
        nameTextStyle: axisLabel,
        axisLabel,
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      },
      {
        type: 'value',
        name: 'API k',
        nameTextStyle: axisLabel,
        axisLabel,
        splitLine: { show: false },
      },
    ],
    series: [
      {
        ...lineBase,
        name: 'DAU schools',
        yAxisIndex: 0,
        lineStyle: { width: 2.5 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(11,61,46,0.14)' },
              { offset: 1, color: 'rgba(11,61,46,0.01)' },
            ],
          },
        },
        data: [132, 140, 148, 145, 156, 98, 86],
      },
      {
        ...lineBase,
        name: 'WAU schools',
        yAxisIndex: 0,
        lineStyle: { width: 2 },
        data: [160, 162, 165, 166, 169, 164, 161],
      },
      {
        ...lineBase,
        name: 'API (k)',
        yAxisIndex: 1,
        lineStyle: { width: 2, type: 'dashed' },
        data: [980, 1050, 1120, 1080, 1245, 620, 540],
      },
    ],
  }
}

/** Login trends — dual line */
export function loginTrendsOption() {
  return {
    color: [BRAND.primary, BRAND.sky],
    tooltip: { ...baseTooltip },
    legend: {
      data: ['Web', 'Mobile'],
      bottom: 0,
      itemWidth: 12,
      itemHeight: 8,
      textStyle: legendText,
    },
    grid: { left: 48, right: 16, top: 16, bottom: 48 },
    xAxis: {
      type: 'category',
      data: months,
      boundaryGap: false,
      axisLabel,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        ...axisLabel,
        formatter: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v),
      },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
    },
    series: [
      {
        ...lineBase,
        name: 'Web',
        lineStyle: { width: 2.5 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(11,61,46,0.12)' },
              { offset: 1, color: 'rgba(11,61,46,0.01)' },
            ],
          },
        },
        data: [1200, 1400, 1500, 1600, 1800, 1700, 1900, 2000, 2200, 2100, 2300, 2500],
      },
      {
        ...lineBase,
        name: 'Mobile',
        lineStyle: { width: 2 },
        data: [400, 500, 600, 700, 800, 900, 900, 1000, 1100, 1200, 1300, 1400],
      },
    ],
  }
}

/** Module usage — multi-line */
export function mostUsedModulesLineOption() {
  const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8']
  return {
    color: [
      BRAND.primary,
      BRAND.sky,
      BRAND.amber,
      BRAND.purple,
      BRAND.rose,
      BRAND.accent,
    ],
    tooltip: { ...baseTooltip },
    legend: {
      data: ['Students', 'Finance', 'Attendance', 'Exams', 'Library', 'Compliance'],
      bottom: 0,
      itemWidth: 12,
      itemHeight: 8,
      textStyle: legendText,
    },
    grid: { left: 48, right: 16, top: 12, bottom: 56 },
    xAxis: {
      type: 'category',
      data: weeks,
      boundaryGap: false,
      axisLabel,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: 'Sessions',
      nameTextStyle: axisLabel,
      axisLabel: {
        ...axisLabel,
        formatter: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v),
      },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
    },
    series: [
      {
        ...lineBase,
        name: 'Students',
        lineStyle: { width: 2.5 },
        data: [4200, 4400, 4600, 4800, 5000, 5100, 5150, 5200],
      },
      {
        ...lineBase,
        name: 'Finance',
        data: [3100, 3300, 3500, 3600, 3800, 3900, 4000, 4100],
      },
      {
        ...lineBase,
        name: 'Attendance',
        data: [2400, 2600, 2700, 2900, 3000, 3050, 3100, 3200],
      },
      {
        ...lineBase,
        name: 'Exams',
        data: [1200, 1400, 1600, 1800, 1900, 1950, 2000, 2100],
      },
      {
        ...lineBase,
        name: 'Library',
        data: [800, 900, 950, 1000, 1100, 1150, 1200, 1240],
      },
      {
        ...lineBase,
        name: 'Compliance',
        data: [400, 500, 550, 600, 700, 750, 800, 820],
      },
    ],
  }
}
