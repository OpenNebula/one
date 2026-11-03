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

const getDimensions = ({ scale, size }) => {
  const sizeMap = {
    small: {
      height: `${scale[500]}px`,
      width: `${scale[500]}px`,
    },

    medium: {
      height: `${scale[600]}px`,
      width: `${scale[600]}px`,
    },
  }

  return sizeMap?.[size] ?? sizeMap.medium
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @param {string} root0.direction - Flex direction for the buttons
 * @param {string} root0.size - Size dimensions of the circle
 * @returns {object} - Radio button SX style
 */
export const getStyles = ({ theme, size, direction }) => {
  const baseStyle = {
    display: 'flex',
    flexDirection: direction,
    alignItems: 'center',
    gap: `${theme.scale[200]}px`,

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
  }

  const radioGroupContainer = {
    '& .radiogroup-container': {
      display: 'flex',
      alignItems: 'center',
      gap: `${theme.scale[200]}px`,
    },

    '& .MuiFormControlLabel-root': {
      '& .MuiFormControlLabel-label': {
        color: 'text.body',
      },
    },
  }

  const radioCircle = {
    '& .radiocircle': {
      ...getDimensions({ scale: theme.scale, size }),
      bgcolor: 'surface.primary',
      borderRadius: `50%`, // used to create circle
      border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,

      '&:hover': {
        bgcolor: 'surface.actionHover2',
        borderRadius: `50%`,
        border: `${theme.borderWidth.sm}px solid ${theme.palette.border.actionHover}`,
      },
    },

    '& .selected': {
      bgcolor: 'surface.actionHover2',
      borderRadius: `50%`,
      border: `${theme.scale[150]}px solid ${theme.palette.border.action}`, // width - (bw * 2) = 8px

      '&:hover': {
        bgcolor: 'surface.onAction2',
        borderRadius: `50%`,
        border: `${theme.scale[150]}px solid ${theme.palette.border.actionHover}`, // This is the 'main' background
      },
    },
  }

  const radioGroupItem = {
    '& .radiogroup-item': {
      '&:hover': {
        bgcolor: 'surface.actionHover2',
        border: `${theme.borderWidth.sm}px solid ${theme.palette.border.action}`,
      },
    },
  }

  const overrides = {
    '& .MuiIconButton-root': {
      padding: 0,
      '&:hover': {
        bgcolor: 'transparent',
      },

      '&:focus': {
        outline: `${theme.borderWidth.md}px solid ${theme.palette.border.action}`,
        outlineOffset: '2px',
      },
    },
  }

  return {
    ...baseStyle,
    ...radioGroupContainer,
    ...radioGroupItem,
    ...radioCircle,
    ...overrides,
  }
}

/**
 * Native radio group styles, enabled by the plain variant.
 *
 * @param {object} params - Style parameters
 * @param {object} params.theme - Current theme
 * @param {string} params.size - Circle size
 * @param {string} params.direction - Flex direction
 * @returns {object} Plain radio group styles
 */
export const getPlainStyles = ({ theme, size, direction }) => {
  const baseStyles = getStyles({ theme, size, direction })

  return {
    ...baseStyles,
    flexWrap: 'wrap',
    gap: `${theme.scale[600]}px`,

    '& .radiogroup-container': {
      ...baseStyles['& .radiogroup-container'],
      margin: 0,
    },

    '& .radiocircle': {
      ...baseStyles['& .radiocircle'],
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },

    '& .selected': {
      bgcolor: 'surface.primary',
      borderRadius: '50%',
      border: `${theme.borderWidth.sm}px solid ${theme.palette.border.action}`,

      '&::after': {
        content: '""',
        width: '50%',
        height: '50%',
        borderRadius: '50%',
        bgcolor: 'surface.action',
      },

      '&:hover': {
        bgcolor: 'surface.onAction2',
        borderRadius: '50%',
        borderColor: 'border.actionHover',
      },
    },

    '& .MuiRadio-root': {
      padding: 0,

      '&:hover': {
        bgcolor: 'transparent',
      },

      '&.Mui-focusVisible': {
        outline: `${theme.borderWidth.md}px solid ${theme.palette.border.action}`,
        outlineOffset: '2px',
      },

      '&.Mui-disabled': {
        opacity: 0.5,
      },
    },
  }
}
