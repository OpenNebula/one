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
