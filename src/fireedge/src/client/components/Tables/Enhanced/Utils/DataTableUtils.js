/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
 * Sorter data.
 *
 * @param {Array | any} value - data to order.
 * @returns {Array|any} data sorted.
 */
export const sortStateTables = (value) => {
  if (!Array.isArray(value)) return value

  return value.sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
}

/**
 * Check if the arrays are equals.
 *
 * @param {Array} array1 - array 1.
 * @param {Array} array2 - array 2.
 * @returns {boolean} areEquals.
 */
export const areArraysEqual = (array1 = [], array2 = []) => {
  if (array1.length !== array2.length) {
    return false
  }

  return array1.every((element, index) => element === array2[index])
}
