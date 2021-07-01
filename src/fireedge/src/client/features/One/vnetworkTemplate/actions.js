import { createAction } from 'client/features/One/utils'
import { vNetworkTemplateService } from 'client/features/One/vnetworkTemplate/services'
import { RESOURCES } from 'client/features/One/slice'

export const getVNetworkTemplate = createAction(
  'vnet-template',
  vNetworkTemplateService.getVNetworkTemplate
)

export const getVNetworkTemplates = createAction(
  'vnet-template/pool',
  vNetworkTemplateService.getVNetworkTemplates,
  response => ({ [RESOURCES.vntemplate]: response })
)
