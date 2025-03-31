/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { NavArrowDown as ExpandMoreIcon } from 'iconoir-react'

import { UbuntuFont } from '@modules/providers/theme/fonts'
import { SCHEMES } from '@ConstantsModule'

import { lightPalette, darkPalette } from '@modules/providers/theme/palettes'

import { colors as sunstoneColors } from '@modules/providers/theme/colors'

const defaultTheme = createTheme()

const { grey } = colors
const white = '#ffffff'

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

// Width breakpoints
export const breakpoints = {
  xs: 0, // Extra small (default for all screen sizes)
  sm: 600, // Small screens (e.g., portrait tablets)
  md: 900, // Medium screens (e.g., landscape tablets, small laptops)
  lg: 1200, // Large screens (e.g., desktops)
  xl: 1920, // Extra-large screens (e.g., large desktops, high-resolution monitors)
  xxl: 2560, // 2k monitor
}

// Height breakpoints
export const heightBreakpoints = {
  extraLarge: '1200px',
  large: '1000px',
  medium: '900px',
  small: '864px',
  tiny: '720px',
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
  minified: 88,
  fixed: 250,
}

/**
 * @param {ThemeOptions} appTheme - App theme
 * @param {SCHEMES} mode - Scheme type
 * @returns {ThemeOptions} Material theme options
 */
const createAppTheme = (appTheme, mode = SCHEMES.DARK) => {
  const isDarkMode = `${mode}`.toLowerCase() === SCHEMES.DARK

  const currentPalette = isDarkMode ? darkPalette : lightPalette

  return {
    palette: {
      ...currentPalette,
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
        contrastText: currentPalette.primary.contrastText,
      },
      info: {
        light: '#64b5f6',
        main: '#2196f3',
        dark: '#01579b',
        contrastText: currentPalette.primary.contrastText,
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
        contrastText: currentPalette.primary.contrastText,
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
    heightBreakpoints: {
      ...heightBreakpoints,
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
            color: currentPalette.scrollbar.color,
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
            color: isDarkMode
              ? currentPalette.primary.main
              : currentPalette.primary.dark,
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
              borderBottom: `2px solid ${currentPalette.primary.main}`,
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
      MuiButton: {
        defaultProps: {
          disableTouchRipple: true,
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            padding: '0 2px',
            boxShadow: 'none',
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

          SelectProps: {
            native: true,
          },
        },
      },
      MuiToggleButtonGroup: {
        styleOverrides: {
          root: {
            backgroundColor: 'background.default',
          },
        },
        defaultProps: {},
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 700,
            color: isDarkMode ? grey[300] : grey[700],
            borderColor: isDarkMode ? currentPalette.primary.light : grey[400],
            '&.Mui-selected': {
              borderColor: `${currentPalette.primary.light} !important`,
              color: isDarkMode ? white : currentPalette.primary.light,
              backgroundColor: isDarkMode
                ? alpha(sunstoneColors.blue[700], 0.2)
                : sunstoneColors.blue[100],
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
