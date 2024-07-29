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
const SINGLE_VARIABLE_REG =
  /^\s*(?<key>[\w\d_-]+)\s*=\s*(?<value>[^[\],]+?)(?:#.*)?$/gm
const ARRAY_VARIABLE_REG =
  /\s*(?<masterKey>[\w\d_-]+)\s*=\s*\[(?<pieces>.*?)\]/gm

const sanitizeKey = (key) => key?.trim().toLowerCase()

const sanitizeValue = (value) => value?.trim().replaceAll(/[\\"]/g, '')

/**
 * Parses OpenNebula resource template to json.
 *
 * @param {string} template - OpenNebula resource template
 * @returns {object} JSON of template
 */
const parseTemplateToObject = (template) => {
  const stringWithoutNewLines = JSON.stringify(template).replaceAll(/\\n/g, '')

  return {
    ...Array.from(template.matchAll(SINGLE_VARIABLE_REG)).reduce(
      (result, match) => {
        const key = sanitizeKey(match.groups.key)
        const value = sanitizeValue(match.groups.value)

        return { ...result, [key]: value }
      },
      {}
    ),
    ...Array.from(stringWithoutNewLines.matchAll(ARRAY_VARIABLE_REG)).reduce(
      (result, match) => {
        const masterKey = sanitizeKey(match.groups.masterKey)
        const pieces = match.groups.pieces.split(',')

        const vars = pieces.reduce((vrs, piece) => {
          const [key, value] = piece.split('=')

          return { ...vrs, [sanitizeKey(key)]: sanitizeValue(value) }
        }, {})

        return {
          ...result,
          [masterKey]: [...(result[masterKey] ?? []), vars],
        }
      },
      {}
    ),
  }
}

export default parseTemplateToObject
