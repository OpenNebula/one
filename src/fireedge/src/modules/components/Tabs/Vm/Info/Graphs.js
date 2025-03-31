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
import { ReactElement } from 'react'

import Chartist from '@modules/components/Charts/Chartist'
import { Tr } from '@modules/components/HOC'
import { T } from '@ConstantsModule'
import { VmAPI } from '@FeaturesModule'
import { prettyBytes } from '@UtilsModule'
import { useTheme } from '@mui/material'

/**
 * Render Graphs Capacity.
 *
 * @param {object} props - Props
 * @param {string} props.id - Virtual machine id
 * @returns {ReactElement} Capacity Graphs.
 */
const Graphs = ({ id }) => {
  // Get styles
  const theme = useTheme()

  const { data: monitoring = [] } = VmAPI.useGetMonitoringQuery(id)

  const forecastConfig = window?.__FORECAST_CONFIG__ ?? {}
  const { virtualmachine = {} } = forecastConfig
  const {
    forecast_period: forecastPeriod = 5, // Minutes
    forecast_far_period: forecastFarPeriod = 48, // Hours
  } = virtualmachine

  return (
    <>
      <Chartist
        name={Tr(T.RealCpu)}
        filter={['CPU', 'CPU_FORECAST', 'CPU_FORECAST_FAR']}
        data={monitoring}
        y={['CPU', 'CPU_FORECAST', 'CPU_FORECAST_FAR']}
        x={[
          (point) => new Date(parseInt(point.TIMESTAMP) * 1000).getTime(),
          (point) =>
            new Date(
              parseInt(point.TIMESTAMP) * 1000 + forecastPeriod * 60 * 1000
            ).getTime(),
          (point) =>
            new Date(
              parseInt(point.TIMESTAMP) * 1000 +
                forecastFarPeriod * 60 * 60 * 1000
            ).getTime(),
        ]}
        lineColors={[
          theme?.palette?.graphs.vm.cpu.real,
          theme?.palette?.graphs.vm.cpu.forecast,
          theme?.palette?.graphs.vm.cpu.forecastFar,
        ]}
        legendNames={[
          T.CPU,
          `${T.CPU} ${T.Forecast}`,
          `${T.CPU} ${T.ForecastFar}`,
        ]}
        clusterFactor={10}
        clusterThreshold={1000}
        interpolationY={(val) => (val ? +val?.toFixed(2) : +val)}
        zoomFactor={0.95}
        shouldPadY={['CPU_FORECAST']}
        trendLineOnly={['CPU_FORECAST_FAR']}
        shouldFill
        clampForecast
        sortX
      />

      <Chartist
        name={Tr(T.RealMemory)}
        filter={['MEMORY', 'MEMORY_FORECAST', 'MEMORY_FORECAST_FAR']}
        data={monitoring}
        y={['MEMORY', 'MEMORY_FORECAST', 'MEMORY_FORECAST_FAR']}
        x={[
          (point) => new Date(parseInt(point.TIMESTAMP) * 1000).getTime(),
          (point) =>
            new Date(
              parseInt(point.TIMESTAMP) * 1000 + forecastPeriod * 60 * 1000
            ).getTime(),
          (point) =>
            new Date(
              parseInt(point.TIMESTAMP) * 1000 +
                forecastFarPeriod * 60 * 60 * 1000
            ).getTime(),
        ]}
        interpolationY={(value) =>
          value ? prettyBytes(value, 'KB', 2) : value
        }
        lineColors={[
          theme?.palette?.graphs.vm.memory.real,
          theme?.palette?.graphs.vm.memory.forecast,
          theme?.palette?.graphs.vm.memory.forecastFar,
        ]}
        legendNames={[
          T.Memory,
          `${T.Memory} ${T.Forecast}`,
          `${T.Memory} ${T.ForecastFar}`,
        ]}
        shouldPadY={['MEMORY_FORECAST']}
        trendLineOnly={['MEMORY_FORECAST_FAR']}
        clusterFactor={10}
        clusterThreshold={100}
        zoomFactor={0.95}
        shouldFill
        clampForecast
        applyYPadding
        sortX
      />
    </>
  )
}

Graphs.propTypes = {
  id: PropTypes.string,
}

Graphs.displayName = 'Graphs'

export default Graphs
