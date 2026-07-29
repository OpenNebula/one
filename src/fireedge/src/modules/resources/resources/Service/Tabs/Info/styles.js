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
    minHeight: 0,
    gap: '16px',
    overflowX: 'hidden',
    overflowY: 'auto',
  }

  const topContainer = {
    '& .topContainer': {
      display: 'flex',
      flex: '0 0 auto',
      flexDirection: {
        xs: 'column',
        lg: 'row',
      },
      gap: '16px',
      alignItems: 'stretch',
      minWidth: 0,
    },
  }

  const detailsContainer = {
    '& .detailsContainer': {
      display: 'flex',
      flex: '1 1 0',
      minWidth: 0,
      minHeight: 0,

      '& > *': {
        width: '100%',
      },
    },
  }

  const permissionsOwnershipContainer = {
    '& .permissionsOwnershipContainer': {
      display: 'flex',
      flex: '1 1 0',
      flexDirection: 'column',
      gap: '16px',
      alignSelf: 'stretch',
      minWidth: 0,
      minHeight: 0,

      '& > *': {
        width: '100%',
      },
    },
  }

  return {
    ...baseStyles,
    ...topContainer,
    ...detailsContainer,
    ...permissionsOwnershipContainer,
  }
}
