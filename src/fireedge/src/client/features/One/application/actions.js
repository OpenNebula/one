import { createAction } from 'client/features/One/utils'
import { applicationService } from 'client/features/One/application/services'
import { RESOURCES } from 'client/features/One/slice'

export const getApplication = createAction('cluster', applicationService.getApplication)

export const getApplications = createAction(
  'application/pool',
  applicationService.getApplications,
  response => ({ [RESOURCES.document[100]]: response })
)
