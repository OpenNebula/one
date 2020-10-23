import {
  createMuiTheme,
  responsiveFontSizes,
  createGenerateClassName
} from '@material-ui/core'

import defaultTheme from 'client/theme/defaults'

import { APPS } from 'client/constants'
import fireedgeTheme from 'client/theme/fireedge'
import provisionTheme from 'client/theme/provision'

export const THEMES = {
  [APPS.fireedge]: fireedgeTheme,
  [APPS.provision]: provisionTheme
}

export const generateClassName = createGenerateClassName({
  productionPrefix: 'one-'
})

export const createTheme = theme => responsiveFontSizes(
  createMuiTheme({ ...defaultTheme, ...theme })
)
