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

import { T } from '@ConstantsModule'
import { VmAPI } from '@FeaturesModule'
import Chartist from '@modules/components/Charts/Chartist'
import { Tr, Translate } from '@modules/components/HOC'
import { prettyBytes } from '@UtilsModule'

const interpolationBytesSeg = (value) =>
  value ? `${prettyBytes(value)}/s` : value

/**
 * Render Graphs Capacity.
 *
 * @param {object} props - Props
 * @param {string} props.id - Virtual machine id
 * @returns {ReactElement} Capacity Graphs.
 */
const Graphs = ({ id }) => {
  const { data: monitoring = [], isFetching } = VmAPI.useGetMonitoringQuery(id)
  const { data: vm = {} } = VmAPI.useGetVmQuery({ id })

  const historyRecords = [].concat(vm?.HISTORY_RECORDS?.HISTORY)

  const { VM_MAD } = historyRecords?.[0] ?? 'kvm'

  const theme = useTheme()

  const forecastConfig = window?.__FORECAST_CONFIG__?.[VM_MAD] ?? {}
  const { virtualmachine = {} } = forecastConfig
  const {
    forecast: { period: forecastPeriod = 5 } = {}, // Minutes
  } = virtualmachine || {}

  const netRxY = [['NETRX_BW', 'NETRX_BW_FORECAST'], 'NETRX_BW_FORECAST_FAR']
  const netRxNames = Object.fromEntries(
    [T.NetRX, `${T.NetRX} ${T.Forecast}`, `${T.NetRX} ${T.ForecastFar}`].map(
      (name, idx) => [netRxY?.flat()[idx], name]
    )
  )

  const netTxY = [['NETTX_BW', 'NETTX_BW_FORECAST'], 'NETTX_BW_FORECAST_FAR']
  const netTxNames = Object.fromEntries(
    [T.NetTX, `${T.NetTX} ${T.Forecast}`, `${T.NetTX} ${T.ForecastFar}`].map(
      (name, idx) => [netTxY?.flat()[idx], name]
    )
  )

  return !monitoring.length ? (
    <Typography variant="h6" zIndex={2} noWrap>
      <Translate word={T.NoNetworksInMonitoring} />
    </Typography>
  ) : (
    <Grid container spacing={1} sx={{ overflow: 'hidden' }}>
      <Grid item md={6}>
        <Chartist
          name={Tr(T.NetDownloadSpeed)}
          data={monitoring}
          isFetching={isFetching}
          y={netRxY}
          serieScale={2}
          setTransform={(
            yValues,
            _xValues,
            timestamps,
            labelPair,
            _labelPairIndex
          ) => {
            const buildSeries = () => {
              const targetXId = labelPair === 'NETRX_BW' ? 0 : 1
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
            (point) => new Date(parseInt(point) * 1000).getTime(),
            (point) =>
              new Date(
                parseInt(point) * 1000 + forecastPeriod * 60 * 1000
              ).getTime(),
          ]}
          lineColors={[
            theme?.palette?.graphs.vm.netDownloadSpeed.real,
            theme?.palette?.graphs.vm.netDownloadSpeed.forecast,
            theme?.palette?.graphs.vm.netDownloadSpeed.forecastFar,
          ]}
          interpolationY={interpolationBytesSeg}
          legendNames={netRxNames}
          zoomFactor={0.95}
          trendLineOnly={['NETRX_BW_FORECAST_FAR']}
          shouldFill={netRxY.flat()}
        />
      </Grid>
      <Grid item md={6}>
        <Chartist
          name={Tr(T.NetUploadSpeed)}
          data={monitoring}
          isFetching={isFetching}
          y={netTxY}
          interpolationY={interpolationBytesSeg}
          setTransform={(
            yValues,
            _xValues,
            timestamps,
            labelPair,
            _labelPairIndex
          ) => {
            const buildSeries = () => {
              const targetXId = labelPair === 'NETTX_BW' ? 0 : 1
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
            (point) => new Date(parseInt(point) * 1000).getTime(),
            (point) =>
              new Date(
                parseInt(point) * 1000 + forecastPeriod * 60 * 1000
              ).getTime(),
          ]}
          serieScale={2}
          lineColors={[
            theme?.palette?.graphs.vm.netUploadSpeed.real,
            theme?.palette?.graphs.vm.netUploadSpeed.forecast,
            theme?.palette?.graphs.vm.netUploadSpeed.forecastFar,
          ]}
          legendNames={netTxNames}
          zoomFactor={0.95}
          trendLineOnly={['NETTX_BW_FORECAST_FAR']}
          shouldFill={netTxY.flat()}
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
