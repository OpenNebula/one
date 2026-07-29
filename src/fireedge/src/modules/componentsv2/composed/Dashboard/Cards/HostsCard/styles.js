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
 * @returns {object} Dashboard hosts card SX styles
 */
export const getStyles = ({ theme }) => ({
  display: 'flex',
  width: '100%',
  minWidth: 0,
  flexDirection: 'column',

  '& .dashboard-hosts-card-row': {
    display: 'grid',
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    gridTemplateColumns: {
      xs: 'minmax(0, 1fr)',
      md: 'minmax(0, 1.1fr) repeat(2, minmax(0, 1fr))',
    },
    alignItems: 'center',
    justifyContent: 'stretch',
    columnGap: `${theme.scale[700]}px`,
    rowGap: `${theme.scale[500]}px`,
    padding: `${theme.scale[600]}px ${theme.scale[500]}px`,
    color: 'text.body',
    textAlign: 'left',
    border: 'none',
    borderRadius: 0,

    '&:hover': {
      border: 'none',
    },

    '&:not(:last-child)': {
      borderBottom: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    },

    '& .dashboard-hosts-card-information': {
      display: 'flex',
      minWidth: 0,
      flexDirection: 'column',
      gap: `${theme.scale[100]}px`,

      '& .dashboard-hosts-card-name-row': {
        display: 'flex',
        minWidth: 0,
        alignItems: 'center',
        gap: `${theme.scale[400]}px`,

        '& .dashboard-hosts-card-name': {
          minWidth: 0,
          overflow: 'hidden',
          color: 'text.headings',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },
      },

      '& .dashboard-hosts-card-metadata': {
        minWidth: 0,
        overflow: 'hidden',
        color: 'text.onDisabled',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
    },

    '& .dashboard-hosts-card-metric': {
      display: 'flex',
      minWidth: 0,
      flexDirection: 'column',
      gap: `${theme.scale[100]}px`,

      '& .dashboard-hosts-card-metric-label': {
        minWidth: 0,
        overflow: 'hidden',
        color: 'text.action',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
    },
  },
})
