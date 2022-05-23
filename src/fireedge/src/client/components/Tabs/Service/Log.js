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
import PropTypes from 'prop-types'
import { Stack, Typography } from '@mui/material'

import { useGetServiceQuery } from 'client/features/OneApi/service'
import { timeFromMilliseconds } from 'client/models/Helper'
import { Service, SERVICE_LOG_SEVERITY } from 'client/constants'

/**
 * Renders log tab.
 *
 * @param {object} props - Props
 * @param {string} props.id - Service id
 * @returns {ReactElement} Log tab
 */
const LogTab = ({ id }) => {
  const { data: service = {} } = useGetServiceQuery({ id })

  /** @type {Service} */
  const { TEMPLATE: { BODY: { log = [] } = {} } = {} } = service

  return (
    <Stack gap="0.5em" p="1em" bgcolor="background.default">
      {log?.map(({ severity, message, timestamp } = {}) => {
        const time = timeFromMilliseconds(+timestamp)
        const isError = severity === SERVICE_LOG_SEVERITY.ERROR

        return (
          <Typography
            key={`message-${timestamp}`}
            noWrap
            variant="body2"
            color={isError ? 'error' : 'textPrimary'}
          >
            {`${time.toFormat('ff')} [${severity}] ${message}`}
          </Typography>
        )
      })}
    </Stack>
  )
}

LogTab.propTypes = { tabProps: PropTypes.object, id: PropTypes.string }
LogTab.displayName = 'RolesTab'

export default LogTab
