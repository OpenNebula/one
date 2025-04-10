/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */

import PropTypes from 'prop-types'

import { timeFromSeconds } from '@ModelsModule'
import { wheelZoomPlugin } from '@modules/components/Charts/Plugins'
import { CircularProgress, Stack } from '@mui/material'
import { Component, useEffect, useMemo, useRef, useState } from 'react'
import UplotReact from 'uplot-react'

const calculateDerivative = (data, filter) =>
  data
    .map((point, i, array) => {
      if (i === array.length - 1) {
        return null
      }
      const nextPoint = array[i + 1]
      const yValues = Object.fromEntries(
        filter.map((key) => [
          key,
          (nextPoint?.[key] - point?.[key]) / ((nextPoint.x - point.x) / 1000),
        ])
      )

      return {
        x: point.x,
        ...yValues,
      }
    })
    .filter((point) => point)

const clusterData = (data, threshold = 1000, clusterFactor = 10) => {
  if (data.length <= threshold) return data

  const clusters = []
  let cluster = {}
  let count = 0

  for (const [idx, chunk] of data.entries()) {
    for (const [key, value] of Object.entries(chunk)) {
      cluster[key] = Array.isArray(value)
        ? value.map((val, vIdx) => cluster?.[key]?.[vIdx] ?? 0 + val ?? 0)
        : (cluster[key] ?? 0) + value
    }

    if (++count === clusterFactor || idx === data.length - 1) {
      clusters.push(
        Object.fromEntries(
          Object.entries(cluster).map(([key, sum]) => {
            if (key === 'x') {
              return [key, sum]
            }

            if (Array.isArray(sum)) {
              return [key, sum.map((val) => val / count)]
            }

            return [key, sum / count]
          })
        )
      )

      // Reset cluster and count
      cluster = {}
      count = 0
    }
  }

  return clusters
}

const minMaxTick = (ticks, formatter) => {
  const minTick = Math.min(...ticks)
  const maxTick = Math.max(...ticks)

  const minLabel = formatter(minTick)
  const maxLabel = formatter(maxTick)

  const res = [minLabel]
    .concat(Array.from({ length: ticks?.length - 2 || 0 }, () => '')) // -2 for min/max label
    .concat([maxLabel])

  return res
}

const createFill = (u, color) => {
  const ctx = u.ctx
  const plotHeight = u.bbox?.height || u.over.clientHeight
  const gradient = ctx.createLinearGradient(0, 0, 0, plotHeight)
  gradient.addColorStop(0, (color || '#40B3D9') + '66')
  gradient.addColorStop(
    1,

    (color || '#40B3D9') + '00'
  )

  return gradient
}

/**
 * Represents a Chartist Graph.
 *
 * @param {object} props - Props
 * @param {object[]} props.data - Chart data
 * @param {string} props.name - Chartist name
 * @param {string} props.filter - Chartist filter
 * @param {Array} props.x - Chartist X
 * @param {Array|string} props.y - Chartist Y
 * @param {Function} props.interpolationY - Chartist interpolation Y
 * @param {boolean} props.derivative - Display delta values
 * @param {number} props.clusterFactor - Number of chunks per cluster
 * @param {number} props.clusterThreshold - Start clustering past this threshold
 * @param {boolean} props.shouldFill - Display line shadows/gradients
 * @param {boolean} props.clampForecast - Clamp X-axis range to forecast range
 * @param {boolean} props.sortX - Sort X-axis ascending order
 * @param {boolean} props.shouldPadY - Padds Y-axis with the length of the previous Y-series, creating a continuous line
 * @param {Array} props.legendNames - List of legend names
 * @param {Array} props.trendLineOnly - Array of Y values to only draw a trend line between
 * @param {Array} props.lineColors - Array of line colors
 * @param {number} props.zoomFactor - Grapg zooming factor
 * @param {string} props.dateFormat - Labels timestamp format
 * @param {string} props.dateFormatHover - Legend timestamp format
 * @param {boolean} props.showLegends - show labels
 * @returns {Component} Chartist component
 */
