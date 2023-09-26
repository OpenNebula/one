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
import {
  J2xOptions,
  parse as ParserToJson,
  j2xParser as ParserToXml,
  X2jOptions,
} from 'fast-xml-parser'
import { DateTime, Settings } from 'luxon'

import {
  CURRENCY,
  Permission,
  T,
  USER_INPUT_TYPES,
  UserInputObject,
} from 'client/constants'
import { sentenceCase } from 'client/utils'

/**
 * @param {object} json - JSON
 * @param {J2xOptions} [options] - Options to parser
 * @param {boolean} [options.addRoot] - Add ROOT element as parent
 * @returns {string} Xml in string format
 */
export const jsonToXml = (json, { addRoot = true, ...options } = {}) => {
  const parser = new ParserToXml(options)

  return parser.parse(addRoot ? { ROOT: json } : json)
}

/**
 * @param {string} xml - XML in string format
 * @param {X2jOptions} [options] - Options to parser
 * @returns {object} JSON
 */
export const xmlToJson = (xml, options = {}) => {
  const { ROOT, ...jsonWithoutROOT } = ParserToJson(xml, {
    attributeNamePrefix: '',
    attrNodeName: '',
    ignoreAttributes: false,
    ignoreNameSpace: true,
    allowBooleanAttributes: false,
    parseNodeValue: false,
    parseAttributeValue: true,
    trimValues: true,
    ...options,
  })

  return ROOT ?? jsonWithoutROOT
}

/**
 * Converts the boolean value into a readable format.
 *
 * @param {boolean} bool - Boolean value.
 * @returns {'Yes'|'No'} - If true return 'Yes', in other cases, return 'No'.
 */
export const booleanToString = (bool) => (bool ? T.Yes : T.No)

/**
 * Converts the string value into a boolean.
 *
 * @param {string} str - String value.
 * @returns {boolean} - If str is "yes" or 1 then returns true,
 * in other cases, return false.
 */
export const stringToBoolean = (str) =>
  ['yes', 'true'].includes(String(str).toLowerCase()) || +str === 1

/**
 * Formats a number into a string according to the currency configuration.
 *
 * @param {number|bigint} number - Number to format
 * @param {Intl.NumberFormatOptions} options - Options to format the number
 * @returns {string} - Number in string format with the currency symbol
 */
export const formatNumberByCurrency = (number, options) => {
  try {
    return Intl.NumberFormat(Settings.defaultLocale, {
      style: 'currency',
      currency: CURRENCY,
      currencyDisplay: 'narrowSymbol',
      notation: 'compact',
      compactDisplay: 'long',
      maximumFractionDigits: 2,
      ...options,
    }).format(number)
  } catch {
    return number.toString()
  }
}

/**
 * Function to compare two values.
 *
 * @param {Intl.CollatorOptions} options - Options to compare the values
 * @returns {function(string, string)} - Function to compare two strings
 * Negative when the referenceStr occurs before compareString
 * Positive when the referenceStr occurs after compareString
 * Returns 0 if they are equivalent
 */
export const areStringEqual = (options) => (a, b) => {
  try {
    const collator = new Intl.Collator(Settings.defaultLocale, {
      sensitivity: 'base',
      ...options,
    })

    return collator.compare(a, b)
  } catch {
    return -1
  }
}

/**
 * Returns `true` if the given value is an instance of Date.
 *
 * @param {*} value - The value to check
 * @returns {boolean} true if the given value is a date
 * @example
 * const result = isDate(new Date()) //=> true
 * @example
 * const result = isDate(new Date(NaN)) //=> true
 * @example
 * const result = isDate('2014-02-31') //=> false
 * @example
 * const result = isDate({}) //=> false
 */
export const isDate = (value) =>
  value instanceof Date ||
  (typeof value === 'object' &&
    Object.prototype.toString.call(value) === '[object Date]')

/**
 * Converts the time values into "mm/dd/yyyy, hh:mm:ss" format.
 *
 * @param {number|string} time - Time to convert.
 * @returns {string} - Time string.
 * @example 02521251251 =>  "4/23/1981, 11:04:41 AM"
 */
export const timeToString = (time) =>
  +time ? new Date(+time * 1000).toLocaleString() : '-'

/**
 * Converts the given time into DateTime luxon type.
 *
 * @param {number|string} time - Time to convert
 * @returns {DateTime} - DateTime object.
 */
