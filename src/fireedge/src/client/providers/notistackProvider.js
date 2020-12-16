import * as React from 'react'
import PropTypes from 'prop-types'

import { SnackbarProvider } from 'notistack'
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles(({ palette }) => ({
  variantSuccess: {
    backgroundColor: `${palette.success.main} !important`
  },
  variantError: {
    backgroundColor: `${palette.error.main} !important`
  },
  variantInfo: {
    backgroundColor: `${palette.info.main} !important`
  },
  variantWarning: {
    backgroundColor: `${palette.warning.main} !important`
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
