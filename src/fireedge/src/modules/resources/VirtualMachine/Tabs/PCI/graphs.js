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

import { Grid, useTheme } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement, useMemo } from 'react'
import { T } from '@ConstantsModule'
import { VmAPI } from '@FeaturesModule'
import { Chartist } from '@ComponentsModule'
import { useTranslation } from '@ProvidersModule'
import { getHypervisor } from '@ModelsModule'

const GPU_METRICS = [
  { key: 'GPU_UTILIZATION', label: T.GpuUtilization, palette: 'cpu' },
  {
    key: 'GPU_MEMORY_UTILIZATION',
    label: T.GpuMemoryBandwidthUtilization,
    palette: 'memory',
  },
  { key: 'GPU_POWER_USAGE', label: T.PowerDraw, palette: 'cpu', unit: 'W' },
]

const metricKeys = ({ key }) => [key, `${key}_FORECAST`, `${key}_FORECAST_FAR`]

const numericValue = (value) => {
  if (
    !['number', 'string'].includes(typeof value) ||
    (typeof value === 'string' && value.trim() === '')
  ) {
    return null
  }

  const number = Number(value)

  return Number.isFinite(number) && number >= 0 ? number : null
}

/**
 * Render VM PCI/GPU graphs for the metrics supplied by monitoring.
 *
 * @param {object} props - Props
 * @param {string} props.id - Virtual machine id
 * @returns {ReactElement} VM GPU graphs.
 */
const Graphs = ({ id }) => {
  const { translate } = useTranslation()
  const theme = useTheme()
  const { data: monitoring = [], isFetching } = VmAPI.useGetMonitoringQuery(
    id,
    { skip: !id }
  )
  const { data: vm = {} } = VmAPI.useGetVmQuery({ id }, { skip: !id })
  const VM_MAD = getHypervisor(vm)
  const forecastConfig = window?.__FORECAST_CONFIG__?.[VM_MAD] ?? {}
  const { virtualmachine = {} } = forecastConfig
  const {
    forecast: { period: forecastPeriod = 5 } = {}, // Minutes
  } = virtualmachine || {}

  const samples = useMemo(
    () =>
      monitoring
        .filter((point) => point?.TIMESTAMP != null)
        .map((point) => ({
          TIMESTAMP: point.TIMESTAMP,
          ...Object.fromEntries(
            GPU_METRICS.flatMap(metricKeys).map((key) => [
              key,
              numericValue(point[key]),
            ])
          ),
        })),
    [monitoring]
  )

  const availableMetrics = GPU_METRICS.filter(({ key }) =>
    samples.some((point) => point[key] !== null)
  )

  const x = [
    (point) => Number(point) * 1000,
    (point) => Number(point) * 1000 + forecastPeriod * 60 * 1000,
  ]

  const setTransform = (target) => (yValues, _xValues, timestamps, label) => {
    const targetXId = label === target ? 0 : 1
    let index = 0

    return timestamps.map(({ xIds }) =>
      xIds.includes(targetXId) ? yValues[index++]?.[label] ?? null : null
    )
  }

  return (
    <Grid container spacing={1} sx={{ overflow: 'hidden' }}>
      {!isFetching && !availableMetrics.length && (
        <Grid item xs={12}>
          {translate(T.NoDataAvailable)}
        </Grid>
      )}
      {(isFetching && !availableMetrics.length
        ? GPU_METRICS.slice(0, 2)
        : availableMetrics
      ).map((metric) => {
        const { key, label, palette, unit = '%' } = metric
        const [actual, forecast, far] = metricKeys(metric)
        const y = [[actual, forecast], far]
        const colors = theme?.palette?.graphs.vm[palette]

        return (
          <Grid item xs={12} md={6} key={key}>
            <Chartist
              name={`${translate(T.Gpu)} ${translate(label)}`}
              data={samples}
              isFetching={isFetching}
              y={y}
              yRangeOffset={unit === '%' ? 100 : undefined}
              setTransform={setTransform(key)}
              x={x}
              serieScale={2}
              interpolationY={(value) => {
                const number = numericValue(value)

                return number === null
                  ? '--'
                  : `${unit === 'W' ? Math.round(number) : number}${unit}`
              }}
              lineColors={[colors?.real, colors?.forecast, colors?.forecastFar]}
              legendNames={{
                [actual]: label,
                [forecast]: `${label} ${T.Forecast}`,
                [far]: `${label} ${T.ForecastFar}`,
              }}
              zoomFactor={0.95}
              trendLineOnly={[far]}
              shouldFill={y.flat()}
            />
          </Grid>
        )
      })}
    </Grid>
  )
}

Graphs.propTypes = {
  id: PropTypes.string,
}

Graphs.displayName = 'Graphs'

export default Graphs
