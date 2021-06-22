import { createAction } from 'client/features/One/utils'
import { marketplaceAppService } from 'client/features/One/marketplaceApp/services'
import { RESOURCES } from 'client/features/One/slice'

export const getMarketplaceApp = createAction(
  'app',
  marketplaceAppService.getMarketplaceApp
)

export const getMarketplaceApps = createAction(
  'app/pool',
  marketplaceAppService.getMarketplaceApps,
  response => ({ [RESOURCES.app]: response })
)
