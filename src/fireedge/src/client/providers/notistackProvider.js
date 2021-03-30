import * as React from 'react'
import PropTypes from 'prop-types'

import { SnackbarProvider } from 'notistack'
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles(({ palette }) => ({
  containerRoot: {
    marginLeft: 20,
    wordBreak: 'break-all'
  },
  variantSuccess: {
    backgroundColor: `${palette.success.main} !important`,
    color: palette.success.contrastText
  },
  variantError: {
    backgroundColor: `${palette.error.main} !important`,
    color: palette.error.contrastText
  },
  variantInfo: {
    backgroundColor: `${palette.debug.main} !important`,
    color: palette.debug.contrastText
  },
  variantWarning: {
    backgroundColor: `${palette.warning.main} !important`,
    color: palette.warning.contrastText
  }
}))

const NotistackProvider = ({ children }) => {
  const classes = useStyles()

  return (
    <SnackbarProvider
      hideIconVariant
      classes={classes}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      {children}
    </SnackbarProvider>
  )
}

NotistackProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ])
}

NotistackProvider.defaultProps = {
  children: undefined
}

export default NotistackProvider
