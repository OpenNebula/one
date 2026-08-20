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
 * @param {object} root0.theme - MUI theme
 * @returns {object} - Sidebar styles
 */
export const getStyles = ({ theme }) => {
  const baseStyles = {
    '&.dropdown-item': {
      display: 'flex',
      borderRadius: `${theme.borderRadius.xlg}px`,
      gap: `${theme.scale[200]}px`,
      padding: `${theme.scale[150]}px ${theme.scale[200]}px`,

      '&:hover': {
        bgcolor: 'surface.actionHover4',

        '& .label': {
          color: 'text.actionHover2',
        },
      },

      '& .icon': {
        width: '16px',
        height: '16px',
        strokeWidth: 1.6,
        color: 'icon.primary',
      },

      '& .label': {
        flexGrow: 1,
        userSelect: 'none',
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
    },
  }

  return {
    ...baseStyles,
  }
}
