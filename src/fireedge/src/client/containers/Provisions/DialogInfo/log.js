/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import * as React from 'react'
import PropTypes from 'prop-types'

import { LinearProgress } from '@material-ui/core'

import { useFetch, useSocket } from 'client/hooks'
import { useProvisionApi } from 'client/features/One'
import DebugLog, { LogUtils } from 'client/components/DebugLog'

const Log = React.memo(({ hidden, data: { ID } }) => {
  const { getProvisionSocket } = useSocket()
  const { getProvisionLog } = useProvisionApi()

  const {
    data: { uuid = ID, log } = {},
    fetchRequest,
    loading
  } = useFetch(getProvisionLog)

  React.useEffect(() => {
    (!log && !hidden) && fetchRequest(ID)
  }, [hidden])

  const parsedLog = React.useMemo(() =>
    log
      ?.map(entry => {
        try { return JSON.parse(entry) } catch { return entry }
      })
      ?.reduce(LogUtils.concatNewMessageToLog, {})
  , [loading])

  return loading ? (
    <LinearProgress color='secondary' style={{ width: '100%' }} />
  ) : (
    <DebugLog uuid={uuid} socket={getProvisionSocket} logDefault={parsedLog} />
  )
}, (prev, next) =>
  prev.hidden === next.hidden && prev.reloading === next.reloading
)

Log.propTypes = {
  data: PropTypes.object.isRequired,
  hidden: PropTypes.bool,
  fetchRequest: PropTypes.func
}

Log.defaultProps = {
  data: {},
  hidden: false,
  fetchRequest: () => undefined
}

Log.displayName = 'Log'

export default Log
