export const isValidProviderTemplate = ({ name, provider, plain = {}, connection }) => {
  const { provision_type: provisionType, location_key: locationKey } = plain

  const keys = typeof locationKey === 'string' ? locationKey.split(',') : locationKey

  const hasConnection = connection !== undefined

  const locationKeyConnectionNotExists =
    !hasConnection || keys.some(key => connection?.[key] === undefined)

  return (
    !(locationKey && locationKeyConnectionNotExists) ||
    [name, provisionType, provider].includes(undefined)
  )
}

export const getLocationKeys = ({ location_key: locationKey }) =>
  typeof locationKey === 'string' ? locationKey.split(',') : locationKey

export const getConnectionFixed = ({ connection = {}, ...template }) => {
  const keys = getLocationKeys(template?.plain)

  return Object.entries(connection).reduce((res, [name, value]) => ({
    ...res,
    ...keys.includes(name) && { [name]: value }
  }), {})
}

export const getConnectionEditable = ({ connection = {}, ...template }) => {
  const keys = getLocationKeys(template?.plain)

  return Object.entries(connection).reduce((res, [name, value]) => ({
    ...res,
    ...!keys.includes(name) && { [name]: value }
  }), {})
}
