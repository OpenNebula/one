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
import {
  HYPERVISORS,
  UNITS,
  VN_DRIVERS,
  DOCS_BASE_PATH,
} from 'client/constants'
import _ from 'lodash'
import { isMergeableObject } from 'client/utils/merge'
import { Field } from 'client/utils/schema'
import DOMPurify from 'dompurify'
import { v4 as uuidv4 } from 'uuid'
import { BaseSchema, ObjectSchema, object, reach } from 'yup'

/**
 * Simulate a delay in a function.
 *
 * @param {number} ms - Delay in milliseconds
 * @returns {Promise} Promise resolved with a delay
 */
export const fakeDelay = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Determines if url is external.
 *
 * @param {string} url - URL
 * @returns {boolean} `true` if url is external
 */
export const isExternalURL = (url) => /^(http|https):/g.test(url)

/**
 * Generates a random key.
 *
 * @returns {string} Random key
 */
export const generateKey = () => uuidv4()

/**
 * Sanitizes HTML and prevents XSS attacks.
 *
 * @param {string[]} text - Text
 * @param {...string} values - Rest of text
 * @returns {string} Clean and secure string
 */
export function sanitize(text, ...values) {
  const dirty = text.reduce(
    (prev, next, i) => `${prev}${next}${values[i] || ''}`,
    ''
  )

  return DOMPurify.sanitize(dirty)
}

/**
 * Decodes an string in base 64.
 *
 * @param {string} string - Value to decode
 * @param {any} defaultValue - Default value if it fails
 * @returns {any} Decoded value from string in base 64
 */
export const decodeBase64 = (string, defaultValue = {}) => {
  try {
    return atob(string)
  } catch (e) {
    return defaultValue
  }
}

/**
 * Encode an string to base 64.
 *
 * @param {string} string - Value to encode
 * @param {any} defaultValue - Default value if it fails
 * @returns {string} Encoded value from string to base 64
 */
export const encodeBase64 = (string, defaultValue = '') => {
  try {
    return btoa(string)
  } catch (e) {
    return defaultValue
  }
}

/**
 * Generates a link to download the file, then remove it.
 *
 * @param {File} file - File
 */
export const downloadFile = (file) => {
  try {
    // Create a link and set the URL using `createObjectURL`
    const link = document.createElement('a')
    link.style.display = 'none'
    link.href = URL.createObjectURL(file)
    link.download = file.name

    // It needs to be added to the DOM so it can be clicked
    document.body.appendChild(link)
    link.click()

    // To make this work on Firefox we need to wait
    // a little while before removing it
    setTimeout(() => {
      URL.revokeObjectURL(link.href)
      link.parentNode.removeChild(link)
    }, 0)
  } catch (e) {}
}

/**
 * Converts a long string of units into a readable format e.g KB, MB, GB, TB, YB.
 *
 * @param {number|string} value - The quantity of units.
 * @param {'B'|'KB'|'MB'|'GB'|'TB'|'PB'|'EB'|'ZB'|'YB'} unit - The unit of value. Defaults in KB
 * @param {number} fractionDigits
 * - Number of digits after the decimal point. Must be in the range 0 - 20, inclusive
 * @param {boolean} json - return a json with data
 * @returns {string} Returns an string displaying sizes for humans.
 */
export const prettyBytes = (
  value,
  unit = UNITS.KB,
  fractionDigits = 0,
  json = false
) => {
  const units = Object.values(UNITS)
  let ensuredValue = +value

  if (Math.abs(ensuredValue) === 0)
    return json ? { value, units: unit } : `${value} ${units[0]}`

  let idxUnit = units.indexOf(unit)

  while (ensuredValue >= 1024) {
    ensuredValue /= 1024
    idxUnit += 1
  }

  const decimals = fractionDigits && ensuredValue % 1 !== 0 ? fractionDigits : 0

  return json
    ? { value: ensuredValue.toFixed(decimals), units: units[idxUnit] }
    : `${ensuredValue.toFixed(decimals)} ${units[idxUnit]}`
}

/**
 * Add opacity value to a HEX color.
 *
 * @param {string} color - HEX color
 * @param {number} opacity - Opacity range: 0 to 1
 * @returns {string} The color with opacity
 */
export const addOpacityToColor = (color, opacity) => {
  const opacityHex = Math.round(opacity * 255).toString(16)

  return `${color}${opacityHex}`
}

/**
 * Returns the validation by name from the form schema.
 *
 * @param {Array} fields - Field schemas
 * @returns {object} List of validations
 */
