import React, { useEffect } from 'react'
import PropTypes from 'prop-types'

import { CssBaseline, ThemeProvider, StylesProvider } from '@material-ui/core'
import theme, { generateClassName } from 'client/theme'

const MuiProvider = ({ children }) => {
  useEffect(() => {
    const jssStyles = document.querySelector('#jss-server-side')
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles)
    }
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <StylesProvider generateClassName={generateClassName}>
        {children}
      </StylesProvider>
    </ThemeProvider>
  )
}

MuiProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ])
}

MuiProvider.defaultProps = {
  children: undefined
}

export default MuiProvider
