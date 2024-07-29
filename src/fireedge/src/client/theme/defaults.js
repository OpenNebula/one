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
import { createTheme, ThemeOptions, colors, alpha } from '@mui/material'
import { iconButtonClasses } from '@mui/material/IconButton'
import { buttonClasses } from '@mui/material/Button'
import { NavArrowDown as ExpandMoreIcon } from 'iconoir-react'

import { UbuntuFont } from 'client/theme/fonts'
import { SCHEMES } from 'client/constants'

const defaultDarkTheme = createTheme({ palette: { mode: 'dark' } })
const defaultLightTheme = createTheme({ palette: { mode: 'light' } })
const { grey } = colors
const black = '#1D1D1D'
const white = '#ffffff'
const bgBlueGrey = '#f2f4f8'

const defaultPrimary = {
  light: '#2a2d3d',
  main: '#222431',
  dark: '#191924',
  contrastText: '#ffffff',
}

const systemFont = [
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  'Roboto',
  '"Helvetica Neue"',
  'Arial',
  'sans-serif',
  '"Apple Color Emoji"',
  '"Segoe UI Emoji"',
  '"Segoe UI Symbol"',
]

export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
}

export const toolbar = {
  regular: 56,
  xs: 48,
  sm: 64,
}

export const footer = {
  regular: 30,
}

export const sidebar = {
  minified: 60,
  fixed: 250,
}

const buttonSvgStyle = {
  fontSize: '1.25rem',
  width: '1em',
  height: '1em',
}

/**
 * @param {ThemeOptions} appTheme - App theme
 * @param {SCHEMES} mode - Scheme type
 * @returns {ThemeOptions} Material theme options
 */
