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
 * @returns {object} - Info tab SX style
 */
export const getStyles = ({ theme }) => {
  const toolbarHeight = '40px'
  const toolbarGap = `${theme.scale[400]}px`

  const baseStyles = {
    display: 'flex',
    flex: '1 1 0',
    flexDirection: 'column',
    minWidth: 0,
    minHeight: 0,
    gap: '16px',
    overflowX: 'hidden',
    overflowY: 'auto',
  }

  const rolesContainer = {
    '& .rolesContainer': {
      display: 'grid',
      flex: '1 1 auto',
      minWidth: 0,
      minHeight: 0,
      columnGap: '16px',
      rowGap: '16px',
      alignItems: 'stretch',
      gridTemplateColumns: {
        xs: '1fr',
        md: '1fr 3fr',
      },
    },
  }

  const roleList = {
    '& .roleList': {
      display: 'flex',
      flexDirection: 'column',
      flex: '1 1 0',
      minWidth: 0,
      minHeight: 0,

      '& .select-all-container': {
        display: 'flex',
        boxSizing: 'border-box',
        width: '100%',
        height: toolbarHeight,
        marginBottom: toolbarGap,
        padding: `${theme.scale[200]}px 0 ${theme.scale[200]}px ${theme.scale[400]}px`,
        alignItems: 'center',
        justifyContent: 'flex-start',
        alignSelf: 'stretch',
        overflow: 'hidden',
      },

      '& .select-all-container .checkbox-container': {
        minWidth: 0,
      },

      '& .select-all-container .checkbox-label': {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
    },
  }

  const vmsTable = {
    '& .schedActionsTable': {
      display: 'flex',
      flex: '1 1 0',
      minWidth: 0,
      minHeight: 0,
      flexDirection: 'column',

      '& .table-toolbar': {
        height: toolbarHeight,
        marginBottom: toolbarGap,
        alignItems: 'stretch',
      },

      '& .table-toolbar-search, & .table-toolbar-custom, & .menu-button-container':
        {
          height: '100%',
        },

      '& .table-toolbar .searchbar-slots': {
        margin: 0,
      },

      '& .table-toolbar-custom .MuiButton-root': {
        height: '100%',
        minHeight: 0,
        whiteSpace: 'nowrap',
      },
    },
  }

  return {
    ...baseStyles,
    ...rolesContainer,
    ...roleList,
    ...vmsTable,
  }
}
