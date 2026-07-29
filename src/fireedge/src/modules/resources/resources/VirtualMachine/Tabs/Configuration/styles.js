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
    minHeight: 0,
    gap: '8px',
    overflowY: 'auto',
  }
  const tableContainer = {
    '& .table-container': {
      display: 'flex',
      flexDirection: 'column',
      flex: '0 0 auto',
    },
  }
  const cardContainer = {
    '& .card-container': {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))',
      gap: `${theme.scale[200]}px`,
      alignItems: 'start',
    },
  }

  return {
    ...baseStyles,
    ...tableContainer,
    ...cardContainer,
  }
}
