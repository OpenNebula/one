import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Badge } from '@material-ui/core'

const useStyles = makeStyles(theme => ({
  badge: {
    backgroundColor: ({ stateColor }) => stateColor,
    color: ({ stateColor }) => stateColor,
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: '$ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""'
    }
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0
    }
  }
}))

const StatusBadge = memo(({ stateColor, children }) => {
  const classes = useStyles({ stateColor })

  return (
    <Badge
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      classes={{ badge: classes.badge }}
      overlap="circle"
      variant="dot"
    >
      {children}
    </Badge>
  )
},
(prev, next) => prev.stateColor === next.stateColor
)

StatusBadge.propTypes = {
  stateColor: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.node
  ])
}

StatusBadge.defaultProps = {
  stateColor: undefined,
  children: ''
}

StatusBadge.displayName = 'StatusBadge'

export default StatusBadge
