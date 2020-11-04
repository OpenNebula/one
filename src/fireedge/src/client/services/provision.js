export const getProvidersTemplates = () => Promise.resolve([])

export const getProvider = () => Promise.resolve({})

export const getProviders = () => Promise.resolve([])
  .then(res => [res?.data?.DOCUMENT_POOL?.DOCUMENT ?? []].flat())

export const createProvider = ({ data = {} }) =>
  Promise.resolve().then(res => res?.data?.DOCUMENT ?? {})

export default {
  getProvidersTemplates,

  getProvider,
  getProviders,
  createProvider
}
