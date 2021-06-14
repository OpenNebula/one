import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { withStyles } from '@material-ui/core/styles'
import { Typography, LinearProgress } from '@material-ui/core'

const BorderLinearProgress = withStyles(({ palette }) => ({
  root: {
    height: 15,
    borderRadius: 5
  },
  colorPrimary: {
    backgroundColor: palette.grey[palette.type === 'light' ? 200 : 700]
  },
  bar: {
    borderRadius: 5,
    backgroundColor: palette.secondary.main
  }
}))(LinearProgress)

const LinearProgressWithLabel = memo(({ value, label }) => (
  <div style={{ textAlign: 'end' }}>
    <Typography component='span' variant='body2'>{label}</Typography>
    <BorderLinearProgress variant='determinate' value={value} />
  </div>
), (prev, next) => prev.value === next.value && prev.label === next.label)

LinearProgressWithLabel.propTypes = {
  value: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired
}

LinearProgressWithLabel.displayName = 'LinearProgressWithLabel'

export default LinearProgressWithLabel
