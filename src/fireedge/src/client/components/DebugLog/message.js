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
    marginBottom: '0.3em',
    padding: '0.5em 0',
    fontSize: '14px',
    fontFamily: 'monospace',
    color: '#fafafa',
    '&:hover': {
      background: '#333537'
    },
    display: 'grid',
    gridTemplateColumns: '32px 220px 1fr',
    gap: '1em',
    alignItems: 'center',
    cursor: ({ isMoreThanMaxChars }) =>
      isMoreThanMaxChars ? 'pointer' : 'default'
  },
  message: {
    transition: 'all 0.3s ease-out',
    whiteSpace: 'pre-line'
  },
  [DEBUG_LEVEL.ERROR]: { borderLeft: `0.3em solid ${theme.palette.error.light}` },
  [DEBUG_LEVEL.WARN]: { borderLeft: `0.3em solid ${theme.palette.warning.light}` },
  [DEBUG_LEVEL.INFO]: { borderLeft: `0.3em solid ${theme.palette.info.light}` },
  [DEBUG_LEVEL.DEBUG]: { borderLeft: `0.3em solid ${theme.palette.debug.main}` }
}))

const Message = memo(({ timestamp, severity, message }) => {
  const isMoreThanMaxChars = message?.length >= MAX_CHARS
  const [isCollapsed, setCollapse] = useState(() => isMoreThanMaxChars)
  const classes = useStyles({ isMoreThanMaxChars })

  const textToShow = (isCollapsed && isMoreThanMaxChars)
    ? `${message?.slice(0, MAX_CHARS)}…`
    : message

  const html = AnsiHtml(textToShow)

  return (
    <div
      className={clsx(classes.root, classes[severity])}
      onClick={() => setCollapse(prev => !prev)}
    >
      <span>
        {isMoreThanMaxChars && (isCollapsed ? (
          <ChevronRightIcon fontSize='small' />
        ) : (
          <ExpandMoreIcon fontSize='small' />
        ))}
      </span>
      <div>{timestamp}</div>
      <div className={classes.message}
        dangerouslySetInnerHTML={{ __html: html }} />
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
