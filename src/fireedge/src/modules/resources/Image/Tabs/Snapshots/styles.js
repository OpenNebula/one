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
 * @returns {object} - Snapshots table SX style
 */
export const getTableStyles = ({ theme }) => ({
  mt: `${theme.scale[200]}px`,

  '& tbody td:last-of-type .text-ellipsis': {
    overflow: 'visible',
    whiteSpace: 'normal',
  },

  '& tbody td:last-of-type, & thead th:last-of-type': {
    textAlign: 'right',
  },
})

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @returns {object} - Snapshot actions SX style
 */
export const getActionsStyles = ({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: `${theme.scale[100]}px`,
  width: '100%',
})

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @returns {object} - Empty state SX style
 */
export const getEmptyStyles = ({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: `${theme.scale[200]}px`,
  padding: `${theme.scale[200]}px`,
  color: 'text.disabled',
})
