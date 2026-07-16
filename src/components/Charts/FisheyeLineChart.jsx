import { useCallback, useMemo, useRef, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { applyFisheyeLens } from '../../pages/Dashboard/dashboardChartOptions.js'

/**
 * Line chart with fisheye lens: hover magnifies nearby points (ECharts gallery style).
 */
function FisheyeLineChart({ option, height = 150, className = '' }) {
  const chartRef = useRef(null)
  const [focusIndex, setFocusIndex] = useState(null)

  const lensOption = useMemo(
    () => applyFisheyeLens(option, focusIndex, 2),
    [option, focusIndex],
  )

  const onEvents = useMemo(
    () => ({
      updateAxisPointer: (params) => {
        // axis pointer carries dataIndex when hovering the chart
        const axes = params?.axesInfo
        if (axes?.length && typeof axes[0].value === 'number') {
          // value may be category name — fall through
        }
      },
      mousemove: () => {},
    }),
    [],
  )

  const handleMouseMove = useCallback((e) => {
    const inst = chartRef.current?.getEchartsInstance?.()
    if (!inst || !e) return
    // Convert pixel → data index via convertFromPixel
    try {
      const pointInPixel = [e.offsetX, e.offsetY]
      if (!inst.containPixel('grid', pointInPixel)) {
        setFocusIndex(null)
        return
      }
      const pointInGrid = inst.convertFromPixel({ seriesIndex: 0 }, pointInPixel)
      if (!pointInGrid) {
        setFocusIndex(null)
        return
      }
      const idx = Math.round(pointInGrid[0])
      const catLen = option?.xAxis?.data?.length ?? 12
      if (idx >= 0 && idx < catLen) {
        setFocusIndex(idx)
      } else {
        setFocusIndex(null)
      }
    } catch {
      setFocusIndex(null)
    }
  }, [option])

  const handleMouseLeave = useCallback(() => {
    setFocusIndex(null)
  }, [])

  return (
    <div
      className={className}
      style={{ height, width: '100%' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <ReactECharts
        ref={chartRef}
        option={lensOption}
        style={{ height: '100%', width: '100%' }}
        notMerge
        lazyUpdate
        opts={{ renderer: 'canvas' }}
        onEvents={onEvents}
      />
    </div>
  )
}

export default FisheyeLineChart
