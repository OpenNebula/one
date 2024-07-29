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
import { get } from 'lodash'
import { findKeyWithPath, extractTab } from 'client/utils'
import { TAB_FORM_MAP } from 'client/constants'

/**
 * @param {object} payload - Payload.
 * @param {string} fieldPath - Field path.
 * @returns {object} - Parsed payload.
 */
const parsePayload = (payload, fieldPath) => {
  const TAB = extractTab(fieldPath)

  if (payload === undefined || !fieldPath?.includes('extra')) {
    return payload // only parses the extra step
  }
  const relevantFields = TAB_FORM_MAP[TAB]

  if (!relevantFields) {
    return {}
  }

  return relevantFields.reduce((parsedPayload, key) => {
    const searchResult = findKeyWithPath({
      obj: payload,
      keyToFind: key,
    })

    if (searchResult.found) {
      const value = get(payload, searchResult.paths[0].join('.'), {})
      if (value !== undefined) {
        parsedPayload[key] = value
      }
    }

    return parsedPayload
  }, {})
}

export default parsePayload
