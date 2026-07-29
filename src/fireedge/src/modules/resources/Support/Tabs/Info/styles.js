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
    flexDirection: 'column',
    gap: `${theme.scale[400]}px`,
    width: '100%',
    minWidth: 0,
    minHeight: 'fit-content',
    overflow: 'visible',
  }

  const topContainer = {
    '& .top-container': {
      display: 'grid',
      gap: `${theme.scale[400]}px`,
      alignItems: 'stretch',
      width: '100%',
      gridTemplateColumns: {
        xs: '1fr',
        lg: 'repeat(2, minmax(0, 1fr))',
      },

      '& > *': {
        minWidth: 0,
      },
    },
  }

  return {
    ...baseStyles,
    ...topContainer,
  }
}
