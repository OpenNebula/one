import { createAction } from 'client/features/One/utils'
import { providerService } from 'client/features/One/provider/services'
import { RESOURCES } from 'client/features/One/slice'

export const getProvider = createAction('provider', providerService.getProvider)

export const getProviders = createAction(
  'provider/pool',
  providerService.getProviders,
  res => ({ [RESOURCES.document[102]]: res })
)

export const getProviderConnection = createAction('provider', providerService.getProviderConnection)
export const createProvider = createAction('provider/create', providerService.createProvider)
export const updateProvider = createAction('provider/update', providerService.updateProvider)
export const deleteProvider = createAction('provider/delete', providerService.deleteProvider)
