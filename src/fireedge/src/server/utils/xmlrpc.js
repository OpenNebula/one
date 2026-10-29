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
 * Cast an XML-RPC parameter using the type of its command default.
 * Keeps the conversions used by upcast without its legacy module loader.
 *
 * @param {any} value - Supplied parameter.
 * @param {any} defaultValue - Command parameter default.
 * @returns {any} Converted parameter.
 */
const castParameter = (value, defaultValue) => {
  if (Array.isArray(defaultValue)) {
    if (Array.isArray(value)) return value
    if (value == null) return []
    if (typeof value === 'string') {
      return value === 'true' || value === 'false'
        ? [value === 'true']
        : value.split('')
    }

    return [value]
  }

  switch (typeof defaultValue) {
    case 'number': {
      if (Array.isArray(value))
        return castParameter(value.join(''), defaultValue)
      if (value === undefined) return 0
      if (typeof value === 'string') {
        if (value === 'true' || value === 'false')
          return Number(value === 'true')
        const number = Number(value)

        return Number.isNaN(number) ? 0 : number
      }

      return Number(value)
    }
    case 'boolean':
      if (Array.isArray(value)) return value.length > 0

      return value === 'false' ? false : Boolean(value)
    case 'string':
      if (Array.isArray(value)) return value.join('')

      return value == null ? '' : String(value)
    default:
      return value
  }
}

/**
 * Get commands for command.
 *
 * @param {object} config - config for get params for command
 * @param {object} config.params - params command
 * @param {object} config.serverDataSource - server data source
 * @returns {any[]} - params for command
 */
const getCommandParams = (config) => {
  const { params, serverDataSource } = config
  if (!(params && serverDataSource)) {
    return
  }

  return Object.entries(params).map(([key, value]) => {
    if (!(key && value && value.from && typeof value.default !== 'undefined')) {
      return ''
    }
    // `value == null` checks against undefined and null
    if (
      serverDataSource[value.from] &&
      serverDataSource[value.from][key] != null
    ) {
      const convertedData = castParameter(
        serverDataSource[value.from][key],
        value.default
      )

      return value.arrayDefault !== undefined && Array.isArray(convertedData)
        ? convertedData.map((internalValue) =>
            castParameter(internalValue, value.arrayDefault)
          )
        : convertedData
    } else {
      return value.default
    }
  })
}

module.exports = { getCommandParams }
