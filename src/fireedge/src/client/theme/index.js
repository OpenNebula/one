import {
  createMuiTheme,
  responsiveFontSizes,
  createGenerateClassName
} from '@material-ui/core'

import defaultTheme from 'client/theme/defaults'

import { defaultApps } from 'server/utils/constants/defaults'
import flowTheme from 'client/theme/flow'
import provisionTheme from 'client/theme/provision'

export const THEMES = {
  [defaultApps.flow.theme]: flowTheme,
  [defaultApps.provision.theme]: provisionTheme
}

export const generateClassName = createGenerateClassName({
  productionPrefix: 'one-'
})

export const createTheme = theme => responsiveFontSizes(
  createMuiTheme({ ...defaultTheme, ...theme })
)
