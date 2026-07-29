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

export const DIALOG_SIZE_PROPS = {
  dialogWidth: { xs: 'calc(100vw - 32px)', md: '900px', lg: '1040px' },
  dialogMaxWidth: 'calc(100vw - 32px)',
  dialogMaxHeight: 'calc(100vh - 64px)',
  dialogPaperOverflow: 'visible',
  dialogContentMaxHeight: '50vh',
  dialogContentOverflowY: 'auto',
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme
 * @returns {object} Node Groups tab styles
 */
export const getStyles = ({ theme }) => {
  const toolbarHeight = '40px'
  const toolbarGap = `${theme.scale[400]}px`

  return {
    display: 'flex',
    flex: '1 1 0',
    flexDirection: 'column',
    minWidth: 0,
    minHeight: 0,
    gap: '16px',
    overflowX: 'hidden',
    overflowY: 'auto',

    '& .nodeGroupsContainer': {
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

    '& .nodeGroupList, & .nodeGroupVmsTable': {
      display: 'flex',
      flexDirection: 'column',
      flex: '1 1 0',
      minWidth: 0,
      minHeight: 0,
    },

    '& .nodeGroupVmsTable .table-toolbar': {
      height: toolbarHeight,
      marginBottom: toolbarGap,
      alignItems: 'stretch',
    },

    '& .nodeGroupVmsTable .table-toolbar-search, & .nodeGroupVmsTable .table-toolbar-custom, & .nodeGroupVmsTable .menu-button-container':
      {
        height: '100%',
      },

    '& .nodeGroupVmsTable .table-toolbar .searchbar-slots': {
      margin: 0,
    },

    '& .nodeGroupVmsTable .table-toolbar-custom': {
      display: 'flex',
      gap: `${theme.scale[200]}px`,
      flexWrap: 'wrap',
    },

    '& .nodeGroupVmsTable .table-toolbar-custom .MuiButton-root': {
      height: '100%',
      minHeight: 0,
      whiteSpace: 'nowrap',
    },
  }
}
