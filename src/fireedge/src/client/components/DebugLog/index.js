import React, { useEffect, useState, memo } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'

import { makeStyles, Box } from '@material-ui/core'
import AutoScrollBox from 'client/components/AutoScrollBox'
import { DEBUG_LEVEL } from 'client/constants'

import AnsiHtml from 'client/components/DebugLog/ansiHtml'

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    marginBottom: '0.3em',
    padding: '0.5em 0',
    cursor: 'default',
    fontFamily: 'monospace',
    '&:hover': {
      background: '#333537'
    }
  },
  time: {
    paddingLeft: '0.5em',
    minWidth: '220px'
  },
  message: {
    color: '#fafafa'
  },
  [DEBUG_LEVEL.ERROR]: { borderLeft: `0.3em solid ${theme.palette.error.light}` },
  [DEBUG_LEVEL.WARN]: { borderLeft: `0.3em solid ${theme.palette.warning.main}` },
  [DEBUG_LEVEL.INFO]: { borderLeft: `0.3em solid ${theme.palette.info.main}` },
  [DEBUG_LEVEL.DEBUG]: { borderLeft: `0.3em solid ${theme.palette.debug.main}` }
}))

// --------------------------------------------
// MESSAGE COMPONENT
// --------------------------------------------

const Message = memo(({ timestamp = '', severity = DEBUG_LEVEL.DEBUG, message }) => {
  const classes = useStyles()
  const sanitize = AnsiHtml(message)

  return (
    <div className={clsx([classes.root, classes[severity]])}>
      <div className={classes.time}>{timestamp}</div>
      <div className={classes.message}>{sanitize}</div>
    </div>
  )
})

Message.propTypes = {
  timestamp: PropTypes.string,
  severity: PropTypes.string,
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
    <Box borderRadius={5} bgcolor={'#1d1f21'} width={1} height={1} style={{ fontSize: '1.1em', wordBreak: 'break-word' }}>
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
