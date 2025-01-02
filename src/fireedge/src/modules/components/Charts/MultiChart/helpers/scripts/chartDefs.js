/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { CartesianGrid, PolarAngleAxis, Cell } from 'recharts'
import { Component, Fragment } from 'react'

/**
 * Truncate long labels with ellipsis.
 *
 * @param {string} label - The label to be truncated.
 * @param {number} maxLength - The maximum length of the label.
 * @returns {string} The truncated label.
 */
const truncateLabel = (label, maxLength) => {
  if (label.length > maxLength) {
    return `${label.substring(0, maxLength)}...`
  }

  return label
}

/**
 * Custom tick component for the XAxis that displays the full label on hover.
 *
 * @param {object} props - Props.
 * @param {number} props.x - The x position of the tick.
 * @param {number} props.y - The y position of the tick.
 * @param {object} props.payload - The payload of the tick.
 * @returns {Component} The rendered tick.
 */
export const CustomXAxisTick = ({ x, y, payload }) => {
  const fullLabel = payload?.value
  const truncatedLabel = truncateLabel(fullLabel, 10)

  return (
    <g transform={`translate(${x},${y})`}>
      <title>{fullLabel}</title>
      <text x={0} y={0} dy={16}>
        {truncatedLabel}
      </text>
    </g>
  )
}

/**
 * Generates a color based on the metric, datasetId, and theme type.
 *
 * @function
 * @param {string} metric - The metric for which the color is generated.
 * @param {object} metricHues - Object containing hue values for different metrics.
 * @param {number} datasetId - The ID of the dataset.
 * @returns {string} The generated color in HSL format.
 */
export const generateColorByMetric = (metric, metricHues, datasetId) => {
  const baseHue = metricHues[metric] || 0

  // Using datasetId as seed to generate a unique hue offset
  const hueOffset = (datasetId * 1327) % 360 // 1327 is just a random prime number

  const baseSaturation = 90
  const baseLightness = 60

  const hue = (baseHue + hueOffset) % 360
  const saturation = `${baseSaturation}%`
  const lightness = `${baseLightness}%`

  return `hsl(${hue}, ${saturation}, ${lightness})`
}

/**
 * Returns a React component containing SVG definitions and a CartesianGrid for a chart.
 *
 * @function
 * @param {Array<string>} metrics - List of metrics.
 * @param {number} datasetId - The ID of the dataset.
 * @param {object} metricHues - Object containing hue values for different metrics.
 * @param {string} coordinateType - Coordinate system type.
 * @param {string} groupBy - Used in non-cartesian configurations to specify dataKey.
 * @returns {Component} A React component with SVG definitions and a CartesianGrid.
 */
