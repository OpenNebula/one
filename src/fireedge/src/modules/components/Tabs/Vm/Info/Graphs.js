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

/**
 * Render Graphs Capacity.
 *
 * @param {object} props - Props
 * @param {string} props.id - Virtual machine id
 * @returns {ReactElement} Capacity Graphs.
 */
const Graphs = ({ id }) => {
  const { data: monitoring = [] } = VmAPI.useGetMonitoringQuery(id)

  return (
    <>
      <Chartist
        name={Tr(T.RealCpu)}
        filter={['CPU', 'CPU_FORECAST', 'CPU_FORECAST_FAR']}
        data={monitoring}
        y={['CPU', 'CPU_FORECAST', 'CPU_FORECAST_FAR']}
        x="TIMESTAMP"
        lineColors={['#40B3D9', '#2A2D3D', '#7a7c83']}
        legendNames={[T.CPU, T.CpuForecast, T.CpuForecastFar]}
        clusterFactor={10}
        clusterThreshold={1000}
        interpolationY={(val) => (val ? +val?.toFixed(2) : +val)}
        zoomFactor={0.95}
      />

      <Chartist
        name={Tr(T.RealMemory)}
        filter={['MEMORY', 'MEMORY_FORECAST', 'MEMORY_FORECAST_FAR']}
        data={monitoring}
        y={['MEMORY', 'MEMORY_FORECAST', 'MEMORY_FORECAST_FAR']}
        x="TIMESTAMP"
        interpolationY={(value) =>
          value ? prettyBytes(value, 'KB', 2) : value
        }
        lineColors={['#40B3D9', '#2A2D3D', '#7a7c83']}
        legendNames={[T.Memory, T.MemoryForecast, T.MemoryForecastFar]}
        clusterFactor={10}
        clusterThreshold={1000}
        zoomFactor={0.95}
      />
    </>
  )
}

Graphs.propTypes = {
  id: PropTypes.string,
}

Graphs.displayName = 'Graphs'

export default Graphs
