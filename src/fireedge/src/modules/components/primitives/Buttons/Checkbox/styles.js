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

const getStatusModifiers = ({ theme, status }) => {
  const baseSchemes = {
    default: {
      bgcolor: 'surface.action',
      border: `${theme.borderWidth.md}px solid ${theme.palette.border.action}`,
      iconColor: 'icon.onAction',
    },
    error: {
      bgcolor: 'surface.error',
      border: `${theme.borderWidth.md}px solid ${theme.palette.border.error}`,
      iconColor: 'icon.error',
    },
    success: {
      bgcolor: 'surface.success',
      border: `${theme.borderWidth.md}px solid ${theme.palette.border.success}`,
      iconColor: 'icon.success',
    },
  }

  return baseSchemes?.[status] ?? baseSchemes.default
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @param {string} root0.direction - Flex direction for the buttons
 * @param {string} root0.size - Size dimensions of the circle
 * @returns {object} - Checkbox button SX style
 */
export const getStyles = ({ theme, direction, ...opts }) => {
  const { bgcolor, border, iconColor } = getStatusModifiers({ theme, ...opts })
  const isDefault = opts?.status === 'default'
  const isSmall = opts?.size === 'small'
  const checkboxSize = isSmall ? theme.scale[500] : theme.scale[600]
  const checkboxBorderRadius = isSmall
    ? theme.borderRadius.md
    : theme.borderRadius.xlg

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

  const checkboxContainer = {
    '& .checkbox-container': {
      display: 'flex',
      margin: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: `${theme.scale[200]}px`,
    },
  }

  const checkboxLabel = {
    '& .checkbox-label': {
      display: 'flex',
      alignItems: 'center',
      color: 'text.body',
      fontWeight: {
        xs: theme.typography.fontWeightMedium,
        sm: theme.typography.fontWeightMedium,
        md: theme.typography.fontWeightMedium,
      },
      fontSize: {
        xs: theme.fontSize.body.sm.mobile,
        sm: theme.fontSize.body.sm.tablet,
        md: theme.fontSize.body.sm.desktop,
      },
      lineHeight: {
        xs: theme.lineHeight.body.sm.mobile,
        sm: theme.lineHeight.body.sm.tablet,
        md: theme.lineHeight.body.sm.desktop,
      },
    },
  }

  const checkboxInput = {
    '& .checkbox-input-container': {
      width: `${checkboxSize}px`,
      height: `${checkboxSize}px`,
      display: 'flex',
      padding: 0,
      alignItems: 'center',
      gap: `${theme.scale[300]}px`,

      '&:hover': {
        '& .checkbox-unchecked-icon': {
          bgcolor: 'surface.actionHover2',
          borderRadius: `${checkboxBorderRadius}px`,
          border: `${theme.borderWidth.md}px solid ${theme.palette.border.actionHover}`,
        },
      },

      '&.Mui-focusVisible': {
        outline: `${theme.borderWidth.sm}px solid ${theme.palette.border.action}`,
        outlineOffset: '2px',
        borderRadius: `${checkboxBorderRadius}px`,
      },
    },
  }

  const checkboxUnselected = {
    '& .checkbox-unchecked-icon': {
      borderRadius: `${checkboxBorderRadius}px`,
      border: !isDefault
        ? border
        : `${theme.borderWidth.md}px solid ${theme.palette.border.primary}`,
      bgcolor: !isDefault ? bgcolor : 'surface.primary',
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
    },
  }

  const checkboxSelected = {
    '& .checkbox-checked-icon': {
      borderRadius: `${checkboxBorderRadius}px`,
      border: border,
      bgcolor: bgcolor,
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      '& .checkbox-check-svg path:first-of-type': {
        color: iconColor,
      },
      '&:hover': {
        bgcolor: 'surface.actionHover',
        border: `${theme.borderWidth.md}px solid ${theme.palette.border.actionHover}`,
        '& .checkbox-check-svg path:first-of-type': {
          color: 'icon.onAction2',
        },
      },
    },
  }

  const checkboxIndeterminate = {
    '& .checkbox-indeterminate-icon': {
      borderRadius: `${checkboxBorderRadius}px`,
      border: border,
      bgcolor: bgcolor,
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      '& .checkbox-dash-svg path:first-of-type': {
        color: iconColor,
      },
      '&:hover': {
        bgcolor: 'surface.actionHover',
        border: `${theme.borderWidth.md}px solid ${theme.palette.border.actionHover}`,
        '& .checkbox-dash-svg path:first-of-type': {
          color: 'icon.onAction2',
        },
      },
    },
  }

  const overrides = {
    '& .Mui-disabled': {
      '& .checkbox-checked-icon': {
        bgcolor: 'surface.disabledSelected',
        border: 0,
        '& .checkbox-check-svg path:first-of-type': {
          color: 'icon.onDisabled',
        },
      },
      '& .checkbox-indeterminate-icon': {
        bgcolor: 'surface.disabledSelected',
        border: 0,
        '& .checkbox-dash-svg path:first-of-type': {
          color: 'icon.onDisabled',
        },
      },
    },
  }

  return {
    ...baseStyle,
    ...checkboxInput,
    ...checkboxLabel,
    ...checkboxSelected,
    ...checkboxIndeterminate,
    ...checkboxUnselected,
    ...checkboxContainer,
    ...overrides,
  }
}
