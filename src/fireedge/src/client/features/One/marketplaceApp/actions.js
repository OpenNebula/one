import { createAction } from 'client/features/One/utils'
import { marketplaceAppService } from 'client/features/One/marketplaceApp/services'

export const getMarketplaceApp = createAction(
  'app',
  marketplaceAppService.getMarketplaceApp
)

export const getMarketplaceApps = createAction(
  'app/pool',
  marketplaceAppService.getMarketplaceApps,
  response => ({ apps: response })
)
