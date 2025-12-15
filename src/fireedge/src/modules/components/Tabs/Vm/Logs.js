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

import { VmAPI } from '@FeaturesModule'
import LogsViewer from '@modules/components/LogsViewer'
import { OpenNebulaLogo } from '@modules/components/Icons'

/**
 * Renders logs tab.
 *
 * @param {object} props - Props
 * @param {string} props.id - Virtual machine id
 * @returns {ReactElement} Logs tab
 */
const LogsTab = ({ id }) => {
  // Get vm logs
  const {
    data: logsData,
    refetch,
    isFetching,
  } = VmAPI.useGetVmLogsQuery({ id })

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

LogsTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

LogsTab.displayName = 'LogsTab'

export default LogsTab
