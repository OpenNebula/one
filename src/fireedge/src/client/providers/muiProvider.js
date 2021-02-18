import * as React from 'react'
import PropTypes from 'prop-types'

import { CssBaseline, ThemeProvider, StylesProvider, useMediaQuery } from '@material-ui/core'
import { createTheme, generateClassName } from 'client/theme'
import { useGeneral } from 'client/hooks'
import { Setting } from 'client/constants'

const { SCHEMES: { DARK, LIGHT, SYSTEM } } = Setting

const MuiProvider = ({ theme: appTheme, children }) => {
  const { scheme } = useGeneral()
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')

  const changeThemeType = () => {
    const prefersScheme = prefersDarkMode ? DARK : LIGHT
    const userScheme = scheme === SYSTEM ? prefersScheme : scheme

    return createTheme(appTheme(userScheme))
  }

  const [muitheme, setTheme] = React.useState(changeThemeType)

  React.useEffect(() => {
    const jssStyles = document.querySelector('#jss-server-side')
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles)
    }
  }, [])

  React.useEffect(() => setTheme(changeThemeType), [scheme, prefersDarkMode])

  return (
    <ThemeProvider theme={muitheme}>
      <CssBaseline />
      <StylesProvider generateClassName={generateClassName}>
        {children}
      </StylesProvider>
    </ThemeProvider>
  )
}

MuiProvider.propTypes = {
  theme: PropTypes.func,
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ])
}

MuiProvider.defaultProps = {
  theme: () => {},
  children: undefined
}

export default MuiProvider
