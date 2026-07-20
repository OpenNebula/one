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
      display: 'grid',
      flex: '0 0 auto',
      gap: '16px',
      alignItems: 'stretch',
      gridTemplateColumns: {
        xs: '1fr',
        lg: 'repeat(3, minmax(0, 1fr))',
      },
    },
  }

  const detailsContainer = {
    '& .detailsContainer': {
      display: 'flex',
      minWidth: 0,
      minHeight: 0,
    },
  }

  const permissionsOwnershipContainer = {
    '& .permissionsOwnershipContainer': {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      minWidth: 0,
      minHeight: 0,

      '& .table-scroll': {
        overflowX: 'hidden',
      },
    },
  }

  const capacityContainer = {
    '& .capacityContainer': {
      display: 'flex',
      minWidth: 0,
      minHeight: 0,
    },
  }

  const attributesContainer = {
    '& .attributesContainer': {
      display: 'flex',
      flex: '0 0 auto',
      width: '100%',
      minWidth: 0,
      minHeight: 0,
    },
  }

  const vmIpTags = {
    '& .vmIpTags': {
      '& .MuiButton-endIcon, & .MuiButton-endIcon svg': {
        width: '14px',
        height: '14px',
      },
    },
  }

  return {
    ...baseStyles,
    ...topContainer,
    ...detailsContainer,
    ...permissionsOwnershipContainer,
    ...capacityContainer,
    ...attributesContainer,
    ...vmIpTags,
  }
}
