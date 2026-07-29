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

const getTypeStyles = ({ theme, type }) => {
  switch (type) {
    case 'big':
      return {
        header: {
          padding: `${theme.scale[400]}px ${theme.scale[500]}px`,
          borderBottom: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
        },
      }
    default:
      return {
        header: {
          padding: `${theme.scale[600]}px ${theme.scale[600]}px ${theme.scale[400]}px`,
        },
      }
  }
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @param {'small'|'big'} root0.type - Card visual type
 * @param {boolean} root0.isLink - Whether the card navigates to another route
 * @returns {object} Dashboard card wrapper SX styles
 */
export const getStyles = ({ theme, type, isLink }) => {
  const typeStyles = getTypeStyles({ theme, type })

  return {
    display: 'flex',
    flexDirection: 'column',
    border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    borderRadius: `${theme.borderRadius.xlg}px`,
    bgcolor: 'surface.primary',

    ...(isLink && {
      color: 'inherit',
      cursor: 'pointer',
      textDecoration: 'none',

      '&:hover': {
        borderColor: theme.palette.border.actionHover,
      },

      '&:focus-visible': {
        outline: `${theme.borderWidth.md}px solid ${theme.palette.border.focus}`,
        outlineOffset: `${theme.scale[50]}px`,
      },
    }),

    '& .dashboard-card-header': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: `${theme.scale[400]}px`,
      ...typeStyles.header,

      '& .dashboard-card-title-container': {
        display: 'flex',
        minWidth: 0,
        alignItems: 'center',
        gap: `${theme.scale[400]}px`,

        '& .dashboard-card-title': {
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },

        '& .dashboard-card-title-tag': {
          display: 'flex',
          flex: '0 0 auto',
          alignItems: 'center',
        },
      },

      '& .dashboard-card-adornment': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',

        '& .dashboard-card-header-action': {
          width: `${theme.scale[700]}px`,
          minWidth: `${theme.scale[700]}px`,
          height: `${theme.scale[700]}px`,
          minHeight: `${theme.scale[700]}px`,

          '& svg': {
            width: `${theme.scale[500]}px`,
            height: `${theme.scale[500]}px`,
          },
        },
      },
    },

    '& .dashboard-card-content': {
      display: 'flex',
      padding: 0,
    },
  }
}
