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
import { Grid, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement } from 'react'

import Chartist from '@modules/components/Charts/Chartist'
import { Tr, Translate } from '@modules/components/HOC'
import { T } from '@ConstantsModule'
import { VmAPI } from '@FeaturesModule'
import { prettyBytes } from '@UtilsModule'

const interpolationBytesSeg = (value) =>
  value ? `${prettyBytes(value)}/s` : value
const interpolationBytes = (value) => (value ? prettyBytes(value) : value)

/**
 * Render Graphs Capacity.
 *
 * @param {object} props - Props
 * @param {string} props.id - Virtual machine id
 * @returns {ReactElement} Capacity Graphs.
 */
const Graphs = ({ id }) => {
  const { data: monitoring = [] } = VmAPI.useGetMonitoringQuery(id)

  return !monitoring.length ? (
    <Typography variant="h6" zIndex={2} noWrap>
      <Translate word={T.NoNetworksInMonitoring} />
    </Typography>
  ) : (
    <Grid container spacing={1}>
      <Grid item xs={12} sm={6}>
        <Chartist
          name={Tr(T.NetRX)}
          data={monitoring}
          filter={['NETRX', 'NETRX_FORECAST', 'NETRX_FORECAST_FAR']}
          y={['NETRX', 'NETRX_FORECAST', 'NETRX_FORECAST_FAR']}
          x="TIMESTAMP"
          interpolationY={interpolationBytes}
          legendNames={[T.NetRX, T.NetRXForecast, T.NetRXForecastFar]}
          lineColors={['#40B3D9', '#2A2D3D', '#7a7c83']}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Chartist
          name={Tr(T.NetTX)}
          filter={['NETRX', 'NETRX_FORECAST', 'NETRX_FORECAST_FAR']}
          y={['NETRX', 'NETRX_FORECAST', 'NETRX_FORECAST_FAR']}
          data={monitoring}
          x="TIMESTAMP"
          legendNames={[T.NetTX, T.NetTXForecast, T.NetTXForecastFar]}
          lineColors={['#40B3D9', '#2A2D3D', '#7a7c83']}
          interpolationY={interpolationBytes}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Chartist
          name={Tr(T.NetDownloadSpeed)}
          data={monitoring}
          filter={['NETRX', 'NETRX_FORECAST', 'NETRX_FORECAST_FAR']}
          y={['NETRX', 'NETRX_FORECAST', 'NETRX_FORECAST_FAR']}
          x="TIMESTAMP"
          derivative={true}
          legendNames={[T.NetRX, T.NetRXForecast, T.NetRXForecastFar]}
          lineColors={['#40B3D9', '#2A2D3D', '#7a7c83']}
          interpolationY={interpolationBytesSeg}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Chartist
          name={Tr(T.NetUploadSpeed)}
          data={monitoring}
          filter={['NETTX', 'NETTX_FORECAST', 'NETTX_FORECAST_FAR']}
          y={['NETTX', 'NETTX_FORECAST', 'NETTX_FORECAST_FAR']}
          x="TIMESTAMP"
          derivative={true}
          legendNames={[T.NetTX, T.NetTXForecast, T.NetTXForecastFar]}
          lineColors={['#40B3D9', '#2A2D3D', '#7a7c83']}
          interpolationY={interpolationBytesSeg}
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
