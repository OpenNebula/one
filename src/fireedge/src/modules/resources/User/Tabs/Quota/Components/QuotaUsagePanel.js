/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { Box, CircularProgress, Typography } from '@mui/material'

import { Badge, ProgressBar, Tooltip } from '@ComponentsModule'
import { T } from '@ConstantsModule'
import { useTranslation } from '@ProvidersModule'
import { prettyBytes } from '@UtilsModule'
import { getStyles } from '@modules/resources/User/Tabs/Quota/Components/styles'

const SIZE_METRICS = new Set([
  'MEMORY',
  'RUNNING_MEMORY',
  'SYSTEM_DISK_SIZE',
  'SIZE',
])

const toNumber = (value) => {
  const parsedValue = Number(value)

  return Number.isFinite(parsedValue) ? parsedValue : 0
}

const formatValue = (metric, value) => {
  const numericValue = toNumber(value)

  if (SIZE_METRICS.has(metric)) {
    return numericValue === 0 ? '0 MB' : prettyBytes(numericValue, 'MB', 2)
  }

  return numericValue.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })
}

const getMetricKeys = ({ metrics = [] } = {}) => {
  const keys = metrics.map(({ key }) => key)

  return keys.filter(
    (key) => !key.endsWith('_USED') && keys.includes(`${key}_USED`)
  )
}

/**
 * Displays quota usage as compact rows with exact values and progress bars.
 *
 * @param {object} props - Component properties.
 * @param {object} props.dataset - Processed quota dataset.
 * @param {object} props.metricNames - Human-readable metric names.
 * @param {object} props.metricColors - Color assigned to each quota metric.
 * @param {boolean} props.isLoading - Whether quota data is loading.
 * @param {string} props.error - Data loading error.
 * @param {Function} props.onElementClick - Callback when a quota row is clicked.
 * @returns {object} Quota usage panel.
 */
export const QuotaUsagePanel = ({
  dataset,
  metricNames,
  metricColors,
  isLoading,
  error,
  onElementClick,
}) => {
  const { translate } = useTranslation()
  const metricKeys = getMetricKeys(dataset)
  const records = dataset?.data ?? []
  const hasNoData =
    error || dataset?.isEmpty || records.length === 0 || metricKeys.length === 0

  if (isLoading) {
    return (
      <Box sx={(theme) => getStyles({ theme })}>
        <Box className="quota-usage-state">
          <CircularProgress size={32} />
        </Box>
      </Box>
    )
  }

  if (hasNoData) {
    return (
      <Box sx={(theme) => getStyles({ theme })}>
        <Box className="quota-usage-state">
          <Typography className="quota-usage-state-message">
            {translate(error || T.NoDataAvailable)}
          </Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      {records.map((record, recordIndex) => (
        <Box
          key={`${record.ID ?? 'quota'}-${recordIndex}`}
          className="quota-usage-scope"
        >
          <Typography component="h3" className="quota-usage-scope-title">
            {record.ID}
          </Typography>

          <Box className="quota-usage-metrics">
            {metricKeys.map((metric) => {
              const used = toNumber(record[`${metric}_USED`])
              const limit = toNumber(record[metric])
              const percentage = limit > 0 ? (used * 100) / limit : 0
              const clampedPercentage = Math.min(100, Math.max(0, percentage))
              const metricName = metricNames[metric] ?? metric
              const usedLabel = formatValue(metric, used)
              const limitLabel = formatValue(metric, limit)
              const percentageLabel =
                limit > 0 ? `${Math.round(percentage)}%` : '—'
              const tooltip = `${metricName}: ${usedLabel} / ${limitLabel} (${percentageLabel})`
              const color = metricColors[metric]

              return (
                <Tooltip key={metric} title={tooltip} placement="top">
                  <Box
                    component="button"
                    type="button"
                    onClick={() => onElementClick(record)}
                    className="quota-usage-row"
                    sx={{ '--quota-color': color }}
                  >
                    <Box className="quota-usage-name">
                      <Badge className="quota-usage-badge" type="square" />
                      <Typography noWrap className="quota-usage-name-label">
                        {metricName}
                      </Typography>
                    </Box>

                    <Box className="quota-usage-container">
                      <ProgressBar
                        size="medium"
                        value={clampedPercentage}
                        aria-label={metricName}
                        className="quota-usage-progress"
                      />

                      <Box className="quota-usage-value">
                        <Typography className="quota-usage-value-label">
                          {usedLabel} / {limitLabel}
                        </Typography>
                        <Typography
                          className="quota-usage-percentage"
                          variant="caption"
                        >
                          {percentageLabel}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Tooltip>
              )
            })}
          </Box>
        </Box>
      ))}
    </Box>
  )
}

QuotaUsagePanel.propTypes = {
  dataset: PropTypes.object,
  metricNames: PropTypes.objectOf(PropTypes.string),
  metricColors: PropTypes.objectOf(PropTypes.string),
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  onElementClick: PropTypes.func,
}

QuotaUsagePanel.defaultProps = {
  dataset: {},
  metricNames: {},
  metricColors: {},
  isLoading: false,
  error: '',
  onElementClick: () => {},
}
