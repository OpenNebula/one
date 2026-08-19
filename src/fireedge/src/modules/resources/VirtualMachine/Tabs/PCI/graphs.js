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

/**
 * Render VM PCI/GPU Graphs.
 *
 * @param {object} props - Props
 * @param {string} props.id - Virtual machine id
 * @returns {ReactElement} VM GPU Graphs.
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

  const yAccessorPower = useMemo(
    () => [
      ['GPU_POWER_USAGE', 'GPU_POWER_USAGE_FORECAST'],
      'GPU_POWER_USAGE_FORECAST_FAR',
    ],
    []
  )

  const yAccessorMemory = useMemo(
    () => [
      ['GPU_MEMORY_UTILIZATION', 'GPU_MEMORY_UTILIZATION_FORECAST'],
      'GPU_MEMORY_UTILIZATION_FORECAST_FAR',
    ],
    []
  )

  const legendNamesPower = Object.fromEntries(
    [
      T.PowerDraw,
      `${T.PowerDraw} ${T.Forecast}`,
      `${T.PowerDraw} ${T.ForecastFar}`,
    ].map((name, idx) => [yAccessorPower?.flat()[idx], name])
  )

  const legendNamesMemory = Object.fromEntries(
    [
      T.UsedMemory,
      `${T.UsedMemory} ${T.Forecast}`,
      `${T.UsedMemory} ${T.ForecastFar}`,
    ].map((name, idx) => [yAccessorMemory?.flat()[idx], name])
  )

  const x = [
    (point) => new Date(parseInt(point) * 1000).getTime(),
    (point) =>
      new Date(parseInt(point) * 1000 + forecastPeriod * 60 * 1000).getTime(),
  ]

  const setTransform =
    (target) => (yValues, _xValues, timestamps, labelPair) => {
      const buildSeries = () => {
        const targetXId = labelPair === target ? 0 : 1
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
    }

  const interpolationY = (formatter) => (val) => {
    try {
      if (val === undefined || val === null) return '--'
      const num = Number(val)
      if (!Number.isFinite(num)) return '--'

      return formatter(num)
    } catch {
      return '--'
    }
  }

  const lineColorsPower = useMemo(
    () => [
      theme?.palette?.graphs.vm.cpu.real,
      theme?.palette?.graphs.vm.cpu.forecast,
      theme?.palette?.graphs.vm.cpu.forecastFar,
    ],
    [theme]
  )

  const lineColorsMemory = useMemo(
    () => [
      theme?.palette?.graphs.vm.memory.real,
      theme?.palette?.graphs.vm.memory.forecast,
      theme?.palette?.graphs.vm.memory.forecastFar,
    ],
    [theme]
  )

  return (
    <Grid container spacing={1} sx={{ overflow: 'hidden' }}>
      <Grid item md={6}>
        <Chartist
          name={`${translate(T.Gpu)} ${translate(T.Wattage)}`}
          data={monitoring}
          isFetching={isFetching}
          y={yAccessorPower}
          setTransform={setTransform('GPU_POWER_USAGE')}
          x={x}
          serieScale={2}
          interpolationY={interpolationY((num) => `${Math.round(num)}W`)}
          lineColors={lineColorsPower}
          legendNames={legendNamesPower}
          zoomFactor={0.95}
          trendLineOnly={['GPU_POWER_USAGE_FORECAST_FAR']}
          shouldFill={yAccessorPower.flat()}
        />
      </Grid>
      <Grid item md={6}>
        <Chartist
          name={`${translate(T.Gpu)} ${translate(T.Memory)}`}
          data={monitoring}
          isFetching={isFetching}
          y={yAccessorMemory}
          yRangeOffset={100}
          setTransform={setTransform('GPU_MEMORY_UTILIZATION')}
          x={x}
          serieScale={2}
          lineColors={lineColorsMemory}
          legendNames={legendNamesMemory}
          interpolationY={interpolationY((num) => `${num}%`)}
          zoomFactor={0.95}
          trendLineOnly={['GPU_MEMORY_UTILIZATION_FORECAST_FAR']}
          shouldFill={yAccessorMemory.flat()}
        />
      </Grid>
    </Grid>
  )
}

Graphs.propTypes = {
  id: PropTypes.string,
}

Graphs.displayName = 'Graphs'

export default Graphs
