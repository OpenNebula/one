import { createAction } from 'client/features/One/utils'
import { marketplaceService } from 'client/features/One/marketplace/services'
import { RESOURCES } from 'client/features/One/slice'

export const getMarketplace = createAction('marketplace', marketplaceService.getMarketplace)

export const getMarketplaces = createAction(
  'marketplace/pool',
  marketplaceService.getMarketplaces,
  response => ({ [RESOURCES.marketplace]: response })
)
