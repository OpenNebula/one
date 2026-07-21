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
export const getStyles = ({ theme }) => ({
  display: 'flex',
  flex: '1 1 0',
  flexDirection: 'column',
  minWidth: 0,
  minHeight: 0,
  gap: `${theme.scale[400]}px`,
  overflowX: 'hidden',
  overflowY: 'auto',

  '& .topContainer': {
    display: 'grid',
    flex: '0 0 auto',
    gap: `${theme.scale[400]}px`,
    alignItems: 'stretch',
    gridTemplateColumns: {
      xs: '1fr',
      lg: 'repeat(2, minmax(0, 1fr))',
    },
  },

  '& .detailsContainer': {
    display: 'flex',
    minWidth: 0,
    minHeight: 0,
  },

  '& .permissionsOwnershipContainer': {
    display: 'flex',
    flexDirection: 'column',
    gap: `${theme.scale[400]}px`,
    minWidth: 0,
    minHeight: 0,
  },

  '& .permissionsContainer, & .ownershipContainer': {
    display: 'flex',
    minWidth: 0,
    minHeight: 0,
  },

  '& .rulesContainer, & .attributesContainer': {
    display: 'flex',
    flex: '0 0 auto',
    width: '100%',
    minWidth: 0,
    minHeight: 0,

    '& > *': {
      width: '100%',
    },
  },
})
