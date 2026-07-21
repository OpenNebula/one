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
 * @param {object} root0 - Params
 * @param {string} root0.status - Button type
 * @param {object} root0.theme - Current theme in use
 * @param {boolean} root0.isInteractive - Enable selectable tag behavior
 * @param {boolean} root0.isClickable - Enable click handling without selection
 * @param {boolean} root0.isSelected - Selected state.
 * @param {object} root0.customColor - Optional custom tag colors.
 * Tracked internally by default or externally by parent.
 * @returns {object} - Button SX style
 */
export const getStyles = ({
  status,
  theme,
  isInteractive,
  isClickable,
  isSelected,
  customColor,
}) => {
  const baseStyle = {
    pointerEvents: isClickable || isInteractive ? 'auto' : 'none',
    textTransform: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: `${theme.scale[50]}px ${theme.scale[200]}px`,
    gap: `${theme.scale[100]}px`,
    minWidth: 'unset',
    minHeight: 'unset',
    width: 'auto',
    height: 'auto',
    borderRadius: `${theme.borderRadius['2xl']}px`,
    '& .MuiButton-startIcon, & .MuiButton-endIcon': {
      margin: 0,
      width: '8px',
      height: '8px',
      color: 'inherit',
      aspectRatio: '1/1',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',

      '& > .MuiBox-root': {
        backgroundColor: 'currentColor',
      },
    },

    cursor: isClickable || isInteractive ? 'pointer' : 'default',

    '&:hover': {
      backgroundColor: 'inherit',
      boxShadow: 'none',
    },

    '&.Mui-focusVisible': {
      outline: 'none',
      boxShadow: 'none',
    },

    '&.Mui-focused': {
      outline: 'none',
      boxShadow: 'none',
    },

    '&:active': {
      backgroundColor: 'inherit',
      boxShadow: 'none',
    },

    '& .tag-title': {
      display: 'inline-block',
      minWidth: 0,
      color: 'inherit',
      fontStyle: 'normal',
      textTransform: 'none',
      fontSize: {
        xs: theme.fontSize.body.caption.mobile,
        sm: theme.fontSize.body.caption.tablet,
        md: theme.fontSize.body.caption.desktop,
      },
      fontWeight: 600,
      whiteSpace: 'nowrap',
      lineHeight: {
        xs: theme.lineHeight.body.caption.mobile,
        sm: theme.lineHeight.body.caption.tablet,
        md: theme.lineHeight.body.caption.desktop,
      },
    },
  }

  const statuses = {
    default: {
      bgcolor: 'surface.primary',
      color: 'text.body',
      border: `${theme.scale[25]}px solid ${theme.palette.border.primary}`,
    },

    information: {
      bgcolor: 'surface.information',
      color: 'text.information',
      border: `${theme.scale[25]}px solid ${theme.palette.border.information}`,
    },

    success: {
      bgcolor: 'surface.success',
      color: 'text.success',
      border: `${theme.scale[25]}px solid ${theme.palette.border.success}`,
    },

    warning: {
      bgcolor: 'surface.warning',
      color: 'text.warning',
      border: `${theme.scale[25]}px solid ${theme.palette.border.warning}`,
    },

    error: {
      bgcolor: 'surface.error',
      color: 'text.error',
      border: `${theme.scale[25]}px solid ${theme.palette.border.error}`,
    },

    disabled: {
      bgcolor: 'surface.disabled',
      color: 'text.disabled',
      border: `${theme.scale[25]}px solid ${theme.palette.border.disabled}`,
    },

    miscellaneous: {
      bgcolor: 'surface.miscellaneous',
      color: 'text.miscellaneous',
      border: `${theme.scale[25]}px solid ${theme.palette.border.miscellaneous}`,
    },

    miscellaneous2: {
      bgcolor: 'surface.miscellaneous2',
      color: 'text.miscellaneous2',
      border: `${theme.scale[25]}px solid ${theme.palette.border.miscellaneous2}`,
    },

    miscellaneous3: {
      bgcolor: 'surface.miscellaneous3',
      color: 'text.miscellaneous3',
      border: `${theme.scale[25]}px solid ${theme.palette.border.miscellaneous3}`,
    },

    miscellaneous4: {
      bgcolor: 'surface.miscellaneous4',
      color: 'text.miscellaneous4',
      border: `${theme.scale[25]}px solid ${theme.palette.border.miscellaneous4}`,
    },

    miscellaneous5: {
      bgcolor: 'surface.miscellaneous5',
      color: 'text.miscellaneous5',
      border: `${theme.scale[25]}px solid ${theme.palette.border.miscellaneous5}`,
    },
  }

  const interactive = {
    pointerEvents: 'auto',
    cursor: 'pointer',
    bgcolor: 'surface.primary',
    color: 'text.action',
    border: `${theme.scale[25]}px dashed ${theme.palette.border.action}`,

    '&:hover': {
      bgcolor: 'surface.actionHover4',
    },

    '&.Mui-focusVisible': {
      outline: `${theme.borderWidth.md}px solid ${theme.palette.border.action}`,
      outlineOffset: '2px',
    },
  }

  const selected = {
    pointerEvents: 'auto',
    cursor: 'pointer',
    bgcolor: 'surface.action',
    color: 'text.onAction',
    border: `${theme.scale[25]}px solid ${theme.palette.border.action}`,

    '&:hover': {
      border: `${theme.scale[25]}px solid ${theme.palette.border.actionHover3}`,
      bgcolor: 'surface.actionHover',
    },

    '&.Mui-focusVisible': {
      outline: `${theme.borderWidth.md}px solid ${theme.palette.border.focus}`,
      outlineOffset: '2px',
    },
  }

  const custom = customColor && {
    bgcolor: customColor.background,
    color: customColor.text,
    border: `${theme.scale[25]}px solid ${customColor.border}`,

    '&:hover': {
      backgroundColor: customColor.background,
      boxShadow: 'none',
    },

    '&:active': {
      backgroundColor: customColor.background,
      boxShadow: 'none',
    },
  }

  return {
    ...baseStyle,
    ...(statuses?.[isInteractive ? 'default' : status] || statuses.default),
    ...(!isInteractive && custom),
    ...(isInteractive && interactive),
    ...(isSelected && selected),
  }
}
