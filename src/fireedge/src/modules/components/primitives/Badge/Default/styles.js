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
 * @param {string} root0.type - Dot or square type
 * @param {object} root0.theme - Current theme in use
 * @returns {object} - Button SX style
 */
export const getStyles = ({ status, type, theme }) => {
  const typeMap = {
    dot: {
      display: 'flex',
      width: '8px',
      height: '8px',
      padding: 0,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 0,
      borderRadius: `${theme.borderRadius?.['2xl']}px`,
      aspectRatio: '1/1',
    },

    square: {
      display: 'flex',
      width: '24px',
      height: '24px',
      padding: 0,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 0,
      borderRadius: `${theme.borderRadius?.['2xl']}px`,
    },

    tag: {
      display: 'inline-flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: `${theme.scale[50]}px ${theme.scale[200]}px`,
      gap: `${theme.scale[100]}px`,
      minWidth: 'unset',
      minHeight: 'unset',
      width: 'auto',
      height: 'auto',
      borderRadius: `${theme.borderRadius?.['2xl']}px`,
      fontSize: {
        xs: theme.fontSize.body.caption.mobile,
        sm: theme.fontSize.body.caption.tablet,
        md: theme.fontSize.body.caption.desktop,
      },
      fontWeight: 600,
      lineHeight: {
        xs: theme.lineHeight.body.caption.mobile,
        sm: theme.lineHeight.body.caption.tablet,
        md: theme.lineHeight.body.caption.desktop,
      },
      '& .badge-title': {
        alignSelf: 'auto',
        color: 'inherit',
      },
    },
  }

  const baseStyle = {
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

  const statuses = {
    default: {
      bgcolor: 'surface.action',
    },

    information: {
      bgcolor: 'border.information',
    },

    error: {
      bgcolor: 'border.error',
    },

    warning: {
      bgcolor: 'border.warning',
    },

    success: {
      bgcolor: 'border.success',
    },
  }

  const tagStatuses = {
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

    error: {
      bgcolor: 'surface.error',
      color: 'text.error',
      border: `${theme.scale[25]}px solid ${theme.palette.border.error}`,
    },

    warning: {
      bgcolor: 'surface.warning',
      color: 'text.warning',
      border: `${theme.scale[25]}px solid ${theme.palette.border.warning}`,
    },

    success: {
      bgcolor: 'surface.success',
      color: 'text.success',
      border: `${theme.scale[25]}px solid ${theme.palette.border.success}`,
    },
  }

  const badgeTitle = {
    '& .badge-title': {
      display: type !== 'dot' ? 'block' : 'none',
      alignSelf: 'stretch',
      color: 'text.onAction',
      textAlign: 'center',
      fontFamily: 'Inter',
      fontWeight: 600,
    },
  }

  return {
    ...baseStyle,
    ...badgeTitle,
    ...(typeMap?.[type] ?? typeMap?.square),
    ...(type === 'tag'
      ? tagStatuses?.[status] ?? tagStatuses.default
      : statuses?.[status] ?? statuses.default),
  }
}
