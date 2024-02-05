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

const NETWORK_TYPE = {
  template_id: 'create',
  id: 'existing',
  reserve_from: 'reserve',
}

/**
 * Parses a formatted network string back into an object.
 *
 * @param {string} networkString - The formatted network string to parse.
 * @returns {object | null} An object with properties describing the network, or null if the string is invalid.
 */
const formatNetworkString = (networkString) => {
  const parts = networkString?.split('|')
  const [netType, id, extra] = parts?.slice(-1)[0]?.split(':')

  const networkType = NETWORK_TYPE?.[netType]
  if (parts.length < 3 || !networkType) {
    return null
  }

  return {
    type: networkType,
    name: parts[0],
    description: parts[3],
    ...(id && { network: id }),
    ...(extra && { netextra: extra }),
  }
}

/**
 * Formats a network object into a string or reverses the operation based on the reverse flag.
 *
 * @param {object | string} network - The network object to format or the network string to parse.
 * @param {boolean} [reverse=false] - Reverse operation flag.
 * @returns {string | object | null} A formatted network string or an object representing the network, or null for invalid input in reverse mode.
 */
export const parseNetworkString = (network, reverse = false) => {
  if (reverse) {
    return formatNetworkString(typeof network === 'string' ? network : '')
  }

  const type = Object.keys(NETWORK_TYPE).find(
    (key) => NETWORK_TYPE[key] === network?.type?.toLowerCase()
  )

  const result = `M|network|${network?.description ?? ''}| |${type ?? ''}:${
    network?.network ?? ''
  }:${network?.netextra ?? ''}`

  return result
}

/**
 * Parses a formatted customInputs string back into an object.
 *
 * @param {string} customInputsString - The formatted customInputs string to parse.
 * @returns {object | null} An object with properties describing the customInputs, or null if the string is invalid.
 */
const formatCustomInputString = (customInputsString) => {
  const parts = customInputsString?.split('|')
  if (!parts || parts.length < 5) {
    return null
  }

  const [name, mandatory, type, description, rangeOrList, defaultValue] = parts

  let defaultvaluerangemin, defaultvaluerangemax, defaultvaluelist
  const isRange = ['range', 'range-float'].includes(type)
  const isList = ['list', 'list-multiple'].includes(type)

  if (isRange) {
    ;[defaultvaluerangemin, defaultvaluerangemax] = rangeOrList
      .split('..')
      .map(Number)
  } else if (isList) {
    defaultvaluelist = rangeOrList
  }

  return {
    name,
    mandatory: mandatory === 'M',
    type,
    description,
    ...(isRange && { defaultvaluerangemin, defaultvaluerangemax }),
    ...(isList && { defaultvaluelist }),
    defaultvalue: defaultValue,
  }
}

/**
 * @param {object|string} attribute - User input
 * @param {boolean} reverse - Reverse formatting?
 * @returns {object|string} - Depending on reverse flag
 */
export const parseCustomInputString = (attribute, reverse = false) => {
  if (reverse) {
    const res = formatCustomInputString(attribute)

    return res
  }

  const {
    mandatory,
    type,
    description,
    defaultvaluerangemin,
    defaultvaluerangemax,
    defaultvaluelist,
    defaultvalue,
  } = attribute

  const isList = ['list', 'list-multiple'].includes(type)
  const isRange = ['range', 'range-float'].includes(type)

  return `${mandatory !== 'NO' ? 'M' : '0'}|${type ?? ''}|${
    description ?? ''
  }|${
    (isRange
      ? `${defaultvaluerangemin}..${defaultvaluerangemax}`
      : isList
      ? `${defaultvaluelist}`
      : '') ?? ''
  }|${defaultvalue ?? ''}`
}
