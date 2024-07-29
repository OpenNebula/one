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
import PropTypes from 'prop-types'
import { ReactElement } from 'react'

import { Chartist } from 'client/components/Charts'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'
import { useGetMonitoringQuery } from 'client/features/OneApi/vm'
import { prettyBytes } from 'client/utils'

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
    <>
      <Chartist
        name={Tr(T.RealCpu)}
        filter={['CPU']}
        data={monitoring}
        y="CPU"
        x="TIMESTAMP"
      />

      <Chartist
        name={Tr(T.RealMemory)}
        filter={['MEMORY']}
        data={monitoring}
        y="MEMORY"
        x="TIMESTAMP"
        interpolationY={(value) => prettyBytes(value)}
      />
    </>
  )
}

Graphs.propTypes = {
  id: PropTypes.string,
}

Graphs.displayName = 'Graphs'

export default Graphs
