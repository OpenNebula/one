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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'
import { Stack } from '@mui/material'
import { VNetworksTable } from 'client/components/Tables'
import { useGetClusterQuery } from 'client/features/OneApi/cluster'
import { useHistory, generatePath } from 'react-router-dom'
import { PATH } from 'client/apps/sunstone/routesOne'
const _ = require('lodash')

/**
 * Renders vnets tab showing the vnets of the cluster.
 *
 * @param {object} props - Props
 * @param {string} props.id - Cluster id
 * @returns {ReactElement} Vnets tab
 */
const Vnets = ({ id }) => {
  // Get info about the cluster
  const { data: cluster } = useGetClusterQuery({ id })

  // Define function to get details of a vnet
  const history = useHistory()
  const handleRowClick = (rowId) => {
    history.push(generatePath(PATH.NETWORK.VNETS.DETAIL, { id: String(rowId) }))
  }

  // Get vnets of the cluster
  const vnets = _.isEmpty(cluster?.VNETS)
    ? []
    : Array.isArray(cluster?.VNETS?.ID)
    ? cluster?.VNETS?.ID
    : [cluster?.VNETS?.ID]

  return (
    <div>
      <Stack
        display="grid"
        gap="1em"
        gridTemplateColumns="repeat(auto-fit, minmax(49%, 1fr))"
        padding={{ sm: '0.8em' }}
      >
        <VNetworksTable
          disableRowSelect
          filter={(dataToFilter) =>
            dataToFilter.filter((vnet) => _.includes(vnets, vnet.ID))
          }
          onRowClick={(row) => handleRowClick(row.ID)}
        />
      </Stack>
    </div>
  )
}

Vnets.propTypes = {
  id: PropTypes.string,
}

Vnets.displayName = 'Vnets'

export default Vnets
