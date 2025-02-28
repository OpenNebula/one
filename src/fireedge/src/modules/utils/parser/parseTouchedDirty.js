/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
 * @param {object} touchedFields - RHF touched fields object.
 * @param {object} dirtyFields - RHF dirty fields object.
 * @returns {object} - Touched dirty object.
 */
const parseTouchedDirty = (touchedFields, dirtyFields) => {
  const mergeRecursively = (touched, dirty) =>
    Object.keys(dirty).reduce((acc, key) => {
      if (touched?.[key]) {
        if (
          typeof dirty[key] === 'object' &&
          dirty[key] !== null &&
          typeof touched[key] === 'object' &&
          touched[key] !== null
        ) {
          acc[key] = mergeRecursively(touched[key], dirty[key])
        } else {
          acc[key] = dirty[key]
        }
      }

      return acc
    }, {})

  return mergeRecursively(touchedFields, dirtyFields)
}

export default parseTouchedDirty
