import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import { CssBaseline, ThemeProvider, StylesProvider } from '@material-ui/core'
import { createTheme, generateClassName } from 'client/theme'

const MuiProvider = ({ theme: appTheme, children }) => {
  const [theme, setTheme] = useState(() => createTheme(appTheme))

  useEffect(() => {
    const jssStyles = document.querySelector('#jss-server-side')
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles)
    }
  }, [])

  useEffect(() => {
    appTheme && setTheme(() => createTheme(appTheme))
  }, [appTheme])

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
  theme: PropTypes.object,
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ])
}

MuiProvider.defaultProps = {
  theme: {},
  children: undefined
}

export default MuiProvider
