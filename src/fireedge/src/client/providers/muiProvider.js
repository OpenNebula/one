import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import { CssBaseline, ThemeProvider, StylesProvider } from '@material-ui/core'
import { createTheme, generateClassName, THEMES } from 'client/theme'
import { APPS } from 'client/constants'

const MuiProvider = ({ app, children }) => {
  const [theme, setTheme] = useState(() => createTheme())

  useEffect(() => {
    const jssStyles = document.querySelector('#jss-server-side')
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles)
    }
  }, [])

  useEffect(() => {
    app && setTheme(() => createTheme(THEMES[app]))
  }, [app])

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
  app: PropTypes.oneOf([undefined, ...Object.keys(APPS)]),
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ])
}

MuiProvider.defaultProps = {
  app: undefined,
  children: undefined
}

export default MuiProvider
