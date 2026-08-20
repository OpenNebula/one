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
 * @param {object} root0.theme - Current theme in use
 * @returns {object} Dashboard system card SX styles
 */
export const getStyles = ({ theme }) => ({
  display: 'flex',
  width: '100%',
  padding: `${theme.scale[400]}px ${theme.scale[500]}px`,

  '& .dashboard-system-card-items': {
    display: 'flex',
    width: '100%',
    flexDirection: 'column',

    '& .dashboard-system-card-item': {
      display: 'flex',
      width: '100%',
      boxSizing: 'border-box',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'text.body',
      padding: `${theme.scale[200]}px ${theme.scale[300]}px`,
      border: 'none',
      gap: `${theme.scale[300]}px`,

      '&.dashboard-system-card-item-navigable:hover': {
        bgcolor: 'surface.actionHover4',
      },

      '& .MuiButton-startIcon, & .dashboard-system-card-item-icon': {
        display: 'flex',
        flex: '0 0 auto',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '28px',
        borderRadius: `${theme.borderRadius.xlg}px`,
        bgcolor: 'surface.imageBg',

        '& > svg': {
          width: `${theme.scale[600]}px`,
          height: `${theme.scale[600]}px`,
          color: 'icon.primary',
          strokeWidth: 1.2,
        },
      },

      '& .dashboard-system-card-item-content': {
        display: 'flex',
        minWidth: 0,
        flex: '1 1 auto',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: `${theme.scale[300]}px`,
      },

      '& .dashboard-system-card-item-label': {
        minWidth: 0,
        flex: '1 1 auto',
        overflow: 'hidden',
        color: 'text.headings',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        textAlign: 'left',
      },

      '& .dashboard-system-card-item-value': {
        flex: '0 0 auto',
        color: 'text.body',
      },

      '& .MuiButton-endIcon': {
        color: 'icon.action',

        '& > svg': {
          width: `${theme.scale[400]}px`,
          height: `${theme.scale[400]}px`,
          strokeWidth: 3,
        },
      },
    },
  },
})
