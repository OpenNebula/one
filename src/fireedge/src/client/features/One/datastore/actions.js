import { createAction } from 'client/features/One/utils'
import { datastoreService } from 'client/features/One/datastore/services'

export const getDatastore = createAction('datastore', datastoreService.getDatastore)

export const getDatastores = createAction(
  'datastore/pool',
  datastoreService.getDatastores,
  response => ({ datastores: response })
)
