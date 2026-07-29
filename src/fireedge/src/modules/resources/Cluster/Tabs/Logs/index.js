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

import { T } from '@ConstantsModule'
import { LogsViewer } from '@ComponentsV2Module'
import { ProvisionAPI } from '@FeaturesModule'
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { Component } from 'react'

/**
 * Render logs viewer tab showing the logs of the cluster.
 *
 * @param {object} root0 - Params
 * @param {object} root0.data - Cluster tab data
 * @returns {Component} Logs tab
 */
export const Logs = ({ data = {} }) => {
  const { selected: cluster = {} } = data
  const provisionId = cluster?.TEMPLATE?.ONEFORM?.PROVISION_ID

  const {
    data: logsData,
    refetch,
    isFetching,
  } = ProvisionAPI.useGetProvisionLogsQuery(
    {
      id: provisionId,
      all: true,
    },
    { skip: !provisionId }
  )

  if (!logsData) {
    return null
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flex: '1 1 0',
        height: '100%',
        minHeight: 0,
        minWidth: 0,
        width: '100%',
        '& > *': {
          flex: '1 1 0',
          minHeight: 0,
          minWidth: 0,
        },
      }}
    >
      <LogsViewer logs={logsData} getLogs={refetch} isFetching={isFetching} />
    </Box>
  )
}

Logs.propTypes = {
  data: PropTypes.object,
}

Logs.id = 'logs'
Logs.title = T.Logs
