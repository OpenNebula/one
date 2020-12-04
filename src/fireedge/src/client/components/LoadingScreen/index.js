import * as React from 'react'

import { makeStyles, Box } from '@material-ui/core'
import Logo from 'client/icons/logo'

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%',
    height: '100vh',
    backgroundColor: theme.palette.background.default,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'fixed',
    zIndex: 10000
  }
}))

const LoadingScreen = () => {
  const classes = useStyles()

  return (
    <Box className={classes.root}>
      <Logo width={360} height={360} spinner withText />
    </Box>
  )
}

export default LoadingScreen
