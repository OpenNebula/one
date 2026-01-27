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
import LogsViewer from '@modules/components/LogsViewer'
import { Stack } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement } from 'react'

import { ClusterAPI, ProvisionAPI } from '@FeaturesModule'
import { OpenNebulaLogo } from '@modules/components/Icons'

/**
 * Render log viewer tab showing the logs of the cluster (only for OneForm clusters).
 *
 * @param {object} props - Props
 * @param {string} props.id - Cluster id
 * @returns {ReactElement} Logs tab
 */
const Logs = ({ id }) => {
  const { data: cluster } = ClusterAPI.useGetClusterQuery({ id })

  // Get logs
  const {
    data: logsData,
    refetch,
    isFetching,
  } = ProvisionAPI.useGetProvisionLogsQuery({
    id: cluster?.TEMPLATE?.ONEFORM?.PROVISION_ID,
    all: true,
  })

  return logsData ? (
    <LogsViewer logs={logsData} getLogs={refetch} isFetching={isFetching} />
  ) : (
    <Stack
      direction="row"
      sx={{ justifyContent: 'center', alignItems: 'center' }}
    >
      <OpenNebulaLogo width={150} height={150} spinner />
    </Stack>
  )
}

Logs.propTypes = {
  id: PropTypes.string,
}

Logs.displayName = 'Logs'
Logs.label = 'Logs'

export default Logs