export const getValidationFromFields = (fields) =>
  fields.reduce(
    (schema, field) => ({
      ...schema,
      [field?.name]: field?.validation,
    }),
    {}
  )

/**
 * Returns fields in schema object.
 *
 * @param {{name: string, validation: BaseSchema}[]} fields - Fields
 * @returns {ObjectSchema} Object schema
 * @example
 * [{ name: 'VM.NAME', validation: string() }]
 *  => object({ 'VM': object({ NAME: string() }) })
 */
export const getObjectSchemaFromFields = (fields) =>
  fields.reduce((schema, field) => {
    const { name, validation } = field

    if (!name || !validation) return schema

    /**
     * @param {string} path - Path
     * @param {BaseSchema} child - Child
     * @returns {BaseSchema} Path schema with child concatenated
     */
    const getSchemaByPath = (path, child) => {
      try {
        return object({ [path]: reach(schema, path).concat(child) })
      } catch {
        return object({ [path]: child })
      }
    }

    const paths = name.split('.')
    const pathname = paths.pop()
    const fieldSchema = object({ [pathname]: validation })

    /**
     * @param {string} [path] - Path
     * @param {number} [idx] - Path index
     * @returns {BaseSchema} Field schema concatenated in path
     */
    const sumSchemas = (path = paths[0], idx = 0) => {
      // It isn't a object schema
      if (!path) return fieldSchema

      // Encapsule field schema in object
      const isLast = path === paths.at(-1)
      if (isLast) return getSchemaByPath(path, fieldSchema)

      // Needs to find the next schema in field path
      const nextIdx = idx + 1
      const nextPath = paths.at(nextIdx)

      return getSchemaByPath(path, sumSchemas(nextPath, nextIdx))
    }

    return schema.concat(sumSchemas())
  }, object())

/**
 * @param {Field[]} fields - Fields
 * @param {HYPERVISORS} hypervisor - Hypervisor
 * @returns {Field[]} Filtered fields
 */
export const filterFieldsByHypervisor = (
  fields,
  hypervisor = HYPERVISORS.kvm
) =>
  fields
    .map((field) => (typeof field === 'function' ? field(hypervisor) : field))
    .filter(
      ({ notOnHypervisors, onlyOnHypervisors } = {}) =>
        (!notOnHypervisors && !onlyOnHypervisors) ||
        (notOnHypervisors && !notOnHypervisors.includes?.(hypervisor)) ||
        onlyOnHypervisors?.includes?.(hypervisor)
    )

/**
 * @param {Field[]} fields - Fields
 * @param {VN_DRIVERS} driver - Driver
 * @returns {Field[]} Filtered fields
 */
export const filterFieldsByDriver = (fields, driver = false) =>
  fields
    .map((field) => (typeof field === 'function' ? field(driver) : field))
    .filter(
      ({ notOnDrivers } = {}) => !driver || !notOnDrivers?.includes?.(driver)
    )

/**
 * Filter an object list by property.
 *
 * @param {Array} arr - Object list
 * @param {string} predicate - Property
 * @returns {Array} List filtered by predicate
 */
export const filterBy = (arr, predicate) => {
  const callback =
    typeof predicate === 'function' ? predicate : (output) => output[predicate]

  return [
    ...arr
      .reduce((map, item) => {
        const key = item === null || item === undefined ? item : callback(item)

        map.has(key) || map.set(key, item)

        return map
      }, new Map())
      .values(),
  ]
}

/**
 * Get the value from an object by the path of property.
 *
 * @param {object} obj - Object
 * @param {string} path - Path of property
 * @param {*} [defaultValue] - Default value of property
 * @returns {*} Value of property
 */
export const get = (obj, path, defaultValue = undefined) => {
  const travel = (regexp) =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce(
        (res, key) => (res !== null && res !== undefined ? res[key] : res),
        obj
      )

  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/)

  return result === undefined || result === obj ? defaultValue : result
}

/**
 * Deletes a given key from an object.
 *
 * @param {string[]} attr - Array with the path to be deleted
 * @param {object} originalTemplate - Template to be modified
 */
export const deleteObjectKeys = (attr, originalTemplate = {}) => {
  const keyToDelete = attr.pop()
  let template = originalTemplate || {}
  // TODO: Consider the case when restricted attributes is inside an array and goes deeper
  attr.forEach((key) => {
    if (Array.isArray(template?.[key])) {
      template?.[key].forEach((element) => {
        element && delete element[keyToDelete]
      })
    } else {
      template = template[key]
    }
  })
  template && delete template[keyToDelete]
}

