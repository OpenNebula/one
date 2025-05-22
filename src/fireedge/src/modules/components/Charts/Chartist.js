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

import { css } from '@emotion/css'
import { timeFromSeconds } from '@ModelsModule'
import { wheelZoomPlugin } from '@modules/components/Charts/Plugins'
import {
  CircularProgress,
  List,
  ListItem,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material'
import { Component, useMemo, useRef, useState } from 'react'
import UplotReact from 'uplot-react'
import { useResizeObserver } from '@HooksModule'
import { Tr } from '@modules/components/HOC'
import { T } from '@ConstantsModule'

const useStyles = ({ palette, typography }) => ({
  graphContainer: css({
    width: '100%',
    height: '100%',
    position: 'relative',
    boxSizing: 'border-box',
  }),
  title: css({
    fontWeight: typography.fontWeightBold,
    borderBottom: `1px solid ${palette.divider}`,
  }),
  placeholder: css({
    width: '100%',
    aspectRatio: '16/9',
    overflow: 'hidden',
  }),
})

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
 * @param {Array} props.x - Chartist X
 * @param {Array|string} props.y - Chartist Y
 * @param {Function} props.interpolationY - Chartist interpolation Y
 * @param {boolean} props.shouldFill - Display line shadows/gradients
 * @param {Array} props.legendNames - List of legend names
 * @param {Array} props.trendLineOnly - Array of Y values to only draw a trend line between
 * @param {Array} props.lineColors - Array of line colors
 * @param {number} props.zoomFactor - Grapg zooming factor
 * @param {string} props.dateFormat - Labels timestamp format
 * @param {string} props.dateFormatHover - Legend timestamp format
 * @param {Function} props.setTransform - Function applied to set of paired labels. A paired label is 2 or more grouped together in an array.
 * @param {string} props.serieScale - Number to multiply X axis series length with. Should be used if a pair transform is stretching the Y series.
 * @param {boolean} props.isFetching - If the data still fetching
 * @returns {Component} Chartist component
 */
const Chartist = ({
  data = [],
  isFetching = false,
  name = '',
  x = '',
  y = '',
  zoomFactor = 0.95,
  interpolationY = (value) => value,
  shouldFill = [],
  serieScale,
  trendLineOnly = [],
  setTransform,
  legendNames = [],
  lineColors = [],
  dateFormat = 'MM-dd HH:mm',
  dateFormatHover = 'MMM dd HH:mm:ss',
}) => {
  const theme = useTheme()
  const classes = useMemo(() => useStyles(theme), [theme])

  const chartRef = useRef(null)
  const [chartDimensions, setChartDimensions] = useState({
    width: 0,
    height: 0,
  })

  useResizeObserver(
    chartRef,
    () => {
      if (chartRef.current) {
        requestAnimationFrame(() => {
          const { width, height } = chartRef.current.getBoundingClientRect()
          setChartDimensions({
            width: width - 50,
            height: height - 150,
          })
        })
      }
    },
    200
  )

  const transformData = useMemo(() => {
    if (!data?.length) return []

    const renderableY = []
    const filterKeys = new Set(y?.flat() ?? [])

    const [xValues, yValues] = (data ?? []).reduce(
      ([xA, yA], point) => {
        if (
          point &&
          typeof point === 'object' &&
          Object.hasOwn(point, 'TIMESTAMP')
        ) {
          xA.push(point.TIMESTAMP)

          const yEntry = {}
          for (const key of filterKeys) {
            yEntry[key] = Object.hasOwn(point, key) ? point[key] : null
          }

          yA.push(yEntry)
        }

        return [xA, yA]
      },
      [[], []]
    )

    const timestamps = Array.from(
      xValues.reduce((map, point) => {
        x.forEach((transform, xId) => {
          const ts = transform(point)
          const entry = map.get(ts)
          if (entry) {
            if (!entry.includes(xId)) entry.push(xId)
          } else {
            map.set(ts, [xId])
          }
        })

        return map
      }, new Map())
    )
      .map(([timestamp, xIds]) => ({ timestamp, xIds }))
      .sort((a, b) => a.timestamp - b.timestamp)

    if (!timestamps?.length) return []

    const transformY = () => {
      const trendLineIndexes = trendLineOnly?.map((label) =>
        y?.flat()?.indexOf(label)
      )

      const transformedYValues = y
        .flatMap((label) => {
          if (Array.isArray(label)) {
            return label?.map((labelPair, labelPairIndex) =>
              setTransform(
                yValues,
                xValues,
                timestamps,
                labelPair,
                labelPairIndex
              )
            )
          } else {
            return [yValues?.map((point) => point?.[label])]
          }
        })
        ?.map((yValue, idx) => {
          const fYValues = yValue
            ?.map(parseFloat)
            ?.filter((v) => !Number.isNaN(v) && v !== undefined)

          return trendLineIndexes?.includes(idx) && fYValues?.length > 0
            ? [
                Math.min(...fYValues),
                ...Array(timestamps?.map((t) => t.timestamp)?.length - 2),
                Math.max(...fYValues),
              ]
            : yValue // Return unformatted as to not potentially discard setTransform
        })
        ?.filter((transformedArray, index) => {
          const isAllInvalid = transformedArray?.every(
            (val) => val === undefined || Number.isNaN(val)
          )

          if (!isAllInvalid) {
            renderableY.push(y.flat()[index])

            return true
          }

          return false
        })

      const flatTransform = transformedYValues
        ?.flat()
        ?.filter((v) => !Number.isNaN(v) && v !== undefined)

      const YMin = flatTransform?.length > 0 ? Math.min(...flatTransform) : 0
      const YMax = flatTransform?.length > 0 ? Math.max(...flatTransform) : 1

      const PRangeY = (YMax - YMin) / 2
      const YPadding = Math.abs(PRangeY * 0.05) ?? 0

      return [
        transformedYValues,
        [+YMin === 0 ? YMin : YMin - YPadding, YMax + YPadding + 0.000001], // Adding a tiny buffer for the max so we dont get a range of exact 0
      ]
    }

    const [transformedY, YRange] = transformY()

    const seriesLength =
      timestamps?.length * (serieScale ?? transformedY?.length)

    const XMin = timestamps?.[0]?.timestamp
    const XMax = timestamps?.slice(0, seriesLength)?.pop()?.timestamp
    const PRangeX = (XMax - XMin) / 2
    const XPadding = Math.abs(PRangeX * 0.01) ?? 0

    const XRange = [
      +XMin === 0 ? XMin : XMin - XPadding,
      XMax + XPadding + 0.000001,
    ] // Adding a tiny buffer for the max so we dont get a range of exact 0

    return {
      YRender: renderableY,
      dataset: [timestamps?.map((t) => t.timestamp), ...transformedY],
      YRange,
      XRange,
    }
  }, [data])

  const chartOptions = useMemo(() => {
    const {
      dataset = [],
      YRender = [],
      YRange = [],
      XRange = [],
    } = transformData ?? {}

    if (!dataset.length || !YRender.length) return

    return {
      ...chartDimensions,
      drag: false,
      padding: [20, 40, 0, 40], // Pad top / left / right
      plugins: [
        wheelZoomPlugin({ factor: zoomFactor, scaleY: false, scaleX: true }),
      ],
      cursor: {
        bind: {
          mousedown: () => () => {}, // Clear original 'annotating' handler
          dblclick: () => () => {}, // Clear reset X axis
          click: () => () => {}, // Clear click handler
        },
      },
      scales: {
        x: {
          time: true,
          min: XRange?.[0] ?? null,
          max: XRange?.[1] ?? null,
        },
        y: { auto: false, min: YRange?.[0] ?? null, max: YRange?.[1] ?? null },
      },

      axes: [
        {
          grid: { show: true },
          stroke: theme?.palette?.graphs?.axis?.color,
          ticks: { show: true },
          values: (_, ticks) =>
            minMaxTick(ticks, (label) =>
              timeFromSeconds(label).toFormat(dateFormat)
            ),
        },
        {
          grid: { show: true },
          stroke: theme?.palette?.graphs?.axis?.color,
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
        ...(Array.isArray(YRender)
          ? YRender?.map((yValue, index) => ({
              label: legendNames?.[yValue] ?? legendNames?.[index] ?? yValue,
              value: (_, yV) => interpolationY(yV) || yV,
              stroke: lineColors?.[index] || '#40B3D9',
              points: {
                show: (_u, _seriesIdx, _, seriesLength) => seriesLength < 1000,
              },
              ...([]?.includes(index)
                ? {
                    dash: [5, 5],
                    points: { show: false },
                  }
                : {}),
              spanGaps: true,
              ...(shouldFill.includes(yValue)
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
                ...(shouldFill.includes(YRender)
                  ? {
                      fill: (u) => createFill(u, lineColors?.[0]),
                    }
                  : {}),
              },
            ]),
      ],
    }
  }, [
    transformData,
    chartDimensions,
    name,
    y,
    legendNames,
    lineColors,
    interpolationY,
  ])

  return (
    <Paper variant="outlined" className={classes.graphContainer}>
      <List className={classes.box} sx={{ width: '100%', height: '100%' }}>
        <ListItem className={classes.title}>
          <Typography noWrap>{name}</Typography>
        </ListItem>
        <ListItem ref={chartRef} className={classes.placeholder}>
          {isFetching ? (
            <Stack direction="row" justifyContent="center" alignItems="center">
              <CircularProgress color="secondary" />
            </Stack>
          ) : transformData == null || !transformData?.dataset?.length > 0 ? (
            <Stack direction="row" justifyContent="center" alignItems="center">
              <Typography>{Tr(T.NoDataAvailable)}</Typography>
            </Stack>
          ) : (
            <div>
              <UplotReact
                options={chartOptions}
                data={transformData.dataset ?? []}
              />
            </div>
          )}
        </ListItem>
      </List>
    </Paper>
  )
}

Chartist.propTypes = {
  name: PropTypes.string,
  data: PropTypes.array,
  x: PropTypes.arrayOf(PropTypes.func),
  y: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),
  ]),
  interpolationY: PropTypes.func,
  shouldFill: PropTypes.array,
  enableLegend: PropTypes.bool,
  zoomFactor: PropTypes.number,
  legendNames: PropTypes.arrayOf(PropTypes.string),
  setTransform: PropTypes.func,
  serieScale: PropTypes.number,
  trendLineOnly: PropTypes.arrayOf(PropTypes.string),
  lineColors: PropTypes.arrayOf(PropTypes.string),
  dateFormat: PropTypes.string,
  dateFormatHover: PropTypes.string,
  isFetching: PropTypes.bool,
}

Chartist.displayName = 'Chartist'

export default Chartist
