/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { LogsViewer } from '@ComponentsV2Module'
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { Component } from 'react'

import { OneKsAPI } from '@FeaturesModule'
import { T } from '@ConstantsModule'
import { getStyles } from '@modules/resources/resources/OneKs/Tabs/Logs/styles'

/**
 * Render log viewer tab showing the logs of the cluster (only for OneForm clusters).
 *
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} Logs tab
 */
const Logs = ({ data, config }) => {
  const id = data?.selected?.ID ?? data?.id
  const {
    data: logsData,
    refetch,
    isFetching,
  } = OneKsAPI.useGetKubernetesLogsQuery({ id }, { skip: !id })

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      <Box className="logs-container">
        <LogsViewer logs={logsData} getLogs={refetch} isFetching={isFetching} />
      </Box>
    </Box>
  )
}

Logs.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Logs.displayName = 'Logs'
Logs.id = 'logs'
Logs.title = T.Logs

export default Logs
