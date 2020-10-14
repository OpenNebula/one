import {
  createMuiTheme,
  responsiveFontSizes,
  createGenerateClassName
} from '@material-ui/core'

import UbuntuFont from 'client/assets/theme/fonts'
import { toolbar, breakpoints } from 'client/assets/theme/defaults'

const { xs, sm } = breakpoints

export const generateClassName = createGenerateClassName({
  productionPrefix: 'one-'
})

export default responsiveFontSizes(
  createMuiTheme({
    breakpoints: {
      values: breakpoints,
      keys: Object.keys(breakpoints)
    },
    typography: {
      fontFamily: [
        '"Ubuntu"',
        'Roboto',
        'Helvetica',
        'Arial',
        'sans-serif'
      ].join(',')
    },
    mixins: {
      toolbar: {
        minHeight: toolbar.regular,
        [`@media (min-width:${xs}px) and (orientation: landscape)`]: {
          minHeight: toolbar.xs
        },
        [`@media (min-width:${sm}px)`]: {
          minHeight: toolbar.sm
        }
      }
    },
    overrides: {
      MuiFormControl: {
        root: {
          margin: '.5rem 0'
        }
      },
      MuiExpansionPanel: {
        root: {
          minHeight: 56,
          boxShadow: 'none',
          '&:not(:last-child)': {
            borderBottom: 0
          },
          '&$expanded': {
            minHeight: 56,
            margin: '0'
          }
        },
        content: {
          '&$expanded': {
            margin: '0'
          }
        },
        expanded: {}
      },
      MuiExpansionPanelSummary: {
        root: {
          '&$disabled': {
            opacity: 1
          }
        },
        content: {
          margin: 8,
          '&$expanded': {
            margin: 8
          }
        },
        disabled: {},
        expanded: {}
      },
      MuiCssBaseline: {
        '@global': {
          '@font-face': [UbuntuFont]
        }
      }
    },
    palette: {
      common: { black: '#000', white: '#fff' },
      background: {
        paper: '#fff',
        default: '#fafafa'
      },
      primary: {
        light: 'rgba(191, 230, 242, 1)',
        main: 'rgba(64, 179, 217, 1)',
        dark: 'rgba(0, 152, 195, 1)',
        contrastText: '#fff'
      },
      secondary: {
        light: 'rgba(199, 201, 200, 1)',
        main: 'rgba(87, 92, 91, 1)',
        dark: 'rgba(53, 55, 53, 1)',
        contrastText: '#fff'
      },
      error: {
        light: '#e57373',
        main: '#f44336',
        dark: '#d32f2f',
        contrastText: '#fff'
      },
      text: {
        primary: 'rgba(0, 0, 0, 0.87)',
        secondary: 'rgba(0, 0, 0, 0.54)',
        disabled: 'rgba(0, 0, 0, 0.38)',
        hint: 'rgba(0, 0, 0, 0.38)'
      }
    }
  })
)