export const GetChartDefs = (
  metrics,
  datasetId,
  metricHues,
  coordinateType = 'CARTESIAN',
  groupBy = 'pct'
) => (
  <Fragment key={`defs-${datasetId}`}>
    <defs>
      {metrics.map((metric) => {
        const color = generateColorByMetric(metric, metricHues, datasetId)

        return (
          <linearGradient
            key={metric}
            id={`color${metric}-${datasetId}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="5%" stopColor={color} stopOpacity={0.9} />
            <stop offset="95%" stopColor={color} stopOpacity={0.2} />
          </linearGradient>
        )
      })}
    </defs>
    {coordinateType === 'CARTESIAN' ? (
      <CartesianGrid
        stroke={'#ccc'}
        strokeDasharray="4 4"
        strokeOpacity={0.1}
      />
    ) : (
      <PolarAngleAxis
        type="number"
        domain={[0, 100]}
        dataKey={groupBy}
        angleAxisId={0}
        tick={false}
      />
    )}
  </Fragment>
)

GetChartDefs.propTypes = {
  metrics: PropTypes.arrayOf(PropTypes.string).isRequired,
  metricHues: PropTypes.objectOf(PropTypes.number).isRequired,
  datasetId: PropTypes.number.isRequired,
}

/**
 * Generates the configuration for a chart based on the provided parameters.
 *
 * @param {string} coordinateType - The coordinate system of the chart ('CARTESIAN' or 'POLAR').
 * @param {string} chartType - The type of chart to render.
 * @param {Array} datasets - The datasets to be used for the chart.
 * @param {Array} paginatedData - The paginated data for the chart.
 * @returns {object} The configuration for the chart.
 */
export const GetChartConfig = (
  coordinateType,
  chartType,
  datasets,
  paginatedData
) => {
  const commonConfig = {
    data: paginatedData,
    style: !datasets.length ? { pointerEvents: 'none' } : {},
  }

  switch (coordinateType) {
    case 'CARTESIAN':
      return {
        ...commonConfig,
        barCategoryGap: 20,
        padding: { top: 0, right: 60, bottom: 0, left: 60 },
        stackOffset: chartType === 'stackedBar' ? 'sign' : 'none',
      }
    case 'POLAR':
      return {
        ...commonConfig,
        innerRadius: '25%',
        outerRadius: '90%',
        data: datasets,
        startAngle: 90,
        endAngle: -270,
      }
    default:
      throw new Error(`Unsupported coordinateType: ${coordinateType}`)
  }
}

GetChartConfig.propTypes = {
  coordinateType: PropTypes.string.isRequired,
  chartType: PropTypes.string.isRequired,
  datasets: PropTypes.arrayOf(PropTypes.object).isRequired,
  paginatedData: PropTypes.arrayOf(PropTypes.object).isRequired,
}

/**
 * Generates the configuration for a chart element based on the provided parameters.
 *
 * @param {string} chartType - The type of chart to render.
 * @param {object} metric - The metric details.
 * @param {object} dataset - The dataset details.
 * @param {string} coordinateType - The coordinate system of the chart ('CARTESIAN' or 'POLAR').
 * @param {object} theme - The theme object from MUI.
 * @param {string} dsId - The dataset ID.
 * @returns {object} The configuration for the chart element.
 */
export const GetChartElementConfig = (
  chartType,
  metric,
  dataset,
  coordinateType,
  theme,
  dsId
) => {
  const keyBase = `${metric.key}-${dataset.id}`
  const commonConfig = {
    key: keyBase,
    type: 'monotone',
    dataKey: keyBase,
    fill: `url(#color${keyBase})`,
    name: metric.name,
    animationDuration: 500,
    stackId: chartType === 'stackedBar' ? 'a' : undefined,
  }

  switch (coordinateType) {
    case 'POLAR':
      return {
        ...commonConfig,
        background: {
          filter: 'brightness(90%)',
          fill: theme?.palette?.background?.default,
        },
        dataKey: 'pct',
        angleAxisId: 0,
        cornerRadius: 10,
        children: dataset.map((entry, index) => (
          <Cell
            key={`cell-${index}`}
            fill={
              entry?.pv && +entry?.pv > 0
                ? `url(#color${entry.name}-${dsId})`
                : theme?.palette?.text?.disabled
            }
            fillOpacity={entry?.pv && +entry?.pv > 0 ? 1 : 0.5}
          />
        )),
      }
    case 'CARTESIAN':
      switch (chartType) {
        case 'area':
          return {
            ...commonConfig,
            fillOpacity: 0.5,
            stroke: 'transparent',
          }
        case 'line':
          return {
            ...commonConfig,
            strokeWidth: 3,
            activeDot: {
              r: 8,
              fill: `url(#color${keyBase})`,
              stroke: 'white',
              strokeWidth: 2,
            },
            stroke: `url(#color${keyBase})`,
          }
        default:
          return commonConfig
      }
    default:
      throw new Error(`Unsupported coordinateType: ${coordinateType}`)
  }
}

CustomXAxisTick.propTypes = {
  x: PropTypes.number,
  y: PropTypes.number,
  payload: PropTypes.object,
}

GetChartElementConfig.propTypes = {
  chartType: PropTypes.string.isRequired,
  metric: PropTypes.object.isRequired,
  dataset: PropTypes.object.isRequired,
  coordinateType: PropTypes.string.isRequired,
  theme: PropTypes.object.isRequired,
  dsId: PropTypes.string.isRequired,
}
