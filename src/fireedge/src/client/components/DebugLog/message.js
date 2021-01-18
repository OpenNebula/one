import React, { memo, useState, useRef } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'

import { makeStyles } from '@material-ui/core'
import ChevronRightIcon from '@material-ui/icons/ChevronRight'

import { DEBUG_LEVEL } from 'client/constants'
import AnsiHtml from 'client/components/DebugLog/ansiHtml'

const MAX_CHARS = 80

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.3em',
    padding: '0.5em 0',
    cursor: ({ isCollapsed }) => isCollapsed ? 'pointer' : 'default',
    fontFamily: 'monospace',
    '&:hover': {
      background: '#333537'
    }
  },
  arrow: {
    padding: '0 0.5em',
    width: '32px'
  },
  time: {
    minWidth: '220px'
  },
  message: {
    color: '#fafafa'
  },
  [DEBUG_LEVEL.ERROR]: { borderLeft: `0.3em solid ${theme.palette.error.light}` },
  [DEBUG_LEVEL.WARN]: { borderLeft: `0.3em solid ${theme.palette.warning.light}` },
  [DEBUG_LEVEL.INFO]: { borderLeft: `0.3em solid ${theme.palette.info.light}` },
  [DEBUG_LEVEL.DEBUG]: { borderLeft: `0.3em solid ${theme.palette.debug.main}` }
}))

// --------------------------------------------
// MESSAGE COMPONENT
// --------------------------------------------

const Message = memo(({ timestamp, severity, message }) => {
  const [isCollapsed, setCollapse] = useState(() => message?.length >= MAX_CHARS)
  const classes = useStyles({ isCollapsed })
  const sanitize = AnsiHtml(message)

  return (
    <div
      className={clsx(classes.root, classes[severity])}
      onClick={() => setCollapse(false)}
    >
      <div className={classes.arrow}>
        {isCollapsed && <ChevronRightIcon fontSize='small' />}
      </div>
      <div className={classes.time}>{timestamp}</div>
      <div className={classes.message}>
        {isCollapsed ? `${sanitize.slice(0, MAX_CHARS)}...` : sanitize}
      </div>
    </div>
  )
})

Message.propTypes = {
  timestamp: PropTypes.string,
  severity: PropTypes.oneOf([Object.keys(DEBUG_LEVEL)]),
  message: PropTypes.string
}

Message.defaultProps = {
  timestamp: '',
  severity: DEBUG_LEVEL.DEBUG,
  message: ''
}

Message.displayName = 'Message'

export default Message
