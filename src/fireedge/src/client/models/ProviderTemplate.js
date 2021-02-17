export const isValidProviderTemplate = ({ name, provider, plain = {}, connection }) => {
  const { provision_type: provisionType, location_key: locationKey } = plain

  const locationKeyConnectionNotExists = connection[locationKey] === undefined

  return (
    !(locationKey && locationKeyConnectionNotExists) ||
    [name, provisionType, provider].includes(undefined)
  )
}
