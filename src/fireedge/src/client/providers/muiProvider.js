/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
/* eslint-disable jsdoc/require-jsdoc */
import { useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'

import {
  CssBaseline,
  ThemeProvider,
  StyledEngineProvider,
  useMediaQuery,
} from '@mui/material'
import StylesProvider from '@mui/styles/StylesProvider'
import AdapterLuxon from '@mui/lab/AdapterLuxon'
import LocalizationProvider from '@mui/lab/LocalizationProvider'

import { createTheme, generateClassName } from 'client/theme'
import { useAuth } from 'client/features/Auth'
import { SCHEMES } from 'client/constants'

const { DARK, LIGHT, SYSTEM } = SCHEMES

const MuiProvider = ({ theme: appTheme, children }) => {
  const { settings: { SCHEME } = {} } = useAuth()
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')

  const muiTheme = useMemo(() => {
    const prefersScheme = prefersDarkMode ? DARK : LIGHT
    const newScheme = SCHEME === SYSTEM ? prefersScheme : SCHEME

    return createTheme(appTheme, newScheme)
  }, [SCHEME, prefersDarkMode])

  useEffect(() => {
    const jssStyles = document.querySelector('#jss-server-side')
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles)
    }
  }, [])

  return (
    <LocalizationProvider dateAdapter={AdapterLuxon}>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={muiTheme}>
          <CssBaseline enableColorScheme />
          <StylesProvider generateClassName={generateClassName}>
            {children}
          </StylesProvider>
        </ThemeProvider>
      </StyledEngineProvider>
    </LocalizationProvider>
  )
}

MuiProvider.propTypes = {
  theme: PropTypes.object,
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
  ]),
}

export default MuiProvider
