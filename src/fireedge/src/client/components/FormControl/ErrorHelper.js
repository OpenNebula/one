import React, { memo } from 'react'
import { string } from 'prop-types'

import { Box, makeStyles, Typography } from '@material-ui/core'
import { Info as InfoIcon } from '@material-ui/icons'
import { Tr } from 'client/components/HOC/Translate'

const useStyles = makeStyles(theme => ({
  root: {
    color: theme.palette.error.dark,
    display: 'flex',
    alignItems: 'center'
  },
  icon: {
    fontSize: 16
  },
  text: {
    ...theme.typography.body1,
    paddingLeft: theme.spacing(1),
    overflowWrap: 'anywhere'
  }
}))

const ErrorHelper = memo(({ label, ...rest }) => {
  const classes = useStyles()

  return (
    <Box component="span" className={classes.root} {...rest}>
      <InfoIcon className={classes.icon} />
      <Typography
        className={classes.text}
        component="span"
        data-cy="error-text"
      >
        {Tr(label)}
      </Typography>
    </Box>
  )
})

ErrorHelper.propTypes = {
  label: string
}

ErrorHelper.defaultProps = {
  label: 'Error'
}

ErrorHelper.displayName = 'ErrorHelper'

export default ErrorHelper
