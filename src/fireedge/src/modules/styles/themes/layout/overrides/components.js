/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
/**
 * @param {object} palette - Theme palette
 * @returns {object} - Browser autofill overrides
 */
const getAutofillStyles = (palette) => ({
  backgroundColor: `transparent !important`,
  backgroundClip: 'text !important',
  backgroundImage: 'none !important',
  boxShadow: 'none !important',
  caretColor: `${palette.text.body} !important`,
  color: `${palette.text.body} !important`,
  filter: 'none',
  transition: 'background-color 9999s ease-out 0s',
  WebkitBackgroundClip: 'text !important',
  WebkitBoxShadow: 'none !important',
  WebkitTextFillColor: `${palette.text.body} !important`,
})

/**
 * @param {object} root0 - Params
 * @param {object} root0.palette - Theme palette
 * @param {object} root0.fonts - Fonts
 * @param {object} root0.defaultTheme - Default MUI theme
 * @returns {object} - Components override
 */
export const Components = ({ palette, fonts, defaultTheme }) => ({
  MuiCssBaseline: {
    styleOverrides: {
      '@font-face': fonts.inter,
      'input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active, textarea:-webkit-autofill, textarea:-webkit-autofill:hover, textarea:-webkit-autofill:focus, textarea:-webkit-autofill:active, select:-webkit-autofill, select:-webkit-autofill:hover, select:-webkit-autofill:focus, select:-webkit-autofill:active':
        getAutofillStyles(palette),
      'input:autofill, input:autofill:hover, input:autofill:focus, input:autofill:active, textarea:autofill, textarea:autofill:hover, textarea:autofill:focus, textarea:autofill:active, select:autofill, select:autofill:hover, select:autofill:focus, select:autofill:active':
        getAutofillStyles(palette),
      '*::-webkit-scrollbar': {
        width: 14,
      },
      '*::-webkit-scrollbar-thumb': {
        backgroundClip: 'content-box',
        border: '4px solid transparent',
        borderRadius: 7,
        boxShadow: 'inset 0 0 0 10px',
        color: palette.surface.disabled2,
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
      fieldset: { border: 'none' },
    },
  },
  MuiTypography: {
    variants: [
      {
        props: { variant: 'underline' },
        style: {
          padding: '0 1em 0.2em 0.5em',
          borderBottom: `2px solid ${palette.border.primary}`,
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
})
