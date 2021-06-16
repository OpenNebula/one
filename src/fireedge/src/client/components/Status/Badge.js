import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Badge } from '@material-ui/core'

const useStyles = makeStyles(theme => ({
  badge: {
    backgroundColor: ({ stateColor }) => stateColor,
    color: ({ stateColor }) => stateColor,
    transform: ({ customTransform }) => customTransform,
    boxShadow: '0 0 0 2px transparent',
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
    from: {
      transform: 'scale(.8)',
      opacity: 1
    },
    to: {
      transform: 'scale(2.4)',
      opacity: 0
    }
  }
}))

const StatusBadge = memo(({ stateColor, children, customTransform, ...props }) => {
  const classes = useStyles({ stateColor, customTransform })

  return (
    <Badge
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      classes={{ badge: classes.badge }}
      overlap='circle'
      variant='dot'
      {...props}
    >
      {children}
    </Badge>
  )
}, (prev, next) => prev.stateColor === next.stateColor)

StatusBadge.propTypes = {
  stateColor: PropTypes.string,
  customTransform: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.node
  ])
}

StatusBadge.defaultProps = {
  stateColor: undefined,
  customTransform: undefined,
  children: ''
}

StatusBadge.displayName = 'StatusBadge'

export default StatusBadge
