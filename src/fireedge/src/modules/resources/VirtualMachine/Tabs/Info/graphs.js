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
import { ReactElement } from 'react'
import { T } from '@ConstantsModule'
import { VmAPI } from '@FeaturesModule'
import { Chartist } from '@ComponentsModule'
import { prettyBytes } from '@UtilsModule'
import { useTranslation } from '@ProvidersModule'
import { getHypervisor } from '@ModelsModule'

/**
 * Render VM CPU and memory graphs.
 *
 * @param {object} props - Props
 * @param {string} props.id - Virtual machine id
 * @returns {ReactElement} CPU and memory graphs
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

  const cpuY = [['CPU', 'CPU_FORECAST'], 'CPU_FORECAST_FAR']
  const memoryY = [['MEMORY', 'MEMORY_FORECAST'], 'MEMORY_FORECAST_FAR']

  const cpuNames = Object.fromEntries(
    [T.CPU, `${T.CPU} ${T.Forecast}`, `${T.CPU} ${T.ForecastFar}`].map(
      (name, idx) => [cpuY.flat()[idx], name]
    )
  )

  const memoryNames = Object.fromEntries(
    [T.Memory, `${T.Memory} ${T.Forecast}`, `${T.Memory} ${T.ForecastFar}`].map(
      (name, idx) => [memoryY.flat()[idx], name]
    )
  )

  const x = [
    (point) => new Date(parseInt(point) * 1000).getTime(),
    (point) =>
      new Date(parseInt(point) * 1000 + forecastPeriod * 60 * 1000).getTime(),
  ]

  const setTransform =
    (target) => (yValues, _xValues, timestamps, labelPair) => {
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

  return (
    <Grid container spacing={1} sx={{ overflow: 'hidden' }}>
      <Grid item md={6}>
        <Chartist
          name={translate(T.RealCpu)}
          data={monitoring}
          isFetching={isFetching}
          y={cpuY}
          setTransform={setTransform('CPU')}
          x={x}
          serieScale={2}
          lineColors={[
            theme?.palette?.graphs.vm.cpu.real,
            theme?.palette?.graphs.vm.cpu.forecast,
            theme?.palette?.graphs.vm.cpu.forecastFar,
          ]}
          legendNames={cpuNames}
          interpolationY={(value) => {
            const number = Number(value)

            return value == null || !Number.isFinite(number)
              ? '--'
              : number.toFixed(2)
          }}
          zoomFactor={0.95}
          trendLineOnly={['CPU_FORECAST_FAR']}
          shouldFill={cpuY.flat()}
        />
      </Grid>
      <Grid item md={6}>
        <Chartist
          name={translate(T.RealMemory)}
          filter={memoryY.flat()}
          data={monitoring}
          isFetching={isFetching}
          y={memoryY}
          setTransform={setTransform('MEMORY')}
          x={x}
          serieScale={2}
          interpolationY={(value) =>
            value ? prettyBytes(value, 'KB', 2) : value
          }
          lineColors={[
            theme?.palette?.graphs.vm.memory.real,
            theme?.palette?.graphs.vm.memory.forecast,
            theme?.palette?.graphs.vm.memory.forecastFar,
          ]}
          legendNames={memoryNames}
          trendLineOnly={['MEMORY_FORECAST_FAR']}
          zoomFactor={0.95}
          shouldFill={memoryY.flat()}
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
