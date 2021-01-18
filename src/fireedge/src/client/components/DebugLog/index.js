import React, { useEffect, useState, memo } from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Box } from '@material-ui/core'
import AutoScrollBox from 'client/components/AutoScrollBox'
import Message from 'client/components/DebugLog/message'
import { DEBUG_LEVEL } from 'client/constants'

const debugLogStyles = makeStyles(theme => ({
  root: {
    fontSize: '1.1em',
    wordBreak: 'break-word',
    '&::-webkit-scrollbar': {
      width: 14
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundClip: 'content-box',
      border: '4px solid transparent',
      borderRadius: 7,
      boxShadow: 'inset 0 0 0 10px',
      color: theme.palette.primary.light
    }
  }
}))

const DebugLog = memo(({ uuid, socket, logDefault }) => {
  const classes = debugLogStyles()
  const [log, setLog] = useState(logDefault)

  useEffect(() => {
    uuid && socket.on((socketData = {}) => {
      const { id, data, command, commandId } = socketData

      id === uuid && setLog(prev => ({
        ...prev,
        [command]: {
          [commandId]: [...(prev?.[command]?.[commandId] ?? []), data]
        }
      }))
    })
    return () => uuid && socket.off()
  }, [])

  return (
    <Box borderRadius={5} bgcolor={'#1d1f21'} width={1} height={1} className={classes.root}>
      <AutoScrollBox scrollBehavior="auto">
        {Object.entries(log)?.map(([command, entries]) =>
          Object.entries(entries)?.map(([commandId, messages]) =>
            messages?.map((data, index) => {
              const key = `${index}-${command}-${commandId}`

              try {
                const { timestamp, severity, message } = JSON.parse(data)
                const decryptMessage = atob(message)

                return (
                  <Message
                    key={key}
                    timestamp={timestamp}
                    severity={severity}
                    message={decryptMessage}
                  />
                )
              } catch {
                const severity = data.includes(DEBUG_LEVEL.ERROR)
                  ? DEBUG_LEVEL.ERROR
                  : data.includes(DEBUG_LEVEL.INFO)
                    ? DEBUG_LEVEL.INFO
                    : data.includes(DEBUG_LEVEL.WARN)
                      ? DEBUG_LEVEL.WARN
                      : DEBUG_LEVEL.DEBUG

                return (
                  <Message key={key} severity={severity} message={data} />
                )
              }
            })
          )
        )}
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
  logDefault: PropTypes.object
}

DebugLog.defaultProps = {
  uuid: undefined,
  socket: {
    on: () => undefined,
    off: () => undefined
  },
  logDefault: {}
}

DebugLog.displayName = 'DebugLog'

export default DebugLog
