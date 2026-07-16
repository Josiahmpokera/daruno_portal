import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'

/**
 * Thin wrapper around Apache ECharts for consistent sizing in the portal.
 */
function EChart({ option, height = 280, className = '' }) {
  const chartOption = useMemo(() => option, [option])

  return (
    <ReactECharts
      option={chartOption}
      style={{ height, width: '100%' }}
      className={className}
      notMerge
      lazyUpdate
      opts={{ renderer: 'canvas' }}
    />
  )
}

export default EChart