const createAppTheme = (appTheme, mode = SCHEMES.DARK) => {
  const isDarkMode = `${mode}`.toLowerCase() === SCHEMES.DARK

  const { primary = defaultPrimary, secondary } = appTheme?.palette || {}
  const defaultContrastText = isDarkMode ? white : 'rgba(0, 0, 0, 0.87)'
  const defaultTheme = isDarkMode ? defaultDarkTheme : defaultLightTheme

  const background = {
    paper: isDarkMode ? primary.light : white,
    default: isDarkMode ? primary.main : bgBlueGrey,
  }

  return {
    palette: {
      mode,
      primary,
      secondary,
      common: {
        black,
        white,
      },
      background,
      error: {
        100: '#e98e7f',
        200: '#ee6d58',
        300: '#e95f48',
        400: '#e34e3b',
        500: '#dd452c',
        600: '#d73727',
        700: '#cf231c',
        800: '#c61414',
        light: '#ee6d58',
        main: '#cf231c',
        dark: '#c61414',
        contrastText: white,
      },
      warning: {
        100: '#fff4db',
        200: '#ffedc2',
        300: '#ffe4a3',
        400: '#ffc980',
        500: '#fcc419',
        600: '#fab005',
        700: '#f1a204',
        800: '#db9a00',
        light: '#ffe4a3',
        main: '#f1a204',
        dark: '#f1a204',
        contrastText: defaultContrastText,
      },
      info: {
        light: '#64b5f6',
        main: '#2196f3',
        dark: '#01579b',
        contrastText: defaultContrastText,
      },
      success: {
        100: '#bce1bd',
        200: '#a6d7a8',
        300: '#8fcd92',
        400: '#79c37c',
        500: '#62b966',
        600: '#4caf50',
        700: '#419b46',
        800: '#388e3c',
        light: '#3adb76',
        main: '#4caf50',
        dark: '#388e3c',
        contrastText: defaultContrastText,
      },
      debug: {
        light: grey[300],
        main: grey[600],
        dark: grey[700],
        contrastText: white,
      },
    },
    breakpoints: {
      values: breakpoints,
      keys: Object.keys(breakpoints),
    },
    typography: {
      fontFamily: [UbuntuFont.fontFamily, ...systemFont].join(','),
      fontFamilyCode: [
        'Consolas',
        'Menlo',
        'Monaco',
        'Andale Mono',
        'Ubuntu Mono',
        'monospace',
      ].join(','),
      fontFamilySystem: systemFont.join(','),
      h1: {
        fontSize: 'clamp(2.625rem, 1.2857rem + 3.5714vw, 4rem)',
        fontWeight: 800,
        lineHeight: 78 / 70,
      },
      h2: {
        fontSize: 'clamp(1.5rem, 0.9643rem + 1.4286vw, 2.25rem)',
        fontWeight: 800,
        lineHeight: 44 / 36,
      },
      h3: {
        fontSize: defaultTheme.typography.pxToRem(36),
        lineHeight: 44 / 36,
        letterSpacing: 0,
      },
      h4: {
        fontSize: defaultTheme.typography.pxToRem(28),
        lineHeight: 42 / 28,
        letterSpacing: 0,
      },
      h5: {
        fontSize: defaultTheme.typography.pxToRem(24),
        lineHeight: 36 / 24,
        letterSpacing: 0,
      },
      h6: {
        fontSize: defaultTheme.typography.pxToRem(20),
        lineHeight: 30 / 20,
        letterSpacing: 0,
      },
      button: {
        fontSize: defaultTheme.typography.pxToRem(12),
        textTransform: 'initial',
        fontWeight: 500,
        letterSpacing: 0,
      },
      subtitle1: {
        fontSize: defaultTheme.typography.pxToRem(18),
        lineHeight: 24 / 18,
        letterSpacing: 0,
        fontWeight: 500,
      },
      body1: {
        fontSize: defaultTheme.typography.pxToRem(16),
        lineHeight: 24 / 16,
        letterSpacing: 0,
      },
      body2: {
        fontSize: defaultTheme.typography.pxToRem(14),
        lineHeight: 21 / 14,
        letterSpacing: 0,
      },
      caption: {
        display: 'inline-block',
        fontSize: defaultTheme.typography.pxToRem(12),
        lineHeight: 18 / 12,
        letterSpacing: 0,
        fontWeight: 500,
      },
      fontWeightLight: 300,
      fontWeightRegular: 400,
      fontWeightMedium: 500,
      fontWeightBold: 700,
      fontWeightExtraBold: 800,
    },
    mixins: {
      toolbar: {
        minHeight: toolbar.regular,
        [`@media (min-width:${breakpoints.xs}px) and (orientation: landscape)`]:
          {
            minHeight: toolbar.xs,
          },
        [`@media (min-width:${breakpoints.sm}px)`]: {
          minHeight: toolbar.sm,
        },
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '@font-face': UbuntuFont,
          '*::-webkit-scrollbar': {
            width: 14,
          },
          '*::-webkit-scrollbar-thumb': {
            backgroundClip: 'content-box',
            border: '4px solid transparent',
            borderRadius: 7,
            boxShadow: 'inset 0 0 0 10px',
            color: secondary.light,
          },
          '.loading_screen': {
            width: '100%',
            height: '100vh',
            backgroundColor: 'background.default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'fixed',
            zIndex: 10000,
          },
          '.description__link': {
            margin: 0,
            color: isDarkMode ? secondary.main : secondary.dark,
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
          },
          fieldset: { border: 'none' },
        },
      },
      MuiTypography: {
        variants: [
          {
            props: { variant: 'underline' },
            style: {
              padding: '0 1em 0.2em 0.5em',
              borderBottom: `2px solid ${secondary.main}`,
              // subtitle1 variant is used for the underline
              fontSize: defaultTheme.typography.pxToRem(18),
              lineHeight: 24 / 18,
              letterSpacing: 0,
              fontWeight: 500,
            },
          },
        ],
      },
      MuiPaper: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: { backgroundImage: 'unset' },
        },
        variants: [
          {
            props: { variant: 'transparent' },
            style: { backgroundColor: 'transparent' },
          },
        ],
      },
      MuiButtonBase: {
        defaultProps: {
          disableTouchRipple: true,
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            '&.Mui-selected, &.Mui-selected:hover': {
              backgroundColor: alpha(secondary.main, 0.6),
            },
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableTouchRipple: true,
        },
        styleOverrides: {
          root: {
            padding: '5px 16px',
            '& svg:nth-of-type(1)': buttonSvgStyle,
          },
          endIcon: {
            marginLeft: 4,
            width: '1rem',
            height: '1rem',
          },
          text: {
            color: isDarkMode ? white : grey[900],
            '&:hover': {
              backgroundColor: isDarkMode
                ? alpha(white, 0.1)
                : alpha(grey[900], 0.1),
            },
          },
          outlined: {
            border: '1px solid',
            borderColor: isDarkMode
              ? alpha(grey[100], 0.45)
              : alpha(grey[700], 0.45),
            borderRadius: defaultTheme.shape.borderRadius,
            color: isDarkMode ? white : grey[900],
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: { '& svg:nth-of-type(1)': buttonSvgStyle },
        },
        variants: [
          {
            props: { color: 'default' },
            style: { '&:hover': { color: secondary.main } },
          },
        ],
      },
      MuiIcon: {
        styleOverrides: {
          root: { '& svg:nth-of-type(1)': buttonSvgStyle },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            padding: '0 2px',
            boxShadow: 'none',
            borderStyle: 'solid',
            borderColor: alpha(grey[100], 0.1),
            borderWidth: 0,
            borderBottomWidth: 'thin',
            backgroundColor: primary.main,
            [`& .${iconButtonClasses.root}, & .${buttonClasses.root}`]: {
              color: white,
              border: 'none',
              backgroundColor: 'transparent',
              '&:hover': {
                border: 'none',
                backgroundColor: 'transparent',
                color: alpha(white, 0.7),
              },
            },
          },
        },
      },
      MuiLink: {
        defaultProps: {
          underline: 'hover',
        },
      },
      MuiFormControl: {
        styleOverrides: {
          root: {
            margin: '.5rem 0',
          },
        },
      },
      MuiFormLabel: {
        styleOverrides: {
          root: {
            padding: '0 2em 0 0',
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
          size: 'small',
          color: 'secondary',
          SelectProps: {
            native: true,
          },
        },
      },
      MuiTabs: {
        defaultProps: {
          indicatorColor: 'secondary',
        },
        styleOverrides: {
          root: {
            backgroundColor: background.paper,
            borderRadius: `8px 8px 0 0`,
            border: `thin solid ${secondary.main}`,
            paddingInline: '1rem',
          },
          flexContainer: {
            height: '100%',
            paddingBlock: '0.5em',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            color: 'text.secondary',
            textTransform: 'capitalize',
            fontSize: '1rem',
            padding: '0 1rem',
            minHeight: '100%',
            border: 0,
            borderRadius: 6,
            '&:hover': {
              background: defaultTheme.palette.action.selected,
              transition: 'background .12s ease-in-out',
            },
            '&.Mui-selected': {
              color: isDarkMode
                ? secondary.main
                : defaultTheme.palette.text.primary,
            },
          },
        },
      },
      MuiToggleButtonGroup: {
        styleOverrides: {
          root: {
            backgroundColor: 'background.default',
          },
        },
        defaultProps: {
          color: 'secondary',
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 700,
            color: isDarkMode ? grey[300] : grey[700],
            borderColor: isDarkMode ? secondary[500] : grey[400],
            '&.Mui-selected': {
              borderColor: `${secondary[500]} !important`,
              color: isDarkMode ? white : secondary[800],
              backgroundColor: isDarkMode
                ? alpha(secondary[800], 0.2)
                : secondary[100],
            },
          },
        },
      },
      MuiList: {
        defaultProps: {
          dense: true,
        },
      },
      MuiAccordion: {
        defaultProps: {
          disableGutters: true,
          TransitionProps: { unmountOnExit: true },
        },
        styleOverrides: {
          root: {
            flexBasis: '100%',
            '&:before': { display: 'none' },
          },
        },
      },
      MuiAccordionSummary: {
        defaultProps: {
          expandIcon: <ExpandMoreIcon />,
        },
        styleOverrides: {
          root: {
            '&.Mui-expanded, &:hover': {
              backgroundColor: defaultTheme.palette.action.hover,
            },
          },
        },
      },
    },
  }
}

export default createAppTheme
