import { UbuntuFont } from 'client/theme/fonts'

export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 960,
  lg: 1280,
  xl: 1920,
  // DEVICES
  tablet: 640,
  laptop: 1024,
  desktop: 1280
}

export const toolbar = {
  regular: 56,
  xs: 48,
  sm: 64
}

export const footer = {
  regular: 30
}

export const sidebar = {
  minified: 60,
  fixed: 240
}

/** @type {import('@material-ui/core').ThemeOptions} */
export default {
  breakpoints: {
    values: breakpoints,
    keys: Object.keys(breakpoints)
  },
  typography: {
    fontFamily: [
      'Ubuntu',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"'
    ].join(',')
  },
  mixins: {
    toolbar: {
      minHeight: toolbar.regular,
      [`@media (min-width:${breakpoints.xs}px) and (orientation: landscape)`]: {
        minHeight: toolbar.xs
      },
      [`@media (min-width:${breakpoints.sm}px)`]: {
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
    MuiCssBaseline: {
      '@global': {
        '@font-face': [UbuntuFont]
      }
    }
  }
}
