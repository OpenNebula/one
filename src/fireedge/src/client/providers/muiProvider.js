import * as React from 'react'
import PropTypes from 'prop-types'

import { CssBaseline, ThemeProvider, StylesProvider } from '@material-ui/core'
import { createTheme, generateClassName } from 'client/theme'
import { useGeneral } from 'client/hooks'

const MuiProvider = ({ theme: appTheme, children }) => {
  const { theme } = useGeneral()

  const changeThemeType = () => createTheme(appTheme(theme))

  const [muitheme, setTheme] = React.useState(changeThemeType)

  React.useEffect(() => {
    const jssStyles = document.querySelector('#jss-server-side')
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles)
    }
  }, [])

  React.useEffect(() => { setTheme(changeThemeType) }, [theme])

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
