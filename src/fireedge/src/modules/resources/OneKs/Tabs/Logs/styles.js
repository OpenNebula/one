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
    flex: '1 1 auto',
    flexDirection: 'column',
    alignSelf: 'stretch',
    width: '100%',
    minHeight: 0,
    minWidth: 0,
    gap: '8px',
    overflow: 'hidden',
  }
  const logsContainer = {
    '& .logs-container': {
      display: 'flex',
      flexDirection: 'column',
      flex: '1 1 auto',
      width: '100%',
      minWidth: 0,
      minHeight: 0,
      gap: `${theme.scale[200]}px`,
      '& > *': {
        display: 'flex',
        flexDirection: 'column',
        flex: '1 1 auto',
        width: '100%',
        minWidth: 0,
        minHeight: 0,
      },
      '& [data-cy="logs-viewer"]': {
        flex: '1 1 0',
        width: '100%',
        minWidth: 0,
        minHeight: 0,
      },
    },
  }

  return {
    ...baseStyles,
    ...logsContainer,
  }
}