export const timeFromMilliseconds = (time) => DateTime.fromMillis(+time * 1000)

/**
 * Returns the epoch milliseconds of the date.
 *
 * @param {number|string} date - JS Date
 * @returns {number} - Total milliseconds.
 */
export const dateToMilliseconds = (date) =>
  Math.trunc(DateTime.fromJSDate(date).toMillis() / 1000)

/**
 * Returns the epoch milliseconds of the date.
 *
 * @param {number|string} date - Date on ISO format
 * @returns {number} - Total milliseconds.
 */
export const isoDateToMilliseconds = (date) =>
  Math.trunc(DateTime.fromISO(date).toMillis() / 1000)

/**
 * Get the diff from two times and it converts them
 * into string with format: ``dd hh mm ss``.
 *
 * @param {number|string} start - Time to convert
 * @param {number|string} end - Time to convert
 * @returns {string} - Duration time with format.
 */
export const timeDiff = (start, end) => {
  const startTime = timeFromMilliseconds(start)
  const endTime = timeFromMilliseconds(end)

  const diff = endTime.diff(startTime, ['days', 'hours', 'minutes', 'seconds'])

  const { days, hours, minutes, seconds } = diff.toObject()

  let total = ''
  days > 0 && (total = total.concat(`${days}d `))
  hours > 0 && (total = total.concat(`${hours}h`))
  minutes > 0 && (total = total.concat(`${minutes}m`))

  if (seconds > 0 || !total.length) {
    total = total.concat(`${seconds}s`)
  }

  return total
}

/**
 * Converts the lock level to its string value.
 *
 * @param {number} level - Level code number.
 * @returns {string} - Lock level text.
 */
export const levelLockToString = (level) =>
  ({
    0: T.None,
    1: T.Use,
    2: T.Manage,
    3: T.Admin,
    4: T.All,
  }[level] || '-')

/**
 * Returns the permission numeric code.
 *
 * @param {string[]} category - Array with Use, Manage and Access permissions.
 * @param {Permission} category.0 - `true` or `1` if use permission is allowed
 * @param {Permission} category.1 - `true` or `1` if manage permission is allowed
 * @param {Permission} category.2 - `true` or `1` if access permission is allowed
 * @returns {number} Permission code number.
 */
const getCategoryValue = ([u, m, a]) =>
  (stringToBoolean(u) ? 4 : 0) +
  (stringToBoolean(m) ? 2 : 0) +
  (stringToBoolean(a) ? 1 : 0)

/**
 * Transform the permission from OpenNebula template to octal format.
 *
 * @param {object} permissions - Permissions object.
 * @param {Permission} permissions.OWNER_U - Owner use
 * @param {Permission} permissions.OWNER_M - Owner manage
 * @param {Permission} permissions.OWNER_A - Owner access
 * @param {Permission} permissions.GROUP_U - Group use
 * @param {Permission} permissions.GROUP_M - Group manage
 * @param {Permission} permissions.GROUP_A - Group access
 * @param {Permission} permissions.OTHER_U - Other use
 * @param {Permission} permissions.OTHER_M - Other manage
 * @param {Permission} permissions.OTHER_A - Other access
 * @returns {string} - Permissions in octal format.
 */
export const permissionsToOctal = (permissions) => {
  const {
    OWNER_U,
    OWNER_M,
    OWNER_A,
    GROUP_U,
    GROUP_M,
    GROUP_A,
    OTHER_U,
    OTHER_M,
    OTHER_A,
  } = permissions

  return [
    [OWNER_U, OWNER_M, OWNER_A],
    [GROUP_U, GROUP_M, GROUP_A],
    [OTHER_U, OTHER_M, OTHER_A],
  ]
    .map(getCategoryValue)
    .join('')
}

/**
 * Returns the resource available actions.
 *
 * @param {object} actions - Actions from view yaml
 * @param {string} [hypervisor] - Resource hypervisor
 * @returns {string[]} - List of actions available for the resource
 */
export const getActionsAvailable = (actions = {}, hypervisor = '') =>
  Object.entries(actions)
    .filter(([_, action]) => {
      if (typeof action === 'boolean') return action

      const {
        enabled = false,
        not_on: notOn = [],
        only_on: onlyOn = [],
      } = action || {}

      return (
        !!enabled &&
        ((!notOn && !onlyOn) ||
          (notOn && !notOn?.includes?.(hypervisor)) ||
          onlyOn?.includes?.(hypervisor))
      )
    })
    .map(([actionName, _]) => actionName)

