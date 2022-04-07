/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { DateTime } from 'luxon'
import {
  parse as ParserToJson,
  X2jOptions,
  j2xParser as ParserToXml,
  J2xOptions,
} from 'fast-xml-parser'

import { T, UserInputObject, USER_INPUT_TYPES } from 'client/constants'
import { camelCase } from 'client/utils'

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
  String(str).toLowerCase() === 'yes' || +str === 1

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
 * @param {('YES'|'NO')} category.0 - `true` if use permission is allowed
 * @param {('YES'|'NO')} category.1 - `true` if manage permission is allowed
 * @param {('YES'|'NO')} category.2 - `true` if access permission is allowed
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
 * @param {('YES'|'NO')} permissions.OWNER_U - Owner use permission.
 * @param {('YES'|'NO')} permissions.OWNER_M - Owner manage permission.
 * @param {('YES'|'NO')} permissions.OWNER_A - Owner access permission.
 * @param {('YES'|'NO')} permissions.GROUP_U - Group use permission.
 * @param {('YES'|'NO')} permissions.GROUP_M - Group manage permission.
 * @param {('YES'|'NO')} permissions.GROUP_A - Group access permission.
 * @param {('YES'|'NO')} permissions.OTHER_U - Other use permission.
 * @param {('YES'|'NO')} permissions.OTHER_M - Other manage permission.
 * @param {('YES'|'NO')} permissions.OTHER_A - Other access permission.
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

      const { enabled = false, not_on: notOn = [] } = action || {}

      return !!enabled && !notOn?.includes?.(hypervisor)
    })
    .map(([actionName, _]) => actionName)

/**
 * Returns the resource info tabs.
 *
 * @param {object} infoTabs - Info tabs from view yaml
 * @param {Function} getTabComponent - Function to get tab component
 * @param {string} id - Resource id
 * @returns {{
 * id: string,
 * name: string,
 * renderContent: Function
 * }[]} - List of available info tabs for the resource
 */
export const getAvailableInfoTabs = (infoTabs = {}, getTabComponent, id) =>
  Object.entries(infoTabs)
    ?.filter(([_, { enabled } = {}]) => !!enabled)
    ?.map(([tabName, tabProps]) => {
      const camelName = camelCase(tabName)
      const TabContent = getTabComponent?.(camelName)

      return (
        TabContent && {
          name: camelName,
          id: tabName,
          renderContent: () => <TabContent tabProps={tabProps} id={id} />,
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
  const params = String(userInputString).split(PARAMS_SEPARATOR)

  const options = [
    USER_INPUT_TYPES.range,
    USER_INPUT_TYPES.rangeFloat,
  ].includes(params[1])
    ? params[3].split(RANGE_SEPARATOR)
    : params[3].split(LIST_SEPARATOR)

  return {
    mandatory: params[0] === MANDATORY,
    type: params[1],
    description: params[2],
    options: options,
    default: params[4],
    min: options[0],
    max: options[1],
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
