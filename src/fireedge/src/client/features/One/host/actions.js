import { createAction } from 'client/features/One/utils'
import { hostService } from 'client/features/One/host/services'
import { RESOURCES } from 'client/features/One/slice'

export const getHost = createAction('host', hostService.getHost)

export const getHosts = createAction(
  'host/pool',
  hostService.getHosts,
  response => ({ [RESOURCES.host]: response })
)
