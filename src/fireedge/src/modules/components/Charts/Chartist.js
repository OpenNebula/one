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
import {
  wheelZoomPlugin,
  tooltipPlugin,
} from '@modules/components/Charts/Plugins'
import {
  CircularProgress,
  List,
  ListItem,
  Paper,
  Box,
  Stack,
  Typography,
  useTheme,
  FormControl,
  Select,
  MenuItem,
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
  legend: css({
    '& .u-legend': {
      color: palette.graphs.legend,
      width: '100%',
      display: 'table',
      borderSpacing: 0,
      borderCollapse: 'collapse',
      tableLayout: 'fixed',
    },
    '.u-legend .u-marker': {
      width: '0.7em',
      height: '0.5em',
      marginRight: '4px',
      backgroundClip: 'padding-box !important',
    },
  }),
  title: css({
    lineHeight: '100%',
  }),
  placeholder: css({
    width: '100%',
    aspectRatio: '16/9',
    overflow: 'hidden',
  }),
  tooltip: css({
    fontSize: '0.625em',
    position: 'absolute',
    background: palette.sunstoneColors.darkBlue[400],
    padding: '4px 8px',
    color: '#fff',
    display: 'none',
    borderRadius: '4px 4px 4px 4px',
    pointerEvents: 'none',
    zIndex: 999,
    fontFamily: 'Ubuntu',
    whiteSpace: 'nowrap',
  }),
  selectRoot: css({
    '&:focus': {
      backgroundColor: 'transparent !important',
    },
    color: palette.grey[500],
    '& .MuiSelect-icon': {
      color: palette.grey[500],
    },
  }),
})

const minMaxTick = (ticks, formatter = (x) => x, intervals = 2) => {
  if (!ticks || ticks.length === 0) return []

  const sortedTicks = [...ticks].sort((a, b) => a - b)
  const n = sortedTicks.length

  const intervalIdxs = Array.from({ length: intervals }, (_, i) =>
    Math.floor((i * (n - 1)) / (intervals - 1))
  )

  const res = Array(n).fill('')

  intervalIdxs.forEach((idx) => {
    res[idx] = formatter(sortedTicks[idx])
  })

  return res
}

const createFill = (u, color) => {
  const ctx = u.ctx
  const plotHeight = u.bbox?.height || u.over.clientHeight
  const gradient = ctx.createLinearGradient(0, 0, 0, plotHeight)

  const baseColor = color || '#40B3D9'

  gradient.addColorStop(0, `${baseColor}A8`)
  gradient.addColorStop(0.71, `${baseColor}54`)
  gradient.addColorStop(1, `${baseColor}00`)

  return gradient
}

const sortingOptions = {
  [T.Last30Minutes]: 30 * (60 * 1e3),
  [T.LastDay]: 24 * 60 * (60 * 1e3),
  [T.LastWeek]: 7 * 24 * 60 * (60 * 1e3),
  [T.LastMonth]: 30 * 24 * 60 * (60 * 1e3),
}

