import { createAction } from 'client/features/One/utils'
import { marketAppService } from 'client/features/One/marketApp/services'

export const getMarketApp = createAction('app', marketAppService.getMarketApp)

export const getMarketApps = createAction(
  'app/pool',
  marketAppService.getMarketApps,
  response => ({ apps: response })
)
