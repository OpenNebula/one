import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Typography, lighten, darken } from '@material-ui/core'
import { addOpacityToColor } from 'client/utils'

const useStyles = makeStyles(theme => {
  const getBackgroundColor = theme.palette.type === 'dark' ? lighten : darken

  return {
    root: ({ stateColor = theme.palette.primary.main }) => ({
      color: getBackgroundColor(stateColor, 0.75),
      backgroundColor: addOpacityToColor(stateColor, 0.2),
      cursor: 'default',
      padding: theme.spacing('0.25rem', '0.5rem'),
      borderRadius: 2,
      textTransform: 'uppercase',
      fontSize: theme.typography.overline.fontSize,
      fontWeight: theme.typography.fontWeightBold
    })
  }
})

const StatusChip = memo(({ stateColor, children }) => {
  const classes = useStyles({ stateColor })

  return (
    <Typography component="span" className={classes.root}>
      {children}
    </Typography>
  )
},
(prev, next) => prev.stateColor === next.stateColor
)

StatusChip.propTypes = {
  stateColor: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.node
  ])
}

StatusChip.defaultProps = {
  stateColor: undefined,
  children: ''
}

StatusChip.displayName = 'StatusChip'

export default StatusChip
