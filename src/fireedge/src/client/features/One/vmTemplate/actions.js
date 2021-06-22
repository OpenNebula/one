import { createAction } from 'client/features/One/utils'
import { vmTemplateService } from 'client/features/One/vmTemplate/services'
import { RESOURCES } from 'client/features/One/slice'

export const getVmTemplate = createAction('vm-template', vmTemplateService.getVmTemplate)

export const getVmTemplates = createAction(
  'vm-template/pool',
  vmTemplateService.getVmTemplates,
  response => ({ [RESOURCES.template]: response })
)
