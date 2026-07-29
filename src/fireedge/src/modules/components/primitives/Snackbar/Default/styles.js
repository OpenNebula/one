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
 * Status color mapping for snackbar variants.
 *
 * @param {object} palette - Theme palette
 * @param {string} status - Snackbar status type
 * @returns {object} - Color configuration for the status
 */
const getStatusColors = (palette, status) => {
  const statusMap = {
    default: {
      text: 'text.action',
      iconFill: palette.icon.action,
    },
    information: {
      text: 'text.information',
      iconFill: palette.icon.information,
    },
    success: {
      text: 'text.success',
      iconFill: palette.icon.success,
    },
    warning: {
      text: 'text.warning',
      iconFill: palette.icon.warning,
    },
    error: {
      text: 'text.error',
      iconFill: palette.icon.error,
    },
  }

  return statusMap?.[status] ?? statusMap.default
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @param {string} root0.status - Snackbar status (default, information, success, warning, error)
 * @param {number} root0.progress - Progress clamped from 0,100
 * @returns {object} - Snackbar SX style
 */
export const getStyles = ({ theme, status, progress = 0, progressTickMs }) => {
  const colors = getStatusColors(theme.palette, status)
  const isSuccess = status === 'success'

  // Base container styles
  const baseStyle = {
    position: 'relative',
    display: 'flex',
    width: '433px',
    height: '100%',
    bgcolor: 'surface.primary',
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    borderRadius: `${theme.borderRadius.xlg}px`,
    padding: `${theme.scale[600]}px ${theme.scale[700]}px ${theme.scale[600]}px ${theme.scale[600]}px`,
    overflow: 'hidden',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    boxShadow:
      '0 4px 6px -4px rgba(0, 0, 0, 0.10), 0 10px 15px -13px rgba(0, 0, 0, 0.10)',
  } // OK

  const innerContainer = {
    '& .snackbar-content-wrapper': {
      display: 'flex',
      alignItems: 'flex-start',
      gap: `${theme.scale[400]}px`,
      flex: '1 0 0',
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
  }

  const textContainer = {
    '& .snackbar-text-container': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: `${theme.scale[500]}px`,
      flex: '1 0 0',
    },
  }

  const textContent = {
    '& .snackbar-text-body': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: `${theme.scale[100]}px`,
    },
  }

  const title = {
    '& .snackbar-title': {
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

  const link = {
    '& .snackbar-link': {
      fontSize: {
        xs: theme.fontSize.body.sm.mobile,
        sm: theme.fontSize.body.sm.tablet,
        md: theme.fontSize.body.sm.desktop,
      },
      fontWeight: 500,
      lineHeight: {
        xs: theme.lineHeight.body.sm.mobile,
        sm: theme.lineHeight.body.sm.tablet,
        md: theme.lineHeight.body.sm.desktop,
      },
      color: 'text.action',
      textDecoration: 'none',
      cursor: 'pointer',
      '&:hover': {
        textDecoration: 'underline',
      },
      padding: `0 ${theme.scale[50]}px`,
      alignItems: 'center',
      gap: `${theme.scale[200]}px`,
    },
  }

  const description = {
    '& .snackbar-description': {
      fontSize: {
        xs: theme.fontSize.body.sm.mobile,
        sm: theme.fontSize.body.sm.tablet,
        md: theme.fontSize.body.sm.desktop,
      },
      fontWeight: 400,
      lineHeight: {
        xs: theme.lineHeight.body.sm.mobile,
        sm: theme.lineHeight.body.sm.tablet,
        md: theme.lineHeight.body.sm.desktop,
      },
      color: 'text.body',
    },
  }

  const closeButton = {
    '& .snackbar-close-button': {
      position: 'absolute',
      right: '4px',
      top: '4px',
    },

    '& svg': {
      color: theme.palette.icon.primary,
    },
  }

  const progressBar = {
    '& .snackbar-progress-bar-track': {
      position: 'absolute',
      bottom: 0,
      left: 0,
      gap: theme.scale[0],
      alignItems: 'flex-start',
      padding: theme.scale[0],
      height: `${theme.scale[100]}px`,
      width: '100%',
      backgroundColor: theme.palette.surface.actionHover4,
      borderRadius: `${theme.borderRadius.round}px ${theme.borderRadius.round}px`,
    },
    '& .snackbar-progress-bar-fill': {
      display: 'flex',
      alignItems: 'center',
      alignSelf: 'stretch',
      backgroundColor: colors.iconFill,
      height: `${theme.scale[100]}px`,
      width: `${progress}%`,
      transition: `width ${progressTickMs}ms linear`, // Makes progress updating a bit smoother
    },
  }

  return {
    ...baseStyle,
    ...innerContainer,
    ...statusIcon,
    ...textContainer,
    ...textContent,
    ...title,
    ...description,
    ...link,
    ...closeButton,
    ...progressBar,
  }
}
