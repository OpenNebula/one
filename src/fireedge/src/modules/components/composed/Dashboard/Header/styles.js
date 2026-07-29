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
 * @returns {object} Dashboard header SX styles
 */
export const getStyles = ({ theme }) => ({
  display: 'flex',
  width: '100%',
  gap: `${theme.scale[400]}px`,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',

  '& .dashboard-header-information': {
    display: 'flex',
    gap: `${theme.scale[100]}px`,
    flexDirection: 'column',
  },

  '& .dashboard-header-controls': {
    display: 'flex',
    flex: '0 0 auto',
    alignItems: 'center',
    justifyContent: {
      xs: 'flex-start',
      md: 'flex-end',
    },
    flexWrap: 'wrap',
    gap: `${theme.scale[400]}px`,

    '& .dashboard-header-updated-text': {
      margin: 0,
      whiteSpace: 'nowrap',
    },

    '& .dashboard-header-refresh-icon': {
      width: `${theme.scale[500]}px`,
      height: `${theme.scale[500]}px`,
    },

    '& .dashboard-header-refresh-button.is-refreshing': {
      '& .dashboard-header-refresh-icon': {
        animation: 'dashboard-header-spin 800ms linear infinite',
      },
    },
  },

  '@keyframes dashboard-header-spin': {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
})
