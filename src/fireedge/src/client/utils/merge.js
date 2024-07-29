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
 * @typedef {object} MergeOptions
 * @property {Function} arrayMerge - Function to merge two arrays
 * @property {boolean} clone - Clone the object
 */

/**
 * @param {object|Array} val - Value
 * @returns {boolean} Returns `true` if value isn't regex or date object
 */
export const isMergeableObject = (val) => {
  const nonNullObject = val && typeof val === 'object'

  return (
    nonNullObject &&
    Object.prototype.toString.call(val) !== '[object RegExp]' &&
    Object.prototype.toString.call(val) !== '[object Date]'
  )
}

/**
 * @param {object|Array} val - Value
 * @returns {object|Array} Empty value
 */
export const emptyTarget = (val) => (Array.isArray(val) ? [] : {})

/**
 * @param {Array} value - Value
 * @param {MergeOptions} options - Merge options
 * @returns {*} Returns the value as clone if required
 */
export const cloneIfNecessary = (value, options) =>
  options?.clone === true && isMergeableObject(value)
    ? deepmerge(emptyTarget(value), value, options)
    : value

/**
 * @param {Array} target - Target
 * @param {Array} source - Source
 * @param {MergeOptions} options - Merge options
 * @returns {Array} Two arrays merged
 */
export const defaultArrayMerge = (target, source, options) => {
  const destination = target.slice()
  source.forEach(function (e, i) {
    if (typeof destination[i] === 'undefined') {
      destination[i] = cloneIfNecessary(e, options)
    } else if (isMergeableObject(e)) {
      destination[i] = deepmerge(target[i], e, options)
    } else if (target.indexOf(e) === -1) {
      destination.push(cloneIfNecessary(e, options))
    }
  })

  return destination
}

/**
 * @param {object} target - Target
 * @param {object} source - Source
 * @param {MergeOptions} options - Merge options
 * @returns {object} Two object merged
 */
export const mergeObject = (target, source, options) => {
  const destination = {}
  if (isMergeableObject(target)) {
    Object.keys(target).forEach(function (key) {
      destination[key] = cloneIfNecessary(target[key], options)
    })
  }
  Object.keys(source).forEach(function (key) {
    if (!isMergeableObject(source[key]) || !target[key]) {
      destination[key] = cloneIfNecessary(source[key], options)
    } else {
      destination[key] = deepmerge(target[key], source[key], options)
    }
  })

  return destination
}

/**
 * Merges the enumerable properties of two or more objects deeply.
 *
 * @param {object} target - Target
 * @param {object} source - Source
 * @param {MergeOptions} options - Merge options
 * @returns {object} Two object merged
 */
export const deepmerge = (target, source, options = {}) => {
  const array = Array.isArray(source)
  const { arrayMerge = defaultArrayMerge } = options

  if (array) {
    return Array.isArray(target)
      ? arrayMerge(target, source, options)
      : cloneIfNecessary(source, options)
  } else {
    return mergeObject(target, source, options)
  }
}

deepmerge.all = function deepmergeAll(array, options) {
  if (!Array.isArray(array) || array.length < 2) {
    throw new Error(
      'first argument should be an array with at least two elements'
    )
  }

  // we are sure there are at least 2 values, so it is safe to have no initial value
  return array.reduce(function (prev, next) {
    return deepmerge(prev, next, options)
  })
}
