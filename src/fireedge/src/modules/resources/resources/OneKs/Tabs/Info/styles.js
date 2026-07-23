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
  const baseStyles = {
    display: 'flex',
    flex: '1 1 0',
    flexDirection: 'column',
    minWidth: 0,
    gap: '16px',
  }

  const mainContainer = {
    '& .mainContainer': {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      flex: '1 1 0',
      gap: '16px',
    },
  }

  const permsInfoContainer = {
    '& .permsInfoContainer': {
      display: 'flex',
      gap: '16px',
      alignItems: 'stretch',
    },
  }

  const detailsContainer = {
    '& .detailsContainer': {
      display: 'flex',
      flex: '1 1 0',
      flexDirection: 'column',
      gap: '16px',
      alignSelf: 'stretch',
      minWidth: 0,

      '& > *': {
        flex: '1 1 0',
        width: '100%',
        minHeight: 0,
      },
    },
  }

  const endpoint = {
    '& .oneks-endpoint': {
      minWidth: 0,
      maxWidth: '100%',

      '& .MuiButton-root': {
        minWidth: 0,
        maxWidth: '100%',
        userSelect: 'text',
        WebkitUserSelect: 'text',
      },

      '& .tag-title': {
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        userSelect: 'text',
        WebkitUserSelect: 'text',
      },
    },
  }

  const permissionsOwnershipContainer = {
    '& .permissionsOwnershipContainer': {
      display: 'flex',
      flex: '1 1 0',
      gap: '16px',
      flexDirection: 'column',
      alignSelf: 'stretch',
      minWidth: 0,

      '& > *': {
        width: '100%',
      },
    },
  }

  const controlPlaneContainer = {
    '& .controlPlaneContainer': {
      display: 'flex',
      flex: '1 1 0',
      width: '100%',
    },
  }

  return {
    ...baseStyles,
    ...mainContainer,
    ...permsInfoContainer,
    ...detailsContainer,
    ...endpoint,
    ...permissionsOwnershipContainer,
    ...controlPlaneContainer,
  }
}