/**
 * Set a value of property in object by his path.
 *
 * @param {object} obj - Object
 * @param {string|string[]} path - Path of property
 * @param {*} value - New value of property
 * @returns {object} Object with the new property
 */
export const set = (obj, path, value) => {
  if (Object(obj) !== obj) return obj // When obj is not an object

  // If not yet an array, get the keys from the string-path
  const arrayPath = !Array.isArray(path)
    ? path.toString().match(/[^.[\]]+/g) || []
    : path

  const result = arrayPath.slice(0, -1).reduce((res, key, idx) => {
    if (Object(res[key]) === res[key]) return res[key]

    // If the next key is array-index,
    // then assign a new array object or new object
    res[key] =
      Math.abs(arrayPath[idx + 1]) >> 0 === +arrayPath[idx + 1] ? [] : {}

    return res[key]
  }, obj)

  // Assign the value to the last key
  result[arrayPath.at(-1)] = value

  return result
}

/**
 * Group a list of objects by a key.
 *
 * @param {object[]} list - List
 * @param {string} key - Property
 * @returns {object} Objects group by the property
 */
export const groupBy = (list, key) =>
  list?.reduce((objectsByKeyValue, obj) => {
    const keyValue = get(obj, key)
    const newValue = (objectsByKeyValue[keyValue] || []).concat(obj)

    set(objectsByKeyValue, keyValue, newValue)

    return objectsByKeyValue
  }, {}) ?? {}

/**
 * Clone an object.
 * If the object is null or undefined, returns an empty object.
 *
 * @param {object} obj - Object
 * @returns {object} Object cloned
 */
export const cloneObject = (obj) => {
  if (!obj) return {}

  return JSON.parse(JSON.stringify(obj))
}

/**
 * Removes undefined and null values from object.
 *
 * @param {object} obj - Object value
 * @returns {object} - Cleaned object
 */
export const cleanEmptyObject = (obj) => {
  const entries = Object.entries(obj)
    .filter(([_key, value]) =>
      // filter object/array values without attributes
      isMergeableObject(value)
        ? Object.values(value).some((v) => v != null)
        : Array.isArray(value)
        ? value.length > 0
        : true
    )
    .map(([key, value]) => {
      let cleanedValue = value

      if (isMergeableObject(value)) {
        cleanedValue = cleanEmptyObject(value)
      } else if (Array.isArray(value)) {
        cleanedValue = cleanEmptyArray(value)
      }

      return [key, cleanedValue]
    })

  return entries?.length > 0
    ? entries.reduce(
        (cleanedObject, [key, value]) =>
          // `value == null` checks against undefined and null
          value == null ? cleanedObject : { ...cleanedObject, [key]: value },
        {}
      )
    : undefined
}

/**
 * Removes undefined and null values from array.
 *
 * @param {Array} arr - Array value
 * @returns {object} - Cleaned object
 */
export const cleanEmptyArray = (arr) =>
  arr
    .map((value) => (isMergeableObject(value) ? cleanEmpty(value) : value))
    .filter(
      (value) =>
        !(value == null) || // `value == null` checks against undefined and null
        (Array.isArray(value) && value.length > 0)
    )

/**
 * Removes undefined and null values from variable.
 *
 * @param {Array|object} variable - Variable
 * @returns {Array|object} - Cleaned variable
 */
export const cleanEmpty = (variable) =>
  Array.isArray(variable)
    ? cleanEmptyArray(variable)
    : cleanEmptyObject(variable)

/**
 * Returns an array with the separator interspersed between elements of the given array.
 *
 * @param {any} arr - Array
 * @param {any} sep - Separator
 * @returns {number[]} Returns list of numbers
 * @example [1,2,3].intersperse(0) => [1,0,2,0,3]
 */
export const intersperse = (arr, sep) => {
  const ensuredArr = (Array.isArray(arr) ? arr : [arr]).filter(Boolean)

  if (ensuredArr.length === 0) return []

  return ensuredArr
    .slice(1)
    .reduce((xs, x, i) => xs.concat([sep, x]), [ensuredArr[0]])
}

/**
 * Returns the unknown properties of an object.
 *
 * @param {object} obj - Object
 * @param {string[]|object} knownAttributes - Attributes to check
 * @returns {object} Returns object with unknown properties
 */
