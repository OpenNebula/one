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
import { memo, useMemo } from 'react'
import PropTypes from 'prop-types'

import { LinearProgress } from '@mui/material'

import { useSocket } from 'client/hooks'
import { useGetProvisionLogQuery } from 'client/features/OneApi/provision'
import DebugLog, { LogUtils } from 'client/components/DebugLog'

const Log = memo(({ id }) => {
  const { getProvisionSocket } = useSocket()
  const { data, isLoading } = useGetProvisionLogQuery(id)
  const { uuid = id, log } = data ?? {}

  const parsedLog = useMemo(
    () =>
      log
        ?.map((entry) => {
          try {
            return JSON.parse(entry)
          } catch {
            return entry
          }
        })
        ?.reduce(LogUtils.concatNewMessageToLog, {}),
    [isLoading]
  )

  return isLoading ? (
    <LinearProgress color="secondary" sx={{ width: '100%' }} />
  ) : (
    <DebugLog uuid={uuid} socket={getProvisionSocket} logDefault={parsedLog} />
  )
})

Log.propTypes = { id: PropTypes.string.isRequired }
Log.displayName = 'Log'

export default Log
