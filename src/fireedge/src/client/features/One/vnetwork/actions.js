import { createAction } from 'client/features/One/utils'
import { vNetworkService } from 'client/features/One/vnetwork/services'

export const getVNetwork = createAction('vnet', vNetworkService.getVNetwork)

export const getVNetworks = createAction(
  'vnet/pool',
  vNetworkService.getVNetworks,
  response => ({ vNetworks: response })
)
