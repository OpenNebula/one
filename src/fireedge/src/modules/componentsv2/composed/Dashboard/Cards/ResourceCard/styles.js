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

const toneStyles = (property) => ({
  [`&.dashboard-resource-card-tone-neutral`]: {
    [property]: 'icon.disabled',
  },
  [`&.dashboard-resource-card-tone-success`]: {
    [property]: 'icon.success',
  },
  [`&.dashboard-resource-card-tone-warning`]: {
    [property]: 'icon.warning',
  },
  [`&.dashboard-resource-card-tone-error`]: { [property]: 'icon.error' },
  [`&.dashboard-resource-card-tone-information`]: {
    [property]: 'icon.information',
  },
  [`&.dashboard-resource-card-tone-action`]: { [property]: 'icon.action' },
  [`&.dashboard-resource-card-tone-focus`]: { [property]: 'icon.focus' },
})

/**
 * @returns {object} Dashboard resource card adornment SX styles
 */
export const getAdornmentStyles = () => ({
  display: 'flex',
  color: 'icon.primary',

  '& > svg': {
    color: 'icon.primary',
    strokeWidth: 1.6,
  },
})

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @returns {object} Dashboard resource card SX styles
 */
export const getStyles = ({ theme }) => ({
  display: 'flex',
  width: '100%',
  flexDirection: 'column',
  gap: `${theme.scale[200]}px`,
  padding: `0 ${theme.scale[600]}px ${theme.scale[600]}px`,

  '& .dashboard-resource-card-details-progress': {
    marginTop: `${theme.scale[200]}px`,
  },

  '& .dashboard-resource-card-details': {
    display: 'flex',
    minWidth: 0,
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: `${theme.scale[200]}px`,
    gap: `${theme.scale[100]}px`,

    '& .dashboard-resource-card-detail': {
      display: 'flex',
      alignItems: 'center',
      gap: `${theme.scale[100]}px`,

      '& .dashboard-resource-card-detail-indicator': {
        width: `${theme.scale[150]}px`,
        height: `${theme.scale[150]}px`,
        borderRadius: `${theme.borderRadius.round}px`,
        ...toneStyles('bgcolor'),
      },

      '& .dashboard-resource-card-detail-value': {
        color: 'text.headings',
      },

      '& .dashboard-resource-card-detail-label': {
        color: 'text.onDisabled',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      },

      '&.dashboard-resource-card-detail-disabled': {
        '& .dashboard-resource-card-detail-indicator': {
          bgcolor: 'icon.onDisabled',
        },

        '& .dashboard-resource-card-detail-value, & .dashboard-resource-card-detail-label':
          {
            color: 'text.onDisabled',
          },
      },

      '&.dashboard-resource-card-detail-muted': {
        '& .dashboard-resource-card-detail-value, & .dashboard-resource-card-detail-label':
          {
            color: 'text.disabled',
          },
      },
    },
  },

  '& .dashboard-resource-card-extra': {
    display: 'flex',
    width: '100%',
    minWidth: 0,
    padding: `${theme.scale[200]}px 0 0`,
    borderTop: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,

    '& .dashboard-resource-card-extra-summary': {
      display: 'flex',
      minWidth: 0,
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: `${theme.scale[100]}px`,

      '& > svg': {
        width: `14px`,
        height: `14px`,
        flex: '0 0 auto',
        color: 'icon.primary',
        strokeWidth: 2,
      },

      '& .dashboard-resource-card-extra-item': {
        display: 'flex',
        minWidth: 0,
        alignItems: 'center',
        gap: `${theme.scale[100]}px`,

        '& .dashboard-resource-card-extra-value': {
          color: 'text.headings',
        },

        '& .dashboard-resource-card-extra-label': {
          overflow: 'hidden',
          color: 'text.onDisabled',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },
      },
    },
  },
})
