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
import { ReactElement } from 'react'
import { Grid } from '@mui/material'
import PropTypes from 'prop-types'

import { VmAPI } from '@FeaturesModule'
import Chartist from '@modules/components/Charts/Chartist'
import { Tr } from '@modules/components/HOC'
import { prettyBytes } from '@UtilsModule'
import { T } from '@ConstantsModule'

const interpolationBytes = (value) =>
  value ? prettyBytes(value, 'KB', 2) : value

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
    <Grid container spacing={1}>
      <Grid item xs={12} sm={6}>
        <Chartist
          name={Tr(T.DiskReadBytes)}
          filter={[
            'DISKRDBYTES',
            'DISKRDBYTES_FORECAST',
            'DISKRDBYTES_FORECAST_FAR',
          ]}
          data={monitoring}
          y={[
            'DISKRDBYTES',
            'DISKRDBYTES_FORECAST',
            'DISKRDBYTES_FORECAST_FAR',
          ]}
          x="TIMESTAMP"
          legendNames={[
            T.DiskReadBytes,
            T.DiskReadForecast,
            T.DiskReadForecastFar,
          ]}
          lineColors={['#40B3D9', '#2A2D3D', '#7a7c83']}
          interpolationY={interpolationBytes}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Chartist
          name={Tr(T.DiskWriteBytes)}
          data={monitoring}
          filter={[
            'DISKWRBYTES',
            'DISKWRBYTES_FORECAST',
            'DISKWRBYTES_FORECAST_FAR',
          ]}
          y={[
            'DISKWRBYTES',
            'DISKWRBYTES_FORECAST',
            'DISKWRBYTES_FORECAST_FAR',
          ]}
          x="TIMESTAMP"
          legendNames={[
            T.DiskWriteBytes,
            T.DiskWriteForecast,
            T.DiskWriteForecastFar,
          ]}
          lineColors={['#40B3D9', '#2A2D3D', '#7a7c83']}
          interpolationY={interpolationBytes}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Chartist
          name={Tr(T.DiskReadIOPS)}
          data={monitoring}
          filter={[
            'DISKRDIOPS',
            'DISKRDIOPS_FORECAST',
            'DISKRDIOPS_FORECAST_FAR',
          ]}
          y={['DISKRDIOPS', 'DISKRDIOPS_FORECAST', 'DISKRDIOPS_FORECAST_FAR']}
          x="TIMESTAMP"
          derivative={true}
          legendNames={[
            T.DiskReadIOPS,
            T.DiskReadIOPSForecast,
            T.DiskReadIOPSForecastFar,
          ]}
          lineColors={['#40B3D9', '#2A2D3D', '#7a7c83']}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Chartist
          name={Tr(T.DiskWriteIOPS)}
          data={monitoring}
          filter={[
            'DISKWRIOPS',
            'DISKWRIOPS_FORECAST',
            'DISKWRIOPS_FORECAST_FAR',
          ]}
          y={['DISKWRIOPS', 'DISKWRIOPS_FORECAST', 'DISKWRIOPS_FORECAST_FAR']}
          x="TIMESTAMP"
          derivative={true}
          legendNames={[
            T.DiskWriteIOPS,
            T.DiskWriteIOPSForecast,
            T.DiskWriteIOPSForecastFar,
          ]}
          lineColors={['#40B3D9', '#2A2D3D', '#7a7c83']}
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