/**
 * Returns the resource info tabs.
 *
 * @param {object} infoTabs - Info tabs from view yaml
 * @param {Function} getTabComponent - Function to get tab component
 * @param {string} id - Resource id
 * @param {object} oneConfig - OpenNEbula configuration
 * @param {boolean} adminGroup - If the user is admin
 * @returns {{
 * id: string,
 * name: string,
 * renderContent: Function
 * }[]} - List of available info tabs for the resource
 */
export const getAvailableInfoTabs = (
  infoTabs = {},
  getTabComponent,
  id,
  oneConfig,
  adminGroup
) =>
  Object.entries(infoTabs)
    ?.filter(([_, { enabled } = {}]) => !!enabled)
    ?.map(([tabName, tabProps]) => {
      const TabContent = getTabComponent?.(tabName)

      return (
        TabContent && {
          label: TabContent?.label ?? sentenceCase(tabName),
          id: tabName,
          renderContent: () => (
            <TabContent
              tabProps={tabProps}
              id={id}
              oneConfig={oneConfig}
              adminGroup={adminGroup}
            />
          ),
        }
      )
    })
    ?.filter(Boolean)

/**
 *
 * @param {object} list - List of attributes
 * @param {object} options - Filter options
 * @param {object} [options.extra] - List of extra RegExp to filter
 * @param {RegExp} [options.hidden] - RegExp of hidden attributes
 * @returns {{attributes: object}} List of filtered attributes
 */
export const filterAttributes = (list = {}, options = {}) => {
  const { extra = {}, hidden = /^$/ } = options
  const response = {}

  const addAttributeToList = (listName, [attributeName, attributeValue]) => {
    response[listName] = {
      ...response[listName],
      [attributeName]: attributeValue,
    }
  }

  Object.entries(list)
    .filter((attribute) => {
      const [filterName] =
        Object.entries(extra).find(([_, regexp]) =>
          attribute[0].match(regexp)
        ) ?? []

      return filterName ? addAttributeToList(filterName, attribute) : true
    })
    .forEach((attribute) => {
      !attribute[0].match(hidden) && addAttributeToList('attributes', attribute)
    })

  return response
}

// ----------------------------------------------------------
// User inputs
// ----------------------------------------------------------

const PARAMS_SEPARATOR = '|'
const RANGE_SEPARATOR = '..'
const LIST_SEPARATOR = ','
const OPTIONS_DEFAULT = ' '
const MANDATORY = 'M'
const OPTIONAL = 'O'

/**
 * Get object attributes from user input as string.
 *
 * @param {string} userInputString - User input as string with format:
 * mandatory | type | description | options | defaultValue
 * @returns {UserInputObject} User input object
 */
export const getUserInputParams = (userInputString) => {
  if (!userInputString) return {}

  const params = String(userInputString).split(PARAMS_SEPARATOR)

  const options = [
    USER_INPUT_TYPES.range,
    USER_INPUT_TYPES.rangeFloat,
  ].includes(params[1])
    ? params[3]?.split(RANGE_SEPARATOR)
    : params[3]?.split(LIST_SEPARATOR)

  return {
    mandatory: params[0] === MANDATORY,
    type: params[1],
    description: params[2],
    options: options,
    default: params?.[4],
    min: options?.[0],
    max: options?.[1],
  }
}

/**
 * @param {UserInputObject} userInput - User input object
 * @returns {string} User input in string format
 */
export const getUserInputString = (userInput) => {
  const {
    mandatory,
    mandatoryString = mandatory ? MANDATORY : OPTIONAL,
    type,
    description,
    min,
    max,
    range = [min, max].filter(Boolean).join(RANGE_SEPARATOR),
    options,
    default: defaultValue,
  } = userInput

  // mandatory|type|description|range/options/' '|defaultValue
  const uiString = [mandatoryString, type, description]

  ;[USER_INPUT_TYPES.range, USER_INPUT_TYPES.rangeFloat].includes(type)
    ? uiString.push(range)
    : options?.length > 0
    ? uiString.push(options.join(LIST_SEPARATOR))
    : uiString.push(OPTIONS_DEFAULT)

  return uiString.concat(defaultValue).join(PARAMS_SEPARATOR)
}