/**
 * Represents a Chartist Graph.
 *
 * @param {object} props - Props
 * @param {object[]} props.data - Chart data
 * @param {string} props.name - Chartist name
 * @param {Array} props.x - Chartist X
 * @param {Array|string} props.y - Chartist Y
 * @param {number} props.yRangeOffset - Adds a tiny offset to the y Range so the graph renders properly. This can be customized based on the nature of the data. For percentages 100 can be used instead for example.
 * @param {number} props.xRangeOffset - Adds a tiny offset to the x Range so the graph renders properly.
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
  yRangeOffset = 0.000001,
  xRangeOffset = 0.000001,
  zoomFactor = 0.95,
  interpolationY = (value) => value,
  shouldFill = [],
  serieScale,
  trendLineOnly = [],
  setTransform,
  legendNames = [],
  lineColors = [],
  dateFormat = 'MM/dd/yyyy\nhh:mm a',
  dateFormatHover = 'MMM dd HH:mm:ss',
}) => {
  const theme = useTheme()
  const classes = useMemo(() => useStyles(theme), [theme])
  const [timePeriod, setTimePeriod] = useState(sortingOptions[T.Last30Minutes])
  const [scaleIsZoomed, setScaleIsZoomed] = useState(false)

  const chartRef = useRef(null)
  const uplotRef = useRef(null)
  const [chartDimensions, setChartDimensions] = useState({
    width: 0,
    height: 0 - 32,
  })

  useResizeObserver(
    chartRef,
    () => {
      if (chartRef.current) {
        requestAnimationFrame(() => {
          const { width, height } = chartRef.current.getBoundingClientRect()
          setChartDimensions({
            width: Math.max(width - 16, 50), // Clamping
            height: Math.max(height - 32, 50), // Clamping
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

      const upperYRange = YMax + YPadding

      return [
        transformedYValues,
        [
          +YMin === 0 ? YMin : YMin - YPadding,
          upperYRange <= 0 ? upperYRange + yRangeOffset : upperYRange,
        ], // Adding a tiny buffer for the max so we dont get a range of exact 0
      ]
    }

    const [transformedY, YRange] = transformY()

    const seriesLength =
      timestamps?.length * (serieScale ?? transformedY?.length)

    const XMax = timestamps?.slice(0, seriesLength)?.pop()?.timestamp
    const XCutOff = XMax - timePeriod
    const XMin = timestamps?.filter((ts) => ts?.timestamp >= XCutOff)?.[0]
      ?.timestamp

    const PRangeX = (XMax - XMin) / 2
    const XPadding = Math.abs(PRangeX * 0.01) ?? 0

    const upperXRange = XMax + XPadding

    const XRange = [
      +XMin === 0 ? XMin : XMin - XPadding,
      upperXRange <= 0 ? upperXRange + xRangeOffset : upperXRange,
    ] // Adding a tiny offset for the max so we dont get a range of exact 0

    return {
      YRender: renderableY,
      dataset: [timestamps?.map((t) => t.timestamp), ...transformedY],
      YRange,
      XRange,
    }
  }, [data, timePeriod])

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
      padding: [null, null, null, null], // Pad top / left / right
      legend: {
        show: true,
        live: false,
        isolate: false,
        markers: {
          width: 2,
          fill: (self, sIdx) => {
            const s = self.series[sIdx]

            return s.width
              ? s.stroke(self, sIdx)
              : s.points.width
              ? s.points.stroke(self, sIdx)
              : null
          },
        },
      },
      plugins: [
        wheelZoomPlugin({
          factor: zoomFactor,
          scaleY: false,
          scaleX: true,
          onScaled: setScaleIsZoomed,
        }),
        tooltipPlugin({
          seriesColors: lineColors,
          tooltipClass: classes.tooltip,
          dataset: dataset,
          interpolation: interpolationY,
        }),
      ],
      cursor: {
        bind: {
          mousedown: () => () => {}, // Clear original 'annotating' handler
          dblclick: () => () => {}, // Clear reset X axis
          click: () => () => {}, // Clear click handler
        },
        focus: {
          prox: 5,
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
          show: true,
          grid: { show: false },
          stroke: theme?.palette?.grey[500],
          ticks: { show: false },
          values: (_, ticks) =>
            minMaxTick(
              ticks,
              (label) => timeFromSeconds(label).toFormat(dateFormat),
              4
            ),
          gap: 12,
        },
        {
          grid: { show: true, dash: [8, 8] },
          stroke: theme?.palette?.grey[500],
          ticks: { show: true },
          values: (_, ticks) => minMaxTick(ticks, (yV) => interpolationY(yV)),
        },
      ],
      series: [
        {
          show: true,
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
              stroke:
                lineColors?.[index] || theme.palette.sunstoneColors.blue[400],
              points: {
                show: (_u, _seriesIdx, _, seriesLength) => seriesLength <= 1000,
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
            }))
          : [
              {
                label: name,
                stroke:
                  lineColors?.[0] || theme.palette.sunstoneColors.blue[400],
                value: (_, yV) => interpolationY(yV),
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
    timePeriod,
    chartDimensions,
    name,
    y,
    legendNames,
    lineColors,
    interpolationY,
  ])

  const chartKey = useMemo(
    () =>
      `${timePeriod}-${chartDimensions.width}x${
        chartDimensions.height
      }-${transformData?.YRange?.join('-')}`,
    [timePeriod, chartDimensions, transformData?.YRange]
  )

  return (
    <Paper variant="outlined" className={classes.graphContainer}>
      <List className={classes.box} sx={{ width: '100%', height: '100%' }}>
        <ListItem className={classes.title}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            width="100%"
          >
            <Typography
              sx={{
                fontFamily: 'Ubuntu',
                fontSize: 'clamp(0.75rem, 2vw, 1.313rem)',
                lineHeight: '1.313rem',
                fontStyle: 'normal',
                fontWeight: 400,
                flex: 1,
              }}
            >
              {name}
            </Typography>
            <Box
              display="flex"
              justifyContent="end"
              alignItems="baseline"
              gap={1}
              flex={1}
            >
              <Typography
                sx={{
                  fontFamily: 'Ubuntu',
                  fontSize: '1rem',
                  lineHeight: '1.313rem',
                  fontStyle: 'normal',
                  color: theme.palette.grey[500],
                  fontWeight: 'bold',
                  textAlign: 'right',
                }}
                noWrap
              >
                {T.Period + ':'}
              </Typography>
              <FormControl variant="standard">
                <Select
                  className={classes.selectRoot}
                  id="time-period-sort"
                  value={scaleIsZoomed ? '-' : timePeriod}
                  disableUnderline={true}
                  onChange={(e) => {
                    const value = e?.target?.value
                    const isValid =
                      Object.values(sortingOptions)?.includes(value)
                    if (isValid) {
                      setTimePeriod(value)
                      setScaleIsZoomed(false)
                      if (uplotRef.current) {
                        const { setScale } = uplotRef.current
                        const [min, max] = transformData.XRange
                        setScale('x', { min: min ?? null, max: max ?? null })
                      }
                    }
                  }}
                  renderValue={(selected) => {
                    if (scaleIsZoomed || selected === '-') return '-'
                    const label = Object.entries(sortingOptions).find(
                      ([_, val]) => val === selected
                    )?.[0]

                    return label || selected
                  }}
                >
                  {Object.entries(sortingOptions)?.map(
                    ([label, value], idx) => (
                      <MenuItem key={`${label}-${idx}`} value={value}>
                        {label}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </ListItem>
        <ListItem ref={chartRef} className={classes.placeholder}>
          {isFetching ? (
            <Stack direction="row" justifyContent="center" alignItems="center">
              <CircularProgress color="secondary" />
            </Stack>
          ) : transformData == null ||
            !transformData?.dataset?.length > 0 ||
            []
              .concat(transformData?.YRange)
              ?.some((v) => typeof v !== 'number' || Number.isNaN(v)) ? (
            <Stack direction="row" justifyContent="center" alignItems="center">
              <Typography>{Tr(T.NoDataAvailable)}</Typography>
            </Stack>
          ) : (
            <div
              key={chartKey}
              style={{
                width: '100%',
                height: '100%',
              }}
              className={`${classes.legend}`}
            >
              <UplotReact
                options={chartOptions}
                data={transformData.dataset ?? []}
                onCreate={(chart) => (uplotRef.current = chart)}
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
  yRangeOffset: PropTypes.number,
  xRangeOffset: PropTypes.number,
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
