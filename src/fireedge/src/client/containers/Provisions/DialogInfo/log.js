import * as React from 'react'
import PropTypes from 'prop-types'

import { LinearProgress } from '@material-ui/core'

import { useProvision, useFetch, useSocket } from 'client/hooks'
import DebugLog from 'client/components/DebugLog'
import * as Types from 'client/types/provision'

const Log = React.memo(({ hidden, data: { ID } }) => {
  const { getProvision } = useSocket()
  const { getProvisionLog } = useProvision()
  const { data: provisionLog, fetchRequest, loading } = useFetch(getProvisionLog)

  React.useEffect(() => {
    !hidden && fetchRequest({ id: ID })
  }, [ID])

  React.useEffect(() => {
    (!provisionLog && !hidden) && fetchRequest({ id: ID })
  }, [hidden])

  const log = provisionLog?.log?.reduce((res, dataLog) => {
    try {
      const json = JSON.parse(dataLog)
      const { data, command, commandId } = json

      return {
        ...res,
        [command]: {
          [commandId]: [...(res?.[command]?.[commandId] ?? []), data]
        }
      }
    } catch { return res }
  }, {})

  return loading ? (
    <LinearProgress color='secondary' style={{ width: '100%' }} />
  ) : (
    <DebugLog
      uuid={provisionLog?.uuid ?? ID}
      socket={getProvision}
      logDefault={log}
    />
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
