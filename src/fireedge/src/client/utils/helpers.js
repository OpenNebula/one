export const fakeDelay = ms => new Promise(resolve => setTimeout(resolve, ms))

export const getValidationFromFields = schema =>
  schema.reduce(
    (validation, field) => ({
      ...validation,
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
