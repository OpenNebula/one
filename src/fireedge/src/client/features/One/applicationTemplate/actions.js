import { createAction } from 'client/features/One/utils'
import { applicationTemplateService } from 'client/features/One/applicationTemplate/services'

export const getApplicationTemplate = createAction(
  'application-template',
  applicationTemplateService.getApplicationTemplate
)

export const getApplicationsTemplates = createAction(
  'application-template/pool',
  applicationTemplateService.getApplicationsTemplates,
  response => ({ applicationsTemplates: response })
)

export const createApplicationTemplate = createAction(
  'application-template/create',
  applicationTemplateService.createApplicationTemplate
)

export const updateApplicationTemplate = createAction(
  'application-template/update',
  applicationTemplateService.updateApplicationTemplate
)

export const instantiateApplicationTemplate = createAction(
  'application-template/instantiate',
  applicationTemplateService.instantiateApplicationTemplate
)
