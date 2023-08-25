/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { CartesianGrid } from 'recharts'
import { Component, Fragment } from 'react'

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
 * @returns {Component} A React component with SVG definitions and a CartesianGrid.
 */
export const GetChartDefs = (metrics, datasetId, metricHues) => (
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
    <CartesianGrid stroke={'#ccc'} strokeDasharray="4 4" strokeOpacity={0.1} />
  </Fragment>
)

GetChartDefs.propTypes = {
  metrics: PropTypes.arrayOf(PropTypes.string).isRequired,
  metricHues: PropTypes.objectOf(PropTypes.number).isRequired,
  datasetId: PropTypes.number.isRequired,
}
