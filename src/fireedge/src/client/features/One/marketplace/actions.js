import { createAction } from 'client/features/One/utils'
import { marketplaceService } from 'client/features/One/marketplace/services'

export const getMarketplace = createAction('marketplace', marketplaceService.getMarketplace)

export const getMarketplaces = createAction(
  'marketplace/pool',
  marketplaceService.getMarketplaces,
  response => ({ marketplaces: response })
)
