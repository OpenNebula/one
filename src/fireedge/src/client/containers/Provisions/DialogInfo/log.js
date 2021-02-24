import * as React from 'react'
import PropTypes from 'prop-types'

import { LinearProgress } from '@material-ui/core'

import { useProvision, useFetch, useSocket } from 'client/hooks'
import DebugLog, { LogUtils } from 'client/components/DebugLog'
import * as Types from 'client/types/provision'

const Log = React.memo(({ hidden, data: { ID: id } }) => {
  const { getProvision } = useSocket()
  const { getProvisionLog } = useProvision()

  const {
    data: { uuid = id, log } = {},
    fetchRequest,
    loading
  } = useFetch(getProvisionLog)

  React.useEffect(() => {
    !hidden && fetchRequest({ id })
  }, [id])

  React.useEffect(() => {
    (!log && !hidden) && fetchRequest({ id })
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
  prev.hidden === next.hidden && prev.data === next.data)

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
