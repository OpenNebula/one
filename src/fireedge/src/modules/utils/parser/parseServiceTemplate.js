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
/* eslint-disable jsdoc/require-jsdoc */

import _ from 'lodash'
import { USER_INPUT_TYPES } from '@ConstantsModule'

const UserInputArrayTypes = Object.values(USER_INPUT_TYPES)?.filter((val) =>
  ['list', 'array', 'range'].some((prefix) => val?.startsWith(prefix))
)

const formatDefaultValue = (def, type) =>
  UserInputArrayTypes?.includes(type)
    ? [...def?.split(',')]
    : type === USER_INPUT_TYPES.number
    ? parseInt(def, 10)
    : type === USER_INPUT_TYPES.numberFloat
    ? parseFloat(def)
    : def

export const toUserInputString = ({
  name,
  type,
  mandatory,
  description = '',
  options = '',
  // eslint-disable-next-line camelcase
  options_1 = '',
  default: def,
} = {}) => {
  const opts = Array.isArray(options)
    ? options?.join(',')
    : // eslint-disable-next-line camelcase
      [options, options_1]
        ?.filter((v) => v !== null && v !== undefined && v !== '')
        ?.join('..')

  return [
    name,
    `${mandatory ? 'M' : 'O'}|${type}|${description}|${opts}|${
      Array?.isArray(def) ? def?.join(',') : def
    }`,
  ]
}

export const fromUserInputString = (userInput) => {
  const [name, userInputString] = userInput

  const [mandatory, type, description, opts, def] = userInputString.split('|')

  // eslint-disable-next-line camelcase
  const [options, options_1] =
    opts?.length <= 0
      ? [undefined, undefined]
      : opts?.includes('..')
      ? opts.split('..')?.filter(Boolean)
      : [opts.split(','), [undefined]]

  const fmtDefault = formatDefaultValue(def, type)

  return {
    name,
    mandatory: mandatory === 'M',
    type,
    description,
    options,
    options_1,
    default: fmtDefault,
  }
}

export const toNetworkString = ({ name, description, type, value } = {}) => [
  name,
  `M|network|${description}||${type}:${value}`,
]

export const toNetworksValueString = (
  { name, size, type, value },
  { AR = [], SECURITY_GROUPS = [] } = {}
) => {
  if (!name) return

  let extra = []

  if (AR?.length) {
    const ARs = AR?.map(
      (ar) =>
        `AR=[${Object.entries(ar)
          .map(([key, valueAR]) => `${key}=${valueAR}`)
          .join(',')}]`
    )

    extra.push(ARs)
  }

  if (SECURITY_GROUPS?.length) {
    const SGs = `SECURITY_GROUPS="${SECURITY_GROUPS.map((sg) => sg?.ID).join(
      ','
    )}"`

    extra.push(SGs)
  }

  if (size) {
    const SIZE = `size=${size}`
    extra.push(SIZE)
  }

  extra = extra?.join(',')

  return {
    [name]: {
      [type]: value,
      extra,
    },
  }
}

export const fromNetworksValueString = (nv) => {
  const [valueString] = nv
  const { extra } = valueString

  let conf = []

  const SECURITY_GROUPS = extra
    ?.match(/SECURITY_GROUPS="([^"]+)"/)
    ?.pop()
    ?.split(',')
    ?.map((id) => ({ ID: id }))

  const AR = extra?.match(/AR=\[([^\]]+)\]/g)?.map((ar) =>
    Object.fromEntries(
      ar
        .replace(/^AR=\[|\]$/g, '')
        ?.split(',')
        ?.map((arg) => arg?.split('='))
    )
  )

  const SIZE = [
    extra?.match(/(?:^|,)(size=\d+)(?=,|$)/)?.[1]?.split('=')?.[1],
  ]?.filter(Boolean)

  if (SECURITY_GROUPS?.length) {
    conf?.push(['SECURITY_GROUPS', SECURITY_GROUPS])
  }

  if (AR?.length) {
    conf?.push(['AR', AR])
  }

  if (SIZE?.length) {
    conf?.push(['size', ...SIZE])
  }

  conf = Object.fromEntries(conf)

  return conf
}

export const fromNetworkString = (network) => {
  const [name, networkString] = network

  const [description, , tv] = networkString?.split('|').slice(2)
  const [type, value] = tv.split(':')

  return {
    name,
    description,
    type,
    value,
  }
}

/**
 * Recursively converts the keys of an object (and any nested objects) to either lower or upper case.
 * If the input is an array, it applies the conversion to each item in the array.
 *
 * @param {object | Array} obj - The object or array whose keys are to be converted.
 * @param {boolean} [toLower=true] - Whether to convert keys to lower case. If false, keys are converted to upper case.
 * @param {number} depth - Control depth of conversion
 * @returns {object | Array} - The input object or array with keys converted to the specified case.
 */
export const convertKeysToCase = (obj, toLower = true, depth = Infinity) => {
  if (depth < 1) return obj

  if (_.isArray(obj)) {
    return obj.map((item) => convertKeysToCase(item, toLower, depth))
  }

  if (_.isObject(obj) && !_.isDate(obj) && !_.isFunction(obj)) {
    const convertedObj = _.mapKeys(obj, (_value, key) =>
      toLower ? key.toLowerCase() : key.toUpperCase()
    )

    if (depth > 1) {
      return _.mapValues(convertedObj, (value) =>
        convertKeysToCase(value, toLower, depth - 1)
      )
    }

    return convertedObj
  }

  return obj
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
