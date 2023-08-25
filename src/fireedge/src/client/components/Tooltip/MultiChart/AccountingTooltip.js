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
import React, { useMemo } from 'react'
import { Paper, Typography, Box } from '@mui/material'

export const CustomTooltip = React.memo(
  ({ active, payload, labels, generateColor, formatMetric, metricHues }) => {
    if (active && payload && payload.length) {
      const groupedMetrics = useMemo(
        () =>
          payload.reduce((acc, entry) => {
            const [metric, datasetId] = entry.name.split('-')
            if (!acc[datasetId]) {
              acc[datasetId] = []
            }
            acc[datasetId].push({ metric, value: entry.value })

            return acc
          }, {}),
        [payload]
      )

      const keys = Object.keys(groupedMetrics)
      const itemWidth = keys.length === 1 ? '100%' : '50%'

      return (
        <Paper
          elevation={3}
          style={{
            padding: '2px',
            display: 'flex',
            flexWrap: 'wrap',
            maxWidth: '370px',
          }}
        >
          {keys.map((datasetId, index) => (
            <Box
              key={`dataset-${datasetId}`}
              style={{
                padding: '0 1px',
                width: itemWidth,
                boxSizing: 'border-box',
                maxWidth: '175px',
                flex: 'none',
              }}
            >
              <Typography
                variant="body2"
                style={{ fontWeight: 'bold', margin: '0 0 2px 0' }}
              >
                {labels[index]}
              </Typography>
              {/* eslint-disable-next-line no-shadow */}
              {groupedMetrics[datasetId].map((entry, index) => {
                const metricColor = generateColor(
                  entry.metric,
                  metricHues,
                  parseInt(datasetId, 10)
                )

                const formattedValue =
                  typeof entry.value === 'number'
                    ? entry.value.toFixed(2)
                    : String(entry.value).slice(0, 12)

                return (
                  <Typography
                    key={`metric-${index}`}
                    variant="body2"
                    style={{ margin: '0.5px 0' }}
                  >
                    <span style={{ color: metricColor }}>
                      {formatMetric(entry.metric)}:
                    </span>
                    {formattedValue}
                  </Typography>
                )
              })}
            </Box>
          ))}
        </Paper>
      )
    }

    return null
  }
)

CustomTooltip.displayName = 'CustomTooltip'

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.arrayOf(PropTypes.object),
  labels: PropTypes.arrayOf(PropTypes.string),
  generateColor: PropTypes.func,
  formatMetric: PropTypes.func,
  metricHues: PropTypes.objectOf(PropTypes.number).isRequired,
}

CustomTooltip.defaultProps = {
  active: false,
  payload: [],
  labels: [],
  generateColor: (metric, hues, id) => hues[metric] || '#000',
  formatMetric: (input) => `${input}`,
}
