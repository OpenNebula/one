import React, { memo, useState } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'

import { makeStyles } from '@material-ui/core'
import ChevronRightIcon from '@material-ui/icons/ChevronRight'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

import { DEBUG_LEVEL } from 'client/constants'
import AnsiHtml from 'client/components/DebugLog/ansiHtml'

const MAX_CHARS = 80

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.3em',
    padding: '0.5em 0',
    cursor: ({ isMoreThanMaxChars }) => isMoreThanMaxChars ? 'pointer' : 'default',
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
  const isMoreThanMaxChars = message?.length >= MAX_CHARS
  const [isCollapsed, setCollapse] = useState(() => isMoreThanMaxChars)
  const classes = useStyles({ isMoreThanMaxChars })

  return (
    <div
      className={clsx(classes.root, classes[severity])}
      onClick={() => setCollapse(prev => !prev)}
    >
      <div className={classes.arrow}>
        {isMoreThanMaxChars && (isCollapsed ? (
          <ChevronRightIcon fontSize='small' />
        ) : (
          <ExpandMoreIcon fontSize='small' />
        ))}
      </div>
      <div className={classes.time}>{timestamp}</div>
      {(isCollapsed && isMoreThanMaxChars) ? (
        <div className={classes.message}>{`${message?.slice(0, MAX_CHARS)}…`}</div>
      ) : (
        <div className={classes.message} dangerouslySetInnerHTML={{ __html: AnsiHtml(message) }} />
      )}
    </div>
  )
})

Message.propTypes = {
  timestamp: PropTypes.string,
  severity: PropTypes.oneOf(Object.keys(DEBUG_LEVEL)),
  message: PropTypes.string
}

Message.defaultProps = {
  timestamp: '',
  severity: DEBUG_LEVEL.DEBUG,
  message: ''
}

Message.displayName = 'Message'

export default Message
