/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
 * @param {number} value - Value to validate
 * @param {Array} globalIds - Global ids array
 * @param {Function} callback - State update
 * @returns {boolean} - Is valid?
 */
export const validateResourceId = (value, globalIds, callback) => {
  const regex = /^\d+$/
  const isValid = regex.test(value) && !globalIds.includes(value)
  callback(isValid)

  return isValid
}

/**
 * @param {number} value - Value to validate
 * @returns {boolean} - Is valid?
 */
export const validateValue = (value) => value === 'Delete' || !isNaN(value)
