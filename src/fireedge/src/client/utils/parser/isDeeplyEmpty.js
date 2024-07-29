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
 * @param {object} obj - Deeply nested object
 * @returns {boolean} - Empty
 */
const isDeeplyEmpty = (obj) => {
  if (obj == null || typeof obj !== 'object') return true

  return Object.entries(obj).every(([_key, value]) => {
    if (Array.isArray(value)) {
      return value.every(isDeeplyEmpty)
    } else if (value !== null && typeof value === 'object') {
      return isDeeplyEmpty(value)
    }

    return !value
  })
}

export default isDeeplyEmpty
