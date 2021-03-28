import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Typography, Chip } from '@material-ui/core'

const useStyles = makeStyles(() => ({
  root: {
    display: 'inline-flex',
    gap: '1em',
    width: '100%'
  },
  label: {
    flexGrow: 1
  }
}))

const DevTypography = memo(({ label, labelProps, color, chipProps }) => {
  const classes = useStyles()

  return (
    <span className={classes.root}>
      <Typography {...labelProps} className={classes.label}>
        {label}
      </Typography>
      <Chip size='small' label='DEV' color={color} {...chipProps} />
    </span>
  )
})

DevTypography.propTypes = {
  chipProps: PropTypes.object,
  color: PropTypes.string,
  label: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string.isRequired
  ]),
  labelProps: PropTypes.object
}

DevTypography.defaultProps = {
  chipProps: undefined,
  color: 'secondary',
  label: '',
  labelProps: undefined
}

DevTypography.displayName = 'DevTypography'

export default DevTypography
