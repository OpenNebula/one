import { createAction } from 'client/features/One/utils'
import { vNetworkTemplateService } from 'client/features/One/vnetworkTemplate/services'
import { RESOURCES } from 'client/features/One/slice'

export const getVNetworkTemplate = createAction(
  'vnet-template',
  vNetworkTemplateService.getVNetworkTemplate
)

export const getVNetworksTemplates = createAction(
  'vnet-template/pool',
  vNetworkTemplateService.getVNetworksTemplates,
  response => ({ [RESOURCES.vntemplate]: response })
)
