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
import { Grid, useTheme } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement } from 'react'

import { T } from '@ConstantsModule'
import { VmAPI } from '@FeaturesModule'
import Chartist from '@modules/components/Charts/Chartist'
import { Tr } from '@modules/components/HOC'
import { prettyBytes } from '@UtilsModule'

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
  const { data: monitoring = [], isFetching } = VmAPI.useGetMonitoringQuery(id)
  const { data: vm = {} } = VmAPI.useGetVmQuery({ id })

  const theme = useTheme()

  const historyRecords = [].concat(vm?.HISTORY_RECORDS?.HISTORY)

  const { VM_MAD } = historyRecords?.[0] ?? 'kvm'

  const forecastConfig = window?.__FORECAST_CONFIG__?.[VM_MAD] ?? {}
  const { virtualmachine = {} } = forecastConfig
  const {
    forecast: { period: forecastPeriod = 5 } = {}, // Minutes
  } = virtualmachine || {}

  const diskRdBytesY = [
    ['DISKRDBYTES_BW', 'DISKRDBYTES_BW_FORECAST'],
    'DISKRDBYTES_BW_FORECAST_FAR',
  ]

  const diskRdBytesNames = Object.fromEntries(
    [
      T.DiskReadBytes,
      `${T.DiskReadBytes} ${T.Forecast}`,
      `${T.DiskReadBytes} ${T.ForecastFar}`,
    ].map((name, idx) => [diskRdBytesY?.flat()[idx], name])
  )

  const diskWrBytesY = [
    ['DISKWRBYTES_BW', 'DISKWRBYTES_BW_FORECAST'],
    'DISKWRBYTES_BW_FORECAST_FAR',
  ]

  const diskWrBytesNames = Object.fromEntries(
    [
      T.DiskWriteBytes,
      `${T.DiskWriteBytes} ${T.Forecast}`,
      `${T.DiskWriteBytes} ${T.ForecastFar}`,
    ].map((name, idx) => [diskWrBytesY?.flat()[idx], name])
  )

  const diskRdIopsY = [
    ['DISKRDIOPS_BW', 'DISKRDIOPS_BW_FORECAST'],
    'DISKRDIOPS_BW_FORECAST_FAR',
  ]
  const diskRdIopsNames = Object.fromEntries(
    [
      T.DiskReadIOPS,
      `${T.DiskReadIOPS} ${T.Forecast}`,
      `${T.DiskReadIOPS} ${T.ForecastFar}`,
    ].map((name, idx) => [diskRdIopsY?.flat()[idx], name])
  )

  const diskWrIopsY = [
    ['DISKWRIOPS_BW', 'DISKWRIOPS_BW_FORECAST'],
    'DISKWRIOPS_BW_FORECAST_FAR',
  ]
  const diskWrIopsNames = Object.fromEntries(
    [
      T.DiskWriteIOPS,
      `${T.DiskWriteIOPS} ${T.Forecast}`,
      `${T.DiskWriteIOPS} ${T.ForecastFar}`,
    ].map((name, idx) => [diskWrIopsY?.flat()[idx], name])
  )

  return (
    <Grid container spacing={1} sx={{ overflow: 'hidden' }}>
      <Grid item md={6}>
        <Chartist
          name={Tr(T.DiskReadBytes)}
          data={monitoring}
          isFetching={isFetching}
          y={diskRdBytesY}
          serieScale={2}
          setTransform={(
            yValues,
            _xValues,
            timestamps,
            labelPair,
            _labelPairIndex
          ) => {
            const buildSeries = () => {
              const targetXId = labelPair === 'DISKRDBYTES_BW' ? 0 : 1
              const result = Array(timestamps.length).fill(null)
              let yIdx = 0

              for (let i = 0; i < timestamps.length; i++) {
                if (targetXId === timestamps[i]?.xId) {
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
          legendNames={diskRdBytesNames}
          lineColors={[
            theme?.palette?.graphs.vm.diskReadBytes.real,
            theme?.palette?.graphs.vm.diskReadBytes.forecast,
            theme?.palette?.graphs.vm.diskReadBytes.forecastFar,
          ]}
          interpolationY={interpolationBytes}
          zoomFactor={0.95}
          trendLineOnly={['DISKRDBYTES_BW_FORECAST_FAR']}
          shouldFill={['DISKRDBYTES_BW']}
        />
      </Grid>
      <Grid item md={6}>
        <Chartist
          name={Tr(T.DiskWriteBytes)}
          data={monitoring}
          isFetching={isFetching}
          y={diskWrBytesY}
          serieScale={2}
          setTransform={(
            yValues,
            _xValues,
            timestamps,
            labelPair,
            _labelPairIndex
          ) => {
            const buildSeries = () => {
              const targetXId = labelPair === 'DISKWRBYTES_BW' ? 0 : 1
              const result = Array(timestamps.length).fill(null)
              let yIdx = 0

              for (let i = 0; i < timestamps.length; i++) {
                if (targetXId === timestamps[i]?.xId) {
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
          legendNames={diskWrBytesNames}
          lineColors={[
            theme?.palette?.graphs.vm.diskWriteBytes.real,
            theme?.palette?.graphs.vm.diskWriteBytes.forecast,
            theme?.palette?.graphs.vm.diskWriteBytes.forecastFar,
          ]}
          interpolationY={interpolationBytes}
          zoomFactor={0.95}
          trendLineOnly={['DISKWRBYTES_BW_FORECAST_FAR']}
          shouldFill={['DISKWRBYTES_BW']}
        />
      </Grid>
      <Grid item md={6}>
        <Chartist
          name={Tr(T.DiskReadIOPS)}
          data={monitoring}
          isFetching={isFetching}
          y={diskRdIopsY}
          serieScale={2}
          setTransform={(
            yValues,
            _xValues,
            timestamps,
            labelPair,
            _labelPairIndex
          ) => {
            const buildSeries = () => {
              const targetXId = labelPair === 'DISKRDIOPS_BW' ? 0 : 1
              const result = Array(timestamps.length).fill(null)
              let yIdx = 0

              for (let i = 0; i < timestamps.length; i++) {
                if (targetXId === timestamps[i]?.xId) {
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
          legendNames={diskRdIopsNames}
          lineColors={[
            theme?.palette?.graphs.vm.diskReadIOPS.real,
            theme?.palette?.graphs.vm.diskReadIOPS.forecast,
            theme?.palette?.graphs.vm.diskReadIOPS.forecastFar,
          ]}
          interpolationY={interpolationBytes}
          zoomFactor={0.95}
          trendLineOnly={['DISKRDIOPS_BW_FORECAST_FAR']}
          shouldFill={['DISKRDIOPS_BW']}
        />
      </Grid>
      <Grid item md={6}>
        <Chartist
          name={Tr(T.DiskWriteIOPS)}
          data={monitoring}
          isFetching={isFetching}
          y={diskWrIopsY}
          serieScale={2}
          setTransform={(
            yValues,
            _xValues,
            timestamps,
            labelPair,
            _labelPairIndex
          ) => {
            const buildSeries = () => {
              const targetXId = labelPair === 'DISKWRIOPS_BW' ? 0 : 1
              const result = Array(timestamps.length).fill(null)
              let yIdx = 0

              for (let i = 0; i < timestamps.length; i++) {
                if (targetXId === timestamps[i]?.xId) {
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
          legendNames={diskWrIopsNames}
          lineColors={[
            theme?.palette?.graphs.vm.diskWriteIOPS.real,
            theme?.palette?.graphs.vm.diskWriteIOPS.forecast,
            theme?.palette?.graphs.vm.diskWriteIOPS.forecastFar,
          ]}
          interpolationY={interpolationBytes}
          zoomFactor={0.95}
          trendLineOnly={['DISKWRIOPS_BW_FORECAST_FAR']}
          shouldFill={['DISKWRIOPS']}
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
