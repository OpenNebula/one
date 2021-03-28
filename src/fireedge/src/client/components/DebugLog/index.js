import React, { useEffect, useState, memo } from 'react'
import PropTypes from 'prop-types'

import { makeStyles } from '@material-ui/core'
import AutoScrollBox from 'client/components/AutoScrollBox'
import MessageList from 'client/components/DebugLog/messagelist'
import Filters from 'client/components/DebugLog/filters'
import * as LogUtils from 'client/components/DebugLog/utils'

const debugLogStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    flexFlow: 'column',
    height: '100%'
  },
  containerScroll: {
    width: '100%',
    flexGrow: 1,
    overflow: 'auto',
    borderRadius: 5,
    backgroundColor: '#1d1f21',
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

const DebugLog = memo(({ uuid, socket, logDefault, title }) => {
  const classes = debugLogStyles()

  const [log, setLog] = useState(logDefault)

  const [filters, setFilters] = useState(() => ({
    command: undefined,
    severity: undefined
  }))

  useEffect(() => {
    uuid && socket?.on((socketData = {}) => {
      socketData.id === uuid &&
        setLog(prevLog => LogUtils.concatNewMessageToLog(prevLog, socketData))
    })
    return () => uuid && socket?.off()
  }, [])

  return (
    <div className={classes.root}>
      {title}

      <Filters log={log} filters={filters} setFilters={setFilters} />

      <div className={classes.containerScroll}>
        <AutoScrollBox scrollBehavior="auto">
          <MessageList log={log} filters={filters} />
        </AutoScrollBox>
      </div>
    </div>
  )
}, (prev, next) => prev.uuid === next.uuid)

DebugLog.propTypes = {
  uuid: PropTypes.string,
  socket: PropTypes.shape({
    on: PropTypes.func.isRequired,
    off: PropTypes.func.isRequired
  }).isRequired,
  logDefault: PropTypes.object,
  title: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.string
  ])
}

DebugLog.defaultProps = {
  uuid: undefined,
  socket: {
    on: () => undefined,
    off: () => undefined
  },
  logDefault: {},
  title: null
}

DebugLog.displayName = 'DebugLog'

export default DebugLog

export { LogUtils }
