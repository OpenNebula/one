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
import PropTypes from 'prop-types'
import { Stack } from '@mui/material'
import { HostsTable } from '@modules/components/Tables'
import { ClusterAPI } from '@FeaturesModule'
import { useHistory, generatePath } from 'react-router-dom'
import { PATH } from '@modules/components/path'
const _ = require('lodash')

/**
 * Renders hosts tab showing the hosts of the cluster.
 *
 * @param {object} props - Props
 * @param {string} props.id - Cluster id
 * @returns {ReactElement} Hosts tab
 */
const Hosts = ({ id }) => {
  // Get info about the cluster
  const { data: cluster } = ClusterAPI.useGetClusterQuery({ id })

  // Define function to get details of a host
  const history = useHistory()
  const handleRowClick = (rowId) => {
    history.push(
      generatePath(PATH.INFRASTRUCTURE.HOSTS.DETAIL, { id: String(rowId) })
    )
  }

  // Get hosts of the cluster
  const hosts = _.isEmpty(cluster?.HOSTS)
    ? []
    : Array.isArray(cluster?.HOSTS?.ID)
    ? cluster?.HOSTS?.ID
    : [cluster?.HOSTS?.ID]

  return (
    <div>
      <Stack
        display="grid"
        gap="1em"
        gridTemplateColumns="repeat(auto-fit, minmax(49%, 1fr))"
        padding={{ sm: '0.8em' }}
      >
        <HostsTable.Table
          disableRowSelect
          filter={(dataToFilter) =>
            dataToFilter.filter((host) => _.includes(hosts, host.ID))
          }
          onRowClick={(row) => handleRowClick(row.ID)}
        />
      </Stack>
    </div>
  )
}

Hosts.propTypes = {
  id: PropTypes.string,
}

Hosts.displayName = 'Hosts'

export default Hosts
