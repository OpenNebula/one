import { createAction } from 'client/features/One/utils'
import { vNetworkService } from 'client/features/One/vnetwork/services'
import { RESOURCES } from 'client/features/One/slice'

export const getVNetwork = createAction('vnet', vNetworkService.getVNetwork)

export const getVNetworks = createAction(
  'vnet/pool',
  vNetworkService.getVNetworks,
  response => ({ [RESOURCES.vn]: response })
)