export const getUnknownAttributes = (obj = {}, knownAttributes) => {
  const unknown = {}

  const entries = Object.entries(obj)

  const attributes = Array.isArray(knownAttributes)
    ? knownAttributes
    : Object.getOwnPropertyNames({ ...knownAttributes })

  for (const [key, value] of entries) {
    if (!attributes.includes(key) && value !== undefined) {
      unknown[key] = obj[key]
    }
  }

  return unknown
}

/**
 * Extract the Ids for values selected in datatables.
 *
 * @param {any} arr - Data for Datatables.
 * @returns {string} Returns string with ids.
 */
export const extractIDValues = (arr = []) => {
  const dataArray = Array.isArray(arr) ? arr : [arr]
  const idValues = dataArray
    // eslint-disable-next-line no-prototype-builtins
    .filter((obj) => obj.hasOwnProperty('ID'))
    .map((obj) => obj.ID)

  return idValues.join(',')
}

/**
 * Generates a simple hash from a string.
 *
 * @param {string} str - The string to hash.
 * @returns {number} The hash value.
 */
export const simpleHash = (str) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }

  return hash
}

/**
 * Creates a string representation of an object, with a limited depth.
 *
 * @param {object} obj - The object to stringify.
 * @param {number} depth - The maximum depth to traverse.
 * @returns {string} The string representation of the object.
 */
export const deepStringify = (obj, depth = 3) => {
  if (depth === 0 || obj === null || typeof obj !== 'object') {
    return _.isEmpty(obj) ? 'EMPTYOBJECT' : _.toString(obj)
  }

  const objString = Object.entries(obj)
    .map(
      ([key, value]) =>
        `${key?.toString() ?? 'UNDEFINED'}:${
          Array.isArray(value)
            ? `[${value
                .map((item) => deepStringify(item, depth - 1))
                .join(',')}]`
            : typeof value === 'object'
            ? deepStringify(value, depth - 1)
            : _.toString(value) ?? 'UNDEFINED'
        }`
    )
    .join(',')

  return `{${objString}}`
}

/**
 * Generate a link to the Open Nebula documentation using the first two digits of the version (e.g., 6.99.0 => 6.99).
 *
 * @param {string} version - Version of ONE
 * @param {string} path - Path to documentation
 * @returns {string} - Link to doc
 */
export const generateDocLink = (version, path) => {
  // Split version
  const splitVersion = version?.split('.')

  // Version has to be something
  if (!splitVersion || splitVersion.length === 0) return

  // Create version with two first digits
  const versionDoc =
    splitVersion.length === 1
      ? splitVersion[0]
      : splitVersion[0] + '.' + splitVersion[1]

  // Return link
  return DOCS_BASE_PATH + '/' + versionDoc + '/' + path
}

/**
 * Extract TAB id from field path.
 *
 * @param {string} str - Field path
 * @returns {string} - Tab ID/NAME
 */
export const extractTab = (str) => {
  const parts = str?.split('.')

  return /^\d+$/.test(parts[parts.length - 1])
    ? parts[parts.length - 2]
    : parts.pop()
}

export const findKeyWithPath = (() => {
  const cache = new Map()

  /**
   * @param {object} root0 - Params
   * @param {object} root0.obj - Object to search
   * @param {string} root0.keyToFind - Key to find
   * @param {Array} root0.path - Path to key
   * @param {boolean} root0.findAll - Return first or all
   * @returns {object} - Found key(s) + path(s)
   */
  const search = ({ obj, keyToFind, path = [], findAll = false }) => {
    const cacheKey = JSON.stringify({ obj, keyToFind, path, findAll })
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)
    }

    if (typeof obj !== 'object' || obj === null) {
      return { found: false, paths: [] }
    }

    if (keyToFind in obj) {
      const newPath = [...path, keyToFind]
      const searchResult = { found: true, paths: [newPath] }
      if (!findAll) {
        cache.set(cacheKey, searchResult)

        return searchResult
      }

      return searchResult
    }

    let accumulatedResults = []

    const entries = Array.isArray(obj) ? obj.entries() : Object.entries(obj)
    for (const [key, value] of entries) {
      if (typeof value === 'object') {
        const nextPath = Array.isArray(obj)
          ? [...path, `[${key}]`]
          : [...path, key]
        const subSearchResult = search({
          obj: value,
          keyToFind,
          path: nextPath,
          findAll,
        })
        if (subSearchResult.found) {
          accumulatedResults = [...accumulatedResults, ...subSearchResult.paths]
          if (!findAll) {
            break
          }
        }
      }
    }

    const found = accumulatedResults.length > 0
    const finalResult = { found, paths: accumulatedResults }
    cache.set(cacheKey, finalResult)

    return finalResult
  }

  return search
})()
