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
      flex: '12 1 auto',
      gap: '16px',
    },
  }

  const permsInfoContainer = {
    '& .permsInfoContainer': {
      display: 'flex',
      gap: '16px',
    },
  }

  const detailsContainer = {
    '& .detailsContainer': {
      display: 'flex',
      flex: '1 1 0',
      gap: '16px',
      flexDirection: 'column',
    },
  }

  const permissionsOwnershipContainer = {
    '& .permissionsOwnershipContainer': {
      display: 'flex',
      flex: '1 1 0',
      gap: '16px',
      flexDirection: 'column',
    },
  }

  const capacityContainer = {
    '& .capacityContainer': {
      display: 'flex',
      flex: '2 1 0',
    },
  }

  const attributesContainer = {
    '& .attributesContainer': {
      display: 'flex',
      flex: '3 1 0',
      width: '100%',
    },
  }

  return {
    ...baseStyles,
    ...mainContainer,
    ...permsInfoContainer,
    ...detailsContainer,
    ...permissionsOwnershipContainer,
    ...capacityContainer,
    ...attributesContainer,
  }
}
