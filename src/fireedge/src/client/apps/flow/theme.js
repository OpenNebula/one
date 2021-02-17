import Color from 'client/constants/color'

export default {
  palette: {
    type: 'dark',
    common: { black: '#000', white: '#ffffff' },
    background: {
      paper: '#2a2d3d',
      default: '#222431'
    },
    primary: {
      light: '#2a2d3d',
      main: '#222431',
      dark: '#191924',
      contrastText: '#fff'
    },
    secondary: {
      light: 'rgba(191, 230, 242, 1)',
      main: 'rgba(64, 179, 217, 1)',
      dark: 'rgba(0, 152, 195, 1)',
      contrastText: '#fff'
    },
    ...Color
  }
}
