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
import { Grid } from '@mui/material'
import { prettyBytes } from 'client/utils'
import PropTypes from 'prop-types'
import { ReactElement } from 'react'
import { Chartist } from 'client/components/Charts'
import { T } from 'client/constants'
import { useGetHostMonitoringQuery } from 'client/features/OneApi/host'
import { Tr } from 'client/components/HOC'

/**
 * Renders the host Graph tab.
 *
 * @param {object} props - Props
 * @param {string} props.id - Host id
 * @returns {ReactElement} Graphs tab
 */
const HostGraphTab = ({ id }) => {
  const {
    data: { MONITORING_DATA: { MONITORING: monitoring = [] } = {} } = {},
  } = useGetHostMonitoringQuery(id) || {}

  const cpuMemoryData = (
    Array.isArray(monitoring) ? monitoring : [monitoring]
  ).map(({ TIMESTAMP, CAPACITY }) => ({
    TIMESTAMP,
    ...CAPACITY,
  }))

  return (
    <Grid container spacing={1}>
      <Grid item xs={12} sm={12}>
        <Chartist
          name={'CPU'}
          filter={['FREE_CPU', 'USED_CPU']}
          data={cpuMemoryData}
          y={['FREE_CPU', 'USED_CPU']}
          x="TIMESTAMP"
          enableLegend={true}
          legendNames={[Tr(T.FreeCPU), Tr(T.UsedCPU)]}
          lineColors={['#039be5', '#757575']}
        />
      </Grid>
      <Grid item xs={12} sm={12}>
        <Chartist
          name={Tr(T.Memory)}
          filter={['FREE_MEMORY', 'USED_MEMORY']}
          data={cpuMemoryData}
          y={['FREE_MEMORY', 'USED_MEMORY']}
          x="TIMESTAMP"
          enableLegend={true}
          lineColors={['#039be5', '#757575']}
          legendNames={[Tr(T.FreeMemory), Tr(T.UsedMemory)]}
          interpolationY={(value) => prettyBytes(value)}
        />
      </Grid>
    </Grid>
  )
}

HostGraphTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

HostGraphTab.displayName = 'HostGraphTab'

export default HostGraphTab
