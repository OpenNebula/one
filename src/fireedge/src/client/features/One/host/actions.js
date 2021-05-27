import { createAction } from 'client/features/One/utils'
import { hostService } from 'client/features/One/host/services'

export const getHost = createAction('host', hostService.getHost)

export const getHosts = createAction(
  'host/pool',
  hostService.getHosts,
  response => ({ hosts: response })
)
