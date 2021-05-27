import { createAction } from 'client/features/One/utils'
import { provisionService } from 'client/features/One/provision/services'

export const getProvisionsTemplates = createAction(
  'provisions-template/pool',
  provisionService.getProvisionsTemplates,
  res => ({ provisionsTemplates: res })
)

export const createProvisionTemplate = createAction(
  'provisions-template/create',
  provisionService.createProvisionTemplate
)

export const getProvision = createAction('provision', provisionService.getProvision)

export const getProvisions = createAction(
  'provision/pool',
  provisionService.getProvisions,
  res => ({ provisions: res })
)

export const createProvision = createAction('provision/create', provisionService.createProvision)
export const configureProvision = createAction('provision/configure', provisionService.configureProvision)
export const deleteProvision = createAction('provision/delete', provisionService.deleteProvision)
export const getProvisionLog = createAction('provision/log', provisionService.getProvisionLog)

export const deleteDatastore = createAction('provision/datastore/delete', provisionService.deleteDatastore)
export const deleteVNetwork = createAction('provision/vnet/delete', provisionService.deleteVNetwork)
export const deleteHost = createAction('provision/host/delete', provisionService.deleteHost)
export const configureHost = createAction('provision/host/configure', provisionService.configureHost)
