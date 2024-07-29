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
 * File to define functions that do something about units
 */

import { UNITS } from 'client/constants'

/**
 * Converts some MB, GB or TB to MB.
 *
 * @param {number} value - Numeric value
 * @param {string} unit - Type of unit (MB, GB or TB)
 * @returns {number} Value in MB
 */
export const convertToMB = (value, unit) => {
  switch (unit) {
    case UNITS.KB:
      return value * (1 / 1024)
    case UNITS.MB:
      return value
    case UNITS.GB:
      return value * 1024
    case UNITS.TB:
      return value * 1024 * 1024
    default:
      return value
  }
}
