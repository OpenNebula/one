import Color from 'client/constants/color'

export default (scheme = 'dark') => ({
  palette: {
    type: scheme,
    common: {
      black: '#000000',
      white: '#ffffff'
    },
    background: {
      paper: scheme === 'dark' ? '#2a2d3d' : '#ffffff',
      default: scheme === 'dark' ? '#222431' : '#f2f4f8'
    },
    primary: {
      light: '#2a2d3d',
      main: '#222431',
      dark: '#191924',
      contrastText: '#ffffff'
    },
    secondary: {
      light: '#fb8554',
      main: '#fa6c43',
      dark: '#fe5a23',
      contrastText: '#ffffff'
    },
    ...Color
  }
})
