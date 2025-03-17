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
import {
  useTheme,
  CircularProgress,
  List,
  ListItem,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { css } from '@emotion/css'
import { Component, useMemo, useState, useRef, useEffect } from 'react'
import UplotReact from 'uplot-react'
import 'uplot/dist/uPlot.min.css'
import { wheelZoomPlugin } from '@modules/components/Charts/Plugins'

const useStyles = ({ palette, typography }) => ({
  graphContainer: css({
    width: '100%',
    height: '100%',
    position: 'relative',
    boxSizing: 'border-box',
  }),
  chart: css({
    height: '500px',
    width: '100%',
  }),
  title: css({
    fontWeight: typography.fontWeightBold,
    borderBottom: `1px solid ${palette.divider}`,
  }),
  center: css({
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
    height: '100%',
    width: '100%',
  }),
})

const calculateDerivative = (data) =>
  data
    .map((point, i, array) => {
      if (i === array.length - 1) {
        return null
      }
      const nextPoint = array[i + 1]

      return {
        x: point.x,
        y: (nextPoint.y - point.y) / ((nextPoint.x - point.x) / 1000),
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
      cluster[key] = (cluster[key] ?? 0) + value
    }

    if (++count === clusterFactor || idx === data.length - 1) {
      clusters.push(
        Object.fromEntries(
          Object.entries(cluster).map(([key, sum]) => [key, sum / count])
        )
      )
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

/**
 * Represents a Chartist Graph.
 *
 * @param {object} props - Props
 * @param {object[]} props.data - Chart data
 * @param {string} props.name - Chartist name
 * @param {string} props.filter - Chartist filter
 * @param {string} props.x - Chartist X
 * @param {Array|string} props.y - Chartist Y
 * @param {Function} props.interpolationY - Chartist interpolation Y
 * @param {boolean} props.derivative - Display delta values
 * @param {number} props.clusterFactor - Number of chunks per cluster
 * @param {number} props.clusterThreshold - Start clustering past this threshold
 * @param {boolean} props.shouldFill - Display line shadows/gradients
 * @param {Array} props.legendNames - List of legend names
 * @param {Array} props.lineColors - Array of line colors
 * @param {number} props.zoomFactor - Grapg zooming factor
 * @returns {Component} Chartist component
 */
const Chartist = ({
  data = [],
  name = '',
  filter = [],
  x = '',
  y = '',
  zoomFactor = 0.95,
  interpolationY = (value) => value,
  derivative = false,
  shouldFill = false,
  clusterFactor = 10,
  clusterThreshold = 10000,
  legendNames = [],
  lineColors = [],
}) => {
  const dateFormat = 'MM-dd HH:mm'
  const dateFormatHover = 'MMM dd HH:mm:ss'

  const theme = useTheme()
  const classes = useMemo(() => useStyles(theme), [theme])

  const chartRef = useRef(null)
  const [chartDimensions, setChartDimensions] = useState({
    width: 0,
    height: 0,
  })

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (chartRef.current) {
        const { width, height } = chartRef.current.getBoundingClientRect()
        setChartDimensions({
          width: width - 50,
          height: height - 150,
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
      x: x === 'TIMESTAMP' ? new Date(+point[x] * 1000).getTime() : +point[x],
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

    return derivative ? calculateDerivative(finalData) : finalData
  }, [dataChart, clusterThreshold, clusterFactor, derivative])

  const chartData = useMemo(() => {
    const xValues = processedData.map((point) => point.x)
    const yValuesArray = Array.isArray(y)
      ? y.map((yValue) => processedData.map((point) => point[yValue] ?? null))
      : [processedData.map((point) => point.y)]

    return [xValues, ...yValuesArray]
  }, [processedData, y])

  const chartOptions = useMemo(
    () => ({
      ...chartDimensions,
      drag: false,
      plugins: [wheelZoomPlugin({ factor: zoomFactor })],
      cursor: {
        bind: {
          mousedown: () => () => {}, // Clear original 'annotating' handler
        },
      },
      scales: {
        x: {
          time: true,
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
              ...(shouldFill
                ? {
                    fill: (u) => {
                      const ctx = u.ctx
                      const plotHeight = u.bbox?.height || u.over.clientHeight
                      const gradient = ctx.createLinearGradient(
                        0,
                        0,
                        0,
                        plotHeight
                      )
                      gradient.addColorStop(
                        0,
                        (lineColors?.[index] || '#40B3D9') + '66'
                      )
                      gradient.addColorStop(
                        1,

                        (lineColors?.[index] || '#40B3D9') + '00'
                      )

                      return gradient
                    },
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
                      fill: (u) => {
                        const ctx = u.ctx
                        const plotHeight = u.bbox?.height || u.over.clientHeight
                        const gradient = ctx.createLinearGradient(
                          0,
                          0,
                          0,
                          plotHeight
                        )
                        gradient.addColorStop(
                          0,
                          (lineColors?.[0] || '#40B3D9') + '66'
                        )
                        gradient.addColorStop(
                          1,

                          (lineColors?.[0] || '#40B3D9') + '00'
                        )

                        return gradient
                      },
                    }
                  : {}),
              },
            ]),
      ],
    }),
    [
      chartData,
      chartDimensions,
      processedData,
      name,
      y,
      legendNames,
      lineColors,
      interpolationY,
    ]
  )

  return (
    <Paper variant="outlined" className={classes.graphContainer}>
      <List className={classes.box} sx={{ width: '100%', height: '100%' }}>
        <ListItem className={classes.title}>
          <Typography noWrap>{name}</Typography>
        </ListItem>
        <ListItem ref={chartRef} className={classes.center}>
          {!data?.length ? (
            <Stack
              direction="row"
              justifyContent="center"
              alignItems="center"
              sx={{ width: '100%', height: '100%' }}
            >
              <CircularProgress color="secondary" />
            </Stack>
          ) : (
            <div className={classes.chart}>
              <UplotReact options={chartOptions} data={chartData} />
            </div>
          )}
        </ListItem>
      </List>
    </Paper>
  )
}

Chartist.propTypes = {
  name: PropTypes.string,
  filter: PropTypes.arrayOf(PropTypes.string),
  data: PropTypes.array,
  x: PropTypes.string,
  y: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.string,
  ]),
  interpolationY: PropTypes.func,
  derivative: PropTypes.bool,
  shouldFill: PropTypes.bool,
  enableLegend: PropTypes.bool,
  zoomFactor: PropTypes.number,
  clusterFactor: PropTypes.number,
  clusterThreshold: PropTypes.number,
  legendNames: PropTypes.arrayOf(PropTypes.string),
  lineColors: PropTypes.arrayOf(PropTypes.string),
}

Chartist.displayName = 'Chartist'

export default Chartist
