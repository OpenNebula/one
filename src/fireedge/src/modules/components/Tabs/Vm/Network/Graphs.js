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
import { Grid, Typography, useTheme } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement } from 'react'

import Chartist from '@modules/components/Charts/Chartist'
import { Tr, Translate } from '@modules/components/HOC'
import { T } from '@ConstantsModule'
import { VmAPI } from '@FeaturesModule'
import { prettyBytes } from '@UtilsModule'

const interpolationBytesSeg = (value) => (value ? `${prettyBytes(value)}/s` : 0)

/**
 * Render Graphs Capacity.
 *
 * @param {object} props - Props
 * @param {string} props.id - Virtual machine id
 * @returns {ReactElement} Capacity Graphs.
 */
const Graphs = ({ id }) => {
  const { data: monitoring = [] } = VmAPI.useGetMonitoringQuery(id)

  const theme = useTheme()

  const forecastConfig = window?.__FORECAST_CONFIG__ ?? {}
  const { virtualmachine = {} } = forecastConfig
  const {
    forecast_period: forecastPeriod = 5, // Minutes
    forecast_far_period: forecastFarPeriod = 48, // Hours
  } = virtualmachine

  return !monitoring.length ? (
    <Typography variant="h6" zIndex={2} noWrap>
      <Translate word={T.NoNetworksInMonitoring} />
    </Typography>
  ) : (
    <Grid container spacing={1} sx={{ overflow: 'hidden' }}>
      <Grid item xs={12} sm={6}>
        <Chartist
          name={Tr(T.NetDownloadSpeed)}
          data={monitoring}
          filter={['NETRX_BW', 'NETRX_BW_FORECAST', 'NETRX_BW_FORECAST_FAR']}
          y={['NETRX_BW', 'NETRX_BW_FORECAST', 'NETRX_BW_FORECAST_FAR']}
          interpolationY={interpolationBytesSeg}
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
            T.NetRX,
            `${T.NetRX} ${T.Forecast}`,
            `${T.NetRX} ${T.ForecastFar}`,
          ]}
          clusterFactor={10}
          clusterThreshold={1000}
          zoomFactor={0.95}
          shouldPadY={['NETRX_BW_FORECAST']}
          trendLineOnly={['NETRX_BW_FORECAST_FAR']}
          shouldFill
          clampForecast
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Chartist
          name={Tr(T.NetUploadSpeed)}
          data={monitoring}
          filter={['NETTX_BW', 'NETTX_BW_FORECAST', 'NETTX_BW_FORECAST_FAR']}
          y={['NETTX_BW', 'NETTX_BW_FORECAST', 'NETTX_BW_FORECAST_FAR']}
          interpolationY={interpolationBytesSeg}
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
            T.NetTX,
            `${T.NetTX} ${T.Forecast}`,
            `${T.NetTX} ${T.ForecastFar}`,
          ]}
          clusterFactor={10}
          clusterThreshold={1000}
          zoomFactor={0.95}
          shouldPadY={['NETTX_BW_FORECAST']}
          trendLineOnly={['NETTX_BW_FORECAST_FAR']}
          shouldFill
          clampForecast
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
