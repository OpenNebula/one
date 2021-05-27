import * as React from 'react'
import PropTypes from 'prop-types'

import { LinearProgress } from '@material-ui/core'

import { useFetch, useSocket } from 'client/hooks'
import { useProvisionApi } from 'client/features/One'
import DebugLog, { LogUtils } from 'client/components/DebugLog'
import * as Types from 'client/types/provision'

const Log = React.memo(({ hidden, data: { ID } }) => {
  const { getProvision } = useSocket()
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
    <DebugLog uuid={uuid} socket={getProvision} logDefault={parsedLog} />
  )
}, (prev, next) =>
  prev.hidden === next.hidden && prev.reloading === next.reloading
)

Log.propTypes = {
  data: Types.Provision.isRequired,
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
