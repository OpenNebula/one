import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Typography } from '@material-ui/core'
import { addOpacityToColor } from 'client/utils'

const useStyles = makeStyles(theme => ({
  root: ({ stateColor }) => ({
    color: stateColor,
    backgroundColor: addOpacityToColor(stateColor, 0.08),
    cursor: 'default',
    padding: theme.spacing('0.25rem', '0.5rem'),
    minWidth: 20,
    borderRadius: 2,
    textTransform: 'uppercase',
    fontSize: theme.typography.overline.fontSize,
    fontWeight: theme.typography.fontWeightBold,
    lineHeight: 'normal'
  })
}))

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
