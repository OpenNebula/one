import DOMPurify from 'dompurify'

export const fakeDelay = ms => new Promise(resolve => setTimeout(resolve, ms))

export const isExternalURL = url => RegExp(/^(http|https):/g).test(url)

export function sanitize (strings, ...values) {
  const dirty = strings.reduce((prev, next, i) =>
    `${prev}${next}${values[i] || ''}`, '')

  return DOMPurify.sanitize(dirty)
}

/**
 * Converts a long string of units into a readable format e.g KB, MB, GB, TB, YB
 *
 * @param {Int} value The quantity of units.
 * @param {String} unit The unit of value.
 * @param {Int} fractionDigits — Number of digits after the decimal point. Must be in the range 0 - 20, inclusive
 */
export const prettyBytes = (value, unit = 'KB', fractionDigits = 0) => {
  const UNITS = ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  if (Math.abs(value) === 0) return `${value} ${UNITS[0]}`

  let idxUnit = UNITS.indexOf(unit)

  while (value > 1024) {
    value /= 1024
    idxUnit += 1
  }

  return `${value.toFixed(fractionDigits)} ${UNITS[idxUnit]}`
}

export const addOpacityToColor = (color, opacity) => {
  const opacityHex = Math.round(opacity * 255).toString(16)
  return `${color}${opacityHex}`
}

export const capitalize = ([firstLetter, ...restOfWord]) =>
  firstLetter.toUpperCase() + restOfWord.join('')

export const getValidationFromFields = fields =>
  fields.reduce(
    (schema, field) => ({
      ...schema,
      [field?.name]: field?.validation
    }),
    {}
  )

export const filterBy = (arr, predicate) => {
  const callback =
    typeof predicate === 'function' ? predicate : output => output[predicate]

  return [
    ...arr
      .reduce((map, item) => {
        const key = item === null || item === undefined ? item : callback(item)

        map.has(key) || map.set(key, item)

        return map
      }, new Map())
      .values()
  ]
}

export const get = (obj, path, defaultValue = undefined) => {
  const travel = regexp =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj)

  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/)
  return result === undefined || result === obj ? defaultValue : result
}

export const set = (obj, path, value) => {
  if (Object(obj) !== obj) return obj // When obj is not an object

  // If not yet an array, get the keys from the string-path
  if (!Array.isArray(path)) path = path.toString().match(/[^.[\]]+/g) || []

  const result = path.slice(0, -1).reduce((res, key, idx) => {
    if (Object(res[key]) === res[key]) return res[key]

    // If the next key is array-index,
    // then assign a new array object or new object
    res[key] = Math.abs(path[idx + 1]) >> 0 === +path[idx + 1] ? [] : {}

    return res[key]
  }, obj)

  // Assign the value to the last key
  result[path[path.length - 1]] = value

  return result
}

export const groupBy = (array, key) =>
  array.reduce((objectsByKeyValue, obj) => {
    const keyValue = get(obj, key)
    const newValue = (objectsByKeyValue[keyValue] || []).concat(obj)

    set(objectsByKeyValue, keyValue, newValue)

    return objectsByKeyValue
  }, {})

export const cloneObject = obj => JSON.parse(JSON.stringify(obj))
