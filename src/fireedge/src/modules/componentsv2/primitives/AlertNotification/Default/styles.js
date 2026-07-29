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
 * Status color mapping for alert variants.
 *
 * @param {object} palette - Theme palette
 * @param {string} status - Alert status type
 * @returns {object} - Color configuration for the status
 */
const getStatusColors = (palette, status) => {
  const statusMap = {
    information: {
      background: 'surface.information',
      border: palette.border.information,
      text: 'text.information',
      iconFill: palette.icon.information,
    },
    success: {
      background: 'surface.success',
      border: palette.border.success,
      text: 'text.success',
      iconFill: palette.icon.success,
    },
    warning: {
      background: 'surface.warning',
      border: palette.border.warning,
      text: 'text.warning',
      iconFill: palette.icon.warning,
    },
    error: {
      background: 'surface.error',
      border: palette.border.error,
      text: 'text.error',
      iconFill: palette.icon.error,
    },
  }

  return statusMap?.[status] ?? statusMap.information
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @param {string} root0.type - Alert type (primary, secondary, inline)
 * @param {string} root0.status - Alert status (information, success, warning, error)
 * @returns {object} - AlertNotification SX style
 */
export const getStyles = ({ theme, type, status }) => {
  const colors = getStatusColors(theme.palette, status)
  const isSuccess = status === 'success'

  const baseStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-start',
    width: 'fit-content',
    minWidth: '280px',
  }

  const variants = {
    primary: {
      bgcolor: colors.background,
      borderRadius: `${theme.borderRadius.xlg}px`,
      padding: `${theme.scale[600]}px ${theme.scale[700]}px ${theme.scale[600]}px ${theme.scale[600]}px `,
      border: `${theme.borderWidth.sm}px solid ${colors.border}`,
      gap: `${theme.scale[200]}px`,
    },
    secondary: {
      borderRadius: `${theme.borderRadius.lg}px`,
      padding: `${theme.scale[600]}px`,
      border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
      gap: `${theme.scale[200]}px`,
    },
    inline: {
      border: 'none',
      gap: `${theme.scale[400]}px`,
    },
  }

  const statusIcon = {
    '& .status-icon': {
      width: `calc(${theme.scale[600]}px - ${
        isSuccess ? theme.scale[100] : 0
      }px)`,
      height: `calc(${theme.scale[600]}px - ${
        isSuccess ? theme.scale[100] : 0
      }px)`,
      color: colors.iconFill,
      borderRadius: '50%',
      ...(isSuccess && { backgroundColor: colors.iconFill }),
    },

    '& .status-icon path:first-of-type': {
      stroke: theme.palette.surface.primary,
      fill: colors.iconFill,
    },

    '& .status-icon path:last-of-type': {
      stroke: theme.palette.surface.primary,
    },
  }

  const content = {
    '& .alert-content': {
      display: 'flex',
      alignContent: 'flex-start',
      alignItems: 'flex-start',
      gap: `${theme.scale[200]}px`,
      flex: '1 0 0',
      flexWrap: 'wrap',
      minWidth: '248px',
    },
  }

  const textContent = {
    '& .text-content': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: `${theme.scale[100]}px`,
      flex: '1 0 0',
    },
  }

  const title = {
    '& .alert-title': {
      fontSize: {
        xs: theme.fontSize.body.sm.mobile,
        sm: theme.fontSize.body.sm.tablet,
        md: theme.fontSize.body.sm.desktop,
      },
      fontWeight: 600,
      lineHeight: {
        xs: theme.lineHeight.body.sm.mobile,
        sm: theme.lineHeight.body.sm.tablet,
        md: theme.lineHeight.body.sm.desktop,
      },
      color: colors.text,
    },
  }

  // Description styles
  const description = {
    '& .alert-description': {
      fontSize: {
        xs: theme.fontSize.body.caption.mobile,
        sm: theme.fontSize.body.caption.tablet,
        md: theme.fontSize.body.caption.desktop,
      },
      fontWeight: 400,
      lineHeight: {
        xs: theme.lineHeight.body.caption.mobile,
        sm: theme.lineHeight.body.caption.tablet,
        md: theme.lineHeight.body.caption.desktop,
      },
      color: colors.text,
    },
  }

  // Close button styles
  const closeButton = {
    '& .close-button': {
      position: 'absolute',
      top: '0px',
      right: '0px',
      cursor: 'pointer',
      color: colors.iconFill,
    },
  }

  return {
    ...baseStyle,
    ...(variants?.[type] ?? variants.primary),
    ...statusIcon,
    ...content,
    ...textContent,
    ...title,
    ...description,
    ...closeButton,
  }
}
