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

export default {
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
        '@font-face': [UbuntuFont],
        '.fade': {
          '&-enter': {
            opacity: 0
          },
          '&-enter-active': {
            opacity: 1,
            transition: 'opacity 100ms'
          },
          '&-exit': {
            opacity: 1,
            transform: 'scale(1)'
          },
          '&-exit-active': {
            opacity: 0,
            transition: 'opacity 100ms'
          }
        }
      }
    }
  }
}
