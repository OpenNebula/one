/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { DateTime } from 'luxon'

import { useGetMonitoringQuery } from 'client/features/OneApi/vm'
import { Chartist } from 'client/components/Charts'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const interpolationHour = (value) =>
  DateTime.fromMillis(value).toFormat('HH:mm')
const interpolationBytesSeg = (value) => `${value}B/s`
const interpolationY = (value) => `${value}B`

/**
 * Render Graphs Capacity.
 *
 * @param {object} props - Props
 * @param {string} props.id - Virtual machine id
 * @returns {ReactElement} Capacity Graphs.
 */
const Graphs = ({ id }) => {
  const { data: monitoring = [] } = useGetMonitoringQuery(id)

  return (
    <Grid container spacing={1}>
      <Chartist
        name={Tr(T.NetRX)}
        filter={['NETRX']}
        data={monitoring}
        y="NETRX"
        x="TIMESTAMP"
        interpolationX={interpolationHour}
        interpolationY={interpolationY}
      />
      <Chartist
        name={Tr(T.NetTX)}
        filter={['NETTX']}
        data={monitoring}
        y="NETTX"
        x="TIMESTAMP"
        interpolationY={interpolationY}
        interpolationX={interpolationHour}
      />
      <Chartist
        name={Tr(T.NetDownloadSpeed)}
        filter={['NETRX']}
        data={monitoring}
        y="NETRX"
        x="TIMESTAMP"
        interpolationX={interpolationHour}
        interpolationY={interpolationBytesSeg}
      />
      <Chartist
        name={Tr(T.NetUploadSpeed)}
        filter={['NETTX']}
        data={monitoring}
        y="NETTX"
        x="TIMESTAMP"
        interpolationX={interpolationHour}
        interpolationY={interpolationBytesSeg}
      />
    </Grid>
  )
}

Graphs.propTypes = {
  id: PropTypes.string,
}

Graphs.displayName = 'Graphs'

export default Graphs
