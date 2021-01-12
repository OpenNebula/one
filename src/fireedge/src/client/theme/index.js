import {
  createMuiTheme,
  responsiveFontSizes,
  createGenerateClassName
} from '@material-ui/core'

import defaultTheme from 'client/theme/defaults'

export const generateClassName = createGenerateClassName({
  productionPrefix: 'one-'
})

export const createTheme = theme => responsiveFontSizes(
  createMuiTheme({ ...defaultTheme, ...theme })
)