const Graph = ({
  data = [],
  name = '',
  filter = [],
  x = '',
  y = '',
  zoomFactor = 0.95,
  interpolationY = (value) => value,
  derivative = false,
  shouldFill = false,
  clampForecast = false,
  sortX = false,
  shouldPadY = [],
  clusterFactor = 10,
  clusterThreshold = 10000,
  trendLineOnly = [],
  legendNames = [],
  lineColors = [],
  dateFormat = 'MM-dd HH:mm',
  dateFormatHover = 'MMM dd HH:mm:ss',
  showLegends = true,
}) => {
  const chartRef = useRef(null)
  const [chartDimensions, setChartDimensions] = useState({
    width: 0,
    height: 0,
  })

  const [trendLineIdxs, setTrendLineIdxs] = useState([])
  const [shouldPad, setShouldPad] = useState([])

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (chartRef.current) {
        const { width, height } = chartRef.current.getBoundingClientRect()
        setChartDimensions({
          width: width - 50,
          height: height - (showLegends ? 150 : 0),
        })
      }
    })

    if (chartRef.current) {
      observer.observe(chartRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  const dataChart = useMemo(() => {
    if (!filter.length) return []

    let filteredData = data
    if (filter.length) {
      filteredData = data.filter((point) =>
        Object.keys(point).some((key) => filter.includes(key))
      )
    }

    return filteredData.map((point) => ({
      x: Array.isArray(x)
        ? x.map((xVal) =>
            typeof xVal === 'function' ? xVal(point) : +point[xVal]
          )
        : typeof x === 'function'
        ? x(point)
        : +point[x],
      ...(Array.isArray(y)
        ? Object.fromEntries(y.map((pt) => [pt, +point[pt]]))
        : { y: +point[y] }),
    }))
  }, [data, filter, x, y])

  const processedData = useMemo(() => {
    let finalData = dataChart
    if (dataChart.length > clusterThreshold) {
      finalData = clusterData(dataChart, clusterThreshold, clusterFactor)
    }

    return derivative ? calculateDerivative(finalData, filter) : finalData
  }, [dataChart, clusterThreshold, clusterFactor, derivative])

  const chartData = useMemo(() => {
    let xValues = processedData.map((point) => point.x).flat()

    xValues = sortX ? xValues?.sort((a, b) => a - b) : xValues

    const yValuesArray = Array.isArray(y)
      ? y.map((yValue, yIdx) => {
          if (trendLineOnly?.includes(yValue)) {
            setTrendLineIdxs((prev) => [...prev, yIdx])
          }
          if (shouldPadY?.includes(yValue)) {
            setShouldPad((prev) => [...prev, yIdx])
          }

          return processedData.map((point) => point[yValue] ?? null)
        })
      : [processedData.map((point) => point.y)]

    if (!shouldPad?.length && !trendLineIdxs?.length) {
      return [xValues, ...yValuesArray]
    }

    const paddedArray = yValuesArray.map((_, idx) => {
      let arr = []

      if (trendLineIdxs?.includes(idx)) {
        arr = yValuesArray[idx].slice(0, 1)
        while (arr.length < xValues?.length - 1) {
          arr.push(null)
        }
        arr.push(yValuesArray[idx]?.slice(-1).pop())
      } else {
        if (!shouldPad?.includes(idx)) return yValuesArray[idx]

        // Exclude trendline padding
        const paddLength = yValuesArray?.filter(
          (_y, yIdx) => !trendLineIdxs?.includes(yIdx)
        )?.[idx > 0 ? idx - 1 : 0]?.length

        while (arr.length < paddLength) {
          arr.push(null)
        }
        arr = [...arr, ...yValuesArray[idx]]
      }

      return arr
    })

    return [xValues, ...paddedArray]
  }, [processedData, y, shouldPadY])

  const chartOptions = useMemo(() => {
    const options = {
      ...chartDimensions,
      drag: false,
      legend: {
        show: false,
      },
      plugins: [wheelZoomPlugin({ factor: zoomFactor })],
      cursor: {
        bind: {
          mousedown: () => () => {}, // Clear original 'annotating' handler
        },
      },
      scales: {
        x: {
          time: true,
          ...(clampForecast
            ? {
                min: processedData?.[0]?.x?.[0],
                max: processedData?.[processedData?.length - 1]?.x?.[1],
              }
            : {}),
        },
        y: { auto: true },
      },
      axes: [
        {
          grid: { show: true },
          ticks: { show: true },
          values: (_, ticks) =>
            minMaxTick(ticks, (label) =>
              timeFromSeconds(label).toFormat(dateFormat)
            ),
        },
        {
          grid: { show: true },
          ticks: { show: true },
          values: (_, ticks) => minMaxTick(ticks, (yV) => interpolationY(yV)),
        },
      ],
      series: [
        {
          label: 'Time',
          value: (_, timestamp) =>
            timestamp
              ? timeFromSeconds(timestamp).toFormat(dateFormatHover)
              : '--',
        },
        ...(Array.isArray(y)
          ? y.map((yValue, index) => ({
              label: legendNames?.[index] || yValue,
              value: (_, yV) => interpolationY(yV) || yV,
              stroke: lineColors?.[index] || '#40B3D9',
              points: { show: true },
              ...(trendLineIdxs?.includes(index)
                ? {
                    dash: [5, 5],
                    points: { show: false },
                  }
                : {}),
              spanGaps: true,
              ...(shouldFill
                ? {
                    fill: (u) => createFill(u, lineColors?.[index]),
                  }
                : {}),
              focus: true,
            }))
          : [
              {
                label: name,
                stroke: lineColors?.[0] || '#40B3D9',
                value: (_, yV) => interpolationY(yV),
                focus: true,
                ...(shouldFill
                  ? {
                      fill: (u) => createFill(u, lineColors?.[0]),
                    }
                  : {}),
              },
            ]),
      ],
    }
    if (showLegends) {
      options.legend = {
        show: true,
      }
      options.padding = [20, 40, 0, 40] // Pad top / left / right
    }

    return options
  }, [
    trendLineIdxs,
    chartData,
    chartDimensions,
    processedData,
    name,
    y,
    legendNames,
    lineColors,
    interpolationY,
  ])

  return (
    <Stack
      direction="row"
      justifyContent="center"
      alignItems="center"
      sx={{
        width: '100%',
        aspectRatio: '16/9',
        overflow: 'hidden',
      }}
      ref={chartRef}
    >
      {!data?.length ? (
        <CircularProgress color="secondary" />
      ) : (
        <UplotReact options={chartOptions} data={chartData} />
      )}
    </Stack>
  )
}

Graph.propTypes = {
  name: PropTypes.string,
  filter: PropTypes.arrayOf(PropTypes.string),
  data: PropTypes.array,
  x: PropTypes.arrayOf(PropTypes.func),
  y: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.string,
  ]),
  interpolationY: PropTypes.func,
  derivative: PropTypes.bool,
  shouldFill: PropTypes.bool,
  clampForecast: PropTypes.bool,
  sortX: PropTypes.bool,
  shouldPadY: PropTypes.bool,
  enableLegend: PropTypes.bool,
  zoomFactor: PropTypes.number,
  clusterFactor: PropTypes.number,
  clusterThreshold: PropTypes.number,
  legendNames: PropTypes.arrayOf(PropTypes.string),
  trendLineOnly: PropTypes.arrayOf(PropTypes.string),
  lineColors: PropTypes.arrayOf(PropTypes.string),
  dateFormat: PropTypes.string,
  dateFormatHover: PropTypes.string,
  showLegends: PropTypes.bool,
}

Graph.displayName = 'Graph'

export default Graph
