import { createAction } from 'client/features/One/utils'
import { vRouterService } from 'client/features/One/vrouter/services'
import { RESOURCES } from 'client/features/One/slice'

export const getVRouter = createAction(
  'vrouter/detail',
  vRouterService.getVRouter
)

export const getVRouters = createAction(
  'vrouter/pool',
  vRouterService.getVRouters,
  response => ({ [RESOURCES.vrouter]: response })
)
