import React, { useEffect, useState, memo } from 'react'
import PropTypes from 'prop-types'

import { makeStyles, lighten, Box } from '@material-ui/core'
import AutoScrollBox from 'client/components/AutoScrollBox'

const useStyles = makeStyles(theme => ({
  message: ({ color = '#fafafa' }) => ({
    color,
    cursor: 'default',
    fontFamily: 'monospace',
    padding: theme.spacing(0.5, 1),
    '&:hover': { backgroundColor: lighten('#1d1f21', 0.02) }
  })
}))

// --------------------------------------------
// MESSAGE COMPONENT
// --------------------------------------------

const Message = memo(({ log, message, index }) => {
  const color = () => {
    const lastMessage = log[index - 1]

    if (message.includes('WARNING')) return 'yellow'
    else if (message.includes('WARNING')) return 'yellow'
    else if (
      message.includes('ERROR') || lastMessage?.includes('ERROR')
    ) return 'red'
    else return '#fafafa'
  }

  const classes = useStyles({ color: color() })

  return (
    <div key={index} className={classes.message}>
      {message}
    </div>
  )
}, (prev, next) => prev.index === next.index)

Message.propTypes = {
  log: PropTypes.array,
  message: PropTypes.string,
  index: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ])
}

Message.defaultProps = { log: [], message: '', index: 0 }
Message.displayName = 'Message'

// --------------------------------------------
// DEBUG LOG COMPONENT
// --------------------------------------------

const DebugLog = memo(({ uuid, socket, logDefault }) => {
  const [log, setLog] = useState(logDefault)

  useEffect(() => {
    uuid && socket.on(socketData =>
      socketData?.id === uuid && setLog(prev => [...prev, socketData?.data])
    )
    return () => uuid && socket.off()
  }, [])

  return (
    <Box borderRadius={5} bgcolor={'#1d1f21'} width={1} height={1}>
      <AutoScrollBox scrollBehavior="auto">
        {log?.map((message, index) => {
          const isString = typeof message === 'string'
          const stringMessage = isString ? message : JSON.stringify(message)

          return (
            <Message key={index} log={log} message={stringMessage} index={index} />
          )
        })}
      </AutoScrollBox>
    </Box>
  )
}, (prev, next) => prev.uuid === next.uuid)

DebugLog.propTypes = {
  uuid: PropTypes.string,
  socket: PropTypes.shape({
    on: PropTypes.func.isRequired,
    off: PropTypes.func.isRequired
  }).isRequired,
  logDefault: PropTypes.array
}

DebugLog.defaultProps = {
  uuid: undefined,
  socket: {
    on: () => undefined,
    off: () => undefined
  },
  logDefault: []
}

DebugLog.displayName = 'DebugLog'

export default DebugLog
