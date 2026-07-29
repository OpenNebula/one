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
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { Component } from 'react'
import { getStyles } from '@modules/resources/resources/VirtualMachine/Tabs/Logs/styles'
import { VmAPI } from '@FeaturesModule'
import { LogsViewer } from '@ComponentsV2Module'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - VM Instances logs tab
 */
export const Logs = ({ data, config }) => {
  const { selectedVm } = data || {}
  const {
    data: logData,
    refetch,
    isFetching,
  } = VmAPI.useGetVmLogsQuery({ id: selectedVm?.ID }, { skip: !selectedVm?.ID })

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      <Box className="logs-container">
        <LogsViewer logs={logData} getLogs={refetch} isFetching={isFetching} />
      </Box>
    </Box>
  )
}

Logs.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Logs.id = 'logs'
Logs.title = T.Logs
