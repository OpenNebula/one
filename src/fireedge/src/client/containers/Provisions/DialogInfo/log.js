import React from 'react'
import PropTypes from 'prop-types'
import { LinearProgress } from '@material-ui/core'

import useProvision from 'client/hooks/useProvision'
import useFetch from 'client/hooks/useFetch'
import useSocket from 'client/hooks/useSocket'

import DebugLog from 'client/components/DebugLog'

const Log = React.memo(({ hidden, data: { ID } }) => {
  const { getProvision } = useSocket()
  const { getProvisionLog } = useProvision()
  const { data: provision, fetchRequest, loading } = useFetch(getProvisionLog)

  React.useEffect(() => {
    !hidden && fetchRequest({ id: ID })
  }, [ID])

  React.useEffect(() => {
    (!provision && !hidden) && fetchRequest({ id: ID })
  }, [hidden])

  return loading ? (
    <LinearProgress style={{ width: '100%' }} />
  ) : (
    <DebugLog
      uuid={provision?.uuid ?? ID}
      socket={getProvision}
      logDefault={provision?.log}
    />
  )
}, (prev, next) =>
  prev.hidden === next.hidden && prev.data === next.data)

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
