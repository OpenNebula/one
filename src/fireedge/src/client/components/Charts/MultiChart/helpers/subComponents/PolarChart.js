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
import { Component } from 'react'
import PropTypes from 'prop-types'
import { Box, Paper, Typography } from '@mui/material'
import { isDevelopment } from 'client/utils'
import { Tr } from 'client/components/HOC'
/**
 * Formats the input data for use in a polar chart.
 *
 * @param {Array|object} input - The data to be formatted.
 * @returns {Array} The formatted dataset.
 */
export const FormatPolarDataset = (input) => {
  const logError = (message) => {
    if (isDevelopment) console.error(message)
  }

  if (!Array.isArray(input) || input.length === 0 || !input[0].data) {
    logError('FormatPolarDataset: Invalid input format.')

    return []
  }

  const dataset = input[0]

  if (!Array.isArray(dataset.data) || dataset.data.length === 0) {
    logError('FormatPolarDataset: No data available.')

    return []
  }

  const dataPoint = dataset.data[0]

  Object.keys(dataPoint).forEach((key) => {
    if (isNaN(parseFloat(dataPoint[key])) && dataPoint[key] !== null) {
      logError(
        `FormatPolarDataset: Non-numeric value encountered for key ${key}.`
      )

      return []
    }
  })

  const pairs = Object.keys(dataPoint)
    .filter(
      (key) =>
        key.endsWith('_USED') &&
        Object.keys(dataPoint).includes(key.replace('_USED', ''))
    )
    .map((usedKey) => ({ usedKey, totalKey: usedKey.replace('_USED', '') }))

  return pairs.map(({ usedKey, totalKey }) => {
    const uv = parseFloat(dataPoint[usedKey])
    const pv = parseFloat(dataPoint[totalKey])
    const pct = pv > 0 ? (uv / pv) * 100 : 0

    return {
      name: totalKey,
      uv: uv.toFixed(2),
      pv: pv.toFixed(2),
      pct: pct.toFixed(2),
    }
  })
}

FormatPolarDataset.propTypes = {
  input: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.object),
    PropTypes.object,
  ]).isRequired,
}

/**
 * Renders a tooltip for a polar chart.
 *
 * @param {object} props - The properties for the component.
 * @param {boolean} props.active - Indicates whether the tooltip is active.
 * @param {Array} props.payload - The data for the tooltip.
 * @returns {Component|null} The rendered tooltip component or null.
 */
export const PolarTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload

    return (
      <Box>
        <Paper
          elevation={3}
          sx={{
            padding: 1,
            maxWidth: 200,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            {Tr(
              data.name
                .split('_')
                .map(
                  (word) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                )
                .join(' ')
            )}
          </Typography>
          <Typography variant="body2">
            {data?.uv} / {data?.pv}
          </Typography>
          <Typography variant="body2">{data?.pct ?? 0}%</Typography>
        </Paper>
      </Box>
    )
  }

  return null
}

PolarTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.arrayOf(PropTypes.object),
}
