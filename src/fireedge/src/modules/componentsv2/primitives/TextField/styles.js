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

const getStatusModifiers = ({
  theme,
  status,
  isFilled,
  defined,
  isOutlined,
}) => {
  const getBorder = (direction, statusKey) => ({
    [`border${direction}`]: `${theme.borderWidth.sm}px solid ${
      theme.palette.border?.[isFilled ? statusKey : 'primary']
    }`,
  })

  const baseSchemes = {
    default: {
      color: 'text.disabled',
      bgcolor: 'surface.primary',
      border: 'primary',
      adornmentbg: 'surface.mute',
    },
    error: {
      color: 'text.error',
      bgcolor: 'surface.error',
      border: 'error',
      adornmentbg: 'surface.error',
    },
    success: {
      color: 'text.success',
      bgcolor: 'surface.success',
      border: 'success',
      adornmentbg: 'surface.success',
    },
    disabled: {
      color: 'text.onDisabled',
      bgcolor: 'surface.disabled',
      border: 'primary',
      pointerEvents: 'none',
      cursor: 'not-allowed',
      adornmentbg: 'surface.disabled2',
    },
  }

  const { color, bgcolor, border, adornmentbg, pointerEvents, cursor } =
    baseSchemes[status] ?? baseSchemes.default

  const inputWrapper = {
    ...(isOutlined && {
      border: `${theme.borderWidth.sm}px solid ${theme.palette.border?.[border]}`,
    }),
    ...((isFilled || status === 'disabled') && { bgcolor }),
    ...(pointerEvents && { pointerEvents }),
    ...(cursor && { cursor }),
  }

  const adornment = {
    color,
    ...(defined ? { bgcolor: adornmentbg } : {}),
  }

  return {
    inputWrapper,
    adornmentStart: {
      ...adornment,
      ...(defined ? getBorder('Right', border) : {}),
    },
    adornmentEnd: {
      ...adornment,
      ...(defined ? getBorder('Left', border) : {}),
    },
  }
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @param {boolean} root0.isFilled - Is isFilled
 * @param {boolean} root0.defined - Is defined
 * @param {string} root0.status - Status modifier
 * @returns {object} - Fields styles
 */
export const getStyles = ({ theme, isFilled, defined, status, ...options }) => {
  const statusModifiers = getStatusModifiers({
    theme,
    defined,
    isFilled,
    status,
    ...options,
  })

  const baseStyles = {
    height: '100%',
    width: '100%',
    minWidth: 0,
    fontStyle: 'normal',
    fontFamily: 'Inter',

    fontSize: {
      xs: theme.fontSize.body.sm.mobile,
      sm: theme.fontSize.body.sm.tablet,
      md: theme.fontSize.body.sm.desktop,
    },
    fontWeight: {
      xs: theme.fontWeight.body.sm.mobile,
      sm: theme.fontWeight.body.sm.tablet,
      md: theme.fontWeight.body.sm.desktop,
    },
    lineHeight: {
      xs: theme.lineHeight.body.sm.mobile,
      sm: theme.lineHeight.body.sm.tablet,
      md: theme.lineHeight.body.sm.desktop,
    },

    display: 'flex',
    flex: '1 0 0',
    flexDirection: 'column',
    caretColor: 'text.disabled',
  }

  const textfieldRoot = {
    '& .textfield-root': {
      margin: 0,
      height: '100%',
      width: '100%',
      minWidth: 0,
    },
  }

  const inputWrapper = {
    '& .textfield-input-wrapper': {
      display: 'flex',
      flex: '1 0 0',
      minWidth: 0,
      height: '100%',
      alignItems: 'center',
      alignSelf: 'stretch',
      gap: `${theme.scale[200]}px`,
      borderRadius: `${theme.borderRadius.xlg}px`,
      border: `${theme.borderWidth.sm}px solid transparent`,
      color:
        status === 'disabled'
          ? 'text.onDisabled'
          : isFilled
          ? 'text.body'
          : 'text.disabled',
      bgcolor: 'surface.primary',

      // Status specific modifiers
      ...statusModifiers.inputWrapper,

      '&:hover': {
        '& .textfield-adornment-start,& .textfield-adornment-end,& .textfield-posttab,& .textfield-prettab':
          {
            bgcolor: defined
              ? 'surface.mute'
              : isFilled
              ? 'surface.actionHover2'
              : 'surface.primary',
            color: !defined ? 'icon.actionHover' : 'icon.primary',
            borderColor: 'border.primary',
          },
        border: `${theme.borderWidth.sm}px solid ${theme.palette.border.actionHover}`,
        bgcolor: defined
          ? isFilled
            ? 'surface.mute'
            : 'surface.primary'
          : isFilled
          ? 'surface.actionHover2'
          : 'surface.primary',
      },

      '&:focus-within': {
        outline: `${theme.borderWidth.md}px solid ${theme.palette.border.focus}`,
        outlineOffset: '2px',
        border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
        bgcolor: 'surface.primary',

        '& .textfield-adornment-start,& .textfield-adornment-end,& .textfield-posttab,& .textfield-prettab':
          {
            bgcolor: defined ? 'surface.disabled2' : 'surface.primary',
            color: 'icon.primary',
            borderColor: 'border.primary',
          },
      },
    },
  }

  const adornmentStart = {
    '& .textfield-adornment-start': {
      margin: 0,
      maxHeight: 'none',
      boxSizing: 'border-box',
      height: '100%',
      display: 'flex',
      padding: `${theme.scale[200]}px ${theme.scale[400]}px`,
      gap: `${theme.scale[200]}px`,
      alignItems: 'center',
      alignSelf: 'stretch',
      borderRadius: `${theme.borderRadius.xlg}px 0 0 ${theme.borderRadius.xlg}px`,
      ...statusModifiers.adornmentStart,
    },

    '& .textfield-adornment-start > .notranslate': {
      display: 'none',
    },
  }

  const adornmentEnd = {
    '& .textfield-adornment-end': {
      margin: 0,
      maxHeight: 'none',
      boxSizing: 'border-box',
      height: '100%',
      display: 'flex',
      padding: `${theme.scale[200]}px ${theme.scale[400]}px`,
      gap: `${theme.scale[200]}px`,
      alignItems: 'center',
      alignSelf: 'stretch',
      borderRadius: `0 ${theme.borderRadius.xlg}px ${theme.borderRadius.xlg}px 0`,
      ...statusModifiers.adornmentEnd,
    },

    '& .textfield-adornment-end > .notranslate': {
      display: 'none',
    },
  }

  const prettab = {
    ' & .textfield-prettab': {
      borderRadius: `${theme.borderRadius.xlg}px 0 0 ${theme.borderRadius.xlg}px`,
    },
  }

  const posttab = {
    ' & .textfield-prettab': {
      borderRadius: `0 ${theme.borderRadius.xlg}px ${theme.borderRadius.xlg}px 0`,
    },
  }

  const input = {
    '& .textfield-input.MuiAutocomplete-input, & .textfield-input': {
      boxSizing: 'border-box',
      height: '100%',
      padding: `${theme.scale[300]}px ${theme.scale[400]}px`,
      margin: 0,
      color:
        status === 'disabled'
          ? 'text.onDisabled'
          : isFilled
          ? 'text.body'
          : 'text.disabled',

      '&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus, &:-webkit-autofill:active':
        {
          borderRadius: `${theme.borderRadius.xlg}px`,
          WebkitBoxShadow: `0 0 0 1000px ${theme.palette.surface.primary} inset`,
          WebkitTextFillColor: theme.palette.text.body,
        },
    },
  }

  return {
    ...baseStyles,
    ...textfieldRoot,
    ...inputWrapper,
    ...input,
    ...adornmentStart,
    ...adornmentEnd,
    ...posttab,
    ...prettab,
  }
}
