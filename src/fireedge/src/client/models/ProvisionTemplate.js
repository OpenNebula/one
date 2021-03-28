export const isValidProvisionTemplate = ({
  defaults,
  hosts,
  name,
  provider,
  provision_type: provisionType
}) => {
  const providerName = defaults?.provision?.provider_name ?? hosts?.[0]?.provision.provider_name

  return !(
    providerName === undefined ||
    [name, provisionType, provider].includes(undefined)
  )
}
