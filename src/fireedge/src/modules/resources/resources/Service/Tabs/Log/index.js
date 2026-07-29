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

import PropTypes from 'prop-types'
import { Component, useMemo } from 'react'
import { Box } from '@mui/material'
import { LogsViewer } from '@ComponentsV2Module'
import { SERVICE_LOG_SEVERITY, T } from '@ConstantsModule'
import { timeFromMilliseconds } from '@UtilsModule'
import { getTabStyles } from '@modules/resources/resources/Service/Tabs/styles'

const SEVERITY_LEVELS = {
  [SERVICE_LOG_SEVERITY.DEBUG]: 'debug',
  [SERVICE_LOG_SEVERITY.INFO]: 'info',
  W: 'warn',
  [SERVICE_LOG_SEVERITY.ERROR]: 'error',
}

const getServiceDocument = (service = {}) => service?.DOCUMENT ?? service

const getSelectedService = ({ selected, service } = {}) =>
  getServiceDocument([].concat(selected ?? service ?? [])?.filter(Boolean)?.[0])

const getServiceLogs = (service = {}) =>
  [].concat(getServiceDocument(service)?.TEMPLATE?.BODY?.log ?? [])

const formatLogTimestamp = (timestamp) =>
  timestamp
    ? timeFromMilliseconds(Number(timestamp)).toFormat('yyyy-LL-dd HH:mm:ss')
    : '-'

const mapServiceLogEntry = ({ severity, message, timestamp } = {}) => {
  const knownSeverity = Object.prototype.hasOwnProperty.call(
    SEVERITY_LEVELS,
    severity
  )
  const displaySeverity = knownSeverity ? severity : SERVICE_LOG_SEVERITY.INFO

  return {
    level: SEVERITY_LEVELS[displaySeverity],
    text: `${formatLogTimestamp(timestamp)} [${displaySeverity}] ${
      message ?? '-'
    }`,
  }
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @returns {Component} - Service log tab
 */
export const Log = ({ data }) => {
  const { handleRefresh, isRefreshingService } = data || {}
  const service = useMemo(() => getSelectedService(data), [data])
  const logs = useMemo(
    () => ({
      lines: getServiceLogs(service).filter(Boolean).map(mapServiceLogEntry),
    }),
    [service]
  )

  return (
    <Box sx={(theme) => getTabStyles({ theme })}>
      <Box className="service-logs-viewer">
        <LogsViewer
          logs={logs}
          getLogs={handleRefresh}
          isFetching={isRefreshingService}
        />
      </Box>
    </Box>
  )
}

Log.propTypes = {
  data: PropTypes.object,
}

Log.id = 'log'
Log.title = T.Log
