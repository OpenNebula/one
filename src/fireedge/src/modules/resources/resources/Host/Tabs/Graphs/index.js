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
import { Box, Grid, useTheme } from '@mui/material'
import { prettyBytes } from '@UtilsModule'
import PropTypes from 'prop-types'
import { Component, useMemo } from 'react'
import { Chartist } from '@ComponentsV2Module'
import { T } from '@ConstantsModule'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Host API data
 * @returns {Component} Host graph tab
 */
export const HostGraphTab = ({ data }) => {
  const { host: { driver } = {}, monitoring = [], isFetching = false } = data

  // Get styles
  const theme = useTheme()

  const cpuMemoryData = useMemo(
    () =>
      (Array.isArray(monitoring) ? monitoring : [monitoring]).map(
        ({ TIMESTAMP, CAPACITY }) => ({
          TIMESTAMP,
          ...CAPACITY,
        })
      ),
    [monitoring]
  )

  const forecastConfig = window?.__FORECAST_CONFIG__ ?? {}

  const driverConfig = forecastConfig[driver] || {} // Ensure it's always an object
  const { host = {} } = driverConfig

  const {
    forecast_period: forecastPeriod = 5, // Minutes
  } = host

  const cpuY = [
    ['FREE_CPU', 'FREE_CPU_FORECAST'],
    'FREE_CPU_FORECAST_FAR',
    ['USED_CPU', 'USED_CPU_FORECAST'],
    'USED_CPU_FORECAST_FAR',
  ]

  const memoryY = [
    ['FREE_MEMORY', 'FREE_MEMORY_FORECAST'],
    'FREE_MEMORY_FORECAST_FAR',
    ['USED_MEMORY', 'USED_MEMORY_FORECAST'],
    'USED_MEMORY_FORECAST_FAR',
  ]

  const cpuNames = Object.fromEntries(
    [
      T.FreeCPU,
      `${T.FreeCPU} ${T.Forecast}`,
      `${T.FreeCPU} ${T.ForecastFar}`,
      T.UsedCPU,
      `${T.UsedCPU} ${T.Forecast}`,
      `${T.UsedCPU} ${T.ForecastFar}`,
    ].map((name, idx) => [cpuY?.flat()[idx], name])
  )

  const memoryNames = Object.fromEntries(
    [
      T.FreeMemory,
      `${T.FreeMemory} ${T.Forecast}`,
      `${T.FreeMemory} ${T.ForecastFar}`,
      T.UsedMemory,
      `${T.UsedMemory} ${T.Forecast}`,
      `${T.UsedMemory} ${T.ForecastFar}`,
    ].map((name, idx) => [memoryY.flat()[idx], name])
  )

  return (
    <Box>
      <Grid container spacing={1} sx={{ overflow: 'hidden' }}>
        <Grid item md={6}>
          <Chartist
            name={'CPU'}
            data={cpuMemoryData}
            isFetching={isFetching}
            y={cpuY}
            x={[
              (point) => new Date(parseInt(point) * 1000).getTime(),
              (point) =>
                new Date(
                  parseInt(point) * 1000 + forecastPeriod * 60 * 1000
                ).getTime(),
            ]}
            serieScale={2}
            setTransform={(
              yValues,
              _xValues,
              timestamps,
              labelPair,
              _labelPairIndex
            ) => {
              const buildSeries = () => {
                const targetXId = ['FREE_CPU', 'USED_CPU']?.includes(labelPair)
                  ? 0
                  : 1
                const result = Array(timestamps.length).fill(null)
                let yIdx = 0

                for (let i = 0; i < timestamps.length; i++) {
                  if (timestamps[i]?.xIds?.includes(targetXId)) {
                    result[i] = yValues[yIdx]?.[labelPair] ?? null
                    yIdx++
                  }
                }

                return result
              }

              return buildSeries()
            }}
            lineColors={[
              theme?.palette?.graphs.host.cpu.free.real,
              theme?.palette?.graphs.host.cpu.free.forecast,
              theme?.palette?.graphs.host.cpu.free.forecastFar,
              theme?.palette?.graphs.host.cpu.used.real,
              theme?.palette?.graphs.host.cpu.used.forecast,
              theme?.palette?.graphs.host.cpu.used.forecastFar,
            ]}
            zoomFactor={0.95}
            trendLineOnly={['USED_CPU_FORECAST_FAR', 'FREE_CPU_FORECAST_FAR']}
            interpolationY={(val) => {
              try {
                if (val === undefined || val === null) return '--'

                const num = Number(val)

                if (!Number.isFinite(num)) return '--'

                const result = num.toFixed(2)

                return result
              } catch {
                return '--'
              }
            }}
            legendNames={cpuNames}
          />
        </Grid>
        <Grid item md={6}>
          <Chartist
            name={T.Memory}
            data={cpuMemoryData}
            isFetching={isFetching}
            filter={[
              'FREE_MEMORY',
              'FREE_MEMORY_FORECAST',
              'FREE_MEMORY_FORECAST_FAR',
              'USED_MEMORY',
              'USED_MEMORY_FORECAST',
              'USED_MEMORY_FORECAST_FAR',
            ]}
            y={memoryY}
            serieScale={2}
            setTransform={(
              yValues,
              _xValues,
              timestamps,
              labelPair,
              _labelPairIndex
            ) => {
              const buildSeries = () => {
                const targetXId = ['FREE_MEMORY', 'USED_MEMORY']?.includes(
                  labelPair
                )
                  ? 0
                  : 1
                const result = Array(timestamps.length).fill(null)
                let yIdx = 0

                for (let i = 0; i < timestamps.length; i++) {
                  if (timestamps[i]?.xIds?.includes(targetXId)) {
                    result[i] = yValues[yIdx]?.[labelPair] ?? null
                    yIdx++
                  }
                }

                return result
              }

              return buildSeries()
            }}
            x={[
              (point) => new Date(point * 1000).getTime(),
              (point) =>
                new Date(point * 1000 + forecastPeriod * 60 * 1000).getTime(),
            ]}
            lineColors={[
              theme?.palette?.graphs.host.memory.free.real,
              theme?.palette?.graphs.host.memory.free.forecast,
              theme?.palette?.graphs.host.memory.free.forecastFar,
              theme?.palette?.graphs.host.memory.used.real,
              theme?.palette?.graphs.host.memory.used.forecast,
              theme?.palette?.graphs.host.memory.used.forecastFar,
            ]}
            zoomFactor={0.95}
            trendLineOnly={[
              'USED_MEMORY_FORECAST_FAR',
              'FREE_MEMORY_FORECAST_FAR',
            ]}
            interpolationY={(val) => (val ? prettyBytes(val, 'KB', 2) : val)}
            legendNames={memoryNames}
          />
        </Grid>
      </Grid>
    </Box>
  )
}

HostGraphTab.propTypes = {
  data: PropTypes.object,
  tabProps: PropTypes.object,
  id: PropTypes.string,
  monitoring: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  isFetching: PropTypes.bool,
}

HostGraphTab.displayName = 'HostGraphTab'
HostGraphTab.id = 'graphs'
HostGraphTab.title = T.Graphs
