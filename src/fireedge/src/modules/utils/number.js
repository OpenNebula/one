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
 * Check if value is in base64.
 *
 * @param {string} stringToValidate - String to check
 * @param {object} options - Options
 * @param {boolean} options.exact - Only match and exact string
 * @returns {boolean} Returns `true` if string is a base64
 */
export const isBase64 = (stringToValidate, options = {}) => {
  if (stringToValidate === '') return false

  const { exact = true } = options

  const BASE64_REG =
    /(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)/g
  const EXACT_BASE64_REG =
    /(?:^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$)/

  const regex = exact ? EXACT_BASE64_REG : BASE64_REG

  return regex.test(stringToValidate)
}

/**
 * Check if value is divisible by another number.
 *
 * @param {string|number} number - Value to check
 * @param {string|number} divisor - Divisor number
 * @returns {boolean} Returns `true` if value is divisible by another
 */
export const isDivisibleBy = (number, divisor) => !(number % divisor)

/**
 * Returns factors of a number.
 *
 * @param {number} value - Number
 * @returns {number[]} Returns list of numbers
 */
export const getFactorsOfNumber = (value) =>
  [...Array(+value + 1).keys()].filter((idx) => value % idx === 0)

/**
 * Finds the closest number in list.
 *
 * @param {number} value - The value to compare
 * @param {number} list - List of numbers
 * @returns {number} Closest number
 */
export const findClosestValue = (value, list) => {
  const closestValue = list.reduce((closest, current) => {
    if (closest === null) return current

    return Math.abs(current - value) < Math.abs(closest - value)
      ? current
      : closest
  }, null)

  return closestValue ?? value
}