/**
 * Get list of user inputs defined in OpenNebula template.
 *
 * @param {object} userInputs - List of user inputs in string format
 * @param {object} [options] - Options to filter user inputs
 * @param {boolean} [options.filterCapacityInputs]
 * - If false, will not filter capacity inputs: MEMORY, CPU, VCPU. By default `true`
 * @param {string} [options.order] - List separated by comma of input names
 * @example
 * const userInputs = {
 *   "INPUT-1": "O|text|Description1| |text1",
 *   "INPUT-2": "M|text|Description2| |text2"
 * }
 *
 * const order = "INPUT-2,INPUT-1"
 *
 * => userInputsToArray(userInputs, { order }) => [{
 *   name: 'INPUT-1',
 *   mandatory: false,
 *   type: 'text',
 *   description: 'Description1',
 *   default: 'text1',
 * },
 * {
 *   name: 'INPUT-2',
 *   mandatory: true,
 *   type: 'text',
 *   description: 'Description2',
 *   default: 'text2',
 * }]
 * @returns {UserInputObject[]} User input object
 */
export const userInputsToArray = (
  userInputs = {},
  { filterCapacityInputs = true, order } = {}
) => {
  const orderedList = order?.split(',') ?? []
  const userInputsArray = Object.entries(userInputs)

  let list = userInputsArray.map(([name, ui]) => ({
    name: `${name}`.toUpperCase(),
    ...(typeof ui === 'string' ? getUserInputParams(ui) : ui),
  }))

  if (filterCapacityInputs) {
    const capacityInputs = ['MEMORY', 'CPU', 'VCPU']
    list = list.filter((ui) => !capacityInputs.includes(ui.name))
  }

  if (orderedList.length) {
    list = list.sort((a, b) => {
      const upperAName = a.name?.toUpperCase?.()
      const upperBName = b.name?.toUpperCase?.()

      return orderedList.indexOf(upperAName) - orderedList.indexOf(upperBName)
    })
  }

  return list
}

/**
 * Get list of user inputs in format valid to forms.
 *
 * @param {UserInputObject[]} userInputs - List of user inputs in object format
 * @returns {object} User input object
 */
export const userInputsToObject = (userInputs) =>
  userInputs.reduce(
    (res, { name, ...userInput }) => ({
      ...res,
      [String(name).toUpperCase()]: getUserInputString(userInput),
    }),
    {}
  )

/**
 * Get list of unique labels from resource.
 *
 * @param {string} labels - List of labels separated by comma
 * @returns {string[]} List of unique labels
 */
export const getUniqueLabels = (labels) =>
  labels
    ?.split(',')
    ?.filter(
      (label, _, list) =>
        label !== '' && !list.some((element) => element.startsWith(`${label}/`))
    )
    ?.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, ignorePunctuation: true })
    ) ?? []

// The number 16,777,215 is the total possible combinations
// of RGB(255,255,255) which is 32 bit color
const SEED = 16_777_215
const FACTOR = 49979693

/**
 * Generate a random color from a string.
 *
 * @param {string} text - Text to generate a color from
 * @param {object} [options] - Options to generate color
 * @param {object} [options.caseSensitive] - If true, will not convert to lowercase
 * @returns {string} Hexadecimal color
 */
export const getColorFromString = (text, options = {}) => {
  const { caseSensitive = false } = options

  let ensuredText = String(text)
  !caseSensitive && (ensuredText = ensuredText.toLowerCase())

  const base = ensuredText.split('').reduce((total, char) => {
    const currentIndex = char.charCodeAt(0)
    const digit = currentIndex > 0 ? currentIndex : 0
    const range = parseInt(SEED / digit) * FACTOR

    return (total + currentIndex * range) % SEED
  }, 1)

  const hex = ((base * ensuredText.length) % SEED).toString(16)

  return `#${hex.padEnd(6, hex)}`
}

/**
 * @param {object} resource - OpenNebula resource
 * @returns {string} Error message from resource
 */
export const getErrorMessage = (resource) => {
  const { USER_TEMPLATE, TEMPLATE } = resource ?? {}
  const { ERROR, SCHED_MESSAGE } = USER_TEMPLATE ?? {}
  const { ERROR: templateError } = TEMPLATE ?? {}

  return [ERROR, SCHED_MESSAGE, templateError].filter(Boolean)[0]
}
