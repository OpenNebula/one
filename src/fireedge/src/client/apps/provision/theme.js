export default (mode = 'dark') => ({
  palette: {
    type: mode,
    common: {
      black: '#000000',
      white: '#ffffff'
    },
    background: {
      paper: mode === 'dark' ? '#2e3440' : '#ffffff',
      // PREV paper: mode === 'dark' ? '#2a2d3d' : '#eceff4',
      default: mode === 'dark' ? '#242933' : '#f2f4f8'
      // PREV default: mode === 'dark' ? '#222431' : '#d8dee9'
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
    error: {
      light: '#e57373',
      main: '#e04d40',
      dark: '#d32f2f',
      contrastText: '#ffffff'
    },
    debug: {
      main: '#7b7c7e'
    }
  }
})
